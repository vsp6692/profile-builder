#!/usr/bin/env python3
"""Create the standalone A4 documents; never render or alter the website UI."""

from __future__ import annotations

import argparse
import json
import shutil
from datetime import datetime, timezone
from pathlib import Path
from xml.sax.saxutils import escape

import reportlab
from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    BaseDocTemplate,
    Flowable,
    Frame,
    PageBreak,
    PageTemplate,
    Paragraph as BaseParagraph,
    Spacer,
)
from pypdf import PdfReader, PdfWriter

ROOT = Path(__file__).resolve().parents[1]
W, H = A4
INK = colors.HexColor("#24354b")
BLUE = colors.HexColor("#315d87")
RED = colors.HexColor("#ad443b")
MUTED = colors.HexColor("#526173")
LINE = colors.HexColor("#c6ced6")
PAPER = colors.HexColor("#fbf7ef")
PALE = colors.HexColor("#e9f0f5")


def plain(value):
    return (
        str(value)
        .replace("\u2013", "-")
        .replace("\u2014", "-")
        .replace("\u2011", "-")
        .replace("\u2192", "to")
        .replace("\u00b7", "|")
        .replace("\u2019", "'")
        .replace("\u2018", "'")
        .replace("\u201c", '"')
        .replace("\u201d", '"')
        .replace("\u200b", "")
    )


def text(value):
    return escape(plain(value))


def anchor(url, label):
    return f'<a href="{escape(url, {chr(34): "&quot;"})}" color="#315d87"><u>{text(label)}</u></a>'


def register_fonts():
    directory = Path(reportlab.__file__).parent / "fonts"
    for name, file in [
        ("DocSans", "Vera.ttf"),
        ("DocSans-Bold", "VeraBd.ttf"),
        ("DocSans-Italic", "VeraIt.ttf"),
    ]:
        pdfmetrics.registerFont(TTFont(name, str(directory / file)))
    pdfmetrics.registerFontFamily(
        "DocSans",
        normal="DocSans",
        bold="DocSans-Bold",
        italic="DocSans-Italic",
        boldItalic="DocSans-Bold",
    )


def styles(brochure=False):
    size = 11.4 if brochure else 10.4
    leading = 16.4 if brochure else 13.0
    base = ParagraphStyle(
        "body",
        fontName="DocSans",
        fontSize=size,
        leading=leading,
        textColor=INK,
        alignment=TA_LEFT,
        spaceAfter=5,
        splitLongWords=False,
        allowWidows=0,
        allowOrphans=0,
    )

    def style(name, **kw):
        return ParagraphStyle(name, parent=base, **kw)

    return {
        "body": base,
        "name": style(
            "name",
            fontName="DocSans-Bold",
            fontSize=25 if brochure else 19.3,
            leading=31 if brochure else 24,
            spaceAfter=7,
        ),
        "title": style(
            "title",
            fontSize=13.4 if brochure else 11.7,
            leading=19 if brochure else 17,
            textColor=BLUE,
            spaceAfter=9,
        ),
        "h1": style(
            "h1", fontName="DocSans-Bold", fontSize=27, leading=33, spaceAfter=12
        ),
        "h2": style(
            "h2",
            fontName="DocSans-Bold",
            fontSize=16 if brochure else 11.7,
            leading=21 if brochure else 17,
            textColor=BLUE,
            spaceBefore=14 if brochure else 10,
            spaceAfter=8 if brochure else 6,
            keepWithNext=True,
        ),
        "h3": style(
            "h3",
            fontName="DocSans-Bold",
            fontSize=12 if brochure else 11,
            leading=16,
            spaceBefore=8,
            spaceAfter=4,
            keepWithNext=True,
        ),
        "group": style(
            "group",
            fontName="DocSans-Bold",
            fontSize=9.5,
            leading=13,
            textColor=BLUE,
            spaceBefore=5,
            spaceAfter=3,
            keepWithNext=True,
        ),
        "small": style(
            "small",
            fontSize=9.2 if brochure else 9.0,
            leading=13.2 if brochure else 12.5,
            textColor=MUTED,
            spaceAfter=5,
        ),
        "label": style(
            "label",
            fontName="DocSans-Bold",
            fontSize=9,
            leading=13,
            textColor=RED,
            spaceAfter=7,
        ),
        "bullet": style(
            "bullet",
            leftIndent=10,
            firstLineIndent=0,
            bulletIndent=0,
            spaceAfter=3,
            bulletFontName="DocSans",
            bulletFontSize=size,
        ),
        "skill": style("skill", fontSize=10, leading=13.2, spaceAfter=4),
    }


def begin_tag(canvas, kind, alt=None):
    records = getattr(canvas, "document_tags", [])
    page = canvas.getPageNumber()
    mcid = sum(record["page"] == page for record in records)
    records.append({"page": page, "mcid": mcid, "kind": kind, "alt": alt})
    canvas._code.append(f"/{kind} <</MCID {mcid}>> BDC")


class Paragraph(BaseParagraph):
    def draw(self):
        kind = {"name": "H1", "h1": "H1", "h2": "H2", "h3": "H3", "group": "H3"}.get(
            self.style.name, "P"
        )
        begin_tag(self.canv, kind)
        super().draw()
        self.canv._code.append("EMC")


class Rule(Flowable):
    def __init__(self, width, color=LINE):
        super().__init__()
        self.width = width
        self.height = 8
        self.color = color

    def draw(self):
        self.canv.setStrokeColor(self.color)
        self.canv.setLineWidth(0.65)
        self.canv.line(0, 4, self.width, 4)


class Diagram(Flowable):
    """Lightweight original vector grouping; arrows only for documented flow."""

    def __init__(self, labels, width, flow=False):
        super().__init__()
        self.labels = labels
        self.width = width
        self.height = 54
        self.flow = flow

    def draw(self):
        c = self.canv
        begin_tag(c, "Figure", "Documented components: " + ", ".join(self.labels))
        gap = 14
        box = (self.width - gap * (len(self.labels) - 1)) / len(self.labels)
        for i, label in enumerate(self.labels):
            x = i * (box + gap)
            c.setFillColor(PALE)
            c.setStrokeColor(LINE)
            c.setLineWidth(0.6)
            c.roundRect(x, 10, box, 34, 5, stroke=1, fill=1)
            c.setFillColor(BLUE)
            c.setFont("DocSans-Bold", 9.2)
            c.drawCentredString(x + box / 2, 23, plain(label))
            if self.flow and i < len(self.labels) - 1:
                c.setStrokeColor(BLUE)
                c.line(x + box + 3, 27, x + box + gap - 3, 27)
                c.line(x + box + gap - 6, 30, x + box + gap - 3, 27)
                c.line(x + box + gap - 6, 24, x + box + gap - 3, 27)
        c._code.append("EMC")


class Metrics(Flowable):
    def __init__(self, entries, width):
        super().__init__()
        self.entries = entries
        self.width = width
        self.height = 76

    def draw(self):
        c = self.canv
        begin_tag(
            c, "Figure", "; ".join(value + " " + label for value, label in self.entries)
        )
        col = self.width / len(self.entries)
        c.setFillColor(PALE)
        c.roundRect(0, 4, self.width, 67, 5, stroke=0, fill=1)
        for i, (value, label) in enumerate(self.entries):
            x = i * col + 15
            c.setFillColor(RED)
            c.setFont("DocSans-Bold", 23)
            c.drawString(x, 40, plain(value))
            c.setFillColor(INK)
            c.setFont("DocSans", 9)
            c.drawString(x, 21, plain(label))
        c._code.append("EMC")


class Document(BaseDocTemplate):
    def __init__(self, filename, profile, title, brochure=False):
        self.profile = profile
        self.document_title = title
        self.brochure = brochure
        self.outline_index = 0
        self.tags = []
        super().__init__(
            str(filename),
            pagesize=A4,
            leftMargin=42,
            rightMargin=42,
            topMargin=43,
            bottomMargin=43,
            title=title,
            author=profile["name"],
            subject=profile["title"],
            pageCompression=1,
            initialFontName="DocSans",
            initialFontSize=10.4,
        )
        frame = Frame(
            42,
            43,
            W - 84,
            H - 86,
            leftPadding=0,
            rightPadding=0,
            topPadding=0,
            bottomPadding=0,
            id="body",
        )
        self.addPageTemplates(
            PageTemplate(
                id="a4",
                frames=[frame],
                onPage=self.page_chrome,
                onPageEnd=self.page_footer,
            )
        )

    def page_chrome(self, c, doc):
        c.document_tags = self.tags
        c.saveState()
        c._code.append("/Artifact BMC")
        if self.brochure:
            c.setFillColor(PAPER)
            c.rect(0, 0, W, H, stroke=0, fill=1)
            if doc.page == 1:
                c.setFillColor(BLUE)
                c.rect(42, H - 26, 28, 3, stroke=0, fill=1)
                c.setFillColor(RED)
                c.rect(74, H - 26, 14, 3, stroke=0, fill=1)
        if doc.page > 1:
            c.setFillColor(MUTED)
            c.setFont("DocSans", 8.2)
            c.drawString(42, H - 26, plain(self.profile["name"]))
        c._code.append("EMC")
        c.restoreState()

    def page_footer(self, c, doc):
        c.saveState()
        c._code.append("/Artifact BMC")
        c.setStrokeColor(LINE)
        c.setLineWidth(0.5)
        c.line(42, 32, W - 42, 32)
        c.setFillColor(MUTED)
        c.setFont("DocSans", 8)
        c.drawString(
            42, 19, "Engineering profile" if self.brochure else "Professional resume"
        )
        c.drawRightString(W - 42, 19, f"Page {doc.page}")
        c._code.append("EMC")
        c.restoreState()

    def afterFlowable(self, flowable):
        if isinstance(flowable, Paragraph) and flowable.style.name in ("h1", "h2"):
            key = f"section-{self.outline_index}"
            self.outline_index += 1
            self.canv.bookmarkPage(key)
            self.canv.addOutlineEntry(flowable.getPlainText(), key, level=0)


def p(value, style):
    return Paragraph(text(value), style)


def header(profile, site, st):
    contact = profile["contact"]
    first = " | ".join(
        [
            text(contact["location"]),
            text(contact.get("phone", "")),
            anchor("mailto:" + contact["email"], contact["email"]),
        ]
    )
    second = " | ".join(
        [
            anchor(contact["linkedin"], "LinkedIn"),
            anchor(
                contact["github"],
                "github.com/" + contact["github"].rstrip("/").split("/")[-1],
            ),
            anchor(site["url"], "Portfolio"),
        ]
    )
    return [
        p(profile["name"], st["name"]),
        p(profile["title"], st["title"]),
        Paragraph(first, st["small"]),
        Paragraph(second, st["small"]),
        Rule(W - 84),
    ]


def role_heading(role, st, continued=False, where=None):
    return [
        p(
            role["company"]
            + " | "
            + role["role"]
            + (" (continued)" if continued else ""),
            st["h2"],
        ),
        p(role["dates"] + " | " + (where or role["where"]), st["small"]),
    ]


def groups_content(groups, st):
    result = []
    for group in groups:
        label = group["label"] + (
            (" | " + group["dates"]) if group.get("dates") else ""
        )
        result.append(p(label, st["group"]))
        for bullet in group["bullets"]:
            result.append(Paragraph(text(bullet), st["bullet"], bulletText="-"))
    return result


def technical_skills(profile, r, st):
    story = [p("Technical skills", st["h2"])]
    for skill in r["skills"]:
        story.append(
            Paragraph(
                "<b>"
                + text(skill["label"])
                + ":</b> "
                + text(", ".join(skill["items"])),
                st["skill"],
            )
        )
    added = [
        item
        for group in profile["skills"]
        if group["category"] in r.get("additionalSkillCategories", [])
        for item in group["items"]
    ]
    story.append(
        Paragraph(
            "<b>Product engineering &amp; data:</b> " + text(", ".join(added)),
            st["skill"],
        )
    )
    return story


def resume(profile, site, source, path):
    st = styles()
    r = source["resume"]
    jobs = {j["id"]: j for j in profile["journey"]}
    roles = r["roles"]
    current = jobs[roles[0]["careerId"]]
    story = header(profile, site, st) + [
        p("Professional summary", st["h2"]),
        p(r["summary"], st["body"]),
        p(
            "Current role: "
            + current["role"]
            + " at "
            + current["company"]
            + " | "
            + current["dates"],
            st["small"],
        ),
    ]
    story += technical_skills(profile, r, st)
    story += [p("Selected independent work", st["h2"])]
    for product_id in r.get("featuredProductIds", []):
        prod = next(x for x in profile["products"] if x["id"] == product_id)
        story += [
            p(prod["name"] + " | " + prod["kicker"], st["h3"]),
            p(prod["blurb"], st["body"]),
            Paragraph(
                text(prod["stack"]) + "<br/>" + anchor(prod["link"], prod["link"]),
                st["small"],
            ),
        ]
    for project_id in r.get("friendlyHelpProjectIds", []):
        project = next(x for x in profile["work"] if x["id"] == project_id)
        story += [
            p(project["name"] + " | " + project["type"], st["h3"]),
            p(project["note"], st["body"]),
        ]
    story += [p("Education", st["h2"])]
    for education in profile["education"]:
        extra = next(
            (x for x in r["educationDetails"] if x["school"] == education["school"]), {}
        )
        story += [
            p(education["school"], st["h3"]),
            p(
                education["degree"]
                + " | "
                + extra.get("dates", education["dates"])
                + " | "
                + education["location"],
                st["body"],
            ),
        ]
    story += [PageBreak(), p("Professional experience", st["label"])]
    first = roles[0]
    story += role_heading(jobs[first["careerId"]], st) + groups_content(
        first["groups"], st
    )
    story += [PageBreak(), p("Professional experience / earlier roles", st["label"])]
    for record in roles[1:]:
        role = jobs[record["careerId"]]
        where = record.get("where", role["where"])
        story += role_heading(role, st, where=where) + groups_content(
            record["groups"], st
        )
    doc = Document(path, profile, profile["name"] + " - DevSecOps Resume")
    doc.build(story)
    return doc.tags


def brochure(profile, site, source, path):
    st = styles(True)
    width = W - 84
    config = source["brochure"]
    story = [
        p("ENGINEERING PROFILE / DEVSECOPS & CLOUD", st["label"]),
        p(site["displayName"], st["name"]),
        p(profile["title"], st["title"]),
        Spacer(1, 8),
        p(profile["tagline"], st["h1"]),
    ]
    # A real line break, without converting the content into a raster image.
    story[-1] = Paragraph(text(profile["tagline"]).replace(". ", ".<br/>"), st["h1"])
    story += [
        p(profile["intro"], st["body"]),
        Spacer(1, 9),
        Metrics(
            [
                (
                    next(
                        a["value"]
                        for a in profile["achievements"]
                        if a["id"] == m["achievementId"]
                    )
                    + m.get("valueSuffix", ""),
                    m["label"],
                )
                for m in config["metrics"]
            ],
            width,
        ),
    ]
    impact = next(x for x in profile["achievements"] if x["id"] == config["impactId"])[
        "caseStudy"
    ]
    story += [
        p("The decisions behind the impact", st["h2"]),
        p(impact["context"], st["body"]),
        p(impact["decision"], st["body"]),
        p(impact["note"], st["small"]),
    ]
    story += [p("A career built on stronger foundations", st["h2"])]
    for job in [x for x in profile["journey"] if x.get("kind") == "employment"]:
        story.append(
            Paragraph(
                "<b>"
                + text(job["company"])
                + "</b> | "
                + text(job["role"])
                + '<br/><font color="#526173" size="9.5">'
                + text(job["dates"])
                + "</font>",
                st["body"],
            )
        )
    story += [
        Rule(width),
        p("Let's connect", st["h3"]),
        Paragraph(
            anchor("mailto:" + profile["contact"]["email"], profile["contact"]["email"])
            + " | "
            + anchor(profile["contact"]["linkedin"], "LinkedIn")
            + " | "
            + anchor(profile["contact"]["github"], "GitHub")
            + " | "
            + anchor(site["url"], "Explore the portfolio"),
            st["small"],
        ),
        p(profile["contact"]["location"], st["small"]),
        PageBreak(),
    ]
    story += [
        p("INSIDE THE ENGINEERING WORK", st["label"]),
        p(
            "Systems with a reason<br/>behind every decision.".replace("<br/>", " "),
            st["h1"],
        ),
    ]
    builds = {b["id"]: b for b in profile["builds"]}
    for section in config["sections"]:
        b = builds[section["architectureId"]]
        story += [
            p(section["heading"], st["h2"]),
            p(b["text"], st["body"]),
            Diagram(section["diagramLabels"], width, flow=section.get("flow", False)),
        ]
        if section.get("projectId"):
            project = next(
                x for x in profile["work"] if x["id"] == section["projectId"]
            )
            story.append(
                Paragraph(anchor(project["repoUrl"], section["linkLabel"]), st["small"])
            )
        if section.get("note"):
            story.append(p(section["note"], st["small"]))
    story += [
        Rule(width),
        Paragraph(
            "<b>Explore more:</b> "
            + anchor(site["url"], "Career, projects and engineering field notes")
            + "<br/>"
            + anchor(
                "mailto:" + profile["contact"]["email"], profile["contact"]["email"]
            ),
            st["small"],
        ),
    ]
    doc = Document(
        path, profile, profile["name"] + " - Engineering Brochure", brochure=True
    )
    doc.build(story)
    return doc.tags


def metadata(path, profile, kind, tags):
    reader = PdfReader(path)
    writer = PdfWriter()
    writer.pdf_header = "%PDF-1.7"
    writer.clone_document_from_reader(reader)
    stamp = datetime.now(timezone.utc).strftime("D:%Y%m%d%H%M%SZ")
    writer.add_metadata(
        {
            "/CreationDate": stamp,
            "/ModDate": stamp,
            "/Title": profile["name"] + " - " + kind,
            "/Author": profile["name"],
            "/Subject": profile["title"],
            "/Keywords": "DevSecOps, platform engineering, Kubernetes, cloud security, GitOps, FinOps, AWS, Azure, GCP",
            "/Creator": "profile-builder document generator",
            "/Producer": "ReportLab / pypdf",
        }
    )
    from pypdf.generic import (
        NameObject,
        TextStringObject,
        DictionaryObject,
        ArrayObject,
        NumberObject,
        BooleanObject,
    )

    writer.root_object[NameObject("/Lang")] = TextStringObject("en-US")
    writer.page_layout = "/OneColumn"
    # Preserve accessible text hierarchy and annotation references in the regenerated PDFs.
    struct = DictionaryObject({NameObject("/Type"): NameObject("/StructTreeRoot")})
    struct_ref = writer._add_object(struct)
    document = DictionaryObject(
        {
            NameObject("/Type"): NameObject("/StructElem"),
            NameObject("/S"): NameObject("/Document"),
            NameObject("/P"): struct_ref,
        }
    )
    doc_ref = writer._add_object(document)
    children = ArrayObject()
    parents = {}
    for tag in tags:
        page_index = tag["page"] - 1
        page = writer.pages[page_index]
        element = DictionaryObject(
            {
                NameObject("/Type"): NameObject("/StructElem"),
                NameObject("/S"): NameObject("/" + tag["kind"]),
                NameObject("/P"): doc_ref,
                NameObject("/Pg"): page.indirect_reference,
                NameObject("/K"): NumberObject(tag["mcid"]),
            }
        )
        if tag.get("alt"):
            element[NameObject("/Alt")] = TextStringObject(tag["alt"])
        ref = writer._add_object(element)
        children.append(ref)
        parents.setdefault(page_index, ArrayObject()).append(ref)
    nums = ArrayObject()
    for i, page in enumerate(writer.pages):
        page[NameObject("/StructParents")] = NumberObject(i)
        page[NameObject("/Tabs")] = NameObject("/S")
        nums.extend([NumberObject(i), parents.get(i, ArrayObject())])
    next_key = len(writer.pages)
    for page in writer.pages:
        for annotation_ref in page.get("/Annots", []):
            annotation = annotation_ref.get_object()
            if annotation.get("/Subtype") != "/Link":
                continue
            link = DictionaryObject(
                {
                    NameObject("/Type"): NameObject("/StructElem"),
                    NameObject("/S"): NameObject("/Link"),
                    NameObject("/P"): doc_ref,
                    NameObject("/Pg"): page.indirect_reference,
                    NameObject("/K"): DictionaryObject(
                        {
                            NameObject("/Type"): NameObject("/OBJR"),
                            NameObject("/Obj"): annotation_ref,
                            NameObject("/Pg"): page.indirect_reference,
                        }
                    ),
                }
            )
            link_ref = writer._add_object(link)
            children.append(link_ref)
            annotation[NameObject("/StructParent")] = NumberObject(next_key)
            annotation[NameObject("/Contents")] = TextStringObject(
                annotation.get("/A", {}).get("/URI", "Link")
            )
            nums.extend([NumberObject(next_key), link_ref])
            next_key += 1
    document[NameObject("/K")] = children
    struct[NameObject("/K")] = ArrayObject([doc_ref])
    struct[NameObject("/ParentTree")] = writer._add_object(
        DictionaryObject({NameObject("/Nums"): nums})
    )
    struct[NameObject("/ParentTreeNextKey")] = NumberObject(next_key)
    writer.root_object[NameObject("/StructTreeRoot")] = struct_ref
    writer.root_object[NameObject("/MarkInfo")] = DictionaryObject(
        {NameObject("/Marked"): BooleanObject(True)}
    )

    with path.open("wb") as file:
        writer.write(file)
    return len(reader.pages)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", default="output/pdf")
    parser.add_argument("--install", action="store_true")
    args = parser.parse_args()
    out = ROOT / args.output
    out.mkdir(parents=True, exist_ok=True)
    profile = json.loads((ROOT / "data/profile.json").read_text())
    site = json.loads((ROOT / "data/site.json").read_text())
    source = json.loads((ROOT / "data/documents.json").read_text())
    register_fonts()
    stem = Path(profile["resume"]["filename"]).stem
    resume_path = out / (stem + "_Resume.pdf")
    brochure_path = out / (stem + "_Brochure.pdf")
    resume_tags = resume(profile, site, source, resume_path)
    brochure_tags = brochure(profile, site, source, brochure_path)
    counts = {}
    for kind, file, tags in [
        ("Resume", resume_path, resume_tags),
        ("Engineering Brochure", brochure_path, brochure_tags),
    ]:
        counts[kind] = metadata(file, profile, kind, tags)
    if args.install:
        shutil.copy2(resume_path, ROOT / site["resume"])
        shutil.copy2(brochure_path, ROOT / site.get("brochure", "assets/brochure.pdf"))
    print(
        json.dumps(
            {
                "outputs": [str(resume_path), str(brochure_path)],
                "pages": counts,
                "installed": args.install,
            },
            indent=2,
        )
    )


if __name__ == "__main__":
    main()

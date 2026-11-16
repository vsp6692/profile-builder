#!/usr/bin/env python3
"""Check generated PDF mechanics and source coverage; visual review is still required.

This does not establish PDF/UA conformance, universal ATS compatibility, or the
truth of professional claims beyond the supplied profile and resume records.
"""
from __future__ import annotations

import argparse
from collections import defaultdict
from datetime import datetime, timedelta, timezone
import json
import math
from pathlib import Path
import re
import shutil
import subprocess
import unicodedata

import pdfplumber
from pypdf import PdfReader
from pypdf.generic import ContentStream, IndirectObject

ROOT = Path(__file__).resolve().parents[1]
A4 = (595.275590551, 841.889763780)


def normalized(value):
    value = unicodedata.normalize("NFKC", str(value))
    for old, new in [("–", "-"), ("—", "-"), ("‑", "-"), ("→", "to"),
                     ("·", "|"), ("’", "'"), ("‘", "'"), ("“", '"'),
                     ("”", '"'), ("\u200b", ""), ("\u00ad", "")]:
        value = value.replace(old, new)
    return re.sub(r"\s+", " ", value).strip().casefold()


def resolved(value):
    return value.get_object() if hasattr(value, "get_object") else value


def ref_id(value):
    ref = value if isinstance(value, IndirectObject) else getattr(value, "indirect_reference", None)
    return (ref.idnum, ref.generation) if ref is not None else None


def number_tree(tree, issues):
    result = {}
    def visit(node):
        node = resolved(node)
        nums = node.get("/Nums", [])
        if len(nums) % 2:
            issues.append("ParentTree has an odd number of number-tree entries")
        for i in range(0, len(nums) - 1, 2):
            key = int(nums[i])
            if key in result:
                issues.append(f"ParentTree repeats key {key}")
            result[key] = nums[i + 1]
        for child in node.get("/Kids", []):
            visit(child)
    visit(tree)
    return result


def stream_details(page, reader, issues, page_number):
    used_fonts, mcids, stack = set(), [], []
    font = None
    untagged_text = 0
    try:
        operations = ContentStream(page.get_contents(), reader).operations
        for operands, operator in operations:
            if operator == b"Tf":
                font = str(operands[0])
            elif operator in (b"BMC", b"BDC"):
                tag = str(operands[0])
                properties = resolved(operands[1]) if operator == b"BDC" else {}
                mcid = properties.get("/MCID") if hasattr(properties, "get") else None
                stack.append((tag, int(mcid) if mcid is not None else None))
                if mcid is not None:
                    mcids.append(int(mcid))
            elif operator == b"EMC":
                if not stack:
                    issues.append(f"Page {page_number}: unmatched EMC")
                else:
                    stack.pop()
            elif operator in (b"Tj", b"TJ", b"'", b'"'):
                strings = operands[0] if operator == b"TJ" else operands
                has_text = any(isinstance(x, (str, bytes)) and x.strip() for x in strings)
                if has_text:
                    if font:
                        used_fonts.add(font)
                    if not any(tag == "/Artifact" or mcid is not None for tag, mcid in stack):
                        untagged_text += 1
        if stack:
            issues.append(f"Page {page_number}: unclosed marked-content sections")
        if len(set(mcids)) != len(mcids):
            issues.append(f"Page {page_number}: duplicate MCIDs")
        if untagged_text:
            issues.append(f"Page {page_number}: {untagged_text} text operators outside marked content/artifacts")
    except Exception as error:
        issues.append(f"Page {page_number}: unable to inspect content stream: {error}")
    return used_fonts, mcids


def font_checks(page, used, issues, number):
    result = []
    fonts = resolved(page.get("/Resources", {})).get("/Font", {})
    fonts = resolved(fonts)
    for key in sorted(used):
        font = resolved(fonts.get(key, {}))
        descendants = font.get("/DescendantFonts", [])
        base = resolved(descendants[0]) if descendants else font
        descriptor = resolved(base.get("/FontDescriptor", {}))
        embedded = any(k in descriptor for k in ("/FontFile", "/FontFile2", "/FontFile3"))
        unicode_map = bool(font.get("/ToUnicode"))
        name = str(font.get("/BaseFont", key))
        if not embedded:
            issues.append(f"Page {number}: rendered font {name} is not embedded")
        if not unicode_map:
            issues.append(f"Page {number}: rendered font {name} has no ToUnicode map")
        result.append({"name": name, "embedded": embedded, "toUnicode": unicode_map})
    # ReportLab may register an unused Helvetica font. Only fonts rendering actual
    # text are subject to the embedding requirement.
    return result


def check_structure(reader, page_mcids, issues):
    root = reader.trailer["/Root"]
    mark = resolved(root.get("/MarkInfo", {}))
    tree_ref = root.get("/StructTreeRoot")
    if not mark.get("/Marked") or not tree_ref:
        issues.append("Missing marked-document flag or structural tree")
        return {}
    tree = resolved(tree_ref)
    parent_tree = tree.get("/ParentTree")
    if not parent_tree:
        issues.append("Structure tree has no ParentTree")
        return {}
    parents = number_tree(parent_tree, issues)
    page_refs = {ref_id(page): i for i, page in enumerate(reader.pages)}
    annotations = {ref_id(a): (i, resolved(a)) for i, page in enumerate(reader.pages)
                   for a in page.get("/Annots", [])}
    tagged_mcids = defaultdict(dict)
    tagged_annotations = set()
    node_count = 0

    def walk(reference, expected_parent, inherited_page=None):
        nonlocal node_count
        node = resolved(reference)
        if not isinstance(node, dict):
            issues.append("Unexpected non-object structure element")
            return
        node_count += 1
        if ref_id(node.get("/P")) != ref_id(expected_parent):
            issues.append("Structure element has an inconsistent /P parent")
        page_ref = node.get("/Pg", inherited_page)
        page_index = page_refs.get(ref_id(page_ref))
        children = node.get("/K", [])
        children = children if isinstance(children, list) else [children]
        for child_ref in children:
            child = resolved(child_ref)
            if isinstance(child, int):
                if page_index is None:
                    issues.append("MCID structure element has no valid page")
                else:
                    if child in tagged_mcids[page_index]:
                        issues.append(f"Page {page_index + 1}: MCID {child} has multiple structure owners")
                    tagged_mcids[page_index][child] = reference
            elif isinstance(child, dict) and child.get("/Type") == "/OBJR":
                annotation_ref = child.get("/Obj")
                annotation_id = ref_id(annotation_ref)
                if annotation_id not in annotations:
                    issues.append("OBJR points to an annotation absent from page Annots")
                    continue
                annotation_page, annotation = annotations[annotation_id]
                tagged_annotations.add(annotation_id)
                if page_index != annotation_page or ref_id(child.get("/Pg")) != ref_id(reader.pages[annotation_page]):
                    issues.append("Link structure element/OBJR references the wrong page")
                key = annotation.get("/StructParent")
                if key is None or ref_id(parents.get(int(key))) != ref_id(reference):
                    issues.append("Annotation StructParent does not point back to its Link structure element")
                if node.get("/S") != "/Link":
                    issues.append("Link annotation is not represented by a Link structure element")
            elif isinstance(child, dict) and child.get("/Type") == "/MCR":
                mcr_page = page_refs.get(ref_id(child.get("/Pg", page_ref)))
                if mcr_page is None or child.get("/MCID") is None:
                    issues.append("Invalid marked-content reference")
                else:
                    tagged_mcids[mcr_page][int(child["/MCID"])] = reference
            elif isinstance(child, dict):
                walk(child_ref, reference, page_ref)

    roots = tree.get("/K", [])
    roots = roots if isinstance(roots, list) else [roots]
    for child in roots:
        walk(child, tree_ref)
    keys_used = set()
    for i, page in enumerate(reader.pages):
        key = page.get("/StructParents")
        if key is None:
            issues.append(f"Page {i + 1}: missing StructParents")
            continue
        key = int(key)
        if key in keys_used:
            issues.append("Multiple pages use the same StructParents key")
        keys_used.add(key)
        array = resolved(parents.get(key))
        if not isinstance(array, list):
            issues.append(f"Page {i + 1}: ParentTree does not contain an MCID array")
            continue
        if set(page_mcids[i]) != set(tagged_mcids[i]):
            issues.append(f"Page {i + 1}: stream MCIDs and structure MCIDs differ")
        for mcid in page_mcids[i]:
            if mcid >= len(array) or ref_id(array[mcid]) != ref_id(tagged_mcids[i].get(mcid)):
                issues.append(f"Page {i + 1}: ParentTree entry for MCID {mcid} is inconsistent")
        for annotation_ref in page.get("/Annots", []):
            annotation = resolved(annotation_ref)
            if annotation.get("/Subtype") == "/Link" and ref_id(annotation_ref) not in tagged_annotations:
                issues.append(f"Page {i + 1}: orphan link annotation absent from structure tree")
    next_key = int(tree.get("/ParentTreeNextKey", -1))
    if parents and next_key <= max(parents):
        issues.append("ParentTreeNextKey is not greater than existing ParentTree keys")
    return {"elements": node_count, "markedContentSequences": sum(map(len, page_mcids)),
            "structuredLinks": len(tagged_annotations), "parentTreeEntries": len(parents),
            "note": "Structural consistency checked; not a PDF/UA certification"}


def overlaps(chars):
    buckets = defaultdict(list)
    for i, char in enumerate(chars):
        for bucket in range(math.floor(char["top"] / 20), math.floor(char["bottom"] / 20) + 1):
            buckets[bucket].append(i)
    checked, findings = set(), []
    for indices in buckets.values():
        ordered = sorted(indices, key=lambda i: chars[i]["x0"])
        for offset, i in enumerate(ordered):
            a = chars[i]
            for j in ordered[offset + 1:]:
                b = chars[j]
                if b["x0"] >= a["x1"] - .05:
                    break
                pair = tuple(sorted((i, j)))
                if pair in checked:
                    continue
                checked.add(pair)
                width = min(a["x1"], b["x1"]) - max(a["x0"], b["x0"])
                height = min(a["bottom"], b["bottom"]) - max(a["top"], b["top"])
                if width <= .1 or height <= .1:
                    continue
                min_width = min(a["x1"] - a["x0"], b["x1"] - b["x0"])
                min_height = min(a["bottom"] - a["top"], b["bottom"] - b["top"])
                same_baseline = abs(a["bottom"] - b["bottom"]) < .7
                adjacent = abs(i - j) == 1
                if same_baseline and adjacent and (width <= 1.2 or width < min_width * .25):
                    continue  # Adjacent kerning is not an overlapping text block.
                if width > min_width * .25 and height > min_height * .25:
                    findings.append({"text": a["text"] + b["text"],
                                     "at": [round(max(a["x0"], b["x0"]), 2), round(max(a["top"], b["top"]), 2)]})
    return findings


def geometry(path, issues):
    summaries = []
    with pdfplumber.open(path) as document:
        for number, page in enumerate(document.pages, 1):
            chars = [c for c in page.chars if c["text"].strip()]
            if not chars:
                issues.append(f"Page {number}: no selectable characters")
                continue
            outside = [c for c in chars if c["x0"] < 41.4 or c["x1"] > page.width - 41.4
                       or c["top"] < 18 or c["bottom"] > page.height - 16]
            if outside:
                issues.append(f"Page {number}: {len(outside)} characters outside allowed print bounds")
            # Running text above/below the body is permitted only at small sizes.
            body = [c for c in chars if float(c["size"]) > 8.3]
            bad_body = [c for c in body if c["top"] < 41.4 or c["bottom"] > page.height - 41.4]
            if bad_body:
                issues.append(f"Page {number}: {len(bad_body)} body characters enter header/footer margins")
            intersections = overlaps(chars)
            if intersections:
                issues.append(f"Page {number}: {len(intersections)} significant nonspace-character overlaps")
            summaries.append({"page": number, "characters": len(chars),
                              "textBounds": [round(min(c["x0"] for c in chars), 2),
                                             round(min(c["top"] for c in chars), 2),
                                             round(max(c["x1"] for c in chars), 2),
                                             round(max(c["bottom"] for c in chars), 2)],
                              "bodyFontSizeRange": [round(min(c["size"] for c in body), 2), round(max(c["size"] for c in body), 2)],
                              "overlaps": intersections[:10]})
    return summaries


def allowed_urls(profile, site):
    contact = profile["contact"]
    urls = {site["url"], "mailto:" + contact["email"]}
    urls.update(contact[k] for k in ("linkedin", "github") if contact.get(k))
    if contact.get("phone"):
        urls.add("tel:" + re.sub(r"\s+", "", contact["phone"]))
    for project in profile.get("work", []) + profile.get("products", []):
        urls.update(project[k] for k in ("link", "repoUrl", "demoUrl") if project.get(k))
    return urls


def expected_content(profile, site, source, is_resume):
    expectations = []
    def add(label, value):
        expectations.append((label, str(value)))
    add("professional title", profile["title"])
    add("email", profile["contact"]["email"])
    if is_resume:
        add("full name", profile["name"])
        if profile["contact"].get("phone"):
            add("phone", profile["contact"]["phone"])
        resume = source["resume"]
        add("professional summary", resume["summary"])
        jobs = {job["id"]: job for job in profile["journey"]}
        for role in resume["roles"]:
            job = jobs[role["careerId"]]
            for key in ("company", "role", "dates"):
                add(f"{job['company']} {key}", job[key])
            for group in role["groups"]:
                add(f"{job['company']} group {group['label']}", group["label"])
                if group.get("dates"):
                    add(f"{job['company']} {group['label']} dates", group["dates"])
                for i, bullet in enumerate(group["bullets"], 1):
                    add(f"{job['company']} {group['label']} responsibility {i}", bullet)
        for group in resume["skills"]:
            for item in group["items"]:
                add(f"skill {item}", item)
        for education in profile["education"]:
            add("education school", education["school"])
            add("education degree", education["degree"])
        for education in resume["educationDetails"]:
            add("education dates", education["dates"])
        for product in profile.get("products", []):
            if product["name"] == "SecretMesh":
                add("SecretMesh description", product["blurb"])
        literature = next((p for p in profile["work"] if p.get("id") == "literature-overlap"), None)
        if literature:
            add("LitOverLap friendly-help description", literature["note"])
    else:
        add("display name", site["displayName"])
        add("introduction", profile["intro"])
        for achievement in profile["achievements"]:
            add("achievement " + achievement["label"], achievement["value"])
            if achievement.get("caseStudy"):
                for key in ("context", "decision", "note"):
                    if achievement["caseStudy"].get(key):
                        add("impact " + key, achievement["caseStudy"][key])
        for job in profile["journey"]:
            if job.get("kind") == "employment":
                for key in ("company", "role", "dates"):
                    add(f"{job['company']} {key}", job[key])
        for architecture in profile["builds"]:
            add("architecture " + architecture["name"], architecture["text"])
    return expectations


def check_document(path, profile, site, source):
    issues = []
    reader = PdfReader(path)
    is_resume = "resume" in path.name.casefold()
    if reader.is_encrypted:
        issues.append("Document is encrypted")
    root = reader.trailer["/Root"]
    metadata = dict(reader.metadata or {})
    for field in ("/Title", "/Author", "/Subject", "/Keywords"):
        if not str(metadata.get(field, "")).strip():
            issues.append(f"Missing metadata {field}")
    if metadata.get("/Author") != profile["name"]:
        issues.append("Author metadata does not match the configured identity")
    if metadata.get("/Subject") != profile["title"]:
        issues.append("Subject metadata does not match the configured role")
    expected_kind = "Resume" if is_resume else "Engineering Brochure"
    if metadata.get("/Title") != profile["name"] + " - " + expected_kind:
        issues.append("Title metadata does not match the document identity and purpose")
    if not re.fullmatch(r"en(?:-[A-Z]{2})?", str(root.get("/Lang", ""))):
        issues.append("Document has no English language metadata")
    try:
        created, modified = reader.metadata.creation_date, reader.metadata.modification_date
        if created is None or modified is None or created.tzinfo is None or modified.tzinfo is None:
            issues.append("Creation/modification metadata must include valid timezone-aware timestamps")
        elif modified < created or max(created, modified) > datetime.now(timezone.utc) + timedelta(minutes=5):
            issues.append("Creation/modification timestamps are reversed or unexpectedly in the future")
    except (ValueError, TypeError) as error:
        issues.append(f"Invalid creation/modification timestamp: {error}")
    urls = allowed_urls(profile, site)
    links, fonts, page_mcids, texts = [], [], [], []
    for number, page in enumerate(reader.pages, 1):
        width, height = float(page.mediabox.width), float(page.mediabox.height)
        if abs(width - A4[0]) > .5 or abs(height - A4[1]) > .5:
            issues.append(f"Page {number}: expected portrait A4, got {width:.2f} x {height:.2f} pt")
        if int(page.get("/Rotate", 0)) % 360:
            issues.append(f"Page {number}: unexpected rotation")
        extracted = page.extract_text() or ""
        if len(normalized(extracted)) < 80:
            issues.append(f"Page {number}: blank or insufficient selectable text")
        if "\ufffd" in extracted:
            issues.append(f"Page {number}: replacement characters in extracted text")
        texts.append(extracted)
        used, mcids = stream_details(page, reader, issues, number)
        fonts.extend(font_checks(page, used, issues, number))
        page_mcids.append(mcids)
        for annotation_ref in page.get("/Annots", []):
            annotation = resolved(annotation_ref)
            if annotation.get("/Subtype") != "/Link":
                continue
            action = resolved(annotation.get("/A", {}))
            url = str(action.get("/URI", ""))
            if action.get("/S") != "/URI" or url not in urls:
                issues.append(f"Page {number}: link is not an exact configured URL: {url}")
            rect = [float(n) for n in annotation.get("/Rect", [])]
            if len(rect) != 4 or not (0 <= rect[0] < rect[2] <= width + .1 and 0 <= rect[1] < rect[3] <= height + .1):
                issues.append(f"Page {number}: invalid/out-of-bounds link rectangle")
            links.append({"page": number, "url": url, "rect": rect})
    if not links:
        issues.append("No clickable contact links")
    structure = check_structure(reader, page_mcids, issues)
    page_geometry = geometry(path, issues)
    poppler = subprocess.run(["pdftotext", "-enc", "UTF-8", str(path), "-"], check=True, capture_output=True, text=True).stdout
    expectations = expected_content(profile, site, source, is_resume)
    extraction = {}
    for name, contents in (("pypdf", "\n".join(texts)), ("pdftotext", poppler)):
        combined = normalized(contents)
        missing = [label for label, value in expectations if normalized(value) not in combined]
        if missing:
            issues.append(f"{name}: missing source content: " + "; ".join(missing))
        extraction[name] = {"characters": len(contents), "sourceChecks": len(expectations), "missing": missing}
    return {"file": str(path.relative_to(ROOT)) if path.is_relative_to(ROOT) else str(path),
            "status": "passed" if not issues else "failed", "pages": len(reader.pages),
            "metadata": metadata, "language": str(root.get("/Lang", "")),
            "fonts": list({font["name"]: font for font in fonts}.values()),
            "links": links, "structure": structure, "textExtraction": extraction,
            "pageMetrics": page_geometry, "issues": issues}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("pdfs", nargs="*", help="Defaults to the generated resume and brochure")
    parser.add_argument("--output", type=Path, help="Optional detailed JSON report")
    args = parser.parse_args()
    if not shutil.which("pdftotext"):
        parser.error("Poppler pdftotext is required")
    profile = json.loads((ROOT / "data/profile.json").read_text())
    site = json.loads((ROOT / "data/site.json").read_text())
    source = json.loads((ROOT / "data/documents.json").read_text())
    stem = Path(profile["resume"]["filename"]).stem
    paths = [Path(p).resolve() for p in args.pdfs] if args.pdfs else [ROOT / "output/pdf" / (stem + suffix) for suffix in ("_Resume.pdf", "_Brochure.pdf")]
    results = [check_document(path, profile, site, source) for path in paths]
    report = {"status": "passed" if all(r["status"] == "passed" for r in results) else "failed",
              "documents": results,
              "limits": "Mechanical and source-record checks only. Every page still requires visual review; no universal ATS or PDF/UA certification is claimed."}
    if args.output:
        args.output.parent.mkdir(parents=True, exist_ok=True)
        args.output.write_text(json.dumps(report, indent=2) + "\n")
    print(json.dumps({"status": report["status"], "documents": [{"file": r["file"], "status": r["status"], "pages": r["pages"], "links": len(r["links"]), "sourceChecksPerReader": r["textExtraction"]["pypdf"]["sourceChecks"], "issues": r["issues"]} for r in results], "report": str(args.output) if args.output else None}, indent=2))
    return 0 if report["status"] == "passed" else 1


if __name__ == "__main__":
    raise SystemExit(main())

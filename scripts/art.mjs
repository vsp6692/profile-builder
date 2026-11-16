/** Original vector artwork for the engineering travel atlas. No external assets. */
const c = {
  sky: "var(--scene-sky, #f7f1e8)",
  far: "var(--scene-far, #dce7ec)",
  hill: "var(--scene-hill, #b9d0dc)",
  ground: "var(--scene-ground, #e6e0d3)",
  road: "var(--scene-road, #f6ebd5)",
  ink: "var(--scene-ink, #27384a)",
  red: "var(--scene-red, #bf5d4f)",
  blue: "var(--scene-blue, #597e9b)",
  paper: "var(--scene-paper, #fffaf0)",
};
const outline = `stroke="${c.ink}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"`;
const ellipse = (x, y, rx, ry, fill, opacity = 1) =>
  `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="${fill}" opacity="${opacity}"/>`;
const group = (content, x = 0, y = 0, scale = 1, cls = "") =>
  `<g transform="translate(${x} ${y}) scale(${scale})"${cls ? ` class="${cls}"` : ""}>${content}</g>`;
function windows(x, y, count = 3, rows = 1, width = 18, step = 29) {
  return Array.from({ length: rows }, (_, r) =>
    Array.from(
      { length: count },
      (_, i) =>
        `<rect x="${x + i * step}" y="${y + r * 31}" width="${width}" height="20" rx="2" fill="${c.blue}" opacity=".78"/><path d="M${x + i * step + width / 2} ${y + r * 31}v20" stroke="${c.paper}" stroke-width="1.5"/>`,
    ).join(""),
  ).join("");
}
function tree(x, y, size = 1, variant = 0) {
  const crown =
    variant % 2
      ? `<path d="M0-100-31-43h15L-39-9h78L16-43h15Z" fill="${c.blue}"/><path d="M0-90v95M0-25l-15-14M0-48l14-13" stroke="${c.ink}" stroke-width="2" fill="none" opacity=".55"/>`
      : `<path d="M-7 6v-56h14V6" fill="${c.ink}"/><path d="M-29-37C-45-65-18-99 1-101c24 2 50 39 29 65-9 14-47 17-59-1Z" fill="${c.hill}"/><path d="M0-20v-56M0-44l-14-12M0-58l12-10" stroke="${c.blue}" stroke-width="2" fill="none"/>`;
  return group(
    `${ellipse(0, 8, 29, 6, c.ink, 0.08)}${crown}`,
    x,
    y,
    size,
    "scene-tree",
  );
}
function cloud(x, y, size = 1) {
  return group(
    `<path d="M-63 17c-8-20 7-40 28-39 8-35 56-38 68-5 30-7 51 17 41 42Z" fill="${c.paper}" opacity=".8"/><path d="M-58 23H68" stroke="${c.blue}" stroke-width="1.5" opacity=".18"/>`,
    x,
    y,
    size,
    "scene-cloud",
  );
}
function cabin() {
  return `${ellipse(120, 193, 107, 15, c.ink, 0.09)}<path d="M39 108v76l81 12 83-29V88l-85-19Z" fill="${c.paper}" ${outline}/><path d="m120 196 83-29V88l-83 23Z" fill="${c.ground}"/><path d="m28 108 86-69 101 47-94 37Z" fill="${c.red}" ${outline}/><path d="m114 39 7 84-93-15" fill="none" ${outline}/><path d="m125 56 66 31-56 22M139 65l-1 34M159 74l-1 20M180 83l-1 5" fill="none" stroke="${c.paper}" stroke-width="2" opacity=".35"/><path d="M155 54V25h22v39" fill="${c.ink}" ${outline}/><path d="M151 24h30v8h-30Z" fill="${c.blue}"/><rect x="62" y="122" width="30" height="38" rx="15" fill="${c.blue}" ${outline}/><path d="M77 124v34M63 143h28" stroke="${c.paper}" stroke-width="2"/><path d="M141 186v-46c0-23 32-24 32-8v43" fill="${c.blue}" ${outline}/><path d="m133 188 43-15 13 7-43 17Z" fill="${c.ground}" ${outline}/><circle cx="166" cy="154" r="2" fill="${c.paper}"/><path d="m44 177 65 11M44 167l65 11M44 114v63" fill="none" stroke="${c.blue}" stroke-width="1.5" opacity=".35"/><path d="m193 111-10 3v27l10-3Z" fill="${c.blue}"/><path d="m190 116-5 1v17l5-1" fill="none" stroke="${c.paper}" stroke-width="1.2"/><path d="m22 183 16-5 15 5-15 5Z" fill="${c.red}"/><path d="M27 177v-17m8 14v-23m5 25 9-13" fill="none" stroke="${c.blue}" stroke-width="3"/><path d="m26 181 5 12 14-3 7-11" fill="${c.paper}" ${outline}/>`;
}
function tower() {
  return `${ellipse(121, 195, 88, 13, c.ink, 0.09)}<path d="M65 67h94v122H65Z" fill="${c.paper}" ${outline}/><path d="m159 67 25 15v107h-25Z" fill="${c.hill}" ${outline}/><path d="m59 65 50-22 56 22-54 18Z" fill="${c.red}" ${outline}/><path d="M70 66v10l41 13 48-14V65l-48 17Z" fill="${c.red}" ${outline}/>${windows(79, 98, 3, 2, 14, 24)}<path d="M100 189v-24h30v24" fill="${c.blue}" ${outline}/><path d="M51 190h146" stroke="${c.ink}" stroke-width="3"/><path d="M111 44V14l30 8-30 8" fill="${c.red}" ${outline}/>`;
}
function factory() {
  return `${ellipse(120, 192, 103, 14, c.ink, 0.09)}<path d="M32 102 80 76v27l48-27v27l48-27 29 22v88H32Z" fill="${c.paper}" ${outline}/><path d="m32 102 48-26v12l-48 26m48-11 48-27v12l-48 26m48-11 48-27v12l-48 26" fill="${c.red}" ${outline}/><path d="M175 76V29h18v55" fill="${c.blue}" ${outline}/>${windows(47, 129, 5, 1, 18, 30)}<path d="M87 185v-22h46v22" fill="${c.hill}" ${outline}/><path d="M97 166v17m12-17v17m12-17v17" stroke="${c.blue}"/><path d="M183 19c-22-5 11-22-7-28" fill="none" stroke="${c.blue}" opacity=".5" stroke-width="5" stroke-linecap="round"/>`;
}
function studio() {
  return `${ellipse(120, 194, 98, 13, c.ink, 0.09)}<path d="M39 98h159v88H39Z" fill="${c.paper}" ${outline}/><path d="m30 99 32-40h118l28 40Z" fill="${c.red}" ${outline}/><path d="M40 99v18h158V99" fill="${c.paper}" ${outline}/>${Array.from({ length: 8 }, (_, i) => `<path d="M${40 + i * 20} 100v18h10v-18" fill="${i % 2 ? c.blue : c.red}"/>`).join("")}<path d="M57 135h49v39H57Z" fill="${c.blue}" ${outline}/><path d="M81 135v39m-24-20h49" stroke="${c.paper}" stroke-width="2"/><path d="M130 186v-51h35v51" fill="${c.hill}" ${outline}/><circle cx="157" cy="161" r="2" fill="${c.ink}"/><path d="m54 65 119 1" stroke="${c.paper}" opacity=".35" stroke-width="3"/>`;
}
function observatory() {
  return `${ellipse(122, 195, 96, 14, c.ink, 0.09)}<path d="M47 116h148v68H47Z" fill="${c.paper}" ${outline}/><path d="M57 115a65 65 0 0 1 130 0Z" fill="${c.blue}" ${outline}/><path d="M122 50c-24 17-32 37-32 65m32-65c25 17 33 37 33 65" fill="none" stroke="${c.paper}" stroke-width="2" opacity=".5"/><path d="m113 83 61-42 12 17-61 43Z" fill="${c.paper}" ${outline}/><path d="m174 37 17 22 9-7-17-23Z" fill="${c.red}" ${outline}/><path d="M40 113h163v12H40Z" fill="${c.red}" ${outline}/>${windows(64, 141, 4, 1, 19, 30)}<path d="M110 184v-22h24v22" fill="${c.hill}" ${outline}/>`;
}
function vault() {
  return `${ellipse(120, 196, 90, 13, c.ink, 0.09)}<path d="M48 57 170 44l28 23v118L71 197l-23-22Z" fill="${c.blue}" ${outline}/><path d="m48 57 25 18 125-8m-125 8v122" fill="none" ${outline}/><path d="m86 87 95-9v94l-95 11Z" fill="${c.paper}" ${outline}/><circle cx="133" cy="126" r="28" fill="${c.ground}" ${outline}/><circle cx="133" cy="126" r="8" fill="${c.red}" ${outline}/><path d="M133 104v14m0 16v14m-22-22h14m16 0h14m-38-16 10 10m12 12 10 10m0-32-10 10m-12 12-10 10" ${outline}/><path d="m91 94 9-1v17l-9 1m0 42 9-1v17l-9 1" fill="${c.red}"/>`;
}
function cloudRig() {
  return `${ellipse(120, 195, 97, 13, c.ink, 0.09)}<path d="M48 93c-25-27-3-59 27-56 13-36 64-31 74 3 34-16 71 15 51 49Z" fill="${c.paper}" ${outline}/><path d="M62 101v22m58-22v22m59-22v22M62 118h117" fill="none" stroke="${c.blue}" stroke-width="3" stroke-dasharray="5 5"/><rect x="40" y="133" width="42" height="51" rx="5" fill="${c.blue}" ${outline}/><rect x="99" y="133" width="42" height="51" rx="5" fill="${c.paper}" ${outline}/><rect x="158" y="133" width="42" height="51" rx="5" fill="${c.red}" ${outline}/>${[40, 99, 158].map((x) => `<path d="M${x + 8} 145h26m-26 12h26m-26 12h26" stroke="${c.ink}" stroke-width="2"/><circle cx="${x + 32}" cy="176" r="2" fill="${c.paper}"/>`).join("")}`;
}
function lighthouse() {
  return `${ellipse(120, 196, 88, 13, c.ink, 0.09)}<path d="m87 77-16 109h99L153 77Z" fill="${c.paper}" ${outline}/><path d="m84 104-5 30h83l-5-30Z" fill="${c.red}"/><path d="m74 163-3 23h99l-4-23Z" fill="${c.red}"/><path d="M85 49h70v31H85Z" fill="${c.paper}" ${outline}/><path d="m77 50 43-31 43 31Z" fill="${c.blue}" ${outline}/><path d="M98 50v27m22-27v27m22-27v27" stroke="${c.ink}" stroke-width="3"/><path d="M76 81h88m-88 7h88" ${outline}/><path d="M108 186v-27a12 12 0 0 1 24 0v27" fill="${c.blue}" ${outline}/><path d="m72 55-54-18v55l54-22m96-15 54-18v55l-54-22" fill="${c.road}" opacity=".7"/>`;
}
function terminal() {
  return `${ellipse(120, 195, 94, 12, c.ink, 0.09)}<path d="M36 57h166v108H36Z" fill="${c.blue}" ${outline}/><path d="M46 68h145v84H46Z" fill="${c.ink}"/><path d="m65 91 15 12-15 12m30 0h31" fill="none" stroke="${c.paper}" stroke-width="4" stroke-linecap="round"/><path d="M99 165v18h45v-18m-60 23h77" fill="${c.paper}" ${outline}/><path d="M28 191h186v7H28Z" fill="${c.red}" ${outline}/><path d="M170 186v-17h19v17m0-12h8v8h-8" fill="${c.paper}" ${outline}/>`;
}
function library() {
  return `${ellipse(120, 195, 98, 12, c.ink, 0.09)}<path d="M35 87h170v100H35Z" fill="${c.paper}" ${outline}/><path d="m27 87 94-54 93 54Z" fill="${c.red}" ${outline}/><path d="M44 92h152v11H44Z" fill="${c.hill}"/><path d="M48 109h12v69H48m38-69h12v69H86m38-69h12v69h-12m38-69h12v69h-12" fill="${c.hill}" ${outline}/><path d="M29 183h182v10H29Z" fill="${c.blue}" ${outline}/><path d="M111 57v17h20V57m-10 0v17" fill="${c.paper}" ${outline}/>`;
}
function compass() {
  return `${ellipse(120, 196, 80, 11, c.ink, 0.09)}<circle cx="120" cy="112" r="76" fill="${c.paper}" ${outline}/><circle cx="120" cy="112" r="65" fill="${c.road}" stroke="${c.blue}" stroke-width="2"/><path d="m120 48 4 11h-8Zm64 64-11 4v-8Zm-64 64-4-11h8Zm-64-64 11-4v8Z" fill="${c.ink}"/><path d="m148 64-18 59-38 36 18-59Z" fill="${c.red}" ${outline}/><path d="m130 123-38 36 18-59 10 12Z" fill="${c.blue}"/><circle cx="120" cy="112" r="7" fill="${c.paper}" ${outline}/><path d="M106 35V22h28v13" fill="none" ${outline}/>`;
}
function mapArt() {
  return `${ellipse(120, 194, 95, 11, c.ink, 0.09)}<path d="m27 59 61-16 64 18 60-18v137l-60 18-64-17-61 16Z" fill="${c.paper}" ${outline}/><path d="m88 43 64 18v137l-64-17Z" fill="${c.ground}"/><path d="M88 44v136m64-119v136" stroke="${c.blue}" stroke-width="1.5" opacity=".5"/><path d="m41 92 27-9 12 25 32-14 17 28 37-20 30 30" fill="none" stroke="${c.blue}" stroke-width="4" stroke-linecap="round" stroke-dasharray="4 7"/><path d="M177 90c0-24 34-24 34 0 0 15-17 32-17 32s-17-17-17-32Z" fill="${c.red}" ${outline}/><circle cx="194" cy="88" r="6" fill="${c.paper}"/><path d="m43 154 11-18 12 18m44 9 12-19 12 19" fill="none" stroke="${c.hill}" stroke-width="4"/>`;
}
function chart() {
  return `${ellipse(120, 194, 97, 13, c.ink, 0.09)}<path d="m30 55 156-13 22 20v119L51 194l-21-18Z" fill="${c.paper}" ${outline}/><path d="m30 55 21 19 157-12m-157 12v120" fill="none" ${outline}/><path d="m64 163 23-2v-34l-23 2Zm39-3 23-2v-57l-23 2Zm39-4 23-2V84l-23 2Z" fill="${c.blue}"/><path d="m64 113 46-32 32 10 37-20m-17 0h17v17" fill="none" stroke="${c.red}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>`;
}
function lab() {
  return `${ellipse(120, 195, 90, 12, c.ink, 0.09)}<path d="M67 37h37v12H67Zm9 12v55l-38 65c-6 13 1 20 17 20h62c16 0 22-8 14-21l-37-64V49" fill="${c.paper}" ${outline}/><path d="m63 131-23 40c-5 9 0 14 13 14h66c10 0 14-5 8-15l-23-39c-16 12-27-11-41 0Z" fill="${c.blue}"/><circle cx="77" cy="151" r="6" fill="${c.paper}" opacity=".6"/><circle cx="98" cy="173" r="4" fill="${c.paper}" opacity=".6"/><path d="M153 84h42v11h-42Zm8 11v76c0 25 27 25 27 0V95" fill="${c.paper}" ${outline}/><path d="M164 128h21v43c0 19-21 19-21 0Z" fill="${c.red}"/><circle cx="174" cy="151" r="3" fill="${c.paper}"/><path d="M146 199h61" ${outline}/>`;
}
function toolsArt() {
  return `${ellipse(120, 194, 95, 11, c.ink, 0.09)}<path d="M41 105h157v79H41Z" fill="${c.blue}" ${outline}/><path d="M34 104h171v18H34Z" fill="${c.paper}" ${outline}/><path d="M52 184v16m134-16v16" stroke="${c.ink}" stroke-width="6"/><path d="M58 77 80 55l39 40-22 22Z" fill="${c.red}" ${outline}/><path d="m78 56 8-8 15 15-8 8" fill="${c.paper}" ${outline}/><path d="m137 114-11-8 32-44c-14-17 0-39 18-36l-11 16 14 10 11-16c8 19-5 37-23 34Z" fill="${c.ground}" ${outline}/><path d="M48 134h143v21H48" fill="none" stroke="${c.paper}" stroke-width="2" opacity=".6"/><path d="M103 144h35" stroke="${c.ink}" stroke-width="4" stroke-linecap="round"/>`;
}
function mail() {
  return `${ellipse(120, 196, 81, 11, c.ink, 0.09)}<path d="M110 131v62h16v-62" fill="${c.blue}" ${outline}/><path d="M60 76c0-48 113-48 113 0v66H60Z" fill="${c.red}" ${outline}/><path d="M132 76c0-48-72-48-72 0v66h72Z" fill="${c.paper}" ${outline}/><path d="M72 88h48v29H72Z" fill="${c.ground}" ${outline}/><path d="m72 88 24 17 24-17" fill="none" ${outline}/><path d="M172 96V36h27v23h-27" fill="${c.paper}" ${outline}/><path d="M84 66h25" stroke="${c.ink}" stroke-width="4" stroke-linecap="round"/>`;
}
const illustrations = {
  tower,
  studio,
  factory,
  cloud: cloudRig,
  vault,
  compass,
  map: mapArt,
  chart,
  library,
  school: library,
  terminal,
  lab,
  tools: toolsArt,
  mail,
  home: cabin,
  observatory,
  lighthouse,
};
export function landmark(kind, config = {}) {
  const illustration = illustrations[kind] || illustrations.studio;
  const accent = /^#[a-f\d]{6}$/i.test(config.accent || "")
    ? ` style="--scene-red:${config.accent}"`
    : "";
  return `<svg class="landmark-art" viewBox="0 0 240 220" fill="none" aria-hidden="true" focusable="false"${accent}>${illustration()}</svg>`;
}
function place(kind, x, y, scale) {
  return group((illustrations[kind] || cabin)(), x, y, scale);
}
export function scenery(kind, config = {}) {
  // Every chapter belongs to the same geography; landmarks change, the route continues.
  const variant =
    {
      home: 0,
      about: 1,
      career: 2,
      impact: 3,
      world: 4,
      projects: 5,
      skills: 6,
      contact: 7,
    }[kind] || 0;
  const buildings =
    {
      home: place("home", 85, 340, 1.55) + place("terminal", 430, 495, 0.58),
      about:
        place("lighthouse", 1070, 350, 1.17) + place("compass", 210, 510, 0.48),
      career: place("factory", 70, 425, 0.87) + place("tower", 1080, 370, 1.12),
      impact: place("cloud", 1020, 355, 1.25) + place("chart", 155, 490, 0.65),
      world:
        place("observatory", 65, 345, 1.4) + place("cloud", 1090, 435, 0.8),
      projects: place("studio", 75, 405, 1) + place("library", 1120, 405, 0.95),
      skills: place("home", 1040, 360, 1.25) + place("tools", 160, 475, 0.7),
      contact:
        place("lighthouse", 90, 345, 1.45) + place("mail", 1120, 465, 0.75),
    }[kind] || "";
  const custom =
    /^assets\/[\w./-]+\.(svg|png|webp|jpg)$/i.test(config.illustration || "") &&
    !config.illustration.includes("..")
      ? `<image href="${config.illustration}" x="0" y="0" width="1440" height="700" preserveAspectRatio="xMidYMax slice"/>`
      : "";
  return `<svg class="landscape" viewBox="0 0 1440 700" preserveAspectRatio="xMidYMax slice" fill="none" aria-hidden="true" focusable="false"><rect width="1440" height="700" fill="${c.sky}"/>${custom || `<g class="distant-sky">${cloud(150, 105, 0.88)}${cloud(1170, 135, 1.2)}${cloud(840, 64, 0.53)}<circle cx="${kind === "home" ? 180 : 1190}" cy="200" r="49" fill="${c.red}" opacity=".13"/><path d="m0 430 160-143 101 94 144-160 178 184 125-95 130 98 175-180 130 128 122-95 175 153v180H0Z" fill="${c.far}"/><path d="m406 221-45 51 43-14 24 12 21-4m564-38-42 43 41-13 17 12 17-8" fill="${c.paper}" opacity=".65"/><path d="M0 470c148-97 275 80 419-3s236-6 352-35 199-40 305 17 240-9 364-42v293H0Z" fill="${c.hill}"/><path d="M0 529c168-73 258 12 411-24s274-8 411 34 225-50 360-35 171 45 258 31v165H0Z" fill="${c.ground}"/></g><path d="M-30 674c220-166 407-70 635-54s371-79 450-51 69 98 415 92" stroke="${c.ink}" stroke-width="53" opacity=".10"/><path d="M-30 670c220-166 407-70 635-54s371-79 450-51 69 98 415 92" stroke="${c.road}" stroke-width="47"/><path d="M-30 670c220-166 407-70 635-54s371-79 450-51 69 98 415 92" stroke="${c.ink}" stroke-width="1.4" stroke-dasharray="4 14" opacity=".18"/><g class="middle-land">${tree(25, 560, 0.91, 1)}${tree(1360, 560, 1.04, 0)}${tree(1285, 552, 0.75, 1)}${tree(800, 535, 0.45, 0)}${tree(855, 533, 0.57, 1)}${tree(575, 535, 0.58, 1)}${buildings}</g><g class="foreground-land">${tree(1415, 666, 1.18, 1)}${tree(13, 675, 1.17, 0)}${[225, 516, 730, 925, 1185].map((x, i) => `<path d="m${x} ${658 + (i % 2) * 20} 8-6 9 4 11-3" stroke="${c.blue}" stroke-width="2" opacity=".4"/><path d="m${x + 21} ${668 + (i % 2) * 20} 2-9 4 6 4-12" stroke="${c.blue}" stroke-width="1.5" opacity=".5"/>`).join("")}<path d="m${920 - variant * 20} 548 21-6 18 7-19 5Z" fill="${c.blue}" opacity=".2"/></g><g opacity=".28" stroke="${c.blue}" stroke-width="1.2"><path d="M500 461c47-15 67-17 110-11m461 34c39-12 75-15 111-10M222 423l20-8m-17 23 44-11"/></g>`}</svg>`;
}
const color = (value, fallback) =>
  /^#[a-f\d]{3,8}$/i.test(value || "") ? value : fallback;
export function engineer(config = {}) {
  const skin = color(config.skin, "#b87853"),
    shirt = color(config.shirt, "#bf5d4f"),
    hair = color(config.hair, "#27313e"),
    bag = color(config.backpack, "#597e9b"),
    pants = color(config.pants, "#334d68");
  return `<svg class="engineer-avatar" viewBox="0 0 100 160" fill="none" aria-hidden="true" focusable="false">${ellipse(51, 153, 32, 5, c.ink, 0.15)}<g class="character-body"><g class="leg-left" style="transform-origin:45px 105px"><path d="m38 101 17 2-3 41-13 1Z" fill="${pants}" stroke="${hair}" stroke-width="2"/><path d="m39 139 12 1 7 9c1 4-4 5-7 4l-16-1Z" fill="${hair}"/><path d="M36 151h19" stroke="${c.paper}" stroke-width="2"/></g><g class="leg-right" style="transform-origin:59px 105px"><path d="m52 103 17-2 1 43-14 1Z" fill="${pants}" stroke="${hair}" stroke-width="2"/><path d="m56 140 13-1 10 10c2 4-3 5-7 4l-19-1Z" fill="${hair}"/><path d="M55 151h22" stroke="${c.paper}" stroke-width="2"/></g><path d="M29 67c-12 0-14 10-14 23l4 16 19-1 4-38Z" fill="${bag}" stroke="${hair}" stroke-width="2"/><path d="M20 82h9v16h-9" stroke="${c.paper}" stroke-width="1.5" opacity=".7"/><g class="arm-left" style="transform-origin:37px 72px"><path d="M36 69c-7 2-9 11-12 23l-2 20 9 2 6-18 7-18Z" fill="${shirt}" stroke="${hair}" stroke-width="2"/><path d="m22 110-1 8c2 6 9 6 10 0v-5" fill="${skin}" stroke="${hair}" stroke-width="1.5"/></g><path d="M36 64c10-6 24-5 31 1l8 36-6 10-33-1-6-11Z" fill="${shirt}" stroke="${hair}" stroke-width="2"/><path d="M39 65c-3 13-3 28-1 43" stroke="${bag}" stroke-width="5"/><path d="M48 61v9c4 6 13 5 16-1l-2-11" fill="${skin}" stroke="${hair}" stroke-width="1.5"/><path d="M35 30c6-14 30-15 39 0l-1 25c-3 12-18 17-29 8-9-7-13-20-9-33Z" fill="${skin}" stroke="${hair}" stroke-width="2"/><path d="M35 49c-8-8-9-23 0-31 3-7 11-5 14-9 8-5 13 2 20 1 10 2 17 12 13 22-1 6-7 8-12 5l-3-10c-9 7-18 7-25 5l-1 17Z" fill="${hair}"/><path d="M42 48c-8-12-16 3-5 9" fill="${skin}" stroke="${hair}" stroke-width="1.5"/><path d="m74 39 5 10-7 1" fill="${skin}" stroke="${hair}" stroke-width="1.5" stroke-linejoin="round"/><circle cx="67" cy="40" r="2" fill="${hair}"/><path d="M64 35h7M61 56c4 2 8 1 10-1" stroke="${hair}" stroke-width="1.8" stroke-linecap="round"/><path d="M44 55c2 13 22 17 28 3-12 6-19 2-28-3Z" fill="${hair}" opacity=".82"/><g class="arm-right" style="transform-origin:65px 73px"><path d="M63 67c7-3 12 4 14 12l3 22-8 2-7-20" fill="${shirt}" stroke="${hair}" stroke-width="2"/><path d="m72 101 1 13c1 6 10 5 10-1l-3-13" fill="${skin}" stroke="${hair}" stroke-width="1.5"/></g><path d="m45 82 8 1-1 11-8-1Z" fill="${c.paper}" opacity=".82"/><path d="m48 77-2 5" stroke="${hair}" stroke-width="1.2"/></g></svg>`;
}

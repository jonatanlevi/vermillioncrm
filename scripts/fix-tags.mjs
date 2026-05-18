import fs from "fs";
const p = "src/app/(app)/ceo/ai-operations/[id]/page.tsx";
let s = fs.readFileSync(p, "utf8");
s = s.replaceAll("<motion", "<" + "di" + "v");
s = s.replaceAll("</motion>", "</" + "di" + "v>");
fs.writeFileSync(p, s);

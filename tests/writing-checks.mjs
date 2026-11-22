import fs from "fs";
import {normalizeArabic,tokens,sentenceCount,checkWriting,compareCopy} from "../assets/js/writing.js";
import {validateWriting,validateLessons,validateReading,validateCertificates,validateAchievements} from "../assets/js/validators.js";
import {buildLessonQuiz} from "../assets/js/engine.js";
const rd=p=>JSON.parse(fs.readFileSync("../"+p));const idx=rd("content/index.json");
const mk=l=>Object.fromEntries(l.map(x=>[x,rd("content/"+x)]));
const lf=mk(idx.lessons),rf=mk(idx.reading),wf=mk(idx.writing);const lessons=Object.values(lf).flatMap(d=>d.lessons);
console.log("validators:",validateLessons(lf),validateReading(rf),validateWriting(wf),validateCertificates(rd("content/"+idx.certificates).certificates,lessons),validateAchievements(rd("content/"+idx.achievements).achievements));
const ok=(n,c)=>console.log(c?"PASS":"FAIL",n);
let bad=0;const all=[...lessons.map(l=>[l.id,l.practice]),...Object.values(rf).flatMap(d=>d.passages).map(p=>[p.id,p.questions])];
for(const [id,pr] of all)for(const lg of["en","ar"]){const q=buildLessonQuiz({id,practice:pr},lg);if(q.some(x=>x.options.filter(o=>o.ok).length!==1||new Set(x.options.map(o=>o.text)).size!==x.options.length||!x.heading||!x.explanation))bad++}
const by={};lessons.forEach(l=>by[l.level]=(by[l.level]||0)+1);console.log("lessons",lessons.length,by,"passages",Object.values(rf).flatMap(d=>d.passages).length,"bad quizzes",bad);
const ids=new Set(lessons.map(l=>l.id));console.log("dangling prereqs:",lessons.flatMap(l=>l.prerequisites.filter(p=>!ids.has(p))));
ok("normalize strips vowels + alef variants",normalizeArabic("أَكَلَ")===normalizeArabic("اكل")&&normalizeArabic("إِلَى")===normalizeArabic("الى"));
ok("tokens ignore punctuation",tokens("ذَهَبَ الوَلَدُ، ثُمَّ كَتَبَ.").length===4);
ok("sentence count (. ؟ newline)",sentenceCount("هذا أبي. من هذا؟\nهذه أمي")===3);
ok("empty text → 0 sentences",sentenceCount("  ")===0);
ok("copy: letters only ignores vowels",compareCopy("هذا ابي","هٰذَا أَبِي.",false));
ok("copy: strict rejects missing vowels",!compareCopy("هذا ابي","هٰذَا أَبِي.",true)&&compareCopy("هٰذَا أَبِي","هٰذَا أَبِي.",true));
ok("copy: wrong word rejected",!compareCopy("هذه ابي","هٰذَا أَبِي.",false));
for(const p of Object.values(wf).flatMap(d=>d.prompts)){const model=p.model.ar.join(" ");const r=checkWriting(model,p);ok(`model answer passes its own checks: ${p.id}`,r.ok);
 const r0=checkWriting("",p);ok(`empty text fails: ${p.id}`,!r0.ok&&r0.sentences===0);
 const one=checkWriting(p.model.ar[0],p);ok(`one sentence fails min ${p.minSentences}: ${p.id}`,!r.items.find(i=>i.key==="sentences")||!one.items[0].ok||p.minSentences<=1);}
const wp=Object.values(wf).flatMap(d=>d.prompts).find(p=>p.id==="w-day-01");
ok("attached و handled (وَلَمْ counts as لَمْ)",checkWriting("ذهب الولد. ثم كتب. ولم يشرب.",wp).ok);
ok("unvowelled typing accepted for checks",checkWriting("ذهب الولد الى البيت. ثم كتب الدرس. ولن يشرب",wp).ok);
const en=rd("content/translations/en.json"),ar=rd("content/translations/ar.json");console.log("key mismatch",Object.keys(en).filter(k=>!(k in ar)),Object.keys(ar).filter(k=>!(k in en)));
const src=fs.readFileSync("../assets/js/app.js","utf8");console.log("missing keys",[...new Set([...src.matchAll(/\bt\("([\w.]+)"/g)].map(m=>m[1]))].filter(k=>!(k in en)));
const sw=fs.readFileSync("../sw.js","utf8");console.log("precache missing",[...sw.matchAll(/"([^"]+\.(?:js|css|json|html|png))"/g)].map(m=>m[1]).filter(x=>!fs.existsSync("../"+x)));

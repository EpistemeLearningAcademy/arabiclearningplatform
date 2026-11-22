import fs from "fs";
import {buildLessonQuiz,traceStats} from "../assets/js/engine.js";
import {evaluate} from "../assets/js/gamification.js";
import {validateLessons,validateAchievements,validateReading,validateSentences} from "../assets/js/validators.js";
const rd=p=>JSON.parse(fs.readFileSync(p));const idx=rd("../content/index.json");
const mk=l=>Object.fromEntries(l.map(x=>[x,rd("../content/"+x)]));const lf=mk(idx.lessons),rf=mk(idx.reading),sf=mk(idx.sentences);const cat=rd("../content/"+idx.achievements).achievements;
console.log("errs:",validateLessons(lf),validateReading(rf),validateSentences(sf),validateAchievements(cat));
const lessons=Object.values(lf).flatMap(d=>d.lessons);let bad=0;
for(const l of lessons)for(const lg of["en","ar"]){const q=buildLessonQuiz(l,lg);if(q.some(x=>x.options.filter(o=>o.ok).length!==1||new Set(x.options.map(o=>o.text)).size!==x.options.length||!x.heading||!x.explanation))bad++}
const by={};lessons.forEach(l=>by[l.level]=(by[l.level]||0)+1);console.log("lessons",lessons.length,by,"bad",bad);
const ids=new Set(lessons.map(l=>l.id));console.log("dangling prereqs:",lessons.flatMap(l=>l.prerequisites.filter(p=>!ids.has(p))));
console.log("objectives en/ar ok:",lessons.every(l=>l.objectives.every(o=>o.en&&o.ar||typeof o==="string")));
// traceStats on synthetic buffers
const N=100*100,mask=new Uint8ClampedArray(N*4),ink=new Uint8ClampedArray(N*4);
for(let i=0;i<N;i++)if(i%100<50)mask[i*4+3]=255; // left half is the letter
console.log("no ink:",traceStats(mask,ink));
for(let i=0;i<N;i++)if(i%100<50)ink[i*4+3]=255;console.log("perfect:",traceStats(mask,ink));
const ink2=new Uint8ClampedArray(N*4);for(let i=0;i<N;i++)if(i%100>=25&&i%100<75)ink2[i*4+3]=255;console.log("half overlap (expect 50/50):",traceStats(mask,ink2));
const ink3=new Uint8ClampedArray(N*4);for(let i=0;i<N;i++)ink3[i*4+3]=255;console.log("scribble everything (cover 100, on 50):",traceStats(mask,ink3));
const P={progress:{items:{},attempts:[],xp:0,streak:{count:0},lessons:{},tracing:{"ب":{count:6},"بـ":{count:4}}}};console.log("tracing badge:",evaluate(P,cat,{lessons,vocabIds:[],letterIds:[]}).map(a=>a.id));
const en=rd("../content/translations/en.json"),ar=rd("../content/translations/ar.json");console.log("key mismatch",Object.keys(en).filter(k=>!(k in ar)),Object.keys(ar).filter(k=>!(k in en)));
const src=fs.readFileSync("../assets/js/app.js","utf8");console.log("missing keys",[...new Set([...src.matchAll(/\bt\("([\w]+)"/g)].map(m=>m[1]))].filter(k=>!(k in en)));
const sw=fs.readFileSync("../sw.js","utf8");console.log("precache missing",[...sw.matchAll(/"([^"]+\.(?:js|css|json|html|png))"/g)].map(m=>m[1]).filter(x=>!fs.existsSync("../"+x)));

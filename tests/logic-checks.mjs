import fs from "fs";
import {weekStart,weekKey,pickChallenges,challengeProgress,certProgress,certsEarned} from "../assets/js/gamification.js";
import {touchStreak,localDay} from "../assets/js/engine.js";
import {summarize,assignmentDone,toCSV} from "../assets/js/reports.js";
import {validateChallenges,validateCertificates,validateLessons} from "../assets/js/validators.js";
const rd=p=>JSON.parse(fs.readFileSync("../"+p));const idx=rd("content/index.json");
const lessons=idx.lessons.flatMap(f=>rd("content/"+f).lessons);
const chs=rd("content/"+idx.challenges).challenges,certs=rd("content/"+idx.certificates).certificates;
console.log("validators:",validateChallenges(chs),validateCertificates(certs,lessons));
const ok=(n,c)=>console.log(c?"PASS":"FAIL",n);
// week maths
const wed=new Date(2026,10,18,15,0).getTime(),ws=weekStart(wed);const d=new Date(ws);
ok("week starts Monday 00:00",d.getDay()===1&&d.getHours()===0&&localDay(ws)==="2026-11-16");
ok("same week from Sunday",weekStart(new Date(2026,10,22,23,59).getTime())===ws);
ok("next Monday new week",weekStart(new Date(2026,10,23,0,1).getTime())!==ws);
const pk=pickChallenges(chs,ws);ok("3 distinct challenges",pk.length===3&&new Set(pk.map(c=>c.id)).size===3);
ok("rotation changes weekly",pickChallenges(chs,weekStart(new Date(2026,10,25).getTime()))[0].id!==pk[0].id);
// progress counting
const mk=()=>({id:"p",name:"A",progress:{items:{},attempts:[],xp:0,streak:{last:"",count:0},lessons:{},days:[]}});
const P=mk();const inW=ws+2*864e5,before=ws-864e5;
P.progress.lessons={a:{completed:true,completedAt:inW},b:{completed:true,completedAt:before},c:{completed:true}};
P.progress.attempts=[{ts:inW,pct:80,total:6,topic:"x"},{ts:inW,pct:100,total:6,topic:"r-home-01"},{ts:before,pct:100,total:6,topic:"builder"},{ts:inW,pct:60,total:6,topic:"builder"},{ts:inW,pct:90,total:6,topic:"builder"}];
P.progress.days=[localDay(before),localDay(inW),localDay(ws),localDay(ws+6*864e5)];
const by=id=>chs.find(c=>c.id===id),cp=id=>challengeProgress(P,by(id),ws);
ok("lessons only this week (1)",cp("c-lessons")===1);ok("quizzes passed this week (3: 80,100,90)",cp("c-quizzes")===3);
ok("days in week (3, not previous Sunday)",cp("c-days")===3);ok("perfect (1)",cp("c-perfect")===1);ok("reading passed (1)",cp("c-reading")===1);ok("builder passed this week only (1)",cp("c-builder")===1);
// certificates need completion AND practice >=70
const mods=certs[0].modules;const ls=lessons.filter(l=>mods.includes(l.module));const Q=mk();
ls.forEach(l=>Q.progress.lessons[l.id]={completed:true,best:90});ok("cert earned when all done + passed",certsEarned(Q,certs,lessons).some(c=>c.id===certs[0].id));
Q.progress.lessons[ls[0].id].best=60;ok("not earned if one practice <70",!certsEarned(Q,certs,lessons).some(c=>c.id===certs[0].id));
Q.progress.lessons[ls[0].id]={completed:true};ok("not earned if never practised",!certsEarned(Q,certs,lessons).some(c=>c.id===certs[0].id));
Q.progress.lessons[ls[0].id]={completed:true,best:90};Q.progress.certificates={[certs[0].id]:1};ok("not re-awarded",!certsEarned(Q,certs,lessons).some(c=>c.id===certs[0].id));
const pg=certProgress(Q,certs[0],lessons);ok("cert progress total matches modules",pg.total===ls.length&&pg.done===ls.length);
// streak/days
const S=mk();touchStreak(S.progress);touchStreak(S.progress);ok("touchStreak: one day entry, streak 1",S.progress.days.length===1&&S.progress.streak.count===1);
S.progress.streak={last:localDay(Date.now()-864e5),count:2};S.progress.days=[];touchStreak(S.progress);ok("consecutive day raises streak to 3",S.progress.streak.count===3);
// reports
const R=mk();R.name="=HYPERLINK(1)";R.progress.assignments=[{id:"a1",type:"lesson",target:lessons[0].id},{id:"a2",type:"builder",target:"builder"}];R.progress.lessons={[lessons[0].id]:{completed:true,completedAt:inW,best:55}};R.progress.attempts=[{ts:inW,pct:55,total:6,correct:3,topic:'he said "hi"'}];
ok("assignment done (lesson completed)",assignmentDone(R,R.progress.assignments[0])&&!assignmentDone(R,R.progress.assignments[1]));
const s=summarize(R,lessons);ok("summary: done 1, avg 55, weak lists lesson<70",s.done===1&&s.avg===55&&s.weak.length===1);
const csv=toCSV(R,lessons);ok("CSV neutralises formula name",csv.includes("\"'=HYPERLINK(1)\"")&&!csv.includes(",\"=HYPERLINK"));ok("CSV escapes quotes",csv.includes('he said ""hi""'));
const en=rd("content/translations/en.json"),ar=rd("content/translations/ar.json");
console.log("key mismatch",Object.keys(en).filter(k=>!(k in ar)),Object.keys(ar).filter(k=>!(k in en)));
const src=fs.readFileSync("../assets/js/app.js","utf8");console.log("missing keys",[...new Set([...src.matchAll(/\bt\("([\w.]+)"/g)].map(m=>m[1]))].filter(k=>!(k in en)));
const sw=fs.readFileSync("../sw.js","utf8");console.log("precache missing",[...sw.matchAll(/"([^"]+\.(?:js|css|json|html|png))"/g)].map(m=>m[1]).filter(x=>!fs.existsSync("../"+x)));

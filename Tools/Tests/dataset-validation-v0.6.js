const fs=require("fs"),path=require("path");
const p=path.join(__dirname,"..","data","India_Inspiration_Studio_2026_365_Day_Content_v0_6.csv");
const raw=fs.readFileSync(p,"utf8").replace(/^\uFEFF/,"");
function parseCSV(s){let rows=[],row=[],v="",q=false;for(let i=0;i<s.length;i++){let c=s[i],n=s[i+1];if(q){if(c=='"'&&n=='"'){v+='"';i++}else if(c=='"')q=false;else v+=c}else if(c=='"')q=true;else if(c==","){row.push(v);v=""}else if(c=="\n"){row.push(v.replace(/\r$/,""));rows.push(row);row=[];v=""}else v+=c}if(v||row.length){row.push(v);rows.push(row)}return rows}
const a=parseCSV(raw),h=a.shift(),ix=Object.fromEntries(h.map((x,i)=>[x,i])),errors=[],warnings=[],dates=new Set(),en=new Map(),gu=new Map();
if(a.length!==365)errors.push(`Expected 365 rows, got ${a.length}`);
for(const r of a){const d=r[ix.Date];if(dates.has(d))errors.push(`Duplicate date ${d}`);dates.add(d);
 if(!/^2026-\d{2}-\d{2}$/.test(d))errors.push(`Bad date ${d}`);
 for(const k of ["Occasion_English","Occasion_Gujarati","Message_English","Message_Gujarati","Palette","Style","Cultural_Context"])if(!r[ix[k]])errors.push(`${d}: blank ${k}`);
 if(!/[\u0A80-\u0AFF]/.test(r[ix.Occasion_Gujarati]+r[ix.Message_Gujarati]))errors.push(`${d}: Gujarati missing`);
 en.set(r[ix.Message_English],(en.get(r[ix.Message_English])||0)+1);gu.set(r[ix.Message_Gujarati],(gu.get(r[ix.Message_Gujarati])||0)+1);
}
for(const [t,n] of en)if(n>1)errors.push(`Duplicate English message x${n}: ${t.slice(0,80)}`);
for(const [t,n] of gu)if(n>1)errors.push(`Duplicate Gujarati message x${n}: ${t.slice(0,80)}`);
const jan=a.find(r=>r[ix.Date]==="2026-01-01");if(!["Global","Western"].includes(jan[ix.Cultural_Context]))errors.push("1 January must be Global or Western");
const evergreen=a.filter(r=>r[ix.Record_Type]==="Evergreen"),reviewed=evergreen.filter(r=>r[ix.Gujarati_Editorial_Status].includes("reviewed"));
if(reviewed.length!==evergreen.length)errors.push(`Evergreen Gujarati review incomplete: ${reviewed.length}/${evergreen.length}`);
if(errors.length){console.error(errors.join("\n"));process.exit(1)}
console.log(`PASS: ${a.length} rows; ${dates.size} unique dates; no duplicate messages; ${reviewed.length} evergreen Gujarati messages reviewed.`);

import React, { useMemo, useState, useEffect } from "react";
import { CalendarDays, CheckCircle2, ChevronLeft, ChevronRight, Download, Flag, LogOut, Repeat2, ShieldCheck, X, Moon, Sun, Stethoscope, LayoutGrid, User, Settings, Save, Palmtree, KeyRound, UserPlus, Sunrise, Sunset } from "lucide-react";

// ─── Doctor roster ────────────────────────────────────────────────────────────

const doctorsSeed = [
  { name: "Al Hourani",    email: "alhourani",     password: "1234", role: "doctor" },
  { name: "Antepara",      email: "antepara",      password: "1234", role: "doctor" },
  { name: "Archvadze",     email: "archvadze",     password: "1234", role: "doctor" },
  { name: "Asatiani",      email: "asatiani",      password: "1234", role: "doctor" },
  { name: "Basaric",      email: "basaric",       password: "1234", role: "doctor" },
  { name: "Dangadze",      email: "dangadze",      password: "1234", role: "doctor" },
  { name: "El Harchali",   email: "elharchali",    password: "1234", role: "doctor" },
  { name: "Hamzeh",        email: "hamzeh",        password: "1234", role: "doctor" },
  { name: "Höfgen",        email: "hoefgen",       password: "1234", role: "doctor" },
  { name: "Hushi",         email: "hushi",         password: "1234", role: "doctor" },
  { name: "Ibrahim",       email: "ibrahim",       password: "1234", role: "doctor" },
  { name: "Klein",         email: "klein",         password: "1234", role: "doctor" },
  { name: "Mamulaishvili", email: "mamulaishvili", password: "1234", role: "doctor" },
  { name: "Moussa",        email: "moussa",        password: "1234", role: "doctor" },
  { name: "Naigambi",      email: "naigambi",      password: "1234", role: "doctor" },
  { name: "Natchkebia",    email: "natchkebia",    password: "1234", role: "doctor" },
  { name: "Nguyen",        email: "nguyen",        password: "1234", role: "doctor" },
  { name: "Niño",          email: "nino",          password: "1234", role: "doctor" },
  { name: "Osipova",       email: "osipova",       password: "1234", role: "doctor" },
  { name: "Piric",         email: "piric",         password: "1234", role: "doctor" },
  { name: "Rahal",         email: "rahal",         password: "1234", role: "doctor" },
  { name: "Rath",          email: "rath",          password: "1234", role: "doctor" },
  { name: "Razouk",        email: "razouk",        password: "1234", role: "doctor" },
  { name: "Reichling",     email: "reichling",     password: "1234", role: "doctor" },
  { name: "Schönbeck",     email: "schoenboeck",   password: "1234", role: "doctor" },
  { name: "Shenavai",      email: "shenavai",      password: "1234", role: "doctor" },
  { name: "Simon",         email: "simon",         password: "1234", role: "doctor" },
  { name: "Admin",         email: "admin",         password: "1234", role: "admin"  },
];

// ─── Codes ───────────────────────────────────────────────────────────────────

const CODES = {
  "":  { label: "Verfügbar",              bg: "#f8fafc", text: "#475569", border: "#e2e8f0", active: "#e2e8f0" },
  Vd:  { label: "Visitendienst",          bg: "#fff7ed", text: "#9a3412", border: "#fed7aa", active: "#f97316" },
  DW:  { label: "Dienstwunsch (Wochentag)", bg: "#eff6ff", text: "#1e40af", border: "#bfdbfe", active: "#3b82f6" },
  TW:  { label: "Tagdienstwunsch (WE)",   bg: "#f0f9ff", text: "#0c4a6e", border: "#bae6fd", active: "#0284c7" },
  NW:  { label: "Nachtdienstwunsch (WE)", bg: "#f5f3ff", text: "#4c1d95", border: "#ddd6fe", active: "#7c3aed" },
  DT:  { label: "Wochenende Tagdienst",   bg: "#f0f9ff", text: "#0c4a6e", border: "#bae6fd", active: "#0284c7" },
  DN:  { label: "Wochenende Nachtdienst", bg: "#f5f3ff", text: "#4c1d95", border: "#ddd6fe", active: "#7c3aed" },
  U:   { label: "Urlaub / Überstunden",   bg: "#fdf4ff", text: "#6b21a8", border: "#e9d5ff", active: "#9333ea" },
  kD:  { label: "Dienst unerwünscht",     bg: "#fff1f2", text: "#9f1239", border: "#fecdd3", active: "#e11d48" },
};

// ─── CPU (Chest Pain Unit) ──────────────────────────────────────────────────

const cpuDoctors_INIT = ["Archvadze", "Asatiani", "Brenzel", "Nguyen", "Osipova", "Rahal"];
function emptyCPU() { return { early: "", early2: "", late: "" }; }

function scheduleCPU(cpuDocs, avail, y, m, inn2Assignments) {
  const counts = Object.fromEntries(cpuDocs.map(d => [d, 0]));
  const asgn = {};
  for (let day = 1; day <= daysInMonth(y, m); day++) {
    const date = isoDate(y, m, day);
    const sp = isSpecial(y, m, day);
    const available = cpuDocs.filter(d => {
      const code = avail[d]?.[date];
      if (code === "U" || code === "kD") return false;
      const inn2 = inn2Assignments[date];
      const curDt = new Date(`${date}T00:00:00`);
      const curSp = isSpecial(curDt.getFullYear(), curDt.getMonth(), curDt.getDate());
      // Same day: INN2 Vd or Spät blocks CPU; INN2 TD on weekend blocks CPU Früh
      if (inn2 && (inn2.visit === d)) return false;
      if (inn2 && inn2.day === d && curSp) return false; // TD weekend + CPU Früh: block
      // INN2 Spät/ND same day doesn't block CPU Früh (Früh is morning)
      // But INN2 ND blocks CPU (ND is overnight)
      if (inn2 && inn2.night === d) return false;
      // Previous day INN2 night shift → no CPU Früh today
      const prev = addDays(curDt, -1);
      const prevDate = isoDate(prev.getFullYear(), prev.getMonth(), prev.getDate());
      const prevInn2 = inn2Assignments[prevDate];
      if (prevInn2 && prevInn2.night === d) return false;
      return true;
    });
    // Sort by shift count (fairness)
    const sorted = [...available].sort((a, b) => (counts[a] || 0) - (counts[b] || 0) + (Math.random() - 0.5));
    const early = sorted[0] || "";
    if (early) counts[early]++;
    if (sp) {
      asgn[date] = { early, early2: "", late: "" };
    } else {
      const late = sorted.find(d => d !== early) || "";
      if (late) counts[late]++;
      asgn[date] = { early, early2: "", late };
    }
  }
  return { assignments: asgn, counts };
}

// ─── Pure helpers ─────────────────────────────────────────────────────────────

function daysInMonth(y, m)  { return new Date(y, m + 1, 0).getDate(); }
function monthKey(y, m)     { return `${y}-${String(m+1).padStart(2,"0")}`; }
function isoDate(y, m, d)   { return `${y}-${String(m+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`; }
function wdShort(y, m, d)   { return new Intl.DateTimeFormat("de-DE",{weekday:"short"}).format(new Date(y,m,d)); }
function monthLong(y, m)    { return new Intl.DateTimeFormat("de-DE",{month:"long",year:"numeric"}).format(new Date(y,m,1)); }
function addDays(date, n)   { const r=new Date(date); r.setDate(r.getDate()+n); return r; }
function isPast(y, m, now)  { return y<now.getFullYear()||(y===now.getFullYear()&&m<now.getMonth()); }
function isSat(y, m, d)    { return new Date(y,m,d).getDay()===6; }
function isSun(y, m, d)    { return new Date(y,m,d).getDay()===0; }
function isWknd(y, m, d)   { const w=new Date(y,m,d).getDay(); return w===0||w===6; }
function blanksBefore(y,m) { const w=new Date(y,m,1).getDay(); return w===0?6:w-1; }

function easter(year) {
  const a=year%19,b=Math.floor(year/100),c=year%100,d=Math.floor(b/4),e=b%4;
  const f=Math.floor((b+8)/25),g=Math.floor((b-f+1)/3),h=(19*a+b-d-g+15)%30;
  const i=Math.floor(c/4),k=c%4,l=(32+2*e+2*i-h-k)%7,mn=Math.floor((a+11*h+22*l)/451);
  return new Date(year,Math.floor((h+l-7*mn+114)/31)-1,((h+l-7*mn+114)%31)+1);
}

function holidaysRLP(year) {
  const e=easter(year); const map={};
  [[0,1,"Neujahr"],[4,1,"Tag der Arbeit"],[9,3,"Tag der Einheit"],[10,1,"Allerheiligen"],[11,25,"1. Weihnacht"],[11,26,"2. Weihnacht"]]
    .forEach(([m,d,n])=>{map[isoDate(year,m,d)]=n;});
  [[-2,"Karfreitag"],[1,"Ostermontag"],[39,"Himmelfahrt"],[50,"Pfingstmontag"],[60,"Fronleichnam"]]
    .forEach(([o,n])=>{const hd=addDays(e,o);map[isoDate(hd.getFullYear(),hd.getMonth(),hd.getDate())]=n;});
  return map;
}

function isSpecial(y,m,d) { return isWknd(y,m,d)||Boolean(holidaysRLP(y)[isoDate(y,m,d)]); }
function doctorNames(users) { return users.filter(u=>u.role==="doctor").map(u=>u.name).sort((a,b)=>a.localeCompare(b,"de",{sensitivity:"base"})); }

function initAvail(y,m,doctors) {
  const data={};
  doctors.forEach(doc=>{data[doc]={};for(let d=1;d<=daysInMonth(y,m);d++)data[doc][isoDate(y,m,d)]="";});
  return data;
}

function emptyA() { return {visit:"",day:"",night:""}; }
function votes(avail,date,code) { return Object.entries(avail).filter(([,dd])=>dd&&dd[date]===code).map(([d])=>d).sort((a,b)=>a.localeCompare(b,"de",{sensitivity:"base"})); }
function hasDoc(a,doc) { return Boolean(a&&(a.visit===doc||a.day===doc||a.night===doc)); }

function adjacentShift(assignments,date,doc) {
  if(!doc) return false;
  const cur=new Date(`${date}T00:00:00`);
  const curA=assignments[date]||{visit:"",day:"",night:""};
  // Check each adjacent day
  return [[-1],[1]].some(([offset])=>{
    const adj=addDays(cur,offset);
    const adjDate=isoDate(adj.getFullYear(),adj.getMonth(),adj.getDate());
    const adjA=assignments[adjDate];
    if(!adjA||!hasDoc(adjA,doc)) return false;
    // Allow: TD on special day + ND on next workday (doc had day shift, sleeps overnight, works next night)
    if(offset===1){
      // Current day → next day: allow if current is only TD (day) and next is only ND (night)
      const curIsDay=curA.day===doc&&curA.night!==doc&&curA.visit!==doc;
      const nextIsNight=adjA.night===doc&&adjA.day!==doc&&adjA.visit!==doc;
      const curSpec=isSpecial(cur.getFullYear(),cur.getMonth(),cur.getDate());
      if(curIsDay&&nextIsNight&&curSpec) return false; // allowed
    }
    if(offset===-1){
      // Previous day → current day: allow if prev is only TD and current is only ND
      const prevIsDay=adjA.day===doc&&adjA.night!==doc&&adjA.visit!==doc;
      const curIsNight=curA.night===doc&&curA.day!==doc&&curA.visit!==doc;
      const prevSpec=isSpecial(adj.getFullYear(),adj.getMonth(),adj.getDate());
      if(prevIsDay&&curIsNight&&prevSpec) return false; // allowed
    }
    return true; // blocked
  });
}

function blocked(avail,doc,date,y,m,d) {
  const code=avail[doc]?.[date];
  if(code==="U"||code==="kD") return true;
  // Block shift if next day is Urlaub (avoid working right before vacation)
  const cur=new Date(`${date}T00:00:00`);
  const nextDay=addDays(cur,1);
  if(avail[doc]?.[isoDate(nextDay.getFullYear(),nextDay.getMonth(),nextDay.getDate())]==="U") return true;
  if(!isSpecial(y,m,d)) return false;
  for(let o=-2;o<=2;o++){const c=addDays(cur,o);if(avail[doc]?.[isoDate(c.getFullYear(),c.getMonth(),c.getDate())]==="U")return true;}
  return false;
}

function pick(docs,avail,date,counts,pref,excl=[],assignments={}) {
  const ranked=docs
    .filter(d=>!excl.includes(d))
    .filter(d=>!adjacentShift(assignments,date,d))
    .filter(d=>{const p=new Date(`${date}T00:00:00`);return !blocked(avail,d,date,p.getFullYear(),p.getMonth(),p.getDate());})
    .map(d=>{const c=avail[d]?.[date]||"";let s=Math.random()*2+(counts[d]||0)*10;if(c===pref)s-=100;if(c==="DW")s-=40;if(c==="TW"&&pref==="DT")s-=100;if(c==="NW"&&pref==="DN")s-=100;if(c==="kD")s+=60;return{doc:d,s};})
    .sort((a,b)=>a.s-b.s);
  return ranked[0]?.doc||docs.find(d=>{if(excl.includes(d))return false;const p=new Date(`${date}T00:00:00`);return !blocked(avail,d,date,p.getFullYear(),p.getMonth(),p.getDate());})||"";
}

function schedule(docs,avail,y,m) {
  const counts=Object.fromEntries(docs.map(d=>[d,0]));
  const asgn={};let prevND=null;
  for(let day=1;day<=daysInMonth(y,m);day++){
    const date=isoDate(y,m,day);
    if(isSpecial(y,m,day)){
      const vd=isSat(y,m,day)?pick(docs,avail,date,counts,"Vd",[],asgn):"";
      if(vd)counts[vd]=(counts[vd]||0)+1;
      const dd=pick(docs,avail,date,counts,"DT",[vd].filter(Boolean),asgn);
      if(dd)counts[dd]=(counts[dd]||0)+1;
      const nd=pick(docs,avail,date,counts,"DN",[vd,dd,prevND].filter(Boolean),asgn);
      if(nd)counts[nd]=(counts[nd]||0)+1;
      asgn[date]={visit:vd,day:dd,night:nd};prevND=nd;
    } else {
      const nd=pick(docs,avail,date,counts,"DW",[prevND].filter(Boolean),asgn);
      if(nd)counts[nd]=(counts[nd]||0)+1;
      asgn[date]={visit:"",day:"",night:nd};prevND=nd;
    }
  }
  return{assignments:asgn,counts};
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&family=JetBrains+Mono:wght@400;500&display=swap');
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:'Inter',sans-serif;background:#f6f7f9;color:#121826;-webkit-font-smoothing:antialiased}
  .app{min-height:100vh;background:#f6f7f9}

  /* Login */
  .lw{min-height:100vh;display:flex;align-items:center;justify-content:center;background:#0a0a0a}
  .lc{background:#fff;border-radius:16px;padding:36px;width:100%;max-width:380px}
  .ll{width:48px;height:48px;background:#121826;border-radius:12px;display:flex;align-items:center;justify-content:center;margin:0 auto 18px}
  .ll svg{color:#fff}
  .lt{font-size:22px;font-weight:600;text-align:center;color:#121826;letter-spacing:-.03em}
  .ls{font-size:13px;color:#6b7280;text-align:center;margin:4px 0 24px}
  .fl{display:block;font-size:11px;font-weight:500;color:#6b7280;margin-bottom:5px;text-transform:uppercase;letter-spacing:.06em}
  .fi{width:100%;padding:10px 13px;border:1px solid #e5e7eb;border-radius:8px;font-size:14px;font-family:inherit;outline:none;background:#fafafa;color:#121826;transition:border-color .15s}
  .fi:focus{border-color:#121826;background:#fff}
  .fm{margin-bottom:12px}
  .lbtn{width:100%;padding:11px;background:#121826;color:#fff;border:none;border-radius:8px;font-size:14px;font-weight:500;font-family:inherit;cursor:pointer;letter-spacing:.01em;transition:background .15s,transform .1s;margin-top:4px}
  .lbtn:hover{background:#1e2a3d}
  .lbtn:active{transform:scale(.98)}
  .lerr{background:#fef2f2;color:#dc2626;border-radius:7px;padding:9px 12px;font-size:13px;margin-bottom:10px}
  .lhint{background:#f9fafb;border:1px solid #f3f4f6;border-radius:8px;padding:11px 13px;font-size:11px;color:#6b7280;margin-top:12px;line-height:1.9;font-family:'JetBrains Mono',monospace}

  /* Nav */
  .nav{background:#121826;color:#fff;padding:0 20px;display:flex;align-items:center;justify-content:space-between;height:54px;position:sticky;top:0;z-index:100}
  .nav-center{font-size:15px;font-weight:600;color:#fff;letter-spacing:.01em;position:absolute;left:50%;transform:translateX(-50%);pointer-events:none}
  .nb{display:flex;align-items:center;gap:10px}
  .nl{width:30px;height:30px;background:#374151;border-radius:7px;display:flex;align-items:center;justify-content:center}
  .nt{font-size:15px;font-weight:600;letter-spacing:-.02em}
  .nr{display:flex;align-items:center;gap:6px}
  .nu{font-size:12px;color:#9ca3af;padding:0 6px}
  .nbadge{font-size:11px;padding:3px 9px;background:#1e2a3d;color:#9ca3af;border-radius:20px;border:1px solid #374151}
  .nbadge.ok{background:rgba(20,83,45,.25);color:#4ade80;border-color:#166534}
  .navbtn{display:flex;align-items:center;gap:6px;background:#1e2a3d;border:1px solid #374151;color:#d1d5db;padding:6px 12px;border-radius:7px;font-size:12px;font-weight:500;font-family:inherit;cursor:pointer;transition:background .12s,color .12s;white-space:nowrap}
  .navbtn:hover{background:#374151;color:#fff}
  .navbtn svg{flex-shrink:0}

  /* Month bar */
  .mb{background:#fff;border-bottom:1px solid #f3f4f6;padding:10px 20px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px}
  .mbt{font-size:20px;font-weight:600;color:#121826;letter-spacing:-.03em}
  .mac{display:flex;align-items:center;gap:6px}

  /* Buttons */
  .btn{display:inline-flex;align-items:center;gap:6px;padding:7px 13px;border-radius:7px;font-size:12px;font-weight:500;font-family:inherit;cursor:pointer;transition:all .12s;border:1px solid transparent;white-space:nowrap}
  .bn{background:#121826;color:#fff;border-color:#121826}
  .bn:hover{background:#1e2a3d}
  .bn:disabled{opacity:.4;cursor:not-allowed}
  .bg{background:#fff;border-color:#e5e7eb;color:#374151}
  .bg:hover{background:#f9fafb;border-color:#d1d5db}
  .bsm{padding:5px 10px;font-size:11px}
  .bgreen{background:#f0fdf4;color:#166534;border-color:#bbf7d0}
  .bgreen:hover{background:#dcfce7}
  .bred{background:#fef2f2;color:#dc2626;border-color:#fecaca}
  .bred:hover{background:#fee2e2}
  .bpurple{background:#f5f3ff;color:#5b21b6;border-color:#ddd6fe}
  .bpurple:hover{background:#ede9fe}

  /* Toast */
  .toast{position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:#121826;color:#fff;padding:10px 20px;border-radius:30px;font-size:13px;font-weight:500;z-index:999;display:flex;align-items:center;gap:8px;pointer-events:none}

  /* Tabs */
  .tbar{background:#fff;padding:0 20px;border-bottom:1px solid #f3f4f6;display:flex}
  .tab{padding:11px 18px;font-size:13px;font-weight:500;color:#9ca3af;cursor:pointer;border-bottom:2.5px solid transparent;background:none;border-top:none;border-left:none;border-right:none;font-family:inherit;display:flex;align-items:center;gap:6px;transition:all .14s;letter-spacing:.01em}
  .tab:hover{color:#374151}
  .tab.on{color:#121826;font-weight:700;border-bottom-color:#121826}

  /* Content */
  .cnt{padding:18px 20px;max-width:1400px;margin:0 auto}

  /* Calendar grid */
  .ch{display:grid;grid-template-columns:repeat(7,1fr);gap:3px;margin-bottom:3px}
  .cwd{text-align:center;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:#fff;padding:6px 0;background:#121826;border-radius:5px}
  .cwd .wd-full{display:inline}
  .cwd .wd-short{display:none}
  .cgrid{display:grid;grid-template-columns:repeat(7,1fr);gap:3px}

  /* Calendar cells — weekday default */
  .cc{background:#f4f5f7;border:1px solid #eaecf0;border-radius:10px;padding:0;min-height:116px;display:flex;flex-direction:column;overflow:visible;position:relative}
  /* Grey bar at the top for weekend/holiday fills whole header area */
  .cc-head{padding:7px 9px 5px;display:flex;align-items:center;justify-content:space-between}
  .cc-body{padding:0 9px 8px;display:flex;flex-direction:column;gap:3px;flex:1}
  .cc.wknd .cc-head{background:#dde0ed}
  .cc.wknd{background:#eceef7;border-color:#d5d9ee}
  .cc.tod{border-color:#121826;box-shadow:0 0 0 1px #121826}
  .cc.mine{border-color:#2563eb;box-shadow:0 0 0 1px #2563eb}
  .cc.flagged{border-color:#f97316}
  .dn{font-size:12px;font-weight:600;color:#121826;display:flex;align-items:center;justify-content:space-between;width:100%}
  .tdot{width:5px;height:5px;background:#121826;border-radius:50%;flex-shrink:0}
  .mchip{font-size:8px;font-weight:600;color:#2563eb;background:#dbeafe;border-radius:20px;padding:1px 5px}
  .htag{font-size:8px;font-weight:600;color:#243b53;background:#dfe6ed;border-radius:3px;padding:2px 5px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;margin-bottom:1px}

  /* Shift pills */
  .sp{border-radius:6px;padding:3px 6px;font-size:10px;font-weight:500;display:flex;align-items:center;gap:3px;line-height:1.3}
  .sp .sl{font-size:8px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;opacity:.65;flex-shrink:0}
  .sp .sn{font-size:10px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  .svd{background:#fff7ed;color:#9a3412;border:1px solid #fed7aa}
  .std{background:#eff6ff;color:#1e40af;border:1px solid #bfdbfe}
  .snd{background:#f5f3ff;color:#5b21b6;border:1px solid #ddd6fe}
  .ol{opacity:.4;font-style:italic}
  .dtxt{font-size:8px;color:#9ca3af;margin-top:1px}
  .fbanner{background:#fff7ed;border-radius:5px;padding:2px 6px;font-size:8px;font-weight:600;color:#c2410c;display:flex;align-items:center;gap:3px;margin-top:1px}
  .rcbtn{margin-top:auto;padding:4px;background:#f9fafb;color:#374151;border:1px solid #e5e7eb;border-radius:6px;font-size:8px;font-weight:500;font-family:inherit;cursor:pointer;width:100%;transition:background .1s;margin:4px 9px 8px;width:calc(100% - 18px)}
  .rcbtn:hover{background:#f3f4f6}
  .rcbtn.rca{background:#fef2f2;color:#991b1b;border-color:#fecaca}
  .sickbtn{padding:4px;background:#fef2f2;color:#dc2626;border:1px solid #fecaca;border-radius:6px;font-size:8px;font-weight:600;cursor:pointer;width:calc(100% - 18px);margin:2px 9px 8px;transition:background .1s;font-family:inherit}
  .sickbtn:hover{background:#fee2e2}
  .sickbanner{background:#fef2f2;border:1px solid #fecaca;border-radius:5px;padding:3px 6px;font-size:8px;font-weight:600;color:#dc2626;display:flex;align-items:center;gap:3px}
  .cc.sick{border-color:#ef4444 !important;box-shadow:0 0 0 1.5px #ef4444 !important}
  .sickcard{background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:11px 13px}
  .sickcard.covered{background:#f0fdf4;border-color:#bbf7d0}
  .ban{border-radius:8px;padding:11px 14px;font-size:13px;margin-bottom:14px;display:flex;align-items:center;gap:8px;border:1px solid}
  .banb{background:#eff6ff;color:#1d4ed8;border-color:#bfdbfe}
  .bang{background:#f0fdf4;color:#166534;border-color:#bbf7d0}
  .bana{background:#f0f4f8;color:#243b53;border-color:#c8d6e5}

  /* Votes */
  .vgrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(128px,1fr));gap:7px}
  .vc{background:#fff;border:1px solid #f3f4f6;border-radius:9px;padding:9px}
  .vd{font-size:11px;font-weight:600;color:#121826;margin-bottom:5px}
  .vs{width:100%;padding:5px 7px;border:1px solid #e5e7eb;border-radius:6px;font-size:11px;font-family:inherit;outline:none;cursor:pointer;color:#121826;background:#fff}
  .vs:focus{border-color:#121826}

  /* Admin cards */
  .sc{background:#fff;border:1px solid #f3f4f6;border-radius:12px;padding:18px;margin-bottom:14px}
  .stit{font-size:14px;font-weight:600;color:#121826;margin-bottom:3px;display:flex;align-items:center;gap:7px}
  .ssub{font-size:12px;color:#6b7280;margin-bottom:14px}
  .aarow{display:flex;flex-wrap:wrap;gap:7px}

  /* Admin cal cells */
  .acc{background:#fff;border:1px solid #f3f4f6;border-radius:8px;padding:7px;min-height:152px;display:flex;flex-direction:column;gap:4px}
  .acc.sel{border-color:#121826;box-shadow:0 0 0 1px #121826}
  .sblk{border-radius:6px;padding:5px 7px}
  .svdb{background:#fff7ed}
  .stdb{background:#eff6ff}
  .sndb{background:#f5f3ff}
  .sbh{display:flex;align-items:center;justify-content:space-between;font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;margin-bottom:3px}
  .sbh.v{color:#c2410c}
  .sbh.t{color:#1d4ed8}
  .sbh.n{color:#5b21b6}
  .ssel{width:100%;padding:3px 5px;border:1px solid #e5e7eb;border-radius:4px;font-size:10px;font-family:inherit;background:#fff;cursor:pointer}
  .rmv{background:none;border:none;cursor:pointer;opacity:.45;color:inherit;display:flex;align-items:center;padding:0;transition:opacity .1s}
  .rmv:hover{opacity:1}
  .swpbtn{margin-top:auto;padding:4px 7px;background:#f9fafb;border:1px solid #e5e7eb;border-radius:5px;font-size:9px;font-weight:500;font-family:inherit;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:4px;color:#6b7280;transition:all .1s}
  .swpbtn:hover{background:#f3f4f6;color:#374151}
  .avdbtn{padding:4px 7px;background:#fff7ed;border:1px dashed #fed7aa;border-radius:5px;font-size:9px;font-weight:500;font-family:inherit;cursor:pointer;color:#c2410c;width:100%;text-align:center}

  /* Matrix */
  .mxw{overflow:auto;border-radius:8px;border:1px solid #f3f4f6}
  .mxt{border-collapse:collapse;width:100%;font-size:10px;white-space:nowrap}
  .mxt th,.mxt td{border:1px solid #f3f4f6;padding:3px 5px}
  .mxt thead th{background:#f9fafb;font-weight:600;text-align:center;color:#6b7280;position:sticky;top:0}
  .mxt thead th:first-child{text-align:left;min-width:105px}
  .mxt tbody td:first-child{background:#fff;position:sticky;left:0;font-weight:500;z-index:1}
  .mxs{display:inline-block;width:34px;padding:2px;border-radius:3px;font-size:10px;text-align:center;font-family:'JetBrains Mono',monospace}

  /* Doctor checks */
  .dcs{display:grid;grid-template-columns:repeat(auto-fill,minmax(155px,1fr));gap:5px}
  .dc{display:flex;align-items:center;gap:7px;background:#f9fafb;border-radius:7px;padding:7px 9px;font-size:12px;cursor:pointer}
  .dc input{accent-color:#121826}

  /* Add doctor */
  .adr{display:flex;gap:7px;flex-wrap:wrap}
  .adr input{flex:1;min-width:150px;padding:8px 12px;border:1px solid #e5e7eb;border-radius:7px;font-size:13px;font-family:inherit;outline:none}
  .adr input:focus{border-color:#121826}

  /* Trade */
  .tlist{display:flex;flex-direction:column;gap:7px;margin-top:14px}
  .tcard{background:#f0f4f8;border:1px solid #c8d6e5;border-radius:8px;padding:11px 13px}
  .tcard.ok{background:#f0fdf4;border-color:#bbf7d0}

  /* Legend */
  .leg{display:flex;flex-wrap:wrap;gap:5px}
  .li{display:inline-flex;align-items:center;gap:5px;padding:4px 9px;border-radius:20px;font-size:11px;font-weight:500;border:1px solid}

  /* Urlaub section */
  .urlaub-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:10px;margin-bottom:16px}
  .urlaub-card{background:#fff;border:1px solid #f3f4f6;border-radius:10px;padding:14px}
  .urlaub-months{display:flex;flex-wrap:wrap;gap:6px;margin-top:10px}
  .urlaub-month-pill{padding:3px 10px;border-radius:20px;font-size:11px;font-weight:500;cursor:pointer;border:1px solid #e5e7eb;background:#f9fafb;color:#374151;font-family:inherit;transition:all .12s}
  .urlaub-month-pill:hover{border-color:#121826;color:#121826}
  .urlaub-month-pill.uactive{background:#121826;color:#fff;border-color:#121826}
  .urlaub-day-grid{display:grid;grid-template-columns:repeat(7,1fr);gap:2px;margin-top:8px}
  .urlaub-day{padding:5px 0;text-align:center;font-size:11px;border-radius:5px;cursor:pointer;font-weight:500;color:#374151;background:#f9fafb;border:1px solid #f3f4f6;transition:all .1s}
  .urlaub-day:hover{background:#e5e7eb}
  .urlaub-day.usel{background:#6b21a8;color:#fff;border-color:#6b21a8}
  .urlaub-day.uwknd{background:#f0f0fa;color:#94a3b8}
  .urlaub-day.uwknd.usel{background:#6b21a8;color:#fff}
  .urlaub-day.blank{background:transparent;border-color:transparent;cursor:default}
  .urlaub-summary{background:#fdf4ff;border:1px solid #e9d5ff;border-radius:8px;padding:12px 14px;font-size:13px;color:#6b21a8;display:flex;align-items:center;gap:8px;margin-top:10px}

  /* PDF signature area */
  .sig-area{border:1px dashed #d1d5db;border-radius:8px;padding:18px 14px;text-align:center;color:#9ca3af;font-size:12px;min-height:60px;margin-top:8px}

  ::-webkit-scrollbar{width:4px;height:4px}
  ::-webkit-scrollbar-track{background:transparent}
  ::-webkit-scrollbar-thumb{background:#d1d5db;border-radius:10px}

  /* Approval animation */
  @keyframes slide-down{0%{transform:translateY(-100%);opacity:0}20%{transform:translateY(0);opacity:1}80%{transform:translateY(0);opacity:1}100%{transform:translateY(-100%);opacity:0}}
  .approve-bar{position:fixed;top:0;left:0;right:0;background:#121826;color:#fff;padding:16px 24px;text-align:center;font-size:15px;font-weight:600;z-index:300;animation:slide-down 3s ease-in-out forwards;display:flex;align-items:center;justify-content:center;gap:10px;letter-spacing:.01em}

  /* ── Mobile responsive ── */
  @media(max-width:768px){
    .nav{height:auto;padding:8px 12px;flex-wrap:wrap;gap:6px}
    .nav-center{display:none}
    .nb{gap:6px}
    .nt{font-size:13px}
    .nr{flex-wrap:wrap;gap:4px;justify-content:flex-end}
    .nu{font-size:11px;padding:0 3px}
    .nbadge{font-size:10px;padding:2px 7px}
    .navbtn{padding:5px 8px;font-size:11px;gap:4px}

    .mb{padding:8px 12px}
    .mbt{font-size:17px}
    .mac{gap:4px}
    .mac .btn{padding:6px 10px;font-size:11px}

    .tbar{padding:0 12px;overflow-x:auto}
    .tab{padding:9px 12px;font-size:12px;gap:4px;white-space:nowrap}

    .cnt{padding:10px}

    /* User calendar */
    .ch{gap:2px;margin-bottom:2px}
    .cwd{font-size:8px;padding:4px 0;letter-spacing:.04em;border-radius:3px}
    .cwd .wd-full{display:none}
    .cwd .wd-short{display:inline}
    .cgrid{gap:2px}
    .cc{min-height:78px;border-radius:7px}
    .cc-head{padding:4px 5px 2px}
    .cc-body{padding:0 5px 4px;gap:2px}
    .dn{font-size:10px}
    .mchip{font-size:6px;padding:1px 4px}
    .htag{font-size:6px;padding:1px 3px}
    .sp{padding:2px 3px;font-size:7px;gap:2px;border-radius:3px}
    .sp .sn{font-size:7px}
    .sp svg{width:6px;height:6px}
    .fbanner{font-size:6px;padding:1px 3px}
    .sickbanner{font-size:6px;padding:1px 3px}
    .rcbtn{font-size:7px;padding:3px;margin:2px 5px 4px;width:calc(100% - 10px)}
    .sickbtn{font-size:7px;padding:3px;margin:2px 5px 4px !important;width:calc(100% - 10px) !important}
    .dtxt{font-size:6px}

    /* Admin calendar — compact for mobile */
    .acc{min-height:90px;padding:4px;gap:2px;border-radius:6px}
    .acc strong{font-size:9px !important}
    .acc strong span{font-size:7px !important}
    .sblk{padding:3px 4px;border-radius:4px}
    .sbh{font-size:7px;margin-bottom:2px}
    .sbh svg{width:7px;height:7px}
    .ssel{font-size:8px;padding:2px 3px;border-radius:3px}
    .rmv svg{width:7px;height:7px}
    .swpbtn{font-size:7px;padding:2px 4px;gap:2px;border-radius:3px}
    .swpbtn svg{width:7px;height:7px}
    .avdbtn{font-size:7px;padding:3px 4px}

    /* Admin action buttons */
    .aarow{gap:5px;flex-direction:column}
    .aarow button{font-size:12px !important;padding:8px 12px !important;width:100%;justify-content:center;border-radius:7px !important}

    .sc{padding:12px;border-radius:10px;margin-bottom:10px}
    .sec{padding:12px;border-radius:10px;margin-bottom:10px}
    .stit{font-size:13px}
    .ssub{font-size:11px}
    .sec-t{font-size:13px}
    .sec-s{font-size:11px}

    .vgrid{grid-template-columns:repeat(auto-fill,minmax(100px,1fr));gap:5px}
    .vc{padding:7px}
    .vd{font-size:10px}
    .vs{font-size:10px;padding:4px 6px}

    .wgrid{gap:2px}
    .wcell{padding:4px;min-height:40px;gap:1px}
    .wcell .wday{font-size:10px}
    .wcell .wwd{font-size:7px}
    .wcell .wcode{font-size:8px;padding:1px 4px}
    .code-btns{gap:3px}
    .code-btn{font-size:10px;padding:3px 8px}

    .urlaub-day-grid{gap:1px}
    .urlaub-day{font-size:10px;padding:4px 0}

    .dcs{grid-template-columns:repeat(auto-fill,minmax(130px,1fr));gap:4px}
    .dc{padding:6px 8px;font-size:11px}
    .adr{gap:5px}
    .adr input{padding:7px 10px;font-size:12px;min-width:120px}

    .leg{gap:4px}
    .li{font-size:10px;padding:3px 7px}
    .li svg{width:8px;height:8px}

    .tlist{gap:5px}
    .tcard,.sickcard{padding:9px 11px;font-size:12px}

    .mxw{font-size:9px}
    .mxt th,.mxt td{padding:2px 3px}
    .mxs{width:28px;font-size:9px}

    .toast{font-size:12px;padding:8px 16px;bottom:16px}
  }

  @media(max-width:380px){
    .nav{padding:6px 8px}
    .navbtn{padding:4px 6px;font-size:10px}
    .cc{min-height:64px}
    .cc-head{padding:3px 4px 2px}
    .cc-body{padding:0 4px 3px}
    .sp{padding:1px 2px;font-size:6px}
    .mchip{display:none}
    .cwd{font-size:7px;padding:3px 0}
    .acc{min-height:72px;padding:3px;gap:1px}
    .sblk{padding:2px 3px}
    .ssel{font-size:7px}
    .sbh{font-size:6px}
    .swpbtn{font-size:6px;padding:2px 3px}
  }
`;

// ─── Component ────────────────────────────────────────────────────────────────

export default function App() {
  const today = new Date();
  const [users, setUsers]             = useState(doctorsSeed);
  const doctors                        = useMemo(()=>doctorNames(users),[users]);
  const [currentUser, setCurrentUser] = useState(null);
  const [email, setEmail]             = useState("");
  const [password, setPassword]       = useState("");
  const [regFirstName, setRegFirstName] = useState("");
  const [regLastName, setRegLastName]   = useState("");
  const [regPw2, setRegPw2]           = useState("");
  const [loginError, setLoginError]   = useState("");
  const [loginMode, setLoginMode]     = useState("login");
  const [view, setView]               = useState("calendar");
  const [year, setYear]               = useState(today.getFullYear());
  const [month, setMonth]             = useState(today.getMonth());
  const [avail, setAvail]             = useState(()=>initAvail(today.getFullYear(),today.getMonth(),doctorNames(doctorsSeed)));
  const [approvedM, setApprovedM]     = useState({});
  const [genByM, setGenByM]           = useState({});
  const [inclDocs, setInclDocs]       = useState(()=>Object.fromEntries(doctorNames(doctorsSeed).map(d=>[d,true])));
  const [newDocName, setNewDocName]   = useState("");
  const [newDocEmail, setNewDocEmail] = useState("");
  const [moveFrom, setMoveFrom]       = useState(null);
  const [trades, setTrades]           = useState([]);
  // Krankmeldungen: [{id, monthKey, date, shift, from, status:"open"|"covered", coveredBy}]
  const [sickReports, setSickReports] = useState([]);
  const [toast, setToast]             = useState(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [planGenerated, setPlanGenerated] = useState({});
  const [conflictInfo, setConflictInfo] = useState([]);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [removedUndo, setRemovedUndo] = useState(null);
  const [tradePickerReq, setTradePickerReq] = useState(null);
  const [tradePickerShifts, setTradePickerShifts] = useState([]);
  const [shiftAction, setShiftAction] = useState(null);
  // Dienst abgeben: [{id, monthKey, date, shift, from, status, takenBy}]
  const [giveaways, setGiveaways] = useState([]);
  // CPU state
  const [cpuGenByM, setCpuGenByM] = useState({});
  const [cpuApprovedM, setCpuApprovedM] = useState({});
  const [cpuSick, setCpuSick] = useState([]);
  const [cpuTrades, setCpuTrades] = useState([]);
  const [cpuDoctors, setCpuDoctors] = useState(cpuDoctors_INIT);
  const [newCpuDoc, setNewCpuDoc] = useState(""); // {date, shift}
  const [showPwChange, setShowPwChange] = useState(false);
  const [pwOld, setPwOld]             = useState("");
  const [pwNew, setPwNew]             = useState("");
  const [pwNew2, setPwNew2]           = useState("");
  // Urlaub: { doctorName: ["2026-01-05", ...] }
  const [urlaubDays, setUrlaubDays]   = useState({});
  // Urlaub picker state
  const [urlaubPickYear, setUrlaubPickYear]   = useState(today.getFullYear());
  const [urlaubPickMonth, setUrlaubPickMonth] = useState(today.getMonth());
  const [urlaubFrom, setUrlaubFrom] = useState("");
  const [urlaubTo, setUrlaubTo]     = useState("");

  const key       = monthKey(year,month);
  const isAdmin   = currentUser?.role==="admin";
  const approved  = Boolean(approvedM[key]);
  const pastMonth = isPast(year,month,today);
  const days      = useMemo(()=>Array.from({length:daysInMonth(year,month)},(_,i)=>i+1),[year,month]);
  const selDocs   = useMemo(()=>doctors.filter(d=>inclDocs[d]!==false),[doctors,inclDocs]);
  const suggested = useMemo(()=>schedule(selDocs,avail,year,month),[selDocs,avail,year,month]);
  const assignments = genByM[key] || {};
  const monthTitle  = monthLong(year,month);
  const holidays    = useMemo(()=>holidaysRLP(year),[year]);
  const todayStr    = isoDate(today.getFullYear(),today.getMonth(),today.getDate());
  const blanks      = blanksBefore(year,month);
  const cpuAssignments = cpuGenByM[key] || {};
  const cpuApproved = Boolean(cpuApprovedM[key]);

  // Next month for wishes when current is approved
  const nextMDate   = new Date(year,month+1,1);
  const nextY       = nextMDate.getFullYear();
  const nextM       = nextMDate.getMonth();
  const nextMTitle  = monthLong(nextY,nextM);
  const nextMDays   = useMemo(()=>Array.from({length:daysInMonth(nextY,nextM)},(_,i)=>i+1),[nextY,nextM]);
  const nextMBlanks = blanksBefore(nextY,nextM);
  const nextMKey    = monthKey(nextY,nextM);
  const nextMApproved = Boolean(approvedM[nextMKey]);

  // Sync availability for new months / new doctors
  useEffect(()=>{
    setAvail(prev=>{
      let updated={...prev}; let changed=false;
      doctors.forEach(doc=>{
        if(!updated[doc]){updated={...updated,[doc]:{}};changed=true;}
        // Current month
        days.forEach(d=>{
          const date=isoDate(year,month,d);
          if(!(date in updated[doc])){updated={...updated,[doc]:{...updated[doc],[date]:""}}; changed=true;}
        });
        // Next month (for wishes when current is approved)
        nextMDays.forEach(d=>{
          const date=isoDate(nextY,nextM,d);
          if(!(date in updated[doc])){updated={...updated,[doc]:{...updated[doc],[date]:""}}; changed=true;}
        });
      });
      const myUrlaub = urlaubDays[currentUser?.name]||[];
      if(currentUser&&!isAdmin){
        [...days.map(d=>isoDate(year,month,d)),...nextMDays.map(d=>isoDate(nextY,nextM,d))].forEach(date=>{
          if(myUrlaub.includes(date)&&updated[currentUser.name]?.[date]!=="U"){
            updated={...updated,[currentUser.name]:{...updated[currentUser.name],[date]:"U"}};changed=true;
          }
        });
      }
      return changed?updated:prev;
    });
  },[year,month,doctors,urlaubDays,currentUser,nextY,nextM,nextMDays]);

  function showToast(msg,duration=2400){setToast(msg);setTimeout(()=>setToast(null),duration);}
  function showSuccess(msg){setToast(msg);setTimeout(()=>setToast(null),4000);}

  function login(){
    const input=email.trim().toLowerCase();
    const user=users.find(u=>
      (u.email.toLowerCase()===input || u.name.toLowerCase()===input) && u.password===password
    );
    if(!user){setLoginError("Falsche Anmeldedaten. Versuchen Sie z.B. admin / 1234");return;}
    const effective = user.role==="removed"?{...user,role:"doctor"}:user;
    setCurrentUser(effective);setLoginError("");setView(effective.role==="admin"?"admin":"calendar");setLoginMode("login");
  }
  function register(){
    const e=email.trim().toLowerCase(),p=password,fn=regFirstName.trim(),ln=regLastName.trim();
    if(!fn||!ln){setLoginError("Vor- und Nachname erforderlich");return;}
    if(/\d/.test(fn)||/\d/.test(ln)){setLoginError("Name darf keine Zahlen enthalten");return;}
    if(!e){setLoginError("Benutzername erforderlich");return;}
    if(!p||p.length<4){setLoginError("Passwort (min. 4 Zeichen) erforderlich");return;}
    if(p!==regPw2){setLoginError("Passwörter stimmen nicht überein");return;}
    if(users.some(u=>u.email.toLowerCase()===e)){setLoginError("E-Mail bereits registriert");return;}
    const name=ln;
    const newUser={name,firstName:fn,email:e,password:p,role:"doctor",createdAt:Date.now()};
    const next=[...users,newUser];
    setUsers(next);setInclDocs(o=>({...o,[name]:true}));
    setCurrentUser(newUser);setLoginError("");setView("calendar");setLoginMode("login");
    setRegFirstName("");setRegLastName("");setRegPw2("");
  }
  function forgotPw(){
    const user=users.find(u=>u.email.toLowerCase()===email.trim().toLowerCase());
    if(!user){setLoginError("E-Mail nicht gefunden");return;}
    showToast("Passwort: "+user.password);setLoginMode("login");setLoginError("");
  }
  function changePassword(){
    if(!pwOld||!pwNew||!pwNew2){showToast("Alle Felder ausfüllen");return;}
    if(currentUser.password!==pwOld){showToast("Aktuelles Passwort ist falsch");return;}
    if(pwNew.length<4){showToast("Neues Passwort: min. 4 Zeichen");return;}
    if(pwNew!==pwNew2){showToast("Neue Passwörter stimmen nicht überein");return;}
    setUsers(o=>o.map(u=>u.email===currentUser.email?{...u,password:pwNew}:u));
    setCurrentUser({...currentUser,password:pwNew});
    setPwOld("");setPwNew("");setPwNew2("");setShowPwChange(false);
    showToast("Passwort geändert ✓");
  }
  function logout(){setCurrentUser(null);setView("calendar");setShowPwChange(false);}
  function changeMonth(offset){const n=new Date(year,month+offset,1);setYear(n.getFullYear());setMonth(n.getMonth());setMoveFrom(null);}

  function updateCode(doc,date,code){
    if(!isAdmin&&currentUser?.name!==doc) return;
    const [dy,dm]=date.split("-").map(Number);
    const dateMonthKey=monthKey(dy,dm-1);
    if(Boolean(approvedM[dateMonthKey])&&!isAdmin) return;
    // Block consecutive shift wishes — allow U, kD on any day
    if(code&&code!=="U"&&code!=="kD"&&!isAdmin){
      const dt=new Date(`${date}T00:00:00`);
      const prev=addDays(dt,-1);const next=addDays(dt,1);
      const prevDate=isoDate(prev.getFullYear(),prev.getMonth(),prev.getDate());
      const nextDate=isoDate(next.getFullYear(),next.getMonth(),next.getDate());
      const prevCode=avail[doc]?.[prevDate]||"";
      const nextCode=avail[doc]?.[nextDate]||"";
      const shiftCodes=["DW","TW","NW"];
      // Rule: after night shift (NW or DW) next day is blocked
      // After day shift (TW) next day is allowed
      if(shiftCodes.includes(prevCode)){
        const prevIsNight=(prevCode==="NW"||prevCode==="DW");
        if(prevIsNight){showToast("Nach Nachtdienst ist der Folgetag gesperrt.");return;}
      }
      if(shiftCodes.includes(nextCode)){
        const curIsNight=(code==="NW"||code==="DW");
        if(curIsNight){showToast("Nach Nachtdienst ist der Folgetag gesperrt.");return;}
      }
    }
    setAvail(o=>({...o,[doc]:{...(o[doc]||{}),[date]:code}}));
  }

  // Toggle a single day as Urlaub for current user
  function toggleUrlaubDay(date){
    const name=currentUser.name;
    setUrlaubDays(prev=>{
      const cur=prev[name]||[];
      const next=cur.includes(date)?cur.filter(d=>d!==date):[...cur,date];
      return{...prev,[name]:next};
    });
    setAvail(prev=>{
      const cur=(prev[name]||{})[date];
      const newCode=cur==="U"?"":"U";
      return{...prev,[name]:{...(prev[name]||{}),[date]:newCode}};
    });
  }

  function applyUrlaubRange(){
    if(!urlaubFrom||!urlaubTo){showToast("Von- und Bis-Datum eingeben");return;}
    const start=new Date(urlaubFrom+"T00:00:00");
    const end=new Date(urlaubTo+"T00:00:00");
    if(start>end){showToast("Von muss vor Bis liegen");return;}
    const name=currentUser.name;
    const newDays=[];
    const cur=new Date(start);
    while(cur<=end){
      newDays.push(isoDate(cur.getFullYear(),cur.getMonth(),cur.getDate()));
      cur.setDate(cur.getDate()+1);
    }
    setUrlaubDays(prev=>{
      const existing=prev[name]||[];
      return{...prev,[name]:[...new Set([...existing,...newDays])]};
    });
    setAvail(prev=>{
      const updated={...prev,[name]:{...(prev[name]||{})}};
      newDays.forEach(d=>{updated[name][d]="U";});
      return updated;
    });
    setUrlaubFrom("");setUrlaubTo("");
    showToast(newDays.length+" Urlaubstage eingetragen");
  }

  function generatePlan(){
    if(pastMonth){showToast("Vergangene Monate können nicht generiert werden.");return;}
    // Exclude CPU doctors from INN2 unless they have a specific DW/TW/NW wish
    const inn2Docs=selDocs.filter(d=>{
      if(!cpuDoctors.includes(d))return true;
      // CPU doctor: only include if they have shift wishes this month
      return days.some(day=>{const code=avail[d]?.[isoDate(year,month,day)]||"";return["DW","TW","NW"].includes(code);});
    });
    const shuffled=[...inn2Docs].sort(()=>Math.random()-.5);
    setGenByM(o=>({...o,[key]:schedule(shuffled,avail,year,month).assignments}));
    setApprovedM(o=>({...o,[key]:false}));
    setPlanGenerated(o=>({...o,[key]:true}));
    setConflictInfo([]);
    setView("admin");
  }

  function updateAssignment(date,shift,doc){
    const cur=genByM[key]||assignments;
    if(doc&&avail[doc]?.[date]==="U"){showToast(`${doc} hat Urlaub an diesem Tag.`);return;}
    if(doc&&avail[doc]?.[date]==="kD"){showToast(`${doc}: Dienst unerwünscht.`);return;}
    // Block same-day duplicate
    if(doc){
      const existing=cur[date]||emptyA();
      const otherShifts=Object.entries(existing).filter(([s,d2])=>s!==shift&&d2===doc);
      if(otherShifts.length){showToast(`${doc} hat bereits einen anderen Dienst an diesem Tag.`);return;}
    }
    // Block CPU doctors from INN2 based on specific shift combinations
    if(doc&&cpuDoctors.includes(doc)){
      const cpuCur=cpuGenByM[key]||{};
      const cpuDay=cpuCur[date]||emptyCPU();
      const dt=new Date(`${date}T00:00:00`);
      const sp=isSpecial(year,month,dt.getDate());
      // Same day rules:
      // CPU Spät + INN2 weekday: BLOCK
      if(cpuDay.late===doc){showToast(`${doc} hat CPU-Spätdienst am selben Tag.`);return;}
      // CPU Früh + INN2 TD on weekend: BLOCK
      if((cpuDay.early===doc||cpuDay.early2===doc)&&sp&&shift==="day"){showToast(`${doc} hat CPU-Frühdienst — kein Tagdienst am Wochenende.`);return;}
      // CPU Früh weekday + INN2 weekday: ALLOW (Früh ends before ND starts)
      // CPU Früh weekend + INN2 ND weekend: ALLOW
      // CPU Früh + INN2 Vd: BLOCK (Vd is full day)
      if((cpuDay.early===doc||cpuDay.early2===doc)&&shift==="visit"){showToast(`${doc} hat CPU-Frühdienst — kein Visitendienst.`);return;}
      // Previous day: INN2 ND yesterday → no CPU Früh today (checked in CPU side)
      // Next day: check if INN2 ND today would block CPU Früh tomorrow
      const nextD=addDays(dt,1);const nextDate=isoDate(nextD.getFullYear(),nextD.getMonth(),nextD.getDate());
      const cpuNext=cpuCur[nextDate]||emptyCPU();
      if(shift==="night"&&cpuNext.early===doc){showToast(`${doc} hat CPU-Frühdienst am Folgetag.`);return;}
    }
    setGenByM(o=>({...o,[key]:{...cur,[date]:{...(cur[date]||emptyA()),[shift]:doc}}}));
    setApprovedM(o=>({...o,[key]:false}));
    setPlanGenerated(o=>({...o,[key]:true}));
    setConflictInfo([]);
  }

  function findConflicts(plan){
    const conflicts=[];
    const addedIds=new Set();
    Object.keys(plan).forEach(date=>{
      const a=plan[date]||emptyA();
      // Same-day duplicate
      const assigned=[a.visit,a.day,a.night].filter(Boolean);
      const seen={};
      assigned.forEach(doc=>{seen[doc]=(seen[doc]||0)+1;});
      Object.entries(seen).forEach(([doc,count])=>{
        if(count>1){const id=`dup-${doc}-${date}`;if(!addedIds.has(id)){addedIds.add(id);conflicts.push({type:"duplicate",doc,date,dates:[date],msg:`${doc} hat mehrere Dienste am ${date}`});}}
      });
      // Adjacent shifts — mark BOTH days
      [a.visit,a.day,a.night].filter(Boolean).forEach(doc=>{
        if(adjacentShift(plan,date,doc)){
          const cur=new Date(`${date}T00:00:00`);
          [[addDays(cur,-1)],[addDays(cur,1)]].forEach(([adj])=>{
            const adjDate=isoDate(adj.getFullYear(),adj.getMonth(),adj.getDate());
            if(hasDoc(plan[adjDate],doc)){
              const pair=[date,adjDate].sort().join("+");
              const id=`adj-${doc}-${pair}`;
              if(!addedIds.has(id)){
                addedIds.add(id);
                conflicts.push({type:"adjacent",doc,date,dates:[date,adjDate],msg:`${doc}: aufeinanderfolgende Dienste ${date} / ${adjDate}`});
              }
            }
          });
        }
      });
    });
    return conflicts;
  }

  function approvePlan(){
    if(approved){showToast("Dienstplan ist bereits freigegeben.");return;}
    // Check if plan has been generated
    if(!planGenerated[key]&&!Object.keys(assignments).length){
      showToast("Bitte zuerst Generieren drücken.");return;
    }
    // Check for too many empty shifts (>10%)
    let totalSlots=0,emptySlots=0;
    days.forEach(d=>{
      const date=isoDate(year,month,d);
      const a=assignments[date]||emptyA();
      const sp=isSpecial(year,month,d);
      // Night shift always required
      totalSlots++;if(!a.night)emptySlots++;
      if(sp){
        // Day shift required on special days
        totalSlots++;if(!a.day)emptySlots++;
      }
    });
    if(totalSlots>0&&(emptySlots/totalSlots)>0.1){
      showToast(`Zu viele offene Dienste (${emptySlots}/${totalSlots}). Bitte Generieren oder manuell zuweisen.`);return;
    }
    const conflicts=findConflicts(assignments);
    if(conflicts.length){
      setConflictInfo(conflicts);
      showToast("Freigabe blockiert — siehe markierte Fehler");
      return;
    }
    setConflictInfo([]);
    setGenByM(o=>({...o,[key]:assignments}));
    setApprovedM(o=>({...o,[key]:true}));
    setPlanGenerated(o=>({...o,[key]:false}));
    setShowConfetti(true);
    setTimeout(()=>setShowConfetti(false),3500);
    showSuccess("🎉 Dienstplan freigegeben!");
  }

  function swapDates(targetDate){
    if(!moveFrom||moveFrom===targetDate){setMoveFrom(targetDate);return;}
    const cur=genByM[key]||assignments;
    const next={...cur,[moveFrom]:cur[targetDate]||emptyA(),[targetDate]:cur[moveFrom]||emptyA()};
    if(findConflicts(next).length){showToast("Tausch blockiert: Konflikt erkannt.");setMoveFrom(null);return;}
    setGenByM(o=>({...o,[key]:next}));
    setMoveFrom(null);
    setApprovedM(o=>({...o,[key]:false}));
  }

  function requestTrade(date,shift){
    const aDoc=assignments[date]?.[shift];
    const id=`${key}-${date}-${shift}-${aDoc||"open"}`;
    if(trades.some(r=>r.id===id&&r.status==="open"))return;
    setTrades([...trades,{id,monthKey:key,date,shift,from:aDoc||currentUser.name,status:"open",offers:[]}]);
  }

  function offerTrade(req){
    if(isAdmin||req.from===currentUser.name)return;
    const cur=genByM[key]||assignments;
    const myShifts=[];
    // Only offer same shift type: visit<->visit, day/night<->day/night
    const reqIsVisit=req.shift==="visit";
    Object.keys(cur).forEach(d=>{
      if(d<todayStr)return;
      const a=cur[d];if(!a)return;
      if(reqIsVisit){
        // Visitendienst can only be traded for Visitendienst
        if(a.visit===currentUser.name) myShifts.push({date:d,shift:"visit",label:`Vd ${fmtDate(d)}`});
      } else {
        // Day/night shifts can trade with each other but NOT with Vd
        if(a.day===currentUser.name) myShifts.push({date:d,shift:"day",label:`TD ${fmtDate(d)}`});
        if(a.night===currentUser.name) myShifts.push({date:d,shift:"night",label:`ND ${fmtDate(d)}`});
      }
    });
    if(!myShifts.length){showToast(reqIsVisit?"Keine Visitendienste zum Tausch.":"Keine passenden Dienste zum Tausch.");return;}
    if(myShifts.length===1){
      submitTradeOffers(req,[myShifts[0]]);
    } else {
      setTradePickerReq(req);
      setTradePickerShifts(myShifts.map(s=>({...s,selected:false})));
    }
  }

  function submitTradeOffers(req,shifts){
    setTrades(prev=>prev.map(r=>{
      if(r.id!==req.id)return r;
      const newOffers=[...(r.offers||[])];
      shifts.forEach(s=>{
        const oid=`${req.id}-${currentUser.name}-${s.date}-${s.shift}`;
        if(!newOffers.some(o=>o.id===oid)){
          newOffers.push({id:oid,doctor:currentUser.name,date:s.date,shift:s.shift});
        }
      });
      return{...r,offers:newOffers};
    }));
    setTradePickerReq(null);
    setTradePickerShifts([]);
    showToast(shifts.length>1?`${shifts.length} Dienste angeboten`:"Tauschangebot gesendet");
  }

  // Format date as DD.MM
  function fmtDate(d){return d.slice(8,10)+"."+d.slice(5,7);}

  // Check if user would have adjacent shifts after taking a date
  function wouldHaveAdjacent(doc,date){
    const cur=genByM[key]||assignments;
    const dt=new Date(`${date}T00:00:00`);
    return[-1,1].some(o=>{const adj=addDays(dt,o);const adjD=isoDate(adj.getFullYear(),adj.getMonth(),adj.getDate());return hasDoc(cur[adjD],doc);});
  }

  function acceptOffer(req,offer){
    if(isAdmin||req.from!==currentUser.name)return;
    // Check adjacent shifts for both doctors after swap
    if(wouldHaveAdjacent(offer.doctor,req.date)){showToast(`${offer.doctor} hat einen Dienst am Vor-/Folgetag.`);return;}
    if(wouldHaveAdjacent(req.from,offer.date)){showToast(`${req.from} hat einen Dienst am Vor-/Folgetag.`);return;}
    const cur=genByM[key]||assignments;
    setGenByM(o=>({...o,[key]:{...cur,[req.date]:{...cur[req.date],[req.shift]:offer.doctor},[offer.date]:{...cur[offer.date],[offer.shift]:req.from}}}));
    setTrades(trades.map(r=>r.id===req.id?{...r,status:"accepted",acceptedOffer:offer}:r));
    showSuccess(`🎉 Dienst erfolgreich getauscht mit ${offer.doctor}`);
  }

  function reportSick(date,shift){
    const doc=assignments[date]?.[shift];
    if(!doc)return;
    const id=`sick-${key}-${date}-${shift}-${doc}`;
    if(sickReports.some(r=>r.id===id&&(r.status==="open"||r.status==="covered")))return;
    setSickReports(prev=>[...prev,{id,monthKey:key,date,shift,from:doc,status:"open",coveredBy:null}]);
    showToast("Krankmeldung eingereicht");
  }

  function coverSick(report){
    if(report.from===currentUser.name||isAdmin)return;
    if(wouldHaveAdjacent(currentUser.name,report.date)){showToast("Sie haben bereits einen Dienst am Vor-/Folgetag.");return;}
    const cur=genByM[key]||assignments;
    setGenByM(o=>({...o,[key]:{...cur,[report.date]:{...cur[report.date],[report.shift]:currentUser.name}}}));
    setSickReports(sickReports.map(r=>r.id===report.id?{...r,status:"covered",coveredBy:currentUser.name}:r));
    showSuccess(`🎉 Danke! Sie übernehmen den Dienst von ${report.from}`);
  }

  function uncoverSick(report){
    if(report.coveredBy!==currentUser.name)return;
    const cur=genByM[key]||assignments;
    setGenByM(o=>({...o,[key]:{...cur,[report.date]:{...cur[report.date],[report.shift]:report.from}}}));
    setSickReports(sickReports.map(r=>r.id===report.id?{...r,status:"open",coveredBy:null}:r));
    showToast("Übernahme zurückgezogen");
  }

  function giveAwayShift(date,shift){
    const doc=assignments[date]?.[shift];
    if(!doc)return;
    const id=`give-${key}-${date}-${shift}-${doc}`;
    if(giveaways.some(g=>g.id===id&&g.status==="open"))return;
    setGiveaways(prev=>[...prev,{id,monthKey:key,date,shift,from:doc,status:"open",takenBy:null}]);
    showToast("Dienst zur Abgabe freigegeben");
  }

  function takeGiveaway(g){
    if(g.from===currentUser.name||isAdmin)return;
    if(wouldHaveAdjacent(currentUser.name,g.date)){showToast("Sie haben bereits einen Dienst am Vor-/Folgetag.");return;}
    const cur=genByM[key]||assignments;
    setGenByM(o=>({...o,[key]:{...cur,[g.date]:{...cur[g.date],[g.shift]:currentUser.name}}}));
    setGiveaways(giveaways.map(r=>r.id===g.id?{...r,status:"taken",takenBy:currentUser.name}:r));
    showSuccess(`🎉 Dienst von ${g.from} übernommen`);
  }

  function withdrawGiveaway(g){
    setGiveaways(giveaways.filter(r=>r.id!==g.id));
    showToast("Abgabe zurückgezogen");
  }

  // ── CPU functions ─────────────────────────────────────────────────────────
  function generateCPU(){
    if(pastMonth){showToast("Vergangene Monate nicht generierbar.");return;}
    const activeCPU=cpuDoctors.filter(d=>users.some(u=>u.name===d));
    const inn2=genByM[key]||assignments;
    const result=scheduleCPU(activeCPU,avail,year,month,inn2);
    setCpuGenByM(o=>({...o,[key]:result.assignments}));
    setCpuApprovedM(o=>({...o,[key]:false}));
    showToast("CPU-Dienstplan generiert");
  }

  function updateCPUAssignment(date,shift,doc){
    const cur=cpuGenByM[key]||{};
    if(doc){
      const inn2=genByM[key]||assignments;
      const inn2Day=inn2[date]||emptyA();
      const dt=new Date(`${date}T00:00:00`);
      const sp=isSpecial(dt.getFullYear(),dt.getMonth(),dt.getDate());
      // CPU Früh same day rules:
      if(shift==="early"){
        // Block if INN2 Vd or TD same day
        if(inn2Day.visit===doc){showToast(`${doc} hat INN2-Visitendienst am selben Tag.`);return;}
        if(inn2Day.day===doc){showToast(`${doc} hat INN2-Tagdienst am selben Tag.`);return;}
        // CPU Früh + INN2 ND same day: ALLOWED (Früh ends, ND starts later)
      }
      // CPU Spät same day: block all INN2
      if(shift==="late"){
        if(inn2Day.visit===doc||inn2Day.day===doc||inn2Day.night===doc){showToast(`${doc} hat INN2-Dienst am selben Tag.`);return;}
      }
      // Previous day: INN2 ND yesterday → no CPU Früh today
      const prev=addDays(dt,-1);const pD=isoDate(prev.getFullYear(),prev.getMonth(),prev.getDate());
      const pInn2=inn2[pD];
      if(shift==="early"&&pInn2&&pInn2.night===doc){showToast(`${doc} hat INN2-Nachtdienst am Vortag.`);return;}
      // Next day: INN2 any shift → block CPU Spät (need rest), but CPU Früh is ok before INN2 ND
      const next=addDays(dt,1);const nD=isoDate(next.getFullYear(),next.getMonth(),next.getDate());
      const nInn2=inn2[nD];
      if(shift==="late"&&nInn2&&(nInn2.visit===doc||nInn2.day===doc||nInn2.night===doc)){showToast(`${doc} hat INN2-Dienst am Folgetag.`);return;}
      // Block if U or kD
      const code=avail[doc]?.[date];
      if(code==="U"){showToast(`${doc} hat Urlaub.`);return;}
      if(code==="kD"){showToast(`${doc}: Dienst unerwünscht.`);return;}
      // Block same-day duplicate in CPU
      const existing=cur[date]||emptyCPU();
      if(shift==="early"&&(existing.late===doc||existing.early2===doc)){showToast(`${doc} hat bereits einen anderen CPU-Dienst.`);return;}
      if(shift==="early2"&&(existing.early===doc||existing.late===doc)){showToast(`${doc} hat bereits einen anderen CPU-Dienst.`);return;}
      if(shift==="late"&&(existing.early===doc||existing.early2===doc)){showToast(`${doc} hat bereits einen anderen CPU-Dienst.`);return;}
    }
    setCpuGenByM(o=>({...o,[key]:{...cur,[date]:{...(cur[date]||emptyCPU()),[shift]:doc}}}));
    setCpuApprovedM(o=>({...o,[key]:false}));
  }

  function approveCPU(){
    if(cpuApproved){showToast("CPU-Plan ist bereits freigegeben.");return;}
    let empty=0,total=0;
    days.forEach(d=>{
      const date=isoDate(year,month,d);const sp=isSpecial(year,month,d);const c=cpuAssignments[date]||emptyCPU();
      total++;if(!c.early)empty++;
      if(!sp){total++;if(!c.late)empty++;}
    });
    if(total>0&&(empty/total)>0.1){showToast(`CPU: Zu viele offene Dienste (${empty}/${total}).`);return;}
    setCpuGenByM(o=>({...o,[key]:cpuAssignments}));
    setCpuApprovedM(o=>({...o,[key]:true}));
    setShowConfetti(true);setTimeout(()=>setShowConfetti(false),3500);
    showSuccess("🎉 CPU-Dienstplan freigegeben!");
  }

  function cpuReportSick(date,shift){
    const c=cpuAssignments[date];const doc=c?.[shift];if(!doc)return;
    const id=`cpusick-${key}-${date}-${shift}-${doc}`;
    if(cpuSick.some(r=>r.id===id&&r.status==="open"))return;
    setCpuSick(prev=>[...prev,{id,monthKey:key,date,shift,from:doc,status:"open",coveredBy:null}]);
    showToast("CPU-Krankmeldung eingereicht");
  }

  function cpuCoverSick(report){
    if(report.from===currentUser.name)return;
    if(!cpuDoctors.includes(currentUser.name)){showToast("Nur CPU-Ärzte können CPU-Dienste übernehmen.");return;}
    const cur=cpuGenByM[key]||{};
    const existing=cur[report.date]||emptyCPU();
    const otherShift=report.shift==="early"?existing.late:existing.early;
    if(otherShift===currentUser.name){showToast("Sie haben bereits den anderen CPU-Dienst an diesem Tag.");return;}
    setCpuGenByM(o=>({...o,[key]:{...cur,[report.date]:{...cur[report.date],[report.shift]:currentUser.name}}}));
    setCpuSick(cpuSick.map(r=>r.id===report.id?{...r,status:"covered",coveredBy:currentUser.name}:r));
    showSuccess(`🎉 CPU-Dienst von ${report.from} übernommen`);
  }

  function cpuRequestTrade(date,shift){
    const c=cpuAssignments[date];const doc=c?.[shift];if(!doc)return;
    const id=`cputrade-${key}-${date}-${shift}-${doc}`;
    if(cpuTrades.some(r=>r.id===id&&r.status==="open"))return;
    setCpuTrades(prev=>[...prev,{id,monthKey:key,date,shift,from:doc,status:"open",offers:[]}]);
    showToast("CPU-Tauschanfrage gesendet");
  }

  function cpuOfferTrade(req){
    if(req.from===currentUser.name||!cpuDoctors.includes(currentUser.name))return;
    const cpuCur=cpuGenByM[key]||{};
    const myShifts=[];
    Object.keys(cpuCur).forEach(d=>{
      if(d<todayStr)return;
      const c=cpuCur[d];if(!c)return;
      if(c.early===currentUser.name) myShifts.push({date:d,shift:"early",label:`Früh ${fmtDate(d)}`});
      if(c.late===currentUser.name) myShifts.push({date:d,shift:"late",label:`Spät ${fmtDate(d)}`});
    });
    if(!myShifts.length){showToast("Keine CPU-Dienste zum Tausch.");return;}
    // Auto-submit all as offers
    setCpuTrades(prev=>prev.map(r=>{
      if(r.id!==req.id)return r;
      const newOffers=[...(r.offers||[])];
      myShifts.forEach(s=>{
        const oid=`${req.id}-${currentUser.name}-${s.date}-${s.shift}`;
        if(!newOffers.some(o=>o.id===oid)) newOffers.push({id:oid,doctor:currentUser.name,date:s.date,shift:s.shift});
      });
      return{...r,offers:newOffers};
    }));
    showToast(`${myShifts.length} CPU-Dienst(e) angeboten`);
  }

  function cpuAcceptOffer(req,offer){
    if(req.from!==currentUser.name)return;
    const cpuCur=cpuGenByM[key]||{};
    // Check: can't have both Früh and Spät on same day after swap
    const reqDateCpu=cpuCur[req.date]||emptyCPU();
    const offerDateCpu=cpuCur[offer.date]||emptyCPU();
    // After swap: offer.doctor gets req's shift on req.date, req.from gets offer's shift on offer.date
    const offerDocOther=req.shift==="early"?reqDateCpu.late:reqDateCpu.early;
    if(offerDocOther===offer.doctor){showToast(`${offer.doctor} hat bereits den anderen CPU-Dienst an diesem Tag.`);return;}
    const reqFromOther=offer.shift==="early"?offerDateCpu.late:offerDateCpu.early;
    if(reqFromOther===req.from){showToast(`${req.from} hat bereits den anderen CPU-Dienst an diesem Tag.`);return;}
    setCpuGenByM(o=>({...o,[key]:{
      ...cpuCur,
      [req.date]:{...reqDateCpu,[req.shift]:offer.doctor},
      [offer.date]:{...offerDateCpu,[offer.shift]:req.from}
    }}));
    setCpuTrades(cpuTrades.map(r=>r.id===req.id?{...r,status:"accepted"}:r));
    showSuccess(`🎉 CPU-Dienst getauscht mit ${offer.doctor}`);
  }

  function addDoctor(){
    const name=newDocName.trim(),mail=newDocEmail.trim().toLowerCase();
    if(!name||!mail||doctors.includes(name)||users.some(u=>u.email===mail))return;
    const next=[...users,{name,email:mail,password:"1234",role:"doctor"}]
      .sort((a,b)=>{if(a.role!==b.role)return a.role==="doctor"?-1:1;return a.name.localeCompare(b.name,"de",{sensitivity:"base"});});
    setUsers(next);setInclDocs(o=>({...o,[name]:true}));
    setAvail(o=>({...o,[name]:Object.fromEntries(days.map(d=>[isoDate(year,month,d),""]))}));
    setNewDocName("");setNewDocEmail("");showToast(`${name} hinzugefügt`);
  }

  function removeDoctor(doc){
    // Save data for undo
    const savedAvail=avail[doc]?{...avail[doc]}:null;
    const savedIncl=inclDocs[doc];
    setUsers(o=>o.map(u=>u.name===doc?{...u,role:"removed"}:u));
    setAvail(o=>{const n={...o};delete n[doc];return n;});
    setInclDocs(o=>{const n={...o};delete n[doc];return n;});
    setConfirmDelete(null);
    // Show undo notification (auto-dismiss after 8s)
    const timer=setTimeout(()=>setRemovedUndo(null),8000);
    setRemovedUndo({name:doc,savedAvail,savedIncl,timer});
  }

  function undoRemoveDoctor(){
    if(!removedUndo)return;
    const{name,savedAvail,savedIncl,timer}=removedUndo;
    clearTimeout(timer);
    setUsers(o=>o.map(u=>u.name===name?{...u,role:"doctor"}:u));
    if(savedAvail)setAvail(o=>({...o,[name]:savedAvail}));
    setInclDocs(o=>({...o,[name]:savedIncl!==undefined?savedIncl:true}));
    setRemovedUndo(null);
    showToast(`${name} wiederhergestellt`);
  }

  function exportPlan(){
    const hols=holidaysRLP(year);
    const bl=blanksBefore(year,month);
    const calCells=days.map(d=>{
      const date=isoDate(year,month,d);const sp=isSpecial(year,month,d);const st=isSat(year,month,d);const hol=hols[date];const a=assignments[date]||emptyA();
      const bg=sp?"#e8eaef":"#f4f5f7";
      let inner=`<div style="font-size:13px;font-weight:700;margin-bottom:4px">${d}</div>`;
      if(hol) inner+=`<div style="font-size:8px;background:#dfe6ed;color:#243b53;border-radius:3px;padding:1px 4px;margin-bottom:3px">${hol}</div>`;
      if(sp&&(st||a.visit)) inner+=`<div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:5px;padding:3px 6px;font-size:10px;font-weight:600;color:#9a3412;margin-bottom:2px">${a.visit||"offen"}</div>`;
      if(sp) inner+=`<div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:5px;padding:3px 6px;font-size:10px;font-weight:600;color:#1e40af;margin-bottom:2px">${a.day||"offen"}</div>`;
      inner+=`<div style="background:#f5f3ff;border:1px solid #ddd6fe;border-radius:5px;padding:3px 6px;font-size:10px;font-weight:600;color:#5b21b6">${a.night||"offen"}</div>`;
      return`<div style="background:${bg};border:1px solid #dfe2e8;border-radius:8px;padding:8px;min-height:90px">${inner}</div>`;
    });
    const blanksHtml=Array.from({length:bl}).map(()=>'<div></div>').join("");
    const wdHeaders=["Mo","Di","Mi","Do","Fr","Sa","So"].map(w=>`<div style="text-align:center;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:#fff;padding:6px;background:#121826;border-radius:4px">${w}</div>`).join("");
    const printHtml='<!DOCTYPE html><html lang="de"><head><meta charset="UTF-8"><title>Dienstplan '+monthTitle+'</title><style>body{font-family:Arial,sans-serif;max-width:1000px;margin:20px auto;color:#111}h1{font-size:22px;font-weight:700;margin-bottom:6px}.grid{display:grid;grid-template-columns:repeat(7,1fr);gap:4px}.footer{font-size:10px;color:#9ca3af;margin-top:16px;text-align:center}@media print{body{margin:8px}@page{size:landscape;margin:8mm}}</style></head><body><h1>'+monthTitle+'</h1><p style="color:#6b7280;font-size:13px;margin-bottom:14px">Westpfalz Klinikum Kaiserslautern - INN2 - Dienstplan</p><div class="grid">'+wdHeaders+'</div><div class="grid" style="margin-top:4px">'+blanksHtml+calCells.join("")+'</div><div class="footer">WKK · Dienstplaner</div></body></html>';
    const w=window.open("","_blank");
    if(w){w.document.write(printHtml);w.document.close();setTimeout(()=>w.print(),500);}
    else showToast("Popup-Blocker — bitte erlauben.");
  }

  function exportCsv(){
    const rows=[["Datum","Tag","Vd","TD","ND"]];
    days.forEach(d=>{const date=isoDate(year,month,d);const a=assignments[date]||emptyA();rows.push([date,wdShort(year,month,d),a.visit||"",a.day||"",a.night||""]);});
    const csv=rows.map(r=>r.map(v=>`"${String(v).replace(/"/g,'""')}"`).join(",")).join("\n");
    const url=URL.createObjectURL(new Blob([csv],{type:"text/csv;charset=utf-8"}));
    const a=document.createElement("a");a.href=url;a.download=`dienstplan-${monthTitle.replace(/\s+/g,"-").toLowerCase()}.csv`;a.click();URL.revokeObjectURL(url);
    showToast("CSV heruntergeladen");
  }

  // Export Urlaubstage as a printable HTML with name + signature field
  function exportUrlaub(){
    const name=currentUser.name;
    const myDays=(urlaubDays[name]||[]).slice().sort();
    if(myDays.length===0){showToast("Keine Urlaubstage eingetragen.");return;}

    // Group by month
    const byMonth={};
    myDays.forEach(d=>{
      const [y,m]=d.split("-");const mk=`${y}-${m}`;
      if(!byMonth[mk])byMonth[mk]=[];
      byMonth[mk].push(d);
    });

    const rows=Object.entries(byMonth).map(([mk,ds])=>{
      const [y,m]=mk.split("-").map(Number);
      const label=new Intl.DateTimeFormat("de-DE",{month:"long",year:"numeric"}).format(new Date(y,m-1,1));
      const dayLabels=ds.map(d=>{
        const dt=new Date(d+"T00:00:00");
        return new Intl.DateTimeFormat("de-DE",{weekday:"short",day:"2-digit",month:"2-digit"}).format(dt);
      }).join(", ");
      return `<tr><td style="padding:8px 12px;border-bottom:1px solid #f3f4f6;font-weight:500">${label}</td><td style="padding:8px 12px;border-bottom:1px solid #f3f4f6;color:#374151">${dayLabels}</td><td style="padding:8px 12px;border-bottom:1px solid #f3f4f6;color:#6b7280">${ds.length} Tag${ds.length===1?"":"e"}</td></tr>`;
    }).join("");

    const total=myDays.length;
    const html=`<!DOCTYPE html><html lang="de"><head><meta charset="UTF-8"><title>Urlaubstage ${name}</title>
    <style>body{font-family:Arial,sans-serif;max-width:700px;margin:40px auto;color:#121826}h1{font-size:20px;font-weight:600;margin-bottom:4px}p{color:#6b7280;font-size:13px;margin-bottom:24px}table{width:100%;border-collapse:collapse}th{background:#f9fafb;padding:8px 12px;text-align:left;font-size:12px;text-transform:uppercase;letter-spacing:.05em;color:#6b7280;border-bottom:2px solid #e5e7eb}.total{margin-top:18px;font-size:14px;font-weight:600}.sig{margin-top:48px;border-top:1px solid #d1d5db;padding-top:12px;font-size:12px;color:#9ca3af;display:flex;justify-content:space-between}.footer{font-size:11px;color:#9ca3af;margin-top:40px}</style></head>
    <body>
    <h1>Urlaubstage — ${name}</h1>
    <p>Erstellt am ${new Intl.DateTimeFormat("de-DE",{day:"2-digit",month:"long",year:"numeric"}).format(new Date())} · WKK</p>
    <table><thead><tr><th>Monat</th><th>Tage</th><th>Anzahl</th></tr></thead><tbody>${rows}</tbody></table>
    <div class="total">Gesamt: ${total} Urlaubstag${total===1?"":"e"}</div>
    <div class="sig"><div>Datum: ___________________________</div><div>Unterschrift: ___________________________</div></div>
    <div class="footer">Westpfalz Klinikum Kaiserslautern - INN2 - Dienstplaner</div>
    </body></html>`;

    const url=URL.createObjectURL(new Blob([html],{type:"text/html;charset=utf-8"}));
    const a=document.createElement("a");a.href=url;a.download=`urlaubstage-${name.replace(/\s+/g,"-").toLowerCase()}.html`;a.click();URL.revokeObjectURL(url);
    showToast("Urlaubstage exportiert");
  }

  // ── Urlaub picker helpers ───────────────────────────────────────────────────
  const urlaubPickDays  = useMemo(()=>Array.from({length:daysInMonth(urlaubPickYear,urlaubPickMonth)},(_,i)=>i+1),[urlaubPickYear,urlaubPickMonth]);
  const urlaubPickBlanks= blanksBefore(urlaubPickYear,urlaubPickMonth);
  const myUrlaubDays    = urlaubDays[currentUser?.name]||[];

  // ── Login ──────────────────────────────────────────────────────────────────
  if(!currentUser) return(
    <div className="app">
      <style>{css}</style>
      <div className="lw">
        <div className="lc">
          <div className="ll"><Stethoscope size={20}/></div>
          <div className="lt">{loginMode==="register"?"Registrieren":"Dienstplaner WKK"}</div>
          <div style={{marginBottom:16}}/>
          {loginMode==="register"&&<>
            <div className="fm"><label className="fl">Vorname</label><input className="fi" value={regFirstName} onChange={e=>setRegFirstName(e.target.value)}/></div>
            <div className="fm"><label className="fl">Nachname</label><input className="fi" value={regLastName} onChange={e=>setRegLastName(e.target.value)}/></div>
          </>}
          <div className="fm"><label className="fl">Benutzername</label><input className="fi" type="text" autoComplete="off" value={email} onChange={e=>setEmail(e.target.value)} onKeyDown={e=>e.key==="Enter"&&(loginMode==="login"?login():loginMode==="register"?register():forgotPw())}/></div>
          {loginMode!=="forgot"&&<div className="fm"><label className="fl">Passwort</label><input className="fi" type="password" autoComplete="off" value={password} onChange={e=>setPassword(e.target.value)} onKeyDown={e=>e.key==="Enter"&&(loginMode==="login"?login():register())}/></div>}
          {loginMode==="register"&&<div className="fm"><label className="fl">Passwort wiederholen</label><input className="fi" type="password" value={regPw2} onChange={e=>setRegPw2(e.target.value)} onKeyDown={e=>e.key==="Enter"&&register()}/></div>}
          {loginError&&<div className="lerr">{loginError}</div>}
          {loginMode==="login"&&<button className="lbtn" onClick={login}>Anmelden</button>}
          {loginMode==="register"&&<button className="lbtn" onClick={register}>Konto erstellen</button>}
          {loginMode==="forgot"&&<button className="lbtn" onClick={forgotPw}>Passwort anfordern</button>}
          <div style={{display:"flex",gap:12,marginTop:14,justifyContent:"center"}}>
            {loginMode!=="login"&&<button style={{background:"none",border:"none",color:"#6366f1",fontSize:12,cursor:"pointer",fontFamily:"inherit",padding:0}} onClick={()=>{setLoginMode("login");setLoginError("")}}>&#8592; Zur&uuml;ck</button>}
            {loginMode==="login"&&<button style={{background:"none",border:"none",color:"#6366f1",fontSize:12,cursor:"pointer",fontFamily:"inherit",padding:0}} onClick={()=>{setLoginMode("register");setLoginError("")}}>Registrieren</button>}
            {loginMode==="login"&&<button style={{background:"none",border:"none",color:"#9ca3af",fontSize:12,cursor:"pointer",fontFamily:"inherit",padding:0}} onClick={()=>{setLoginMode("forgot");setLoginError("")}}>Passwort vergessen?</button>}
          </div>
        </div>
      </div>
    </div>
  );

  // ── Main App ───────────────────────────────────────────────────────────────
  return(
    <div className="app">
      <style>{css}</style>
      {toast&&<div className="toast" style={toast.startsWith("🎉")?{background:"#166534",fontSize:14,padding:"12px 24px"}:{}}><CheckCircle2 size={14}/>{toast}</div>}

      {showPwChange&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.4)",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center"}} onClick={()=>setShowPwChange(false)}>
          <div style={{background:"#fff",borderRadius:14,padding:28,width:"100%",maxWidth:360,boxShadow:"0 20px 60px rgba(0,0,0,.15)"}} onClick={e=>e.stopPropagation()}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18}}>
              <div style={{fontSize:16,fontWeight:600}}>Passwort ändern</div>
              <button style={{background:"none",border:"none",cursor:"pointer",color:"#9ca3af",display:"flex"}} onClick={()=>setShowPwChange(false)}><X size={18}/></button>
            </div>
            <div className="fm"><label className="fl">Aktuelles Passwort</label><input className="fi" type="password" value={pwOld} onChange={e=>setPwOld(e.target.value)}/></div>
            <div className="fm"><label className="fl">Neues Passwort</label><input className="fi" type="password" value={pwNew} onChange={e=>setPwNew(e.target.value)}/></div>
            <div className="fm"><label className="fl">Neues Passwort wiederholen</label><input className="fi" type="password" value={pwNew2} onChange={e=>setPwNew2(e.target.value)} onKeyDown={e=>e.key==="Enter"&&changePassword()}/></div>
            <button className="lbtn" style={{marginTop:8}} onClick={changePassword}>Passwort speichern</button>
          </div>
        </div>
      )}

      {showConfetti&&(
        <div className="approve-bar"><CheckCircle2 size={20}/>Dienstplan freigegeben</div>
      )}

      {tradePickerReq&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.35)",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center"}} onClick={()=>{setTradePickerReq(null);setTradePickerShifts([]);}}>
          <div style={{background:"#fff",borderRadius:12,padding:20,width:"100%",maxWidth:340,boxShadow:"0 16px 48px rgba(0,0,0,.12)"}} onClick={e=>e.stopPropagation()}>
            <div style={{fontSize:14,fontWeight:600,marginBottom:4}}>Tausch anbieten</div>
            <div style={{fontSize:12,color:"#6b7280",marginBottom:14}}>an <strong>{tradePickerReq.from}</strong> · {tradePickerReq.date}</div>

            <div style={{display:"flex",flexDirection:"column",gap:4}}>
              {tradePickerShifts.map(s=>{
                const icons={visit:Stethoscope,day:Sun,night:Moon};
                const names={visit:"Vd",day:"TD",night:"ND"};
                const Icon=icons[s.shift];
                return(
                  <label key={s.date+s.shift} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 10px",background:s.selected?"#f0f9ff":"#fafafa",border:"1.5px solid "+(s.selected?"#121826":"#e5e7eb"),borderRadius:8,cursor:"pointer",transition:"all .12s"}}>
                    <Icon size={14} style={{color:"#6b7280",flexShrink:0}}/>
                    <div style={{flex:1}}>
                      <span style={{fontSize:13,fontWeight:500}}>{names[s.shift]}</span>
                      <span style={{fontSize:11,color:"#9ca3af",marginLeft:6}}>{s.date.slice(5)}</span>
                    </div>
                    <input type="checkbox" checked={!!s.selected} onChange={()=>setTradePickerShifts(prev=>prev.map(p=>p.date===s.date&&p.shift===s.shift?{...p,selected:!p.selected}:p))} style={{accentColor:"#121826",width:16,height:16}}/>
                  </label>
                );
              })}
            </div>

            <div style={{display:"flex",gap:8,marginTop:14}}>
              <button onClick={()=>{setTradePickerReq(null);setTradePickerShifts([]);}} style={{flex:1,padding:"8px 0",background:"#f4f5f7",border:"1px solid #e5e7eb",borderRadius:7,fontSize:12,fontWeight:500,cursor:"pointer",fontFamily:"inherit",color:"#6b7280"}}>Abbrechen</button>
              <button onClick={()=>{const sel=tradePickerShifts.filter(s=>s.selected);if(!sel.length){showToast("Mindestens einen Dienst wählen.");return;}submitTradeOffers(tradePickerReq,sel);}} style={{flex:1,padding:"8px 0",background:"#121826",border:"none",borderRadius:7,fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"inherit",color:"#fff",transition:"background .12s"}} onMouseEnter={e=>e.currentTarget.style.background="#1e2a3d"} onMouseLeave={e=>e.currentTarget.style.background="#121826"}>
                Anbieten ({tradePickerShifts.filter(s=>s.selected).length})
              </button>
            </div>
          </div>
        </div>
      )}

      <nav className="nav">
        <div className="nb">
          <div className="nl"><Stethoscope size={15} color="#fff"/></div>
          <span className="nt">Dienstplaner WKK</span>
        </div>
        <div className="nav-center" style={{fontSize:17,fontWeight:700}}>{currentUser.name}</div>
        <div className="nr">
          <button className="navbtn" onClick={()=>setShowPwChange(true)}><KeyRound size={13}/>Passwort</button>
          <button className="navbtn" onClick={exportPlan}><Download size={13}/>Kalender</button>
          <button className="navbtn" onClick={exportCsv}><Download size={13}/>CSV</button>
          <button className="navbtn" onClick={logout}><LogOut size={13}/>Abmelden</button>
        </div>
      </nav>

      <div className="mb" style={{justifyContent:"center",gap:12}}>
        <button className="btn bg" onClick={()=>changeMonth(-1)}><ChevronLeft size={13}/></button>
        <button className="btn bg" onClick={()=>{setYear(today.getFullYear());setMonth(today.getMonth());}}>Heute</button>
        <div className="mbt" style={{minWidth:180,textAlign:"center"}}>{monthTitle}</div>
        <button className="btn bg" onClick={()=>changeMonth(1)}><ChevronRight size={13}/></button>
      </div>

      <div className="tbar">
        <button className={`tab ${view==="calendar"?"on":""}`} onClick={()=>setView("calendar")}><LayoutGrid size={14}/>Kalender</button>
        {!isAdmin&&<button className={`tab ${view==="wishes"?"on":""}`} onClick={()=>setView("wishes")}><User size={14}/>Meine Wünsche & Urlaub</button>}
        {isAdmin&&<button className={`tab ${view==="admin"?"on":""}`} onClick={()=>setView("admin")}><ShieldCheck size={14}/>Admin</button>}
      </div>

      <div className="cnt">

        {/* ── Calendar ── */}
        {view==="calendar"&&(
          <div>
            {!approved&&!isAdmin&&<div className="ban banb"><CalendarDays size={14}/>Noch nicht freigegeben — Wünsche unter "Meine Wünsche & Urlaub" eintragen.</div>}
            {approved&&!isAdmin&&(
              <div style={{background:"#f0fdf4",border:"1px solid #bbf7d0",borderRadius:10,padding:"10px 16px",marginBottom:14,display:"flex",alignItems:"center",gap:8}}>
                <CheckCircle2 size={16} color="#16a34a"/>
                <span style={{fontSize:13,fontWeight:600,color:"#166534"}}>Dienstplan freigegeben</span>
              </div>
            )}
            {approved&&isAdmin&&(
              <div className="ban bang" style={{justifyContent:"space-between"}}>
                <div style={{display:"flex",alignItems:"center",gap:8}}><CheckCircle2 size={14}/>Dienstplan freigegeben.</div>
                <button className="btn bg bsm" onClick={()=>{setApprovedM(o=>({...o,[key]:false}));setPlanGenerated(o=>({...o,[key]:true}));setView("admin");}}>Bearbeiten</button>
              </div>
            )}

            {/* Alerts */}
            {(()=>{
              const weekStart=new Date(today);weekStart.setDate(today.getDate()-(today.getDay()||7)+1);
              const weekEnd=addDays(weekStart,6);
              const weekTrades=trades.filter(r=>{if(r.status!=="open"||r.monthKey!==key)return false;const rd=new Date(r.date+"T00:00:00");return rd>=weekStart&&rd<=weekEnd;});
              const weekSick=sickReports.filter(r=>{if(r.status!=="open")return false;const rd=new Date(r.date+"T00:00:00");return rd>=weekStart&&rd<=weekEnd;});
              return(<>
                {weekSick.length>0&&(
                  <div style={{background:"#fef2f2",border:"1.5px solid #fecaca",borderRadius:10,padding:"12px 16px",marginBottom:10,display:"flex",alignItems:"center",gap:10}}>
                    <div style={{width:28,height:28,borderRadius:"50%",background:"#dc2626",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><X size={14} color="#fff"/></div>
                    <div>
                      <div style={{fontSize:13,fontWeight:600,color:"#991b1b"}}>Krankmeldung</div>
                      <div style={{fontSize:12,color:"#dc2626",marginTop:1}}>{weekSick.map(r=>r.from+" ("+r.date.slice(5)+")").join(" · ")}</div>
                    </div>
                  </div>
                )}
                {weekTrades.length>0&&(
                  <div style={{background:"#f0f4f8",border:"1.5px solid #c8d6e5",borderRadius:10,padding:"12px 16px",marginBottom:10,display:"flex",alignItems:"center",gap:10}}>
                    <div style={{width:28,height:28,borderRadius:"50%",background:"#486581",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><Flag size={14} color="#fff"/></div>
                    <div>
                      <div style={{fontSize:13,fontWeight:600,color:"#243b53"}}>Tauschanfrage</div>
                      <div style={{fontSize:12,color:"#334e68",marginTop:1}}>{weekTrades.map(r=>r.from+" ("+r.date.slice(5)+")").join(" · ")}</div>
                    </div>
                  </div>
                )}
              </>);
            })()}

            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
              <Stethoscope size={15} style={{color:"#121826"}}/>
              <span style={{fontSize:14,fontWeight:600}}>INN2 Dienstplan</span>
              <span style={{fontSize:10,color:"#9ca3af",background:"#f4f5f7",padding:"2px 8px",borderRadius:20,fontWeight:500}}>{monthTitle}</span>
            </div>

            <div className="ch">{[["Montag","Mo"],["Dienstag","Di"],["Mittwoch","Mi"],["Donnerstag","Do"],["Freitag","Fr"],["Samstag","Sa"],["Sonntag","So"]].map(([f,s])=><div key={s} className="cwd"><span className="wd-full">{f}</span><span className="wd-short">{s}</span></div>)}</div>
            <div className="cgrid" onClick={(e)=>{if(!e.target.closest('[data-action-popup]'))setShiftAction(null);}}>
              {Array.from({length:blanks}).map((_,i)=><div key={`bl${i}`}/>)}
              {days.map(day=>{
                const date=isoDate(year,month,day);
                const a=assignments[date]||emptyA();
                const special=isSpecial(year,month,day);
                const sat=isSat(year,month,day);
                const holiday=holidays[date];
                const mine=[a.visit,a.day,a.night].includes(currentUser.name);
                const isToday=date===todayStr;
                const req=trades.find(r=>r.status==="open"&&r.monthKey===key&&r.date===date);
                const sickOpen=sickReports.find(r=>r.status==="open"&&r.monthKey===key&&r.date===date);
                const sickCovered=sickReports.find(r=>r.status==="covered"&&r.monthKey===key&&r.date===date);
                const mySick=sickOpen&&sickOpen.from===currentUser.name;
                const otherSick=sickOpen&&sickOpen.from!==currentUser.name;
                const giveOpen=giveaways.find(g=>g.status==="open"&&g.monthKey===key&&g.date===date);
                const myGive=giveOpen&&giveOpen.from===currentUser.name;
                const desireList=(!approved&&!isAdmin)?[...votes(avail,date,"DW"),...votes(avail,date,"DT"),...votes(avail,date,"DN")]:[];
                let cls="cc";
                if(special)cls+=" wknd";
                if(isToday)cls+=" tod";
                if(mine&&!mySick)cls+=" mine";
                if(req)cls+=" flagged";
                if(sickOpen)cls+=" sick";
                const myShift=a.visit===currentUser.name?"visit":a.day===currentUser.name?"day":a.night===currentUser.name?"night":null;
                return(
                  <div key={date} className={cls}>
                    <div className="cc-head">
                      <div className="dn">
                        <span>{day}{req&&<Flag size={9} style={{marginLeft:3,color:"#f97316",verticalAlign:"middle"}}/>}</span>
                        <div style={{display:"flex",alignItems:"center",gap:3}}>
                          {mine&&!mySick&&<span className="mchip">Mein Dienst</span>}
                          {isToday&&<span style={{fontSize:8,fontWeight:700,color:"#fff",background:"#121826",borderRadius:20,padding:"1px 6px",letterSpacing:".03em"}}>Heute</span>}
                        </div>
                      </div>
                    </div>
                    <div className="cc-body">
                      {holiday&&<div className="htag">{holiday}</div>}
                      {req&&<div className="fbanner"><Flag size={8}/>{req.from} bittet um Tausch</div>}
                      {sickCovered&&<div style={{background:"#f0fdf4",border:"1px solid #bbf7d0",borderRadius:5,padding:"3px 6px",fontSize:8,fontWeight:600,color:"#166534",display:"flex",alignItems:"center",gap:3}}><CheckCircle2 size={8}/>{sickCovered.coveredBy} übernimmt</div>}
                      {giveOpen&&!myGive&&<div style={{background:"#eff6ff",border:"1px solid #bfdbfe",borderRadius:5,padding:"3px 6px",fontSize:8,fontWeight:600,color:"#1e40af",display:"flex",alignItems:"center",gap:3}}><LogOut size={8}/>{giveOpen.from} gibt ab</div>}
                      {!approved&&!isAdmin&&desireList.length>0&&<div className="dtxt">{desireList.slice(0,3).join(", ")}{desireList.length>3?` +${desireList.length-3}`:""}</div>}
                      {(isAdmin||approved)&&special&&(sat||a.visit)&&(
                        <div className={`sp svd ${sickOpen&&sickOpen.shift==="visit"&&sickOpen.from!==currentUser.name?" sp-sick":""}`} style={sickOpen&&sickOpen.shift==="visit"?{background:"#fef2f2",borderColor:"#fecaca",color:"#dc2626"}:{}}>
                          <Stethoscope size={8} style={{opacity:.6,flexShrink:0}}/>
                          <span className="sn">{a.visit||"offen"}{sickOpen&&sickOpen.shift==="visit"&&<span style={{marginLeft:3,fontSize:7,fontWeight:700}}>KRANK</span>}</span>
                        </div>
                      )}
                      {(isAdmin||approved)&&special&&(
                        <div className={`sp std`} style={sickOpen&&sickOpen.shift==="day"?{background:"#fef2f2",borderColor:"#fecaca",color:"#dc2626"}:{}}>
                          <Sun size={8} style={{opacity:.6,flexShrink:0}}/>
                          <span className="sn">{a.day||"offen"}{sickOpen&&sickOpen.shift==="day"&&<span style={{marginLeft:3,fontSize:7,fontWeight:700}}>KRANK</span>}</span>
                        </div>
                      )}
                      {(isAdmin||approved)&&(
                        <div className={`sp snd`} style={sickOpen&&sickOpen.shift==="night"?{background:"#fef2f2",borderColor:"#fecaca",color:"#dc2626"}:{}}>
                          <Moon size={8} style={{opacity:.6,flexShrink:0}}/>
                          <span className="sn">{a.night||"offen"}{sickOpen&&sickOpen.shift==="night"&&<span style={{marginLeft:3,fontSize:7,fontWeight:700}}>KRANK</span>}</span>
                        </div>
                      )}
                    </div>
                    {/* Active request/giveaway inline withdraw */}
                    {!isAdmin&&approved&&mine&&req&&req.from===currentUser.name&&date>=todayStr&&!mySick&&!myGive&&(
                      <div style={{padding:"2px 9px 6px",marginTop:"auto"}}>
                        <button style={{width:"100%",padding:"4px 6px",background:"#fef2f2",border:"1px solid #fecaca",borderRadius:5,fontSize:8,fontWeight:600,cursor:"pointer",fontFamily:"inherit",color:"#991b1b",display:"flex",alignItems:"center",justifyContent:"center",gap:3}}
                          onClick={()=>setTrades(trades.filter(r=>r.id!==req.id))}><X size={8}/>Tausch zurückziehen</button>
                      </div>
                    )}
                    {myGive&&date>=todayStr&&(
                      <div style={{padding:"2px 9px 6px",marginTop:"auto"}}>
                        <button style={{width:"100%",padding:"4px 6px",background:"#fef2f2",border:"1px solid #fecaca",borderRadius:5,fontSize:8,fontWeight:600,cursor:"pointer",fontFamily:"inherit",color:"#991b1b",display:"flex",alignItems:"center",justifyContent:"center",gap:3}}
                          onClick={()=>withdrawGiveaway(giveOpen)}><X size={8}/>Abgabe zurückziehen</button>
                      </div>
                    )}
                    {/* Other user: take giveaway */}
                    {!isAdmin&&approved&&giveOpen&&!myGive&&date>=todayStr&&(
                      <div style={{padding:"2px 9px 6px",marginTop:"auto"}}>
                        <button style={{width:"100%",padding:"4px 6px",background:"#f0fdf4",border:"1px solid #bbf7d0",borderRadius:5,fontSize:8,fontWeight:600,cursor:"pointer",fontFamily:"inherit",color:"#166534"}}
                          onClick={()=>takeGiveaway(giveOpen)}>Dienst übernehmen</button>
                      </div>
                    )}
                    {/* Main action button — only when no active request/give/sick */}
                    {!isAdmin&&approved&&mine&&!mySick&&!myGive&&!(req&&req.from===currentUser.name)&&date>=todayStr&&(
                      <div style={{padding:"2px 9px 6px",marginTop:"auto"}}>
                        <button style={{width:"100%",padding:"5px 8px",background:"#121826",border:"none",borderRadius:5,cursor:"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",justifyContent:"center",gap:4,transition:"all .12s",color:"#fff",fontSize:8,fontWeight:600,letterSpacing:".02em"}}
                          onClick={(e)=>{e.stopPropagation();setShiftAction(shiftAction?.date===date?null:{date,shift:myShift});}}
                          onMouseEnter={e=>e.currentTarget.style.background="#1e2a3d"}
                          onMouseLeave={e=>e.currentTarget.style.background="#121826"}>
                          <Settings size={11}/>Aktionen
                        </button>
                      </div>
                    )}
                    {/* Popup menu */}
                    {shiftAction&&shiftAction.date===date&&mine&&!mySick&&!myGive&&(
                      <div data-action-popup="true" style={{position:"absolute",bottom:4,left:4,right:4,background:"#fff",border:"1.5px solid #121826",borderRadius:8,padding:5,boxShadow:"0 8px 24px rgba(0,0,0,.15)",zIndex:10,display:"flex",flexDirection:"column",gap:3}}>
                        <button style={{padding:"7px 10px",background:"#f8fafc",border:"none",borderRadius:6,fontSize:9,fontWeight:600,cursor:"pointer",fontFamily:"inherit",color:"#374151",display:"flex",alignItems:"center",gap:5,transition:"background .1s"}}
                          onClick={()=>{requestTrade(date,myShift);setShiftAction(null);}}
                          onMouseEnter={e=>e.currentTarget.style.background="#f1f5f9"}
                          onMouseLeave={e=>e.currentTarget.style.background="#f8fafc"}>
                          <Repeat2 size={10}/>Tausch anfragen
                        </button>
                        <button style={{padding:"7px 10px",background:"#f8fafc",border:"none",borderRadius:6,fontSize:9,fontWeight:600,cursor:"pointer",fontFamily:"inherit",color:"#dc2626",display:"flex",alignItems:"center",gap:5,transition:"background .1s"}}
                          onClick={()=>{reportSick(date,myShift);setShiftAction(null);}}
                          onMouseEnter={e=>e.currentTarget.style.background="#fef2f2"}
                          onMouseLeave={e=>e.currentTarget.style.background="#f8fafc"}>
                          <X size={10}/>Krankmeldung
                        </button>
                        <button style={{padding:"7px 10px",background:"#f8fafc",border:"none",borderRadius:6,fontSize:9,fontWeight:600,cursor:"pointer",fontFamily:"inherit",color:"#1e40af",display:"flex",alignItems:"center",gap:5,transition:"background .1s"}}
                          onClick={()=>{giveAwayShift(date,myShift);setShiftAction(null);}}
                          onMouseEnter={e=>e.currentTarget.style.background="#eff6ff"}
                          onMouseLeave={e=>e.currentTarget.style.background="#f8fafc"}>
                          <LogOut size={10}/>Dienst abgeben
                        </button>
                      </div>
                    )}
                    {/* Sick withdraw */}
                    {!isAdmin&&approved&&mySick&&date>=todayStr&&(
                      <div style={{padding:"2px 9px 6px",marginTop:"auto"}}>
                        <button style={{width:"100%",padding:"4px 6px",background:"#fef2f2",border:"1px solid #fecaca",borderRadius:5,fontSize:8,fontWeight:600,cursor:"pointer",fontFamily:"inherit",color:"#991b1b",display:"flex",alignItems:"center",justifyContent:"center",gap:3}}
                          onClick={()=>setSickReports(sickReports.filter(r=>r.id!==sickOpen.id))}><X size={8}/>Krankmeldung zurückziehen</button>
                      </div>
                    )}
                    {/* Other user: cover sick */}
                    {!isAdmin&&approved&&otherSick&&date>=todayStr&&(
                      <div style={{padding:"2px 9px 6px",marginTop:"auto"}}>
                        <button style={{width:"100%",padding:"4px 6px",background:"#f0fdf4",border:"1px solid #bbf7d0",borderRadius:5,fontSize:8,fontWeight:600,cursor:"pointer",fontFamily:"inherit",color:"#166534"}}
                          onClick={()=>coverSick(sickOpen)}>Dienst übernehmen</button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {trades.filter(r=>r.status==="open"&&r.monthKey===key&&(r.from===currentUser.name||!isAdmin)).length>0&&(
              <div className="tlist">
                <div style={{fontSize:13,fontWeight:600,marginTop:6}}>Offene Tauschanfragen</div>
                {trades.filter(r=>r.status==="open"&&r.monthKey===key).map(req=>{
                  const isRequester=req.from===currentUser.name;
                  return(
                  <div key={req.id} className="tcard">
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:8}}>
                      <span style={{fontSize:13}}><strong>{req.from}</strong> · {req.shift==="visit"?"Vd":req.shift==="day"?"TD":"ND"} am {fmtDate(req.date)}</span>
                      {!isAdmin&&!isRequester&&(
                        <button style={{padding:"6px 14px",background:"#121826",color:"#fff",border:"none",borderRadius:6,fontSize:11,fontWeight:600,cursor:"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",gap:5,transition:"background .12s"}}
                          onClick={()=>offerTrade(req)}
                          onMouseEnter={e=>e.currentTarget.style.background="#1e2a3d"}
                          onMouseLeave={e=>e.currentTarget.style.background="#121826"}>
                          <Repeat2 size={11}/>Tausch anbieten
                        </button>
                      )}
                    </div>
                    {isRequester&&(req.offers||[]).length>0&&(
                      <div style={{marginTop:8,borderTop:"1px solid #c8d6e5",paddingTop:8}}>
                        <div style={{fontSize:10,fontWeight:600,color:"#243b53",marginBottom:5}}>Angebotene Dienste — wählen Sie:</div>
                        {(req.offers||[]).map(o=>(
                          <div key={o.id} style={{padding:"6px 8px",background:"#fff",borderRadius:6,display:"flex",alignItems:"center",justifyContent:"space-between",fontSize:12,marginBottom:4,border:"1px solid #f3f4f6"}}>
                            <div style={{display:"flex",alignItems:"center",gap:6}}>
                              {o.shift==="visit"&&<Stethoscope size={12} style={{color:"#9a3412"}}/>}
                              {o.shift==="day"&&<Sun size={12} style={{color:"#1e40af"}}/>}
                              {o.shift==="night"&&<Moon size={12} style={{color:"#5b21b6"}}/>}
                              <span><strong>{o.doctor}</strong> · {o.shift==="visit"?"Vd":o.shift==="day"?"TD":"ND"} am {fmtDate(o.date)}</span>
                            </div>
                            <button style={{padding:"4px 10px",background:"#121826",color:"#fff",border:"none",borderRadius:5,fontSize:10,fontWeight:600,cursor:"pointer",fontFamily:"inherit",transition:"background .12s"}}
                              onClick={()=>acceptOffer(req,o)}
                              onMouseEnter={e=>e.currentTarget.style.background="#1e2a3d"}
                              onMouseLeave={e=>e.currentTarget.style.background="#121826"}>Annehmen</button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  );
                })}
              </div>
            )}

            {sickReports.filter(r=>r.monthKey===key).length>0&&(
              <div className="tlist">
                <div style={{fontSize:13,fontWeight:600,marginTop:6}}>Krankmeldungen</div>
                {sickReports.filter(r=>r.monthKey===key).map(r=>(
                  <div key={r.id} className={`sickcard ${r.status==="covered"?"covered":""}`}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:8}}>
                      <span style={{fontSize:13}}>
                        <strong>{r.from}</strong> · {r.shift==="visit"?"Vd":r.shift==="day"?"TD":"ND"} am {fmtDate(r.date)}
                        {r.status==="covered"&&<span style={{color:"#166534",marginLeft:6}}> → <strong>{r.coveredBy}</strong></span>}
                      </span>
                      {!isAdmin&&r.status==="open"&&r.from!==currentUser.name&&(
                        <button style={{padding:"6px 14px",background:"#166534",color:"#fff",border:"none",borderRadius:6,fontSize:11,fontWeight:600,cursor:"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",gap:5,transition:"background .12s"}}
                          onClick={()=>coverSick(r)}
                          onMouseEnter={e=>e.currentTarget.style.background="#15803d"}
                          onMouseLeave={e=>e.currentTarget.style.background="#166534"}>
                          <CheckCircle2 size={11}/>Dienst übernehmen
                        </button>
                      )}
                      {r.status==="covered"&&r.coveredBy===currentUser.name&&(
                        <button className="btn bg bsm" style={{color:"#dc2626",borderColor:"#fecaca"}} onClick={()=>uncoverSick(r)}><X size={10}/>Rückgängig</button>
                      )}
                      {r.status==="open"&&<span style={{fontSize:11,fontWeight:600,color:"#dc2626",background:"#fef2f2",padding:"2px 8px",borderRadius:20}}>Offen</span>}
                      {r.status==="covered"&&<span style={{fontSize:11,fontWeight:600,color:"#166534",background:"#dcfce7",padding:"2px 8px",borderRadius:20}}>Übernommen</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="sc" style={{marginTop:14}}>
              <div className="leg">
                {Object.entries(CODES).filter(([c])=>c&&c!=="DT"&&c!=="DN").map(([code,info])=>(
                  <span key={code} className="li" style={{background:info.bg,color:info.text,borderColor:info.border}}>
                    {code==="Vd"&&<Stethoscope size={10}/>}
                    {(code==="TW")&&<Sun size={10}/>}
                    {(code==="NW")&&<Moon size={10}/>}
                    <strong>{code}</strong> {info.label}
                  </span>
                ))}
              </div>
            </div>

            {/* ── CPU Calendar (separate) ── */}
            {(cpuDoctors.includes(currentUser.name)||isAdmin)&&cpuApproved&&(
              <div className="sc" style={{marginTop:14,borderLeft:"3px solid #486581"}}>
                <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
                  <span style={{fontSize:14,fontWeight:600,color:"#334e68"}}>🫀 Chest Pain Unit (CPU)</span>
                  <span style={{fontSize:10,color:"#243b53",background:"#f0f4f8",padding:"2px 8px",borderRadius:20,fontWeight:500}}>{monthTitle}</span>
                </div>
                <div className="ch">{[["Montag","Mo"],["Dienstag","Di"],["Mittwoch","Mi"],["Donnerstag","Do"],["Freitag","Fr"],["Samstag","Sa"],["Sonntag","So"]].map(([f,s])=><div key={"cpu"+s} className="cwd"><span className="wd-full">{f}</span><span className="wd-short">{s}</span></div>)}</div>
                <div className="cgrid">
                  {Array.from({length:blanks}).map((_,i)=><div key={`cpubl${i}`}/>)}
                  {days.map(day=>{
                    const date=isoDate(year,month,day);
                    const c=cpuAssignments[date]||emptyCPU();
                    const sp=isSpecial(year,month,day);
                    const hol=holidays[date];
                    const myCpuHere=c.early===currentUser.name?"early":c.early2===currentUser.name?"early2":c.late===currentUser.name?"late":null;
                    const cpuSickHere=cpuSick.find(r=>r.status==="open"&&r.monthKey===key&&r.date===date);
                    const myCpuSick=cpuSickHere&&cpuSickHere.from===currentUser.name;
                    const isToday=date===todayStr;
                    let cls="cc";
                    if(sp)cls+=" wknd";
                    if(isToday)cls+=" tod";
                    if(myCpuHere&&!myCpuSick)cls+=" mine";
                    if(cpuSickHere)cls+=" sick";
                    return(
                      <div key={date} className={cls} style={{position:"relative"}}>
                        <div className="cc-head"><div className="dn"><span>{day}</span>
                          <div style={{display:"flex",alignItems:"center",gap:3}}>
                            {myCpuHere&&!myCpuSick&&<span className="mchip" style={{background:"#f0f4f8",color:"#243b53",border:"1px solid #c8d6e5"}}>CPU</span>}
                            {isToday&&<span style={{fontSize:8,fontWeight:700,color:"#fff",background:"#243b53",borderRadius:20,padding:"1px 6px"}}>Heute</span>}
                          </div>
                        </div></div>
                        <div className="cc-body">
                          {hol&&<div className="htag">{hol}</div>}
                          {cpuSickHere&&!myCpuSick&&<div style={{background:"#fef2f2",border:"1px solid #fecaca",borderRadius:4,padding:"2px 5px",fontSize:8,fontWeight:700,color:"#dc2626",marginBottom:2}}>{cpuSickHere.from}: Krank</div>}
                          {c.early&&<div className="sp" style={{background:"#f0f4f8",color:"#334e68",border:"1px solid #c8d6e5"}}><Sun size={8} style={{opacity:.7,flexShrink:0}}/><span className="sn">{c.early}{cpuSickHere&&cpuSickHere.shift==="early"&&<span style={{marginLeft:3,fontSize:7,fontWeight:700,color:"#dc2626"}}>KRANK</span>}</span></div>}
                          {c.early2&&<div className="sp" style={{background:"#e8eef4",color:"#334e68",border:"1px solid #c8d6e5"}}><Sun size={8} style={{opacity:.7,flexShrink:0}}/><span className="sn">{c.early2}{cpuSickHere&&cpuSickHere.shift==="early2"&&<span style={{marginLeft:3,fontSize:7,fontWeight:700,color:"#dc2626"}}>KRANK</span>}</span></div>}
                          {!sp&&c.late&&<div className="sp" style={{background:"#dfe6ed",color:"#243b53",border:"1px solid #9fb3c8"}}><Moon size={8} style={{opacity:.7,flexShrink:0}}/><span className="sn">{c.late}{cpuSickHere&&cpuSickHere.shift==="late"&&<span style={{marginLeft:3,fontSize:7,fontWeight:700,color:"#dc2626"}}>KRANK</span>}</span></div>}
                        </div>
                        {myCpuHere&&!myCpuSick&&date>=todayStr&&!cpuTrades.some(r=>r.status==="open"&&r.date===date&&r.from===currentUser.name)&&(
                          <div style={{padding:"2px 9px 6px",marginTop:"auto"}}>
                            <button style={{width:"100%",padding:"5px 8px",background:"#334e68",border:"none",borderRadius:5,cursor:"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",justifyContent:"center",gap:4,color:"#fff",fontSize:8,fontWeight:600}} onClick={(e)=>{e.stopPropagation();setShiftAction(shiftAction?.date===date&&shiftAction?.cpu?null:{date,shift:myCpuHere,cpu:true});}}><Settings size={10}/>Aktionen</button>
                          </div>
                        )}
                        {/* CPU trade withdraw */}
                        {cpuTrades.some(r=>r.status==="open"&&r.date===date&&r.from===currentUser.name)&&date>=todayStr&&(
                          <div style={{padding:"2px 9px 6px",marginTop:"auto"}}><button style={{width:"100%",padding:"4px 6px",background:"#fef2f2",border:"1px solid #fecaca",borderRadius:5,fontSize:8,fontWeight:600,cursor:"pointer",fontFamily:"inherit",color:"#991b1b",display:"flex",alignItems:"center",justifyContent:"center",gap:3}} onClick={()=>setCpuTrades(cpuTrades.filter(r=>!(r.date===date&&r.from===currentUser.name)))}><X size={8}/>Tausch zurückziehen</button></div>
                        )}
                        {/* CPU trade offer button for other CPU doctors */}
                        {cpuTrades.some(r=>r.status==="open"&&r.date===date&&r.from!==currentUser.name)&&cpuDoctors.includes(currentUser.name)&&!cpuTrades.some(r=>r.date===date&&r.from===currentUser.name)&&date>=todayStr&&(
                          <div style={{padding:"2px 9px 6px",marginTop:"auto"}}><button style={{width:"100%",padding:"4px 6px",background:"#f0f4f8",border:"1px solid #c8d6e5",borderRadius:5,fontSize:8,fontWeight:600,cursor:"pointer",fontFamily:"inherit",color:"#334e68"}} onClick={()=>{const req=cpuTrades.find(r=>r.status==="open"&&r.date===date&&r.from!==currentUser.name);if(req)cpuOfferTrade(req);}}>Tausch anbieten</button></div>
                        )}
                        {/* CPU trade request banner */}
                        {cpuTrades.some(r=>r.status==="open"&&r.date===date)&&(
                          <div style={{margin:"2px 9px",background:"#f0f4f8",border:"1px solid #c8d6e5",borderRadius:4,padding:"2px 5px",fontSize:7,fontWeight:600,color:"#334e68"}}><Flag size={7}/> {cpuTrades.find(r=>r.status==="open"&&r.date===date)?.from}: Tausch</div>
                        )}
                        {myCpuSick&&date>=todayStr&&(
                          <div style={{padding:"2px 9px 6px",marginTop:"auto"}}><button style={{width:"100%",padding:"4px 6px",background:"#fef2f2",border:"1px solid #fecaca",borderRadius:5,fontSize:8,fontWeight:600,cursor:"pointer",fontFamily:"inherit",color:"#991b1b",display:"flex",alignItems:"center",justifyContent:"center",gap:3}} onClick={()=>setCpuSick(cpuSick.filter(r=>r.id!==cpuSickHere.id))}><X size={8}/>Zurückziehen</button></div>
                        )}
                        {cpuSickHere&&!myCpuSick&&cpuDoctors.includes(currentUser.name)&&date>=todayStr&&(
                          <div style={{padding:"2px 9px 6px",marginTop:"auto"}}><button style={{width:"100%",padding:"4px 6px",background:"#f0fdf4",border:"1px solid #bbf7d0",borderRadius:5,fontSize:8,fontWeight:600,cursor:"pointer",fontFamily:"inherit",color:"#166534"}} onClick={()=>cpuCoverSick(cpuSickHere)}>Dienst übernehmen</button></div>
                        )}
                        {shiftAction&&shiftAction.date===date&&shiftAction.cpu&&(
                          <div data-action-popup="true" style={{position:"absolute",bottom:4,left:4,right:4,background:"#fff",border:"1.5px solid #334e68",borderRadius:8,padding:5,boxShadow:"0 8px 24px rgba(0,0,0,.15)",zIndex:10,display:"flex",flexDirection:"column",gap:3}}>
                            <button style={{padding:"7px 10px",background:"#f0f4f8",border:"none",borderRadius:6,fontSize:9,fontWeight:600,cursor:"pointer",fontFamily:"inherit",color:"#243b53",display:"flex",alignItems:"center",gap:5}} onClick={()=>{cpuRequestTrade(date,myCpuHere);setShiftAction(null);}}><Repeat2 size={10}/>Tausch anfragen</button>
                            <button style={{padding:"7px 10px",background:"#f0f4f8",border:"none",borderRadius:6,fontSize:9,fontWeight:600,cursor:"pointer",fontFamily:"inherit",color:"#dc2626",display:"flex",alignItems:"center",gap:5}} onClick={()=>{cpuReportSick(date,myCpuHere);setShiftAction(null);}}><X size={10}/>Krankmeldung</button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* CPU Trade list */}
                {cpuTrades.filter(r=>r.status==="open"&&r.monthKey===key).length>0&&(
                  <div style={{marginTop:12}}>
                    <div style={{fontSize:13,fontWeight:600,color:"#334e68",marginBottom:6}}>CPU-Tauschanfragen</div>
                    {cpuTrades.filter(r=>r.status==="open"&&r.monthKey===key).map(req=>{
                      const isReq=req.from===currentUser.name;
                      return(
                        <div key={req.id} style={{background:"#f0f4f8",border:"1px solid #c8d6e5",borderRadius:8,padding:"10px 12px",marginBottom:6}}>
                          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:6}}>
                            <span style={{fontSize:12}}><strong>{req.from}</strong> · {req.shift==="early"?"Früh":"Spät"} am {fmtDate(req.date)}</span>
                            {!isReq&&cpuDoctors.includes(currentUser.name)&&(
                              <button style={{padding:"5px 12px",background:"#334e68",color:"#fff",border:"none",borderRadius:5,fontSize:10,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}} onClick={()=>cpuOfferTrade(req)}>Tausch anbieten</button>
                            )}
                          </div>
                          {isReq&&(req.offers||[]).length>0&&(
                            <div style={{marginTop:6,borderTop:"1px solid #c8d6e5",paddingTop:6}}>
                              <div style={{fontSize:10,fontWeight:600,color:"#243b53",marginBottom:4}}>Angebotene Dienste:</div>
                              {(req.offers||[]).map(o=>(
                                <div key={o.id} style={{padding:"5px 8px",background:"#fff",borderRadius:5,display:"flex",alignItems:"center",justifyContent:"space-between",fontSize:11,marginBottom:3,border:"1px solid #dfe6ed"}}>
                                  <span><strong>{o.doctor}</strong> · {o.shift==="early"?"Früh":"Spät"} am {fmtDate(o.date)}</span>
                                  <button style={{padding:"3px 8px",background:"#334e68",color:"#fff",border:"none",borderRadius:4,fontSize:9,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}} onClick={()=>cpuAcceptOffer(req,o)}>Annehmen</button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── Meine Wünsche & Urlaub ── */}
        {view==="wishes"&&!isAdmin&&(
          <div>
            {approved?(
              <div>
                <div className="ban bang" style={{marginBottom:16}}>
                  <CheckCircle2 size={14}/>
                  <div><strong>{monthTitle}</strong> ist freigegeben. Ihre Dienste sehen Sie im Kalender. Wünsche unten für <strong>{nextMTitle}</strong>.</div>
                </div>

                {nextMApproved?(
                  <div className="ban bang" style={{marginBottom:0}}><CheckCircle2 size={14}/>{nextMTitle} ist ebenfalls freigegeben.</div>
                ):(
                  <div>
                    <div className="sec">
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
                        <div className="sec-t"><CalendarDays size={14}/>INN2 Dienstwünsche — {nextMTitle}</div>
                        <button className="btn bn" onClick={()=>showToast("Wünsche gespeichert")}><Save size={13}/>Speichern</button>
                      </div>
                      <div style={{display:"flex",flexWrap:"wrap",gap:6,alignItems:"center",marginBottom:8,fontSize:11,color:"#9ca3af"}}><span>Wochentage:</span><span style={{padding:"2px 6px",borderRadius:4,fontSize:10,fontWeight:700,background:CODES.DW.bg,color:CODES.DW.active,border:"1px solid "+CODES.DW.border}}>DW</span><span style={{padding:"2px 6px",borderRadius:4,fontSize:10,fontWeight:700,background:CODES.U.bg,color:CODES.U.active,border:"1px solid "+CODES.U.border}}>U</span><span style={{padding:"2px 6px",borderRadius:4,fontSize:10,fontWeight:700,background:CODES.kD.bg,color:CODES.kD.active,border:"1px solid "+CODES.kD.border}}>kD</span><span style={{color:"#d1d5db"}}>·</span><span>WE/Feiertag:</span><span style={{padding:"2px 6px",borderRadius:4,fontSize:10,fontWeight:700,background:CODES.TW.bg,color:CODES.TW.active,border:"1px solid "+CODES.TW.border}}>TW</span><span style={{padding:"2px 6px",borderRadius:4,fontSize:10,fontWeight:700,background:CODES.NW.bg,color:CODES.NW.active,border:"1px solid "+CODES.NW.border}}>NW</span><span style={{padding:"2px 6px",borderRadius:4,fontSize:10,fontWeight:700,background:CODES.U.bg,color:CODES.U.active,border:"1px solid "+CODES.U.border}}>U</span><span style={{padding:"2px 6px",borderRadius:4,fontSize:10,fontWeight:700,background:CODES.kD.bg,color:CODES.kD.active,border:"1px solid "+CODES.kD.border}}>kD</span></div>

                      <div className="ch">{["Mo","Di","Mi","Do","Fr","Sa","So"].map(w=><div key={w} className="cwd">{w}</div>)}</div>
                      <div className="cgrid">
                        {Array.from({length:nextMBlanks}).map((_,i)=><div key={`nwb${i}`}/>)}
                        {nextMDays.map(day=>{
                          const date=isoDate(nextY,nextM,day);
                          const code=avail[currentUser.name]?.[date]||"";
                          const info=CODES[code]||CODES[""];
                          const spec=isSpecial(nextY,nextM,day);
                          const codesForDay=spec?["TW","NW","U","kD"]:["DW","U","kD"];
                          return(
                            <div key={date} style={{background:code?info.bg:"#f4f5f7",border:"1.5px solid "+(code?info.border:"#eaecf0"),borderRadius:8,padding:"6px 3px",display:"flex",flexDirection:"column",alignItems:"center",gap:3,minHeight:72}}>
                              <div style={{fontSize:13,fontWeight:700,color:code?info.text:"#121826"}}>{day}</div>
                              <div style={{display:"flex",flexWrap:"wrap",gap:3,justifyContent:"center",marginTop:"auto"}}>
                                {codesForDay.map(c=>{
                                  const ci=CODES[c];const active=code===c;
                                  return(
                                    <button key={c} onClick={()=>updateCode(currentUser.name,date,active?"":c)}
                                      style={{padding:"6px 10px",borderRadius:6,fontSize:10,fontWeight:700,cursor:"pointer",border:"1.5px solid "+(active?ci.active:ci.border),background:active?ci.active:"#fff",color:active?"#fff":"#aaa",fontFamily:"inherit",lineHeight:1.2,transition:"all .1s",minHeight:28}}>
                                      {c}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ):pastMonth?(
              <div className="ban bana"><CalendarDays size={14}/>Vergangener Monat — Abstimmung geschlossen.</div>
            ):(
              <div>
                {/* Dienstwünsche */}
                <div className="sec">
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
                    <div className="sec-t"><CalendarDays size={14}/>INN2 Dienstwünsche</div>
                    <button className="btn bn" onClick={()=>showToast("Wünsche gespeichert")}><Save size={13}/>Speichern</button>
                  </div>
                  <div style={{display:"flex",flexWrap:"wrap",gap:6,alignItems:"center",marginBottom:8,fontSize:11,color:"#9ca3af"}}><span>Wochentage:</span><span style={{padding:"2px 6px",borderRadius:4,fontSize:10,fontWeight:700,background:CODES.DW.bg,color:CODES.DW.active,border:"1px solid "+CODES.DW.border}}>DW</span><span style={{padding:"2px 6px",borderRadius:4,fontSize:10,fontWeight:700,background:CODES.U.bg,color:CODES.U.active,border:"1px solid "+CODES.U.border}}>U</span><span style={{padding:"2px 6px",borderRadius:4,fontSize:10,fontWeight:700,background:CODES.kD.bg,color:CODES.kD.active,border:"1px solid "+CODES.kD.border}}>kD</span><span style={{color:"#d1d5db"}}>·</span><span>WE/Feiertag:</span><span style={{padding:"2px 6px",borderRadius:4,fontSize:10,fontWeight:700,background:CODES.TW.bg,color:CODES.TW.active,border:"1px solid "+CODES.TW.border}}>TW</span><span style={{padding:"2px 6px",borderRadius:4,fontSize:10,fontWeight:700,background:CODES.NW.bg,color:CODES.NW.active,border:"1px solid "+CODES.NW.border}}>NW</span><span style={{padding:"2px 6px",borderRadius:4,fontSize:10,fontWeight:700,background:CODES.U.bg,color:CODES.U.active,border:"1px solid "+CODES.U.border}}>U</span><span style={{padding:"2px 6px",borderRadius:4,fontSize:10,fontWeight:700,background:CODES.kD.bg,color:CODES.kD.active,border:"1px solid "+CODES.kD.border}}>kD</span></div>

                  <div className="ch">{["Mo","Di","Mi","Do","Fr","Sa","So"].map(w=><div key={w} className="cwd">{w}</div>)}</div>
                  <div className="cgrid">
                    {Array.from({length:blanks}).map((_,i)=><div key={`wb${i}`}/>)}
                    {days.map(day=>{
                      const date=isoDate(year,month,day);
                      const code=avail[currentUser.name]?.[date]||"";
                      const info=CODES[code]||CODES[""];
                      const spec=isSpecial(year,month,day);
                      const codesForDay=spec?["TW","NW","U","kD"]:["DW","U","kD"];
                      return(
                        <div key={date} style={{background:code?info.bg:"#f4f5f7",border:"1.5px solid "+(code?info.border:"#eaecf0"),borderRadius:8,padding:"6px 3px",display:"flex",flexDirection:"column",alignItems:"center",gap:3,minHeight:72}}>
                          <div style={{fontSize:13,fontWeight:700,color:code?info.text:"#121826"}}>{day}</div>
                          <div style={{display:"flex",flexWrap:"wrap",gap:3,justifyContent:"center",marginTop:"auto"}}>
                            {codesForDay.map(c=>{
                              const ci=CODES[c];const active=code===c;
                              return(
                                <button key={c} onClick={()=>updateCode(currentUser.name,date,active?"":c)}
                                  style={{padding:"6px 10px",borderRadius:6,fontSize:10,fontWeight:700,cursor:"pointer",border:"1.5px solid "+(active?ci.active:ci.border),background:active?ci.active:"#fff",color:active?"#fff":"#aaa",fontFamily:"inherit",lineHeight:1.2,transition:"all .1s",minHeight:28}}>
                                  {c}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Abkürzungen */}
                <div className="sc" style={{marginTop:14}}>
                  <div style={{fontSize:12,fontWeight:600,marginBottom:6}}>Abkürzungen</div>
                  <div className="leg">
                    {Object.entries(CODES).filter(([c])=>c&&c!=="DT"&&c!=="DN").map(([code,info])=>(
                      <span key={code} className="li" style={{background:info.bg,color:info.text,borderColor:info.border}}>
                        {code==="Vd"&&<Stethoscope size={10}/>}
                        {code==="TW"&&<Sun size={10}/>}
                        {code==="NW"&&<Moon size={10}/>}
                        <strong>{code}</strong> {info.label}
                      </span>
                    ))}
                  </div>
                </div>

                {/* ── Urlaubstage Section (inside wishes) ── */}
                <div className="sc" style={{marginTop:14}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4,flexWrap:"wrap",gap:8}}>
                    <div className="stit" style={{color:"#6b21a8"}}><Palmtree size={14}/>Urlaubstage</div>
                    <div style={{display:"flex",gap:7}}>
                      <button className="btn bn" onClick={()=>showToast("Urlaubstage gespeichert ✓")}><Save size={13}/>Speichern</button>
                      <button className="btn bpurple" onClick={exportUrlaub}><Download size={13}/>Urlaubskarte</button>
                    </div>
                  </div>
                  <div className="ssub">Urlaubstage auswählen oder Zeitraum eingeben. Werden automatisch in den Dienstplan und in die Urlaubskarte übernommen.</div>

                  <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12,flexWrap:"wrap",background:"#faf5ff",border:"1px solid #e9d5ff",borderRadius:8,padding:10}}>
                    <label style={{fontSize:12,fontWeight:500,color:"#6b21a8"}}>Von</label>
                    <input type="date" value={urlaubFrom} onChange={e=>setUrlaubFrom(e.target.value)} style={{padding:"5px 8px",border:"1px solid #e9d5ff",borderRadius:5,fontSize:12,fontFamily:"inherit",outline:"none",background:"#fff"}}/>
                    <label style={{fontSize:12,fontWeight:500,color:"#6b21a8"}}>Bis</label>
                    <input type="date" value={urlaubTo} onChange={e=>setUrlaubTo(e.target.value)} style={{padding:"5px 8px",border:"1px solid #e9d5ff",borderRadius:5,fontSize:12,fontFamily:"inherit",outline:"none",background:"#fff"}}/>
                    <button className="btn bpurple bsm" onClick={applyUrlaubRange}>Eintragen</button>
                  </div>

                  <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10,flexWrap:"wrap"}}>
                    <button className="btn bg bsm" onClick={()=>{const n=new Date(urlaubPickYear,urlaubPickMonth-1,1);setUrlaubPickYear(n.getFullYear());setUrlaubPickMonth(n.getMonth());}}><ChevronLeft size={12}/></button>
                    <span style={{fontSize:14,fontWeight:600,minWidth:130,textAlign:"center"}}>{monthLong(urlaubPickYear,urlaubPickMonth)}</span>
                    <button className="btn bg bsm" onClick={()=>{const n=new Date(urlaubPickYear,urlaubPickMonth+1,1);setUrlaubPickYear(n.getFullYear());setUrlaubPickMonth(n.getMonth());}}><ChevronRight size={12}/></button>
                  </div>

                  <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:2,marginBottom:4}}>
                    {["Mo","Di","Mi","Do","Fr","Sa","So"].map(w=><div key={w} style={{textAlign:"center",fontSize:9,fontWeight:700,textTransform:"uppercase",letterSpacing:".06em",color:"#fff",padding:"4px 0",background:"#121826",borderRadius:3}}>{w}</div>)}
                  </div>

                  <div className="urlaub-day-grid">
                    {Array.from({length:urlaubPickBlanks}).map((_,i)=><div key={`ub2${i}`} className="urlaub-day blank"/>)}
                    {urlaubPickDays.map(day=>{
                      const date=isoDate(urlaubPickYear,urlaubPickMonth,day);
                      const isWk=isWknd(urlaubPickYear,urlaubPickMonth,day);
                      const sel=myUrlaubDays.includes(date);
                      return(
                        <div key={date}
                          className={`urlaub-day ${isWk?"uwknd":""} ${sel?"usel":""}`}
                          onClick={()=>toggleUrlaubDay(date)}
                          title={date}>
                          {day}
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>
            )}
          </div>
        )}

        {/* ── Admin ── */}
        {view==="admin"&&isAdmin&&(
          <div>
            <div className="sc">
              <div style={{fontSize:16,fontWeight:700,display:"flex",alignItems:"center",gap:8,letterSpacing:"-.01em",color:"#121826"}}><Stethoscope size={18} strokeWidth={2}/>Hausdienst Planung & Freigabe</div>
              <div className="ssub">Plan generieren, anpassen und freigeben.</div>
              {trades.filter(r=>r.monthKey===key).length>0&&(
                <div style={{marginBottom:12}}>
                  {trades.filter(r=>r.monthKey===key).map(r=>(
                    <div key={r.id} className={`tcard ${r.status==="accepted"?"ok":""}`} style={{marginBottom:5}}>
                      <span style={{fontSize:12}}><strong>{r.from}</strong> — {r.date}{r.status==="accepted"&&r.acceptedOffer?` → ${r.acceptedOffer.doctor} (${r.acceptedOffer.date})`:""}</span>
                    </div>
                  ))}
                </div>
              )}
              <div className="aarow">
                <button style={{display:"inline-flex",alignItems:"center",gap:6,padding:"7px 13px",borderRadius:7,fontSize:12,fontWeight:500,cursor:"pointer",border:"1.5px solid #fed7aa",background:"#fff7ed",color:"#c2410c",fontFamily:"inherit",transition:"all .12s"}} onClick={()=>{setApprovedM(o=>({...o,[key]:false}));setPlanGenerated(o=>({...o,[key]:true}));}}>Abstimmung re-öffnen</button>
                <button style={{display:"inline-flex",alignItems:"center",gap:6,padding:"7px 13px",borderRadius:7,fontSize:12,fontWeight:500,cursor:"pointer",border:"none",background:"#121826",color:"#fff",fontFamily:"inherit",transition:"all .15s"}} onClick={generatePlan} disabled={pastMonth} onMouseEnter={e=>e.currentTarget.style.background="#1e2a3d"} onMouseLeave={e=>e.currentTarget.style.background="#121826"}>Generieren</button>
                <button style={{display:"inline-flex",alignItems:"center",gap:8,padding:"10px 22px",borderRadius:8,fontSize:13,fontWeight:600,cursor:"pointer",border:"none",background:"#121826",color:"#fff",fontFamily:"inherit",letterSpacing:".01em",transition:"all .15s"}} onClick={approvePlan} onMouseEnter={e=>e.currentTarget.style.background="#1e2a3d"} onMouseLeave={e=>e.currentTarget.style.background="#121826"}><CheckCircle2 size={15}/>Dienstplan freigeben</button>
                {approved&&<span style={{fontSize:11,fontWeight:600,color:"#166534",background:"#dcfce7",padding:"4px 10px",borderRadius:20,display:"flex",alignItems:"center",gap:4}}><CheckCircle2 size={12}/>Freigegeben</span>}
              </div>
              {conflictInfo.length>0&&(
                <div style={{marginTop:12,background:"#fef2f2",border:"1.5px solid #fecaca",borderRadius:10,padding:"14px 16px"}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                    <div style={{fontSize:13,fontWeight:600,color:"#991b1b"}}>Konflikte gefunden — Freigabe blockiert</div>
                    <button style={{background:"#121826",color:"#fff",border:"none",borderRadius:6,padding:"5px 14px",fontSize:11,fontWeight:600,cursor:"pointer",fontFamily:"inherit",transition:"background .12s"}} onClick={()=>setConflictInfo([])} onMouseEnter={e=>e.currentTarget.style.background="#1e2a3d"} onMouseLeave={e=>e.currentTarget.style.background="#121826"}>OK</button>
                  </div>
                  {conflictInfo.slice(0,8).map((c,i)=>(
                    <div key={i} style={{fontSize:12,color:"#dc2626",padding:"4px 0",borderTop:i?"1px solid #fecaca":"none",display:"flex",alignItems:"center",gap:6}}>
                      <span style={{width:6,height:6,borderRadius:"50%",background:"#ef4444",flexShrink:0}}/>
                      {c.msg}
                    </div>
                  ))}
                </div>
              )}
              {pastMonth&&<div style={{marginTop:8,fontSize:11,color:"#9ca3af"}}>Vergangene Monate können nicht neu generiert werden.</div>}
            </div>

            {/* Admin calendar */}
            <div className="sc">
              <div className="stit">{monthTitle}</div>
              <div className="ch">{[["Montag","Mo"],["Dienstag","Di"],["Mittwoch","Mi"],["Donnerstag","Do"],["Freitag","Fr"],["Samstag","Sa"],["Sonntag","So"]].map(([f,s])=><div key={s} className="cwd"><span className="wd-full">{f}</span><span className="wd-short">{s}</span></div>)}</div>
              <div className="cgrid" style={{gap:3}}>
                {Array.from({length:blanks}).map((_,i)=><div key={`abl${i}`}/>)}
                {days.map(day=>{
                  const date=isoDate(year,month,day);
                  const a=assignments[date]||emptyA();
                  const holiday=holidays[date];
                  const special=isSpecial(year,month,day);
                  const sat=isSat(year,month,day),sun=isSun(year,month,day);
                  const cellConflict=conflictInfo.some(c=>(c.dates||[c.date]).includes(date));
                  return(
                    <div key={date} className={`acc ${moveFrom===date?"sel":""}`} style={cellConflict?{borderColor:"#ef4444",boxShadow:"0 0 0 1.5px #ef4444",background:"#fef2f2"}:{}}>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                        <strong style={{fontSize:11}}>{day} <span style={{fontSize:9,color:"#9ca3af",fontWeight:400}}>{wdShort(year,month,day)}</span></strong>
                      </div>
                      {holiday&&<div className="htag">{holiday}</div>}
                      {sickReports.some(r=>r.status==="open"&&r.monthKey===key&&r.date===date)&&(
                        <div style={{background:"#fef2f2",border:"1px solid #fecaca",borderRadius:4,padding:"2px 5px",fontSize:8,fontWeight:700,color:"#dc2626",marginBottom:2}}>
                          {sickReports.find(r=>r.status==="open"&&r.monthKey===key&&r.date===date).from}: KRANK
                        </div>
                      )}
                      {special&&!sun&&(
                        <div className="sblk svdb">
                          <div className="sbh v"><span>Vd</span><button className="rmv" onClick={()=>updateAssignment(date,"visit","")}><X size={9}/></button></div>
                          <select className="ssel" value={a.visit||""} onChange={e=>updateAssignment(date,"visit",e.target.value)}>
                            <option value="">offen</option>{doctors.map(d=><option key={d} value={d}>{d}</option>)}
                          </select>
                        </div>
                      )}
                      {special&&sun&&(
                        <div className="sblk svdb">
                          <div className="sbh v"><span>Vd</span><button className="rmv" onClick={()=>updateAssignment(date,"visit","")}><X size={9}/></button></div>
                          <select className="ssel" value={a.visit||""} onChange={e=>updateAssignment(date,"visit",e.target.value)}>
                            <option value="">offen</option>{doctors.map(d=><option key={d} value={d}>{d}</option>)}
                          </select>
                        </div>
                      )}
                      {special&&(
                        <div className="sblk stdb">
                          <div className="sbh t"><Sun size={9} style={{marginRight:2}}/><span>TD</span><button className="rmv" onClick={()=>updateAssignment(date,"day","")}><X size={9}/></button></div>
                          <select className="ssel" value={a.day||""} onChange={e=>updateAssignment(date,"day",e.target.value)}>
                            <option value="">offen</option>{doctors.map(d=><option key={d} value={d}>{d}</option>)}
                          </select>
                        </div>
                      )}
                      <div className="sblk sndb">
                        <div className="sbh n"><Moon size={9} style={{marginRight:2}}/><span>ND</span><button className="rmv" onClick={()=>updateAssignment(date,"night","")}><X size={9}/></button></div>
                        <select className="ssel" value={a.night||""} onChange={e=>updateAssignment(date,"night",e.target.value)}>
                          <option value="">offen</option>{doctors.map(d=><option key={d} value={d}>{d}</option>)}
                        </select>
                      </div>
                      {planGenerated[key]&&!approved&&(
                        <button className="swpbtn" style={{padding:"7px 12px",fontSize:11}} onClick={()=>swapDates(date)}>
                          <Repeat2 size={13}/>{moveFrom&&moveFrom!==date?"Hier tauschen":"Verschieben"}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>


            {/* Matrix + Teilnehmer merged */}
            <div className="sc">
              <div style={{fontSize:16,fontWeight:700,marginBottom:3,letterSpacing:"-.01em",color:"#121826",display:"flex",alignItems:"baseline",gap:8}}>Verfügbarkeitsmatrix für INN2 <span style={{fontSize:12,fontWeight:500,color:"#9ca3af"}}>{monthTitle}</span></div>
              <div style={{display:"flex",flexWrap:"wrap",gap:10,marginBottom:10,fontSize:11,color:"#9ca3af",alignItems:"center"}}>
                <span style={{display:"flex",alignItems:"center",gap:4}}><input type="checkbox" checked disabled style={{accentColor:"#121826",width:13,height:13}}/>Teilnehmer</span>
                <span style={{display:"flex",alignItems:"center",gap:4}}><span style={{width:18,height:18,borderRadius:4,background:"#fef2f2",border:"1px solid #fecaca",display:"inline-flex",alignItems:"center",justifyContent:"center"}}><X size={10} color="#dc2626"/></span>Entfernen</span>
                <span style={{display:"flex",alignItems:"center",gap:4}}><span style={{width:10,height:10,borderRadius:2,background:"#fef9c3",border:"1px solid #fde68a"}}/>Mehrere Wünsche</span>
                <span style={{fontSize:1,color:"#e5e7eb"}}>|</span>
                <span style={{padding:"2px 6px",borderRadius:3,fontSize:10,fontWeight:700,background:CODES.DW.bg,color:CODES.DW.text,border:`1px solid ${CODES.DW.border}`}}>DW</span>
                <span style={{padding:"2px 6px",borderRadius:3,fontSize:10,fontWeight:700,background:CODES.TW.bg,color:CODES.TW.text,border:`1px solid ${CODES.TW.border}`}}>TW</span>
                <span style={{padding:"2px 6px",borderRadius:3,fontSize:10,fontWeight:700,background:CODES.NW.bg,color:CODES.NW.text,border:`1px solid ${CODES.NW.border}`}}>NW</span>
                <span style={{padding:"2px 6px",borderRadius:3,fontSize:10,fontWeight:700,background:CODES.U.bg,color:CODES.U.text,border:`1px solid ${CODES.U.border}`}}>U</span>
                <span style={{padding:"2px 6px",borderRadius:3,fontSize:10,fontWeight:700,background:CODES.kD.bg,color:CODES.kD.text,border:`1px solid ${CODES.kD.border}`}}>kD</span>
              </div>
              <div className="mxw">
                <table className="mxt">
                  <thead><tr>
                    <th>Arzt</th>
                    {days.map(d=><th key={d}><div style={{fontSize:8,color:"#9ca3af"}}>{wdShort(year,month,d)}</div><div>{d}</div></th>)}
                  </tr></thead>
                  <tbody>{doctors.map(doc=>(
                    <tr key={doc} style={{opacity:inclDocs[doc]===false?.45:1}}>
                      <td>
                        <div style={{display:"flex",alignItems:"center",gap:5}}>
                          <input type="checkbox" checked={inclDocs[doc]!==false} onChange={e=>setInclDocs(o=>({...o,[doc]:e.target.checked}))} style={{accentColor:"#121826",width:13,height:13,cursor:"pointer",flexShrink:0}}/>
                          <span style={{flex:1,fontSize:11,fontWeight:inclDocs[doc]!==false?600:400,letterSpacing:".01em"}}>{doc}</span>
                          {confirmDelete===doc?(
                            <div style={{display:"flex",alignItems:"center",gap:2}}>
                              <button style={{background:"#dc2626",border:"none",borderRadius:4,cursor:"pointer",color:"#fff",fontSize:8,fontWeight:600,padding:"2px 5px",fontFamily:"inherit"}} onClick={()=>{removeDoctor(doc);setConfirmDelete(null);}}>Entfernen</button>
                              <button style={{background:"#f4f5f7",border:"none",borderRadius:4,cursor:"pointer",color:"#374151",fontSize:8,fontWeight:600,padding:"2px 5px",fontFamily:"inherit"}} onClick={()=>setConfirmDelete(null)}>Abbrechen</button>
                            </div>
                          ):(
                            <button style={{width:18,height:18,background:"#fef2f2",border:"1px solid #fecaca",borderRadius:4,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",padding:0,flexShrink:0}} onClick={()=>setConfirmDelete(doc)}><X size={10} color="#dc2626"/></button>
                          )}
                        </div>
                      </td>
                      {days.map(day=>{
                        const date=isoDate(year,month,day);
                        const code=avail[doc]?.[date]||"";
                        const multi=code==="DW"&&votes(avail,date,"DW").length>1;
                        const info=CODES[code]||CODES[""];
                        return(
                          <td key={date} style={{padding:2}}>
                            <span style={{display:"block",textAlign:"center",fontSize:9,fontWeight:code?700:400,borderRadius:3,padding:"2px 1px",letterSpacing:".02em",background:multi?"#fef9c3":code?info.bg:"transparent",color:multi?"#854d0e":code?info.text:"#d1d5db",border:code?`1px solid ${multi?"#fde68a":info.border}`:"1px solid transparent"}}>{code||"–"}</span>
                          </td>
                        );
                      })}
                    </tr>
                  ))}</tbody>
                </table>
              </div>
              <div style={{display:"flex",gap:6,marginTop:12}}>
                <input placeholder="Arzt hinzufügen" value={newDocName} onChange={e=>setNewDocName(e.target.value)} style={{flex:1,padding:"6px 10px",border:"1px solid #e5e7eb",borderRadius:6,fontSize:12,fontFamily:"inherit"}} onKeyDown={e=>e.key==="Enter"&&addDoctor()}/>
                <input placeholder="Benutzername" value={newDocEmail} onChange={e=>setNewDocEmail(e.target.value)} style={{flex:1,padding:"6px 10px",border:"1px solid #e5e7eb",borderRadius:6,fontSize:12,fontFamily:"inherit"}} onKeyDown={e=>e.key==="Enter"&&addDoctor()}/>
                <button className="btn bn" onClick={addDoctor}>Hinzufügen</button>
              </div>
              <p style={{fontSize:11,color:"#9ca3af",marginTop:5}}>Standardpasswort: 1234</p>
            </div>

            {/* ── CPU (Chest Pain Unit) ── */}
            <div className="sc">
              <div style={{fontSize:16,fontWeight:700,color:"#334e68",display:"flex",alignItems:"center",gap:8,letterSpacing:"-.01em"}}>🫀 Chest Pain Unit <span style={{fontSize:12,fontWeight:500,color:"#9fb3c8"}}>(CPU)</span></div>

              {/* CPU Doctor list with remove/add */}
              <div style={{display:"flex",flexWrap:"wrap",gap:5,marginBottom:8}}>
                {cpuDoctors.filter(d=>users.some(u=>u.name===d)).map(d=>(
                  <span key={d} style={{fontSize:11,fontWeight:500,background:"#f0f4f8",border:"1px solid #c8d6e5",color:"#243b53",borderRadius:20,padding:"3px 6px 3px 10px",display:"flex",alignItems:"center",gap:4}}>
                    {d}
                    <button onClick={()=>setCpuDoctors(prev=>prev.filter(x=>x!==d))} style={{background:"none",border:"none",cursor:"pointer",color:"#334e68",display:"flex",padding:0,opacity:.6}} onMouseEnter={e=>e.currentTarget.style.opacity="1"} onMouseLeave={e=>e.currentTarget.style.opacity=".6"}><X size={11}/></button>
                  </span>
                ))}
              </div>
              <div style={{display:"flex",gap:6,marginBottom:14}}>
                <select value={newCpuDoc} onChange={e=>setNewCpuDoc(e.target.value)} style={{flex:1,padding:"6px 10px",border:"1px solid #e5e7eb",borderRadius:6,fontSize:12,fontFamily:"inherit",background:"#fff"}}>
                  <option value="">Arzt hinzufügen...</option>
                  {doctors.filter(d=>!cpuDoctors.includes(d)).map(d=><option key={d} value={d}>{d}</option>)}
                </select>
                <button className="btn bn bsm" onClick={()=>{if(newCpuDoc){setCpuDoctors(prev=>[...prev,newCpuDoc].sort((a,b)=>a.localeCompare(b)));setNewCpuDoc("");showToast(`${newCpuDoc} zu CPU hinzugefügt`);}}}>Hinzufügen</button>
              </div>

              <div style={{display:"flex",flexWrap:"wrap",gap:7,marginBottom:14}}>
                {cpuApproved&&<button style={{display:"inline-flex",alignItems:"center",gap:6,padding:"7px 13px",borderRadius:7,fontSize:12,fontWeight:500,cursor:"pointer",border:"1.5px solid #fecdd3",background:"#fff1f2",color:"#9f1239",fontFamily:"inherit",transition:"all .12s"}} onClick={()=>setCpuApprovedM(o=>({...o,[key]:false}))}>Abstimmung re-öffnen</button>}
                <button className="btn bn" onClick={generateCPU} disabled={pastMonth}>CPU Generieren</button>
                <button style={{display:"inline-flex",alignItems:"center",gap:8,padding:"10px 22px",borderRadius:8,fontSize:13,fontWeight:600,cursor:"pointer",border:"none",background:"#121826",color:"#fff",fontFamily:"inherit",transition:"all .15s"}} onClick={approveCPU} onMouseEnter={e=>e.currentTarget.style.background="#1e2a3d"} onMouseLeave={e=>e.currentTarget.style.background="#121826"}><CheckCircle2 size={15}/>CPU freigeben</button>
                {cpuApproved&&<span style={{fontSize:11,fontWeight:600,color:"#166534",background:"#dcfce7",padding:"4px 10px",borderRadius:20,display:"flex",alignItems:"center",gap:4}}><CheckCircle2 size={12}/>Freigegeben</span>}
              </div>

              {/* CPU Sick/Trade alerts */}
              {cpuSick.filter(r=>r.status==="open"&&r.monthKey===key).length>0&&(
                <div style={{background:"#fef2f2",border:"1px solid #fecaca",borderRadius:8,padding:"8px 12px",marginBottom:10,fontSize:12}}>
                  <strong style={{color:"#991b1b"}}>CPU-Krankmeldungen:</strong>{" "}
                  {cpuSick.filter(r=>r.status==="open"&&r.monthKey===key).map(r=>`${r.from} (${fmtDate(r.date)})`).join(" · ")}
                </div>
              )}

              <div className="ch">{["Mo","Di","Mi","Do","Fr","Sa","So"].map(w=><div key={w} className="cwd">{w}</div>)}</div>
              <div className="cgrid" style={{gap:3}}>
                {Array.from({length:blanks}).map((_,i)=><div key={`cpubl${i}`}/>)}
                {days.map(day=>{
                  const date=isoDate(year,month,day);
                  const c=cpuAssignments[date]||emptyCPU();
                  const sp=isSpecial(year,month,day);
                  const holiday=holidays[date];
                  const activeCPU=cpuDoctors.filter(d=>users.some(u=>u.name===d));
                  const cpuSickHere=cpuSick.find(r=>r.status==="open"&&r.monthKey===key&&r.date===date);
                  return(
                    <div key={date} className="acc" style={{minHeight:sp?100:120,borderColor:cpuSickHere?"#ef4444":""}}>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                        <strong style={{fontSize:11}}>{day} <span style={{fontSize:9,color:"#9ca3af",fontWeight:400}}>{wdShort(year,month,day)}</span></strong>
                      </div>
                      {holiday&&<div className="htag">{holiday}</div>}
                      {cpuSickHere&&<div style={{background:"#fef2f2",border:"1px solid #fecaca",borderRadius:4,padding:"1px 4px",fontSize:7,fontWeight:700,color:"#dc2626"}}>{cpuSickHere.from}: Krank</div>}
                      <div className="sblk" style={{background:"#f0f4f8",border:"1px solid #c8d6e5"}}>
                        <div className="sbh" style={{color:"#334e68"}}><span style={{display:"flex",alignItems:"center",gap:3}}><Sun size={9}/>Früh 1</span><button className="rmv" onClick={()=>updateCPUAssignment(date,"early","")}><X size={9}/></button></div>
                        <select className="ssel" value={c.early||""} onChange={e=>updateCPUAssignment(date,"early",e.target.value)}>
                          <option value="">offen</option>{activeCPU.map(d=><option key={d} value={d}>{d}</option>)}
                        </select>
                      </div>
                      {/* Second Frühdienst - weekdays only */}
                      {!sp&&(c.early2?(
                        <div className="sblk" style={{background:"#e8eef4",border:"1px solid #c8d6e5"}}>
                          <div className="sbh" style={{color:"#334e68"}}><span style={{display:"flex",alignItems:"center",gap:3}}><Sun size={9}/>Früh 2</span><button className="rmv" onClick={()=>updateCPUAssignment(date,"early2","")}><X size={9}/></button></div>
                          <select className="ssel" value={c.early2||""} onChange={e=>updateCPUAssignment(date,"early2",e.target.value)}>
                            <option value="">offen</option>{activeCPU.map(d=><option key={d} value={d}>{d}</option>)}
                          </select>
                        </div>
                      ):(
                        !sp&&<button style={{width:"100%",padding:"3px",background:"#f0f4f8",border:"1px dashed #c8d6e5",borderRadius:5,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:3,fontSize:8,fontWeight:500,color:"#9fb3c8",fontFamily:"inherit",transition:"all .12s"}} onClick={()=>updateCPUAssignment(date,"early2","offen")} onMouseEnter={e=>{e.currentTarget.style.borderColor="#334e68";e.currentTarget.style.color="#334e68";}} onMouseLeave={e=>{e.currentTarget.style.borderColor="#c8d6e5";e.currentTarget.style.color="#9fb3c8";}}>+ Früh 2</button>
                      ))}
                      {!sp&&(
                        <div className="sblk" style={{background:"#dfe6ed",border:"1px solid #9fb3c8"}}>
                          <div className="sbh" style={{color:"#243b53"}}><span style={{display:"flex",alignItems:"center",gap:3}}><Moon size={9}/>Spät</span><button className="rmv" onClick={()=>updateCPUAssignment(date,"late","")}><X size={9}/></button></div>
                          <select className="ssel" value={c.late||""} onChange={e=>updateCPUAssignment(date,"late",e.target.value)}>
                            <option value="">offen</option>{activeCPU.map(d=><option key={d} value={d}>{d}</option>)}
                          </select>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>


          </div>
        )}

        {/* Undo remove notification */}
        {removedUndo&&(
          <div style={{position:"fixed",bottom:20,left:"50%",transform:"translateX(-50%)",background:"#121826",color:"#fff",padding:"10px 16px",borderRadius:10,fontSize:13,fontWeight:500,zIndex:250,display:"flex",alignItems:"center",gap:12,boxShadow:"0 8px 24px rgba(0,0,0,.2)"}}>
            <span>{removedUndo.name} entfernt</span>
            <button style={{background:"#fff",color:"#121826",border:"none",borderRadius:6,padding:"4px 12px",fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}} onClick={undoRemoveDoctor}>Rückgängig</button>
          </div>
        )}

      </div>
    </div>
  );
}

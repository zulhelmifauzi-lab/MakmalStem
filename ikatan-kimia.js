(()=>{
"use strict";
const {TAU,SR,NUC,W,OV,ELS,E,CATN,conf,Rof,cationShells,SUB,SUP,sub,chg,coef,gcd,elOrder,ANION,DIAT,UNSUR,SAME,OOS,COV,rep,cov,NOTE_B,gasAdiReason,relation,balance,tendency}=globalThis.BondModel;
/* =========================================================
   KEADAAN DUNIA
   ========================================================= */
let bodies=[];let uid=1;
let mode='bohr',dotMode=false,showLabel=true,autoUnsur=true,speed=1,paused=false;
let focus=null;        // jasad yang dipaparkan dalam panel Lewis
let T=0;               // jam simulasi
const stage=document.getElementById('stage');
const cv=document.getElementById('world');const ctx=cv.getContext('2d');
let VW=800,VH=600,DPR=1,ZOOM=1;

function newAtom(sym){return {el:E[sym],ph:Math.random()*TAU,id:uid++};}
function atomBody(atom,x,y){
  const sp=40+Math.random()*40,a=Math.random()*TAU;
  return {id:uid++,type:'atom',members:[{atom,el:atom.el,bx:0,by:0,lx:0,ly:0}],x,y,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp,
    ang:0,om:0,r:Rof(atom.el)+4,mass:atom.el.m,info:null,form:null};
}
const symOf=b=>b.members[0].atom.el.s;

/* ---------- Bina molekul kovalen ---------- */
function loneDirs(bonds,count){
  if(count<=0)return [];
  if(bonds.length===1){
    const b=bonds[0],out=[-b[0],-b[1]],p1=[-b[1],b[0]],p2=[b[1],-b[0]];
    if(count===1)return [out];if(count===2)return [p1,p2];return [out,p1,p2].slice(0,count);
  }
  const all=[[0,-1],[0,1],[-1,0],[1,0]];
  return all.filter(d=>!bonds.some(b=>Math.abs(b[0]-d[0])<.01&&Math.abs(b[1]-d[1])<.01)).slice(0,count);
}
function buildCov(spec,pick,isUnsur){
  const c=pick(spec.central);const n=spec.terms.length;
  const DV={1:[[1,0]],2:[[-1,0],[1,0]],3:[[-1,0],[1,0],[0,1]],4:[[-1,0],[1,0],[0,-1],[0,1]]}[n];
  const mem=[{atom:c,bx:0,by:0,lx:0,ly:0,bonds:[],sum:0,shape:isUnsur?'dot':'x'}];
  const bonds=[];const Rc=Rof(c.el);
  spec.terms.forEach(([s,o],i)=>{
    const a=pick(s),u=DV[i],Rt=Rof(a.el);
    const ov=Math.min(Math.min(Rc,Rt)*0.58,o===3?13:o===2?11:9);
    const d=Rc+Rt-ov,L=(s==='H'||c.el.s==='H')?42:52;
    mem.push({atom:a,bx:u[0]*d,by:u[1]*d,lx:u[0]*L,ly:u[1]*L,bonds:[[-u[0],-u[1]]],sum:o,shape:isUnsur?'x':'dot'});
    mem[0].bonds.push(u);mem[0].sum+=o;bonds.push({a:0,b:i+1,o,u,d});
  });
  const fixed=[];const kc=mem.map(()=>0);
  bonds.forEach(bd=>{
    const A=mem[0],B=mem[bd.b],Ra=Rof(A.atom.el),Rb=Rof(B.atom.el),d=bd.d;
    const xChord=(d*d+Ra*Ra-Rb*Rb)/(2*d);
    const hChord=Math.sqrt(Math.max(4,Ra*Ra-xChord*xChord));
    const px=-bd.u[1],py=bd.u[0];
    const tot=bd.o*2;
    const span=Math.min(hChord*0.72,(tot-1)*3.1);
    const stepP=tot>1?(2*span)/(tot-1):0;
    for(let idx=0;idx<tot;idx++){
      const p=-span+idx*stepP;
      const mIdx=idx%2===0?0:bd.b;
      fixed.push({m:mIdx,k:kc[mIdx]++,x:A.bx+bd.u[0]*xChord+px*p,y:A.by+bd.u[1]*xChord+py*p});
    }
  });
  mem.forEach((m,i)=>{
    const lp=(m.atom.el.v-m.sum)/2;m.lone=loneDirs(m.bonds,lp);const Rm=Rof(m.atom.el);
    m.lone.forEach(d=>{const th=Math.atan2(d[1],d[0]);for(const s of[-0.24,0.24])fixed.push({m:i,k:kc[i]++,x:m.bx+Math.cos(th+s)*Rm,y:m.by+Math.sin(th+s)*Rm});});
  });
  const avg=(arr,f)=>arr.reduce((s,o)=>s+f(o),0)/arr.length;
  const mx=avg(mem,m=>m.bx),my=avg(mem,m=>m.by),lx=avg(mem,m=>m.lx),ly=avg(mem,m=>m.ly);
  mem.forEach(m=>{m.bx-=mx;m.by-=my;m.lx-=lx;m.ly-=ly;m.el=m.atom.el;});
  fixed.forEach(f=>{f.x-=mx;f.y-=my;});
  return {members:mem,fixed,bonds};
}

/* ---------- Bina gugusan ion ---------- */
function buildIon(rel,metals,anions){
  const {q,g}=rel;const mem=[];
  metals.forEach(a=>{const sh=cationShells(a.el,q);mem.push({atom:a,el:a.el,ion:'+',q,R:SR[sh.length-1],shape:'x',ionSh:sh});});
  anions.forEach(a=>mem.push({atom:a,el:a.el,ion:'-',q:g,R:SR[a.el.sh.length-1],shape:'dot',gain:[]}));
  const mi=mem.filter(m=>m.ion==='+'),ai=mem.filter(m=>m.ion==='-');
  const src=[];mi.forEach(m=>{for(let k=0;k<q;k++)src.push({m,k});});
  const dst=[];ai.forEach(m=>{for(let s=0;s<g;s++)dst.push({m,s:m.el.v+s});});
  const transfers=src.map((s,j)=>({from:s.m,k:s.k,to:dst[j].m,slot:dst[j].s}));
  transfers.forEach(tr=>tr.to.gain.push(tr.from.el.c));
  mem.forEach(m=>{
    const el=m.el;
    if(m.ion==='+')m.shells=m.ionSh.map(n=>Array(n).fill(el.c));
    else{m.shells=el.sh.map(n=>Array(n).fill(el.c));m.shells[m.shells.length-1].push(...m.gain);}
    m.rx=el.s.length>1?20:15;m.lw=m.rx+(m.ion==='-'?9:5)+7;
  });
  const A=mi.length,Bn=ai.length;
  const place=(m,bx,by,lx,ly)=>{m.bx=bx;m.by=by;m.lx=lx;m.ly=ly;};
  const hGap=left=>left.q>1?38:26,lGap=left=>left.q>1?20:12,VGAP=26;
  if(A===1&&Bn===1){
    const c=mi[0],a=ai[0],d=c.R+a.R+hGap(c),l=c.lw+a.lw+lGap(c);
    place(c,-d/2,0,-l/2,0);place(a,d/2,0,l/2,0);
  }else if(A===1||Bn===1){
    const cen=A===1?mi[0]:ai[0],oth=A===1?ai:mi;
    const DV=[[-1,0],[1,0],[0,1],[0,-1]];
    place(cen,0,0,0,0);
    oth.forEach((o,i)=>{
      const u=DV[i],leftIon=u[0]<0?o:cen;
      const d=cen.R+o.R+(u[1]?VGAP:hGap(leftIon));
      const l=u[1]?Math.max(cen.lw,o.lw)*2+2:cen.lw+o.lw+lGap(leftIon);
      place(o,u[0]*d,u[1]*d,u[0]*l,u[1]*l);
    });
  }else{
    const maj=A>Bn?mi:ai,min=A>Bn?ai:mi,seq=[];
    for(let i=0;i<maj.length;i++){seq.push(maj[i]);if(min[i])seq.push(min[i]);}
    let x=0,lx=0;seq.forEach((m,i)=>{if(i){x+=seq[i-1].R+m.R+hGap(seq[i-1]);lx+=seq[i-1].lw+m.lw+lGap(seq[i-1]);}place(m,x,0,lx,0);});
  }
  const avg=f=>mem.reduce((s,o)=>s+f(o),0)/mem.length;
  const mx=avg(m=>m.bx),my=avg(m=>m.by),lx=avg(m=>m.lx),ly=avg(m=>m.ly);
  mem.forEach(m=>{m.bx-=mx;m.by-=my;m.lx-=lx;m.ly-=ly;});
  return {members:mem,transfers};
}

function bodyRadius(b){
  let r=0;
  b.members.forEach(m=>{
    const R=b.type==='ion'?m.R+8:Rof(m.el)+4;
    r=Math.max(r,Math.hypot(m.bx,m.by)+R,Math.hypot(m.lx,m.ly)+28);
  });
  return r;
}

/* ---------- Maklumat sebatian ---------- */
const BONDN={1:'ikatan tunggal',2:'ikatan ganda dua',3:'ikatan ganda tiga'};
function makeInfo(rel,body){
  const info={kind:rel.kind,formula:rel.formula,name:rel.name,eq:[],extra:[],note:rel.note||(rel.spec&&rel.spec.note)||'',body};
  if(rel.kind==='ion'){
    const {M,X,q,g,na,nb}=rel,syms=elOrder(rel.formula),bal=balance(syms,rel.counts);
    const Mi=M.s+chg(q,1),Xi=X.s+chg(g,-1);
    info.type='Sebatian ion';info.bond='Ikatan ion';
    info.ions=`${Mi} dan ${Xi}`;
    info.eq.push(['Persamaan kimia seimbang',`${bal.re.join(' + ')} → ${coef(bal.p)}${rel.formula}`]);
    info.eq.push(['Persamaan dalam simulasi (atom)',`${coef(na)}${M.s} + ${coef(nb)}${X.s} → ${rel.formula}`]);
    info.eq.push(['Setengah persamaan pengoksidaan',`${M.s} → ${Mi} + ${coef(q)}e⁻`]);
    info.eq.push(['Setengah persamaan penurunan',DIAT.has(X.s)?`${X.s}₂ + ${2*g}e⁻ → 2${Xi}`:`${X.s} + ${coef(g)}e⁻ → ${Xi}`]);
    info.eq.push(['Persamaan ion',`${bal.re.join(' + ')} → ${coef(bal.p*na)}${Mi} + ${coef(bal.p*nb)}${Xi}`]);
    const cM=cationShells(M,q).join('.'),xs=X.sh.slice();xs[xs.length-1]+=g;
    info.extra=[`${M.s} (${conf(M)}) → ${Mi} (${cM}) + ${coef(q)}e⁻`,`${X.s} (${conf(X)}) + ${coef(g)}e⁻ → ${Xi} (${xs.join('.')})`];
    info.status={cls:'ion',badge:'IKATAN ION',title:`${rel.name} (${rel.formula}) terbentuk`,
      text:`Atom logam <b>${M.s}</b> (${conf(M)}) menderma ${q} elektron kepada atom bukan logam <b>${X.s}</b> (${conf(X)}). `+
      `Ion <b>${Mi}</b> dan <b>${Xi}</b> yang terbentuk ditarik bersama oleh daya tarikan elektrostatik yang kuat.`};
    info.sifat='Sifat sebatian ion: takat lebur dan takat didih yang tinggi; mengkonduksi elektrik dalam keadaan leburan atau larutan akueus, tetapi tidak dalam keadaan pepejal.';
  }else{
    const spec=rel.spec,cEl=E[spec.central];
    const groups={};spec.terms.forEach(([s,o])=>{const k=s+'|'+o;groups[k]=(groups[k]||0)+1;});
    const lines=[];let pairs=0;
    if(rel.kind==='unsur'){
      const o=rel.o;pairs=o;
      lines.push(`Dua atom ${cEl.s} (${conf(cEl)}) masing-masing menyumbang ${o} elektron dan berkongsi ${o} pasang elektron → ${BONDN[o]}.`);
    }else{
      Object.entries(groups).forEach(([k,n])=>{const [s,o]=k.split('|');const oo=+o;pairs+=oo*n;
        lines.push(`Atom ${cEl.s} (${conf(cEl)}) berkongsi ${oo} pasang elektron dengan ${n>1?'setiap satu daripada '+n+' atom':'atom'} ${s} (${conf(E[s])}) → ${n>1?n+' ':''}${BONDN[oo]}.`);});
    }
    // bilangan elektron akhir
    const fin=[];const seen=new Set();
    body.members.forEach(m=>{if(seen.has(m.el.s))return;seen.add(m.el.s);
      const tot=m.el.v+m.sum;const lab=m.el.s==='H'?(tot===2?'duplet':''):(tot===8?'oktet':tot<8?'oktet tidak lengkap':'oktet berkembang');
      fin.push(`${m.el.s}: ${tot} elektron valens${lab?' ('+lab+')':''}`);});
    info.extra=lines.concat([`Jumlah pasangan elektron dikongsi: ${pairs}.`,`Selepas berkongsi — ${fin.join('; ')}.`]);
    info.ions='— (tiada ion)';
    if(rel.kind==='unsur'){
      info.type='Molekul unsur';info.bond='Ikatan kovalen ('+BONDN[rel.o].replace('ikatan ','')+')';
      info.eq.push(['Pembentukan molekul (atom)',`${cEl.s} + ${cEl.s} → ${rel.formula}`]);
      info.eq.push(['Setengah persamaan',null]);
      info.status={cls:'cov',badge:'IKATAN KOVALEN',title:`Molekul ${rel.formula} terbentuk`,
        text:`Dua atom bukan logam <b>${cEl.s}</b> yang sama berkongsi ${rel.o} pasang elektron (${BONDN[rel.o]}) untuk mencapai susunan elektron ${cEl.s==='H'?'duplet':'oktet'} yang stabil. ${rel.formula} ialah <b>molekul unsur</b>, bukan sebatian.`};
      info.sifat=cEl.s==='I'
        ?'Molekul unsur ringkas: wujud sebagai pepejal ungu kehitaman pada suhu bilik yang mudah memejalwap, takat lebur rendah, tidak mengkonduksi elektrik.'
        :'Molekul unsur ringkas: wujud sebagai gas pada suhu bilik, takat lebur dan takat didih rendah, tidak mengkonduksi elektrik.';
    }else{
      info.type='Sebatian kovalen';info.bond='Ikatan kovalen';
      const syms=elOrder(rel.formula),bal=balance(syms,rel.counts);
      info.eq.push(['Persamaan kimia seimbang',`${bal.re.join(' + ')} → ${coef(bal.p)}${rel.formula}`]);
      const simRe=syms.map(s=>coef(rel.counts[s])+s);
      info.eq.push(['Persamaan dalam simulasi (atom)',`${simRe.join(' + ')} → ${rel.formula}`]);
      info.eq.push(['Setengah persamaan / persamaan ion',null]);
      const others=[...new Set(spec.terms.map(t=>t[0]))];
      info.status={cls:'cov',badge:'IKATAN KOVALEN',title:`${rel.name} (${rel.formula}) terbentuk`,
        text:`Atom-atom bukan logam <b>${[cEl.s,...others].join('</b> dan <b>')}</b> berkongsi elektron (tiada pemindahan elektron) supaya setiap atom mencapai susunan elektron duplet/oktet yang stabil.`};
      info.sifat=spec.giant
        ?'Sifat struktur kovalen raksasa: takat lebur dan takat didih sangat tinggi, keras, tidak mengkonduksi elektrik.'
        :'Sifat sebatian kovalen (molekul ringkas): takat lebur dan takat didih rendah; tidak mengkonduksi elektrik dalam semua keadaan.';
    }
  }
  return info;
}

/* ---------- Mulakan pembentukan ---------- */
function startForm(rel,atomBodies){
  const pool={};atomBodies.forEach(b=>{(pool[symOf(b)]=pool[symOf(b)]||[]).push(b);});
  const start=new Map();atomBodies.forEach(b=>start.set(b.members[0].atom,{x:b.x,y:b.y}));
  const pick=s=>pool[s].shift().members[0].atom;
  let body;
  if(rel.kind==='ion'){
    const metals=[],anions=[];
    for(let i=0;i<rel.na;i++)metals.push(pick(rel.M.s));
    for(let i=0;i<rel.nb;i++)anions.push(pick(rel.X.s));
    const r=buildIon(rel,metals,anions);
    body={type:'ion',members:r.members,transfers:r.transfers};
  }else{
    const r=buildCov(rel.spec,pick,rel.kind==='unsur');
    body={type:'cov',members:r.members,fixed:r.fixed,bonds:r.bonds};
  }
  bodies=bodies.filter(b=>!atomBodies.includes(b));
  let cx=0,cy=0;atomBodies.forEach(b=>{cx+=b.x;cy+=b.y;});cx/=atomBodies.length;cy/=atomBodies.length;
  Object.assign(body,{id:uid++,x:cx,y:cy,vx:0,vy:0,ang:0,om:0});
  body.r=bodyRadius(body);
  body.x=Math.min(Math.max(body.x,body.r),VW-body.r);body.y=Math.min(Math.max(body.y,body.r),VH-body.r);
  body.mass=body.members.reduce((s,m)=>s+m.el.m,0);
  body.info=makeInfo(rel,body);
  let maxd=0;const starts=body.members.map(m=>{const s=start.get(m.atom);maxd=Math.max(maxd,Math.hypot(s.x-body.x-m.bx,s.y-body.y-m.by));return s;});
  const dm=Math.min(1.7,Math.max(0.9,maxd/230+0.5));
  const f={t:0,dm,starts};
  if(rel.kind==='ion'){
    body.transfers.forEach((tr,j)=>{tr.ts=dm+0.2+j*0.42;tr.dur=0.65;});
    f.tIon=body.transfers[body.transfers.length-1].ts+0.7;f.end=f.tIon+0.7;
  }else f.end=dm+0.45;
  body.form=f;
  bodies.push(body);
  return body;
}
function finishForm(b){
  b.form=null;
  const a=Math.random()*TAU;b.vx=Math.cos(a)*25;b.vy=Math.sin(a)*25;b.om=b.type==='ion'?0:(Math.random()-.5)*.6;
  // semak semula atom bebas yang masih menunggu (cth. N menunggu H selepas H₂ siap terbentuk)
  bodies.filter(o=>o.type==='atom'&&!o.form).forEach(o=>{if(bodies.includes(o)&&o.type==='atom'&&!o.form)checkNew(o,{silent:true});});
}

/* ---------- Pecahkan molekul ---------- */
function dissociate(b,kick=70){
  const c=Math.cos(b.ang),s=Math.sin(b.ang);const out=[];
  b.members.forEach(m=>{
    const wx=b.x+m.bx*c-m.by*s,wy=b.y+m.bx*s+m.by*c;
    const nb=atomBody(m.atom,wx,wy);
    const dx=wx-b.x,dy=wy-b.y,L=Math.hypot(dx,dy)||1;
    nb.vx=b.vx+dx/L*kick;nb.vy=b.vy+dy/L*kick;out.push(nb);
  });
  bodies=bodies.filter(o=>o!==b);bodies.push(...out);
  if(focus===b)focus=null;
  return out;
}

/* ---------- Semakan apabila atom baharu ditambah ---------- */
function checkNew(b,opts={}){
  const X=symOf(b);
  const free=bodies.filter(o=>o.type==='atom'&&!o.form&&o!==b);
  const unsurB=opts.noReclaim?[]:bodies.filter(o=>o.type==='cov'&&o.info&&o.info.kind==='unsur'&&!o.form);
  const syms=new Set([...free.map(symOf),...unsurB.map(o=>o.members[0].el.s)]);
  if(!syms.size){if(!opts.silent)statusSingle(b);return false;}
  const feas=[],pend=[],none=[];
  const dist=(Y)=>{let d=1e9;free.forEach(o=>{if(symOf(o)===Y)d=Math.min(d,Math.hypot(o.x-b.x,o.y-b.y));});unsurB.forEach(o=>{if(o.members[0].el.s===Y)d=Math.min(d,Math.hypot(o.x-b.x,o.y-b.y));});return d;};
  for(const Y of syms){
    const rel=relation(X,Y);
    if(rel.kind==='none'){none.push({Y,rel});continue;}
    if(rel.kind==='unsur'&&!autoUnsur){continue;}
    const avail=s=>free.filter(o=>symOf(o)===s).length+(s===X?1:0)+(rel.kind==='unsur'?0:unsurB.filter(o=>o.members[0].el.s===s).length*2);
    const lack={};let ok=true;
    for(const s in rel.counts){const d=rel.counts[s]-avail(s);if(d>0){ok=false;lack[s]=d;}}
    (ok?feas:pend).push({Y,rel,lack,d:dist(Y)});
  }
  feas.sort((a,c)=>((a.rel.kind==='unsur')-(c.rel.kind==='unsur'))||a.d-c.d);
  if(feas.length){react(b,feas[0].rel,free,unsurB);return true;}
  if(opts.silent)return false;
  if(pend.length)statusPending(X,pend,none);
  else if(none.length)statusNone(X,none);
  else statusSingle(b);
  return false;
}
function react(b,rel,free,unsurB){
  const X=symOf(b);const need=Object.assign({},rel.counts);need[X]--;
  const chosen=[b];let freeL=free.slice();const leftovers=[];
  for(const s in need){
    while(need[s]>0){
      let cands=freeL.filter(o=>symOf(o)===s&&!chosen.includes(o)).sort((p,q)=>Math.hypot(p.x-b.x,p.y-b.y)-Math.hypot(q.x-b.x,q.y-b.y));
      if(cands.length){chosen.push(cands[0]);need[s]--;continue;}
      const mol=unsurB.filter(o=>o.members[0].el.s===s&&bodies.includes(o)).sort((p,q)=>Math.hypot(p.x-b.x,p.y-b.y)-Math.hypot(q.x-b.x,q.y-b.y))[0];
      if(!mol)break;
      const atoms=dissociate(mol,30);freeL.push(...atoms);leftovers.push(...atoms);
    }
  }
  const body=startForm(rel,chosen);
  body.form.leftovers=leftovers.filter(o=>!chosen.includes(o));
  focus=body;
  setStatus(body.info.status);showCompound(body.info);
}

/* =========================================================
   PANEL MAKLUMAT
   ========================================================= */
const $=id=>document.getElementById(id);
function setStatus(s){
  $('status').innerHTML=`<span class="badge ${s.cls}">${s.badge}</span><div class="stitle">${s.title}</div><div class="stext">${s.text}</div>`;
}
function statusIdle(){setStatus({cls:'idle',badge:'RUANG KOSONG',title:'Mulakan simulasi',text:'Seret atom daripada panel unsur ke dalam ruang simulasi. Apabila atom kedua ditambah, sistem akan menyemak sama ada atom-atom itu boleh membentuk ikatan ion, ikatan kovalen atau tiada tindak balas.'});}
function statusSingle(b){
  const el=b.members[0].el;focus=b;
  if(el.cat==='ga'){setStatus({cls:'none',badge:'TIADA TINDAK BALAS',title:`${el.n} (${el.s}) · ${conf(el)}`,text:gasAdiReason(el)+' Atom ini akan kekal bergerak secara rawak tanpa bercantum.'});return;}
  setStatus({cls:'idle',badge:'ATOM DITAMBAH',title:`${el.n} (${el.s}) · ${conf(el)}`,text:`${tendency(el)}<br><br>Tambah atom lain untuk menyemak gabungan.`});
}
function statusPending(X,pend,none){
  const items=pend.map(p=>{
    const need=Object.entries(p.lack).map(([s,n])=>`${n} lagi atom ${s}`).join(' dan ');
    const kind=p.rel.kind==='ion'?'ikatan ion':'ikatan kovalen';
    return `<li><b>${X}</b> + <b>${p.Y}</b> boleh membentuk <b>${p.rel.formula}</b> (${kind}) — perlukan ${need}.</li>`;}).join('');
  const nn=none.length?`<div style="margin-top:6px;color:var(--muted)">Tiada tindak balas dengan: ${none.map(n=>n.Y).join(', ')}.</div>`:'';
  setStatus({cls:'wait',badge:'BOLEH BERGABUNG',title:'Menunggu atom tambahan',text:`Nisbah atom belum mencukupi. Atom akan terus bergerak secara rawak sehingga cukup atom ditambah.<ul>${items}</ul>${nn}`});
}
function statusNone(X,none){
  const items=none.map(n=>`<li><b>${X}</b> + <b>${n.Y}</b>: ${n.rel.reason}</li>`).join('');
  setStatus({cls:'none',badge:'TIADA TINDAK BALAS',title:'Atom-atom tidak bergabung',text:`Atom-atom akan kekal bergerak secara rawak tanpa bercantum.<ul>${items}</ul>`});
}
function showCompound(info){
  if(!info){$('compound').innerHTML='<div class="empty">Belum ada sebatian terbentuk.</div>';$('equations').innerHTML='<div class="empty">Persamaan kimia, setengah persamaan dan persamaan ion akan dipaparkan di sini.</div>';return;}
  const tcls=info.kind==='ion'?'ion':'cov';
  $('compound').innerHTML=`<div class="formula">${info.formula}</div><div class="cname">${info.name}</div>
   <div class="tags"><span class="tag ${tcls}">${info.type}</span><span class="tag">${info.bond}</span></div>
   <div class="kv"><span>Ion terlibat</span><b>${info.ions}</b></div>
   <p class="sifat">${info.sifat}</p>${info.note?`<p class="note">${info.note}</p>`:''}`;
  let h='';
  info.eq.forEach(([l,v])=>{h+=`<div class="eq"><div class="l">${l}</div><div class="v${v?'':' muted'}">${v||'Tidak berkenaan — ikatan kovalen melibatkan perkongsian elektron, bukan pemindahan elektron, jadi tiada ion terbentuk.'}</div></div>`;});
  const xl=info.kind==='ion'?'Pembentukan ion (susunan elektron)':'Perkongsian elektron';
  h+=`<div class="eq"><div class="l">${xl}</div><div class="v extra">${info.extra.join('<br>')}</div></div>`;
  $('equations').innerHTML=h;
}

/* =========================================================
   LUKISAN
   ========================================================= */
const sprites={};
function hexA(h,a){const n=parseInt(h.slice(1),16);return `rgba(${n>>16},${(n>>8)&255},${n&255},${a})`;}
function shade(h,f=.55){const n=parseInt(h.slice(1),16);return `rgb(${Math.round((n>>16)*f)},${Math.round(((n>>8)&255)*f)},${Math.round((n&255)*f)})`;}
function sprite(col){
  if(sprites[col])return sprites[col];
  const c=document.createElement('canvas');c.width=c.height=48;const g=c.getContext('2d');
  const gr=g.createRadialGradient(24,24,0,24,24,24);
  gr.addColorStop(0,'#ffffff');gr.addColorStop(.17,col);gr.addColorStop(.3,hexA(col,.55));gr.addColorStop(1,hexA(col,0));
  g.fillStyle=gr;g.fillRect(0,0,48,48);return sprites[col]=c;
}
function drawE(c,x,y,col,s=1){c.drawImage(sprite(col),x-7.5*s,y-7.5*s,15*s,15*s);}
function ring(c,x,y,r,s=1,a=.3){c.strokeStyle=`rgba(148,163,184,${a})`;c.lineWidth=Math.max(.6,1*s);c.beginPath();c.arc(x,y,r,0,TAU);c.stroke();}
const nucSprites={};
function nucSprite(el,withText){
  const key=el.s+(withText?'_t':'');
  if(nucSprites[key])return nucSprites[key];
  const sz=48,half=24,r=22;
  const c=document.createElement('canvas');c.width=c.height=sz;const g=c.getContext('2d');
  const gr=g.createRadialGradient(half-r*.35,half-r*.35,r*.1,half,half,r);
  gr.addColorStop(0,'#ffffff');gr.addColorStop(.35,el.c);gr.addColorStop(1,shade(el.c));
  g.fillStyle=gr;g.beginPath();g.arc(half,half,r,0,TAU);g.fill();
  if(withText){g.fillStyle='#0b1220';g.font='800 22px system-ui,sans-serif';g.textAlign='center';g.textBaseline='middle';g.fillText(el.s,half,half+1);}
  return nucSprites[key]=c;
}
function drawNuc(c,x,y,el,s=1){
  const r=NUC*s;
  c.drawImage(nucSprite(el,s>=.8),x-r,y-r,r*2,r*2);
}
const eAng=(atom,k,i,n,t)=>atom.ph+k*1.3+i*TAU/n+((k%2)?-1:1)*W[k]*t;
function orbitPos(atom,k,i,n,t,x,y,ang=0){const a=eAng(atom,k,i,n,t)+ang,r=SR[k];return [x+Math.cos(a)*r,y+Math.sin(a)*r];}
function drawAtomBohr(c,atom,x,y,t,s=1){
  const el=atom.el;
  el.sh.forEach((n,k)=>{ring(c,x,y,SR[k]*s,s);for(let i=0;i<n;i++){const a=eAng(atom,k,i,n,t);drawE(c,x+Math.cos(a)*SR[k]*s,y+Math.sin(a)*SR[k]*s,el.c,s);}});
  drawNuc(c,x,y,el,s);
}
function brackets(c,x,y,hw,hh,col,a=1){
  c.save();c.globalAlpha*=a;c.strokeStyle=col;c.lineWidth=1.6;c.beginPath();
  c.moveTo(x-hw+5,y-hh);c.lineTo(x-hw,y-hh);c.lineTo(x-hw,y+hh);c.lineTo(x-hw+5,y+hh);
  c.moveTo(x+hw-5,y-hh);c.lineTo(x+hw,y-hh);c.lineTo(x+hw,y+hh);c.lineTo(x+hw-5,y+hh);c.stroke();c.restore();
}
function chargeText(c,x,y,txt,a=1,size=19){c.save();c.globalAlpha*=a;c.fillStyle='#fde68a';c.font=`800 ${size}px system-ui,sans-serif`;c.textAlign='left';c.textBaseline='middle';c.fillText(txt,x,y);c.restore();}
function label(c,x,y,txt,sub2){
  c.font='700 12px system-ui,sans-serif';c.textAlign='center';c.textBaseline='middle';
  const w=c.measureText(txt).width+(sub2?c.measureText(' '+sub2).width:0)+12;
  c.fillStyle='rgba(10,16,32,.78)';roundRect(c,x-w/2,y-9,w,18,6);c.fill();
  c.fillStyle='#e6ecf7';
  if(sub2){c.textAlign='left';const x0=x-w/2+6;c.fillText(txt,x0,y);const tw=c.measureText(txt+' ').width;c.fillStyle='#93a3c0';c.font='600 11px system-ui,sans-serif';c.fillText(sub2,x0+tw,y);}
  else c.fillText(txt,x,y);
}
function roundRect(c,x,y,w,h,r){c.beginPath();c.moveTo(x+r,y);c.arcTo(x+w,y,x+w,y+h,r);c.arcTo(x+w,y+h,x,y+h,r);c.arcTo(x,y+h,x,y,r);c.arcTo(x,y,x+w,y,r);c.closePath();}
const ease=x=>x<=0?0:x>=1?1:(x<.5?4*x*x*x:1-Math.pow(-2*x+2,3)/2);
const clamp01=x=>Math.max(0,Math.min(1,x));

/* ---------- Bohr: jasad siap ---------- */
function drawBohr(b,t){
  if(b.form)return b.type==='ion'?drawFormIonBohr(b,t):drawFormCovBohr(b,t);
  if(b.type==='atom'){drawAtomBohr(ctx,b.members[0].atom,b.x,b.y,t);return;}
  const c=Math.cos(b.ang),s=Math.sin(b.ang);
  const wp=(x,y)=>[b.x+x*c-y*s,b.y+x*s+y*c];
  if(b.type==='cov'){
    b.members.forEach(m=>{const [x,y]=wp(m.bx,m.by);const L=m.el.sh.length;
      for(let k=0;k<L;k++){
        if(k===L-1){ctx.fillStyle=hexA(m.el.c,.07);ctx.beginPath();ctx.arc(x,y,SR[k],0,TAU);ctx.fill();ring(ctx,x,y,SR[k],1,.42);}
        else{ring(ctx,x,y,SR[k]);const n=m.el.sh[k];for(let i=0;i<n;i++){const [ex,ey]=orbitPos(m.atom,k,i,n,t,x,y,b.ang);drawE(ctx,ex,ey,m.el.c);}}
      }});
    b.fixed.forEach((f,i)=>{const w=Math.sin(t*2.4+i*1.7)*.25;const [x,y]=wp(f.x+w,f.y-w);drawE(ctx,x,y,b.members[f.m].el.c);});
    b.members.forEach(m=>{const [x,y]=wp(m.bx,m.by);drawNuc(ctx,x,y,m.el);});
  }else{
    b.members.forEach(m=>{const [x,y]=wp(m.bx,m.by);
      m.shells.forEach((cols,k)=>{ring(ctx,x,y,SR[k]);cols.forEach((col,i)=>{const [ex,ey]=orbitPos(m.atom,k,i,cols.length,t,x,y,b.ang);drawE(ctx,ex,ey,col);});});
      drawNuc(ctx,x,y,m.el);
      brackets(ctx,x,y,m.R+7,m.R+7,'rgba(226,232,240,.75)');
      chargeText(ctx,x+m.R+9,y-m.R-6,m.ion==='+'?chg(m.q,1):chg(m.q,-1));
    });
  }
}
/* ---------- Bohr: animasi pembentukan kovalen ---------- */
function drawFormCovBohr(b,t){
  const f=b.form,e=ease(f.t/f.dm),e2=ease((f.t/f.dm-.12)/.88);
  const P=b.members.map((m,i)=>[f.starts[i].x+(b.x+m.bx-f.starts[i].x)*e,f.starts[i].y+(b.y+m.by-f.starts[i].y)*e]);
  b.members.forEach((m,i)=>{const [x,y]=P[i];const L=m.el.sh.length;
    for(let k=0;k<L;k++){
      if(k===L-1){ctx.fillStyle=hexA(m.el.c,.07*e);ctx.beginPath();ctx.arc(x,y,SR[k],0,TAU);ctx.fill();ring(ctx,x,y,SR[k],1,.3+.12*e);}
      else{ring(ctx,x,y,SR[k]);const n=m.el.sh[k];for(let j=0;j<n;j++){const [ex,ey]=orbitPos(m.atom,k,j,n,t,x,y);drawE(ctx,ex,ey,m.el.c);}}
    }});
  b.fixed.forEach(fx=>{const m=b.members[fx.m],L=m.el.sh.length-1;
    const [ox,oy]=orbitPos(m.atom,L,fx.k,m.el.v,t,P[fx.m][0],P[fx.m][1]);
    const tx=b.x+fx.x,ty=b.y+fx.y;drawE(ctx,ox+(tx-ox)*e2,oy+(ty-oy)*e2,m.el.c);});
  b.members.forEach((m,i)=>drawNuc(ctx,P[i][0],P[i][1],m.el));
  glowPulse(b,f);
}
/* ---------- Bohr: animasi pembentukan ion ---------- */
function drawFormIonBohr(b,t){
  const f=b.form,e=ease(f.t/f.dm),fade=ease((f.t-f.tIon)/.6);
  const P=b.members.map((m,i)=>[f.starts[i].x+(b.x+m.bx-f.starts[i].x)*e,f.starts[i].y+(b.y+m.by-f.starts[i].y)*e]);
  const idx=new Map(b.members.map((m,i)=>[m,i]));
  const slotPos=(m,slot)=>{const L=m.el.sh.length-1,F=m.shells[L].length;const p=P[idx.get(m)];return orbitPos(m.atom,L,slot,F,t,p[0],p[1]);};
  const srcPos=(tr,pm)=>{const el=tr.from.el,L=el.sh.length-1;
    if(tr.k<el.v)return orbitPos(tr.from.atom,L,tr.k,el.v,t,pm[0],pm[1]);
    const prev=el.sh[L-1];return orbitPos(tr.from.atom,L-1,prev-1-(tr.k-el.v),prev,t,pm[0],pm[1]);};
  b.members.forEach((m,i)=>{const [x,y]=P[i];const el=m.el,L=el.sh.length-1;
    for(let k=0;k<L;k++){ring(ctx,x,y,SR[k]);const n=el.sh[k];for(let j=0;j<n;j++){
      if(m.ion==='+'&&k===L-1&&m.q>el.v&&j>=n-(m.q-el.v)&&f.t>=b.transfers.find(tr=>tr.from===m&&tr.k===el.v+(n-1-j))?.ts)continue;
      const [ex,ey]=orbitPos(m.atom,k,j,n,t,x,y);drawE(ctx,ex,ey,el.c);}}
    if(m.ion==='+'){
      const losesOuter=m.shells.length<el.sh.length;
      ctx.save();if(losesOuter)ctx.globalAlpha=1-fade;ring(ctx,x,y,SR[L]);ctx.restore();
      if(!losesOuter){for(let j=m.q;j<el.v;j++){const [ex,ey]=orbitPos(m.atom,L,j,el.v,t,x,y);drawE(ctx,ex,ey,el.c);}}
      b.transfers.forEach(tr=>{if(tr.from===m&&tr.k<el.v&&f.t<tr.ts){const [ex,ey]=orbitPos(m.atom,L,tr.k,el.v,t,x,y);drawE(ctx,ex,ey,el.c);}});
    }else{
      ring(ctx,x,y,SR[L]);const F=m.shells[L].length,v=el.v;
      for(let j=0;j<v;j++){const a=m.atom.ph+L*1.3+(j*TAU/v+(j*TAU/F-j*TAU/v)*e)+((L%2)?-1:1)*W[L]*t;drawE(ctx,x+Math.cos(a)*SR[L],y+Math.sin(a)*SR[L],el.c);}
      b.transfers.forEach(tr=>{if(tr.to===m&&f.t>=tr.ts+tr.dur){const [ex,ey]=slotPos(m,tr.slot);drawE(ctx,ex,ey,tr.from.el.c);}});
    }
    drawNuc(ctx,x,y,el);
    if(fade>0){brackets(ctx,x,y,m.R+7,m.R+7,'rgba(226,232,240,.75)',fade);chargeText(ctx,x+m.R+9,y-m.R-6,m.ion==='+'?chg(m.q,1):chg(m.q,-1),fade);}
  });
  b.transfers.forEach(tr=>{
    if(f.t<tr.ts||f.t>=tr.ts+tr.dur)return;
    const u=ease((f.t-tr.ts)/tr.dur),pm=P[idx.get(tr.from)];
    const [x0,y0]=srcPos(tr,pm);
    const [x2,y2]=slotPos(tr.to,tr.slot);
    const mx=(x0+x2)/2,my=(y0+y2)/2,dx=x2-x0,dy=y2-y0,Ln=Math.hypot(dx,dy)||1;
    const cx=mx-dy/Ln*32,cy=my+dx/Ln*32;
    for(let k=4;k>=0;k--){const uu=Math.max(0,u-k*.035);const x=(1-uu)*(1-uu)*x0+2*(1-uu)*uu*cx+uu*uu*x2,y=(1-uu)*(1-uu)*y0+2*(1-uu)*uu*cy+uu*uu*y2;
      ctx.save();ctx.globalAlpha=k?.18:1;drawE(ctx,x,y,tr.from.el.c,k?1.2:1.25);ctx.restore();}
  });
  glowPulse(b,f);
}
function glowPulse(b,f){
  const p=clamp01((f.t-(f.end-.6))/.6);if(p<=0)return;
  ctx.save();ctx.globalAlpha=(1-p)*.5;ctx.strokeStyle=b.type==='ion'?'#a78bfa':'#2dd4bf';ctx.lineWidth=2;
  ctx.beginPath();ctx.arc(b.x,b.y,b.r*(.8+p*.5),0,TAU);ctx.stroke();ctx.restore();
}

/* ---------- Lewis ---------- */
const LD=[[0,-1],[1,0],[0,1],[-1,0]];
function lewisCnt(n,pairTop){const c=[0,0,0,0];if(pairTop&&n===2){c[0]=2;return c;}for(let i=0;i<n;i++)c[i%4]++;return c;}
const rxOf=el=>el.s.length>1?20:15;
function lewisPos(el,cnt){
  const rx=rxOf(el),ry=15,out=[];
  cnt.forEach((n,i)=>{const d=LD[i],p=[-d[1],d[0]],bx=d[0]*rx,by=d[1]*ry;
    if(n===1)out.push([bx,by]);else if(n===2){out.push([bx+p[0]*3.8,by+p[1]*3.8]);out.push([bx-p[0]*3.8,by-p[1]*3.8]);}});
  return out;
}
function dot(c,x,y,col,shape){
  if(shape==='x'){c.strokeStyle=col;c.lineWidth=1.7;c.beginPath();c.moveTo(x-2.6,y-2.6);c.lineTo(x+2.6,y+2.6);c.moveTo(x+2.6,y-2.6);c.lineTo(x-2.6,y+2.6);c.stroke();}
  else{c.fillStyle=col;c.beginPath();c.arc(x,y,2.5,0,TAU);c.fill();}
}
function sym(c,el,x,y,size=21){c.fillStyle=el.c;c.font=`800 ${size}px system-ui,sans-serif`;c.textAlign='center';c.textBaseline='middle';c.fillText(el.s,x,y+1);}
function lewisAtom(c,el,x,y,n,extra=[]){
  sym(c,el,x,y);
  const cnt=lewisCnt(n,el.s==='He'||(el.s==='H'&&n===2));const ps=lewisPos(el,cnt);const own=n-extra.length;
  ps.forEach((p,i)=>{if(i<own)dot(c,x+p[0],y+p[1],el.c,'dot');else dot(c,x+p[0],y+p[1],extra[i-own],'x');});
}
function lewisCov(c,b,ox,oy){
  b.bonds.forEach(bd=>{
    const A=b.members[bd.a],B=b.members[bd.b];
    const ax=ox+A.lx,ay=oy+A.ly,bx=ox+B.lx,by=oy+B.ly,dx=bx-ax,dy=by-ay,L=Math.hypot(dx,dy),ux=dx/L,uy=dy/L,px=-uy,py=ux;
    const ra=Math.abs(ux)>.5?rxOf(A.el)-4:12,rb=Math.abs(ux)>.5?rxOf(B.el)-4:12;
    if(!dotMode){
      c.strokeStyle='#cbd5e1';c.lineWidth=2;c.lineCap='round';
      for(let j=0;j<bd.o;j++){const off=(j-(bd.o-1)/2)*5;c.beginPath();c.moveTo(ax+ux*ra+px*off,ay+uy*ra+py*off);c.lineTo(bx-ux*rb+px*off,by-uy*rb+py*off);c.stroke();}
    }else{
      const mx=(ax+ux*ra+bx-ux*rb)/2,my=(ay+uy*ra+by-uy*rb)/2;
      for(let j=0;j<bd.o;j++){const off=(j-(bd.o-1)/2)*8;
        dot(c,mx-ux*3.6+px*off,my-uy*3.6+py*off,A.el.c,A.shape);dot(c,mx+ux*3.6+px*off,my+uy*3.6+py*off,B.el.c,B.shape);}
    }
  });
  b.members.forEach(m=>{const x=ox+m.lx,y=oy+m.ly;sym(c,m.el,x,y);const rx=rxOf(m.el);
    m.lone.forEach(d=>{const p=[-d[1],d[0]],cx=x+d[0]*rx,cy=y+d[1]*15;const sh=dotMode?m.shape:'dot';
      dot(c,cx+p[0]*3.8,cy+p[1]*3.8,m.el.c,sh);dot(c,cx-p[0]*3.8,cy-p[1]*3.8,m.el.c,sh);});});
}
function lewisIon(c,b,ox,oy){
  b.members.forEach(m=>{const x=ox+m.lx,y=oy+m.ly;
    if(m.ion==='+'){sym(c,m.el,x,y);const hw=rxOf(m.el)+1,hh=16;brackets(c,x,y,hw,hh,'#cbd5e1');chargeText(c,x+hw+2,y-hh+1,chg(m.q,1),1,15);}
    else{const F=m.el.v+m.q;lewisAtom(c,m.el,x,y,F,m.gain);const hw=m.rx+8,hh=23;brackets(c,x,y,hw,hh,'#cbd5e1');chargeText(c,x+hw+2,y-hh+1,chg(m.q,-1),1,15);}
  });
}
function drawLewisStatic(c,b,ox,oy){
  if(b.type==='atom')lewisAtom(c,b.members[0].el,ox,oy,b.members[0].el.v);
  else if(b.type==='cov')lewisCov(c,b,ox,oy);else lewisIon(c,b,ox,oy);
}
function drawLewisWorld(b,t){
  if(!b.form){drawLewisStatic(ctx,b,b.x,b.y);return;}
  const f=b.form,e=ease(f.t/f.dm);
  const P=b.members.map((m,i)=>[f.starts[i].x+(b.x+m.lx-f.starts[i].x)*e,f.starts[i].y+(b.y+m.ly-f.starts[i].y)*e]);
  if(b.type==='cov'){
    const fa=ease((f.t-f.dm*.55)/(f.dm*.45+.3));
    ctx.save();ctx.globalAlpha=1-fa;b.members.forEach((m,i)=>lewisAtom(ctx,m.el,P[i][0],P[i][1],m.el.v));ctx.restore();
    ctx.save();ctx.globalAlpha=fa;lewisCov(ctx,b,b.x,b.y);ctx.restore();
  }else{
    const fade=ease((f.t-f.tIon)/.6);const idx=new Map(b.members.map((m,i)=>[m,i]));
    ctx.save();ctx.globalAlpha=1-fade;
    b.members.forEach((m,i)=>{
      if(m.ion==='+'){const left=b.transfers.filter(tr=>tr.from===m&&f.t<tr.ts).length;lewisAtom(ctx,m.el,P[i][0],P[i][1],left);}
      else{const arr=b.transfers.filter(tr=>tr.to===m&&f.t>=tr.ts+tr.dur).map(tr=>tr.from.el.c);lewisAtom(ctx,m.el,P[i][0],P[i][1],m.el.v+arr.length,arr);}
    });
    b.transfers.forEach(tr=>{if(f.t<tr.ts||f.t>=tr.ts+tr.dur)return;const u=ease((f.t-tr.ts)/tr.dur);
      const a=P[idx.get(tr.from)],z=P[idx.get(tr.to)];const mx=(a[0]+z[0])/2,my=(a[1]+z[1])/2-30;
      const x=(1-u)*(1-u)*a[0]+2*(1-u)*u*mx+u*u*z[0],y=(1-u)*(1-u)*(a[1]-14)+2*(1-u)*u*my+u*u*(z[1]-14);dot(ctx,x,y,tr.from.el.c,'x');});
    ctx.restore();
    if(fade>0){ctx.save();ctx.globalAlpha=fade;lewisIon(ctx,b,b.x,b.y);ctx.restore();}
  }
  glowPulse(b,f);
}

/* ---------- Lukis dunia ---------- */
let dragB=null,trashHot=false;
let panX=0,panY=0,spaceHeld=false,panDrag=null;
function trashRect(){return {x:VW-122,y:VH-54,w:110,h:42};}
function drawWorld(){
  if(cv.width<10||cv.height<10){const r=stage.getBoundingClientRect();if(r.width>=10&&r.height>=10)resize();}
  ctx.setTransform(1,0,0,1,0,0);
  ctx.globalAlpha=1;
  ctx.setLineDash([]);
  ctx.clearRect(0,0,cv.width,cv.height);
  const sc=DPR*ZOOM;
  ctx.setTransform(sc,0,0,sc,panX*sc,panY*sc);
  // grid latar (mengikut kamera)
  const gx0=Math.floor(-panX/40)*40,gx1=VW-panX,gy0=Math.floor(-panY/40)*40,gy1=VH-panY;
  ctx.strokeStyle='rgba(148,163,184,.08)';ctx.lineWidth=1;ctx.beginPath();
  for(let x=gx0;x<gx1;x+=40){ctx.moveTo(x+.5,gy0);ctx.lineTo(x+.5,gy1);}for(let y=gy0;y<gy1;y+=40){ctx.moveTo(gx0,y+.5);ctx.lineTo(gx1,y+.5);}ctx.stroke();
  if(panX||panY){
    ctx.save();ctx.setLineDash([5,5]);ctx.strokeStyle='rgba(148,163,184,.22)';ctx.lineWidth=1;ctx.strokeRect(.5,.5,VW-1,VH-1);ctx.restore();
  }
  for(const b of bodies){
    if(b.pinned&&!b.form){
      ctx.save();ctx.setLineDash([3,4]);ctx.strokeStyle='rgba(251,191,36,.72)';ctx.lineWidth=1.6;ctx.beginPath();ctx.arc(b.x,b.y,b.r+6,0,TAU);ctx.stroke();ctx.restore();
    }
  }
  if(focus&&bodies.includes(focus)&&!focus.form&&!focus.pinned){
    ctx.save();ctx.setLineDash([4,5]);ctx.strokeStyle='rgba(96,165,250,.55)';ctx.lineWidth=1.3;ctx.beginPath();ctx.arc(focus.x,focus.y,focus.r+6,0,TAU);ctx.stroke();ctx.restore();
  }
  for(const b of bodies){mode==='bohr'?drawBohr(b,T):drawLewisWorld(b,T);}
  if(showLabel)for(const b of bodies){
    if(b.form)continue;
    if(b.type==='atom'){const el=b.members[0].el;label(ctx,b.x,b.y+(mode==='bohr'?b.r+9:30),el.s,conf(el));}
    else label(ctx,b.x,b.y-(mode==='bohr'?b.r+8:Math.max(...b.members.map(m=>-m.ly))+38),b.info.formula);
  }
  // Elemen HUD skrin (teks kosong & kotak Buang)
  ctx.setTransform(sc,0,0,sc,0,0);
  if(!bodies.length){ctx.fillStyle='rgba(203,213,225,.68)';ctx.font='600 15px system-ui,sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';
    ctx.fillText('Klik/seret masuk atom daripada laci unsur ke ruang ini',VW/2,VH/2);}
  if(dragB){const r=trashRect();ctx.save();ctx.setLineDash([5,4]);ctx.strokeStyle=trashHot?'#f87171':'rgba(248,113,113,.55)';ctx.fillStyle=trashHot?'rgba(248,113,113,.2)':'rgba(248,113,113,.06)';
    roundRect(ctx,r.x,r.y,r.w,r.h,10);ctx.fill();ctx.stroke();ctx.restore();ctx.fillStyle='#fca5a5';ctx.font='700 13px system-ui,sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('Buang',r.x+r.w/2,r.y+r.h/2);}
}

/* =========================================================
   FIZIK (gerakan Brown + perlanggaran kenyal)
   ========================================================= */
function gauss(){let u=0,v=0;while(!u)u=Math.random();while(!v)v=Math.random();return Math.sqrt(-2*Math.log(u))*Math.cos(TAU*v);}
function step(dt){
  for(const b of bodies.slice()){
    if(b.form){b.form.t+=dt;if(b.form.t>=b.form.end)finishForm(b);continue;}
    if(b===dragB||b.pinned)continue;
    if(!Number.isFinite(b.x)||!Number.isFinite(b.y)){b.x=VW/2;b.y=VH/2;}
    if(!Number.isFinite(b.vx)||!Number.isFinite(b.vy)){b.vx=0;b.vy=0;}
    // halaju purata berkadar songsang dengan punca kuasa dua jisim, dengan arah hanyutan yang licin
    const v0=Math.min(100,Math.max(18,52*Math.sqrt(12/b.mass)))*speed;
    if(!Number.isFinite(b.dir)){b.dir=Math.atan2(b.vy,b.vx)||Math.random()*TAU;}
    if(!Number.isFinite(b.turn))b.turn=0;
    b.turn+=( -2.4*b.turn + 1.45*Math.sqrt(Math.max(.5,speed))*gauss() )*dt;
    b.turn=Math.max(-2.2,Math.min(2.2,b.turn));
    b.dir+=b.turn*dt;
    const tx=Math.cos(b.dir)*v0,ty=Math.sin(b.dir)*v0;
    const easeV=Math.min(1,1.8*dt);
    b.vx+=(tx-b.vx)*easeV;b.vy+=(ty-b.vy)*easeV;
    if(b.type==='cov'){
      if(!Number.isFinite(b.om))b.om=0;
      if(!Number.isFinite(b.ang))b.ang=0;
      b.om+=( -1.8*b.om + 0.35*speed*gauss()/Math.sqrt(b.members.length) )*dt;
      const maxOm=0.7*speed;b.om=Math.max(-maxOm,Math.min(maxOm,b.om));
      b.ang+=b.om*dt;
    }
    b.x+=b.vx*dt;b.y+=b.vy*dt;
    const minX=Math.min(b.r,VW/2),maxX=Math.max(VW-b.r,VW/2);
    const minY=Math.min(b.r,VH/2),maxY=Math.max(VH-b.r,VH/2);
    let bounced=false;
    if(b.x<minX){b.x=minX;b.vx=Math.abs(b.vx);bounced=true;}if(b.x>maxX){b.x=maxX;b.vx=-Math.abs(b.vx);bounced=true;}
    if(b.y<minY){b.y=minY;b.vy=Math.abs(b.vy);bounced=true;}if(b.y>maxY){b.y=maxY;b.vy=-Math.abs(b.vy);bounced=true;}
    if(bounced){b.dir=Math.atan2(b.vy,b.vx);b.turn*=-0.35;}
  }
  const act=bodies.filter(b=>!b.form);
  for(let i=0;i<act.length;i++)for(let j=i+1;j<act.length;j++){
    const a=act[i],c=act[j],dx=c.x-a.x,dy=c.y-a.y,d=Math.hypot(dx,dy),mn=a.r+c.r;
    if(d>=mn||d===0)continue;
    const nx=dx/d,ny=dy/d,ia=(a===dragB||a.pinned)?0:1/a.mass,ic=(c===dragB||c.pinned)?0:1/c.mass;if(ia+ic===0)continue;
    const ov=mn-d;a.x-=nx*ov*ia/(ia+ic);a.y-=ny*ov*ia/(ia+ic);c.x+=nx*ov*ic/(ia+ic);c.y+=ny*ov*ic/(ia+ic);
    const rv=(c.vx-a.vx)*nx+(c.vy-a.vy)*ny;if(rv>0)continue;
    const jj=-2*rv/(ia+ic);a.vx-=jj*ia*nx;a.vy-=jj*ia*ny;c.vx+=jj*ic*nx;c.vy+=jj*ic*ny;
    if(a!==dragB&&!a.pinned)a.dir=Math.atan2(a.vy,a.vx);
    if(c!==dragB&&!c.pinned)c.dir=Math.atan2(c.vy,c.vx);
  }
}

/* =========================================================
   PANEL UNSUR (jadual berkala mini)
   ========================================================= */
const ptable=$('ptable');
const GROUPS=[1,2,8,11,12,13,14,15,16,17,18];
const TM_GROUPS=new Set([8,11,12]);
const corner=document.createElement('div');corner.className='ghead';corner.title='Kala / Kumpulan';corner.textContent='K';ptable.appendChild(corner);
GROUPS.forEach(g=>{const d=document.createElement('div');d.className='ghead'+(TM_GROUPS.has(g)?' is-tm':'');d.textContent=g;d.title=`Kumpulan ${g}`;ptable.appendChild(d);});
const tiles=[];
function addTile(container,el){
  const d=document.createElement('div');
  d.className='tile '+el.cat;
  d.innerHTML=`<span class="z">${el.Z}</span><canvas></canvas><span class="sym">${el.s}</span>`;
  container.appendChild(d);const c=d.querySelector('canvas');
  tiles.push({el,c,ctx:c.getContext('2d'),atom:newAtom(el.s)});
  d.addEventListener('pointerenter',ev=>{if(ev.pointerType==='mouse')showAtomInfo(el,d);});
  d.addEventListener('pointerleave',hideAtomInfo);
  d.addEventListener('pointerdown',ev=>{
    hideAtomInfo();
    if(ev.pointerType==='touch')return;
    startPaletteDrag(ev,el);
  });
  d.addEventListener('click',ev=>{
    if(ev.pointerType==='mouse')return;
    addAtom(el.s,null,null,newAtom(el.s));
  });
}
for(let p=1;p<=6;p++){
  const ph=document.createElement('div');ph.className='phead';ph.textContent=p;ph.title=`Kala ${p}`;ptable.appendChild(ph);
  GROUPS.forEach(g=>{
    const el=ELS.map(a=>E[a[0]]).find(e=>e.p===p&&e.g===g);
    if(!el){
      const d=document.createElement('div');
      if(p>=4)d.className='tile-empty';
      ptable.appendChild(d);
      return;
    }
    addTile(ptable,el);
  });
}
function shortTendency(el){
  if(el.cat==='ga')return `Stabil (${el.s==='He'?'duplet':'oktet'}) · tidak reaktif`;
  if(el.cat==='lg'){const q=el.ionQ||el.v;return `Derma ${q}e⁻ → ion <b>${el.s}${chg(q,1)}</b> (${cationShells(el,q).join('.')})`;}
  if(el.s==='H')return 'Kongsi 1e⁻ (duplet) atau terima 1e⁻ → <b>H⁻</b>';
  if(ANION[el.s]){const g=ANION[el.s][0];return `Terima ${g}e⁻ → <b>${el.s}${chg(g,-1)}</b> atau kongsi e⁻`;}
  return `Kongsi ${el.v}e⁻ valens (ikatan kovalen)`;
}
function hideAtomInfo(){
  const tip=$('atomTip');
  if(tip)tip.hidden=true;
}
function showAtomInfo(el,anchor){
  const tip=$('atomTip');
  if(!tip)return;
  tip.innerHTML=`<div class="t"><span class="swatch" style="background:${el.c}"></span>${el.n} (${el.s}) <span class="cat-pill ${el.cat}">${CATN[el.cat]}</span></div>
  <ul><li>Z = <b>${el.Z}</b> · Kumpulan ${el.g}, Kala ${el.p}</li><li>Susunan e⁻: <b>${conf(el)}</b> (valens: <b>${el.v}</b>)</li><li>${shortTendency(el)}</li></ul>`;
  tip.hidden=false;
  if(!anchor||!anchor.getBoundingClientRect)return;
  const wrap=stage.parentElement?.getBoundingClientRect?.();
  const ar=anchor.getBoundingClientRect();
  if(!wrap||!wrap.width)return;
  const tw=tip.offsetWidth||230,th=tip.offsetHeight||92;
  let left=ar.left-wrap.left-tw-10;
  if(left<10)left=Math.min(wrap.width-tw-10,ar.right-wrap.left+10);
  let top=ar.top-wrap.top+(ar.height-th)/2;
  top=Math.max(10,Math.min(wrap.height-th-10,top));
  tip.style.left=Math.round(left)+'px';
  tip.style.top=Math.round(top)+'px';
}
$('elDrawer')?.addEventListener('pointerleave',hideAtomInfo);
function sizeTiles(){tiles.forEach(t=>{const r=t.c.getBoundingClientRect();const w=Math.max(10,Math.round(r.width*DPR));if(t.c.width!==w){t.c.width=w;t.c.height=w;}});}
function drawTiles(tt){
  tiles.forEach(t=>{const c=t.ctx,w=t.c.width;c.setTransform(1,0,0,1,0,0);c.clearRect(0,0,w,w);
    const s=w/2/Math.max(43,Rof(t.el)+5);drawAtomBohr(c,t.atom,w/2,w/2,tt,s);});
}

/* ---------- Seret dari panel ---------- */
let ghost=null;
function startPaletteDrag(ev,el){
  ev.preventDefault();
  const sx=ev.clientX,sy=ev.clientY;let moved=false;
  const atom=newAtom(el.s);
  const gc=document.createElement('canvas');gc.className='ghost';gc.width=gc.height=96*DPR;
  const move=e=>{
    if(!moved&&Math.hypot(e.clientX-sx,e.clientY-sy)>5){moved=true;document.body.appendChild(gc);ghost={c:gc,atom};}
    if(moved){gc.style.left=e.clientX+'px';gc.style.top=e.clientY+'px';}
  };
  const up=e=>{
    window.removeEventListener('pointermove',move);window.removeEventListener('pointerup',up);window.removeEventListener('pointercancel',up);
    if(moved){gc.remove();ghost=null;const r=cv.getBoundingClientRect();
      if(e.clientX>=r.left&&e.clientX<=r.right&&e.clientY>=r.top&&e.clientY<=r.bottom)addAtom(el.s,(e.clientX-r.left)/ZOOM-panX,(e.clientY-r.top)/ZOOM-panY,atom);}
    else addAtom(el.s,null,null,atom);
  };
  window.addEventListener('pointermove',move);window.addEventListener('pointerup',up);window.addEventListener('pointercancel',up);
}
function addAtom(s,x,y,atom){
  if(bodies.reduce((n,b)=>n+b.members.length,0)>=48){setStatus({cls:'none',badge:'RUANG PENUH',title:'Terlalu banyak zarah',text:'Buang beberapa zarah atau tekan “Kosongkan” sebelum menambah atom baharu.'});return;}
  const r=Rof(E[s])+4;
  if(x==null){
    const maxX=(drawerOpen&&VW>650)?Math.max(r+10,VW-610/ZOOM):VW-r;
    const minY=Math.min(VH-r,Math.max(r,58/ZOOM));
    x=r+Math.random()*Math.max(10,maxX-r);
    y=minY+Math.random()*Math.max(10,VH-r-minY);
  }
  x=Math.min(Math.max(x,r),VW-r);y=Math.min(Math.max(y,r),VH-r);
  const b=atomBody(atom||newAtom(s),x,y);bodies.push(b);
  checkNew(b);
  updateInventory();
}

/* ---------- Interaksi dalam ruang simulasi & Kamera (Space + Klik Kanan) ---------- */
let dragInfo=null;
function hit(x,y){let best=null,bd=1e9;for(const b of bodies){if(b.form)continue;const d=Math.hypot(b.x-x,b.y-y);if(d<b.r&&d<bd){bd=d;best=b;}}return best;}
function cpos(e){const r=cv.getBoundingClientRect();return [(e.clientX-r.left)/ZOOM-panX,(e.clientY-r.top)/ZOOM-panY];}
window.addEventListener('keydown',e=>{
  if(e.code!=='Space')return;
  const tag=e.target&&e.target.tagName;
  if(tag==='INPUT'||tag==='TEXTAREA'||tag==='SELECT'||tag==='BUTTON')return;
  spaceHeld=true;
  if(!panDrag)cv.style.cursor='grab';
  e.preventDefault();
});
window.addEventListener('keyup',e=>{if(e.code==='Space'){spaceHeld=false;if(!panDrag)cv.style.cursor='default';}});
window.addEventListener('blur',()=>{spaceHeld=false;panDrag=null;cv.style.cursor='default';});
cv.addEventListener('contextmenu',e=>{if(spaceHeld||panDrag)e.preventDefault();});
cv.addEventListener('pointerdown',e=>{
  if(spaceHeld&&e.button===2){
    e.preventDefault();
    cv.setPointerCapture?.(e.pointerId);
    panDrag={sx:e.clientX,sy:e.clientY,px:panX,py:panY};
    cv.style.cursor='grabbing';
    return;
  }
  if(e.button&&e.button!==0)return;
  const [x,y]=cpos(e);const b=hit(x,y);if(!b)return;
  cv.setPointerCapture?.(e.pointerId);
  dragInfo={b,ox:x-b.x,oy:y-b.y,lx:x,ly:y,lt:performance.now(),vx:0,vy:0,moved:false,sx:x,sy:y};
});
cv.addEventListener('pointermove',e=>{
  if(panDrag){
    panX=panDrag.px+(e.clientX-panDrag.sx)/ZOOM;
    panY=panDrag.py+(e.clientY-panDrag.sy)/ZOOM;
    return;
  }
  const [x,y]=cpos(e);
  if(!dragInfo){cv.style.cursor=spaceHeld?'grab':(hit(x,y)?'grab':'default');return;}
  const d=dragInfo,now=performance.now(),dtm=Math.max(1,now-d.lt)/1000;
  if(!d.moved&&Math.hypot(x-d.sx,y-d.sy)>4){d.moved=true;dragB=d.b;}
  if(!d.moved)return;
  if(!bodies.includes(d.b)){dragInfo=null;dragB=null;return;}
  d.vx=d.vx*.6+((x-d.lx)/dtm)*.4;d.vy=d.vy*.6+((y-d.ly)/dtm)*.4;d.lx=x;d.ly=y;d.lt=now;
  d.b.x=Math.min(Math.max(x-d.ox,d.b.r),VW-d.b.r);d.b.y=Math.min(Math.max(y-d.oy,d.b.r),VH-d.b.r);
  const sx=x+panX,sy=y+panY,tr=trashRect();
  trashHot=sx>tr.x&&sx<tr.x+tr.w&&sy>tr.y&&sy<tr.y+tr.h;cv.style.cursor='grabbing';
});
const endDrag=e=>{
  if(panDrag){panDrag=null;cv.style.cursor=spaceHeld?'grab':'default';return;}
  if(!dragInfo)return;const d=dragInfo;dragInfo=null;
  if(d.moved){
    if(trashHot){
      bodies=bodies.filter(o=>o!==d.b);
      if(focus===d.b){focus=null;showCompound(null);if(!bodies.length)statusIdle();}
      updateInventory();
    }
    else if(!d.b.pinned){const sp=Math.hypot(d.vx,d.vy),mx=320,k=sp>mx?mx/sp:1;d.b.vx=d.vx*k;d.b.vy=d.vy*k;d.b.dir=Math.atan2(d.b.vy,d.b.vx);}
  }else{
    focus=d.b;
    d.b.pinned=!d.b.pinned;
    if(d.b.pinned){d.b.vx=0;d.b.vy=0;d.b.om=0;}
    if(d.b.info){showCompound(d.b.info);setStatus(d.b.info.status);}
    else{statusSingle(d.b);}
  }
  dragB=null;trashHot=false;
};
cv.addEventListener('pointerup',endDrag);cv.addEventListener('pointercancel',endDrag);
cv.addEventListener('dblclick',e=>{
  const [x,y]=cpos(e);const b=hit(x,y);
  if(b&&b.type!=='atom'){const f=b.info.formula;dissociate(b);showCompound(null);
    setStatus({cls:'idle',badge:'DIPECAHKAN',title:`${f} dipecahkan`,text:'Atom-atom kini bebas dan bergerak secara rawak. Tambah atom baharu untuk menyemak gabungan semula.'});updateInventory();}
});

/* ---------- Senarai zarah ---------- */
let invSig='';
function updateInventory(){
  const inv=$('inventory');
  if(!inv)return;
  const groups=new Map();
  bodies.forEach(b=>{const k=b.type==='atom'?symOf(b):b.info.formula;const g=groups.get(k)||{n:0,b,atom:b.type==='atom'};g.n++;groups.set(k,g);});
  const sig=[...groups].map(([k,g])=>k+g.n).join(',');if(sig===invSig)return;invSig=sig;
  if(!groups.size){inv.innerHTML='<span class="empty">Kosong</span>';return;}
  inv.innerHTML='';
  [...groups].sort((a,b)=>a[1].atom-b[1].atom).forEach(([k,g])=>{
    const bt=document.createElement('button');bt.type='button';bt.innerHTML=`<b>${k}</b><small>${g.atom?'atom':''} ×${g.n}</small>`;
    bt.onclick=()=>{const b=bodies.find(o=>(o.type==='atom'?symOf(o):o.info.formula)===k);if(!b)return;focus=b;
      if(b.info){showCompound(b.info);setStatus(b.info.status);}else showAtomInfo(b.members[0].el);};
    inv.appendChild(bt);
  });
}

/* ---------- Panel Lewis ---------- */
const lc=$('lewisCanvas'),lctx=lc.getContext('2d');
let lewisSig='';
function drawLewisPanel(force=false){
  const w=lc.clientWidth||300,h=lc.clientHeight||190;
  const b=focus;
  const sig=(b?`${b.id}:${b.form?1:0}`:'none')+`:${dotMode?1:0}:${w}x${h}`;
  if(!force&&sig===lewisSig&&!(b&&b.form))return;
  lewisSig=sig;
  if(lc.width!==Math.round(w*DPR)||lc.height!==Math.round(h*DPR)){lc.width=Math.round(w*DPR);lc.height=Math.round(h*DPR);}
  lctx.setTransform(DPR,0,0,DPR,0,0);lctx.clearRect(0,0,w,h);
  if(!b){lctx.fillStyle='#93a3c0';lctx.font='13px system-ui,sans-serif';lctx.textAlign='center';lctx.textBaseline='middle';lctx.fillText('Struktur Lewis akan dipaparkan di sini',w/2,h/2);$('lewisLeg').textContent='';return;}
  let ex=40,ey=36;b.members.forEach(m=>{ex=Math.max(ex,Math.abs(m.lx)+42);ey=Math.max(ey,Math.abs(m.ly)+34);});
  const sc=Math.min(1.9,(w/2-6)/ex,(h/2-6)/ey);
  lctx.save();lctx.translate(w/2,h/2);lctx.scale(sc,sc);drawLewisStatic(lctx,b,0,0);lctx.restore();
  let leg='';
  if(b.type==='cov'&&dotMode){const c=b.members[0],o=b.members.find(m=>m.el.s!==c.el.s)||b.members[1];leg=`${c.shape==='x'?'×':'•'} ${c.el.s}   ${o.shape==='x'?'×':'•'} ${o.el.s}`;}
  else if(b.type==='ion'){const c=b.members.find(m=>m.ion==='+'),a=b.members.find(m=>m.ion==='-');leg=`× elektron ${c.el.s}   • elektron ${a.el.s}`;}
  $('lewisLeg').textContent=leg;
}

/* ---------- Kawalan ---------- */
let drawerOpen=true;
function toggleDrawer(force){
  drawerOpen=force===undefined?!drawerOpen:!!force;
  $('elDrawer')?.classList.toggle('is-closed',!drawerOpen);
  if(!drawerOpen)hideAtomInfo();
  const bt=$('btnDrawer');
  if(bt){bt.setAttribute('aria-expanded',String(drawerOpen));bt.classList.toggle('is-open',drawerOpen);}
}
$('btnDrawer').onclick=()=>toggleDrawer();
$('btnDrawerClose').onclick=()=>toggleDrawer(false);

const SPEEDS=[0.5,1,2,5];
const speedLabel=v=>v===1?'×1.0':`×${v}`;
let speedIdx=1;
function setSpeed(v){
  speed=v;
  const i=SPEEDS.indexOf(v);if(i>=0)speedIdx=i;
  const bs=$('btnSpeed');if(bs)bs.textContent=speedLabel(speed);
}
$('btnSpeed').onclick=()=>{speedIdx=(speedIdx+1)%SPEEDS.length;setSpeed(SPEEDS[speedIdx]);};

const ICON_PAUSE='<svg viewBox="0 0 20 20" width="16" height="16" fill="currentColor" aria-hidden="true"><rect x="4.5" y="3.5" width="3.8" height="13" rx="1"/><rect x="11.7" y="3.5" width="3.8" height="13" rx="1"/></svg>';
const ICON_PLAY='<svg viewBox="0 0 20 20" width="16" height="16" fill="currentColor" aria-hidden="true"><path d="M5.5 3.8v12.4L16 10z"/></svg>';
$('btnPause').onclick=()=>{
  paused=!paused;
  const bp=$('btnPause');
  bp.innerHTML=paused?ICON_PLAY:ICON_PAUSE;
  bp.setAttribute('aria-label',paused?'Main':'Jeda');
  bp.title=paused?'Main':'Jeda';
  bp.setAttribute('aria-pressed',String(paused));
};

function applyAutoUnsur(on){
  autoUnsur=!!on;
  const cb=$('chkUnsur');if(cb)cb.checked=autoUnsur;
  if(autoUnsur){
    for(const b of bodies.slice()){
      if(bodies.includes(b)&&b.type==='atom'&&!b.form)checkNew(b);
    }
  }else{
    const unsurs=bodies.filter(b=>b.type==='cov'&&b.info&&b.info.kind==='unsur');
    if(unsurs.length){
      let clearedFocus=false;
      unsurs.forEach(mol=>{
        if(focus===mol)clearedFocus=true;
        dissociate(mol,40);
      });
      if(clearedFocus){
        showCompound(null);
        setStatus({cls:'idle',badge:'MOLEKUL UNSUR DIMATIKAN',title:'Molekul unsur dipecahkan',text:'Atom bukan logam yang sama kini bebas sebagai atom tunggal.'});
      }
    }
  }
  updateInventory();
}

function seg(id,cb){const s=$(id);s.addEventListener('click',e=>{const bt=e.target.closest('button');if(!bt)return;s.querySelectorAll('button').forEach(x=>x.classList.toggle('on',x===bt));cb(bt.dataset.v);});}
seg('segMode',v=>mode=v);
seg('segDot',v=>dotMode=v==='dot');
$('chkLabel').onchange=e=>showLabel=e.target.checked;
$('chkUnsur').onchange=e=>applyAutoUnsur(e.target.checked);
$('btnClear').onclick=()=>{bodies=[];focus=null;panX=0;panY=0;showCompound(null);statusIdle();drawLewisPanel(true);updateInventory();};

/* ---------- Saiz kanvas & Ctrl+Scroll Zoom ---------- */
let userZoom=1;
function setZoom(z){
  userZoom=Math.max(0.55,Math.min(2.4,z));
  resize();
}
cv.addEventListener('wheel',e=>{
  if(!e.ctrlKey&&!e.metaKey)return;
  e.preventDefault();
  setZoom(userZoom*(e.deltaY<0?1.1:1/1.1));
},{passive:false});
function resize(){
  DPR=Math.min(2,window.devicePixelRatio||1);
  const r=stage.getBoundingClientRect();
  if(r.width<10||r.height<10)return;
  const baseZoom=r.width>900&&r.height>520?1.5:r.width>620?1.15:0.9;
  ZOOM=baseZoom*userZoom;
  VW=Math.max(200,r.width)/ZOOM;VH=Math.max(200,r.height)/ZOOM;
  cv.width=Math.round(r.width*DPR);cv.height=Math.round(r.height*DPR);
  bodies.forEach(b=>{
    const minX=Math.min(b.r,VW/2),maxX=Math.max(VW-b.r,VW/2);
    const minY=Math.min(b.r,VH/2),maxY=Math.max(VH-b.r,VH/2);
    b.x=Math.min(Math.max(Number.isFinite(b.x)?b.x:VW/2,minX),maxX);
    b.y=Math.min(Math.max(Number.isFinite(b.y)?b.y:VH/2,minY),maxY);
  });
  sizeTiles();
  drawWorld();
}
if(typeof ResizeObserver!=='undefined')new ResizeObserver(resize).observe(stage);
window.addEventListener('resize',resize);

/* ---------- Gelung utama (dioptimumkan untuk 60fps licin) ---------- */
let last=performance.now(),invT=0,tileT=1;
function frame(now){
  if(typeof requestAnimationFrame==='function')requestAnimationFrame(frame);
  const dt=Math.max(0,Math.min(.033,(now-last)/1000));last=now;
  try{
    if(!paused){T+=dt;step(dt);}
    drawWorld();
    if(drawerOpen){
      tileT+=dt;
      if(tileT>=0.042){tileT=0;drawTiles(now/1000);}
    }
    drawLewisPanel();
    if(ghost){const c=ghost.c.getContext('2d');c.setTransform(1,0,0,1,0,0);c.clearRect(0,0,ghost.c.width,ghost.c.height);drawAtomBohr(c,ghost.atom,ghost.c.width/2,ghost.c.height/2,now/1000,DPR*1.1);}
    invT+=dt;if(invT>.3){invT=0;updateInventory();}
  }catch(err){if(typeof console!=='undefined')console.error(err);}
}
$('btnZoomIn').onclick=()=>setZoom(userZoom*1.15);
$('btnZoomOut').onclick=()=>setZoom(userZoom/1.15);

let pinchState=null;
cv.addEventListener('touchstart',e=>{
  if(e.touches.length===2){
    e.preventDefault();
    const [t1,t2]=e.touches;
    pinchState={
      dist:Math.hypot(t2.clientX-t1.clientX,t2.clientY-t1.clientY)||1,
      zoom:userZoom,
      mx:(t1.clientX+t2.clientX)/2,
      my:(t1.clientY+t2.clientY)/2,
      px:panX,py:panY
    };
    dragInfo=null;dragB=null;
  }
},{passive:false});
cv.addEventListener('touchmove',e=>{
  if(pinchState&&e.touches.length===2){
    e.preventDefault();
    const [t1,t2]=e.touches;
    const dist=Math.hypot(t2.clientX-t1.clientX,t2.clientY-t1.clientY)||1;
    const mx=(t1.clientX+t2.clientX)/2,my=(t1.clientY+t2.clientY)/2;
    panX=pinchState.px+(mx-pinchState.mx)/ZOOM;
    panY=pinchState.py+(my-pinchState.my)/ZOOM;
    setZoom(pinchState.zoom*(dist/pinchState.dist));
  }
},{passive:false});
cv.addEventListener('touchend',e=>{if(e.touches.length<2)pinchState=null;});

resize();statusIdle();
if(typeof window.matchMedia==='function'&&window.matchMedia('(max-width: 760px)').matches)toggleDrawer(false);
if(typeof requestAnimationFrame==='function')requestAnimationFrame(frame);
window.addEventListener('DOMContentLoaded',()=>{if(typeof setupLessonVideos==='function')setupLessonVideos({id:'ikatan-kimia',videos:[]});});

// API kecil untuk ujian/integrasi
window.IkatanSim={
  addAtom:(s,x,y)=>addAtom(s,x,y),
  clear:()=>$('btnClear').click(),
  bodies:()=>bodies,
  setMode:v=>{mode=v;},
  setDotMode:v=>{dotMode=!!v;},
  setAutoUnsur:v=>applyAutoUnsur(v),
  setSpeed,
  getSpeed:()=>speed,
  setZoom,
  getZoom:()=>userZoom,
  setPan:(x,y)=>{panX=x;panY=y;drawWorld();},
  getPan:()=>({x:panX,y:panY}),
  toggleDrawer,
  isDrawerOpen:()=>drawerOpen,
  dissociate,
  relation,
  balance,
  tendency,
  E,
  COV,
  step,
  drawWorld,
  drawLewisPanel
};
})();

(()=>{
"use strict";
/* =========================================================
   DATA UNSUR
   ========================================================= */
const TAU=Math.PI*2;
const SR=[14,22,30,38,45,52];          // jejari petala (px)
const NUC=8;                           // jejari nukleus
const W=[1.9,1.3,0.95,0.7,0.55,0.45];  // halaju sudut elektron setiap petala (rad/s)
const OV=12;                           // pertindihan petala luar dalam ikatan kovalen

// [simbol, nama, Z, petala, kategori, kumpulan, kala, jisim atom relatif, warna, pilihan?]
const ELS=[
 ['H','Hidrogen',1,[1],'bl',1,1,1.0,'#e2e8f0'],
 ['He','Helium',2,[2],'ga',18,1,4.0,'#fda4af'],
 ['Li','Litium',3,[2,1],'lg',1,2,6.9,'#fdba74'],
 ['Be','Berilium',4,[2,2],'lg',2,2,9.0,'#fcd34d'],
 ['B','Boron',5,[2,3],'mt',13,2,10.8,'#fb7185'],
 ['C','Karbon',6,[2,4],'bl',14,2,12.0,'#a1a1aa'],
 ['N','Nitrogen',7,[2,5],'bl',15,2,14.0,'#60a5fa'],
 ['O','Oksigen',8,[2,6],'bl',16,2,16.0,'#f87171'],
 ['F','Fluorin',9,[2,7],'bl',17,2,19.0,'#a3e635'],
 ['Ne','Neon',10,[2,8],'ga',18,2,20.2,'#f0abfc'],
 ['Na','Natrium',11,[2,8,1],'lg',1,3,23.0,'#c084fc'],
 ['Mg','Magnesium',12,[2,8,2],'lg',2,3,24.3,'#22d3ee'],
 ['Al','Aluminium',13,[2,8,3],'lg',13,3,27.0,'#cbd5e1'],
 ['Si','Silikon',14,[2,8,4],'mt',14,3,28.1,'#fbbf24'],
 ['P','Fosforus',15,[2,8,5],'bl',15,3,31.0,'#fb923c'],
 ['S','Sulfur',16,[2,8,6],'bl',16,3,32.1,'#fde047'],
 ['Cl','Klorin',17,[2,8,7],'bl',17,3,35.5,'#34d399'],
 ['Ar','Argon',18,[2,8,8],'ga',18,3,39.9,'#a5b4fc'],
 ['K','Kalium',19,[2,8,8,1],'lg',1,4,39.1,'#a78bfa'],
 ['Ca','Kalsium',20,[2,8,8,2],'lg',2,4,40.1,'#e879f9'],
 ['Fe','Ferum',26,[2,8,14,2],'lg',8,4,55.8,'#f97316',{extra:true,ionQ:2,ionName:'Ferum(II)',ionNote:'Ferum ialah logam peralihan yang boleh membentuk ion Fe²⁺ (ferum(II)) atau Fe³⁺ (ferum(III)). Simulasi ini memaparkan ion Fe²⁺.'}],
 ['Cu','Kuprum',29,[2,8,18,1],'lg',11,4,63.5,'#fb923c',{extra:true,ionQ:2,ionName:'Kuprum(II)',ionNote:'Kuprum ialah logam peralihan yang lazim membentuk ion Cu²⁺ (kuprum(II)) dan juga boleh membentuk Cu⁺.'}],
 ['Zn','Zink',30,[2,8,18,2],'lg',12,4,65.4,'#67e8f9',{extra:true,ionQ:2}],
 ['I','Iodin',53,[2,8,18,18,7],'bl',17,5,126.9,'#d946ef',{extra:true}],
 ['Pb','Plumbum',82,[2,8,18,32,18,4],'lg',14,6,207.2,'#94a3b8',{extra:true,ionQ:2,ionName:'Plumbum(II)',ionNote:'Plumbum lazim membentuk ion Pb²⁺ (plumbum(II)) dalam silibus KSSM (contohnya PbI₂ dan PbCl₂).'}],
];
const E={};
ELS.forEach(a=>{const [s,n,Z,sh,cat,g,p,m,c,meta]=a;E[s]=Object.assign({s,n,Z,sh,cat,g,p,m,c,v:sh[sh.length-1]},meta||{});});
const CATN={lg:'Logam',bl:'Bukan logam',mt:'Metaloid',ga:'Gas adi'};
const conf=el=>el.sh.join('.');
const Rof=el=>SR[el.sh.length-1];
function cationShells(el,q){
  const sh=el.sh.slice();let rem=q;
  while(rem>0&&sh.length){
    const last=sh.length-1,take=Math.min(sh[last],rem);
    sh[last]-=take;rem-=take;
    if(sh[last]===0)sh.pop();
  }
  return sh;
}

const SUB={'0':'₀','1':'₁','2':'₂','3':'₃','4':'₄','5':'₅','6':'₆','7':'₇','8':'₈','9':'₉'};
const SUP={'2':'²','3':'³','4':'⁴'};
const sub=n=>n>1?String(n).split('').map(c=>SUB[c]).join(''):'';
const chg=(q,s)=>(q>1?SUP[q]:'')+(s>0?'⁺':'⁻');
const coef=n=>n>1?String(n):'';
const gcd=(a,b)=>b?gcd(b,a%b):a;
const elOrder=f=>f.replace(/[₀-₉]/g,'').match(/[A-Z][a-z]?/g);

// anion: [cas, nama akhiran]
const ANION={H:[1,'hidrida'],N:[3,'nitrida'],O:[2,'oksida'],F:[1,'fluorida'],P:[3,'fosfida'],S:[2,'sulfida'],Cl:[1,'klorida'],I:[1,'iodida']};
const DIAT=new Set(['H','N','O','F','Cl','I']);
const UNSUR={H:{o:1,name:'Hidrogen'},N:{o:3,name:'Nitrogen'},O:{o:2,name:'Oksigen'},F:{o:1,name:'Fluorin'},Cl:{o:1,name:'Klorin'},I:{o:1,name:'Iodin'}};
const SAME={
 C:'Atom-atom karbon berkongsi elektron membentuk struktur kovalen raksasa (intan atau grafit) — bukan molekul ringkas, jadi tidak disimulasikan.',
 Si:'Atom-atom silikon membentuk struktur kovalen raksasa (seperti intan) — tidak disimulasikan sebagai molekul ringkas.',
 B:'Atom-atom boron membentuk struktur kovalen raksasa yang kompleks — tidak disimulasikan.',
 P:'Fosforus wujud sebagai molekul P₄ (4 atom) — di luar skop simulasi dua atom ini.',
 S:'Sulfur wujud sebagai molekul S₈ berbentuk cincin — di luar skop simulasi ini.'
};
const OOS={
 'N|O':'Nitrogen dan oksigen membentuk beberapa oksida (NO, NO₂, N₂O) yang melibatkan elektron tidak berpasangan — di luar skop simulasi.',
 'O|P':'Fosforus dan oksigen membentuk P₄O₆ / P₄O₁₀ (molekul besar) — di luar skop simulasi.',
 'B|O':'B₂O₃ mempunyai struktur kovalen raksasa — di luar skop simulasi.',
 'B|N':'BN membentuk struktur kovalen raksasa seperti grafit — di luar skop simulasi.',
 'C|Si':'SiC (karborundum) ialah struktur kovalen raksasa — di luar skop simulasi.',
 'N|Si':'Si₃N₄ ialah struktur kovalen raksasa — di luar skop simulasi.',
 'C|N':'Karbon dan nitrogen membentuk molekul seperti sianogen, (CN)₂ — di luar skop simulasi.'
};

// Sebatian kovalen yang disokong
const COV={};
const rep=(s,o,n)=>Array.from({length:n},()=>[s,o]);
function cov(formula,name,central,terms,extra={}){
  const counts={};counts[central]=1;terms.forEach(([s])=>counts[s]=(counts[s]||0)+1);
  const key=Object.keys(counts).sort().join('|');
  COV[key]=Object.assign({formula,name,central,terms,counts},extra);
}
const NOTE_B='Atom B hanya mempunyai 6 elektron pada petala valens (oktet tidak lengkap). Ia boleh menerima sepasang elektron untuk membentuk ikatan datif.';
cov('H₂O','Air','O',rep('H',1,2));
cov('NH₃','Ammonia','N',rep('H',1,3));
cov('CH₄','Metana','C',rep('H',1,4));
cov('HCl','Hidrogen klorida','Cl',[['H',1]],{note:'Gas HCl ialah sebatian kovalen, tetapi apabila larut dalam air ia mengion menghasilkan asid hidroklorik.'});
cov('HF','Hidrogen fluorida','F',[['H',1]]);
cov('H₂S','Hidrogen sulfida','S',rep('H',1,2));
cov('PH₃','Fosfina','P',rep('H',1,3));
cov('SiH₄','Silana','Si',rep('H',1,4));
cov('BH₃','Borana','B',rep('H',1,3),{note:'BH₃ tidak stabil dan wujud sebagai diborana, B₂H₆. '+NOTE_B});
cov('CO₂','Karbon dioksida','C',rep('O',2,2));
cov('CS₂','Karbon disulfida','C',rep('S',2,2));
cov('SO₂','Sulfur dioksida','S',rep('O',2,2),{note:'Struktur ini menunjukkan atom S dengan 10 elektron (oktet berkembang, kala 3). Struktur alternatif ialah bentuk resonans O=S–O.'});
cov('SiO₂','Silikon dioksida','Si',rep('O',2,2),{giant:true,note:'Gambar rajah ini hanya mewakili nisbah 1 Si : 2 O. SiO₂ sebenar ialah struktur kovalen raksasa — setiap atom Si terikat kepada 4 atom O melalui ikatan tunggal.'});
cov('CCl₄','Karbon tetraklorida','C',rep('Cl',1,4));
cov('CF₄','Karbon tetrafluorida','C',rep('F',1,4));
cov('SiCl₄','Silikon tetraklorida','Si',rep('Cl',1,4));
cov('SiF₄','Silikon tetrafluorida','Si',rep('F',1,4));
cov('NCl₃','Nitrogen triklorida','N',rep('Cl',1,3));
cov('NF₃','Nitrogen trifluorida','N',rep('F',1,3));
cov('PCl₃','Fosforus triklorida','P',rep('Cl',1,3));
cov('PF₃','Fosforus trifluorida','P',rep('F',1,3));
cov('BF₃','Boron trifluorida','B',rep('F',1,3),{note:NOTE_B});
cov('BCl₃','Boron triklorida','B',rep('Cl',1,3),{note:NOTE_B});
cov('OF₂','Oksigen difluorida','O',rep('F',1,2));
cov('Cl₂O','Diklorin monoksida','O',rep('Cl',1,2));
cov('SCl₂','Sulfur diklorida','S',rep('Cl',1,2));
cov('ClF','Klorin monofluorida','Cl',[['F',1]]);
cov('HI','Hidrogen iodida','I',[['H',1]],{note:'Gas HI ialah sebatian kovalen, tetapi apabila larut dalam air ia mengion menghasilkan asid hidroiodik.'});
cov('CI₄','Karbon tetraiodida','C',rep('I',1,4));
cov('PI₃','Fosforus triiodida','P',rep('I',1,3));
cov('ICl','Iodin monoklorida','I',[['Cl',1]]);
cov('IF','Iodin monofluorida','I',[['F',1]]);

/* =========================================================
   ENJIN TINDAK BALAS
   ========================================================= */
function gasAdiReason(g){return `${g.s} (${g.n}) ialah gas adi dengan susunan elektron ${g.s==='He'?'duplet':'oktet'} yang stabil (${conf(g)}). Ia tidak menderma, menerima atau berkongsi elektron.`;}
function relation(a,b){
  const ea=E[a],eb=E[b];
  if(ea.cat==='ga'||eb.cat==='ga') return {kind:'none',reason:gasAdiReason(ea.cat==='ga'?ea:eb)};
  const ma=ea.cat==='lg',mb=eb.cat==='lg';
  if(ma&&mb) return {kind:'none',reason:a===b
    ?`Atom-atom ${a} ialah logam — ia terikat melalui ikatan logam (lautan elektron), bukan membentuk sebatian.`
    :`${a} dan ${b} kedua-duanya logam yang cenderung menderma elektron. Tiada atom yang menerima elektron, jadi tiada sebatian terbentuk.`};
  if(ma||mb){
    const M=ma?ea:eb,X=ma?eb:ea,an=ANION[X.s];
    if(!an||(X.s==='H'&&(M.s==='Be'||M.s==='Al'||M.s==='Fe'||M.s==='Cu'||M.s==='Zn'||M.s==='Pb')))
      return {kind:'none',reason:`Gabungan logam ${M.s} dengan ${X.s} tidak membentuk sebatian ion ringkas dalam skop silibus.`};
    const q=M.ionQ||M.v,g=an[0],gg=gcd(q,g),na=g/gg,nb=q/gg;
    const formula=M.s+sub(na)+X.s+sub(nb);
    const counts={};counts[M.s]=na;counts[X.s]=nb;
    const notes=[];
    if((M.s==='Al'||M.s==='Be')&&(X.s==='Cl'))
      notes.push(`Mengikut silibus, logam + bukan logam membentuk sebatian ion. Namun dalam realiti, ${formula} menunjukkan sifat kovalen kerana perbezaan keelektronegatifan yang kecil.`);
    if(M.ionNote)notes.push(M.ionNote);
    return {kind:'ion',M,X,q,g,na,nb,formula,name:(M.ionName||M.n)+' '+an[1],counts,note:notes.join(' ')};
  }
  if(a===b){
    if(UNSUR[a]){const u=UNSUR[a];return {kind:'unsur',formula:a+'₂',name:u.name,counts:{[a]:2},spec:{central:a,terms:[[a,u.o]]},o:u.o};}
    return {kind:'none',reason:SAME[a]||'Tiada tindak balas.'};
  }
  const key=[a,b].sort().join('|');
  if(COV[key]){const s=COV[key];return {kind:'cov',formula:s.formula,name:s.name,counts:s.counts,spec:s};}
  return {kind:'none',reason:OOS[key]||`${a} dan ${b} ialah bukan logam yang boleh berkongsi elektron, tetapi sebatian yang terbentuk tidak termasuk dalam skop simulasi ini.`};
}

function balance(syms,counts){
  let n=1;if(syms.some(s=>DIAT.has(s)&&counts[s]%2))n=2;
  let cs=syms.map(s=>DIAT.has(s)?n*counts[s]/2:n*counts[s]);
  const g=cs.reduce(gcd,n);cs=cs.map(c=>c/g);
  return {re:syms.map((s,i)=>coef(cs[i])+s+(DIAT.has(s)?'₂':'')),p:n/g};
}

function tendency(el){
  if(el.cat==='ga') return `Gas adi — susunan elektron ${el.s==='He'?'duplet':'oktet'} yang stabil. Tidak bertindak balas.`;
  if(el.cat==='lg'){const q=el.ionQ||el.v;return `Logam — cenderung menderma ${q} elektron untuk membentuk ion ${el.s}${chg(q,1)} (${cationShells(el,q).join('.')}).`;}
  if(el.s==='H') return 'Bukan logam — berkongsi 1 elektron untuk mencapai susunan duplet, atau menerima 1 elektron daripada logam aktif membentuk ion H⁻.';
  if(ANION[el.s]){const g=ANION[el.s][0];return `Bukan logam — cenderung menerima ${g} elektron membentuk ion ${el.s}${chg(g,-1)} (dengan logam), atau berkongsi elektron (dengan bukan logam).`;}
  return `${CATN[el.cat]} — cenderung berkongsi ${el.v} elektron valens dengan atom bukan logam lain.`;
}
globalThis.BondModel={TAU,SR,NUC,W,OV,ELS,E,CATN,conf,Rof,cationShells,SUB,SUP,sub,chg,coef,gcd,elOrder,ANION,DIAT,UNSUR,SAME,OOS,COV,rep,cov,NOTE_B,gasAdiReason,relation,balance,tendency};
})();

(() => {
'use strict';
const $=id=>document.getElementById(id), M=window.TransformMath, copy=x=>structuredClone(x);
const canvas=$('grid'),ctx=canvas.getContext('2d');
const shapes={triangle:[[1,1],[4,1],[2,4]],square:[[1,1],[4,1],[4,4],[1,4]],rectangle:[[1,1],[5,1],[5,3],[1,3]],parallelogram:[[1,1],[5,1],[6,4],[2,4]],trapezoid:[[1,1],[6,1],[4,4],[2,4]],pentagon:[[1,1],[4,1],[5,3],[3,5],[0,3]],hexagon:[[1,1],[4,1],[5,3],[4,5],[1,5],[0,3]]};
const names={translasi:'Translasi',pantulan:'Pantulan',pembesaran:'Pembesaran',putaran:'Putaran'},colours=['#006f82','#4f46e5','#b86a00'];
const defaults=()=>[{type:'translasi',a:-5,b:1,line:'y',c:0,p1:[-4,0],p2:[4,0],h:0,v:0,k:2,angle:90},{type:'putaran',a:3,b:0,line:'x',c:0,p1:[0,-4],p2:[0,4],h:0,v:0,k:2,angle:90}];
let point=false,pts=copy(shapes.triangle),ts=defaults(),count=1,active=0,selected=0,all=[],valid=true,shapeKey='triangle';
let camera={cx:0,cy:0,scale:30},initialized=false,gesture=null,special=null,hover=null;
let history=[],future=[],toolMode='auto';
const fmt=n=>{const rounded=Math.round((Math.abs(n)<1e-9?0:n)*1000)/1000;return String(rounded);};
const val=n=>(Math.abs(n-Number(fmt(n)))>1e-8?'≈ ':'')+fmt(n);
const pair=p=>`(${p.map(fmt).join(', ')})`,letter=i=>String.fromCharCode(65+i),prime=i=>'′'.repeat(i);
const say=msg=>{$('notice').textContent=msg;};
const snapshot=()=>({point,pts:copy(pts),ts:copy(ts),count,active,selected,shape:shapeKey});
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
function remember(before){if(same(before,snapshot()))return;history.push(before);if(history.length>60)history.shift();future=[];historyButtons();}
function historyButtons(){$('undo').disabled=!history.length;$('redo').disabled=!future.length;}
function restore(s){({point,pts,ts,count,active,selected}=copy(s));shapeKey=s.shape;$('shape').value=shapeKey;special=null;syncMode();renderTransforms();update();historyButtons();}
function undo(){if(gesture||special){cancel();return;}if(!history.length)return;future.push(snapshot());restore(history.pop());say('Tindakan diundur.');}
function redo(){if(!future.length)return;history.push(snapshot());restore(future.pop());say('Tindakan diulang.');}
function act(fn){const before=snapshot();special=null;fn();update();remember(before);}
function number(id,label,n,min=-10000,max=10000){return `<label>${label}<input id="${id}" type="number" value="${n}" min="${min}" max="${max}" step="any" required></label>`;}
function ratio(n,d){
 let a=Math.round(n*4),b=Math.round(d*4);
 if(Math.abs(a-n*4)>1e-8||Math.abs(b-d*4)>1e-8||!b)return val(n/d);
 if(b<0){a=-a;b=-b;}let x=Math.abs(a),y=b;while(y){const r=x%y;x=y;y=r;}
 a/=x||1;b/=x||1;return b===1?String(a):`(${a}/${b})`;
}
function lineEquation(t){
 const [a,b,c]=M.lineCoefficients(t);
 if(Math.abs(b)<1e-9)return `x = ${t.line==='free'?ratio(-c,a):val(-c/a)}`;
 const m=-a/b,d=-c/b;
 if(Math.abs(m)<1e-9)return `y = ${t.line==='free'?ratio(-c,b):val(d)}`;
 const slope=Math.abs(m-1)<1e-9?'x':Math.abs(m+1)<1e-9?'−x':`${t.line==='free'?ratio(-a,b):val(m)}x`;
 return `y = ${slope}`+(Math.abs(d)<1e-9?'':` ${d<0?'−':'+'} ${t.line==='free'?ratio(Math.abs(c),Math.abs(b)):val(Math.abs(d))}`);
}
function describe(t){
 if(t.type==='translasi')return `Translasi vektor ${pair([t.a,t.b])}`;
 if(t.type==='pantulan')return 'Pantulan pada '+lineEquation(t);
 if(t.type==='pembesaran')return `Pembesaran pusat ${pair([t.h,t.v])}, k = ${fmt(t.k)}`;
 return `Putaran ${fmt(Math.abs(t.angle))}° ${t.angle<0?'ikut':'lawan'} arah jam, pusat ${pair([t.h,t.v])}`;
}
function syncMode(){
 $('pointMode').setAttribute('aria-pressed',point);$('polygonMode').setAttribute('aria-pressed',!point);$('shapeLabel').hidden=point;
 $('editHint').textContent=point?'Seret titik pada grid. Magnet menetapkan kedudukannya pada 0.5 unit.':'Tarik bucu untuk ubah bentuk. Tekan dan seret bahagian dalam untuk alih seluruh poligon.';
 $('singleTab').setAttribute('aria-selected',count===1);$('comboTab').setAttribute('aria-selected',count===2);
 $('singleTab').tabIndex=count===1?0:-1;$('comboTab').tabIndex=count===2?0:-1;
 $('transformPanel').setAttribute('aria-labelledby',count===1?'singleTab':'comboTab');
 $('transformStages').hidden=count===1;$('swap').hidden=count===1;$('secondLegend').hidden=count===1;
 syncTools();
 $('pTab').setAttribute('aria-pressed',active===0);$('qTab').setAttribute('aria-pressed',active===1);
 $('selectedVertex').innerHTML=pts.map((_,i)=>`<option value="${i}">Titik ${letter(i)}</option>`).join('');
 selected=Math.min(selected,pts.length-1);$('selectedVertex').value=selected;
}
function renderVertices(){
 const html=pts.map((p,i)=>`<button class="vertexchip" data-vertex="${i}" aria-pressed="${i===selected}" title="Pilih bucu ${letter(i)}; gunakan kekunci anak panah untuk mengalihkannya">${letter(i)} ${pair(p)}</button>`).join('');
 // Keep keyboard focus when changing coordinates.
 const focus=document.activeElement?.dataset?.vertex;
 $('vertices').innerHTML=html;
 $('vertices').querySelectorAll('button').forEach(el=>{
   el.onclick=()=>{selected=+el.dataset.vertex;$('selectedVertex').value=selected;renderVertices();calculate();draw();say(`Bucu ${letter(selected)} dipilih. Gunakan anak panah untuk alih 0.5 unit.`);};
   el.onkeydown=e=>{if(arrow(e.key)){e.preventDefault();selected=+el.dataset.vertex;nudge(arrow(e.key),true);}};
 });
 if(focus!==undefined)$('vertices').querySelector(`[data-vertex="${focus}"]`)?.focus({preventScroll:true});
}
function renderTransforms(){
 const t=ts[active],i=active;let fields='';
 if(t.type==='translasi')fields=`<div class="pair">${number('a','a · gerakan x',t.a)}${number('b','b · gerakan y',t.b)}</div><button class="secondary full toolbutton" id="moveImage">Seret imej pada grid</button><p class="hint">Tarik imej untuk melaras vektor secara langsung.</p>`;
 if(t.type==='pantulan')fields=`<button class="secondary full toolbutton" id="drawLine">✎ Lukis garis pantulan</button><label>Atau pilih garis biasa<select id="linePreset"><option value="free">Garis bebas</option><option value="x">x = c · menegak</option><option value="y">y = c · mendatar</option><option value="diag">y = x</option><option value="negdiag">y = −x</option></select></label>${['x','y'].includes(t.line)?number('c','Nilai c',t.c):''}<div id="lineReadout" class="readout"></div><p class="hint">Tekan dan tarik untuk melukis. Pemegang hujung dan garis boleh diseret selepas itu.</p>`;
 if(['pembesaran','putaran'].includes(t.type))fields=`<button class="secondary full toolbutton" id="pickCenter">⌖ Pilih pusat pada grid</button><div id="centerReadout" class="readout"></div><details><summary class="hint">Tetapkan pusat dengan nombor</summary><div class="pair">${number('h','Pusat x',t.h)}${number('v','Pusat y',t.v)}</div></details>`;
 if(t.type==='pembesaran')fields+=number('k','Faktor skala k (≠ 0)',t.k,-10,10)+`<div class="presets" aria-label="Faktor skala pantas">${[-2,-1,.5,1,2,3].map(k=>`<button data-k="${k}">${k}</button>`).join('')}</div><button class="secondary full toolbutton" id="moveImage">Seret imej pada grid</button><p class="hint">Seret imej → pusat berubah, k dikekalkan. Untuk k = 1, seret objek asal.</p>`;
 if(t.type==='putaran')fields+=number('angle','Sudut θ (°) · positif lawan jam',t.angle,-360,360)+`<input id="angleRange" class="slider" type="range" min="-360" max="360" step="15" value="${t.angle}" aria-label="Laraskan sudut putaran"><div class="presets"><button data-angle="-90">90° ikut jam</button><button data-angle="90">90° lawan jam</button><button data-angle="180">180°</button></div><button class="secondary full toolbutton" id="moveImage">Seret imej pada grid</button><p class="hint">Seret imej → pusat berubah, sudut dikekalkan. Seret pusat atau gelongsorkan sudut untuk meneroka.</p>`;
 $('transforms').innerHTML=`<div class="transform"><h3>Transformasi ${i?'Q · selepas P':'P · pertama'}</h3><label>Jenis<select id="type">${Object.entries(names).map(([k,v])=>`<option value="${k}">${v}</option>`).join('')}</select></label>${fields}</div>`;
 $('type').value=t.type;
 $('type').onchange=e=>act(()=>{t.type=e.target.value;renderTransforms();setTool('auto');});
 ['a','b','c','h','v','k','angle'].forEach(key=>{const el=$(key);if(!el)return;el.oninput=()=>{
   if(!el.checkValidity()||(key==='k'&&el.valueAsNumber===0)){showError('Isi nombor yang sah. Faktor skala mesti antara −10 dan 10 dan bukan sifar; sudut antara −360° dan 360°.');return;}
   const before=snapshot();t[key]=el.valueAsNumber;if(key==='angle')$('angleRange').value=t.angle;update();remember(before);
 };});
 if($('linePreset')){$('linePreset').value=t.line;$('linePreset').onchange=e=>act(()=>{t.line=e.target.value;renderTransforms();});}
 if($('drawLine'))$('drawLine').onclick=()=>{special={kind:'line',i:active};$('guides').checked=true;draw();toolHint();say('Tekan dan seret pada grid untuk menentukan dua titik garis pantulan. Escape untuk batal.');canvas.scrollIntoView({block:'center'});};
 if($('pickCenter'))$('pickCenter').onclick=()=>{
  const wasActive=special?.kind==='center'&&special.i===active;
  special=wasActive?null:{kind:'center',i:active};
  if(!wasActive)$('guides').checked=true;
  toolHint();draw();
  say(wasActive?'Pemilihan pusat ditamatkan.':'Mod pilih pusat aktif. Klik grid berkali-kali; tekan butang ini semula atau Escape untuk tamat.');
  if(!wasActive)canvas.scrollIntoView({block:'center'});
 };
 if($('moveImage'))$('moveImage').onclick=()=>{setTool('image'+active);$('show'+(active+1)).checked=true;draw();canvas.scrollIntoView({block:'center'});};
 $('transforms').querySelectorAll('[data-k]').forEach(b=>b.onclick=()=>act(()=>{t.k=+b.dataset.k;renderTransforms();}));
 $('transforms').querySelectorAll('[data-angle]').forEach(b=>b.onclick=()=>act(()=>{t.angle=+b.dataset.angle;renderTransforms();}));
 if($('angleRange')){
   let before=null;
   $('angleRange').oninput=e=>{if(!before)before=snapshot();t.angle=+e.target.value;$('angle').value=t.angle;update();};
   $('angleRange').onchange=()=>{if(before)remember(before);before=null;};
 }
 readouts();toolHint();
}
function readouts(){const t=ts[active];if($('lineReadout'))$('lineReadout').innerHTML='<strong>Persamaan garis cermin</strong>'+lineEquation(t);if($('centerReadout'))$('centerReadout').innerHTML='<strong>Pusat '+(active?'Q':'P')+'</strong>'+pair([t.h,t.v]);}
function syncInputs(){for(const k of ['a','b','c','h','v','k','angle'])if($(k))$(k).value=ts[active][k];readouts();}
function syncTools(){
 for(const [i,id] of [[0,'tool-image0'],[1,'tool-image1']]){
  const button=$(id),available=i<count&&M.moveImage(ts[i],[0,0])!==null;
  button.hidden=i>=count;button.disabled=!available;
  const label=i?'imej kedua I′′':'imej pertama I';
  button.title=available?`Seret ${label}: ${ts[i].type==='translasi'?'vektor':'pusat'} berubah; objek asal dikekalkan.`:ts[i].type==='pantulan'?'Untuk pantulan, seret garis cermin atau pemegang hujung.':'Imej sama dengan objek. Ubah faktor skala atau sudut sebelum menyeret imej.';
  if(!available&&toolMode==='image'+i)toolMode='auto';
 }
 document.querySelectorAll('[data-tool]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.tool===toolMode)));
 if($('moveImage'))$('moveImage').disabled=M.moveImage(ts[active],[0,0])===null;
}
function setTool(value){special=null;toolMode=value;syncTools();toolHint();draw();}
function toolHint(){
 syncTools();
 let text='Seret bucu untuk ubah bentuk; seret isi untuk alih. Jika bertindih, pilih alat khusus.';
 if(special?.kind==='line')text=`Lukis cermin ${special.i?'Q':'P'}: tekan dan seret pada grid. Dua hujung melekat pada 0.5 unit.`;
 else if(special?.kind==='center')text=`Pilih pusat ${special.i?'Q':'P'}: klik grid berkali-kali. Tekan butang pilih pusat semula atau Escape untuk tamat.`;
 else if(toolMode.startsWith('image')){const i=+toolMode.slice(-1),t=ts[i];text=t.type==='pantulan'?'Untuk pantulan, seret garis cermin atau pemegang hujungnya.':`Seret imej ${i?'QP':'P'}. ${t.type==='translasi'?'Vektor':'Pusat'} dilaras secara automatik; objek masukannya kekal.`;}
 else if(toolMode==='pan')text='Tekan dan seret ruang grid untuk mengubah pandangan. Objek kekal di koordinatnya.';
 $('toolHint').textContent=text+' · Ctrl + seret: gerak grid · Ctrl + scroll: zum.';
 if($('drawLine'))$('drawLine').setAttribute('aria-pressed',special?.kind==='line');
 if($('pickCenter'))$('pickCenter').setAttribute('aria-pressed',special?.kind==='center');
 canvas.style.cursor=special?'crosshair':'grab';
}
function showError(msg){valid=false;$('error').hidden=false;$('error').textContent=msg;say('Betulkan nilai untuk meneruskan penerokaan. Paparan mengekalkan keadaan terakhir yang sah.');}
function update(){
 syncTools();
 if([...$('transforms').querySelectorAll('input[type=number]')].some(e=>!e.checkValidity())||ts.slice(0,count).some(t=>t.type==='pembesaran'&&t.k===0)){showError('Betulkan input nombor. Faktor skala tidak boleh sifar.');return;}
 valid=true;$('error').hidden=true;all=M.stages(pts,ts.slice(0,count));
 $('plotTitle').textContent=count===2?'Objek → P → Q':'Objek → P';
 $('order').textContent=count===2?'P dahulu → Q kemudian. Notasi: QP. Maksimum dua transformasi.':'Satu transformasi P. Seret dan lihat perubahan secara langsung.';
 $('status').textContent=ts.slice(0,count).map((t,i)=>(i?'Q: ':'P: ')+describe(t)).join(' · ');
 renderVertices();readouts();
 $('coordHead').innerHTML='<tr><th>Titik</th><th>Objek</th><th>Imej P</th>'+(count===2?'<th>Imej QP</th>':'')+'</tr>';
 $('coordBody').innerHTML=pts.map((_,i)=>`<tr><td>${letter(i)}</td>${all.map((ps,s)=>`<td>${letter(i)+prime(s)} ${pair(ps[i])}</td>`).join('')}</tr>`).join('');
 const ar=all.map(M.area),factor=ts.slice(0,count).reduce((k,t)=>k*(t.type==='pembesaran'?t.k*t.k:1),1);
 $('area').innerHTML=point?'':`<div class="area"><strong>Luas (unit²)</strong> · ${ar.map((a,i)=>`${['Objek','Imej P','Imej QP'][i]} = ${val(a)}`).join(' → ')}<br>Faktor luas keseluruhan = ${val(factor)}.</div>`;
 calculate();draw();historyButtons();
}
function calculate(){
 if(!all.length)return;
 $('calculations').innerHTML=ts.slice(0,count).map((t,i)=>{
  const p=all[i][selected],q=all[i+1][selected],[x,y]=p,from=letter(selected)+prime(i),to=letter(selected)+prime(i+1);let formula='',work='',note='';
  if(t.type==='translasi'){formula='(x, y) → (x + a, y + b)';work=`x′ = ${fmt(x)} + (${fmt(t.a)}) = ${val(q[0])}<br>y′ = ${fmt(y)} + (${fmt(t.b)}) = ${val(q[1])}`;}
  if(t.type==='pantulan'){
   const [a,b,c]=M.lineCoefficients(t),d=(a*x+b*y+c)/(a*a+b*b);
   const dText=ratio(a*x+b*y+c,a*a+b*b);
   formula='d = (Ax + By + C) / (A² + B²)<br>(x, y) → (x − 2Ad, y − 2Bd)';
   work=`Garis ${lineEquation(t)} ditulis sebagai Ax + By + C = 0.<br>A = ${fmt(a)}, B = ${fmt(b)}, C = ${fmt(c)}.<br>d = [(${fmt(a)})(${fmt(x)}) + (${fmt(b)})(${fmt(y)}) + (${fmt(c)})] / [(${fmt(a)})² + (${fmt(b)})²] = ${dText}.<br>x′ = ${fmt(x)} − 2(${fmt(a)})(${dText}) = ${val(q[0])}<br>y′ = ${fmt(y)} − 2(${fmt(b)})(${dText}) = ${val(q[1])}`;
   note='d ialah nilai perantaraan formula, bukan jarak serenjang. Kiraan menggunakan nilai d penuh. Formula umum menyokong garis condong yang dilukis.';
   if(Math.abs(a)<1e-9){formula='(x, y) → (x, 2c − y)';work=`Garis mendatar y = ${fmt(-c/b)}.<br>x′ = ${fmt(x)}<br>y′ = 2(${fmt(-c/b)}) − (${fmt(y)}) = ${val(q[1])}`;note='Koordinat x dikekalkan; jarak serenjang ke garis cermin adalah sama.';}
   else if(Math.abs(b)<1e-9){formula='(x, y) → (2c − x, y)';work=`Garis menegak x = ${fmt(-c/a)}.<br>x′ = 2(${fmt(-c/a)}) − (${fmt(x)}) = ${val(q[0])}<br>y′ = ${fmt(y)}`;note='Koordinat y dikekalkan; jarak serenjang ke garis cermin adalah sama.';}
   else if(Math.abs(c)<1e-9&&Math.abs(a+b)<1e-9){formula='(x, y) → (y, x)';work=`Garis y = x: tukar tempat koordinat.<br>x′ = ${fmt(y)}; y′ = ${fmt(x)}`;note='Titik dan imej berada pada jarak serenjang yang sama dari garis y = x.';}
   else if(Math.abs(c)<1e-9&&Math.abs(a-b)<1e-9){formula='(x, y) → (−y, −x)';work=`Garis y = −x: tukar tempat dan songsangkan tanda.<br>x′ = −(${fmt(y)}) = ${val(q[0])}; y′ = −(${fmt(x)}) = ${val(q[1])}`;note='Titik dan imej berada pada jarak serenjang yang sama dari garis y = −x.';}
  }
  if(t.type==='pembesaran'){
   formula='(x, y) → (h + k(x − h), v + k(y − v))';
   work=`x′ = ${fmt(t.h)} + (${fmt(t.k)})[${fmt(x)} − (${fmt(t.h)})] = ${val(q[0])}<br>y′ = ${fmt(t.v)} + (${fmt(t.k)})[${fmt(y)} − (${fmt(t.v)})] = ${val(q[1])}`;
   note=point?'Jarak dari pusat didarab dengan |k|.':`Luas imej = (${fmt(t.k)})² × ${fmt(M.area(all[i]))} = ${val(M.area(all[i+1]))} unit².`;
   if(t.k<0)note+=' Faktor negatif: imej di arah bertentangan dari pusat.';
  }
  if(t.type==='putaran'){
   const u=x-t.h,w=y-t.v,a=((t.angle%360)+360)%360;
   if([0,90,180,270].includes(a)){
    formula={0:'(u, w) → (u, w)',90:'(u, w) → (−w, u)',180:'(u, w) → (−u, −w)',270:'(u, w) → (w, −u)'}[a];
    work=`Alih pusat ke asalan: u = ${fmt(x)} − (${fmt(t.h)}) = ${val(u)}, w = ${fmt(y)} − (${fmt(t.v)}) = ${val(w)}.<br>Putar: ${pair([q[0]-t.h,q[1]-t.v])}.<br>Tambah semula pusat: (${fmt(q[0]-t.h)} + (${fmt(t.h)}), ${fmt(q[1]-t.v)} + (${fmt(t.v)})) = ${pair(q)}.`;
   }else{
    formula='x′ = h + u cos θ − w sin θ<br>y′ = v + u sin θ + w cos θ';
    work=`u = x − h = ${val(u)}, w = y − v = ${val(w)}, θ = ${fmt(t.angle)}°.<br>x′ = ${fmt(t.h)} + (${fmt(u)}) cos(${fmt(t.angle)}°) − (${fmt(w)}) sin(${fmt(t.angle)}°) = ${val(q[0])}<br>y′ = ${fmt(t.v)} + (${fmt(u)}) sin(${fmt(t.angle)}°) + (${fmt(w)}) cos(${fmt(t.angle)}°) = ${val(q[1])}`;
   }
   note=`Sudut setara ${fmt(a)}° lawan arah jam. Saiz dan jarak setiap titik dari pusat dikekalkan.`;
  }
  return `<article class="calc"><h3>${i+1} · ${describe(t)}</h3><p class="formula">${formula}</p><p>${work}</p><p><strong>${from} ${pair(p)} → ${to} ${pair(q)}</strong></p>${note?`<p>${note}</p>`:''}</article>`;
 }).join('').replaceAll('= ≈ ','≈ ');
}
function screen(p){return [canvas.clientWidth/2+(p[0]-camera.cx)*camera.scale,canvas.clientHeight/2-(p[1]-camera.cy)*camera.scale];}
function world(e){const r=canvas.getBoundingClientRect();return [camera.cx+(e.clientX-r.left-canvas.clientWidth/2)/camera.scale,camera.cy-(e.clientY-r.top-canvas.clientHeight/2)/camera.scale];}
function fit(){
 const ps=all.flat().concat([[0,0]]);
 ts.slice(0,count).forEach(t=>{if(['pembesaran','putaran'].includes(t.type))ps.push([t.h,t.v]);if(t.type==='pantulan')ps.push(...lineHandles(t));});
 const minX=Math.min(...ps.map(p=>p[0])),maxX=Math.max(...ps.map(p=>p[0])),minY=Math.min(...ps.map(p=>p[1])),maxY=Math.max(...ps.map(p=>p[1]));
 camera={cx:(minX+maxX)/2,cy:(minY+maxY)/2,scale:Math.max(.05,Math.min(100,(canvas.clientWidth-100)/Math.max(12,maxX-minX+3),(canvas.clientHeight-100)/Math.max(12,maxY-minY+3)))};draw();
}
function lineHandles(t){
 if(t.line==='free')return [t.p1,t.p2];
 if(t.line==='x')return [[t.c,-4],[t.c,4]];
 if(t.line==='y')return [[-4,t.c],[4,t.c]];
 return t.line==='diag'?[[-3,-3],[3,3]]:[[-3,3],[3,-3]];
}
function interiorLabel(ps){
 if(ps.length===1)return ps[0];
 let area2=0,cx=0,cy=0;
 ps.forEach((p,i)=>{const q=ps[(i+1)%ps.length],cross=p[0]*q[1]-q[0]*p[1];area2+=cross;cx+=(p[0]+q[0])*cross;cy+=(p[1]+q[1])*cross;});
 const centroid=[cx/(3*area2),cy/(3*area2)];
 if(Number.isFinite(centroid[0])&&contains(centroid,ps))return centroid;
 const minX=Math.min(...ps.map(p=>p[0])),maxX=Math.max(...ps.map(p=>p[0])),minY=Math.min(...ps.map(p=>p[1])),maxY=Math.max(...ps.map(p=>p[1]));
 let best=ps[0],distance=-1;
 for(let ix=1;ix<16;ix++)for(let iy=1;iy<16;iy++){
  const p=[minX+(maxX-minX)*ix/16,minY+(maxY-minY)*iy/16];if(!contains(p,ps))continue;
  let edgeDistance=Infinity;
  ps.forEach((a,i)=>{const b=ps[(i+1)%ps.length],dx=b[0]-a[0],dy=b[1]-a[1],t=Math.max(0,Math.min(1,((p[0]-a[0])*dx+(p[1]-a[1])*dy)/(dx*dx+dy*dy)));edgeDistance=Math.min(edgeDistance,Math.hypot(p[0]-a[0]-t*dx,p[1]-a[1]-t*dy));});
  if(edgeDistance>distance){distance=edgeDistance;best=p;}
 }
 return best;
}
function draw(){
 const width=canvas.clientWidth,height=canvas.clientHeight,dpr=window.devicePixelRatio||1;
 if(!width||!height)return;
 canvas.width=width*dpr;canvas.height=height*dpr;ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,width,height);
 if(!initialized){camera.scale=Math.min((width-65)/22,(height-65)/17);initialized=true;}
 const {cx,cy,scale}=camera,X=x=>width/2+(x-cx)*scale,Y=y=>height/2-(y-cy)*scale;
 const left=cx-width/2/scale,right=cx+width/2/scale,bottom=cy-height/2/scale,top=cy+height/2/scale;
 const line=(a,b,c,d,col='#dfe7e1',dash=[],lw=1)=>{ctx.beginPath();ctx.strokeStyle=col;ctx.lineWidth=lw;ctx.setLineDash(dash);ctx.moveTo(a,b);ctx.lineTo(c,d);ctx.stroke();ctx.setLineDash([]);};
 let unit=1;while(unit*scale<15)unit*=2;
 if(scale>=16){for(let x=Math.ceil(left*2)/2;x<=right;x+=.5)if(Math.abs(x-Math.round(x))>.1)line(X(x),0,X(x),height,'#edf1ec');for(let y=Math.ceil(bottom*2)/2;y<=top;y+=.5)if(Math.abs(y-Math.round(y))>.1)line(0,Y(y),width,Y(y),'#edf1ec');}
 for(let x=Math.ceil(left/unit)*unit;x<=right;x+=unit)line(X(x),0,X(x),height);
 for(let y=Math.ceil(bottom/unit)*unit;y<=top;y+=unit)line(0,Y(y),width,Y(y));
 line(X(0),0,X(0),height,'#799587',[],1.3);line(0,Y(0),width,Y(0),'#799587',[],1.3);
 const tick=unit*Math.max(1,Math.ceil(40/(unit*scale)));ctx.fillStyle='#567064';ctx.font='11px Segoe UI';ctx.textAlign='center';
 for(let x=Math.ceil(left/tick)*tick;x<right;x+=tick)if(X(x)>16&&X(x)<width-16)ctx.fillText(fmt(x),X(x),Math.max(16,Math.min(height-8,Y(0)+15)));
 ctx.textAlign='left';for(let y=Math.ceil(bottom/tick)*tick;y<top;y+=tick)if(y&&Y(y)>15&&Y(y)<height-15)ctx.fillText(fmt(y),Math.max(5,Math.min(width-35,X(0)+5)),Y(y)+4);
 ctx.fillText('x',width-13,Math.max(15,Math.min(height-9,Y(0)-7)));ctx.fillText('y',Math.max(6,Math.min(width-15,X(0)+7)),14);
 // Connector guides are behind shapes. Mirror lines and centres stay above them.
 if($('guides').checked)ts.slice(0,count).forEach((t,i)=>{if(!$('show'+(i+1)).checked||!all[i+1])return;all[i]?.forEach((p,j)=>{const q=all[i+1][j];line(X(p[0]),Y(p[1]),X(q[0]),Y(q[1]),colours[i+1]+'44',[3,5]);if(t.type==='pembesaran')line(X(t.h),Y(t.v),X(q[0]),Y(q[1]),colours[i+1]+'44',[3,5]);});});
 all.forEach((ps,s)=>{
  if(!$('show'+s).checked)return;
  const col=colours[s];ctx.strokeStyle=col;ctx.lineWidth=2;ctx.setLineDash(s===1?[7,4]:s===2?[2,3]:[]);
  if(ps.length>1){ctx.beginPath();ps.forEach((p,i)=>i?ctx.lineTo(X(p[0]),Y(p[1])):ctx.moveTo(X(p[0]),Y(p[1])));ctx.closePath();ctx.fillStyle=col+'1b';ctx.fill();ctx.stroke();}ctx.setLineDash([]);
  ps.forEach((p,i)=>{
   const x=X(p[0]),y=Y(p[1]);ctx.fillStyle=col;ctx.beginPath();
   if(s===0)ctx.arc(x,y,6,0,2*Math.PI);else if(s===1){ctx.moveTo(x,y-6);ctx.lineTo(x+6,y);ctx.lineTo(x,y+6);ctx.lineTo(x-6,y);ctx.closePath();}else ctx.rect(x-5,y-5,10,10);ctx.fill();
   if(s===0&&i===selected){ctx.beginPath();ctx.strokeStyle=col+'77';ctx.lineWidth=2;ctx.arc(x,y,10,0,2*Math.PI);ctx.stroke();}
   ctx.font='600 12px Segoe UI';const label=letter(i)+prime(s),tx=Math.max(5,Math.min(width-ctx.measureText(label).width-5,x+9)),ty=Math.max(14,Math.min(height-5,y+(s===0?-10:s===1?17:31)));ctx.lineWidth=3;ctx.strokeStyle='#fcfcff';ctx.strokeText(label,tx,ty);ctx.fillStyle=col;ctx.fillText(label,tx,ty);
  });
 });
 // O is the object; I and I′′ are the successive images.
 all.forEach((ps,s)=>{
  if(!$('show'+s).checked)return;
  let p=interiorLabel(ps);
  const shift=(s-1)*16/camera.scale,candidate=[p[0]+shift,p[1]];
  if(ps.length>1&&contains(candidate,ps))p=candidate;
  const [lx,ly]=screen(p),label=['O','I','I′′'][s];
  ctx.save();ctx.font='800 18px Inter, Segoe UI, sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';
  ctx.lineWidth=5;ctx.strokeStyle='#ffffffea';ctx.strokeText(label,lx,ly+(ps.length===1?25:0));ctx.fillStyle=colours[s];ctx.fillText(label,lx,ly+(ps.length===1?25:0));ctx.restore();
 });
 if($('guides').checked||special)ts.slice(0,count).forEach((t,i)=>{
  const col=colours[i+1],isActive=i===active;
  if(t.type==='pantulan'){
   const [a,b,c]=M.lineCoefficients(t);if(Math.abs(b)<1e-9)line(X(-c/a),0,X(-c/a),height,col,[8,5],isActive?2:1);
   else line(0,Y((-a*left-c)/b),width,Y((-a*right-c)/b),col,[8,5],isActive?2:1);
   if(isActive)lineHandles(t).forEach((p,j)=>{handle(p,col,j?'L₂':'L₁');});
  }
  if(['pembesaran','putaran'].includes(t.type))handle([t.h,t.v],col,'Pusat '+(i?'Q':'P'),true);
 });
 if(gesture?.kind==='lineNew'){
  const p=screen(gesture.start),q=screen(gesture.end);line(...p,...q,colours[gesture.i+1],[5,4],2);handle(gesture.start,colours[gesture.i+1],'L₁');handle(gesture.end,colours[gesture.i+1],'L₂');
 }
 function handle(p,col,label,centre=false){const [x,y]=screen(p);ctx.fillStyle='#fff';ctx.strokeStyle=col;ctx.lineWidth=2;ctx.beginPath();ctx.arc(x,y,centre?8:7,0,Math.PI*2);ctx.fill();ctx.stroke();if(centre){line(x-4,y,x+4,y,col);line(x,y-4,x,y+4,col);}ctx.font='600 11px Segoe UI';ctx.fillStyle=col;ctx.fillText(label,Math.max(5,Math.min(width-70,x+12)),Math.max(15,Math.min(height-6,y-10)));}
 if(hover){const p=screen(hover);ctx.beginPath();ctx.arc(p[0],p[1],4,0,2*Math.PI);ctx.fillStyle='#1c4837aa';ctx.fill();}
 $('gridInfo').textContent=`Garis utama: ${unit} unit · Magnet: 0.5 unit${scale>=16?' · Garis halus: 0.5 unit':''}`;
}
function pixelDistance(p,q){return Math.hypot(p[0]-q[0],p[1]-q[1])*camera.scale;}
function contains(p,ps){
 if(ps.length===1)return pixelDistance(p,ps[0])<20;
 let inside=false;for(let i=0,j=ps.length-1;i<ps.length;j=i++){
  const a=ps[i],b=ps[j];if((a[1]>p[1])!==(b[1]>p[1])&&p[0]<(b[0]-a[0])*(p[1]-a[1])/(b[1]-a[1])+a[0])inside=!inside;
 }return inside;
}
function hit(p){
 const tool=toolMode;if(tool==='pan')return {kind:'pan'};
 if($('guides').checked&&tool==='auto'){
  for(const i of [active,...[0,1].filter(j=>j!==active&&j<count)]){
   const t=ts[i];if(['pembesaran','putaran'].includes(t.type)&&pixelDistance(p,[t.h,t.v])<14)return {kind:'center',i};
   if(t.type==='pantulan'&&i===active){const handles=lineHandles(t);const j=handles.findIndex(q=>pixelDistance(p,q)<14);if(j>=0)return {kind:'lineEnd',i,j};}
  }
 }
 if(tool==='auto'){
  if($('show0').checked){const j=pts.findIndex(q=>pixelDistance(p,q)<15);if(j>=0)return {kind:'vertex',j};}
 }
 if(tool.startsWith('image')){const i=+tool.slice(-1);return $('show'+(i+1)).checked&&contains(p,all[i+1])?{kind:'image',i}:null;}
 if(tool==='auto')for(let i=count;i>=1;i--)if($('show'+i).checked&&contains(p,all[i]))return {kind:'image',i:i-1};
 if(tool==='auto'&&$('show0').checked&&contains(p,pts))return {kind:'object'};
 if($('guides').checked&&ts[active].type==='pantulan'){
  const [a,b,c]=M.lineCoefficients(ts[active]);if(Math.abs(a*p[0]+b*p[1]+c)/Math.hypot(a,b)*camera.scale<9)return {kind:'lineBody',i:active};
 }
 return null;
}
function showCursor(p){hover=p.map(M.snap);$('cursorNote').hidden=false;$('cursorNote').textContent=pair(hover);}
function start(e){
 if(e.button!==0||gesture)return;
 const p=world(e),sn=p.map(M.snap),before=snapshot();
 if(e.ctrlKey){
  gesture={kind:'pan',start:p,camera:copy(camera),before};
  canvas.setPointerCapture(e.pointerId);e.preventDefault();canvas.style.cursor='grabbing';return;
 }
 if(!valid){say('Betulkan input nombor dahulu.');return;}
 if(special?.kind==='center'){
  const i=special.i;ts[i].h=sn[0];ts[i].v=sn[1];syncInputs();update();remember(before);toolHint();e.preventDefault();say(`Pusat ${i?'Q':'P'} → ${pair(sn)}. Mod masih aktif; klik lagi atau tekan butang pilih pusat untuk tamat.`);return;
 }
 if(special?.kind==='line')gesture={kind:'lineNew',i:special.i,start:sn,end:sn,before};
 else{
  const target=hit(p);if(!target)return;
  if(target.kind==='image'){
   const t=ts[target.i];if(!M.moveImage(t,[0,0])){say(t.type==='pantulan'?'Alih garis cermin atau tarik pemegangnya untuk mengubah imej pantulan.':'Imej ini sama dengan objek: ubah faktor skala atau sudut, atau seret objek asal.');return;}
  }
  if(['lineEnd','lineBody'].includes(target.kind)){
   const t=ts[target.i],hs=lineHandles(t);t.line='free';t.p1=copy(hs[0]);t.p2=copy(hs[1]);
  }
  if(target.kind==='vertex'){selected=target.j;$('selectedVertex').value=selected;}
  gesture={...target,start:p,snapStart:sn,before,base: snapshot(),camera:copy(camera)};
 }
 canvas.setPointerCapture(e.pointerId);e.preventDefault();showCursor(p);draw();
}
function move(e){
 const p=world(e);showCursor(p);
 if(!gesture){const target=hit(p);canvas.style.cursor=special?'crosshair':target?.kind==='vertex'?'pointer':target?'grab':'crosshair';draw();return;}
 const g=gesture,delta=[M.snap(p[0]-g.start[0]),M.snap(p[1]-g.start[1])];
 if(g.kind==='pan'){
  const r=canvas.getBoundingClientRect(),sx=e.clientX-r.left,sy=e.clientY-r.top;
  camera.cx=g.camera.cx-(sx-(canvas.clientWidth/2+(g.start[0]-g.camera.cx)*g.camera.scale))/g.camera.scale;
  camera.cy=g.camera.cy+(sy-(canvas.clientHeight/2-(g.start[1]-g.camera.cy)*g.camera.scale))/g.camera.scale;draw();return;
 }
 if(g.kind==='lineNew'){g.end=p.map(M.snap);if(pixelDistance(g.start,g.end)>1){const t=ts[g.i];t.line='free';t.p1=copy(g.start);t.p2=copy(g.end);update();}return;}
 if(g.kind==='vertex'){
  const candidate=copy(g.base.pts);candidate[g.j]=p.map(M.snap);
  if(!point&&!M.polygonValid(candidate)){say('Kedudukan itu menyebabkan poligon bersilang atau tiada luas. Cuba simpang lain.');return;}
  pts=candidate;say(`${letter(g.j)} → ${pair(pts[g.j])} · Magnet 0.5 unit`);
 }
 if(g.kind==='object'){pts=g.base.pts.map(q=>[q[0]+delta[0],q[1]+delta[1]]);say('Seluruh objek dialih '+pair(delta)+' unit.');}
 if(g.kind==='image'){
  Object.assign(ts[g.i],M.moveImage(g.base.ts[g.i],delta));syncInputs();say(`Imej ${g.i?'QP':'P'} dialih ${pair(delta)} unit. ${ts[g.i].type==='translasi'?'Vektor':'Pusat'} dikira semula.`);
 }
 if(g.kind==='center'){ts[g.i].h=M.snap(p[0]);ts[g.i].v=M.snap(p[1]);syncInputs();say(`Pusat ${g.i?'Q':'P'} → ${pair([ts[g.i].h,ts[g.i].v])}`);}
 if(g.kind==='lineEnd'){
  const t=ts[g.i],q=p.map(M.snap),other=g.j?t.p1:t.p2;if(pixelDistance(q,other)<1)return;t[g.j?'p2':'p1']=q;readouts();
 }
 if(g.kind==='lineBody'){
  const t=ts[g.i],base=g.base.ts[g.i];t.p1=base.p1.map((n,j)=>n+delta[j]);t.p2=base.p2.map((n,j)=>n+delta[j]);readouts();
 }
 update();
}
function finish(e){
 if(!gesture)return;const g=gesture;gesture=null;
 if(canvas.hasPointerCapture(e.pointerId))canvas.releasePointerCapture(e.pointerId);
 if(g.kind==='lineNew'){
  if(pixelDistance(g.start,g.end)<2){restore(g.before);special={kind:'line',i:g.i};toolHint();say('Tarik antara dua simpang berbeza untuk melukis satu garis.');return;}
  special=null;active=g.i;renderTransforms();say('Garis pantulan: '+lineEquation(ts[g.i])+'. Tarik pemegang untuk mengubahnya.');
 }
 if(['lineEnd','lineBody'].includes(g.kind))renderTransforms();
 update();if(g.kind!=='pan')remember(g.before);toolHint();
}
function cancel(){
 if(gesture){const g=gesture;gesture=null;camera=g.camera||camera;restore(g.before);}
 special=null;hover=null;$('cursorNote').hidden=true;toolHint();draw();say('Tindakan dibatalkan.');
}
function arrow(key){return {ArrowLeft:[-.5,0],ArrowRight:[.5,0],ArrowUp:[0,.5],ArrowDown:[0,-.5]}[key];}
function nudge(delta,vertex=false){
 const candidate=pts.map((p,i)=>(!vertex||i===selected)?p.map((v,j)=>v+delta[j]):copy(p));
 if(!point&&!M.polygonValid(candidate)){say('Bucu tidak dialih: poligon mesti tidak bersilang dan mempunyai luas.');return;}
 act(()=>{pts=candidate;});say(vertex?`Bucu ${letter(selected)} → ${pair(pts[selected])}`:'Objek dialih '+pair(delta)+' unit.');
}
function setMode(isPoint){act(()=>{point=isPoint;shapeKey=$('shape').value;pts=point?[[2,3]]:copy(shapes[shapeKey]);selected=0;syncMode();});}
function setCount(n){act(()=>{count=n;active=0;syncMode();renderTransforms();setTool('auto');});}
$('pointMode').onclick=()=>setMode(true);$('polygonMode').onclick=()=>setMode(false);$('shape').onchange=()=>setMode(false);
$('singleTab').onclick=()=>setCount(1);$('comboTab').onclick=()=>setCount(2);
for(const id of ['singleTab','comboTab'])$(id).onkeydown=e=>{if(['ArrowLeft','ArrowRight','Home','End'].includes(e.key)){e.preventDefault();const n=e.key==='ArrowLeft'||e.key==='Home'?1:2;setCount(n);$(n===1?'singleTab':'comboTab').focus();}};
$('pTab').onclick=()=>{special=null;active=0;syncMode();renderTransforms();draw();};$('qTab').onclick=()=>{special=null;active=1;syncMode();renderTransforms();draw();};
$('swap').onclick=()=>act(()=>{ts.reverse();renderTransforms();});
$('selectedVertex').onchange=e=>{selected=+e.target.value;renderVertices();calculate();draw();};
document.querySelectorAll('[data-tool]').forEach(button=>button.onclick=()=>setTool(button.dataset.tool));
for(const id of ['show0','show1','show2','guides'])$(id).onchange=draw;
$('undo').onclick=undo;$('redo').onclick=redo;
$('zoomIn').onclick=()=>{camera.scale=Math.min(180,camera.scale*1.25);draw();};$('zoomOut').onclick=()=>{camera.scale=Math.max(.05,camera.scale/1.25);draw();};$('fit').onclick=fit;
for(const [id,d] of Object.entries({left:[-.5,0],right:[.5,0],up:[0,.5],down:[0,-.5]}))$(id).onclick=()=>nudge(d);
$('reset').onclick=()=>act(()=>{ts=defaults();count=1;active=0;selected=0;point=false;pts=copy(shapes.triangle);shapeKey='triangle';$('shape').value=shapeKey;['show0','show1','show2','guides'].forEach(id=>$(id).checked=true);syncMode();renderTransforms();setTool('auto');initialized=false;});
canvas.addEventListener('wheel',e=>{
 if(!e.ctrlKey)return;
 e.preventDefault();
 if(gesture)return;
 const anchor=world(e),r=canvas.getBoundingClientRect(),sx=e.clientX-r.left,sy=e.clientY-r.top;
 const delta=e.deltaY*(e.deltaMode===1?16:e.deltaMode===2?canvas.clientHeight:1);
 camera.scale=Math.max(.05,Math.min(180,camera.scale*Math.exp(-Math.max(-300,Math.min(300,delta))*.002)));
 camera.cx=anchor[0]-(sx-canvas.clientWidth/2)/camera.scale;
 camera.cy=anchor[1]+(sy-canvas.clientHeight/2)/camera.scale;
 draw();
},{passive:false});
canvas.addEventListener('pointerdown',start);canvas.addEventListener('pointermove',move);canvas.addEventListener('pointerup',finish);canvas.addEventListener('pointercancel',cancel);
canvas.addEventListener('pointerleave',()=>{if(!gesture){hover=null;$('cursorNote').hidden=true;draw();}});
canvas.addEventListener('keydown',e=>{const d=arrow(e.key);if(d){e.preventDefault();nudge(d,true);}});
document.addEventListener('keydown',e=>{if(e.key==='Escape')cancel();if(['INPUT','SELECT','TEXTAREA'].includes(e.target.tagName))return;if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='z'){e.preventDefault();e.shiftKey?redo():undo();}});
new ResizeObserver(draw).observe(canvas);syncMode();renderTransforms();update();historyButtons();
})();

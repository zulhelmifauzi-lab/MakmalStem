/* Enjin koordinat tanpa kebergantungan. Sudut positif: lawan arah jam. */
(function (root) {
  const clean = n => Math.abs(n) < 1e-10 ? 0 : n;
  const snap = n => clean(Math.round(n * 2) / 2);
  function lineCoefficients(t) {
    if(t.line==='x') return [1,0,-t.c];
    if(t.line==='y') return [0,1,-t.c];
    if(t.line==='diag') return [1,-1,0];
    if(t.line==='negdiag') return [1,1,0];
    const [x,y]=t.p1, [u,v]=t.p2;
    if(Math.hypot(u-x,v-y)<1e-9) throw new Error('Dua titik garis mesti berbeza.');
    return [v-y,x-u,u*y-x*v];
  }
  function transform(p, t) {
    const [x,y] = p, h=t.h||0, v=t.v||0;
    let q;
    if(t.type==='translasi') q=[x+t.a,y+t.b];
    else if(t.type==='pantulan') {
      const [a,b,c]=lineCoefficients(t), d=(a*x+b*y+c)/(a*a+b*b);
      q=[x-2*a*d,y-2*b*d];
    } else if(t.type==='pembesaran') q=[h+t.k*(x-h),v+t.k*(y-v)];
    else if(t.type==='putaran') {
      const r=t.angle*Math.PI/180, u=x-h,w=y-v;
      q=[h+u*Math.cos(r)-w*Math.sin(r),v+u*Math.sin(r)+w*Math.cos(r)];
    } else throw new Error('Transformasi tidak dikenali');
    return q.map(clean);
  }
  const area = pts => pts.length<3 ? 0 : Math.abs(pts.reduce((s,p,i)=>{const q=pts[(i+1)%pts.length];return s+p[0]*q[1]-q[0]*p[1];},0))/2;
  const stages=(pts,ts)=>ts.reduce((out,t)=>[...out,out[out.length-1].map(p=>transform(p,t))],[pts]);
  // Translate an image while keeping its input object and scale/angle fixed.
  function moveImage(t, delta) {
    const out=JSON.parse(JSON.stringify(t)), [dx,dy]=delta;
    if(t.type==='translasi') { out.a+=dx;out.b+=dy; }
    else if(t.type==='pembesaran') {
      if(Math.abs(1-t.k)<1e-8) return null;
      out.h+=dx/(1-t.k);out.v+=dy/(1-t.k);
    } else if(t.type==='putaran') {
      const r=t.angle*Math.PI/180, a=1-Math.cos(r), s=Math.sin(r), det=a*a+s*s;
      if(det<1e-8) return null;
      out.h+=(a*dx-s*dy)/det;out.v+=(s*dx+a*dy)/det;
    } else return null;
    return out;
  }
  function polygonValid(p) {
    if(p.length<3||area(p)<1e-8) return false;
    const cross=(a,b,c)=>(b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]);
    const on=(a,b,c)=>Math.abs(cross(a,b,c))<1e-9&&c[0]>=Math.min(a[0],b[0])-1e-9&&c[0]<=Math.max(a[0],b[0])+1e-9&&c[1]>=Math.min(a[1],b[1])-1e-9&&c[1]<=Math.max(a[1],b[1])+1e-9;
    for(let i=0;i<p.length;i++){
      const a=p[i],b=p[(i+1)%p.length];
      if(Math.hypot(a[0]-b[0],a[1]-b[1])<1e-8)return false;
      for(let j=i+1;j<p.length;j++){
        if(j===i+1||(i===0&&j===p.length-1))continue;
        const c=p[j],d=p[(j+1)%p.length];
        if((cross(a,b,c)*cross(a,b,d)<0&&cross(c,d,a)*cross(c,d,b)<0)||on(a,b,c)||on(a,b,d)||on(c,d,a)||on(c,d,b))return false;
      }
    } return true;
  }
  const api={transform,area,stages,snap,lineCoefficients,moveImage,polygonValid};
  if(typeof module!=='undefined'&&module.exports) module.exports=api;
  else root.TransformMath=api;
})(typeof window!=='undefined'?window:globalThis);

const reflectionArt = '<path d="M42 115h196M140 23v92" stroke-dasharray="4 3"/><path d="M67 38l73 77 73-77" stroke-linecap="round"/><path d="M119 93a30 30 0 0 1 21-9 30 30 0 0 1 21 9" opacity=".45"/>';

const parabolaArt = '<path d="M20 110h240M140 10v135" opacity=".3" stroke-width="1"/><path d="M65 15Q140 215 215 15"/>';

const opticsDemo = {
  id:'pantulan-cahaya',
  title:'Pantulan Cahaya dan Cermin Satah',
  subject:'Fizik',
  level:5,
  desc:'Uji hubungan antara sudut tuju dengan sudut pantulan pada cermin satah.',
  objective:'Ubah sudut tuju, ukur sudut pantulan dan tentukan hubungan antara kedua-duanya.',
  notes:'Kedua-dua sudut diukur dari garis normal, iaitu garis serenjang dengan permukaan cermin. Pada cermin satah, sudut tuju sama dengan sudut pantulan.',
  visualTitle:'Meja optik',
  mode:'optics',
  controls:[
    {id:'angle',type:'range',label:'Sudut tuju',unit:'°',min:0,max:80,step:1,value:30,presets:[15,30,45,60,75]},
    {id:'normal',type:'toggle',label:'Garis normal',value:true},
    {id:'labels',type:'toggle',label:'Label sinar',value:true}
  ],
  resetLabel:'Set semula',
  recordLabel:'Catat ke jadual',
  videos:[
    {id:'hUpy0LpMnE8',title:'Pantulan Cahaya — Cikgu Teo'},
    {id:'QB_p3uDg3XI',title:'Pantulan Cahaya — Cikgoo Nor Muttlib'}
  ],
  html:''
};

if (typeof module !== 'undefined' && module.exports) module.exports = opticsDemo;

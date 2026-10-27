'use strict';
const data = window.ENS_HDR_DATA;
const $ = selector => document.querySelector(selector);
const canvas = $('#canvas');
const ctx = canvas.getContext('2d');
const stage = $('#map');
const categoryGroups = [
  ['Sacred sites & travel', ['Ancient_Spire','Flame_Shrine','Ancient_Vault','Sun_Temple','teleport','boss']],
  ['Places & enemies', ['Village','Camp','Mine','Enemy_Camp','Shroud_Lair','Hollow_Halls','spawn-scavenger','spawn-vukah','spawn-drak','spawn-hollow']],
  ['Chests & containers', ['gold-chest','silver-chest','wood-chest','shell-chest','locked-gold-chest','locked-silver-chest','locked-wood-chest','gold-sarcophagus','silver-sarcophagus','wood-sarcophagus','mining-container']],
  ['Ores & materials', ['ore_iron','ore_copper','ore_tin','ore_gold','ore_silver','ore_coal','ore_sulfur','ore_amber','ore_salt','ore_clay','ore_celestium']],
  ['Traversal', ['grapple-point','jump-pad','updraft']]
];
const curatedIds=innerWidth<800?['Ancient_Spire','Ancient_Vault','Sun_Temple','Mine']:['Ancient_Spire','Flame_Shrine','Ancient_Vault','Village','Mine'];
const presets = [
  {label:'Discover',icon:'✧',note:'A curated path through Embervale',ids:curatedIds},
  {label:'High tier chests',icon:'◆',note:'Gold & locked gold chest locations',ids:['gold-chest','locked-gold-chest'],tier:'gold'},
  {label:'High tier loot',icon:'▦',note:'Gold & silver sarcophagus sites',ids:['gold-sarcophagus','silver-sarcophagus'],tier:'gold'},
  {label:'Chests',icon:'▣',note:'Wood, silver, gold & locked',ids:categoryGroups[2][1].filter(id=>id.includes('chest'))},
  {label:'Loot sites',icon:'◈',note:'Sarcophagi & ancient containers',ids:categoryGroups[2][1].filter(id=>!id.includes('chest'))},
  {label:'Enemies',icon:'⚔',note:'Bosses, camps & creature spawns',ids:['boss','Enemy_Camp','spawn-scavenger','spawn-vukah','spawn-drak','spawn-hollow']},
  {label:'Halls & lairs',icon:'⌂',note:'Hidden places to explore',ids:['Hollow_Halls','Shroud_Lair','Ancient_Vault']},
  {label:'Mining',icon:'⚒',note:'Ore, clay, salt & coal',ids:['Mine',...categoryGroups[3][1]]},
  {label:'Landmarks',icon:'✦',note:'Shrines, spires & settlements',ids:['Ancient_Spire','Flame_Shrine','Ancient_Vault','Sun_Temple','teleport','Village','Camp']}
];
const recommendedIds=curatedIds;
const view = {active:new Set(recommendedIds),zoom:1,x:0,y:0,width:0,height:0,dpr:1,hits:[],query:'',selected:null,drag:null,moved:false,frame:0,animation:0,openGroups:new Set([categoryGroups[0][0]])};
const layerById = new Map((data?.layers || []).map(layer => [layer.id,layer]));
const displayName = marker => marker.name && marker.name !== marker.layer.id ? marker.name : marker.layer.name.replace(/s$/,'');
const plainDetail = detail => (detail || '').replace(/\[\[([^\]|]+\|)?([^\]]+)\]\]/g,'$2').replace(/\s+/g,' ').trim();
function fallbackDetail(layer){
  if(/^(?:locked-)?gold-chest$|^gold-sarcophagus$/.test(layer.id))return 'Gold-tier container location. The source map does not identify its exact contents or guarantee a drop.';
  if(layer.id==='silver-sarcophagus')return 'Silver sarcophagus location. The source map does not identify its exact contents or guarantee a drop.';
  return /chest|sarcophag|container/i.test(layer.id)?'The source data locates this container, but does not identify its exact contents.':'This location has no additional description in the source data.';
}
const matching = (marker,layer,query) => `${marker.name} ${layer.name} ${plainDetail(marker.detail)}`.toLowerCase().includes(query);

function sizeCanvas(){view.width=stage.clientWidth;view.height=stage.clientHeight;view.dpr=Math.min(devicePixelRatio||1,innerWidth<800?1.5:2);canvas.width=Math.round(view.width*view.dpr);canvas.height=Math.round(view.height*view.dpr);ctx.setTransform(view.dpr,0,0,view.dpr,0,0);draw();}
function scheduleDraw(){if(view.frame)return;view.frame=requestAnimationFrame(()=>{view.frame=0;draw();});}
function minimumZoom(){return Math.min(view.width/data.map.width,view.height/data.map.height)*.96;}
function constrainCamera(){view.zoom=Math.max(minimumZoom(),view.zoom);const edge=48;const width=data.map.width*view.zoom,height=data.map.height*view.zoom;const horizontal=width<=view.width?(view.width-width)/2:null;const vertical=height<=view.height?(view.height-height)/2:null;view.x=horizontal??Math.max(view.width-width-edge,Math.min(edge,view.x));view.y=vertical??Math.max(view.height-height-edge,Math.min(edge,view.y));}
function fit(){if(!data)return;const zoom=minimumZoom();animateTo(zoom,(view.width-data.map.width*zoom)/2,(view.height-data.map.height*zoom)/2);hidePopup();}
function initialView(){const fitZoom=minimumZoom();const zoom=Math.max(fitZoom*1.45,view.width<700?.62:.58);view.zoom=zoom;view.x=view.width/2-1120*zoom;view.y=view.height/2-890*zoom;draw();}
function zoomAt(factor,sx=view.width/2,sy=view.height/2){const next=Math.max(minimumZoom(),Math.min(5,view.zoom*factor));const ratio=next/view.zoom;animateTo(next,sx-(sx-view.x)*ratio,sy-(sy-view.y)*ratio);}
function animateTo(zoom,x,y){cancelAnimationFrame(view.animation);const start={zoom:view.zoom,x:view.x,y:view.y};const begun=performance.now();const duration=window.matchMedia('(prefers-reduced-motion: reduce)').matches?0:260;function tick(now){const t=duration?Math.min(1,(now-begun)/duration):1;const ease=1-(1-t)**3;view.zoom=start.zoom+(zoom-start.zoom)*ease;view.x=start.x+(x-start.x)*ease;view.y=start.y+(y-start.y)*ease;draw();if(t<1)view.animation=requestAnimationFrame(tick);}view.animation=requestAnimationFrame(tick);}
function focusMarker(layer,marker,zoom=Math.max(view.zoom,1.25)){const x=view.width/2-marker.x*zoom;const y=view.height/2-marker.y*zoom;animateTo(zoom,x,y);view.selected={layer,marker};view.cluster=null;renderPopup();closeMobile();}
function visibleMarkers(){const items=[];const q=view.query.trim().toLowerCase();for(const layer of data.layers){if(!view.active.has(layer.id))continue;for(const marker of layer.markers){if(q&&!matching(marker,layer,q))continue;const sx=view.x+marker.x*view.zoom,sy=view.y+marker.y*view.zoom;if(sx < -65||sx > view.width+65||sy < -65||sy > view.height+65)continue;items.push({layer,marker,sx,sy});}}return items;}
function drawSymbol(hit){
  const {sx,sy,items}=hit;
  const cluster=items.length>1;
  let layer=items[0].layer;
  if(cluster){const totals=new Map();for(const item of items)totals.set(item.layer,(totals.get(item.layer)||0)+1);for(const [candidate,count] of totals)if(count>(totals.get(layer)||0))layer=candidate;}
  const selected=view.selected?.marker===items[0].marker;
  const highTier=!cluster&&/^(?:locked-)?gold-chest$|^(?:gold|silver)-sarcophagus$/.test(layer.id);
  ctx.save();
  ctx.translate(sx,sy);
  ctx.shadowColor=selected?'#ffe2a2bb':highTier?'#f7c36ba8':'#07100ddd';ctx.shadowBlur=selected?17:highTier?13:8;ctx.shadowOffsetY=2;
  ctx.beginPath();
  if(cluster){ctx.arc(0,0,15,0,Math.PI*2);ctx.fillStyle='#1c2c26';ctx.strokeStyle=layer.color||'#e5bd75';ctx.lineWidth=2;}
  else if(layer.id.startsWith('ore_')||layer.id==='Mine'){for(let i=0;i<6;i++){const angle=Math.PI/3*i-Math.PI/6;i?ctx.lineTo(Math.cos(angle)*11,Math.sin(angle)*11):ctx.moveTo(Math.cos(angle)*11,Math.sin(angle)*11);}ctx.closePath();ctx.fillStyle=layer.color;ctx.strokeStyle='#26302a';ctx.lineWidth=1.5;}
  else if(/chest|sarcophag|container/i.test(layer.id)){ctx.rect(-10,-10,20,20);ctx.fillStyle=layer.color;ctx.strokeStyle='#26302a';ctx.lineWidth=1.5;}
  else{ctx.moveTo(0,-13);ctx.lineTo(12,0);ctx.lineTo(0,13);ctx.lineTo(-12,0);ctx.closePath();ctx.fillStyle=layer.color;ctx.strokeStyle='#26302a';ctx.lineWidth=1.5;}
  ctx.fill();ctx.stroke();ctx.shadowColor='transparent';
  if(highTier){ctx.beginPath();ctx.arc(0,0,16,0,Math.PI*2);ctx.strokeStyle='#ffe2a0b5';ctx.lineWidth=1.2;ctx.stroke();}
  if(selected){ctx.beginPath();ctx.arc(0,0,19,0,Math.PI*2);ctx.strokeStyle='#fff2bc';ctx.lineWidth=2;ctx.stroke();}
  ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle=cluster?'#fff4da':'#15211e';ctx.font=cluster?'700 11px system-ui':'700 14px Segoe UI Symbol,system-ui';ctx.fillText(cluster?(items.length>99?'99+':String(items.length)):(layer.emoji||'✦'),0,1);
  ctx.restore();
}
function draw(){
  if(!data?.map.image?.complete||!data.map.image.naturalWidth)return;
  constrainCamera();
  ctx.clearRect(0,0,view.width,view.height);
  const sourceX=Math.max(0,-view.x/view.zoom);
  const sourceY=Math.max(0,-view.y/view.zoom);
  const sourceWidth=Math.min(data.map.width-sourceX,view.width/view.zoom);
  const sourceHeight=Math.min(data.map.height-sourceY,view.height/view.zoom);
  if(sourceWidth>0&&sourceHeight>0)ctx.drawImage(data.map.image,sourceX,sourceY,sourceWidth,sourceHeight,view.x+sourceX*view.zoom,view.y+sourceY*view.zoom,sourceWidth*view.zoom,sourceHeight*view.zoom);
  const markers=visibleMarkers();
  const overview=view.zoom<=minimumZoom()*1.12;
  const baseCell=overview?124:view.zoom<.55?68:view.zoom<1?38:28;
  const cell=view.zoom<1?Math.max(baseCell,markers.length>800?92:markers.length>220?70:baseCell):baseCell;
  const buckets=new Map();
  for(const item of markers){const key=`${Math.floor(item.sx/cell)}:${Math.floor(item.sy/cell)}`;if(!buckets.has(key))buckets.set(key,[]);buckets.get(key).push(item);}
  view.hits=[];
  for(const items of buckets.values()){const sx=items.reduce((sum,item)=>sum+item.sx,0)/items.length;const sy=items.reduce((sum,item)=>sum+item.sy,0)/items.length;const hit={sx,sy,radius:innerWidth<800?24:19,items};drawSymbol(hit);view.hits.push(hit);}
  $('#status').textContent=overview?`Overview · ${markers.length.toLocaleString()} locations · zoom in to explore`:`${markers.length.toLocaleString()} visible markers · ${view.active.size} layers on`;
  $('#zoomLabel').textContent=`${Math.round(view.zoom*100)}%`;
  if(view.selected||view.cluster)positionPopup();
}
function pick(x,y){for(let i=view.hits.length-1;i>=0;i--){const hit=view.hits[i];if(Math.hypot(hit.sx-x,hit.sy-y)<=hit.radius)return hit;}return null;}
function handleMapTap(x,y){const hit=pick(x,y);if(!hit){hidePopup();return;}if(hit.items.length>1){view.cluster={items:hit.items,x:(hit.sx-view.x)/view.zoom,y:(hit.sy-view.y)/view.zoom};view.selected=null;renderPopup();return;}view.cluster=null;view.selected={layer:hit.items[0].layer,marker:hit.items[0].marker};renderPopup();}
function positionPopup(){const anchor=view.selected?.marker||view.cluster;if(!anchor)return;const element=$('#popup');const sx=view.x+anchor.x*view.zoom,sy=view.y+anchor.y*view.zoom;const width=element.offsetWidth||310,height=element.offsetHeight||210;element.style.left=`${Math.max(12,Math.min(view.width-width-12,sx+23))}px`;element.style.top=`${Math.max(12,Math.min(view.height-height-12,sy-height/2))}px`;}
function renderPopup(){const kind=$('#popupKind');kind.replaceChildren();const glyph=document.createElement('span');glyph.className='glyph';glyph.textContent=view.cluster?'✦':view.selected.layer.emoji||'✦';glyph.style.setProperty('--icon-color',view.cluster?'#e9bd70':view.selected.layer.color||'#e9bd70');const name=document.createElement('span');name.textContent=view.cluster?'LOCATION GROUP':view.selected.layer.name;kind.append(glyph,name);if(view.cluster){const items=view.cluster.items;$('#popupTitle').textContent=`${items.length} nearby locations`;const summary=items.slice(0,5).map(item=>displayName({layer:item.layer,...item.marker})).join(' · ');$('#popupDescription').textContent=summary+(items.length>5?` · +${items.length-5} more`:'');$('#popupCoords').textContent='Zoom in to inspect each location';$('#popupCopy').hidden=true;$('#popupCenter').textContent='Zoom into group';}else{const {layer,marker}=view.selected;$('#popupTitle').textContent=displayName({layer,...marker});const description=plainDetail(marker.detail);$('#popupDescription').textContent=description||fallbackDetail(layer);$('#popupCoords').textContent=`WORLD COORDINATES  ${Math.round(marker.worldX)}, ${Math.round(marker.worldY)}`;$('#popupCopy').hidden=false;$('#popupCenter').textContent='Center here';}$('#popup').hidden=false;positionPopup();draw();}
function hidePopup(){view.selected=null;view.cluster=null;$('#popup').hidden=true;draw();}
function updateFilters(){const root=$('#groups');root.replaceChildren();for(const [title,ids] of categoryGroups){const layers=ids.map(id=>layerById.get(id)).filter(Boolean);const section=document.createElement('section');section.className='filter-group'+(view.openGroups.has(title)?'':' collapsed');const head=document.createElement('button');head.className='group-head';head.type='button';head.innerHTML='<span class="chevron">▾</span><span class="group-name"></span><small></small>';head.querySelector('.group-name').textContent=title;head.querySelector('small').textContent=`${layers.filter(layer=>view.active.has(layer.id)).length}/${layers.length}`;head.onclick=()=>{view.openGroups.has(title)?view.openGroups.delete(title):view.openGroups.add(title);section.classList.toggle('collapsed');};section.append(head);const body=document.createElement('div');body.className='group-body';const tools=document.createElement('div');tools.className='group-tools';for(const action of ['All','None']){const button=document.createElement('button');button.type='button';button.textContent=action;button.onclick=()=>{for(const layer of layers)action==='All'&&layer.count?view.active.add(layer.id):view.active.delete(layer.id);changed();};tools.append(button);}body.append(tools);for(const layer of layers){const row=document.createElement('label');row.className='layer-row'+(layer.count?'':' empty-layer');const checkbox=document.createElement('input');checkbox.type='checkbox';checkbox.checked=view.active.has(layer.id);checkbox.disabled=!layer.count;checkbox.onchange=()=>{checkbox.checked?view.active.add(layer.id):view.active.delete(layer.id);changed();};const icon=document.createElement('span');icon.className='layer-icon';icon.style.setProperty('--icon-color',layer.color||'#d5b16e');icon.textContent=layer.emoji||'✦';const label=document.createElement('span');label.className='layer-name';label.textContent=layer.name;const count=document.createElement('span');count.className='layer-count';count.textContent=layer.count.toLocaleString();row.append(checkbox,icon,label,count);body.append(row);}section.append(body);root.append(section);}$('#filterStatus').textContent=`${view.active.size} of ${data.layers.length} layers selected`;updatePresets();}
function updatePresets(){document.querySelectorAll('.quick-filters button').forEach((button,index)=>{const ids=presets[index].ids.filter(id=>layerById.get(id)?.count);button.classList.toggle('active',ids.length===view.active.size&&ids.every(id=>view.active.has(id)));});}
function changed(){hidePopup();updateFilters();draw();}
function updateSearch(){const results=$('#searchResults');results.replaceChildren();const q=view.query.trim().toLowerCase();if(q.length<2){results.hidden=true;draw();return;}const matches=[];for(const layer of data.layers){for(const marker of layer.markers){if(matching(marker,layer,q)){matches.push({layer,marker});if(matches.length>=8)break;}}if(matches.length>=8)break;}for(const {layer,marker} of matches){const button=document.createElement('button');button.className='search-hit';button.type='button';const glyph=document.createElement('span');glyph.className='symbol';glyph.textContent=layer.emoji||'✦';const text=document.createElement('span');const strong=document.createElement('strong');strong.textContent=displayName({layer,...marker});const small=document.createElement('small');small.textContent=`${layer.name} · ${Math.round(marker.worldX)}, ${Math.round(marker.worldY)}`;text.append(strong,small);button.append(glyph,text);button.onclick=()=>{if(!view.active.has(layer.id))view.active=new Set([layer.id]);view.query='';$('#search').value='';results.hidden=true;updateFilters();focusMarker(layer,marker);};results.append(button);}if(!matches.length){const empty=document.createElement('div');empty.className='search-hit';empty.textContent='No matching map locations';results.append(empty);}results.hidden=false;draw();}
function openMobile(){const panel=$('#filters'),backdrop=$('#mobileBackdrop');panel.inert=false;panel.classList.add('open');backdrop.classList.add('open');$('#mobileFilters').setAttribute('aria-expanded','true');$('#mobileFilterFab').setAttribute('aria-expanded','true');}
function closeMobile(){const panel=$('#filters'),backdrop=$('#mobileBackdrop');panel.classList.remove('open');backdrop.classList.remove('open');$('#mobileFilters').setAttribute('aria-expanded','false');$('#mobileFilterFab').setAttribute('aria-expanded','false');panel.inert=innerWidth<=800;}
function boot(){if(!data||!ctx){$('#status').textContent='Map data unavailable';return;}$('#totalStatus').textContent=`${data.layers.reduce((sum,layer)=>sum+layer.count,0).toLocaleString()} locations`;updateFilters();const image=new Image();image.onload=()=>{data.map.image=image;sizeCanvas();initialView();};image.onerror=()=>{$('#status').textContent='Map image unavailable';};image.src=data.map.src;new ResizeObserver(()=>{const cx=(view.width/2-view.x)/view.zoom,cy=(view.height/2-view.y)/view.zoom;sizeCanvas();if(view.zoom&&cx&&cy){view.x=view.width/2-cx*view.zoom;view.y=view.height/2-cy*view.zoom;draw();}}).observe(stage);}
$('#search').addEventListener('input',event=>{view.query=event.target.value;updateSearch();});$('#resetFilters').onclick=()=>{view.active=new Set(recommendedIds);view.query='';$('#search').value='';$('#searchResults').hidden=true;changed();fit();};$('#all').onclick=()=>{view.active=new Set(data.layers.filter(layer=>layer.count).map(layer=>layer.id));changed();};$('#none').onclick=()=>{view.active.clear();changed();};$('#zoomIn').onclick=()=>zoomAt(1.5);$('#zoomOut').onclick=()=>zoomAt(1/1.5);$('#home').onclick=fit;$('#popupClose').onclick=hidePopup;$('#popupCenter').onclick=()=>{if(view.selected)focusMarker(view.selected.layer,view.selected.marker);};$('#popupCopy').onclick=async()=>{if(!view.selected)return;const {worldX,worldY}=view.selected.marker;try{await navigator.clipboard.writeText(`${Math.round(worldX)}, ${Math.round(worldY)}`);$('#popupCopy').textContent='Copied ✓';setTimeout(()=>{$('#popupCopy').textContent='Copy coordinates';},1300);}catch{$('#popupCopy').textContent='Select coordinates above';}};$('#mobileFilters').onclick=openMobile;$('#closeFilters').onclick=closeMobile;$('#mobileBackdrop').onclick=closeMobile;
const touchPoints=new Map();
let gesture=null;
let lastTap=null;
const localPoint=event=>{const rect=stage.getBoundingClientRect();return{x:event.clientX-rect.left,y:event.clientY-rect.top};};
function beginPinch(){lastTap=null;const points=[...touchPoints.values()];const middle={x:(points[0].x+points[1].x)/2,y:(points[0].y+points[1].y)/2};gesture={kind:'pinch',distance:Math.max(1,Math.hypot(points[0].x-points[1].x,points[0].y-points[1].y)),zoom:view.zoom,worldX:(middle.x-view.x)/view.zoom,worldY:(middle.y-view.y)/view.zoom};}
stage.addEventListener('wheel',event=>{event.preventDefault();cancelAnimationFrame(view.animation);const point=localPoint(event);const factor=Math.exp(-Math.max(-120,Math.min(120,event.deltaY))*.0017);const next=Math.max(minimumZoom(),Math.min(5,view.zoom*factor));const ratio=next/view.zoom;view.x=point.x-(point.x-view.x)*ratio;view.y=point.y-(point.y-view.y)*ratio;view.zoom=next;scheduleDraw();},{passive:false});
stage.addEventListener('pointerdown',event=>{if(event.target!==canvas)return;cancelAnimationFrame(view.animation);$('#hoverTip').hidden=true;const point=localPoint(event);stage.setPointerCapture(event.pointerId);if(event.pointerType==='touch'){touchPoints.set(event.pointerId,point);if(touchPoints.size===2)beginPinch();else if(touchPoints.size===1)gesture={kind:'pan',start:point,x:view.x,y:view.y,moved:false};return;}view.drag={x:event.clientX,y:event.clientY,originX:view.x,originY:view.y};view.moved=false;stage.classList.add('dragging');});
stage.addEventListener('pointermove',event=>{if(event.pointerType==='touch'&&touchPoints.has(event.pointerId)){touchPoints.set(event.pointerId,localPoint(event));if(gesture?.kind==='pinch'&&touchPoints.size===2){const points=[...touchPoints.values()];const distance=Math.hypot(points[0].x-points[1].x,points[0].y-points[1].y);const middle={x:(points[0].x+points[1].x)/2,y:(points[0].y+points[1].y)/2};view.zoom=Math.max(minimumZoom(),Math.min(5,gesture.zoom*distance/gesture.distance));view.x=middle.x-gesture.worldX*view.zoom;view.y=middle.y-gesture.worldY*view.zoom;scheduleDraw();}else if(gesture?.kind==='pan'&&touchPoints.size===1){const point=touchPoints.get(event.pointerId);const dx=point.x-gesture.start.x,dy=point.y-gesture.start.y;if(Math.hypot(dx,dy)>4)gesture.moved=true;view.x=gesture.x+dx;view.y=gesture.y+dy;scheduleDraw();}return;}if(!view.drag)return;const dx=event.clientX-view.drag.x,dy=event.clientY-view.drag.y;if(Math.hypot(dx,dy)>5)view.moved=true;view.x=view.drag.originX+dx;view.y=view.drag.originY+dy;scheduleDraw();});
stage.addEventListener('pointerup',event=>{if(event.pointerType==='touch'&&touchPoints.has(event.pointerId)){const point=localPoint(event);touchPoints.delete(event.pointerId);const wasTap=gesture?.kind==='pan'&&!gesture.moved;if(touchPoints.size===1){const remaining=[...touchPoints.values()][0];gesture={kind:'pan',start:remaining,x:view.x,y:view.y,moved:true};}else gesture=null;if(wasTap){draw();const now=performance.now();if(lastTap&&now-lastTap.time<320&&Math.hypot(point.x-lastTap.x,point.y-lastTap.y)<32){zoomAt(1.7,point.x,point.y);lastTap=null;}else{handleMapTap(point.x,point.y);lastTap={time:now,...point};}}return;}if(!view.drag)return;const moved=view.moved;view.drag=null;stage.classList.remove('dragging');if(!moved){const point=localPoint(event);draw();handleMapTap(point.x,point.y);}});
stage.addEventListener('pointercancel',event=>{touchPoints.delete(event.pointerId);if(touchPoints.size===1){const point=[...touchPoints.values()][0];gesture={kind:'pan',start:point,x:view.x,y:view.y,moved:true};}else if(!touchPoints.size)gesture=null;view.drag=null;stage.classList.remove('dragging');});
document.addEventListener('keydown',event=>{if(event.key==='Escape'){hidePopup();closeMobile();}if(event.key==='/'&&document.activeElement?.tagName!=='INPUT'){event.preventDefault();$('#search').focus();openMobile();}});
stage.addEventListener('pointermove',event=>{const tip=$('#hoverTip');if(view.drag||event.target!==canvas||event.pointerType==='touch'){tip.hidden=true;return;}const rect=stage.getBoundingClientRect();const x=event.clientX-rect.left,y=event.clientY-rect.top;const hit=pick(x,y);stage.style.cursor=hit?'pointer':'grab';if(!hit){tip.hidden=true;return;}tip.textContent=hit.items.length>1?`${hit.items.length} locations · click to inspect`:displayName({layer:hit.items[0].layer,...hit.items[0].marker});tip.hidden=false;tip.style.left=`${Math.max(8,Math.min(view.width-250,x+15))}px`;tip.style.top=`${Math.max(8,y-35)}px`;});
stage.addEventListener('pointerleave',()=>{$('#hoverTip').hidden=true;stage.style.cursor='grab';});
$('#popupCenter').onclick=()=>{if(view.cluster){const anchor=view.cluster;hidePopup();const target=Math.min(5,Math.max(view.zoom*2,view.zoom+.4));animateTo(target,view.width/2-anchor.x*target,view.height/2-anchor.y*target);}else if(view.selected){focusMarker(view.selected.layer,view.selected.marker);}};
$('#mobileFilterFab').onclick=openMobile;
$('#filters').inert=innerWidth<=800;
window.addEventListener('resize',()=>{$('#filters').inert=innerWidth<=800&&!$('#filters').classList.contains('open');});
boot();
if(data){
  const tiles=$('#quickFilters');
  tiles.replaceChildren();
  for(const [index,preset] of presets.entries()){
    const button=document.createElement('button');
    button.type='button';
    button.className='preset-tile'+(index===0?' feature':'')+(preset.tier?' rare':'');
    button.setAttribute('aria-label',`Show ${preset.label} locations`);
    const icon=document.createElement('span');
    icon.className='preset-icon';
    icon.setAttribute('aria-hidden','true');
    icon.textContent=preset.icon;
    const copy=document.createElement('span');
    copy.className='preset-copy';
    const title=document.createElement('strong');
    title.textContent=preset.label;
    const note=document.createElement('small');
    note.textContent=preset.note;
    copy.append(title,note);
    const count=document.createElement('span');
    count.className='preset-count';
    count.textContent=preset.ids.reduce((sum,id)=>sum+(layerById.get(id)?.count||0),0).toLocaleString();
    button.append(icon,copy,count);
    button.onclick=()=>{view.active=new Set(preset.ids.filter(id=>layerById.get(id)?.count));changed();if(innerWidth<=800)closeMobile();};
    tiles.append(button);
  }
  updatePresets();
}

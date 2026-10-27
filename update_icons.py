from pathlib import Path
import json, urllib.request

root=Path.cwd(); data=json.loads((root/'data.json').read_text(encoding='utf8')); icon_dir=root/'assets'/'icons'; icon_dir.mkdir(exist_ok=True)
server=json.loads((Path(r'C:\Users\adyap\Documents\Codex\2026-10-27\https-pindrop-gg-enshrouded-map-https')/'work'/'server_full.json').read_text(encoding='utf8'))
ore={'ore_iron':'iron.webp','ore_copper':'copper.webp','ore_coal':'coal.webp','ore_sulfur':'sulfur.webp','ore_amber':'amber.webp','ore_salt':'salt.webp','ore_clay':'clay.webp','ore_silver':'silver.webp','ore_tin':'tin.webp','ore_gold':'gold.webp','ore_celestium':'celestium.webp'}
manual={'Ancient_Spire':'Ancient_Spire.png','Flame_Shrine':'Flame_Shrine.png','Sun_Temple':'Sun_Temple.png','Ancient_Vault':'Ancient_Vault.png','Village':'Village.png','Camp':'Camp.png','Mine':'Mine.png'}
emoji={'wood-chest':'▣','silver-chest':'◇','gold-chest':'◆','shell-chest':'◈','locked-wood-chest':'▣','locked-silver-chest':'◇','locked-gold-chest':'◆','wood-sarcophagus':'▤','silver-sarcophagus':'▥','gold-sarcophagus':'▦','mining-container':'⚒','boss':'☠','spawn-scavenger':'⚔','spawn-vukah':'♞','spawn-drak':'♨','spawn-hollow':'☽','Enemy_Camp':'⚔','Shroud_Lair':'☁','Hollow_Halls':'☽','Ancient_Spire':'✦','Flame_Shrine':'✧','Sun_Temple':'☀','Ancient_Vault':'⬟','Village':'⌂','Camp':'♜','Mine':'⚒','teleport':'✦','grapple-point':'↗','jump-pad':'↑','updraft':'⇧'}
def source_for(layer):
    key=layer['id']
    if key in ore:return '/enshrouded/markers/ores/'+ore[key]
    if key in server['markers']:
        group=server['kinds'].get(key,{}).get('group'); icon=server['groups'].get(group,{}).get('icon')
        if icon:return '/enshrouded/markers/'+icon
    if key in manual:return '/enshrouded/map/icons/'+manual[key]
    fallback={'teleport':'game-fast-travel.png','grapple-point':'srv-grapple.svg','jump-pad':'srv-jump-pad.svg','updraft':'srv-updraft.svg'}.get(key)
    return '/enshrouded/map/icons/'+fallback if fallback else None
for layer in data['layers']:
    src=source_for(layer)
    layer['emoji']=emoji.get(layer['id'],'•')
    if not src:continue
    name=Path(src).name; target=icon_dir/name; layer['icon']='https://pindrop.gg'+src
    if not target.exists():
        try: urllib.request.urlretrieve('https://pindrop.gg'+src,target)
        except Exception as e: print('skip',src,e)
(root/'data.json').write_text(json.dumps(data,separators=(',',':')),encoding='utf8')
(root/'data.js').write_text('window.ENS_HDR_DATA='+json.dumps(data,separators=(',',':'))+';',encoding='utf8')
print('icons',sum('icon' in x for x in data['layers']))

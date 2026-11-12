from pathlib import Path
p=Path('tests/test_outfit_quality.py');s=p.read_text().replace('a[31:35,42:58]','a[31:37,37:63]').replace('a[35:36,42:58]','a[37:38,37:63]').replace('a[36:60,40:60]','a[38:60,35:65]').replace('clean_collar_insert(a,[45,10,55,30],protected)','clean_collar_insert(a,[40,10,60,30],protected)').replace('out[35:],a[35:]','out[37:],a[37:]');p.write_text(s)

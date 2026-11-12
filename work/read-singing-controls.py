from pathlib import Path
s=Path('src/components/SingingDrawer.tsx').read_text(encoding='utf-8-sig');a=s.index('setSingingReference',s.index('return '));print(s[a-160:a+260].encode('ascii','backslashreplace').decode())

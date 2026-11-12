from pathlib import Path
s=Path('src/components/GeneratedOutfits.tsx').read_text(encoding='utf-8-sig');a=s.index('{status&&',s.index('if(background)return'));print(s[a-260:a+1200])

import sys
sys.path.insert(0,'scripts')
from garment_only import prepare_garment_only
p='exports/images/outfit-content-check-20261028';r=prepare_garment_only(p,p+'/avatar-body.png');print(r['opening_body_pixels_removed'],r['fit_warnings'])

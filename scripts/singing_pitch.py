"""Conservative, optional smoothing of a guide's F0 conditioning, not its audio."""
import numpy as np
from scipy.signal import medfilt, savgol_filter

def smooth_pitch(values):
    original=np.asarray(values)
    result=original.astype(float).copy()
    voiced=np.isfinite(result)&(result>1)
    # Leave silence, voicing edges and large note transitions untouched.
    edges=np.flatnonzero(np.diff(np.r_[False,voiced,False])).reshape(-1,2)
    for start,end in edges:
        cents=1200*np.log2(result[start:end])
        cuts=np.r_[0,np.flatnonzero(np.abs(np.diff(cents))>120)+1,len(cents)]
        for left,right in zip(cuts[:-1],cuts[1:]):
            section=cents[left:right]
            if len(section)<9:continue
            median=medfilt(section,5)
            cleaned=section.copy()
            # Only correct large isolated deviations; retain normal vibrato.
            interior=slice(2,-2)
            mask=np.abs(section[interior]-median[interior])>65
            cleaned[interior]=np.where(mask,median[interior],section[interior])
            softened=.7*cleaned+.3*savgol_filter(cleaned,9,2)
            softened[:4]=section[:4];softened[-4:]=section[-4:]
            result[start+left:start+right]=2**(softened/1200)
    return result.astype(original.dtype)

def pitch_stats(values):
    f0=np.asarray(values);voiced=np.isfinite(f0)&(f0>1)
    consecutive=voiced[:-1]&voiced[1:]
    delta=1200*np.diff(np.log2(np.maximum(f0,1)))[consecutive]
    small=delta[np.abs(delta)<120]
    return dict(voicedFrames=int(voiced.sum()),medianHz=float(np.median(f0[voiced])) if voiced.any() else None,
                adjacentChangeMedianCents=float(np.median(np.abs(small))) if len(small) else None,
                adjacentChange95Cents=float(np.percentile(np.abs(small),95)) if len(small) else None)

"""Approved clearer saw-lead articulation, leaving other synths unchanged."""
import numpy as np

def prepare_lead(notes,seconds,levels=None):
 played=[list(n) for n in notes];velocities=[]
 for i,n in enumerate(played):
  entrance=i==0 or n[0]-notes[i-1][1]>.12
  level=levels[i] if levels is not None else int(48+55*np.clip(n[3],0,1))
  velocities.append(max(1,min(127,round(level*(1.03 if entrance else .94)))))
  n[1]=min(seconds,n[1])
  if i+1<len(played):
   following=played[i+1]
   if n[2]!=following[2] and 0<=following[0]-n[1]<=.045:n[1]=min(seconds,following[0]+.02)
 return played,velocities

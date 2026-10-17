"""Approved gentle ocarina phrasing, independent of note detection."""
import numpy as np

def prepare_ocarina(notes,seconds,levels=None):
 played=[list(n) for n in notes];velocities=[];entrances=[]
 for i,n in enumerate(played):
  entrance=i==0 or n[0]-notes[i-1][1]>.12
  if entrance:entrances.append(n[0])
  level=levels[i] if levels is not None else int(48+55*np.clip(n[3],0,1))
  velocities.append(max(1,round(level*(.86 if entrance else .95))))
  n[1]=min(n[1],seconds)
  if i+1<len(played):
   following=played[i+1]
   if n[2]!=following[2] and 0<=following[0]-n[1]<=.05:n[1]=min(seconds,following[0]+.025)
 return played,velocities,entrances

def soften_ocarina(audio,entrances,sr=24000):
 result=audio.copy()
 for onset in entrances:
  first=max(0,round(onset*sr));count=min(round(.022*sr),len(result)-first)
  if count>0:result[first:first+count]*=np.sin(np.linspace(0,np.pi/2,count))**2
 return result

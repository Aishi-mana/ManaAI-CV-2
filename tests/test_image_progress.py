import sys,unittest,tempfile,json,errno,threading,time,os
from pathlib import Path
from unittest.mock import patch
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'scripts'))
import image_job
class ProgressTests(unittest.TestCase):
 def workspace_temp(self):return tempfile.TemporaryDirectory(dir=Path(__file__).resolve().parents[1]/'work')
 def test_retries_transient_replace_lock_then_publishes_valid_json(self):
  with self.workspace_temp() as d:
   root=Path(d);real=os.replace;calls=[]
   def replace(src,dst):
    calls.append(src)
    if len(calls)<3:raise PermissionError(13,'sharing violation')
    return real(src,dst)
   with patch.object(image_job.os,'replace',side_effect=replace),patch.object(image_job.time,'sleep'):
    self.assertTrue(image_job.status(root,stage='sampling',step=2))
   self.assertEqual(json.loads((root/'progress.json').read_text())['step'],2);self.assertEqual(len(calls),3);self.assertFalse(list(root.glob('*.tmp')))
 def test_persistent_lock_does_not_abort_generation_or_destroy_previous_status(self):
  with self.workspace_temp() as d:
   root=Path(d);image_job.status(root,stage='loading')
   with patch.object(image_job.os,'replace',side_effect=PermissionError(13,'locked')),patch.object(image_job.time,'sleep'):
    self.assertFalse(image_job.status(root,stage='sampling'))
   self.assertEqual(json.loads((root/'progress.json').read_text())['stage'],'loading');self.assertFalse(list(root.glob('*.tmp')))
   self.assertTrue(image_job.status(root,stage='ready'))
 def test_non_lock_disk_error_is_not_hidden(self):
  with self.workspace_temp() as d:
   with patch.object(image_job.os,'replace',side_effect=OSError(errno.ENOSPC,'disk full')):
    with self.assertRaises(OSError):image_job.status(Path(d),stage='sampling')
 def test_unique_temps_do_not_collide_with_old_progress_tmp(self):
  with self.workspace_temp() as d:
   root=Path(d);(root/'progress.tmp').write_text('old diagnostic')
   image_job.status(root,stage='ready');self.assertEqual((root/'progress.tmp').read_text(),'old diagnostic')
 @unittest.skipUnless(os.name=='nt','Windows sharing semantics')
 def test_real_windows_reader_lock_is_retried(self):
  import ctypes
  from ctypes import wintypes
  kernel=ctypes.WinDLL('kernel32',use_last_error=True)
  kernel.CreateFileW.argtypes=[wintypes.LPCWSTR,wintypes.DWORD,wintypes.DWORD,ctypes.c_void_p,wintypes.DWORD,wintypes.DWORD,wintypes.HANDLE];kernel.CreateFileW.restype=wintypes.HANDLE
  kernel.CloseHandle.argtypes=[wintypes.HANDLE];kernel.CloseHandle.restype=wintypes.BOOL
  with self.workspace_temp() as d:
   root=Path(d);image_job.status(root,stage='loading')
   handle=kernel.CreateFileW(str(root/'progress.json'),0x80000000,1,None,3,0,None)
   self.assertNotEqual(handle,ctypes.c_void_p(-1).value)
   timer=threading.Timer(.08,lambda:kernel.CloseHandle(handle));timer.start()
   try:self.assertTrue(image_job.status(root,stage='sampling'))
   finally:timer.join()
   self.assertEqual(json.loads((root/'progress.json').read_text())['stage'],'sampling')
if __name__=='__main__':unittest.main()

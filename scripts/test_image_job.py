import importlib.util
import unittest
from pathlib import Path

spec=importlib.util.spec_from_file_location('image_job',Path(__file__).with_name('image_job.py'))
worker=importlib.util.module_from_spec(spec)
spec.loader.exec_module(worker)

class MemoryPolicy(unittest.TestCase):
    def test_gpu_reserves_headroom_and_avoids_batched_cfg(self):
        args=worker.sd_runtime_args(False)
        self.assertEqual(args[args.index('--max-vram')+1],'3')
        self.assertEqual(args[args.index('--batched-cfg')+1],'off')
        self.assertIn('te=cpu',args[args.index('--backend')+1])
        self.assertIn('--vae-tiling',args)
    def test_cpu_and_neta_policies_remain_independent(self):
        self.assertEqual(worker.sd_runtime_args(True),['--backend','cpu','--offload-to-cpu','--mmap'])
        self.assertEqual(worker.runtime_args(False),[])
        self.assertEqual(worker.runtime_args(True),['--cpu'])

if __name__=='__main__':unittest.main()

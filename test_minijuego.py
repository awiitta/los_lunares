import json
import unittest
from pathlib import Path
import numpy as np

from herramientas.preparar_minijuego import classify


class MiniGameTests(unittest.TestCase):
    def test_candidate_and_steep(self):
        z=np.zeros((20,20));s=np.full_like(z,3)
        self.assertEqual(classify(s,z)["status"],"candidate")
        self.assertEqual(classify(np.full_like(s,12),z)["status"],"review")

    def test_relief_is_not_absolute_height(self):
        z=np.zeros((20,20));s=np.zeros_like(z)
        self.assertEqual(classify(s,z-2000)["status"],"candidate")
        z[:10]=30
        self.assertEqual(classify(s,z)["status"],"review")

    def test_missing_data_unknown(self):
        z=np.zeros((20,20));s=np.zeros_like(z);z[:2]=np.nan
        self.assertEqual(classify(s,z)["status"],"unknown")

    def test_generated_rounds_are_real_and_consistent(self):
        data=json.loads(Path('dist/minijuego/assets/desafios.json').read_text(encoding='utf-8'))
        self.assertEqual(len(data['rounds']),4)
        for r in data['rounds']:
            self.assertEqual(r['source_kind'],'real_LOLA')
            self.assertEqual(len(r['tiles']),16)
            for tile in r['tiles']:
                candidate=tile['fraction_below_8_deg_percent']>=80 and tile['relief_p95_p5_m']<=20
                self.assertEqual(tile['status']=='candidate',candidate)
                x0,y0,x1,y1=tile['bounds_xy_m']
                self.assertEqual(x1-x0,100);self.assertEqual(y1-y0,100)


if __name__=='__main__':unittest.main()

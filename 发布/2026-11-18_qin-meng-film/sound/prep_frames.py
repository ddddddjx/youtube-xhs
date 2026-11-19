# 定帧 → 1920×1080 jpg + 景深图（Depth Anything V2 small，onnx）。用法：prep_frames.py <原图目录> <模型.onnx> <输出目录>
import sys, glob, os
import numpy as np
from PIL import Image, ImageFilter
import onnxruntime as ort
src, model, out = sys.argv[1:4]
sess = ort.InferenceSession(model, providers=['CPUExecutionProvider']); inp = sess.get_inputs()[0].name
mean, std = np.array([0.485, 0.456, 0.406], np.float32), np.array([0.229, 0.224, 0.225], np.float32)
for f in sorted(glob.glob(src + '/*.jpg')):
    n = os.path.basename(f)[:2]; im = Image.open(f).convert('RGB')
    im.resize((1920, 1080), Image.LANCZOS).save(f'{out}/frames/{n}.jpg', quality=92)
    x = (np.asarray(im.resize((924, 518), Image.BICUBIC), np.float32) / 255 - mean) / std
    d = sess.run(None, {inp: x.transpose(2, 0, 1)[None]})[0][0]
    d = (d - d.min()) / (d.max() - d.min() + 1e-6)                      # 1 = 近，0 = 远
    Image.fromarray((d * 255).astype(np.uint8)).resize((960, 540), Image.BICUBIC).filter(ImageFilter.GaussianBlur(3)).save(f'{out}/depth/{n}.png')
    print(n, 'ok', flush=True)

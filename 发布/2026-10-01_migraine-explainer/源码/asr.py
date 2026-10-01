import sherpa_onnx, soundfile as sf, numpy as np
D="voices/sherpa-onnx-paraformer-zh-small-2024-03-09/"
rec=sherpa_onnx.OfflineRecognizer.from_paraformer(paraformer=D+"model.int8.onnx",tokens=D+"tokens.txt",num_threads=4)
def asr(path):
    a,sr=sf.read(path,dtype="float32")
    if a.ndim>1: a=a.mean(1)
    s=rec.create_stream(); s.accept_waveform(sr,a); rec.decode_stream(s); return s.result.text

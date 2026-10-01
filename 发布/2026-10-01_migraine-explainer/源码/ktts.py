import sys, sherpa_onnx, soundfile as sf
D="voices/kokoro-multi-lang-v1_1/"
cfg=sherpa_onnx.OfflineTtsConfig(model=sherpa_onnx.OfflineTtsModelConfig(kokoro=sherpa_onnx.OfflineTtsKokoroModelConfig(
  model=D+"model.onnx",voices=D+"voices.bin",tokens=D+"tokens.txt",data_dir=D+"espeak-ng-data",dict_dir=D+"dict",
  lexicon=D+"lexicon-us-en.txt,"+D+"lexicon-zh.txt"),num_threads=4),rule_fsts=D+"date-zh.fst,"+D+"phone-zh.fst,"+D+"number-zh.fst",max_num_sentences=1)
tts=sherpa_onnx.OfflineTts(cfg)
def say(text,out,sid,speed=1.0):
    a=tts.generate(text,sid=sid,speed=speed); sf.write(out,a.samples,a.sample_rate); return len(a.samples)/a.sample_rate
if __name__=="__main__":
    t="偏头痛，不只是头疼。它是一场在你大脑里，悄悄酝酿的风暴。"
    for sid in [int(x) for x in sys.argv[1:]]:
        print(sid, say(t,f"s{sid}.wav",sid))

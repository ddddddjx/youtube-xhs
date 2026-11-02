import sys, asyncio, certifi
certifi.where = lambda: "/root/.ccr/ca-bundle.crt"   # 代理重签 TLS，信任代理 CA（不关校验）
import edge_tts
async def main(text, voice, out, rate="+0%"):
    await edge_tts.Communicate(text, voice, rate=rate).save(out)
asyncio.run(main(*sys.argv[1:]))

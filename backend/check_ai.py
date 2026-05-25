import httpx
import asyncio

async def main():
    # Test Ollama
    try:
        async with httpx.AsyncClient(timeout=5.0) as c:
            r = await c.get("http://localhost:11434/api/tags")
            print("OLLAMA_STATUS: OK", r.status_code)
            print("OLLAMA_BODY:", r.text[:300])
    except httpx.ConnectError as e:
        print("OLLAMA_STATUS: NOT_RUNNING -", e)
    except Exception as e:
        print("OLLAMA_STATUS: ERROR -", type(e).__name__, e)

    # Test OpenAI key
    from config import settings
    key = settings.OPENAI_API_KEY
    print("OPENAI_KEY_SET:", bool(key and len(key) > 10))
    print("OPENAI_KEY_PREFIX:", key[:15] if key else "empty")
    print("USE_OLLAMA:", settings.USE_OLLAMA)

asyncio.run(main())

from openai import AsyncOpenAI
from config import get_settings
from typing import AsyncGenerator

settings = get_settings()
_client: AsyncOpenAI = None


def get_ai_client() -> AsyncOpenAI:
    global _client
    if _client is None:
        _client = AsyncOpenAI(api_key=settings.openai_api_key)
    return _client


SYSTEM_PROMPT = """You are a helpful, intelligent AI assistant. You provide clear, accurate, and thoughtful responses.
You support markdown formatting in your responses. Be concise but thorough."""


async def stream_ai_response(messages: list[dict]) -> AsyncGenerator[str, None]:
    client = get_ai_client()
    formatted = [{"role": "system", "content": SYSTEM_PROMPT}] + messages

    stream = await client.chat.completions.create(
        model=settings.openai_model,
        messages=formatted,
        stream=True,
        max_tokens=2048,
        temperature=0.7,
    )

    async for chunk in stream:
        delta = chunk.choices[0].delta
        if delta.content:
            yield delta.content


async def get_ai_response(messages: list[dict]) -> str:
    client = get_ai_client()
    formatted = [{"role": "system", "content": SYSTEM_PROMPT}] + messages

    response = await client.chat.completions.create(
        model=settings.openai_model,
        messages=formatted,
        max_tokens=2048,
        temperature=0.7,
    )
    return response.choices[0].message.content

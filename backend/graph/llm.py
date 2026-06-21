import os
import time

from openai import OpenAI, RateLimitError

# Both providers expose an OpenAI-compatible chat completions API, so switching
# is just a base_url/key/model swap. Nebius is the intended provider once its
# credentials are ready; Gemini is the working fallback for now.
_PROVIDERS = {
    "gemini": {
        "base_url": "https://generativelanguage.googleapis.com/v1beta/openai/",
        "api_key": os.environ.get("GEMINI_API_KEY"),
        "model": os.environ.get("GEMINI_MODEL_ID", "gemini-2.5-flash"),
    },
    "nebius": {
        "base_url": "https://api.tokenfactory.nebius.com/v1/",
        "api_key": os.environ.get("NEBIUS_API_KEY"),
        "model": os.environ.get("NEBIUS_MODEL_ID"),
    },
    "anthropic": {
        "base_url": "https://api.anthropic.com/v1/",
        "api_key": os.environ.get("ANTHROPIC_API_KEY"),
        "model": os.environ.get("ANTHROPIC_MODEL_ID", "claude-haiku-4-5-20251001"),
    },
}
_provider = _PROVIDERS[os.environ.get("LLM_PROVIDER", "gemini")]

llm = OpenAI(base_url=_provider["base_url"], api_key=_provider["api_key"])
MODEL = _provider["model"]


def _retry_delay_seconds(error: RateLimitError, default: float) -> float:
    # Gemini's 429 body includes a RetryInfo detail with the actual server-
    # suggested wait, e.g. "38s" — despite this being a "per day" quota, it
    # behaves like a rolling window, so waiting it out and retrying works.
    try:
        details = error.body["error"]["details"]
        for detail in details:
            if detail.get("@type", "").endswith("RetryInfo"):
                return float(detail["retryDelay"].rstrip("s")) + 2
    except (KeyError, TypeError, ValueError, AttributeError):
        pass
    return default


def complete_with_retry(
    messages: list[dict], max_tokens: int, schema_name: str, schema: dict, retries: int = 3
):
    """Gemini's free tier (20 req/day) throws 429s that include a
    retry-after delay — back off for exactly as long as the server says and
    retry rather than letting one rate limit hit sink an entire scan call.
    """
    # json_schema mode (strict) constrains decoding to the given schema —
    # without it, models sometimes emit unescaped quotes inside string
    # fields (e.g. a description quoting the listing title) that break
    # json.loads even though the structure otherwise looks right. Anthropic's
    # OpenAI-compat layer requires json_schema (rejects the older json_object
    # mode), so this is the one format that works across every provider here.
    response_format = {
        "type": "json_schema",
        "json_schema": {"name": schema_name, "strict": True, "schema": schema},
    }
    for attempt in range(retries):
        try:
            return llm.chat.completions.create(
                model=MODEL,
                max_tokens=max_tokens,
                messages=messages,
                response_format=response_format,
            )
        except RateLimitError as error:
            if attempt == retries - 1:
                raise
            time.sleep(_retry_delay_seconds(error, default=10 * (attempt + 1)))

// fetch + JSON parse that throws the API's `{error}` message on failure.
export async function requestJson<T>(
  url: string,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(url, init);
  const result = (await response.json().catch(() => ({}))) as T & {
    error?: string;
  };
  if (!response.ok)
    throw new Error(result.error ?? `Request failed (${response.status})`);
  return result;
}

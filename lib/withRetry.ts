export async function withRetry<T>(fn: () => T | Promise<T>, retries = 5, delay = 50): Promise<T> {
  for (let attempt = 0; ; attempt++) {
    try {
      return await fn();
    } catch (err: any) {
      // For PostgreSQL we retry on serialization failures or lock timeouts
      const retryable = err.code === '55P03' || err.code === '40001';
      if (!retryable || attempt >= retries) {
        throw err;
      }
    }
    await new Promise((resolve) => setTimeout(resolve, delay));
  }
}

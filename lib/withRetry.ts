export async function withRetry<T>(fn: () => T | Promise<T>, retries = 5, delay = 50): Promise<T> {
  for (let attempt = 0; ; attempt++) {
    try {
      return await fn();
    } catch (err: any) {
      if (err.code !== 'SQLITE_BUSY' || attempt >= retries) {
        throw err;
      }
    }
    await new Promise((resolve) => setTimeout(resolve, delay));
  }
}

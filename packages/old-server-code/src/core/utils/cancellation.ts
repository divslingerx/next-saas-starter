export class CancellationError extends Error {
  constructor(reason?: any) {
    super(`Operation cancelled: ${reason || 'Unknown reason'}`);
    this.name = 'CancellationError';
  }
}

export class TimeoutError extends Error {
  constructor(timeoutMs: number) {
    super(`Operation timed out after ${timeoutMs}ms`);
    this.name = 'TimeoutError';
  }
}

export async function withCancellation<T>(
  promise: Promise<T>,
  signal: AbortSignal,
  timeoutMs?: number
): Promise<T> {
  if (signal.aborted) {
    throw new CancellationError(signal.reason);
  }

  let timeoutId: NodeJS.Timeout | undefined;
  const promises: Promise<T>[] = [promise];
  
  if (timeoutMs) {
    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutId = setTimeout(() => reject(new TimeoutError(timeoutMs)), timeoutMs);
    });
    promises.push(timeoutPromise);
  }
  
  const cancellationPromise = new Promise<never>((_, reject) => {
    const onAbort = () => reject(new CancellationError(signal.reason));
    signal.addEventListener('abort', onAbort, { once: true });
  });
  promises.push(cancellationPromise);

  try {
    return await Promise.race(promises);
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
}
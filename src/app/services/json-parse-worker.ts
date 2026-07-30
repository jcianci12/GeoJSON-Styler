/**
 * Offloads JSON.parse to a Web Worker so the main thread stays responsive.
 * Worker is created as an inline Blob — no separate file needed, no webpack config.
 */

let _workerScript: string | null = null;

function getWorkerScript(): string {
  if (!_workerScript) {
    // Self-contained worker: receives a string, parses it, posts the result back.
    // Using function.toString() so the same code works in both worker and main contexts.
    const fn = function () {
      self.onmessage = function (e: MessageEvent<string>) {
        try {
          const parsed = JSON.parse(e.data);
          (self as any).postMessage({ success: true, data: parsed });
        } catch (err: any) {
          (self as any).postMessage({ success: false, error: err.message });
        }
      };
    };
    _workerScript = `(${fn.toString()})();`;
  }
  return _workerScript;
}

/**
 * Parse a JSON string in a Web Worker. Non-blocking.
 * Returns a Promise that resolves with the parsed value, or rejects on parse error.
 */
export function parseJSONInWorker(raw: string): Promise<any> {
  return new Promise((resolve, reject) => {
    const blob = new Blob([getWorkerScript()], { type: 'application/javascript' });
    const url = URL.createObjectURL(blob);
    const worker = new Worker(url);

    worker.onmessage = (e: MessageEvent<{ success: boolean; data?: any; error?: string }>) => {
      worker.terminate();
      URL.revokeObjectURL(url);

      if (e.data.success) {
        resolve(e.data.data);
      } else {
        reject(new Error(e.data.error || 'Unknown worker parse error'));
      }
    };

    worker.onerror = (err) => {
      worker.terminate();
      URL.revokeObjectURL(url);
      reject(new Error(`Worker error: ${err.message}`));
    };

    worker.postMessage(raw);
  });
}

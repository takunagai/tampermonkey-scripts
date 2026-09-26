export type Logger = {
  info: (message: string, context?: Record<string, unknown>) => void;
  warn: (message: string, context?: Record<string, unknown>) => void;
  error: (message: string, context?: Record<string, unknown>) => void;
};

/** コンソール出力にスクリプト名の接頭辞を付ける。ページ側のログと区別するため */
export function createLogger(scriptId: string): Logger {
  const prefix = `[${scriptId}]`;
  return {
    info: (message, context) => console.info(prefix, message, context ?? ''),
    warn: (message, context) => console.warn(prefix, message, context ?? ''),
    error: (message, context) => console.error(prefix, message, context ?? ''),
  };
}

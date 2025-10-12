export type LogEntry = {
  id?: string;
  type: "hook" | "resource" | "frame" | "error" | "info" | "ctx";
  hook?: string;
  plugin?: string;
  start?: number;
  end?: number;
  duration?: number;
  payload?: any;
  error?: any;
};

// this.logger?.push({
//               type: "error",
//               hook: "renderLoop",
//               plugin: "renderLoop",
//               start: Date.now(),
//               error: String(err)
//             });



export class PipelineLogger {
  private records: LogEntry[] = [];
  onRecord?: (rec: LogEntry) => void;

  push(rec: LogEntry) {
    this.records.push(rec);
    this.onRecord && this.onRecord(rec);
  }
  getAll() {
    return this.records.slice();
  }
  clear() {
    this.records.length = 0;
  }
}

export interface Logger {
  info(...msg: any[]): void
  warn(...msg: any[]): void
  error(...msg: any[]): void
  debug(...msg: any[]): void
}

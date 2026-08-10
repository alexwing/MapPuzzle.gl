import type { Response } from "express";

/**
 * Reports a long job's progress over the POST that started it.
 *
 * The four content generators walk every piece of a puzzle and call Wikipedia,
 * pausing a second or two between requests to stay polite. On a 44-piece map
 * that is well over a minute during which the editor showed nothing at all, then
 * a single "saved successfully" that said nothing about what had happened.
 *
 * Newline-delimited JSON rather than Server-Sent Events, because EventSource
 * only issues GETs and these calls carry the pieces in the body. The client
 * reads the same response as a stream, so nothing else changes: one request, and
 * the last line is the result the caller used to get from res.json().
 */
export interface ProgressReporter {
  /** One line per unit of work, so the editor can draw a bar and a label. */
  step(done: number, total: number, label: string): void;
  /** The final result. Ends the response. */
  finish(payload: Record<string, unknown>): void;
}

export function startProgress(res: Response): ProgressReporter {
  res.writeHead(200, {
    "Content-Type": "application/x-ndjson; charset=utf-8",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
    // Without this a proxy can hold the whole stream back and defeat the point.
    "X-Accel-Buffering": "no",
  });

  const send = (event: Record<string, unknown>) => {
    if (!res.writableEnded) res.write(JSON.stringify(event) + "\n");
  };

  return {
    step(done, total, label) {
      send({ type: "progress", done, total, label });
    },
    finish(payload) {
      send({ type: "done", ...payload });
      if (!res.writableEnded) res.end();
    },
  };
}

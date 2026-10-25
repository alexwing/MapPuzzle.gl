// Small pool of query processes. A query that exceeds the timeout gets its process
// SIGKILLed (the only way to stop a synchronous SQLite call) and a fresh one replaces it.
import { fork } from 'node:child_process';

export class QueryTimeoutError extends Error {}
export class QueryError extends Error {}

export class WorkerPool {
  #options;
  #all = new Set();
  #idle = [];
  #queue = [];
  #closed = false;
  #nextId = 0;

  constructor({ size, workerFile, dbFile, busyTimeoutMs }) {
    this.#options = {
      workerFile,
      env: { ...process.env, GATEWAY_DB_FILE: dbFile, GATEWAY_BUSY_TIMEOUT_MS: String(busyTimeoutMs) },
    };
    for (let i = 0; i < size; i++) this.#idle.push(this.#spawn());
  }

  #spawn() {
    const child = fork(this.#options.workerFile, [], { env: this.#options.env, serialization: 'json' });
    const slot = { child, job: null, dead: false, ready: null };
    this.#all.add(slot);
    slot.ready = new Promise((resolve, reject) => {
      child.once('message', (msg) => (msg?.ready ? resolve() : reject(new Error('bad handshake'))));
      child.once('error', reject);
      child.once('exit', () => reject(new Error('process exited before ready')));
    });
    slot.ready.catch(() => {});
    child.on('message', (msg) => {
      const { job } = slot;
      if (!job || msg.id !== job.id) return;
      slot.job = null;
      clearTimeout(job.timer);
      if (msg.error !== undefined) job.reject(new QueryError(msg.error));
      else job.resolve(msg.json);
      this.#release(slot);
    });
    child.on('error', (error) => this.#replace(slot, error));
    child.on('exit', () => this.#replace(slot, new Error('worker exited')));
    return slot;
  }

  #replace(slot, error) {
    if (slot.dead) return;
    slot.dead = true;
    this.#all.delete(slot);
    this.#idle = this.#idle.filter((s) => s !== slot);
    const { job } = slot;
    slot.job = null;
    if (job) {
      clearTimeout(job.timer);
      job.reject(error);
    }
    slot.child.kill('SIGKILL');
    if (!this.#closed) this.#release(this.#spawn());
  }

  #release(slot) {
    const next = this.#queue.shift();
    if (next) this.#dispatch(slot, next);
    else this.#idle.push(slot);
  }

  async #dispatch(slot, job) {
    try {
      await slot.ready;
    } catch (error) {
      job.reject(new Error(`database unavailable: ${error.message}`));
      this.#replace(slot, error);
      return;
    }
    if (slot.dead) {
      this.#queue.unshift(job);
      return;
    }
    slot.job = job;
    job.timer = setTimeout(
      () => this.#replace(slot, new QueryTimeoutError('query timed out')),
      job.timeoutMs,
    );
    slot.child.send({ id: job.id, sql: job.sql, maxRows: job.maxRows });
  }

  /** Resolves with the rows already serialized as a JSON string. */
  run(sql, { maxRows, timeoutMs }) {
    return new Promise((resolve, reject) => {
      const job = { id: ++this.#nextId, sql, maxRows, timeoutMs, resolve, reject, timer: null };
      const slot = this.#idle.pop();
      if (slot) this.#dispatch(slot, job);
      else this.#queue.push(job);
    });
  }

  close() {
    this.#closed = true;
    for (const slot of this.#all) slot.child.kill('SIGKILL');
  }
}

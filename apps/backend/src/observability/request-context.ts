import { AsyncLocalStorage } from "node:async_hooks";

export type RequestContext = {
  requestId: string;
  sessionId?: string;
  userId?: string;
};

const storage = new AsyncLocalStorage<RequestContext>();

export class RequestContextStore {
  static run<T>(context: RequestContext, callback: () => T) {
    return storage.run(context, callback);
  }

  static get() {
    return storage.getStore();
  }

  static assign(update: Partial<RequestContext>) {
    const current = storage.getStore();
    if (!current) {
      return;
    }

    Object.assign(current, update);
  }
}

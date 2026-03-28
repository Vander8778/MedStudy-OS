import { Injectable } from "@nestjs/common";

export type NotificationDispatch = {
  channel: "in_app";
  type: string;
  userId: string;
  sessionId?: string;
  message: string;
};

@Injectable()
export class NotificationService {
  // MVP stub only: notifications are in-memory and non-durable. This supports orchestration
  // signaling during development but is not an auditable delivery system yet.
  private readonly dispatched: NotificationDispatch[] = [];

  notify(dispatch: NotificationDispatch) {
    this.dispatched.push(dispatch);
    return dispatch;
  }

  listDispatched() {
    return [...this.dispatched];
  }
}

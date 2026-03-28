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
  private readonly dispatched: NotificationDispatch[] = [];

  notify(dispatch: NotificationDispatch) {
    this.dispatched.push(dispatch);
    return dispatch;
  }

  listDispatched() {
    return [...this.dispatched];
  }
}

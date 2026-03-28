import { Injectable } from "@nestjs/common";
import { createId } from "../../common/backend-utils";

@Injectable()
export class AuthService {
  login(email: string) {
    const userId = `user_${email.replace(/[^a-zA-Z0-9]/g, "_") || createId("guest")}`;

    return {
      token: `stub-token:${userId}`,
      user: {
        id: userId,
        email,
        role: "student"
      }
    };
  }

  me() {
    return {
      id: "user_demo",
      email: "demo@medstudy.local",
      role: "student"
    };
  }
}

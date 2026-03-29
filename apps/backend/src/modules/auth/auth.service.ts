import { Injectable } from "@nestjs/common";
import { createId } from "../../common/backend-utils";

@Injectable()
export class AuthService {
  // MVP stub only: no credential verification, no token signing, and no request guards are
  // enforced on mutating endpoints yet. Any caller that can reach the HTTP surface can currently
  // hit session and contract mutation endpoints, so this must be treated as local-dev only until
  // real auth/guard infrastructure lands in a later milestone.
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

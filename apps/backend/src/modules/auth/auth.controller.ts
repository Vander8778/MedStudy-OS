import { Body, Controller, Get, Inject, Post } from "@nestjs/common";
import type { LoginRequest } from "./dto/login.dto";
import { ZodValidationPipe } from "../../common/zod-validation.pipe";
import { loginRequestSchema } from "./dto/login.dto";
import { AuthService } from "./auth.service";

@Controller("auth")
export class AuthController {
  constructor(
    @Inject(AuthService)
    private readonly authService: AuthService
  ) {}

  @Post("login")
  login(@Body(new ZodValidationPipe(loginRequestSchema)) body: LoginRequest) {
    return this.authService.login(body.email);
  }

  @Get("me")
  me() {
    return this.authService.me();
  }
}

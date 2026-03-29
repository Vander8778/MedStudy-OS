import { z } from "zod";
import { emailAddressSchema } from "@medstudy/contracts";

export const loginRequestSchema = z.object({
  email: emailAddressSchema
});

export type LoginRequest = z.infer<typeof loginRequestSchema>;

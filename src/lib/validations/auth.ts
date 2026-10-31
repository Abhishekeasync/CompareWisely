import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().trim().email("Please provide a valid email address."),
  password: z.string().min(8, "Password must be at least 8 characters long."),
});

export const userCreateSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(8, "Password must be at least 8 characters long."),
  name: z.string().trim().min(2, "Name must be at least 2 characters."),
  role: z.enum(["ADMIN", "EDITOR", "MODERATOR"]).default("EDITOR"),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type UserCreateInput = z.infer<typeof userCreateSchema>;

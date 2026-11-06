import { z } from "zod";

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Enter your email address.")
    .email("Enter a valid email address, like name@company.com."),
  password: z
    .string()
    .min(1, "Enter your password.")
    .min(8, "Password must be at least 8 characters."),
});

export const userCreateSchema = z.object({
  email: z.string().trim().min(1, "Enter an email address.").email("Enter a valid email address."),
  password: z.string().min(8, "Password must be at least 8 characters."),
  name: z.string().trim().min(2, "Name must be at least 2 characters.").max(80, "Name must be 80 characters or fewer."),
  role: z.enum(["ADMIN", "EDITOR", "MODERATOR"]).default("EDITOR"),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type UserCreateInput = z.infer<typeof userCreateSchema>;

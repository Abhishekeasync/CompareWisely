import { z } from "zod";

export const newsletterSubscribeSchema = z.object({
  email: z.string().trim().email("Please enter a valid email address."),
  consent: z.literal(true, {
    message: "You must agree to receive email updates.",
  }),
});

export const newsletterUnsubscribeSchema = z.object({
  token: z.string().trim().min(10, "Invalid or expired unsubscribe token."),
});

export type NewsletterSubscribeInput = z.infer<typeof newsletterSubscribeSchema>;
export type NewsletterUnsubscribeInput = z.infer<typeof newsletterUnsubscribeSchema>;

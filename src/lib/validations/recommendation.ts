import { z } from "zod";

export const recommendationAnswersSchema = z.object({
  businessSize: z.enum(["sole", "small", "growing", "mid"], {
    message: "Please select your business size & turnover.",
  }),
  industry: z.enum(["trading", "manufacturing", "services", "distribution"], {
    message: "Please select your primary industry.",
  }),
  budget: z.enum(["low", "mid", "high", "unsure"], {
    message: "Please select your software budget.",
  }),
  userSeats: z.enum(["single", "2_to_5", "6_to_20", "20_plus"]).optional().default("single"),
  monthlyInvoiceVolume: z.enum(["under_100", "100_to_1000", "1000_plus"]).optional().default("under_100"),
  bankAccountsCount: z.enum(["single", "multiple"]).optional().default("single"),
  mustHaveFeatures: z
    .array(
      z.enum([
        "gst",
        "inventory",
        "cloud",
        "payroll",
        "multibranch",
        "api",
        "bank_feeds",
        "offline",
      ])
    )
    .min(1, "Please select at least one must-have capability."),
});

export type RecommendationAnswersInput = z.infer<typeof recommendationAnswersSchema>;

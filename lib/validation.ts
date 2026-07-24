import { z } from "zod";
import { industryIds } from "@/lib/industry";

// E.164: + followed by up to 15 digits, first digit non-zero.
const e164 = z
  .string({
    required_error: "Enter a valid mobile number in international format.",
    invalid_type_error: "Enter a valid mobile number in international format.",
  })
  .trim()
  .regex(/^\+[1-9]\d{6,14}$/, "Enter a valid mobile number in international format.");

export const demoReplySchema = z.object({
  industry: z.enum(industryIds),
  enquiry: z.string().trim().max(500).optional(),
});

export const demoTextSchema = z.object({
  industry: z.enum(industryIds),
  enquiry: z.string().trim().max(500).optional(),
  phone: e164,
  consent: z.literal(true, {
    errorMap: () => ({ message: "Please tick the consent box so we can text you." }),
  }),
});

export const contactSchema = z.object({
  name: z
    .string({ required_error: "Please enter your name.", invalid_type_error: "Please enter your name." })
    .trim()
    .min(1, "Please enter your name.")
    .max(80),
  phone: e164,
  message: z
    .string({ required_error: "Tell us what you need.", invalid_type_error: "Tell us what you need." })
    .trim()
    .min(1, "Tell us what you need.")
    .max(500),
  consent: z.literal(true, {
    errorMap: () => ({ message: "Please tick the box so we can text you back." }),
  }),
});

export type DemoReplyInput = z.infer<typeof demoReplySchema>;
export type DemoTextInput = z.infer<typeof demoTextSchema>;
export type ContactInput = z.infer<typeof contactSchema>;

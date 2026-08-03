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

// Every message here is returned verbatim to the caller, so each constraint
// gets an explicit visitor-facing string. Zod's defaults ("Invalid enum value.
// Expected 'dental' | 'aesthetics' | ...", "String must contain at most 80
// character(s)") echo internal schema detail back and read like a bug report.
const industryField = z.enum(industryIds, {
  errorMap: () => ({ message: "Please pick an industry and try again." }),
});

const enquiryField = z
  .string({ invalid_type_error: "Please check your enquiry and try again." })
  .trim()
  .max(500, "That enquiry is too long.")
  .optional();

export const demoReplySchema = z.object({
  industry: industryField,
  enquiry: enquiryField,
});

export const demoTextSchema = z.object({
  industry: industryField,
  enquiry: enquiryField,
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
    .max(80, "That name is too long."),
  phone: e164,
  message: z
    .string({ required_error: "Tell us what you need.", invalid_type_error: "Tell us what you need." })
    .trim()
    .min(1, "Tell us what you need.")
    .max(500, "That message is too long."),
  consent: z.literal(true, {
    errorMap: () => ({ message: "Please tick the box so we can text you back." }),
  }),
});

export type DemoReplyInput = z.infer<typeof demoReplySchema>;
export type DemoTextInput = z.infer<typeof demoTextSchema>;
export type ContactInput = z.infer<typeof contactSchema>;

import { z } from "zod";

export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters.")
  .max(128, "Password is too long.");

export const telegramSchema = z
  .string()
  .trim()
  .min(5, "Enter a valid Telegram ID.")
  .max(33, "Telegram ID is too long.")
  .regex(
    /^@?[A-Za-z0-9_]{5,32}$/,
    "Telegram ID must be a username like @yourname.",
  )
  .transform((value) => {
    const raw = value.startsWith("@") ? value.slice(1) : value;
    return `@${raw.toLowerCase()}`;
  });

export const signupSchema = z.object({
  password: passwordSchema,
  telegramId: telegramSchema,
});

export const signinSchema = z.object({
  telegramId: telegramSchema,
  password: z.string().min(1, "Password is required.").max(128),
});

export const passwordChangeSchema = z.object({
  currentPassword: z.string().min(1).max(128),
  newPassword: passwordSchema,
});

export const flagsUpdateSchema = z.object({
  flags: z.record(z.string(), z.boolean()),
});

import { z } from "zod";

import {
  DEVICE_LABEL_PATTERN,
  isReservedUsername,
  USERNAME_MAX_LENGTH,
  USERNAME_MIN_LENGTH,
  USERNAME_PATTERN,
} from "@/lib/constants";

const COMMON_PASSWORDS = new Set([
  "123456789012",
  "password1234",
  "password12345",
  "qwerty123456",
  "letmein12345",
  "admin1234567",
  "welcome12345",
  "iloveyou1234",
  "abc123456789",
  "111111111111",
]);

export const nameSchema = z
  .string()
  .trim()
  .min(1, "Name is required")
  .max(80, "Name must be 80 characters or fewer")
  .refine(
    (value) => !/[\u0000-\u001f\u007f]/u.test(value),
    "Name contains invalid characters",
  );

export const usernameSchema = z
  .string()
  .transform((value) => value.trim().toLowerCase())
  .pipe(
    z
      .string()
      .min(
        USERNAME_MIN_LENGTH,
        `Username must be at least ${USERNAME_MIN_LENGTH} characters`,
      )
      .max(
        USERNAME_MAX_LENGTH,
        `Username must be at most ${USERNAME_MAX_LENGTH} characters`,
      )
      .regex(
        USERNAME_PATTERN,
        "Use 3-20 lowercase letters, numbers, underscores, or hyphens; start with a letter",
      ),
  )
  .refine((value) => !isReservedUsername(value), {
    message: "This username is reserved",
  });

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .max(254, "Email is too long")
  .email("Enter a valid email address");

export const passwordSchema = z
  .string()
  .min(12, "Password must be at least 12 characters")
  .max(128, "Password must be at most 128 characters")
  .refine(
    (value) => /[A-Za-z]/.test(value) && /[0-9]/.test(value),
    "Use at least one letter and one number",
  )
  .refine(
    (value) => !COMMON_PASSWORDS.has(value.toLowerCase()),
    "This password is too common",
  );

export const deviceLabelSchema = z
  .string()
  .transform((value) => value.trim().toLowerCase())
  .pipe(
    z
      .string()
      .min(1, "Device label is required")
      .max(40, "Device label must be 40 characters or fewer")
      .regex(
        DEVICE_LABEL_PATTERN,
        "Use lowercase letters, numbers, underscores, or hyphens",
      ),
  );

export const registerSchema = z
  .object({
    name: nameSchema,
    username: usernameSchema,
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  });

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required").max(128),
});

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export const resetPasswordSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  });

export const adminPinSchema = z
  .string()
  .regex(/^\d{8}$/, "PIN must be exactly 8 digits");

export const domainSchema = z
  .string()
  .trim()
  .transform((value) => normalizeDomain(value))
  .pipe(
    z
      .string()
      .min(4, "Domain is too short")
      .max(253, "Domain is too long")
      .regex(
        /^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/,
        "Enter a valid domain name",
      ),
  );

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;

export function firstValidationMessage(error: z.ZodError): string {
  const issue = error.issues[0];
  if (!issue) {
    return "Check the form and try again.";
  }
  if (issue.code === "invalid_type") {
    return "Fill in all required fields and try again.";
  }
  return issue.message;
}

export function normalizeDomain(input: string): string {
  let value = input.trim().toLowerCase();
  while (value.endsWith(".")) {
    value = value.slice(0, -1);
  }
  return value;
}

export function normalizeDnsName(input: string): string {
  let value = input.trim().toLowerCase();
  while (value.endsWith(".")) {
    value = value.slice(0, -1);
  }
  return value;
}

export function passwordStrength(value: string): {
  score: 0 | 1 | 2 | 3 | 4;
  label: string;
} {
  if (!value) {
    return { score: 0, label: "Empty" };
  }
  let score = 0;
  if (value.length >= 12) score += 1;
  if (value.length >= 16) score += 1;
  if (/[a-z]/.test(value) && /[A-Z]/.test(value)) score += 1;
  if (/[0-9]/.test(value) && /[^A-Za-z0-9]/.test(value)) score += 1;
  const clamped = Math.min(4, score) as 0 | 1 | 2 | 3 | 4;
  const labels = ["Very weak", "Weak", "Fair", "Good", "Strong"] as const;
  return { score: clamped, label: labels[clamped] };
}

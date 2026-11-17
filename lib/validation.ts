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
  .min(1, "Nama wajib diisi")
  .max(80, "Nama maksimal 80 karakter")
  .refine(
    (value) => !/[\u0000-\u001f\u007f]/u.test(value),
    "Nama mengandung karakter tidak valid",
  );

export const usernameSchema = z
  .string()
  .transform((value) => value.trim().toLowerCase())
  .pipe(
    z
      .string()
      .min(
        USERNAME_MIN_LENGTH,
        `Username minimal ${USERNAME_MIN_LENGTH} karakter`,
      )
      .max(
        USERNAME_MAX_LENGTH,
        `Username maksimal ${USERNAME_MAX_LENGTH} karakter`,
      )
      .regex(
        USERNAME_PATTERN,
        "Gunakan 3-20 huruf kecil, angka, garis bawah, atau tanda hubung; diawali huruf",
      ),
  )
  .refine((value) => !isReservedUsername(value), {
    message: "Username ini dipakai route dan tidak bisa digunakan",
  });

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .max(254, "Email terlalu panjang")
  .email("Masukkan alamat email yang valid");

export const passwordSchema = z
  .string()
  .min(12, "Kata sandi minimal 12 karakter")
  .max(128, "Kata sandi maksimal 128 karakter")
  .refine(
    (value) => /[A-Za-z]/.test(value) && /[0-9]/.test(value),
    "Gunakan minimal satu huruf dan satu angka",
  )
  .refine(
    (value) => !COMMON_PASSWORDS.has(value.toLowerCase()),
    "Kata sandi ini terlalu umum",
  );

export const deviceLabelSchema = z
  .string()
  .transform((value) => value.trim().toLowerCase())
  .pipe(
    z
      .string()
      .min(1, "Label perangkat wajib diisi")
      .max(40, "Label perangkat maksimal 40 karakter")
      .regex(
        DEVICE_LABEL_PATTERN,
        "Gunakan huruf kecil, angka, garis bawah, atau tanda hubung",
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
    message: "Kata sandi tidak sama",
  });

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Kata sandi wajib diisi").max(128),
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
    message: "Kata sandi tidak sama",
  });

export const adminPinSchema = z
  .string()
  .regex(/^\d{8}$/, "PIN harus tepat 8 digit");

export const domainSchema = z
  .string()
  .trim()
  .transform((value) => normalizeDomain(value))
  .pipe(
    z
      .string()
      .min(4, "Domain terlalu pendek")
      .max(253, "Domain terlalu panjang")
      .regex(
        /^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/,
        "Masukkan nama domain yang valid",
      ),
  );

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;

export function firstValidationMessage(error: z.ZodError): string {
  const issue = error.issues[0];
  if (!issue) {
    return "Periksa formulir dan coba lagi.";
  }
  if (issue.code === "invalid_type") {
    return "Isi semua kolom wajib dan coba lagi.";
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
    return { score: 0, label: "Kosong" };
  }
  let score = 0;
  if (value.length >= 12) score += 1;
  if (value.length >= 16) score += 1;
  if (/[a-z]/.test(value) && /[A-Z]/.test(value)) score += 1;
  if (/[0-9]/.test(value) && /[^A-Za-z0-9]/.test(value)) score += 1;
  const clamped = Math.min(4, score) as 0 | 1 | 2 | 3 | 4;
  const labels = ["Sangat lemah", "Lemah", "Cukup", "Baik", "Kuat"] as const;
  return { score: clamped, label: labels[clamped] };
}

import { z } from "zod";

import { appConfig, planCatalog } from "@/lib/config";

export const authSchema = z.object({
  email: z.string().trim().email("Enter a valid email address."),
  password: z.string().min(8, "Password must be at least 8 characters."),
});

export const signupSchema = authSchema.extend({
  name: z.string().trim().min(2, "Name must be at least 2 characters."),
  plan: z.enum([planCatalog.monthly.id, planCatalog.yearly.id]),
  charityId: z.string().min(1, "Choose a charity."),
  charityPercentage: z.coerce
    .number()
    .min(appConfig.minimumCharityPercentage)
    .max(80),
});

export const scoreSchema = z.object({
  value: z.coerce
    .number()
    .int()
    .min(appConfig.scoreRange.min)
    .max(appConfig.scoreRange.max),
  playedAt: z.string().min(1, "Choose a date."),
});

export const charityPreferenceSchema = z.object({
  charityId: z.string().min(1),
  charityPercentage: z.coerce
    .number()
    .min(appConfig.minimumCharityPercentage)
    .max(80),
});

export const charityCreateSchema = z.object({
  name: z.string().trim().min(2),
  location: z.string().trim().min(2),
  headline: z.string().trim().min(10),
  summary: z.string().trim().min(20),
});

export const claimReviewSchema = z.object({
  claimId: z.string().min(1),
  reviewStatus: z.enum(["pending", "approved", "rejected"]),
  paymentStatus: z.enum(["pending", "processing", "paid", "rejected"]),
  notes: z.string().trim().min(2),
});


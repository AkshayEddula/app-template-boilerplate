import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    tokenIdentifier: v.string(),
    email: v.optional(v.string()),
    name: v.string(),
    goal: v.optional(v.string()),
    experience: v.optional(v.string()),
    is_onboarded: v.boolean(),
    is_agreed_terms: v.boolean(),

    // Global Streak Tracking
    currentStreak: v.optional(v.number()),
    lastCompletedDate: v.optional(v.string()), // "YYYY-MM-DD"
  }).index("by_token", ["tokenIdentifier"]),

  categories: defineTable({
    key: v.union(
      v.literal("health"),
      v.literal("mind"),
      v.literal("career"),
      v.literal("life"),
      v.literal("fun"),
    ),
    name: v.string(),
    icon: v.string(),
    description: v.string(),
    order: v.number(),
    characterName: v.string(),
    characterTheme: v.string(),
  }).index("by_key", ["key"]),

  characterStages: defineTable({
    categoryKey: v.union(
      v.literal("health"),
      v.literal("mind"),
      v.literal("career"),
      v.literal("life"),
      v.literal("fun"),
    ),
    stage: v.number(),
    stageName: v.string(),
    minXp: v.number(),
    staticImageUrl: v.string(),
    videoUrl: v.optional(v.string()),
    message: v.string(),
  }).index("by_category_stage", ["categoryKey", "stage"]),

  userCategoryStats: defineTable({
    userId: v.string(),
    categoryKey: v.string(),
    totalXp: v.number(),
    currentStreak: v.number(),
  }).index("by_user_category", ["userId", "categoryKey"]),

  resolutionTemplates: defineTable({
    categoryKey: v.union(
      v.literal("health"),
      v.literal("mind"),
      v.literal("career"),
      v.literal("life"),
      v.literal("fun"),
    ),
    title: v.string(),
    description: v.string(),
    trackingType: v.union(
      v.literal("yes_no"),
      v.literal("time_based"),
      v.literal("count_based"),
    ),
    suggestedTargetTime: v.optional(v.number()),
    suggestedTargetCount: v.optional(v.number()),
    suggestedCountUnit: v.optional(v.string()),
    suggestedFrequency: v.union(
      v.literal("daily"),
      v.literal("weekdays"),
      v.literal("weekends"),
      v.literal("custom"),
      v.literal("x_days_per_week"),
    ),
    suggestedDaysPerWeek: v.optional(v.number()),
    isPopular: v.boolean(),
    order: v.number(),
  })
    .index("by_category", ["categoryKey"])
    .index("by_category_popular", ["categoryKey", "isPopular"]),

  userResolutions: defineTable({
    userId: v.string(),
    categoryKey: v.union(
      v.literal("health"),
      v.literal("mind"),
      v.literal("career"),
      v.literal("life"),
      v.literal("fun"),
    ),
    title: v.string(),
    description: v.optional(v.string()),
    trackingType: v.union(
      v.literal("yes_no"),
      v.literal("time_based"),
      v.literal("count_based"),
    ),
    targetTime: v.optional(v.number()),
    targetCount: v.optional(v.number()),
    countUnit: v.optional(v.string()),
    frequencyType: v.union(
      v.literal("daily"),
      v.literal("weekdays"),
      v.literal("weekends"),
      v.literal("custom"),
      v.literal("x_days_per_week"),
    ),
    customDays: v.optional(v.array(v.number())),
    daysPerWeek: v.optional(v.number()),
    isActive: v.boolean(),
    startDate: v.number(),
    endDate: v.optional(v.number()),
    templateId: v.optional(v.id("resolutionTemplates")),
    createdAt: v.number(),
    updatedAt: v.number(),

    // --- STREAK TRACKING ---
    currentStreak: v.optional(v.number()),
    bestStreak: v.optional(v.number()), // <--- ADDED THIS
    lastCompletedDate: v.optional(v.string()),
  })
    .index("by_user", ["userId"])
    .index("by_category", ["categoryKey"])
    .index("by_user_and_category", ["userId", "categoryKey"])
    .index("by_user_active", ["userId", "isActive"]),

  dailyLogs: defineTable({
    userResolutionId: v.id("userResolutions"),
    userId: v.string(),
    date: v.string(),
    currentValue: v.number(),
    isCompleted: v.boolean(),
  })
    .index("by_user_date", ["userId", "date"])
    .index("by_resolution_date", ["userResolutionId", "date"]),

  dailyCategoryStats: defineTable({
    userId: v.string(),
    categoryKey: v.string(),
    date: v.string(),
    xpEarned: v.number(),
    totalResolutionsCount: v.number(),
    completedResolutionsCount: v.number(),
  }).index("by_user_category_date", ["userId", "categoryKey", "date"]),
});

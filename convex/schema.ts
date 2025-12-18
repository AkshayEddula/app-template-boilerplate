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
    }).index("by_token", ["tokenIdentifier"]),
    categories: defineTable({
        key: v.union(
            v.literal("health"),
            v.literal("mind"),
            v.literal("career"),
            v.literal("life"),
            v.literal("fun")
        ),
        name: v.string(),
        icon: v.string(),
        description: v.string(),
        order: v.number()
    }).index("by_key", ["key"]),
    resolutionTemplates: defineTable({
        categoryKey: v.union(
            v.literal("health"),
            v.literal("mind"),
            v.literal("career"),
            v.literal("life"),
            v.literal("fun")
        ),

        title: v.string(), // "Drink Water", "Go to Gym", "Read a Book"
        description: v.string(),

        // Suggested tracking type
        trackingType: v.union(
            v.literal("yes_no"),
            v.literal("time_based"),
            v.literal("count_based")
        ),

        // Suggested targets (user can modify)
        suggestedTargetTime: v.optional(v.number()), // For time-based (in minutes)
        suggestedTargetCount: v.optional(v.number()), // For count-based
        suggestedCountUnit: v.optional(v.string()), // "glasses", "pages", "reps"

        // Suggested frequency
        suggestedFrequency: v.union(
            v.literal("daily"),
            v.literal("weekdays"),
            v.literal("weekends"),
            v.literal("custom"),
            v.literal("x_days_per_week")
        ),
        suggestedDaysPerWeek: v.optional(v.number()),

        // Metadata
        isPopular: v.boolean(), // Featured templates
        order: v.number(), // Display order within category
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
            v.literal("fun")
        ),

        // Resolution details
        title: v.string(),
        description: v.optional(v.string()),

        // Tracking type
        trackingType: v.union(
            v.literal("yes_no"),
            v.literal("time_based"),
            v.literal("count_based")
        ),

        // For time-based tracking (in minutes)
        targetTime: v.optional(v.number()), // 5-60 minutes

        // For count-based tracking
        targetCount: v.optional(v.number()),
        countUnit: v.optional(v.string()), // "glasses", "pages", "reps"

        // Frequency settings
        frequencyType: v.union(
            v.literal("daily"),        // Every day
            v.literal("weekdays"),     // Monday-Friday
            v.literal("weekends"),     // Saturday-Sunday
            v.literal("custom"),       // Specific days
            v.literal("x_days_per_week") // e.g., 5 days per week
        ),

        // For custom frequency - array of days (0=Sunday, 1=Monday, ..., 6=Saturday)
        customDays: v.optional(v.array(v.number())),

        // For x_days_per_week
        daysPerWeek: v.optional(v.number()), // 1-7

        // Status
        isActive: v.boolean(),
        startDate: v.number(), // timestamp
        endDate: v.optional(v.number()), // optional end date

        // Link to template if created from one
        templateId: v.optional(v.id("resolutionTemplates")),

        createdAt: v.number(),
        updatedAt: v.number(),
    })
        .index("by_user", ["userId"])
        .index("by_category", ["categoryKey"])
        .index("by_user_and_category", ["userId", "categoryKey"])
        .index("by_user_active", ["userId", "isActive"]),
    dailyLogs: defineTable({
        userResolutionId: v.id("userResolutions"),
        userId: v.string(), // Denormalized for easy access
        date: v.string(),   // Format: "YYYY-MM-DD" (Client determines timezone)

        // The actual value logged (e.g., 30 mins, 5 cups, or 1 for yes)
        currentValue: v.number(),

        // Helper to quickly know if this specific task was "done"
        isCompleted: v.boolean(),
    })
        .index("by_user_date", ["userId", "date"])
        .index("by_resolution_date", ["userResolutionId", "date"]),
    dailyCategoryStats: defineTable({
        userId: v.string(),
        categoryKey: v.string(), // "health", "mind", etc.
        date: v.string(),        // "YYYY-MM-DD"

        xpEarned: v.number(),    // e.g. 50 (if 1/2 tasks done), 100 (if 2/2 done)
        totalResolutionsCount: v.number(), // How many active tasks were there?
        completedResolutionsCount: v.number(), // How many did they finish?
    }).index("by_user_category_date", ["userId", "categoryKey", "date"]),
    userCategoryStats: defineTable({
        userId: v.string(),
        categoryKey: v.string(),
        totalXp: v.number(), // Cumulative XP forever
        currentStreak: v.number(), // Optional: fun to track
    }).index("by_user_category", ["userId", "categoryKey"]),
});
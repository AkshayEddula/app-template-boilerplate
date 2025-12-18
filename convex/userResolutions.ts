import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Create a new user resolution
export const create = mutation({
    args: {
        categoryKey: v.union(
            v.literal("health"),
            v.literal("mind"),
            v.literal("career"),
            v.literal("life"),
            v.literal("fun")
        ),
        title: v.string(),
        description: v.optional(v.string()),
        trackingType: v.union(
            v.literal("yes_no"),
            v.literal("time_based"),
            v.literal("count_based")
        ),
        targetTime: v.optional(v.number()),
        targetCount: v.optional(v.number()),
        countUnit: v.optional(v.string()),
        frequencyType: v.union(
            v.literal("daily"),
            v.literal("weekdays"),
            v.literal("weekends"),
            v.literal("custom"),
            v.literal("x_days_per_week")
        ),
        customDays: v.optional(v.array(v.number())),
        daysPerWeek: v.optional(v.number()),
        isActive: v.boolean(),
        templateId: v.optional(v.id("resolutionTemplates")),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new Error("Not authenticated");
        }

        const user = await ctx.db
            .query("users")
            .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
            .unique();

        if (!user) {
            throw new Error("User not found");
        }

        const resolutionId = await ctx.db.insert("userResolutions", {
            userId: user._id,
            categoryKey: args.categoryKey,
            title: args.title,
            description: args.description,
            trackingType: args.trackingType,
            targetTime: args.targetTime,
            targetCount: args.targetCount,
            countUnit: args.countUnit,
            frequencyType: args.frequencyType,
            customDays: args.customDays,
            daysPerWeek: args.daysPerWeek,
            isActive: args.isActive,
            startDate: Date.now(),
            templateId: args.templateId,
            createdAt: Date.now(),
            updatedAt: Date.now(),
        });

        // Mark user as onboarded after creating their first resolution
        if (!user.is_onboarded) {
            await ctx.db.patch(user._id, {
                is_onboarded: true,
            });
        }

        return resolutionId;
    },
});

// Get all active resolutions for current user
export const listActive = query({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            return [];
        }

        const user = await ctx.db
            .query("users")
            .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
            .unique();

        if (!user) {
            return [];
        }

        return await ctx.db
            .query("userResolutions")
            .withIndex("by_user_active", (q) =>
                q.eq("userId", user._id).eq("isActive", true)
            )
            .collect();
    },
});

// Get resolutions by category for current user
export const listByCategory = query({
    args: {
        categoryKey: v.union(
            v.literal("health"),
            v.literal("mind"),
            v.literal("career"),
            v.literal("life"),
            v.literal("fun")
        ),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            return [];
        }

        const user = await ctx.db
            .query("users")
            .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
            .unique();

        if (!user) {
            return [];
        }

        return await ctx.db
            .query("userResolutions")
            .withIndex("by_user_and_category", (q) =>
                q.eq("userId", user._id).eq("categoryKey", args.categoryKey)
            )
            .filter((q) => q.eq(q.field("isActive"), true))
            .collect();
    },
});
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

const DAILY_MAX_XP = 100;

export const logProgress = mutation({
    args: {
        userResolutionId: v.id("userResolutions"),
        date: v.string(), // Client sends "2025-12-17"
        value: v.number(), // e.g., 1 (for yes), 30 (minutes), 5 (count)
    },
    handler: async (ctx, args) => {
        // 1. Get the resolution details
        const resolution = await ctx.db.get(args.userResolutionId);
        if (!resolution) throw new Error("Resolution not found");

        // 2. Determine if completed based on tracking type
        let isCompleted = false;
        if (resolution.trackingType === "yes_no") {
            isCompleted = args.value > 0;
        } else if (resolution.trackingType === "time_based") {
            const targetSeconds = (resolution.targetTime || 0) * 60;
            isCompleted = args.value >= targetSeconds;
        } else if (resolution.trackingType === "count_based") {
            isCompleted = args.value >= (resolution.targetCount || 0);
        }

        // 3. Update or Insert the Daily Log
        const existingLog = await ctx.db
            .query("dailyLogs")
            .withIndex("by_resolution_date", (q) =>
                q.eq("userResolutionId", args.userResolutionId).eq("date", args.date)
            )
            .first();

        if (existingLog) {
            await ctx.db.patch(existingLog._id, {
                currentValue: args.value,
                isCompleted: isCompleted,
            });
        } else {
            await ctx.db.insert("dailyLogs", {
                userResolutionId: args.userResolutionId,
                userId: resolution.userId,
                date: args.date,
                currentValue: args.value,
                isCompleted: isCompleted,
            });
        }

        // ---------------------------------------------------------
        // 4. TRIGGER THE XP CALCULATION (The "Averaging" Logic)
        // ---------------------------------------------------------

        // A. Find all resolutions for this user in this category
        // NOTE: In a real app, you might filter this list by "isActive" and check "startDate"
        // to ensure you only count valid resolutions for this specific date.
        const categoryResolutions = await ctx.db
            .query("userResolutions")
            .withIndex("by_user_and_category", (q) =>
                q.eq("userId", resolution.userId).eq("categoryKey", resolution.categoryKey)
            )
            .collect();

        // Filter only those active and relevant for the day (Simplified for now)
        const activeResolutions = categoryResolutions.filter(r => r.isActive);

        // B. Count how many are completed TODAY
        let completedCount = 0;

        for (const res of activeResolutions) {
            // Check the logs for each resolution for this date
            const log = await ctx.db
                .query("dailyLogs")
                .withIndex("by_resolution_date", (q) =>
                    q.eq("userResolutionId", res._id).eq("date", args.date)
                )
                .first();

            if (log && log.isCompleted) {
                completedCount++;
            }
        }

        // C. Calculate the Score
        const totalCount = activeResolutions.length;
        // Avoid division by zero
        const completionPercentage = totalCount === 0 ? 0 : completedCount / totalCount;
        const newDailyXp = Math.round(completionPercentage * DAILY_MAX_XP);

        // D. Update Daily Stats & Global Stats
        // First, find the existing daily stat to see if we need to adjust the global total
        const existingDailyStat = await ctx.db
            .query("dailyCategoryStats")
            .withIndex("by_user_category_date", (q) =>
                q.eq("userId", resolution.userId)
                    .eq("categoryKey", resolution.categoryKey)
                    .eq("date", args.date)
            )
            .first();

        const previousXpForDay = existingDailyStat ? existingDailyStat.xpEarned : 0;
        const xpDifference = newDailyXp - previousXpForDay;

        // Save the Daily Snapshot
        if (existingDailyStat) {
            await ctx.db.patch(existingDailyStat._id, {
                xpEarned: newDailyXp,
                completedResolutionsCount: completedCount,
                totalResolutionsCount: totalCount
            });
        } else {
            await ctx.db.insert("dailyCategoryStats", {
                userId: resolution.userId,
                categoryKey: resolution.categoryKey,
                date: args.date,
                xpEarned: newDailyXp,
                completedResolutionsCount: completedCount,
                totalResolutionsCount: totalCount
            });
        }

        // E. Update the All-Time User Stats (Global XP)
        const userStats = await ctx.db
            .query("userCategoryStats")
            .withIndex("by_user_category", (q) =>
                q.eq("userId", resolution.userId).eq("categoryKey", resolution.categoryKey)
            )
            .first();

        if (userStats) {
            await ctx.db.patch(userStats._id, {
                totalXp: userStats.totalXp + xpDifference,
            });
        } else {
            await ctx.db.insert("userCategoryStats", {
                userId: resolution.userId,
                categoryKey: resolution.categoryKey,
                totalXp: newDailyXp,
                currentStreak: 1, // Start streak
            });
        }

        return {
            success: true,
            newDailyXp,
            totalCategoryXp: userStats ? userStats.totalXp + xpDifference : newDailyXp
        };
    },
});

export const getTodayLogs = query({
    args: { date: v.string() }, // Format: "YYYY-MM-DD"
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return [];

        const user = await ctx.db
            .query("users")
            .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
            .unique();

        if (!user) return [];

        // Fetch all logs for this user for this specific date
        return await ctx.db
            .query("dailyLogs")
            .withIndex("by_user_date", (q) => q.eq("userId", user._id).eq("date", args.date))
            .collect();
    },
});
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// --- GAMIFICATION CONSTANTS ---
const DAILY_MAX_BASE_XP = 100;
const XP_PER_COMPLETION = 10;
const XP_DAILY_STREAK = 10;

const MILESTONE_BONUSES: Record<number, number> = {
  3: 50,
  7: 100,
  14: 200,
  30: 500,
  60: 1000,
};

// --- HELPERS ---

function isResolutionScheduledForDate(resolution: any, dateString: string) {
  const dateObj = new Date(dateString);
  const dayOfWeek = dateObj.getUTCDay();

  if (resolution.frequencyType === "daily") return true;
  if (resolution.frequencyType === "weekdays")
    return dayOfWeek >= 1 && dayOfWeek <= 5;
  if (resolution.frequencyType === "weekends")
    return dayOfWeek === 0 || dayOfWeek === 6;
  if (resolution.frequencyType === "custom" && resolution.customDays) {
    return resolution.customDays.includes(dayOfWeek);
  }
  if (resolution.frequencyType === "x_days_per_week") return true;

  return false;
}

function getPreviousScheduledDate(
  resolution: any,
  currentDateStr: string,
): string | null {
  if (
    resolution.frequencyType === "daily" ||
    resolution.frequencyType === "x_days_per_week"
  ) {
    const d = new Date(currentDateStr);
    d.setDate(d.getDate() - 1);
    return d.toISOString().split("T")[0];
  }

  const d = new Date(currentDateStr);
  for (let i = 1; i <= 14; i++) {
    d.setDate(d.getDate() - 1);
    const checkDate = d.toISOString().split("T")[0];
    if (isResolutionScheduledForDate(resolution, checkDate)) {
      return checkDate;
    }
  }
  return null;
}

function getYesterday(dateString: string) {
  const d = new Date(dateString);
  d.setDate(d.getDate() - 1);
  return d.toISOString().split("T")[0];
}

// --- MUTATIONS ---

export const logProgress = mutation({
  args: {
    userResolutionId: v.id("userResolutions"),
    date: v.string(),
    value: v.number(),
  },
  handler: async (ctx, args) => {
    // 1. Get Resolution
    const resolution = await ctx.db.get(args.userResolutionId);
    if (!resolution) throw new Error("Resolution not found");

    // 2. Determine if completed
    let isCompleted = false;
    if (resolution.trackingType === "yes_no") {
      isCompleted = args.value > 0;
    } else if (resolution.trackingType === "time_based") {
      const targetSeconds = (resolution.targetTime || 0) * 60;
      isCompleted = args.value >= targetSeconds;
    } else if (resolution.trackingType === "count_based") {
      isCompleted = args.value >= (resolution.targetCount || 0);
    }

    // 3. Update Daily Log
    const existingLog = await ctx.db
      .query("dailyLogs")
      .withIndex("by_resolution_date", (q) =>
        q.eq("userResolutionId", args.userResolutionId).eq("date", args.date),
      )
      .first();

    const wasAlreadyCompleted = existingLog?.isCompleted || false;

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

    let instantBonusXp = 0;
    if (isCompleted && !wasAlreadyCompleted) {
      instantBonusXp += XP_PER_COMPLETION;
    }

    // 4. Streak Engine (Updated with Best Streak Logic)
    if (isCompleted && !wasAlreadyCompleted) {
      const lastResDate = resolution.lastCompletedDate;
      const previousScheduled = getPreviousScheduledDate(resolution, args.date);

      let newResStreak = resolution.currentStreak || 0;

      if (lastResDate === args.date) {
        // Already counted today
      } else if (lastResDate === previousScheduled) {
        newResStreak += 1;
      } else {
        newResStreak = 1;
      }

      // Calculate Best Streak
      const currentBest = resolution.bestStreak || 0;
      const newBestStreak = Math.max(newResStreak, currentBest);

      await ctx.db.patch(resolution._id, {
        currentStreak: newResStreak,
        bestStreak: newBestStreak, // Save new record
        lastCompletedDate: args.date,
      });

      // Global User Streak
      const userId = resolution.userId as Id<"users">;
      const user = await ctx.db.get(userId);

      if (user) {
        const lastUserDate = user.lastCompletedDate;
        const yesterday = getYesterday(args.date);

        let newUserStreak = user.currentStreak || 0;
        let streakIncremented = false;

        if (lastUserDate === args.date) {
          // Already counted today
        } else if (lastUserDate === yesterday) {
          newUserStreak += 1;
          streakIncremented = true;
        } else {
          newUserStreak = 1;
          streakIncremented = true;
        }

        if (streakIncremented) {
          instantBonusXp += XP_DAILY_STREAK;
          if (MILESTONE_BONUSES[newUserStreak]) {
            instantBonusXp += MILESTONE_BONUSES[newUserStreak];
          }
        }

        await ctx.db.patch(user._id, {
          currentStreak: newUserStreak,
          lastCompletedDate: args.date,
        });
      }
    }

    // 5. XP Calculation
    const categoryResolutions = await ctx.db
      .query("userResolutions")
      .withIndex("by_user_and_category", (q) =>
        q
          .eq("userId", resolution.userId)
          .eq("categoryKey", resolution.categoryKey),
      )
      .collect();

    const todaysResolutions = categoryResolutions.filter(
      (r) => r.isActive && isResolutionScheduledForDate(r, args.date),
    );

    let completedCount = 0;
    for (const res of todaysResolutions) {
      const log = await ctx.db
        .query("dailyLogs")
        .withIndex("by_resolution_date", (q) =>
          q.eq("userResolutionId", res._id).eq("date", args.date),
        )
        .first();

      if (log && log.isCompleted) {
        completedCount++;
      }
    }

    const totalCount = todaysResolutions.length;
    const completionPercentage =
      totalCount === 0 ? 0 : completedCount / totalCount;
    const currentBaseXpState = Math.round(
      completionPercentage * DAILY_MAX_BASE_XP,
    );

    const existingDailyStat = await ctx.db
      .query("dailyCategoryStats")
      .withIndex("by_user_category_date", (q) =>
        q
          .eq("userId", resolution.userId)
          .eq("categoryKey", resolution.categoryKey)
          .eq("date", args.date),
      )
      .first();

    let previousBaseXpState = 0;
    if (existingDailyStat) {
      const prevCompletedCount =
        isCompleted && !wasAlreadyCompleted
          ? completedCount - 1
          : !isCompleted && wasAlreadyCompleted
            ? completedCount + 1
            : completedCount;

      const prevPercentage =
        totalCount === 0 ? 0 : prevCompletedCount / totalCount;
      previousBaseXpState = Math.round(prevPercentage * DAILY_MAX_BASE_XP);
    }

    const baseXpDelta = currentBaseXpState - previousBaseXpState;
    const totalXpChange = baseXpDelta + instantBonusXp;
    const newTotalDailyXp = (existingDailyStat?.xpEarned || 0) + totalXpChange;

    if (existingDailyStat) {
      await ctx.db.patch(existingDailyStat._id, {
        xpEarned: newTotalDailyXp,
        completedResolutionsCount: completedCount,
        totalResolutionsCount: totalCount,
      });
    } else {
      await ctx.db.insert("dailyCategoryStats", {
        userId: resolution.userId,
        categoryKey: resolution.categoryKey,
        date: args.date,
        xpEarned: totalXpChange,
        completedResolutionsCount: completedCount,
        totalResolutionsCount: totalCount,
      });
    }

    const userStats = await ctx.db
      .query("userCategoryStats")
      .withIndex("by_user_category", (q) =>
        q
          .eq("userId", resolution.userId)
          .eq("categoryKey", resolution.categoryKey),
      )
      .first();

    let finalTotalXp = totalXpChange;
    if (userStats) {
      finalTotalXp = userStats.totalXp + totalXpChange;
      await ctx.db.patch(userStats._id, {
        totalXp: finalTotalXp,
      });
    } else {
      await ctx.db.insert("userCategoryStats", {
        userId: resolution.userId,
        categoryKey: resolution.categoryKey,
        totalXp: finalTotalXp,
        currentStreak: 1,
      });
    }

    return {
      success: true,
      newDailyXp: newTotalDailyXp,
      totalCategoryXp: finalTotalXp,
      xpGainedNow: totalXpChange,
    };
  },
});

export const getTodayLogs = query({
  args: { date: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique();

    if (!user) return [];

    return await ctx.db
      .query("dailyLogs")
      .withIndex("by_user_date", (q) =>
        q.eq("userId", user._id).eq("date", args.date),
      )
      .collect();
  },
});

// convex/resolutions.ts

// ... existing imports

export const getResolutionAnalytics = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique();

    if (!user) return [];

    const resolutions = await ctx.db
      .query("userResolutions")
      .withIndex("by_user_active", (q) =>
        q.eq("userId", user._id).eq("isActive", true),
      )
      .collect();

    // CHANGE: Fetch 30 days instead of 7
    const last30Days: string[] = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      last30Days.push(d.toISOString().split("T")[0]);
    }

    const analyticsData = await Promise.all(
      resolutions.map(async (res) => {
        const history = await Promise.all(
          last30Days.map(async (date) => {
            const log = await ctx.db
              .query("dailyLogs")
              .withIndex("by_resolution_date", (q) =>
                q.eq("userResolutionId", res._id).eq("date", date),
              )
              .first();

            let rawValue = 0;
            if (log) {
              if (res.trackingType === "yes_no") {
                rawValue = log.isCompleted ? 100 : 0;
              } else if (res.trackingType === "count_based") {
                const target = res.targetCount || 1;
                rawValue = (log.currentValue / target) * 100;
              } else if (res.trackingType === "time_based") {
                const targetMin = res.targetTime || 1;
                const targetSec = targetMin * 60;
                rawValue = (log.currentValue / targetSec) * 100;
              }
            }

            const value = Math.max(0, Math.min(rawValue, 100));
            const dateObj = new Date(date);
            // Return numeric day for graph labels
            const dayLabel = dateObj.getDate().toString();

            return { date, day: dayLabel, value };
          }),
        );

        return {
          ...res,
          history, // Now contains 30 items
        };
      }),
    );

    return analyticsData;
  },
});

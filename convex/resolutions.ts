import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel"; // <--- ADD THIS IMPORT

const DAILY_MAX_XP = 100;

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
    // 1. Get the resolution details
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

    // 3. Update or Insert Daily Log
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

    // ---------------------------------------------------------
    // 4. STREAK ENGINE (Fixed Types)
    // ---------------------------------------------------------

    if (isCompleted && !wasAlreadyCompleted) {
      // A. Update Resolution Streak
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

      await ctx.db.patch(resolution._id, {
        currentStreak: newResStreak,
        lastCompletedDate: args.date,
      });

      // B. Update Global User Streak
      // FIX: Cast string ID to typed ID so TS knows it's a User
      const userId = resolution.userId as Id<"users">;
      const user = await ctx.db.get(userId);

      if (user) {
        const lastUserDate = user.lastCompletedDate;
        const yesterday = getYesterday(args.date);

        let newUserStreak = user.currentStreak || 0;

        if (lastUserDate === args.date) {
          // Already counted today
        } else if (lastUserDate === yesterday) {
          newUserStreak += 1;
        } else {
          newUserStreak = 1;
        }

        await ctx.db.patch(user._id, {
          currentStreak: newUserStreak,
          lastCompletedDate: args.date,
        });
      }
    }

    // ---------------------------------------------------------
    // 5. XP CALCULATION
    // ---------------------------------------------------------

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
    const newDailyXp = Math.round(completionPercentage * DAILY_MAX_XP);

    const existingDailyStat = await ctx.db
      .query("dailyCategoryStats")
      .withIndex("by_user_category_date", (q) =>
        q
          .eq("userId", resolution.userId)
          .eq("categoryKey", resolution.categoryKey)
          .eq("date", args.date),
      )
      .first();

    const previousXpForDay = existingDailyStat ? existingDailyStat.xpEarned : 0;
    const xpDifference = newDailyXp - previousXpForDay;

    if (existingDailyStat) {
      await ctx.db.patch(existingDailyStat._id, {
        xpEarned: newDailyXp,
        completedResolutionsCount: completedCount,
        totalResolutionsCount: totalCount,
      });
    } else {
      await ctx.db.insert("dailyCategoryStats", {
        userId: resolution.userId,
        categoryKey: resolution.categoryKey,
        date: args.date,
        xpEarned: newDailyXp,
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

    if (userStats) {
      await ctx.db.patch(userStats._id, {
        totalXp: userStats.totalXp + xpDifference,
      });
    } else {
      await ctx.db.insert("userCategoryStats", {
        userId: resolution.userId,
        categoryKey: resolution.categoryKey,
        totalXp: newDailyXp,
        currentStreak: 1,
      });
    }

    return {
      success: true,
      newDailyXp,
      totalCategoryXp: userStats
        ? userStats.totalXp + xpDifference
        : newDailyXp,
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

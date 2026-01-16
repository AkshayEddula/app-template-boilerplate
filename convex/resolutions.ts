import { v } from "convex/values";
import { Id } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";

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

export const create = mutation({
  args: {
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
    templateId: v.optional(v.id("resolutionTemplates")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique();

    if (!user) throw new Error("User not found");

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

    if (!user.is_onboarded) {
      await ctx.db.patch(user._id, {
        is_onboarded: true,
      });
    }

    return resolutionId;
  },
});

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

    // 4. Streak Engine & Bonus Calculation
    let bonusXp = 0;
    let newUserStreak = 0;

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

      const currentBest = resolution.bestStreak || 0;
      const newBestStreak = Math.max(newResStreak, currentBest);

      await ctx.db.patch(resolution._id, {
        currentStreak: newResStreak,
        bestStreak: newBestStreak,
        lastCompletedDate: args.date,
      });

      // Global User Streak
      const userId = resolution.userId as Id<"users">;
      const user = await ctx.db.get(userId);

      if (user) {
        const lastUserDate = user.lastCompletedDate;
        const yesterday = getYesterday(args.date);

        newUserStreak = user.currentStreak || 0;
        let isNewDayStreak = false;

        if (lastUserDate === args.date) {
          // Already counted today, keep current streak
          newUserStreak = user.currentStreak || 1;
        } else if (lastUserDate === yesterday) {
          newUserStreak += 1;
          isNewDayStreak = true;
        } else {
          newUserStreak = 1;
          isNewDayStreak = true;
        }

        // Add streak milestone bonus (only on the day you hit it)
        if (isNewDayStreak && MILESTONE_BONUSES[newUserStreak]) {
          bonusXp += MILESTONE_BONUSES[newUserStreak];
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
    const completionPercentage = totalCount === 0 ? 0 : completedCount / totalCount;

    // Base XP = percentage of max 100
    const baseXp = Math.round(completionPercentage * DAILY_MAX_BASE_XP);

    // Get existing daily stat
    const existingDailyStat = await ctx.db
      .query("dailyCategoryStats")
      .withIndex("by_user_category_date", (q) =>
        q
          .eq("userId", resolution.userId)
          .eq("categoryKey", resolution.categoryKey)
          .eq("date", args.date),
      )
      .first();

    // Daily reward: +10 XP for first completion in this category today
    let dailyReward = 0;
    const hadCompletionsBefore = existingDailyStat && existingDailyStat.completedResolutionsCount > 0;
    if (isCompleted && !wasAlreadyCompleted && !hadCompletionsBefore) {
      dailyReward = XP_DAILY_STREAK; // +10 XP daily base reward
    }

    // Calculate total daily XP for this category
    const currentDailyXp = baseXp + dailyReward + bonusXp;
    const previousDailyXp = existingDailyStat?.xpEarned || 0;

    // XP change is the difference (handles un-completing too)
    const previousBaseXp = existingDailyStat
      ? Math.round((existingDailyStat.completedResolutionsCount / (existingDailyStat.totalResolutionsCount || 1)) * DAILY_MAX_BASE_XP)
      : 0;
    const baseXpChange = baseXp - previousBaseXp;
    const xpChange = baseXpChange + dailyReward + bonusXp;

    // Update or create daily stat
    if (existingDailyStat) {
      await ctx.db.patch(existingDailyStat._id, {
        xpEarned: existingDailyStat.xpEarned + xpChange,
        completedResolutionsCount: completedCount,
        totalResolutionsCount: totalCount,
      });
    } else {
      await ctx.db.insert("dailyCategoryStats", {
        userId: resolution.userId,
        categoryKey: resolution.categoryKey,
        date: args.date,
        xpEarned: currentDailyXp,
        completedResolutionsCount: completedCount,
        totalResolutionsCount: totalCount,
      });
    }

    // Update lifetime category XP
    const userStats = await ctx.db
      .query("userCategoryStats")
      .withIndex("by_user_category", (q) =>
        q
          .eq("userId", resolution.userId)
          .eq("categoryKey", resolution.categoryKey),
      )
      .first();

    const newDailyTotal = existingDailyStat ? existingDailyStat.xpEarned + xpChange : currentDailyXp;

    let finalTotalXp = xpChange;
    if (userStats) {
      finalTotalXp = userStats.totalXp + xpChange;
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
      newDailyXp: newDailyTotal,
      totalCategoryXp: finalTotalXp,
      xpGainedNow: xpChange > 0 ? xpChange : 0,
    };
  },
});

// --- QUERIES ---

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

export const listActive = query({
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

    const rawResolutions = await ctx.db
      .query("userResolutions")
      .withIndex("by_user_active", (q) =>
        q.eq("userId", user._id).eq("isActive", true),
      )
      .collect();

    // --- APPLY STREAK CHECK (FIX) ---
    const today = new Date().toISOString().split("T")[0];
    return rawResolutions.map((res) => {
      const lastCompleted = res.lastCompletedDate;
      let displayStreak = res.currentStreak || 0;

      if (displayStreak > 0 && lastCompleted !== today) {
        const previousScheduled = getPreviousScheduledDate(res, today);
        if (lastCompleted !== previousScheduled) {
          displayStreak = 0;
        }
      }
      return { ...res, currentStreak: displayStreak };
    });
  },
});

export const listByCategory = query({
  args: {
    categoryKey: v.union(
      v.literal("health"),
      v.literal("mind"),
      v.literal("career"),
      v.literal("life"),
      v.literal("fun"),
    ),
  },
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

    const rawResolutions = await ctx.db
      .query("userResolutions")
      .withIndex("by_user_and_category", (q) =>
        q.eq("userId", user._id).eq("categoryKey", args.categoryKey),
      )
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    // --- APPLY STREAK CHECK (FIX) ---
    const today = new Date().toISOString().split("T")[0];
    return rawResolutions.map((res) => {
      const lastCompleted = res.lastCompletedDate;
      let displayStreak = res.currentStreak || 0;

      if (displayStreak > 0 && lastCompleted !== today) {
        const previousScheduled = getPreviousScheduledDate(res, today);
        if (lastCompleted !== previousScheduled) {
          displayStreak = 0;
        }
      }
      return { ...res, currentStreak: displayStreak };
    });
  },
});

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

    const last30Days: string[] = [];
    const today = new Date().toISOString().split("T")[0];

    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      last30Days.push(d.toISOString().split("T")[0]);
    }

    const analyticsData = await Promise.all(
      resolutions.map(async (res) => {
        // --- APPLY STREAK CHECK (FIX) ---
        const lastCompleted = res.lastCompletedDate;
        let displayStreak = res.currentStreak || 0;

        if (displayStreak > 0 && lastCompleted !== today) {
          const previousScheduled = getPreviousScheduledDate(res, today);
          if (lastCompleted !== previousScheduled) {
            displayStreak = 0;
          }
        }

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
            const dayLabel = dateObj.getDate().toString();

            return { date, day: dayLabel, value };
          }),
        );

        return {
          ...res,
          currentStreak: displayStreak,
          history,
        };
      }),
    );

    return analyticsData;
  },
});

// --- EDIT & DELETE MUTATIONS ---

export const edit = mutation({
  args: {
    id: v.id("userResolutions"),
    // All fields are optional to allow partial updates
    categoryKey: v.optional(
      v.union(
        v.literal("health"),
        v.literal("mind"),
        v.literal("career"),
        v.literal("life"),
        v.literal("fun"),
      ),
    ),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    trackingType: v.optional(
      v.union(
        v.literal("yes_no"),
        v.literal("time_based"),
        v.literal("count_based"),
      ),
    ),
    targetTime: v.optional(v.number()),
    targetCount: v.optional(v.number()),
    countUnit: v.optional(v.string()),
    frequencyType: v.optional(
      v.union(
        v.literal("daily"),
        v.literal("weekdays"),
        v.literal("weekends"),
        v.literal("custom"),
        v.literal("x_days_per_week"),
      ),
    ),
    customDays: v.optional(v.array(v.number())),
    daysPerWeek: v.optional(v.number()),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique();

    if (!user) throw new Error("User not found");

    // 1. Fetch the existing resolution
    const resolution = await ctx.db.get(args.id);

    // 2. Security Check: Ensure resolution exists and belongs to this user
    if (!resolution || resolution.userId !== user._id) {
      throw new Error("Resolution not found or unauthorized");
    }

    // 3. Prepare updates (remove 'id' from the object)
    const { id, ...updates } = args;

    // 4. Update
    await ctx.db.patch(id, {
      ...updates,
      updatedAt: Date.now(),
    });
  },
});

export const deleteResolution = mutation({
  args: {
    id: v.id("userResolutions"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique();

    if (!user) throw new Error("User not found");

    // 1. Fetch existing
    const resolution = await ctx.db.get(args.id);

    // 2. Security Check
    if (!resolution || resolution.userId !== user._id) {
      throw new Error("Resolution not found or unauthorized");
    }

    // 3. CLEAN UP: Delete associated Daily Logs to prevent orphaned data
    // (Note: We keep 'dailyCategoryStats' and 'userCategoryStats' as those form the user's
    // historical XP record, which they should keep even if they delete the specific task).
    const logs = await ctx.db
      .query("dailyLogs")
      .withIndex("by_resolution_date", (q) => q.eq("userResolutionId", args.id))
      .collect();

    for (const log of logs) {
      await ctx.db.delete(log._id);
    }

    // 4. Delete the Resolution
    await ctx.db.delete(args.id);
  },
});

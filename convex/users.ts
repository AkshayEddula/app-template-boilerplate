import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const storeUser = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Called storeUser without authentication present");
    }

    // 1. Check if user already exists
    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique();

    // 2. If user exists, return their status immediately
    if (user !== null) {
      return {
        userId: user._id,
        is_onboarded: user.is_onboarded,
      };
    }

    // 3. If user DOES NOT exist, create them with DEFAULTS
    const newUserId = await ctx.db.insert("users", {
      tokenIdentifier: identity.tokenIdentifier,
      email: identity.email,
      name: identity.name ?? "user",
      is_onboarded: false, // Default
      is_agreed_terms: true, // Default
    });

    return {
      userId: newUserId,
      is_onboarded: false,
    };
  },
});

export const completeOnboarding = mutation({
  args: {
    goal: v.string(),
    experience: v.string(),
    is_onboarded: v.boolean(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique();

    if (!user) throw new Error("User not found");

    await ctx.db.patch(user._id, {
      is_onboarded: args.is_onboarded,
      goal: args.goal,
      experience: args.experience,
    });
  },
});

export const updateProfile = mutation({
  args: {
    name: v.optional(v.string()),
    goal: v.optional(v.string()),
    experience: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique();

    if (!user) throw new Error("User not found");

    const updates: any = {};
    if (args.name !== undefined) updates.name = args.name;
    if (args.goal !== undefined) updates.goal = args.goal;
    if (args.experience !== undefined) updates.experience = args.experience;

    await ctx.db.patch(user._id, updates);
  },
});

export const currentUser = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }
    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique();

    if (!user) return null;

    // --- GLOBAL STREAK CHECK (FIX) ---
    // Calculate if the global streak is stale.
    // Logic: If last completed date was not today or yesterday, reset to 0.
    const today = new Date().toISOString().split("T")[0];
    const yesterdayObj = new Date();
    yesterdayObj.setDate(yesterdayObj.getDate() - 1);
    const yesterday = yesterdayObj.toISOString().split("T")[0];

    let displayStreak = user.currentStreak || 0;
    const lastDate = user.lastCompletedDate;

    // If streak is active but last activity was before yesterday...
    if (displayStreak > 0 && lastDate !== today && lastDate !== yesterday) {
      displayStreak = 0;
    }

    return { ...user, currentStreak: displayStreak };
  },
});

export const deleteUser = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique();

    if (!user) return; // User already gone

    // Delete the user record
    await ctx.db.delete(user._id);
  },
});

export const updateSubscription = mutation({
  args: {
    isPremium: v.boolean(),
    subscriptionExpiry: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      console.warn("Called updateSubscription without authentication");
      return;
    }

    // Find the user
    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique();

    if (!user) throw new Error("User not found");

    // Patch the user with new subscription info
    await ctx.db.patch(user._id, {
      isPremium: args.isPremium,
      subscriptionExpiry: args.subscriptionExpiry,
    });
  },
});

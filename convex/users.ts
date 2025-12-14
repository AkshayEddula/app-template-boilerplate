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
                q.eq("tokenIdentifier", identity.tokenIdentifier)
            )
            .unique();

        // 2. If user exists, return their status immediately
        if (user !== null) {
            return {
                userId: user._id,
                is_onboarded: user.is_onboarded
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
            is_onboarded: false
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
            .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
            .unique();

        if (!user) throw new Error("User not found");

        await ctx.db.patch(user._id, {
            is_onboarded: args.is_onboarded,
            goal: args.goal,
            experience: args.experience,
        });
    },
});

export const currentUser = query({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            return null;
        }
        return await ctx.db
            .query("users")
            .withIndex("by_token", (q) =>
                q.eq("tokenIdentifier", identity.tokenIdentifier)
            )
            .unique();
    },
});
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const getForCurrentUser = query({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();

        if (!identity) {
            throw new Error("Not authenticated");
        }

        return await ctx.db
            .query("messages")
            .filter((q) => q.eq(q.field("userId"), identity.subject))
            .collect();
    },
});

export const add = mutation({
    args: { text: v.string() },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();

        if (!identity) {
            throw new Error("Not authenticated");
        }

        await ctx.db.insert("messages", {
            text: args.text,
            userId: identity.subject,
            author: identity.email || "Anonymous",
        });
    },
});
import { query } from "./_generated/server";

export const getMyStats = query({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return [];

        const user = await ctx.db
            .query("users")
            .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
            .unique();

        if (!user) return [];

        return await ctx.db
            .query("userCategoryStats")
            .withIndex("by_user_category", (q) => q.eq("userId", user._id))
            .collect();
    },
});
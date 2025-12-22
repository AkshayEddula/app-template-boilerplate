import { query } from "./_generated/server";

export const getMyStats = query({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return [];

        // 1. Get the User ID
        const user = await ctx.db
            .query("users")
            .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
            .unique();

        if (!user) return [];

        // 2. Get today's date string (YYYY-MM-DD) for filtering daily logs
        const today = new Date().toISOString().split("T")[0];

        // 3. Fetch Lifetime Stats (Total XP)
        const totalStats = await ctx.db
            .query("userCategoryStats")
            .withIndex("by_user_category", (q) => q.eq("userId", user._id))
            .collect();

        // 4. Fetch Today's Stats (XP earned today)
        // We assume your schema has 'dailyCategoryStats' indexed by user/date
        const dailyStats = await ctx.db
            .query("dailyCategoryStats")
            // Note: Ensure you have an index named "by_user_date" or similar that supports this query.
            // Based on your schema: .index("by_user_category_date", ["userId", "categoryKey", "date"])
            // We can't query purely by date with that specific index easily without iterating, 
            // but usually, fetching all today's stats for a user is efficient enough.
            .filter((q) =>
                q.and(
                    q.eq(q.field("userId"), user._id),
                    q.eq(q.field("date"), today)
                )
            )
            .collect();

        // 5. Merge them for all 5 categories
        // We map over a fixed list to ensure the UI always gets all 5 categories, even if empty.
        const categories = ["health", "mind", "career", "life", "fun"];

        return categories.map((catKey) => {
            const total = totalStats.find((s) => s.categoryKey === catKey);
            const daily = dailyStats.find((s) => s.categoryKey === catKey);

            return {
                categoryKey: catKey,
                totalXp: total?.totalXp || 0,
                // MAP 'xpEarned' from daily stats to 'todayXp' for frontend
                todayXp: daily?.xpEarned || 0,
                currentStreak: total?.currentStreak || 0,
            };
        });
    },
});
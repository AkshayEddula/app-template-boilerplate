import { query } from "./_generated/server";

// Get all categories ordered by display order
export const list = query({
    args: {},
    handler: async (ctx) => {
        const categories = await ctx.db.query("categories").collect();
        // Sort by order field
        return categories.sort((a, b) => a.order - b.order);
    },
});
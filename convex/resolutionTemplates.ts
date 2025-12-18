import { v } from "convex/values";
import { query } from "./_generated/server";

// Get templates by category
export const listByCategory = query({
    args: {
        categoryKey: v.union(
            v.literal("health"),
            v.literal("mind"),
            v.literal("career"),
            v.literal("life"),
            v.literal("fun")
        ),
    },
    handler: async (ctx, args) => {
        const templates = await ctx.db
            .query("resolutionTemplates")
            .withIndex("by_category", (q) => q.eq("categoryKey", args.categoryKey))
            .collect();

        // Sort by order field
        return templates.sort((a, b) => a.order - b.order);
    },
});

// Get all popular templates
export const listPopular = query({
    args: {},
    handler: async (ctx) => {
        const templates = await ctx.db
            .query("resolutionTemplates")
            .filter((q) => q.eq(q.field("isPopular"), true))
            .collect();

        // Sort by category and order
        return templates.sort((a, b) => {
            if (a.categoryKey === b.categoryKey) {
                return a.order - b.order;
            }
            return a.categoryKey.localeCompare(b.categoryKey);
        });
    },
});
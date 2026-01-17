import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const get = query({
    args: {},
    handler: async (ctx) => {
        return await ctx.db.query("app_config").first();
    },
});

// Mutation to update or create app config
export const set = mutation({
    args: {
        minSupportedAppVersion: v.string(),
        latestAppVersion: v.string(),
        isMaintenanceMode: v.optional(v.boolean()),
        storeUrl: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const existing = await ctx.db.query("app_config").first();

        if (existing) {
            await ctx.db.patch(existing._id, {
                minSupportedAppVersion: args.minSupportedAppVersion,
                latestAppVersion: args.latestAppVersion,
                isMaintenanceMode: args.isMaintenanceMode,
                storeUrl: args.storeUrl,
            });
            return existing._id;
        } else {
            return await ctx.db.insert("app_config", {
                minSupportedAppVersion: args.minSupportedAppVersion,
                latestAppVersion: args.latestAppVersion,
                isMaintenanceMode: args.isMaintenanceMode,
                storeUrl: args.storeUrl,
            });
        }
    },
});

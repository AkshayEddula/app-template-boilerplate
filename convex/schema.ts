import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
    users: defineTable({
        tokenIdentifier: v.string(),
        email: v.optional(v.string()),
        name: v.string(),
        goal: v.optional(v.string()),
        experience: v.optional(v.string()),
        is_onboarded: v.boolean(),
        is_agreed_terms: v.boolean(),
    }).index("by_token", ["tokenIdentifier"]),
    messages: defineTable({
        text: v.string(),
        userId: v.string(),
        author: v.string(),
    }).index("by_user", ["userId"]),
});
import { mutation } from "./_generated/server";

// Run this ONCE to create the 5 categories
export const seedCategories = mutation({
    args: {},
    handler: async (ctx) => {
        // Check if categories already exist
        const existing = await ctx.db.query("categories").first();
        if (existing) {
            return { success: false, message: "Categories already exist!" };
        }

        // Insert all 5 categories
        const categories = [
            {
                key: "health" as const,
                name: "Health",
                icon: "💧",
                description: "Water, food, sleep, fitness",
                order: 1,
            },
            {
                key: "mind" as const,
                name: "Mind",
                icon: "🧠",
                description: "Reading, meditation, learning, journaling",
                order: 2,
            },
            {
                key: "career" as const,
                name: "Career",
                icon: "💼",
                description: "Coding, job prep, projects, business",
                order: 3,
            },
            {
                key: "life" as const,
                name: "Life",
                icon: "🧭",
                description: "Discipline, routines, digital detox, habits",
                order: 4,
            },
            {
                key: "fun" as const,
                name: "Fun",
                icon: "🎨",
                description: "Hobbies, creativity, travel, relaxation",
                order: 5,
            },
        ];

        // Insert each category
        for (const category of categories) {
            await ctx.db.insert("categories", category);
        }

        return {
            success: true,
            message: "5 categories created successfully!"
        };
    },
});
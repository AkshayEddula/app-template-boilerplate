import { mutation } from "./_generated/server";

export const resetAndSeed = mutation({
    args: {},
    handler: async (ctx) => {
        // --- STEP 1: WIPE OLD DATA ---
        console.log("Deleting old categories...");
        const oldCategories = await ctx.db.query("categories").collect();
        for (const cat of oldCategories) {
            await ctx.db.delete(cat._id);
        }

        console.log("Deleting old stages...");
        const oldStages = await ctx.db.query("characterStages").collect();
        for (const stage of oldStages) {
            await ctx.db.delete(stage._id);
        }

        // --- STEP 2: INSERT NEW DATA (With Characters) ---
        console.log("Seeding new data...");

        const categories = [
            {
                key: "health" as const,
                name: "Health",
                icon: "💧",
                description: "Water, food, sleep, fitness",
                order: 1,
                characterName: "Vita",
                characterTheme: "Energy, balance, vitality",
            },
            {
                key: "mind" as const,
                name: "Mind",
                icon: "🧠",
                description: "Reading, meditation, learning, journaling",
                order: 2,
                characterName: "Aeris",
                characterTheme: "Clarity, thought, awareness",
            },
            {
                key: "career" as const,
                name: "Career",
                icon: "💼",
                description: "Coding, job prep, projects, business",
                order: 3,
                characterName: "Forge",
                characterTheme: "Building, effort, discipline",
            },
            {
                key: "life" as const,
                name: "Life",
                icon: "🧭",
                description: "Discipline, routines, digital detox, habits",
                order: 4,
                characterName: "Axis",
                characterTheme: "Stability, routine, alignment",
            },
            {
                key: "fun" as const,
                name: "Fun",
                icon: "🎨",
                description: "Hobbies, creativity, travel, relaxation",
                order: 5,
                characterName: "Pulse",
                characterTheme: "Creativity, joy, expression",
            },
        ];

        for (const cat of categories) {
            await ctx.db.insert("categories", cat);
        }

        // --- STEP 3: SEED STAGES ---
        const stageConfigs = [
            { stage: 1, name: "Seed", minXp: 0, msg: "Every journey starts small." },
            { stage: 2, name: "Rise", minXp: 501, msg: "Momentum is building." },
            { stage: 3, name: "Flow", minXp: 1501, msg: "This is becoming natural." },
            { stage: 4, name: "Ascend", minXp: 3501, msg: "This is who you are now." },
        ];

        const categoryKeys = ["health", "mind", "career", "life", "fun"] as const;

        for (const key of categoryKeys) {
            for (const config of stageConfigs) {
                await ctx.db.insert("characterStages", {
                    categoryKey: key,
                    stage: config.stage,
                    stageName: config.name,
                    minXp: config.minXp,
                    message: config.msg,
                    staticImageUrl: `https://i.pinimg.com/1200x/b5/2b/cc/b52bcc299ce26819fe7b47444c8dffab.jpg`,
                    videoUrl: undefined,
                });
            }
        }

        return "Database fixed! Old data deleted, new characters created.";
    },
});
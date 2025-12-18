import { mutation } from "./_generated/server";

// Run this ONCE to create resolution templates
export const seedTemplates = mutation({
    args: {},
    handler: async (ctx) => {
        // Check if templates already exist
        const existing = await ctx.db.query("resolutionTemplates").first();
        if (existing) {
            return { success: false, message: "Templates already exist!" };
        }

        const templates = [
            // ============================================
            // HEALTH TEMPLATES
            // ============================================
            {
                categoryKey: "health" as const,
                title: "Drink 8 Glasses of Water",
                description: "Stay hydrated throughout the day",
                trackingType: "count_based" as const,
                suggestedTargetCount: 8,
                suggestedCountUnit: "glasses",
                suggestedFrequency: "daily" as const,
                isPopular: true,
                order: 1,
            },
            {
                categoryKey: "health" as const,
                title: "Exercise",
                description: "Get your body moving with any physical activity",
                trackingType: "time_based" as const,
                suggestedTargetTime: 30,
                suggestedFrequency: "x_days_per_week" as const,
                suggestedDaysPerWeek: 5,
                isPopular: true,
                order: 2,
            },
            {
                categoryKey: "health" as const,
                title: "Go to the Gym",
                description: "Strength training and cardio workout",
                trackingType: "yes_no" as const,
                suggestedFrequency: "x_days_per_week" as const,
                suggestedDaysPerWeek: 3,
                isPopular: true,
                order: 3,
            },
            {
                categoryKey: "health" as const,
                title: "Sleep 8 Hours",
                description: "Get quality rest for recovery",
                trackingType: "time_based" as const,
                suggestedTargetTime: 480, // 8 hours in minutes
                suggestedFrequency: "daily" as const,
                isPopular: false,
                order: 4,
            },
            {
                categoryKey: "health" as const,
                title: "Eat Vegetables",
                description: "Include vegetables in your meals",
                trackingType: "count_based" as const,
                suggestedTargetCount: 5,
                suggestedCountUnit: "servings",
                suggestedFrequency: "daily" as const,
                isPopular: false,
                order: 5,
            },

            // ============================================
            // MIND TEMPLATES
            // ============================================
            {
                categoryKey: "mind" as const,
                title: "Read a Book",
                description: "Expand your knowledge and imagination",
                trackingType: "time_based" as const,
                suggestedTargetTime: 20,
                suggestedFrequency: "daily" as const,
                isPopular: true,
                order: 1,
            },
            {
                categoryKey: "mind" as const,
                title: "Meditate",
                description: "Practice mindfulness and mental clarity",
                trackingType: "time_based" as const,
                suggestedTargetTime: 10,
                suggestedFrequency: "daily" as const,
                isPopular: true,
                order: 2,
            },
            {
                categoryKey: "mind" as const,
                title: "Journal",
                description: "Write down your thoughts and reflections",
                trackingType: "yes_no" as const,
                suggestedFrequency: "daily" as const,
                isPopular: true,
                order: 3,
            },
            {
                categoryKey: "mind" as const,
                title: "Learn Something New",
                description: "Take an online course or watch educational content",
                trackingType: "time_based" as const,
                suggestedTargetTime: 30,
                suggestedFrequency: "x_days_per_week" as const,
                suggestedDaysPerWeek: 5,
                isPopular: false,
                order: 4,
            },
            {
                categoryKey: "mind" as const,
                title: "Practice Gratitude",
                description: "List 3 things you're grateful for",
                trackingType: "yes_no" as const,
                suggestedFrequency: "daily" as const,
                isPopular: false,
                order: 5,
            },

            // ============================================
            // CAREER TEMPLATES
            // ============================================
            {
                categoryKey: "career" as const,
                title: "Code Practice",
                description: "Work on programming skills and projects",
                trackingType: "time_based" as const,
                suggestedTargetTime: 60,
                suggestedFrequency: "weekdays" as const,
                isPopular: true,
                order: 1,
            },
            {
                categoryKey: "career" as const,
                title: "Apply to Jobs",
                description: "Send out job applications",
                trackingType: "count_based" as const,
                suggestedTargetCount: 3,
                suggestedCountUnit: "applications",
                suggestedFrequency: "weekdays" as const,
                isPopular: true,
                order: 2,
            },
            {
                categoryKey: "career" as const,
                title: "Work on Side Project",
                description: "Build your portfolio or business",
                trackingType: "time_based" as const,
                suggestedTargetTime: 90,
                suggestedFrequency: "weekends" as const,
                isPopular: true,
                order: 3,
            },
            {
                categoryKey: "career" as const,
                title: "Network",
                description: "Connect with professionals in your field",
                trackingType: "yes_no" as const,
                suggestedFrequency: "x_days_per_week" as const,
                suggestedDaysPerWeek: 2,
                isPopular: false,
                order: 4,
            },
            {
                categoryKey: "career" as const,
                title: "Update Resume/Portfolio",
                description: "Keep your professional materials current",
                trackingType: "yes_no" as const,
                suggestedFrequency: "custom" as const,
                isPopular: false,
                order: 5,
            },

            // ============================================
            // LIFE TEMPLATES
            // ============================================
            {
                categoryKey: "life" as const,
                title: "Morning Routine",
                description: "Start your day with intention",
                trackingType: "yes_no" as const,
                suggestedFrequency: "daily" as const,
                isPopular: true,
                order: 1,
            },
            {
                categoryKey: "life" as const,
                title: "Digital Detox",
                description: "No phone/social media for set time",
                trackingType: "time_based" as const,
                suggestedTargetTime: 60,
                suggestedFrequency: "daily" as const,
                isPopular: true,
                order: 2,
            },
            {
                categoryKey: "life" as const,
                title: "Clean/Organize",
                description: "Tidy up your living space",
                trackingType: "yes_no" as const,
                suggestedFrequency: "x_days_per_week" as const,
                suggestedDaysPerWeek: 3,
                isPopular: true,
                order: 3,
            },
            {
                categoryKey: "life" as const,
                title: "No Procrastination",
                description: "Complete tasks without delay",
                trackingType: "yes_no" as const,
                suggestedFrequency: "weekdays" as const,
                isPopular: false,
                order: 4,
            },
            {
                categoryKey: "life" as const,
                title: "Budget Review",
                description: "Track expenses and manage finances",
                trackingType: "yes_no" as const,
                suggestedFrequency: "custom" as const,
                isPopular: false,
                order: 5,
            },

            // ============================================
            // FUN TEMPLATES
            // ============================================
            {
                categoryKey: "fun" as const,
                title: "Play Music/Instrument",
                description: "Practice or enjoy making music",
                trackingType: "time_based" as const,
                suggestedTargetTime: 30,
                suggestedFrequency: "x_days_per_week" as const,
                suggestedDaysPerWeek: 4,
                isPopular: true,
                order: 1,
            },
            {
                categoryKey: "fun" as const,
                title: "Draw/Paint",
                description: "Express yourself through art",
                trackingType: "time_based" as const,
                suggestedTargetTime: 30,
                suggestedFrequency: "x_days_per_week" as const,
                suggestedDaysPerWeek: 3,
                isPopular: true,
                order: 2,
            },
            {
                categoryKey: "fun" as const,
                title: "Call a Friend/Family",
                description: "Stay connected with loved ones",
                trackingType: "yes_no" as const,
                suggestedFrequency: "x_days_per_week" as const,
                suggestedDaysPerWeek: 2,
                isPopular: true,
                order: 3,
            },
            {
                categoryKey: "fun" as const,
                title: "Try New Recipe",
                description: "Cook something you've never made",
                trackingType: "yes_no" as const,
                suggestedFrequency: "weekends" as const,
                isPopular: false,
                order: 4,
            },
            {
                categoryKey: "fun" as const,
                title: "Watch Movie/Show",
                description: "Relax and enjoy entertainment",
                trackingType: "yes_no" as const,
                suggestedFrequency: "weekends" as const,
                isPopular: false,
                order: 5,
            },
        ];

        // Insert all templates
        for (const template of templates) {
            await ctx.db.insert("resolutionTemplates", template);
        }

        return {
            success: true,
            message: `${templates.length} templates created successfully!`
        };
    },
});
import { query } from "./_generated/server";

// 1. Get My Stats (Existing function)
export const getMyStats = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique();

    if (!user) return [];

    const today = new Date().toISOString().split("T")[0];

    const totalStats = await ctx.db
      .query("userCategoryStats")
      .withIndex("by_user_category", (q) => q.eq("userId", user._id))
      .collect();

    const dailyStats = await ctx.db
      .query("dailyCategoryStats")
      .filter((q) =>
        q.and(q.eq(q.field("userId"), user._id), q.eq(q.field("date"), today)),
      )
      .collect();

    const categories = ["health", "mind", "career", "life", "fun"];

    const allStages = await ctx.db.query("characterStages").collect();

    return categories.map((catKey) => {
      const total = totalStats.find((s) => s.categoryKey === catKey);
      const daily = dailyStats.find((s) => s.categoryKey === catKey);

      const currentXp = total?.totalXp || 0;

      // Find current stage image
      const catStages = allStages
        .filter((s) => s.categoryKey === catKey)
        .sort((a, b) => a.minXp - b.minXp); // Sort by minXp ascending

      // Default to first stage if no XP
      let currentStage = catStages[0];

      // Find the highest stage where minXp <= currentXp
      for (const stage of catStages) {
        if (currentXp >= stage.minXp) {
          currentStage = stage;
        } else {
          break; // Optimization: stops once we hit a stage higher than current XP
        }
      }

      return {
        categoryKey: catKey,
        totalXp: currentXp,
        todayXp: daily?.xpEarned || 0,
        currentStreak: total?.currentStreak || 0,
        imageUrl: currentStage?.staticImageUrl?.replace(/\$0$/, "") || "",
      };
    });
  },
});

// 2. Get All Cards (UPDATED)
export const getAllCards = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique();

    if (!user) return [];

    // Get User's XP Stats
    const userStats = await ctx.db
      .query("userCategoryStats")
      .withIndex("by_user_category", (q) => q.eq("userId", user._id))
      .collect();

    // Get ALL Stages
    const allStages = await ctx.db.query("characterStages").collect();

    // Group stages to find the "Ceiling" (maxXp)
    const stagesByCategory: Record<string, any[]> = {};
    allStages.forEach((s) => {
      if (!stagesByCategory[s.categoryKey])
        stagesByCategory[s.categoryKey] = [];
      stagesByCategory[s.categoryKey].push(s);
    });

    // Sort stages
    Object.values(stagesByCategory).forEach((list) =>
      list.sort((a, b) => a.stage - b.stage),
    );

    const cards = allStages.map((stage) => {
      const stats = userStats.find((s) => s.categoryKey === stage.categoryKey);
      const currentXp = stats?.totalXp || 0;

      const catList = stagesByCategory[stage.categoryKey];
      const currentIndex = catList.findIndex((s) => s._id === stage._id);
      const nextStage = catList[currentIndex + 1];

      // FIX: Subtract 1 from next stage to get the INCLUSIVE max for this stage.
      // If Stage 2 starts at 501, Stage 1 ends at 500.
      const maxXp = nextStage ? nextStage.minXp - 1 : 1000000;

      return {
        _id: stage._id,
        categoryKey: stage.categoryKey,
        stage: stage.stage,
        stageName: stage.stageName,
        image: stage.staticImageUrl.replace(/\$0$/, ""),
        minXp: stage.minXp,
        maxXp: maxXp,
        isUnlocked: currentXp >= stage.minXp,
        currentXp: currentXp,
        message: stage.message,
      };
    });

    // Sort for display
    const categoryOrder = { health: 1, mind: 2, career: 3, life: 4, fun: 5 };
    return cards.sort((a, b) => {
      // @ts-ignore
      const catDiff =
        (categoryOrder[a.categoryKey] || 99) -
        (categoryOrder[b.categoryKey] || 99);
      if (catDiff !== 0) return catDiff;
      return a.stage - b.stage;
    });
  },
});

import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image"; // Updated import
import { LinearGradient } from "expo-linear-gradient";
import { useState } from "react";
import { ActivityIndicator, Dimensions, Text, View } from "react-native";

const SCREEN_WIDTH = Dimensions.get("window").width;

// ... (Keep constants: CATEGORY_ICONS, CHARACTER_NAMES, etc.) ...

const CATEGORY_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  health: "heart",
  mind: "prism",
  career: "briefcase",
  life: "compass",
  fun: "sparkles",
};

const CHARACTER_NAMES: Record<string, string> = {
  health: "Vita",
  mind: "Aeris",
  career: "Forge",
  life: "Axis",
  fun: "Pulse",
};

const CHARACTER_TITLES: Record<string, string> = {
  health: "The Vitality Keeper",
  mind: "The Architect of Thought",
  career: "The Iron Builder",
  life: "The Core Navigator",
  fun: "The Spirit of Joy",
};

const CHARACTER_LORE: Record<string, string> = {
  health:
    "Born from the first heartbeat. Vita thrives when you move and hydrate. Neglect fades her light; action makes her burn bright.",
  mind: "A being of pure intellect. Aeris grows clearer with every page read. Feed him knowledge to unlock his true form.",
  career:
    "Forged in the fires of ambition. He doesn't ask for luck; he asks for discipline. Build your empire, and Forge will stand guard.",
  life: "The silent observer of your habits. Axis aligns when you find balance. Consistency is his fuel.",
  fun: "The echo of your laughter. Pulse explodes in color when you explore, create, and let go of the grind.",
};

const CATEGORY_COLORS: Record<string, string> = {
  health: "#10B981", // Emerald
  mind: "#8B5CF6", // Violet
  career: "#3B82F6", // Blue
  life: "#F59E0B", // Amber
  fun: "#EC4899", // Pink
  default: "#94A3B8", // Slate
};

export const STAGES = [
  { stage: 1, name: "Seed", minXp: 0 },
  { stage: 2, name: "Rise", minXp: 501 },
  { stage: 3, name: "Flow", minXp: 1501 },
  { stage: 4, name: "Ascend", minXp: 3501 },
];

export const getCurrentStageInfo = (xp: number) => {
  let current = STAGES[0];
  let next = STAGES[1];

  for (let i = 0; i < STAGES.length; i++) {
    if (xp >= STAGES[i].minXp) {
      current = STAGES[i];
      next = STAGES[i + 1] || null;
    }
  }
  return { current, next };
};

export const CharacterCard = ({
  categoryKey,
  imageUrl,
  xp,
  scale = 1,
  isEquipped = false,
  isCompleted = false,
}: {
  categoryKey: string;
  imageUrl: string;
  xp: number;
  scale?: number;
  isEquipped?: boolean;
  isCompleted?: boolean;
}) => {
  const [isLoading, setIsLoading] = useState(true); // Default to true to show loader immediately

  const { current, next } = getCurrentStageInfo(xp);
  const color = CATEGORY_COLORS[categoryKey] || CATEGORY_COLORS.default;
  const name = CHARACTER_NAMES[categoryKey] || "Character";
  const title = CHARACTER_TITLES[categoryKey] || "Companion";
  const lore = CHARACTER_LORE[categoryKey] || "A loyal companion.";

  // XP Math
  const rangeStart = current.minXp;
  const rangeEnd = next ? next.minXp : current.minXp * 1.5;
  const progressPercent =
    Math.min(Math.max((xp - rangeStart) / (rangeEnd - rangeStart), 0), 1) * 100;
  const xpRemaining = next ? next.minXp - xp : 0;

  // Card Dimensions
  const CARD_WIDTH = SCREEN_WIDTH * 0.9;
  const CARD_HEIGHT = CARD_WIDTH * 1.5;

  // Determine Border Color based on status
  const borderColor = isEquipped
    ? "#10B981" // Green
    : isCompleted
      ? "#F59E0B" // Gold
      : `${color}40`; // Default dim color

  return (
    <View
      style={{
        width: CARD_WIDTH * scale,
        height: CARD_HEIGHT * scale,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <View
        style={{
          transform: [{ scale }],
          width: CARD_WIDTH,
          height: CARD_HEIGHT,
          shadowColor: color,
          shadowOffset: { width: 0, height: 20 },
          shadowOpacity: 0.5,
          shadowRadius: 32,
          elevation: 24,
        }}
      >
        {/* 1. FRAME */}
        <View
          className="flex-1 rounded-[40px] overflow-hidden bg-black relative"
        >
          {/* IMAGE LAYER */}
          <Image
            source={imageUrl}
            style={{ position: 'absolute', width: "100%", height: "100%" }}
            contentFit="cover"
            transition={500}
            onLoadStart={() => setIsLoading(true)}
            onLoad={() => setIsLoading(false)}
          />

          {/* LOADING LAYER */}
          {isLoading && (
            <View className="absolute inset-0 items-center justify-center bg-zinc-900 z-10">
              <ActivityIndicator size="small" color={color} />
            </View>
          )}

          {/* 2. GRADIENT */}
          <LinearGradient
            colors={[
              "transparent",
              "rgba(0,0,0,0.2)",
              "rgba(0,0,0,0.8)",
              "#000000",
            ]}
            locations={[0, 0.5, 0.75, 1]}
            style={{ position: "absolute", width: "100%", height: "100%", zIndex: 20 }}
          />

          {/* --- CONTENT LAYER (z-30) --- */}
          <View className="flex-1 z-30">
            {/* --- HEADER (Left) --- */}
            <View className="absolute top-6 left-6">
              <View className="flex-row items-center px-3 py-1.5 rounded-full border border-white/10 bg-black/30 backdrop-blur-md">
                <Ionicons
                  name={CATEGORY_ICONS[categoryKey]}
                  size={10}
                  color={color}
                />
                <Text className="text-white text-[10px] font-generalsans-bold uppercase ml-1.5 tracking-wider">
                  {categoryKey}
                </Text>
              </View>
            </View>

            {/* --- STATUS BADGES (Right) --- */}
            {isEquipped && (
              <View className="absolute top-6 right-6">
                <View
                  className="flex-row items-center px-3 py-1.5 rounded-full border bg-black/60 backdrop-blur-md"
                  style={{
                    borderColor: "#10B981",
                    backgroundColor: "rgba(16, 185, 129, 0.1)",
                  }}
                >
                  <Ionicons name="radio-button-on" size={12} color="#34D399" />
                  <Text className="text-[#34D399] text-[10px] font-generalsans-bold uppercase ml-1.5 tracking-wider">
                    Equipped
                  </Text>
                </View>
              </View>
            )}

            {isCompleted && !isEquipped && (
              <View className="absolute top-6 right-6">
                <View
                  className="flex-row items-center px-3 py-1.5 rounded-full border bg-black/60 backdrop-blur-md"
                  style={{
                    borderColor: "#F59E0B",
                    backgroundColor: "rgba(245, 158, 11, 0.1)",
                  }}
                >
                  <Ionicons name="checkmark-circle" size={12} color="#FBBF24" />
                  <Text className="text-[#FBBF24] text-[10px] font-generalsans-bold uppercase ml-1.5 tracking-wider">
                    Collected
                  </Text>
                </View>
              </View>
            )}

            {/* --- BODY CONTENT --- */}
            <View className="flex-1 justify-end px-7 pb-8">
              <View className="mb-6">
                <Text
                  className="text-[11px] font-generalsans-bold uppercase tracking-[-0.5px] mb-1"
                  style={{ color: color }}
                >
                  {title}
                </Text>
                <Text className="text-white text-[42px] leading-[44px] font-bricolagegrotesk-semibold tracking-[-3px] mb-3">
                  {name}
                </Text>
                <Text className="text-slate-300 text-[12px] tracking-wide leading-5 font-generalsans-regular opacity-80">
                  {lore}
                </Text>
              </View>

              <View className="mt-2">
                <View className="flex-row items-end justify-between mb-3">
                  <View>
                    <Text className="text-slate-500 text-[9px] uppercase font-bold tracking-widest mb-1">
                      Current XP
                    </Text>
                    <View className="flex-row items-baseline">
                      <Text className="text-white text-3xl font-generalsans-bold tracking-tighter">
                        {xp}
                      </Text>
                      <Text className="text-slate-600 text-sm ml-1 font-generalsans-medium">
                        / {next ? next.minXp : "MAX"}
                      </Text>
                    </View>
                  </View>
                  {next && (
                    <View className="items-end">
                      <Text className="text-slate-500 text-[9px] uppercase font-bold tracking-widest mb-1">
                        Next: {next.name}
                      </Text>
                      <Text
                        className="text-[12px] font-bold"
                        style={{ color: color }}
                      >
                        -{xpRemaining} XP needed
                      </Text>
                    </View>
                  )}
                </View>
                <View className="h-2 w-full bg-slate-900 rounded-full overflow-hidden border border-white/5 relative">
                  <View
                    className="absolute top-0 bottom-0 left-0 bg-white opacity-20"
                    style={{ width: `${progressPercent}%` }}
                  />
                  <View
                    className="h-full rounded-full"
                    style={{
                      width: `${progressPercent}%`,
                      backgroundColor: color,
                      shadowColor: color,
                      shadowOffset: { width: 0, height: 0 },
                      shadowOpacity: 1,
                      shadowRadius: 10,
                      elevation: 5,
                    }}
                  />
                </View>
              </View>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
};

import { api } from "@/convex/_generated/api";
import { Ionicons } from "@expo/vector-icons";
import {
  Fire02Icon,
  LaurelWreathLeft01Icon,
  LaurelWreathRight01Icon,
  LockKeyIcon,
  SunCloudAngledZap01Icon,
  Target02Icon,
  ChampionIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { useQuery } from "convex/react";
import { GlassView } from "expo-glass-effect";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  Dimensions,
  FlatList,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  runOnUI,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Circle, Path, Line as SvgLine } from "react-native-svg";
import { CharacterCard } from "@/components/homeComponents/CharacterCard";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// --- GAMIFICATION CONSTANTS (Matches Backend) ---
const DAILY_MAX_BASE_XP = 100;
const XP_PER_COMPLETION = 10;
const XP_DAILY_STREAK = 10;

const MILESTONE_DEFINITIONS = [
  { days: 3, xp: 50, color: "#34D399" }, // Emerald
  { days: 7, xp: 100, color: "#22D3EE" }, // Cyan
  { days: 14, xp: 200, color: "#818CF8" }, // Indigo
  { days: 30, xp: 500, color: "#F472B6" }, // Pink
  { days: 60, xp: 1000, color: "#F87171" }, // Red
];

// --- CONFIGURATION ---
const MAIN_TABS = [
  { key: "analytics", label: "Analytics" },
  { key: "vault", label: "Vault" },
  { key: "challenge", label: "Challenge" },
];

const ANALYTICS_TABS = [
  { key: "week", label: "Weekly" },
  { key: "month", label: "Monthly" },
];

const FILTERS = [
  { id: "all", label: "All", icon: "layers" },
  { id: "health", label: "Health", icon: "heart" },
  { id: "mind", label: "Mind", icon: "prism" },
  { id: "career", label: "Career", icon: "briefcase" },
  { id: "life", label: "Life", icon: "compass" },
  { id: "fun", label: "Fun", icon: "sparkles" },
] as const;

const CARD_COLORS = [
  "#F0F9FF",
  "#F0FDF4",
  "#FAF5FF",
  "#FFF7ED",
  "#FEF2F2",
  "#FEFCE8",
];

const CATEGORY_COLORS: Record<string, string> = {
  health: "#10B981",
  mind: "#8B5CF6",
  career: "#3B82F6",
  life: "#F59E0B",
  fun: "#EC4899",
  default: "#94A3B8",
};

const CATEGORY_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  health: "heart",
  mind: "prism",
  career: "briefcase",
  life: "compass",
  fun: "sparkles",
};

type TimeRange = "week" | "month";
type MainTab = "analytics" | "vault" | "challenge";

// --- BEZIER CURVE HELPER ---
const createSmoothPath = (
  data: { value: number }[],
  width: number,
  height: number,
  padding: number = 12,
) => {
  if (!data || data.length === 0)
    return { path: "", lastPoint: { x: 0, y: 0 }, points: [] };
  const drawWidth = width - padding * 2;
  const drawHeight = height - padding * 2;
  const maxVal = Math.max(...data.map((d) => d.value), 100);
  const getX = (index: number) =>
    padding + (index / (data.length - 1)) * drawWidth;
  const getY = (val: number) =>
    padding + drawHeight - (val / maxVal) * drawHeight;
  const points = data.map((d, i) => ({ x: getX(i), y: getY(d.value) }));

  if (points.length === 1)
    return {
      path: `M ${points[0].x},${points[0].y}`,
      lastPoint: points[0],
      points,
    };

  let d = `M ${points[0].x},${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(i - 1, 0)];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[Math.min(i + 2, points.length - 1)];
    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${p2.x},${p2.y}`;
  }
  return { path: d, lastPoint: points[points.length - 1], points };
};

export default function AnalyticsScreen() {
  const router = useRouter();
  const [currentTab, setCurrentTab] = useState<MainTab>("analytics");

  return (
    <View className="flex-1 bg-[#3A7AFE]">
      <StatusBar
        barStyle="light-content"
        translucent
        backgroundColor="transparent"
      />
      <SafeAreaView edges={["top"]} className="flex-1">
        {/* --- HEADER --- */}
        <View className="px-6 pt-4 pb-2 flex-row items-center justify-between z-50">
          <TouchableOpacity
            onPress={() => router.back()}
            className="w-11 h-11 items-center justify-center rounded-2xl bg-white/20 active:bg-white/30 border border-white/20"
          >
            <Ionicons name="chevron-back" size={24} color="white" />
          </TouchableOpacity>
          <Text className="text-white font-generalsans-bold text-[22px]">
            Analytics
          </Text>
          <View className="w-11" />
        </View>

        {/* --- MAIN TAB SWITCHER --- */}
        <View className="px-6 mt-4 mb-2 z-40">
          <GlassTabs
            tabs={MAIN_TABS}
            activeKey={currentTab}
            onTabChange={(k) => setCurrentTab(k as MainTab)}
          />
        </View>

        {/* --- CONTENT AREA --- */}
        {/* Using display: 'none' to keep tabs mounted and prevent refetching */}
        <View className="flex-1">
          <View
            style={{
              flex: 1,
              display: currentTab === "analytics" ? "flex" : "none",
            }}
          >
            <AnalyticsView />
          </View>

          <View
            style={{
              flex: 1,
              display: currentTab === "vault" ? "flex" : "none",
            }}
          >
            <VaultView />
          </View>

          <View
            style={{
              flex: 1,
              display: currentTab === "challenge" ? "flex" : "none",
            }}
          >
            <ChallengeView />
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

// ------------------------------------------------------------------
// SUB-VIEW 1: Analytics
// ------------------------------------------------------------------
function AnalyticsView() {
  const [timeRange, setTimeRange] = useState<TimeRange>("week");
  const resolutions = useQuery(api.resolutions.getResolutionAnalytics);

  return (
    <Animated.View entering={FadeInDown.duration(400)} className="flex-1">
      {/* Weekly/Monthly Sub-Tab */}
      <View className="px-6 mb-6 mt-2">
        <GlassTabs
          tabs={ANALYTICS_TABS}
          activeKey={timeRange}
          onTabChange={(k) => setTimeRange(k as TimeRange)}
        />
      </View>

      <FlatList
        data={resolutions}
        keyExtractor={(item) => item._id}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        renderItem={({ item, index }) => (
          <Animated.View
            entering={FadeInDown.delay(index * 80 + 200).duration(600)}
          >
            <ResolutionStatsCard
              item={item}
              index={index}
              timeRange={timeRange}
            />
          </Animated.View>
        )}
        ListEmptyComponent={
          <EmptyState
            loading={resolutions === undefined}
            title="No Active Goals"
            subtitle="Start tracking goals to see analytics"
            icon="bar-chart-outline"
          />
        }
      />
    </Animated.View>
  );
}

// ------------------------------------------------------------------
// SUB-VIEW 2: Vault
// ------------------------------------------------------------------
function VaultView() {
  const allCards = useQuery(api.stats.getAllCards) || [];
  const [activeFilter, setActiveFilter] = useState<string>("all");

  const filteredCards = useMemo(() => {
    if (activeFilter === "all") return allCards;
    return allCards.filter((c) => c.categoryKey === activeFilter);
  }, [allCards, activeFilter]);

  const NUM_COLUMNS = 2;
  const GAP = 12;
  const PADDING = 20;
  const CARD_WIDTH = (SCREEN_WIDTH - PADDING * 2 - GAP) / NUM_COLUMNS;

  return (
    <Animated.View entering={FadeInDown.duration(400)} className="flex-1 pt-2">
      {/* --- Filter Bar --- */}
      <View className="mb-4">
        <FlatList
          data={FILTERS}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20, gap: 8 }}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => {
            const isActive = activeFilter === item.id;
            return (
              <TouchableOpacity
                onPress={() => setActiveFilter(item.id)}
                activeOpacity={0.8}
                style={{
                  backgroundColor: isActive
                    ? "#FFFFFF"
                    : "rgba(255,255,255,0.1)",
                  borderWidth: isActive ? 0 : 1,
                  borderColor: isActive
                    ? "transparent"
                    : "rgba(255,255,255,0.15)",
                  paddingVertical: 10,
                  paddingHorizontal: 16,
                  borderRadius: 100,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <Ionicons
                  name={item.icon as any}
                  size={14}
                  color={isActive ? "#3A7AFE" : "rgba(255,255,255,0.8)"}
                />
                <Text
                  style={{
                    color: isActive ? "#3A7AFE" : "rgba(255,255,255,0.9)",
                    fontFamily: isActive
                      ? "GeneralSans-Bold"
                      : "GeneralSans-Medium",
                    fontSize: 13,
                  }}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {/* --- Card Grid --- */}
      <FlatList
        data={filteredCards}
        keyExtractor={(item) => item._id}
        numColumns={NUM_COLUMNS}
        key={activeFilter}
        contentContainerStyle={{
          paddingTop: 10,
          paddingBottom: 100,
          paddingHorizontal: PADDING,
          gap: GAP,
        }}
        columnWrapperStyle={{ gap: GAP }}
        showsVerticalScrollIndicator={false}
        renderItem={({ item, index }) => (
          <Animated.View
            entering={FadeInDown.delay(index * 50).duration(500)}
            style={{ width: CARD_WIDTH }}
          >
            <VaultCardWrapper item={item} width={CARD_WIDTH} />
          </Animated.View>
        )}
        ListEmptyComponent={
          <EmptyState
            loading={allCards.length === 0}
            title={allCards.length === 0 ? "Loading Vault..." : "No Cards"}
            subtitle="Complete goals to unlock cards"
            icon="albums-outline"
          />
        }
      />
    </Animated.View>
  );
}

// ------------------------------------------------------------------
// SUB-VIEW 3: Challenge (Timeline + Real Data)
// ------------------------------------------------------------------
function ChallengeView() {
  // 1. Fetch User Data for Real Streak
  const user = useQuery(api.users.currentUser);
  const currentStreak = user?.currentStreak || 0;

  // 2. Prepare Daily Stats based on Backend Constants
  const dailyStats = [
    {
      id: "per_task",
      label: "Per Task",
      value: XP_PER_COMPLETION,
      unit: "XP",
      icon: Target02Icon,
      color: "#60A5FA", // Blue-400
      bg: "rgba(96, 165, 250, 0.2)",
      desc: "Base Reward",
    },
    {
      id: "streak_bonus",
      label: "Streak Bonus",
      value: XP_DAILY_STREAK,
      unit: "XP",
      icon: Fire02Icon,
      color: "#FB923C", // Orange-400
      bg: "rgba(251, 146, 60, 0.2)",
      desc: "Daily Active",
    },
    {
      id: "daily_cap",
      label: "Daily Cap",
      value: DAILY_MAX_BASE_XP,
      unit: "XP",
      icon: SunCloudAngledZap01Icon,
      color: "#FACC15", // Yellow-400
      bg: "rgba(250, 204, 21, 0.2)",
      desc: "Max Earning",
    },
  ];

  // 3. Map Milestones with Locked Status
  const milestonesList = MILESTONE_DEFINITIONS.map((m) => ({
    ...m,
    locked: currentStreak < m.days,
  }));

  return (
    <Animated.ScrollView
      entering={FadeInDown.duration(400)}
      contentContainerStyle={{
        paddingHorizontal: 20,
        paddingTop: 10,
        paddingBottom: 120,
      }}
      showsVerticalScrollIndicator={false}
    >
      {/* --- HERO HEADER --- */}
      <View className="mb-8 mt-2">
        <View className="flex-row items-center justify-between">
          <View>
            <Text className="text-white font-generalsans-bold text-[24px]">
              XP Challenge
            </Text>
            <Text className="text-white/60 font-generalsans-medium text-[14px] mt-1">
              Maximize your daily potential.
            </Text>
          </View>
          <View className="w-12 h-12 rounded-full bg-white/10 items-center justify-center border border-white/20">
            <HugeiconsIcon
              icon={ChampionIcon}
              size={24}
              color="#FACC15"
              variant="solid"
            />
          </View>
        </View>
      </View>

      {/* --- 1. DAILY STATS (Horizontal Cards) --- */}
      <View className="flex-row gap-3 mb-10">
        {dailyStats.map((stat, index) => (
          <StatCard key={stat.id} stat={stat} index={index} />
        ))}
      </View>

      {/* --- 2. MILESTONES (Timeline Look) --- */}
      <View className="mb-6 flex-row items-center gap-3">
        <View className="bg-white/20 p-2 rounded-xl">
          <HugeiconsIcon
            icon={ChampionIcon}
            size={20}
            color="#FFFFFF"
            variant="solid"
          />
        </View>
        <Text className="text-white font-generalsans-bold text-[20px]">
          Streak Rewards
        </Text>
        <View className="bg-white/10 px-2 py-0.5 rounded-md ml-auto">
          <Text className="text-white/60 text-[10px] font-generalsans-bold">
            Current: {currentStreak} Days
          </Text>
        </View>
      </View>

      <View className="relative pl-4">
        {/* Timeline Line */}
        <View
          className="absolute left-[29px] top-4 bottom-10 w-[2px] bg-white/20"
          style={{ borderStyle: "dashed", borderRadius: 2 }}
        />

        {milestonesList.map((milestone, index) => (
          <MilestoneCard
            key={milestone.days}
            item={milestone}
            index={index}
            isLast={index === milestonesList.length - 1}
          />
        ))}
      </View>
    </Animated.ScrollView>
  );
}

// ------------------------------------------------------------------
// REUSABLE COMPONENTS
// ------------------------------------------------------------------

// 1. Stat Card (For Challenge)
function StatCard({ stat, index }: { stat: any; index: number }) {
  return (
    <Animated.View
      entering={FadeInDown.delay(index * 100).duration(600)}
      style={{ flex: 1 }}
    >
      <View
        style={{
          height: 150,
        }}
      >
        {Platform.OS === "ios" && (
          <GlassView
            style={{
              ...StyleSheet.absoluteFillObject,
              borderRadius: 32,
              overflow: "hidden",
            }}
            glassEffectStyle="regular"
            tintColor="#3A7AFE"
          />
        )}

        <View className="flex-1 items-center justify-between p-3 py-5">
          <View
            className="w-10 h-10 rounded-full items-center justify-center mb-2"
            style={{ backgroundColor: stat.bg }}
          >
            <HugeiconsIcon
              icon={stat.icon}
              size={20}
              color={stat.color}
              variant="solid"
            />
          </View>

          <View className="items-center">
            <Text className="text-white font-generalsans-bold text-[26px] leading-8">
              {stat.value}
            </Text>
            <Text className="text-white/50 font-generalsans-bold text-[10px] uppercase tracking-wider">
              {stat.unit}
            </Text>
          </View>

          <Text className="text-white/80 font-generalsans-medium text-[10px] text-center mt-1">
            {stat.desc}
          </Text>
        </View>
      </View>
    </Animated.View>
  );
}

// 2. Milestone Card (For Challenge Timeline)
function MilestoneCard({
  item,
  index,
  isLast,
}: {
  item: any;
  index: number;
  isLast: boolean;
}) {
  return (
    <Animated.View
      entering={FadeInDown.delay(300 + index * 100).duration(500)}
      className="flex-row items-center mb-5"
    >
      {/* Timeline Node */}
      <View className="relative items-center justify-center mr-4 z-10">
        <View
          className="w-8 h-8 rounded-full items-center justify-center border-2 bg-[#3A7AFE]"
          style={{
            borderColor: item.locked ? "rgba(255,255,255,0.8)" : item.color,
            shadowColor: item.color,
            shadowOpacity: item.locked ? 0 : 0.5,
            shadowRadius: 8,
            shadowOffset: { width: 0, height: 0 },
            backgroundColor: item.locked ? "fafafa" : "#3A7AFE",
          }}
        >
          {item.locked ? (
            <View className="w-2.5 h-2.5 rounded-full bg-white" />
          ) : (
            <HugeiconsIcon
              icon={ChampionIcon}
              size={14}
              color="#FFFFFF"
              variant="solid"
            />
          )}
        </View>
      </View>

      {/* The Card */}
      <View
        className="flex-1 rounded-[22px] overflow-hidden"
        style={{
          height: 72,
          opacity: item.locked ? 0.7 : 1,
        }}
      >
        {Platform.OS === "ios" && (
          <GlassView
            style={{
              ...StyleSheet.absoluteFillObject,
              borderRadius: 32,
              overflow: "hidden",
            }}
            glassEffectStyle="regular"
            tintColor="#3A7AFE"
          />
        )}

        <View className="flex-1 flex-row items-center justify-between px-5">
          <View>
            <Text className="text-white font-generalsans-bold text-[16px]">
              {item.days} Day Streak
            </Text>
            <Text className="text-white/50 font-generalsans-medium text-[12px] mt-0.5">
              {item.locked ? "Locked" : "Achieved!"}
            </Text>
          </View>

          {/* Reward Badge */}
          <View className="flex-row items-center bg-white/10 px-3 py-1.5 rounded-full border border-white/10">
            {item.locked && (
              <HugeiconsIcon
                icon={LockKeyIcon}
                size={12}
                color="rgba(255,255,255,0.5)"
                style={{ marginRight: 4 }}
              />
            )}
            <Text
              className="font-generalsans-bold text-[14px]"
              style={{
                color: item.locked ? "rgba(255,255,255,0.5)" : item.color,
              }}
            >
              +{item.xp} XP
            </Text>
          </View>
        </View>

        {/* Progress bar at bottom if unlocked */}
        {!item.locked && (
          <View
            className="absolute bottom-0 left-0 h-[3px] bg-white"
            style={{ width: "100%", backgroundColor: item.color }}
          />
        )}
      </View>
    </Animated.View>
  );
}

// 3. Vault Card Wrapper
function VaultCardWrapper({ item, width }: { item: any; width: number }) {
  const isEquipped = item.isUnlocked && item.currentXp <= item.maxXp;
  const isCompleted = item.isUnlocked && item.currentXp > item.maxXp;

  let displayXp = item.minXp;
  if (isEquipped) {
    displayXp = item.currentXp;
  } else if (isCompleted) {
    displayXp = item.maxXp;
  }

  return (
    <View className="relative items-center">
      <View style={{ opacity: item.isUnlocked ? 1 : 0.5 }}>
        <CharacterCard
          categoryKey={item.categoryKey}
          xp={displayXp}
          scale={0.5}
          isEquipped={isEquipped}
          isCompleted={isCompleted}
        />
      </View>

      {!item.isUnlocked && (
        <View className="absolute inset-0 items-center justify-center z-10">
          <GlassView
            glassEffectStyle="dark"
            style={{
              width: 48,
              height: 48,
              borderRadius: 24,
              alignItems: "center",
              justifyContent: "center",
              borderWidth: 1,
              borderColor: "rgba(255,255,255,0.2)",
              marginBottom: 8,
            }}
          >
            <HugeiconsIcon icon={LockKeyIcon} size={22} color="white" />
          </GlassView>

          <View className="bg-black/40 px-3 py-1.5 rounded-full backdrop-blur-md">
            <Text className="text-white/90 font-generalsans-bold text-[10px] text-center">
              Stage {item.stage}
            </Text>
            <Text className="text-white/60 font-generalsans-medium text-[9px] text-center mt-0.5">
              Need {item.minXp} XP
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}

// 4. Glass Tabs
function GlassTabs({
  tabs,
  activeKey,
  onTabChange,
}: {
  tabs: { key: string; label: string }[];
  activeKey: string;
  onTabChange: (k: string) => void;
}) {
  const selectedIndex = useSharedValue(0);
  const containerWidth = useSharedValue(0);

  useEffect(() => {
    const idx = tabs.findIndex((t) => t.key === activeKey);
    runOnUI(() => {
      selectedIndex.value = idx;
    })();
  }, [activeKey]);

  const indicatorPosition = useAnimatedStyle(() => {
    if (containerWidth.value === 0) return {};
    const tabWidth = containerWidth.value / tabs.length;
    return {
      width: tabWidth,
      transform: [
        {
          translateX: withTiming(selectedIndex.value * tabWidth, {
            duration: 300,
          }),
        },
      ],
    };
  });

  return (
    <View className="h-14 w-full">
      <GlassView
        glassEffectStyle="regular"
        tintColor="#3A7AFE"
        style={{ flex: 1, borderRadius: 999, overflow: "hidden" }}
      >
        <View
          style={{ padding: 4, flexDirection: "row", height: "100%" }}
          onLayout={(e) =>
            (containerWidth.value = e.nativeEvent.layout.width - 8)
          }
        >
          <Animated.View
            style={[
              indicatorPosition,
              {
                position: "absolute",
                left: 4,
                top: 4,
                bottom: 4,
                borderRadius: 999,
                overflow: "hidden",
              },
            ]}
          >
            <GlassView glassEffectStyle="regular" style={{ flex: 1 }} />
          </Animated.View>

          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab.key}
              onPress={() => onTabChange(tab.key)}
              className="flex-1 items-center justify-center z-10"
              activeOpacity={0.7}
            >
              <Text
                className={`text-[13px] font-generalsans-bold ${activeKey === tab.key ? "text-white" : "text-white/70"}`}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </GlassView>
    </View>
  );
}

// 5. Empty State
function EmptyState({ loading, title, subtitle, icon }: any) {
  return (
    <View className="items-center justify-center mt-20 px-8">
      <View className="w-20 h-20 rounded-full bg-white/10 items-center justify-center mb-4">
        <Ionicons name={icon} size={32} color="white" />
      </View>
      <Text className="text-white font-generalsans-bold text-[17px] mb-2 text-center">
        {loading ? "Loading..." : title}
      </Text>
      <Text className="text-white/60 font-generalsans-semibold text-[13px] text-center">
        {loading ? "Please wait..." : subtitle}
      </Text>
    </View>
  );
}

// 6. Resolution Stats Card
function ResolutionStatsCard({
  item,
  index,
  timeRange,
}: {
  item: any;
  index: number;
  timeRange: TimeRange;
}) {
  const pressed = useSharedValue(0);
  const categoryColor =
    CATEGORY_COLORS[item.categoryKey] || CATEGORY_COLORS.default;
  const icon = CATEGORY_ICONS[item.categoryKey] || "ellipse";
  const baseColor = CARD_COLORS[index % CARD_COLORS.length];
  const currentStreak = item.currentStreak || 0;
  const bestStreak = item.bestStreak || currentStreak;
  const fullHistory = item.history || [];

  const displayHistory = useMemo(() => {
    if (timeRange === "week") return fullHistory.slice(-7);
    return fullHistory;
  }, [fullHistory, timeRange]);

  const lastValue = displayHistory[displayHistory.length - 1]?.value || 0;
  const completionRate =
    displayHistory.length > 0
      ? Math.round(
          displayHistory.reduce((sum: number, h: any) => sum + h.value, 0) /
            displayHistory.length,
        )
      : 0;

  const GRAPH_HEIGHT = 110;
  const GRAPH_WIDTH = SCREEN_WIDTH - 80;
  const { path, lastPoint, points } = useMemo(
    () => createSmoothPath(displayHistory, GRAPH_WIDTH, GRAPH_HEIGHT, 14),
    [displayHistory, GRAPH_WIDTH, GRAPH_HEIGHT],
  );

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: withSpring(1 - pressed.value * 0.02) }],
  }));

  return (
    <Animated.View style={animatedStyle}>
      <View
        className="mb-5 rounded-[32px] overflow-hidden"
        style={{
          backgroundColor:
            Platform.OS === "android" ? baseColor : "transparent",
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.1,
          shadowRadius: 16,
          elevation: 6,
        }}
      >
        {Platform.OS === "ios" && (
          <GlassView
            glassEffectStyle="regular"
            tintColor={baseColor}
            style={{ ...StyleSheet.absoluteFillObject, borderRadius: 32 }}
          />
        )}

        <View className="pt-6 pb-6 px-5">
          {/* HEADER ROW */}
          <View className="flex-row items-center gap-3 mb-6">
            <View className="w-12 h-12 rounded-2xl items-center justify-center bg-white/60 border border-white/80">
              <Ionicons name={icon} size={20} color="#1E293B" />
            </View>
            <View className="flex-1">
              <Text className="text-[#1E293B] font-generalsans-bold text-[18px] leading-tight mb-0.5">
                {item.title}
              </Text>
              <View className="flex-row items-center gap-2">
                <Text className="text-[#64748B] text-[11px] font-generalsans-medium">
                  {timeRange === "week" ? "Last 7 Days" : "Last 30 Days"}
                </Text>
                <View className="w-1 h-1 rounded-full bg-[#64748B]/40" />
                <Text className="text-[#64748B] text-[11px] font-generalsans-bold">
                  {completionRate}% avg
                </Text>
              </View>
            </View>
            <View className="px-2.5 py-1 rounded-full bg-white/50 border border-white/40">
              <Text className="text-[10px] font-generalsans-bold text-[#1E293B]">
                {lastValue}% Today
              </Text>
            </View>
          </View>

          {/* DUAL STATS */}
          <View className="flex-row gap-3 mb-6">
            {/* Streak */}
            <View className="flex-1 h-[110px] rounded-[24px] overflow-hidden relative">
              <GlassView
                glassEffectStyle="regular"
                style={StyleSheet.absoluteFillObject}
              />
              <View className="absolute inset-0 bg-white/30" />
              <View className="flex-1 items-center justify-center py-2 border border-white/40 rounded-[24px]">
                <View className="flex-row items-center gap-1.5 mb-1 opacity-80">
                  <HugeiconsIcon
                    icon={Fire02Icon}
                    size={12}
                    color="#1E293B"
                    variant="solid"
                  />
                  <Text className="text-[#1E293B] text-[10px] font-generalsans-bold uppercase tracking-wider">
                    Current
                  </Text>
                </View>
                <View className="flex-row items-center mt-1">
                  <HugeiconsIcon
                    icon={LaurelWreathLeft01Icon}
                    size={24}
                    color="#F97316"
                    variant="solid"
                  />
                  <Text className="text-[#1E293B] font-generalsans-bold text-[32px] mx-1 leading-8">
                    {currentStreak}
                  </Text>
                  <HugeiconsIcon
                    icon={LaurelWreathRight01Icon}
                    size={24}
                    color="#F97316"
                    variant="solid"
                  />
                </View>
                <Text className="text-[#64748B] text-[9px] font-generalsans-semibold mt-0.5">
                  days
                </Text>
              </View>
            </View>
            {/* Best */}
            <View className="flex-1 h-[110px] rounded-[24px] overflow-hidden relative">
              <GlassView
                glassEffectStyle="regular"
                style={StyleSheet.absoluteFillObject}
              />
              <View className="absolute inset-0 bg-white/30" />
              <View className="flex-1 items-center justify-center py-2 border border-white/40 rounded-[24px]">
                <View className="flex-row items-center gap-1.5 mb-1 opacity-80">
                  <HugeiconsIcon
                    icon={ChampionIcon}
                    size={12}
                    color="#1E293B"
                    variant="solid"
                  />
                  <Text className="text-[#1E293B] text-[10px] font-generalsans-bold uppercase tracking-wider">
                    Best
                  </Text>
                </View>
                <View className="flex-row items-center mt-1">
                  <HugeiconsIcon
                    icon={LaurelWreathLeft01Icon}
                    size={24}
                    color="#EAB308"
                    variant="solid"
                  />
                  <Text className="text-[#1E293B] font-generalsans-bold text-[32px] mx-1 leading-8">
                    {bestStreak}
                  </Text>
                  <HugeiconsIcon
                    icon={LaurelWreathRight01Icon}
                    size={24}
                    color="#EAB308"
                    variant="solid"
                  />
                </View>
                <Text className="text-[#64748B] text-[9px] font-generalsans-semibold mt-0.5">
                  record
                </Text>
              </View>
            </View>
          </View>

          {/* GRAPH */}
          <View
            className="rounded-[24px] overflow-hidden px-2 pt-4 pb-2 border border-white/40"
            style={{ backgroundColor: "rgba(255, 255, 255, 0.3)" }}
          >
            <View className="h-[100px] justify-center">
              <Svg
                height={GRAPH_HEIGHT}
                width={GRAPH_WIDTH}
                style={{ alignSelf: "center", overflow: "visible" }}
              >
                <SvgLine
                  x1="12"
                  y1={GRAPH_HEIGHT / 2}
                  x2={GRAPH_WIDTH - 12}
                  y2={GRAPH_HEIGHT / 2}
                  stroke="#1E293B"
                  strokeOpacity="0.05"
                  strokeDasharray="4 4"
                />
                <Path
                  d={path}
                  stroke="rgba(0,0,0,0.1)"
                  strokeWidth="3"
                  strokeLinecap="round"
                  fill="none"
                  y="4"
                />
                <Path
                  d={path}
                  stroke={categoryColor}
                  strokeWidth="3"
                  strokeLinecap="round"
                  fill="none"
                />
                {timeRange === "week" &&
                  points.map((point: any, i: number) => (
                    <Circle
                      key={i}
                      cx={point.x}
                      cy={point.y}
                      r="2.5"
                      fill="white"
                      stroke={categoryColor}
                      strokeWidth="1.5"
                      opacity={i === points.length - 1 ? 0 : 1}
                    />
                  ))}
                {displayHistory.length > 0 && (
                  <>
                    <Circle
                      cx={lastPoint.x}
                      cy={lastPoint.y + 4}
                      r="6"
                      fill="rgba(0,0,0,0.1)"
                    />
                    <Circle
                      cx={lastPoint.x}
                      cy={lastPoint.y}
                      r="6"
                      fill="white"
                      stroke={categoryColor}
                      strokeWidth="3"
                    />
                  </>
                )}
              </Svg>
            </View>
            <View className="flex-row justify-between mt-2 px-2">
              {displayHistory.map((d: any, i: number) => {
                if (
                  timeRange !== "week" &&
                  i !== 0 &&
                  i !== displayHistory.length - 1 &&
                  i % 6 !== 0
                )
                  return null;
                return (
                  <Text
                    key={i}
                    className={`text-[9px] font-generalsans-bold uppercase w-6 text-center ${i === displayHistory.length - 1 ? "text-[#1E293B]" : "text-[#64748B]/70"}`}
                  >
                    {d.day}
                  </Text>
                );
              })}
            </View>
          </View>
        </View>
      </View>
    </Animated.View>
  );
}

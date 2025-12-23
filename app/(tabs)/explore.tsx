import { api } from "@/convex/_generated/api";
import { Ionicons } from "@expo/vector-icons";
import {
  Fire02Icon,
  LaurelWreathLeft01Icon,
  LaurelWreathRight01Icon,
  ChampionIcon, // Using ChampionIcon for "Best" trophy equivalent
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
  Text,
  TouchableOpacity,
  View,
  StyleSheet,
} from "react-native";
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  withSpring,
  useSharedValue,
  withTiming,
  runOnUI,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, {
  Circle,
  Path,
  Defs,
  LinearGradient,
  Stop,
  Line as SvgLine,
} from "react-native-svg";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// --- ULTRA LIGHT / PALE COLORS (Crystal Look) ---
const CARD_COLORS = [
  "#F0F9FF", // Alice Blue
  "#F0FDF4", // Mint Cream
  "#FAF5FF", // Lavender Blush
  "#FFF7ED", // Seashell
  "#FEF2F2", // Snow
  "#FEFCE8", // Ivory
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

// Tabs Configuration
const TABS = [
  { key: "week", label: "Weekly" },
  { key: "month", label: "Monthly" },
];

type TimeRange = "week" | "month";

// --- SMOOTH BEZIER CURVE GENERATION ---
// Uses Catmull-Rom to Cubic Bezier conversion for ultra-smooth curves
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

  // Scale Y based on max value (at least 100)
  const maxVal = Math.max(...data.map((d) => d.value), 100);

  const getX = (index: number) =>
    padding + (index / (data.length - 1)) * drawWidth;
  const getY = (val: number) =>
    padding + drawHeight - (val / maxVal) * drawHeight;

  const points = data.map((d, i) => ({ x: getX(i), y: getY(d.value) }));

  if (points.length === 1) {
    return {
      path: `M ${points[0].x},${points[0].y}`,
      lastPoint: points[0],
      points,
    };
  }

  let d = `M ${points[0].x},${points[0].y}`;

  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(i - 1, 0)];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[Math.min(i + 2, points.length - 1)];

    // Calculate control points
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
  const [timeRange, setTimeRange] = useState<TimeRange>("week");
  const resolutions = useQuery(api.resolutions.getResolutionAnalytics);

  // --- TAB ANIMATION STATE ---
  const selectedIndex = useSharedValue(0);
  const containerWidth = useSharedValue(0);

  useEffect(() => {
    const idx = TABS.findIndex((t) => t.key === timeRange);
    runOnUI(() => {
      selectedIndex.value = idx;
    })();
  }, [timeRange]);

  const indicatorPosition = useAnimatedStyle(() => {
    if (containerWidth.value === 0) return {};
    const tabWidth = containerWidth.value / TABS.length;
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
    <View className="flex-1 bg-[#3A7AFE]">
      <StatusBar
        barStyle="light-content"
        translucent
        backgroundColor="transparent"
      />
      <SafeAreaView edges={["top"]} className="flex-1">
        {/* --- HEADER --- */}
        <View className="px-6 pt-4 pb-2 flex-row items-center justify-between">
          <TouchableOpacity
            onPress={() => router.back()}
            className="w-11 h-11 items-center justify-center rounded-2xl bg-white/20 active:bg-white/30 border border-white/20"
          >
            <Ionicons name="chevron-back" size={24} color="white" />
          </TouchableOpacity>
          <Text className="text-white font-generalsans-bold text-[22px]">
            Performance
          </Text>
          <View className="w-11" />
        </View>

        {/* --- SLIDING GLASS TABS --- */}
        <View className="flex-row items-center mx-6 mb-6 mt-4 h-14">
          <GlassView
            glassEffectStyle="regular"
            tintColor="#3A7AFE"
            style={{ flex: 1, borderRadius: 999, overflow: "hidden" }}
          >
            <View
              style={{
                padding: 4,
                flexDirection: "row",
                position: "relative",
                height: "100%",
              }}
              onLayout={(e) =>
                (containerWidth.value = e.nativeEvent.layout.width - 8)
              }
            >
              {/* Sliding White Indicator */}
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

              {/* Tab Text Buttons */}
              {TABS.map((tab) => (
                <TouchableOpacity
                  key={tab.key}
                  onPress={() => setTimeRange(tab.key as TimeRange)}
                  className="flex-1 items-center justify-center z-10"
                  activeOpacity={0.7}
                >
                  <Text
                    className={`text-[13px] font-generalsans-bold ${
                      timeRange === tab.key ? "text-white " : "text-white/70"
                    }`}
                  >
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </GlassView>
        </View>

        {/* --- LIST --- */}
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
            <View className="items-center justify-center mt-20 px-8">
              <View className="w-20 h-20 rounded-full bg-white/10 items-center justify-center mb-4">
                <Ionicons name="bar-chart-outline" size={32} color="white" />
              </View>
              <Text className="text-white font-generalsans-bold text-[17px] mb-2 text-center">
                {resolutions === undefined
                  ? "Loading Analytics..."
                  : "No Active Goals"}
              </Text>
              <Text className="text-white/60 font-generalsans-semibold text-[13px] text-center">
                {resolutions === undefined
                  ? "Calculating your performance data"
                  : "Start tracking goals to see analytics"}
              </Text>
            </View>
          }
        />
      </SafeAreaView>
    </View>
  );
}

// ------------------------------------------------------------------
// ENHANCED CRYSTAL CARD COMPONENT
// ------------------------------------------------------------------

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

  // --- DATA PROCESSING ---
  // The backend returns 30 days of data in `item.history`.
  // We process this based on the selected `timeRange`.
  const fullHistory = item.history || [];

  const displayHistory = useMemo(() => {
    if (timeRange === "week") {
      // Slice the last 7 items for Weekly view
      // If history is less than 7, use all of it.
      return fullHistory.slice(-7);
    } else {
      // Use all available history (up to 30 days) for Monthly view
      return fullHistory;
    }
  }, [fullHistory, timeRange]);

  // Calculate completion percentage for the view
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
  const GRAPH_PADDING = 14;

  const { path, lastPoint, points } = useMemo(
    () =>
      createSmoothPath(
        displayHistory,
        GRAPH_WIDTH,
        GRAPH_HEIGHT,
        GRAPH_PADDING,
      ),
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
        {/* OUTER GLASS LAYER */}
        {Platform.OS === "ios" && (
          <GlassView
            glassEffectStyle="regular"
            tintColor={baseColor}
            style={{
              position: "absolute",
              width: "100%",
              height: "100%",
              borderRadius: 32,
            }}
          />
        )}

        <View className="pt-6 pb-6 px-5">
          {/* 1. HEADER ROW */}
          <View className="flex-row items-center gap-3 mb-6">
            <View
              className="w-12 h-12 rounded-2xl items-center justify-center bg-white/60"
              style={{
                borderWidth: 1,
                borderColor: "rgba(255,255,255,0.8)",
              }}
            >
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
            {/* Efficiency Badge */}
            <View className="px-2.5 py-1 rounded-full bg-white/50 border border-white/40">
              <Text className="text-[10px] font-generalsans-bold text-[#1E293B]">
                {lastValue}% Today
              </Text>
            </View>
          </View>

          {/* 2. DUAL STATS BLOCKS (Inner Glass) */}
          <View className="flex-row gap-3 mb-6">
            {/* Current Streak Block */}
            <View
              className="flex-1 rounded-[24px] overflow-hidden relative"
              style={{ height: 110 }}
            >
              <GlassView
                glassEffectStyle="regular"
                style={{ ...StyleSheet.absoluteFillObject }}
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

            {/* Best Streak Block */}
            <View
              className="flex-1 rounded-[24px] overflow-hidden relative"
              style={{ height: 110 }}
            >
              <GlassView
                glassEffectStyle="regular"
                style={{ ...StyleSheet.absoluteFillObject }}
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

          {/* 3. GRAPH (Clean, No Fill, Shadow Path) */}
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
                {/* Reference Line */}
                <SvgLine
                  x1="12"
                  y1={GRAPH_HEIGHT / 2}
                  x2={GRAPH_WIDTH - 12}
                  y2={GRAPH_HEIGHT / 2}
                  stroke="#1E293B"
                  strokeOpacity="0.05"
                  strokeDasharray="4 4"
                />

                {/* Shadow Path */}
                <Path
                  d={path}
                  stroke="rgba(0,0,0,0.1)"
                  strokeWidth="3"
                  strokeLinecap="round"
                  fill="none"
                  y="4"
                />

                {/* Main Line Path */}
                <Path
                  d={path}
                  stroke={categoryColor}
                  strokeWidth="3"
                  strokeLinecap="round"
                  fill="none"
                />

                {/* Data Points (Only for Weekly view) */}
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

                {/* End Point Highlight */}
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

            {/* X-Axis Labels */}
            <View className="flex-row justify-between mt-2 px-2">
              {displayHistory.map((d: any, i: number) => {
                const isWeekly = timeRange === "week";

                // For Monthly: Show 1st, Last, and every 6th day
                if (!isWeekly) {
                  if (
                    i !== 0 &&
                    i !== displayHistory.length - 1 &&
                    i % 6 !== 0
                  ) {
                    return null;
                  }
                }

                return (
                  <Text
                    key={i}
                    className={`text-[9px] font-generalsans-bold uppercase w-6 text-center ${
                      i === displayHistory.length - 1
                        ? "text-[#1E293B]"
                        : "text-[#64748B]/70"
                    }`}
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

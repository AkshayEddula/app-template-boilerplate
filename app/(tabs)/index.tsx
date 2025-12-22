import { CollectionModal } from "@/components/homeComponents/CollectionModal";
import { LevelUpOverlay } from "@/components/homeComponents/LevelupOverlay";
import { SquircleCard } from "@/components/homeComponents/SquircleCard";
import { TrackingModal } from "@/components/homeComponents/TrackingModal";
import { XPHeaderBadge } from "@/components/homeComponents/XpHeaderBadge";
import { StreakModal } from "@/components/homeComponents/StreakModal"; // Import the new modal
import { api } from "@/convex/_generated/api";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "convex/react";
import { GlassView } from "expo-glass-effect";
import { useRouter } from "expo-router";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { Fire02Icon } from "@hugeicons/core-free-icons";
import React, { useEffect, useMemo, useState } from "react";
import {
  FlatList,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, {
  runOnUI,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

// --- Types ---
type Resolution = {
  _id: string;
  title: string;
  categoryKey: string;
  frequencyType: string;
  trackingType: "yes_no" | "time_based" | "count_based";
  targetCount?: number;
  countUnit?: string;
  targetTime?: number;
  customDays?: number[];
  daysPerWeek?: number;
  currentStreak?: number; // Added to type
};

const FILTER_DAYS = [
  { key: "today", label: "Today" },
  { key: "pending", label: "Pending" },
  { key: "completed", label: "Completed" },
  { key: "all", label: "All Goals" },
];

const isTaskAvailableOnDate = (item: Resolution, date: Date) => {
  const day = date.getDay();
  if (item.frequencyType === "daily") return true;
  if (item.frequencyType === "weekdays") return day >= 1 && day <= 5;
  if (item.frequencyType === "weekends") return day === 0 || day === 6;
  if (item.frequencyType === "custom" && item.customDays)
    return item.customDays.includes(day);
  if (item.frequencyType === "x_days_per_week") return true;
  return false;
};

const isTaskToday = (item: Resolution) =>
  isTaskAvailableOnDate(item, new Date());

export default function HomeScreen() {
  const router = useRouter();

  // Queries
  const user = useQuery(api.users.currentUser); // Need user for global streak
  const resolutions = useQuery(api.userResolutions.listActive);
  const todayStr = new Date().toISOString().split("T")[0];
  const todayLogs = useQuery(api.resolutions.getTodayLogs, { date: todayStr });

  // State
  const [selectedResolution, setSelectedResolution] =
    useState<Resolution | null>(null);
  const [trackingModalVisible, setTrackingModalVisible] = useState(false);
  const [selectedDayFilter, setSelectedDayFilter] = useState("today");

  // New States
  const [levelUpVisible, setLevelUpVisible] = useState(false);
  const [collectionVisible, setCollectionVisible] = useState(false);
  const [streakModalVisible, setStreakModalVisible] = useState(false); // Streak Modal State

  const [levelUpData, setLevelUpData] = useState<{
    key: string;
    xp: number;
  } | null>(null);

  const selectedIndex = useSharedValue(0);
  const containerWidth = useSharedValue(0);

  const sortedResolutions = useMemo(() => {
    if (!resolutions) return [];
    return resolutions
      .filter((item) => {
        const isToday = isTaskToday(item);
        const isCompleted = todayLogs?.find(
          (l) => l.userResolutionId === item._id,
        )?.isCompleted;
        if (selectedDayFilter === "today") return isToday;
        if (selectedDayFilter === "pending") return isToday && !isCompleted;
        if (selectedDayFilter === "completed") return isToday && isCompleted;
        return true;
      })
      .sort((a, b) => (isTaskToday(b) ? 1 : -1));
  }, [resolutions, todayLogs, selectedDayFilter]);

  useEffect(() => {
    const idx = FILTER_DAYS.findIndex((f) => f.key === selectedDayFilter);
    runOnUI(() => {
      "worklet";
      selectedIndex.value = idx;
    })();
  }, [selectedDayFilter]);

  const indicatorPosition = useAnimatedStyle(() => {
    const tabWidth = containerWidth.value / FILTER_DAYS.length;
    return {
      width: tabWidth,
      transform: [
        {
          translateX: withTiming(selectedIndex.value * tabWidth, {
            duration: 300,
          }),
        },
      ],
      opacity: containerWidth.value > 0 ? 1 : 0,
    };
  });

  return (
    <View className="flex-1 bg-[#3A7AFE]">
      <StatusBar
        barStyle="light-content"
        translucent
        backgroundColor="transparent"
      />
      <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
        {/* --- HEADER --- */}
        <View className="px-6 pb-6 pt-2 flex-row justify-between items-center">
          {/* STREAK BADGE (Updated to be interactive) */}
          <TouchableOpacity
            onPress={() => setStreakModalVisible(true)}
            activeOpacity={0.7}
          >
            <View className="flex-row items-center  pl-2 pr-3 py-1.5 rounded-[36px]">
              <GlassView
                style={{
                  ...StyleSheet.absoluteFillObject,
                  borderRadius: 36,
                  overflow: "hidden",
                }}
                glassEffectStyle="regular"
                tintColor="#3A7AFE"
              />
              <View className="mr-1">
                <HugeiconsIcon
                  icon={Fire02Icon}
                  fill={user?.currentStreak ? "#FEF3C7" : "transparent"} // Pale gold
                  color={user?.currentStreak ? "#D97706" : "#A1A1AA"} // Dark goldenrod
                  size={22}
                  strokeWidth={1}
                  pointerEvents="none"
                />
              </View>
              <Text className="text-white font-generalsans-bold text-[16px]">
                {user?.currentStreak || 0}
              </Text>
            </View>
          </TouchableOpacity>

          <View className="flex-row items-center justify-center gap-1">
            <View className="rounded-[32px]">
              {/* Collection Button */}
              <GlassView
                style={{
                  ...StyleSheet.absoluteFillObject,
                  borderRadius: 32,
                  overflow: "hidden",
                }}
                glassEffectStyle="regular"
                tintColor="#00e38cff"
              />
              <TouchableOpacity
                onPress={() => setCollectionVisible(true)}
                className="flex flex-row gap-x-1 p-3 rounded-[32px]"
              >
                <Ionicons name="albums" size={16} color="white" />
                <Text className="text-white font-generalsans-semibold text-[14px] tracking-tight">
                  Vault
                </Text>
              </TouchableOpacity>
            </View>

            <XPHeaderBadge />
          </View>
        </View>

        {/* --- TABS --- */}
        <View className="flex-row items-center mx-5 mb-6 gap-3">
          <GlassView
            glassEffectStyle="regular"
            isInteractive
            tintColor="#3A7AFE"
            style={{ flex: 1, borderRadius: 999, overflow: "hidden" }}
          >
            <View
              style={{ padding: 4, flexDirection: "row", position: "relative" }}
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
              {FILTER_DAYS.map((filter) => (
                <TouchableOpacity
                  key={filter.key}
                  onPress={() => setSelectedDayFilter(filter.key)}
                  className="flex-1 py-3.5 items-center"
                >
                  <Text
                    className={`text-[12px] font-generalsans-semibold ${selectedDayFilter === filter.key ? "text-white" : "text-white/70"}`}
                  >
                    {filter.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </GlassView>

          <GlassView
            glassEffectStyle="regular"
            tintColor="#3A7AFE"
            isInteractive
            style={{
              width: 48,
              aspectRatio: 1,
              borderRadius: 999,
              overflow: "hidden",
            }}
          >
            <TouchableOpacity
              onPress={() => router.push("/create")}
              className="flex-1 items-center justify-center"
            >
              <Ionicons name="add" size={28} color="white" />
            </TouchableOpacity>
          </GlassView>
        </View>

        {/* --- LIST --- */}
        <FlatList
          key={selectedDayFilter}
          data={sortedResolutions}
          keyExtractor={(item) => item._id}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
          renderItem={({ item, index }) => (
            <SquircleCard
              item={item}
              index={index}
              currentFilter={selectedDayFilter}
              isCompleted={
                todayLogs?.find((l) => l.userResolutionId === item._id)
                  ?.isCompleted
              }
              onPress={() => {
                setSelectedResolution(item);
                setTrackingModalVisible(true);
              }}
            />
          )}
          ListEmptyComponent={
            <Text className="text-white/60 text-center mt-20">
              No goals found.
            </Text>
          }
        />
      </SafeAreaView>

      {/* --- MODALS --- */}
      <TrackingModal
        visible={trackingModalVisible}
        onClose={() => setTrackingModalVisible(false)}
        resolution={selectedResolution}
        initialValue={
          selectedResolution
            ? todayLogs?.find(
                (l) => l.userResolutionId === selectedResolution._id,
              )?.currentValue
            : 0
        }
        onLevelUp={(cat, xp) => {
          setLevelUpData({ key: cat, xp });
          setLevelUpVisible(true);
        }}
      />

      <LevelUpOverlay
        visible={levelUpVisible}
        onClose={() => setLevelUpVisible(false)}
        categoryKey={levelUpData?.key || null}
        newTotalXp={levelUpData?.xp || 0}
      />

      <CollectionModal
        visible={collectionVisible}
        onClose={() => setCollectionVisible(false)}
      />

      {/* NEW STREAK MODAL */}
      <StreakModal
        visible={streakModalVisible}
        onClose={() => setStreakModalVisible(false)}
        resolutions={resolutions}
        globalStreak={user?.currentStreak || 0}
      />
    </View>
  );
}

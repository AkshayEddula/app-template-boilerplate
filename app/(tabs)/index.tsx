import { getCurrentStageInfo } from "@/components/homeComponents/CharacterCard";
import { CollectionModal } from "@/components/homeComponents/CollectionModal";
import { LevelUpOverlay } from "@/components/homeComponents/LevelupOverlay";
import { SquircleCard } from "@/components/homeComponents/SquircleCard";
import { StreakModal } from "@/components/homeComponents/StreakModal";
import { TrackingModal } from "@/components/homeComponents/TrackingModal";
import { XPHeaderBadge } from "@/components/homeComponents/XpHeaderBadge";
import { PaywallModal } from "@/components/Paywall"; // <--- 1. IMPORT PAYWALL
import { useSubscription } from "@/context/SubscriptionContext"; // <--- 2. IMPORT CONTEXT
import { api } from "@/convex/_generated/api";
import { Ionicons } from "@expo/vector-icons";
import { Fire02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { useQuery } from "convex/react";
import { GlassView } from "expo-glass-effect";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  FlatList,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import Animated, {
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  scheduleOnUI,
} from "react-native-worklets";

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
  currentStreak?: number;
  lastCompletedDate?: string;
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

// --- Components ---

const SkeletonCard = ({ index }: { index: number }) => {
  const opacity = useSharedValue(0.5);

  useEffect(() => {
    opacity.value = withDelay(
      index * 100,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 1000 }),
          withTiming(0.5, { duration: 1000 })
        ),
        -1,
        true
      )
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      entering={FadeIn.delay(index * 100).duration(400)}
      style={[
        {
          height: 220,
          marginBottom: 16,
          borderRadius: 40,
          backgroundColor: "rgba(255,255,255,0.1)",
          padding: 24,
          overflow: "hidden",
        },
        animatedStyle,
      ]}
    >
      {/* Label Pill Skeleton */}
      <View className="flex-row justify-between mb-8">
        <View className="w-24 h-8 bg-white/20 rounded-full" />
        <View className="w-16 h-8 bg-white/20 rounded-full" />
      </View>

      {/* Title Skeletons */}
      <View className="mb-6">
        <View className="w-3/4 h-8 bg-white/20 rounded-lg mb-3" />
        <View className="w-1/2 h-8 bg-white/20 rounded-lg" />
      </View>

      {/* Footer Skeleton */}
      <View className="mt-auto flex-row items-center gap-3">
        <View className="w-3 h-3 rounded-full bg-white/20" />
        <View className="w-32 h-4 bg-white/20 rounded-lg" />
      </View>
    </Animated.View>
  );
};

const EmptyState = ({ filter }: { filter: string }) => {
  const getMessage = () => {
    switch (filter) {
      case "today":
        return {
          title: "All Clear For Today",
          subtitle: "No active resolutions scheduled for today.",
          icon: "sunny",
        };
      case "pending":
        return {
          title: "You're All Caught Up!",
          subtitle: "Outstanding work! No pending goals.",
          icon: "checkmark-done-circle",
        };
      case "completed":
        return {
          title: "No Completions Yet",
          subtitle: "Complete a goal to see it here.",
          icon: "time",
        };
      default:
        return {
          title: "Your Journey Awaits",
          subtitle: "Tap the + button to create your first resolution.",
          icon: "flag",
        };
    }
  };

  const content = getMessage();

  return (
    <View className="items-center justify-center pt-20 px-4">
      {/* Icon Container */}
      <View className="mb-6 relative">
        <View className="w-24 h-24 rounded-[32px] bg-white/10 items-center justify-center border border-white/20 rotate-3">
          <Ionicons name={content.icon as any} size={48} color="white" />
        </View>
        <View className="absolute -bottom-2 -right-2 w-12 h-12 rounded-full bg-[#3A7AFE] items-center justify-center border-4 border-[#5B8DEF]">
          <Ionicons name="sparkles" size={20} color="white" />
        </View>
      </View>

      <Text className="text-white font-generalsans-bold text-2xl text-center mb-2 tracking-tight">
        {content.title}
      </Text>
      <Text className="text-white/60 font-generalsans-medium text-base text-center max-w-[280px] leading-6">
        {content.subtitle}
      </Text>

      {filter === "all" && (
        <View className="mt-8">
          <Ionicons
            name="arrow-down"
            size={24}
            color="rgba(255,255,255,0.3)"
            className="animate-bounce"
          />
        </View>
      )}
    </View>
  );
};

export default function HomeScreen() {
  const router = useRouter();
  const { isPremium } = useSubscription(); // <--- 3. GET PREMIUM STATUS

  // Queries
  const user = useQuery(api.users.currentUser);
  const resolutions = useQuery(api.userResolutions.listActive);
  const allCards = useQuery(api.stats.getAllCards);
  const todayStr = new Date().toISOString().split("T")[0];
  const todayLogs = useQuery(api.resolutions.getTodayLogs, { date: todayStr });

  const isLoading = resolutions === undefined || todayLogs === undefined;

  // State
  const [selectedResolution, setSelectedResolution] =
    useState<Resolution | null>(null);
  const [isModalReadOnly, setIsModalReadOnly] = useState(false);
  const [trackingModalVisible, setTrackingModalVisible] = useState(false);
  const [selectedDayFilter, setSelectedDayFilter] = useState("today");

  // New States
  const [levelUpVisible, setLevelUpVisible] = useState(false);
  const [collectionVisible, setCollectionVisible] = useState(false);
  const [streakModalVisible, setStreakModalVisible] = useState(false);
  const [paywallVisible, setPaywallVisible] = useState(false); // <--- 4. PAYWALL STATE

  const [levelUpData, setLevelUpData] = useState<{
    key: string;
    xp: number;
    isLevelUp: boolean;
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
    scheduleOnUI(() => {
      "worklet";
      selectedIndex.value = idx;
    });
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
        <View className="flex-1 w-full max-w-[600px] self-center">
          {/* --- HEADER --- */}
          <View className="px-6 pb-6 pt-2 flex-row justify-between items-center">
            {/* STREAK BADGE */}
            <TouchableOpacity
              onPress={() => setStreakModalVisible(true)}
              activeOpacity={0.7}
            >
              <View className="flex-row items-center pl-2 pr-3 py-1.5 rounded-[36px]">
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
                    color={user?.currentStreak ? "#fff" : "#fff"}
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

            <View className="flex-row items-center justify-center gap-2">


              <View className="rounded-[32px]">
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
                onPress={() => {
                  // Example: Limit free users to 3 resolutions
                  /* if (!isPremium && resolutions && resolutions.length >= 3) {
                    setPaywallVisible(true);
                    return;
                  } */
                  router.push("/create");
                }}
                className="flex-1 items-center justify-center"
              >
                <Ionicons name="add" size={28} color="white" />
              </TouchableOpacity>
            </GlassView>
          </View>

          {/* --- LIST vs LOADING --- */}
          {isLoading ? (
            <View className="flex-1 px-5 pt-2">
              {[1, 2, 3].map((i) => (
                <SkeletonCard key={i} index={i} />
              ))}
            </View>
          ) : (
            <FlatList
              key={selectedDayFilter}
              data={sortedResolutions}
              keyExtractor={(item) => item._id}
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
                    const isAvailable = isTaskToday(item);
                    setSelectedResolution(item);
                    setIsModalReadOnly(!isAvailable);
                    setTrackingModalVisible(true);
                  }}
                />
              )}
              ListEmptyComponent={
                <EmptyState filter={selectedDayFilter} />
              }
              contentContainerStyle={{
                paddingHorizontal: 20,
                paddingBottom: 120, // Increased bottom padding for floating feel
                paddingTop: 8,
              }}
            />
          )}
        </View>
      </SafeAreaView>

      {/* --- MODALS --- */}
      <TrackingModal
        visible={trackingModalVisible}
        onClose={() => setTrackingModalVisible(false)}
        resolution={selectedResolution}
        readOnly={isModalReadOnly}
        initialValue={
          selectedResolution
            ? todayLogs?.find(
              (l) => l.userResolutionId === selectedResolution._id,
            )?.currentValue
            : 0
        }
        onLevelUp={(cat, newXp, oldXp) => {
          const { current: oldStage } = getCurrentStageInfo(oldXp);
          const { current: newStage } = getCurrentStageInfo(newXp);
          const isLevelUp = newStage.stage > oldStage.stage;

          setLevelUpData({ key: cat, xp: newXp, isLevelUp });
          setLevelUpVisible(true);
        }}
        currentCategoryXp={
          allCards?.find((c) => c.categoryKey === selectedResolution?.categoryKey)?.currentXp || 0
        }
      />

      <LevelUpOverlay
        visible={levelUpVisible}
        onClose={() => setLevelUpVisible(false)}
        categoryKey={levelUpData?.key || null}
        newTotalXp={levelUpData?.xp || 0}
        imageUrl={allCards?.find((c) => c.categoryKey === levelUpData?.key)?.image}
        isLevelUp={levelUpData?.isLevelUp || false}
      />

      <CollectionModal
        visible={collectionVisible}
        onClose={() => setCollectionVisible(false)}
      />

      <StreakModal
        visible={streakModalVisible}
        onClose={() => setStreakModalVisible(false)}
        resolutions={resolutions}
        globalStreak={user?.currentStreak || 0}
      />

      {/* --- PAYWALL MODAL --- */}
      <PaywallModal
        visible={paywallVisible}
        onClose={() => setPaywallVisible(false)}
      />
    </View>
  );
}

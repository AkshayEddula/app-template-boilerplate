import { getCurrentStageInfo } from "@/components/homeComponents/CharacterCard";
import { CollectionModal } from "@/components/homeComponents/CollectionModal";
import { LevelUpOverlay } from "@/components/homeComponents/LevelupOverlay";
import { SquircleCard } from "@/components/homeComponents/SquircleCard";
import { StreakModal } from "@/components/homeComponents/StreakModal";
import { TrackingModal } from "@/components/homeComponents/TrackingModal";
import { XPHeaderBadge } from "@/components/homeComponents/XpHeaderBadge";
import { PaywallModal } from "@/components/Paywall";
import { useGuest } from "@/context/GuestContext";
import { useSubscription } from "@/context/SubscriptionContext";
import { api } from "@/convex/_generated/api";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "convex/react";
import { useFocusEffect, useRouter } from "expo-router";
import { setStatusBarStyle } from "expo-status-bar";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  FlatList,
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

// Theme Colors
const BG_COLOR = "#FAF9F6";
const TEXT_PRIMARY = "#1A1A1A";
const TEXT_SECONDARY = "#6B7280";
const ACCENT_ORANGE = "#F97316";

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

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return "Morning";
  if (hour < 17) return "Afternoon";
  return "Evening";
};

const getFormattedDate = () => {
  const now = new Date();
  return now.toLocaleDateString("en-US", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

const getWeekDays = () => {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const monday = new Date(today);
  monday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));

  const days = [];
  const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  for (let i = 0; i < 7; i++) {
    const date = new Date(monday);
    date.setDate(monday.getDate() + i);
    days.push({
      name: dayNames[i],
      date: date.getDate(),
      isToday: date.toDateString() === today.toDateString(),
      isPast: date < today && date.toDateString() !== today.toDateString(),
      fullDate: date,
    });
  }
  return days;
};

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

// --- Week Strip Component ---
const WeekStrip = ({ streakDays }: { streakDays: string[] }) => {
  const weekDays = getWeekDays();

  return (
    <View style={{ marginBottom: 24 }}>
      {/* Day Names */}
      <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 10, paddingHorizontal: 4 }}>
        {weekDays.map((day, index) => (
          <Text
            key={index}
            style={{
              width: 44,
              textAlign: "center",
              fontSize: 12,
              fontFamily: day.isToday ? "Nunito-Bold" : "Nunito-Medium",
              color: day.isToday ? TEXT_PRIMARY : TEXT_SECONDARY,
            }}
          >
            {day.name}
          </Text>
        ))}
      </View>

      {/* Day Circles with Streak Indicators */}
      <View style={{ flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 4 }}>
        {weekDays.map((day, index) => {
          const dateStr = day.fullDate.toISOString().split("T")[0];
          const hasStreak = streakDays.includes(dateStr);
          const isFuture = day.fullDate > new Date() && !day.isToday;

          return (
            <View
              key={index}
              style={{
                width: 44,
                alignItems: "center",
              }}
            >
              {/* Day Number Circle */}
              <View
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 14,
                  backgroundColor: day.isToday ? TEXT_PRIMARY : "#F3F4F6",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 6,
                }}
              >
                <Text
                  style={{
                    fontSize: 15,
                    fontFamily: "Nunito-Bold",
                    color: day.isToday ? "#FFFFFF" : isFuture ? "#D1D5DB" : TEXT_PRIMARY,
                  }}
                >
                  {day.date}
                </Text>
              </View>

              {/* Streak Fire Symbol */}
              <Text
                style={{
                  fontSize: 14,
                  opacity: hasStreak ? 1 : isFuture ? 0.2 : 0.3,
                }}
              >
                {hasStreak ? "🔥" : "🔥"}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
};


// --- Skeleton Card ---
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
          height: 80,
          marginBottom: 12,
          borderRadius: 20,
          backgroundColor: "#E5E7EB",
        },
        animatedStyle,
      ]}
    />
  );
};

// --- Empty State ---
const EmptyState = ({ filter }: { filter: string }) => {
  return (
    <View style={{ alignItems: "center", justifyContent: "center", paddingTop: 60 }}>
      <View
        style={{
          width: 64,
          height: 64,
          borderRadius: 20,
          backgroundColor: "#F3F4F6",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 16,
        }}
      >
        <Ionicons name="sunny-outline" size={32} color={ACCENT_ORANGE} />
      </View>
      <Text style={{ fontFamily: "Nunito-Bold", fontSize: 18, color: TEXT_PRIMARY, marginBottom: 4 }}>
        All Clear!
      </Text>
      <Text style={{ fontFamily: "Nunito-Medium", fontSize: 14, color: TEXT_SECONDARY, textAlign: "center" }}>
        No tasks for this filter.
      </Text>
    </View>
  );
};

// --- Main Component ---
export default function HomeScreen() {
  const router = useRouter();
  const { isPremium } = useSubscription();
  const { isGuest, guestResolutions } = useGuest();

  const user = useQuery(api.users.currentUser);
  const resolutions = useQuery(api.userResolutions.listActive);
  const allCards = useQuery(api.stats.getAllCards);
  const todayStr = new Date().toISOString().split("T")[0];
  const todayLogs = useQuery(api.resolutions.getTodayLogs, { date: todayStr });

  const finalResolutions = isGuest ? guestResolutions : resolutions;
  const isLoading = isGuest ? false : (resolutions === undefined || todayLogs === undefined);

  // State
  const [selectedResolution, setSelectedResolution] = useState<Resolution | null>(null);
  const [isModalReadOnly, setIsModalReadOnly] = useState(false);
  const [trackingModalVisible, setTrackingModalVisible] = useState(false);
  const [selectedDayFilter, setSelectedDayFilter] = useState("today");

  // Modal States
  const [levelUpVisible, setLevelUpVisible] = useState(false);
  const [collectionVisible, setCollectionVisible] = useState(false);
  const [streakModalVisible, setStreakModalVisible] = useState(false);
  const [paywallVisible, setPaywallVisible] = useState(false);

  // Reset status bar when screen is focused
  useFocusEffect(
    useCallback(() => {
      setStatusBarStyle("dark");
    }, [])
  );

  const [levelUpData, setLevelUpData] = useState<{
    key: string;
    xp: number;
    isLevelUp: boolean;
  } | null>(null);

  // Get streak days for this week
  const streakDays = useMemo(() => {
    if (!todayLogs) return [];
    return todayLogs
      .filter(log => log.isCompleted)
      .map(log => todayStr);
  }, [todayLogs, todayStr]);

  const sortedResolutions = useMemo(() => {
    if (!finalResolutions) return [];
    return (finalResolutions as any[])
      .filter((item) => {
        const isToday = isTaskToday(item as Resolution);
        let isCompleted = false;
        if (isGuest) {
          isCompleted = item.logs?.[todayStr]?.isCompleted || false;
        } else {
          isCompleted = todayLogs?.find((l) => l.userResolutionId === item._id)?.isCompleted || false;
        }
        // Show all in "today" (All) view, including not scheduled
        if (selectedDayFilter === "today") return true;
        if (selectedDayFilter === "pending") return isToday && !isCompleted;
        if (selectedDayFilter === "completed") return isToday && isCompleted;
        return true;
      })
      .sort((a, b) => {
        // First sort: Today's tasks first, then not scheduled
        const aIsToday = isTaskToday(a as Resolution);
        const bIsToday = isTaskToday(b as Resolution);
        if (aIsToday !== bIsToday) return aIsToday ? -1 : 1;

        // Second sort: Incomplete first, completed last
        const aComp = isGuest ? a.logs?.[todayStr]?.isCompleted : todayLogs?.find(l => l.userResolutionId === a._id)?.isCompleted;
        const bComp = isGuest ? b.logs?.[todayStr]?.isCompleted : todayLogs?.find(l => l.userResolutionId === b._id)?.isCompleted;
        if (aComp === bComp) return 0;
        return aComp ? 1 : -1;
      });
  }, [finalResolutions, todayLogs, selectedDayFilter, isGuest, todayStr]);

  return (
    <View style={{ flex: 1, backgroundColor: BG_COLOR }}>
      <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
        <View style={{ flex: 1, width: "100%", maxWidth: 600, alignSelf: "center" }}>
          {/* --- HEADER --- */}
          <View style={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 20 }}>
            {/* Greeting Row */}
            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 4 }}>
              <View style={{ flex: 1, paddingRight: 8 }}>
                <Text numberOfLines={1} adjustsFontSizeToFit style={{ fontFamily: "Nunito-Bold", fontSize: 26, color: TEXT_PRIMARY }}>
                  {getGreeting()}, {user?.name?.split(" ")[0] || "there"}
                </Text>
                <Text style={{ fontFamily: "Nunito-Medium", fontSize: 13, color: TEXT_SECONDARY, marginTop: 2 }}>
                  {getFormattedDate()}
                </Text>
              </View>

              {/* Right: XP Badge, Vault & Streak Buttons */}
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                {/* XP Badge */}
                <XPHeaderBadge />

                {/* Vault Button */}
                <TouchableOpacity
                  onPress={() => setCollectionVisible(true)}
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 22,
                    backgroundColor: "#F0FDF4",
                    alignItems: "center",
                    justifyContent: "center",
                    borderWidth: 2,
                    borderColor: "#BBF7D0",
                  }}
                >
                  <Text style={{ fontSize: 20 }}>📦</Text>
                </TouchableOpacity>

                {/* Streak Button */}
                <TouchableOpacity
                  onPress={() => setStreakModalVisible(true)}
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 22,
                    backgroundColor: "#FEF3C7",
                    alignItems: "center",
                    justifyContent: "center",
                    borderWidth: 2,
                    borderColor: "#FDE68A",
                  }}
                >
                  <Text style={{ fontSize: 20 }}>🔥</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Week Strip */}
          <View style={{ paddingHorizontal: 20 }}>
            <WeekStrip streakDays={streakDays} />
          </View>

          {/* Daily Routine Header */}
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, marginBottom: 12 }}>
            <Text style={{ fontFamily: "Nunito-Bold", fontSize: 20, color: TEXT_PRIMARY }}>
              Daily resolutions
            </Text>
            <TouchableOpacity
              onPress={() => router.push("/create")}
              activeOpacity={0.8}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 6,
                backgroundColor: ACCENT_ORANGE,
                paddingVertical: 10,
                paddingHorizontal: 16,
                borderRadius: 999,
                shadowColor: ACCENT_ORANGE,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
                elevation: 4,
              }}
            >
              <Ionicons name="add" size={18} color="#FFFFFF" />
              <Text style={{ fontFamily: "Nunito-Bold", fontSize: 13, color: "#FFFFFF" }}>
                Add Goal
              </Text>
            </TouchableOpacity>
          </View>

          {/* Filter Pills */}
          <View style={{ flexDirection: "row", gap: 8, paddingHorizontal: 20, marginBottom: 16 }}>
            {[
              { key: "today", label: "All", emoji: "📋" },
              { key: "pending", label: "Pending", emoji: "⏳" },
              { key: "completed", label: "Done", emoji: "✅" },
            ].map((filter) => {
              const isActive = selectedDayFilter === filter.key;
              return (
                <TouchableOpacity
                  key={filter.key}
                  onPress={() => setSelectedDayFilter(filter.key)}
                  activeOpacity={0.7}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 6,
                    paddingVertical: 10,
                    paddingHorizontal: 16,
                    borderRadius: 999,
                    backgroundColor: isActive ? TEXT_PRIMARY : "#FFFFFF",
                    borderWidth: 1.5,
                    borderColor: isActive ? TEXT_PRIMARY : "#E5E7EB",
                  }}
                >
                  <Text style={{ fontSize: 14 }}>{filter.emoji}</Text>
                  <Text
                    style={{
                      fontFamily: "Nunito-Bold",
                      fontSize: 13,
                      color: isActive ? "#FFFFFF" : TEXT_SECONDARY,
                    }}
                  >
                    {filter.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* --- LIST --- */}
          {isLoading ? (
            <View style={{ flex: 1, paddingHorizontal: 20 }}>
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
                    isGuest
                      ? (item as any).logs?.[todayStr]?.isCompleted
                      : todayLogs?.find((l) => l.userResolutionId === item._id)?.isCompleted
                  }
                  onPress={() => {
                    const isAvailable = isTaskToday(item);
                    setSelectedResolution(item);
                    setIsModalReadOnly(!isAvailable);
                    setTrackingModalVisible(true);
                  }}
                />
              )}
              ListEmptyComponent={<EmptyState filter={selectedDayFilter} />}
              contentContainerStyle={{
                paddingHorizontal: 20,
                paddingBottom: 120,
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
            ? (isGuest
              ? ((selectedResolution as any).logs?.[todayStr]?.value || 0)
              : todayLogs?.find((l) => l.userResolutionId === selectedResolution._id)?.currentValue
            )
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

      <PaywallModal
        visible={paywallVisible}
        onClose={() => setPaywallVisible(false)}
      />
    </View>
  );
}
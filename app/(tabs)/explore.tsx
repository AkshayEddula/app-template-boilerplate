import { CharacterCard } from "@/components/homeComponents/CharacterCard";
import { PaywallModal } from "@/components/Paywall";
import { useSubscription } from "@/context/SubscriptionContext";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@clerk/clerk-expo";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "convex/react";
import { BlurView } from "expo-blur";
import { useFocusEffect, useRouter } from "expo-router";
import { setStatusBarStyle } from "expo-status-bar";
import React, { useCallback, useMemo, useState } from "react";
import {
  Dimensions,
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import Animated, { FadeIn, FadeInDown, FadeInUp } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Circle, Path, Line as SvgLine } from "react-native-svg";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// Theme
const BG_COLOR = "#FAF9F6";
const TEXT_PRIMARY = "#1A1A1A";
const TEXT_SECONDARY = "#6B7280";
const ACCENT_ORANGE = "#F97316";

// Categories
const CATEGORIES: Record<string, { icon: string; color: string; bg: string }> = {
  health: { icon: "💧", color: "#10B981", bg: "#ECFDF5" },
  mind: { icon: "🧘", color: "#8B5CF6", bg: "#F5F3FF" },
  career: { icon: "💼", color: "#3B82F6", bg: "#EFF6FF" },
  life: { icon: "🌟", color: "#F59E0B", bg: "#FFFBEB" },
  fun: { icon: "🎮", color: "#EC4899", bg: "#FDF2F8" },
};

const TABS = [
  { key: "vault", label: "🎴 Vault" },
  { key: "stats", label: "📊 Stats" },
  { key: "rewards", label: "🏆 Rewards" },
];

const MILESTONES = [
  { days: 3, xp: 50, emoji: "🌱" },
  { days: 7, xp: 100, emoji: "🔥" },
  { days: 14, xp: 200, emoji: "⚡" },
  { days: 30, xp: 500, emoji: "💎" },
  { days: 60, xp: 1000, emoji: "👑" },
];

// Bezier curve helper for smooth graph
const createSmoothPath = (data: { value: number }[], width: number, height: number, padding: number = 12) => {
  if (!data || data.length === 0) return { path: "", lastPoint: { x: 0, y: 0 }, points: [] };
  const drawWidth = width - padding * 2;
  const drawHeight = height - padding * 2;
  const maxVal = Math.max(...data.map((d) => d.value), 100);
  const getX = (index: number) => padding + (index / (data.length - 1)) * drawWidth;
  const getY = (val: number) => padding + drawHeight - (val / maxVal) * drawHeight;
  const points = data.map((d, i) => ({ x: getX(i), y: getY(d.value) }));

  if (points.length === 1) return { path: `M ${points[0].x},${points[0].y}`, lastPoint: points[0], points };

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

export default function ExploreScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("vault");
  const [paywallVisible, setPaywallVisible] = useState(false);
  const { isPremium } = useSubscription();
  const { isSignedIn } = useAuth();
  const isLocked = !isPremium;

  useFocusEffect(
    useCallback(() => {
      setStatusBarStyle("dark");
    }, [])
  );

  return (
    <View style={styles.container}>
      <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
        <View style={{ flex: 1, width: "100%", maxWidth: 600, alignSelf: "center" }}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
              <Ionicons name="chevron-back" size={22} color={TEXT_PRIMARY} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Explore</Text>
            <View style={{ width: 44 }} />
          </View>

          {/* Tabs */}
          <View style={styles.tabContainer}>
            {TABS.map((tab) => (
              <TouchableOpacity
                key={tab.key}
                onPress={() => setActiveTab(tab.key)}
                style={[styles.tab, activeTab === tab.key && styles.tabActive]}
              >
                <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Content */}
          {activeTab === "vault" && <VaultView />}
          {activeTab === "stats" && <StatsView />}
          {activeTab === "rewards" && <RewardsView />}

          {/* Locked Overlay */}
          {isLocked && (
            <LockedOverlay
              onUnlock={() => setPaywallVisible(true)}
            />
          )}
        </View>
      </SafeAreaView>

      <PaywallModal visible={paywallVisible} onClose={() => setPaywallVisible(false)} />
    </View>
  );
}

// --- VAULT VIEW ---
function VaultView() {
  const allCards = useQuery(api.stats.getAllCards) || [];
  const [filter, setFilter] = useState("all");

  const filtered = useMemo(() => {
    if (filter === "all") return allCards;
    return allCards.filter((c) => c.categoryKey === filter);
  }, [allCards, filter]);

  const filters = ["all", "health", "mind", "career", "life", "fun"];

  return (
    <Animated.View entering={FadeIn} style={{ flex: 1 }}>
      {/* Filters */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterRow}
      >
        {filters.map((f) => {
          const isActive = filter === f;
          const cat = CATEGORIES[f];
          return (
            <TouchableOpacity
              key={f}
              onPress={() => setFilter(f)}
              style={[styles.filterPill, isActive && { backgroundColor: TEXT_PRIMARY }]}
            >
              <Text style={{ fontSize: 13 }}>{cat?.icon || "📋"}</Text>
              <Text style={[styles.filterText, isActive && { color: "#FFF" }]}>
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Cards Grid */}
      <FlatList
        data={filtered}
        keyExtractor={(item) => item._id}
        numColumns={2}
        contentContainerStyle={{ paddingHorizontal: 12, paddingBottom: 100 }}
        columnWrapperStyle={{ gap: 8, marginBottom: 8 }}
        showsVerticalScrollIndicator={false}
        renderItem={({ item, index }) => (
          <Animated.View entering={FadeInUp.delay(index * 40)} style={{ flex: 1 }}>
            <CharacterCard
              categoryKey={item.categoryKey}
              xp={item.currentXp || 0}
              stage={item.stage}
              stageName={item.stageName}
              minXp={item.minXp}
              imageUrl={item.image}
              isLocked={!item.isUnlocked}
            />
          </Animated.View>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={{ fontSize: 48 }}>🎴</Text>
            <Text style={styles.emptyTitle}>No Cards Yet</Text>
            <Text style={styles.emptySubtitle}>Complete goals to unlock cards</Text>
          </View>
        }
      />
    </Animated.View>
  );
}

// --- STATS VIEW ---
function StatsView() {
  const resolutions = useQuery(api.resolutions.getResolutionAnalytics) || [];

  return (
    <Animated.View entering={FadeIn} style={{ flex: 1 }}>
      <FlatList
        data={resolutions}
        keyExtractor={(item) => item._id}
        contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        renderItem={({ item, index }) => {
          const cat = CATEGORIES[item.categoryKey] || { icon: "✨", color: ACCENT_ORANGE, bg: "#FFF7ED" };
          const streak = item.currentStreak || 0;
          const best = item.bestStreak || streak;
          const history = item.history?.slice(-7) || [];
          const avg = history.length > 0
            ? Math.round(history.reduce((sum: number, h: any) => sum + h.value, 0) / history.length)
            : 0;

          return (
            <Animated.View entering={FadeInDown.delay(index * 60)} style={styles.statCard}>
              {/* Header */}
              <View style={styles.statHeader}>
                <View style={[styles.statIcon, { backgroundColor: cat.bg }]}>
                  <Text style={{ fontSize: 20 }}>{cat.icon}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.statTitle}>{item.title}</Text>
                  <Text style={styles.statSubtitle}>Last 7 days • {avg}% avg</Text>
                </View>
              </View>

              {/* Streaks */}
              <View style={styles.streakRow}>
                <View style={styles.streakBox}>
                  <Text style={{ fontSize: 20 }}>🔥</Text>
                  <Text style={styles.streakNum}>{streak}</Text>
                  <Text style={styles.streakLabel}>Current</Text>
                </View>
                <View style={styles.streakBox}>
                  <Text style={{ fontSize: 20 }}>🏆</Text>
                  <Text style={styles.streakNum}>{best}</Text>
                  <Text style={styles.streakLabel}>Best</Text>
                </View>
              </View>

              {/* Smooth Line Graph */}
              <LineGraph data={history} color={cat.color} />
            </Animated.View>
          );
        }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={{ fontSize: 48 }}>📊</Text>
            <Text style={styles.emptyTitle}>No Stats Yet</Text>
            <Text style={styles.emptySubtitle}>Start tracking goals to see analytics</Text>
          </View>
        }
      />
    </Animated.View>
  );
}

// --- LINE GRAPH COMPONENT ---
function LineGraph({ data, color }: { data: { value: number; day: string }[]; color: string }) {
  const GRAPH_WIDTH = SCREEN_WIDTH - 80;
  const GRAPH_HEIGHT = 100;

  const { path, lastPoint, points } = useMemo(
    () => createSmoothPath(data, GRAPH_WIDTH, GRAPH_HEIGHT, 12),
    [data, GRAPH_WIDTH]
  );

  if (data.length === 0) return null;

  return (
    <View style={{ backgroundColor: "#F9FAFB", borderRadius: 20, padding: 12, paddingBottom: 8 }}>
      <View style={{ height: GRAPH_HEIGHT }}>
        <Svg height={GRAPH_HEIGHT} width={GRAPH_WIDTH} style={{ alignSelf: "center" }}>
          {/* Center line */}
          <SvgLine
            x1="12"
            y1={GRAPH_HEIGHT / 2}
            x2={GRAPH_WIDTH - 12}
            y2={GRAPH_HEIGHT / 2}
            stroke="#E5E7EB"
            strokeDasharray="4 4"
          />
          {/* Shadow */}
          <Path d={path} stroke="rgba(0,0,0,0.08)" strokeWidth="4" strokeLinecap="round" fill="none" y="3" />
          {/* Main line */}
          <Path d={path} stroke={color} strokeWidth="3" strokeLinecap="round" fill="none" />
          {/* Dots */}
          {points.map((p: any, i: number) => (
            <Circle
              key={i}
              cx={p.x}
              cy={p.y}
              r={i === points.length - 1 ? 5 : 3}
              fill="#FFFFFF"
              stroke={color}
              strokeWidth={i === points.length - 1 ? 3 : 2}
            />
          ))}
        </Svg>
      </View>
      {/* Day labels */}
      <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 6, paddingHorizontal: 4 }}>
        {data.map((d, i) => (
          <Text
            key={i}
            style={{
              fontFamily: "Nunito-Bold",
              fontSize: 10,
              color: i === data.length - 1 ? TEXT_PRIMARY : TEXT_SECONDARY,
              textAlign: "center",
              width: 20,
            }}
          >
            {d.day}
          </Text>
        ))}
      </View>
    </View>
  );
}

// --- REWARDS VIEW ---
function RewardsView() {
  const user = useQuery(api.users.currentUser);
  const currentStreak = user?.currentStreak || 0;

  return (
    <Animated.View entering={FadeIn} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
        {/* Current Streak */}
        <View style={styles.streakHero}>
          <Text style={{ fontSize: 48 }}>🔥</Text>
          <Text style={styles.heroNum}>{currentStreak}</Text>
          <Text style={styles.heroLabel}>Day Streak</Text>
        </View>

        {/* Milestones */}
        <Text style={styles.sectionTitle}>Streak Rewards</Text>

        {MILESTONES.map((m, index) => {
          const unlocked = currentStreak >= m.days;
          return (
            <Animated.View
              key={m.days}
              entering={FadeInUp.delay(index * 60)}
              style={[styles.milestoneRow, !unlocked && { opacity: 0.5 }]}
            >
              <View style={styles.milestoneLeft}>
                <View style={[styles.milestoneIcon, unlocked && { backgroundColor: "#FEF3C7", borderColor: "#FDE68A" }]}>
                  <Text style={{ fontSize: 20 }}>{m.emoji}</Text>
                </View>
                <View>
                  <Text style={styles.milestoneDays}>{m.days} Day Streak</Text>
                  <Text style={styles.milestoneStatus}>{unlocked ? "Achieved! ✓" : "Locked"}</Text>
                </View>
              </View>
              <View style={[styles.xpBadge, unlocked && { backgroundColor: "#ECFDF5" }]}>
                <Text style={[styles.xpText, unlocked && { color: "#22C55E" }]}>+{m.xp} XP</Text>
              </View>
            </Animated.View>
          );
        })}

        {/* Info */}
        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>💡 How It Works</Text>
          <Text style={styles.infoText}>• Complete at least one task daily to keep your streak</Text>
          <Text style={styles.infoText}>• Reach milestones to earn bonus XP</Text>
          <Text style={styles.infoText}>• Missing a day resets your streak to 0</Text>
        </View>
      </ScrollView>
    </Animated.View>
  );
}

// --- LOCKED OVERLAY ---
function LockedOverlay({ onUnlock }: { onUnlock: () => void }) {
  return (
    <View style={StyleSheet.absoluteFill}>
      <BlurView intensity={40} tint="light" style={StyleSheet.absoluteFill} />
      <View style={{ ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(255,255,255,0.7)" }} />
      <View style={styles.lockedContent}>
        <View style={styles.lockIcon}>
          <Text style={{ fontSize: 40 }}>🔒</Text>
        </View>
        <Text style={styles.lockTitle}>Premium Feature</Text>
        <Text style={styles.lockSubtitle}>Unlock analytics, the Vault, and streak rewards</Text>
        <TouchableOpacity onPress={onUnlock} style={styles.unlockBtn}>
          <Text style={styles.unlockBtnText}>Unlock Premium</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG_COLOR,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontFamily: "Nunito-Bold",
    fontSize: 22,
    color: TEXT_PRIMARY,
  },
  tabContainer: {
    flexDirection: "row",
    marginHorizontal: 20,
    backgroundColor: "#F3F4F6",
    borderRadius: 999,
    padding: 4,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    borderRadius: 999,
  },
  tabActive: {
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  tabText: {
    fontFamily: "Nunito-Bold",
    fontSize: 13,
    color: TEXT_SECONDARY,
  },
  tabTextActive: {
    color: TEXT_PRIMARY,
  },
  filterRow: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    gap: 8,
  },
  filterPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  filterText: {
    fontFamily: "Nunito-Bold",
    fontSize: 13,
    lineHeight: 16,
    color: TEXT_PRIMARY,
  },
  empty: {
    alignItems: "center",
    paddingTop: 80,
  },
  emptyTitle: {
    fontFamily: "Nunito-Bold",
    fontSize: 18,
    color: TEXT_PRIMARY,
    marginTop: 16,
  },
  emptySubtitle: {
    fontFamily: "Nunito-Medium",
    fontSize: 14,
    color: TEXT_SECONDARY,
    marginTop: 4,
  },
  statCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 18,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  statHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginBottom: 16,
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  statTitle: {
    fontFamily: "Nunito-Bold",
    fontSize: 16,
    color: TEXT_PRIMARY,
  },
  statSubtitle: {
    fontFamily: "Nunito-Medium",
    fontSize: 12,
    color: TEXT_SECONDARY,
    marginTop: 2,
  },
  streakRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  streakBox: {
    flex: 1,
    backgroundColor: "#F9FAFB",
    borderRadius: 16,
    padding: 14,
    alignItems: "center",
  },
  streakNum: {
    fontFamily: "Nunito-Bold",
    fontSize: 28,
    color: TEXT_PRIMARY,
    marginTop: 4,
  },
  streakLabel: {
    fontFamily: "Nunito-Medium",
    fontSize: 11,
    color: TEXT_SECONDARY,
  },
  chartRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    height: 60,
    alignItems: "flex-end",
  },
  chartBarContainer: {
    flex: 1,
    alignItems: "center",
  },
  chartBar: {
    width: 20,
    borderRadius: 6,
    marginBottom: 4,
  },
  chartLabel: {
    fontFamily: "Nunito-Bold",
    fontSize: 9,
    color: TEXT_SECONDARY,
  },
  streakHero: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 28,
    padding: 32,
    marginBottom: 28,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  heroNum: {
    fontFamily: "Nunito-Bold",
    fontSize: 64,
    color: TEXT_PRIMARY,
    marginTop: 8,
  },
  heroLabel: {
    fontFamily: "Nunito-Medium",
    fontSize: 16,
    color: TEXT_SECONDARY,
  },
  sectionTitle: {
    fontFamily: "Nunito-Bold",
    fontSize: 18,
    color: TEXT_PRIMARY,
    marginBottom: 16,
  },
  milestoneRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFFFFF",
    borderRadius: 999,
    padding: 12,
    paddingRight: 16,
    marginBottom: 10,
  },
  milestoneLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  milestoneIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#E5E7EB",
  },
  milestoneDays: {
    fontFamily: "Nunito-Bold",
    fontSize: 15,
    color: TEXT_PRIMARY,
  },
  milestoneStatus: {
    fontFamily: "Nunito-Medium",
    fontSize: 12,
    color: TEXT_SECONDARY,
  },
  xpBadge: {
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
  },
  xpText: {
    fontFamily: "Nunito-Bold",
    fontSize: 14,
    color: TEXT_SECONDARY,
  },
  infoBox: {
    backgroundColor: "#FFF7ED",
    borderRadius: 20,
    padding: 18,
    marginTop: 20,
    borderWidth: 1,
    borderColor: "#FFEDD5",
  },
  infoTitle: {
    fontFamily: "Nunito-Bold",
    fontSize: 15,
    color: ACCENT_ORANGE,
    marginBottom: 10,
  },
  infoText: {
    fontFamily: "Nunito-Medium",
    fontSize: 13,
    color: "#9A3412",
    marginBottom: 4,
  },
  lockedContent: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
  },
  lockIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#FFF7ED",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  lockTitle: {
    fontFamily: "Nunito-Bold",
    fontSize: 24,
    color: TEXT_PRIMARY,
    marginBottom: 8,
  },
  lockSubtitle: {
    fontFamily: "Nunito-Medium",
    fontSize: 15,
    color: TEXT_SECONDARY,
    textAlign: "center",
    marginBottom: 28,
  },
  unlockBtn: {
    backgroundColor: ACCENT_ORANGE,
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 999,
    shadowColor: ACCENT_ORANGE,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 4,
  },
  unlockBtnText: {
    fontFamily: "Nunito-Bold",
    fontSize: 16,
    color: "#FFFFFF",
  },
});

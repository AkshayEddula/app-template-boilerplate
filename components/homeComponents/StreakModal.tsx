import { LockedView } from "@/components/LockedView";
import { PaywallModal } from "@/components/Paywall";
import { useSubscription } from "@/context/SubscriptionContext";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@clerk/clerk-expo";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "convex/react";
import { BlurView } from "expo-blur";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useMemo, useState } from "react";
import {
  Dimensions,
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";

// Theme Colors - matching home screen
const BG_COLOR = "#FAF9F6";
const TEXT_PRIMARY = "#1A1A1A";
const TEXT_SECONDARY = "#6B7280";
const ACCENT_ORANGE = "#F97316";

const SCREEN_HEIGHT = Dimensions.get('window').height;

// --- HELPER: Generate Calendar Data ---
const getMonthData = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  let startDay = new Date(year, month, 1).getDay();
  startDay = startDay === 0 ? 6 : startDay - 1;

  const days = [];
  for (let i = 0; i < startDay; i++) {
    days.push({ id: `pad-${i}`, isPadding: true });
  }

  for (let i = 1; i <= daysInMonth; i++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(i).padStart(2, "0")}`;
    days.push({
      id: `day-${i}`,
      day: i,
      date: dateStr,
      isToday: i === now.getDate(),
      isPadding: false,
    });
  }

  return {
    days,
    monthName: now.toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    }),
  };
};

// --- COMPONENT: Month Heatmap (Light Theme) ---
const MonthHeatmap = ({
  history,
}: {
  history: { date: string; value: number }[] | undefined;
}) => {
  const { days, monthName } = useMemo(() => getMonthData(), []);

  const isDateCompleted = (calendarDateStr: string) => {
    if (!history) return false;
    const log = history.find((h) => h.date === calendarDateStr);
    return log ? log.value >= 99.9 : false;
  };

  return (
    <View style={{ marginTop: 12 }}>
      {/* Legend */}
      <View style={styles.heatmapHeader}>
        <Text style={styles.monthLabel}>{monthName}</Text>
        <View style={styles.legendContainer}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: "#E5E7EB" }]} />
            <Text style={styles.legendText}>Pending</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: ACCENT_ORANGE }]} />
            <Text style={styles.legendText}>Done</Text>
          </View>
        </View>
      </View>

      {/* Calendar Grid */}
      <View style={styles.calendarGrid}>
        {days.map((item: any) => {
          if (item.isPadding) {
            return <View key={item.id} style={styles.dayCell} />;
          }
          const isFilled = isDateCompleted(item.date);
          const isToday = item.isToday;

          return (
            <View
              key={item.id}
              style={[
                styles.dayCell,
                {
                  backgroundColor: isFilled ? ACCENT_ORANGE : isToday ? TEXT_PRIMARY : "#F3F4F6",
                  borderWidth: isToday && !isFilled ? 2 : 0,
                  borderColor: TEXT_PRIMARY,
                },
              ]}
            >
              <Text
                style={{
                  fontSize: 10,
                  fontFamily: "Nunito-Bold",
                  color: isFilled || isToday ? "#FFFFFF" : TEXT_SECONDARY,
                }}
              >
                {item.day}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
};

// --- MAIN COMPONENT ---
export const StreakModal = ({
  visible,
  onClose,
  resolutions: propResolutions,
  globalStreak,
}: {
  visible: boolean;
  onClose: () => void;
  resolutions: any[] | undefined;
  globalStreak: number;
}) => {
  const analyticsData = useQuery(api.resolutions.getResolutionAnalytics);

  const activeStreaks = useMemo(() => {
    const sourceData = analyticsData || propResolutions;
    if (!sourceData) return [];
    return sourceData
      .filter((r) => r.isActive)
      .sort((a, b) => (b.currentStreak || 0) - (a.currentStreak || 0));
  }, [propResolutions, analyticsData]);

  const { isPremium } = useSubscription();
  const { isSignedIn } = useAuth();
  const router = useRouter();
  const [paywallVisible, setPaywallVisible] = useState(false);

  const isLocked = !isPremium || !isSignedIn;

  const handleUnlock = () => {
    if (!isPremium) {
      setPaywallVisible(true);
    } else if (!isSignedIn) {
      onClose();
      router.push("/(auth)/sign-up");
    }
  };

  const getLockedState = () => {
    if (!isPremium) {
      return {
        message: "Upgrade to Premium to view detailed streak history.",
        buttonText: "Unlock Access",
      };
    }
    if (!isSignedIn) {
      return {
        message: "Sign in to save and view your streak history.",
        buttonText: "Sign In / Register",
      };
    }
    return { message: "Locked", buttonText: "Unlock" };
  };

  const { message, buttonText } = getLockedState();

  return (
    <Modal animationType="slide" transparent={true} visible={visible} onRequestClose={onClose}>
      <StatusBar style="light" />

      {/* Blur Background */}
      <View style={StyleSheet.absoluteFill}>
        <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFill} />
        <TouchableOpacity
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' }}
          onPress={onClose}
          activeOpacity={1}
        />
      </View>

      {/* Bottom Sheet */}
      <View style={styles.sheet}>
        {/* Handle */}
        <View style={styles.handleContainer}>
          <View style={styles.handle} />
        </View>

        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Streaks</Text>
            <View style={styles.subtitleRow}>
              <Text style={styles.subtitle}>You're on a </Text>
              <Text style={styles.streakNumber}>{globalStreak} day</Text>
              <Text style={styles.subtitle}> streak! 🔥</Text>
            </View>
          </View>

          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={22} color={TEXT_PRIMARY} />
          </TouchableOpacity>
        </View>

        {/* Lock View */}
        {isLocked && (
          <LockedView
            onUnlock={handleUnlock}
            message={message}
            buttonText={buttonText}
          />
        )}

        {/* Streak Cards */}
        <View style={{ flex: 1 }}>
          <FlatList
            data={activeStreaks}
            keyExtractor={(item) => item._id}
            contentContainerStyle={{
              paddingBottom: 40,
              paddingHorizontal: 20,
              gap: 14,
            }}
            showsVerticalScrollIndicator={false}
            renderItem={({ item, index }) => {
              const history = (item as any).history;

              return (
                <Animated.View
                  entering={FadeInDown.delay(index * 80).duration(400)}
                  style={styles.streakCard}
                >
                  {/* Card Header */}
                  <View style={styles.cardHeader}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.cardTitle} numberOfLines={1}>
                        {item.title}
                      </Text>
                      <Text style={styles.cardSubtitle}>
                        {item.frequencyType.replace(/_/g, " ")} schedule
                      </Text>
                    </View>

                    <View style={styles.streakBadge}>
                      <Text style={styles.streakBadgeNumber}>
                        {item.currentStreak || 0}
                      </Text>
                      <Text style={styles.streakBadgeLabel}>🔥</Text>
                    </View>
                  </View>

                  {/* Heatmap */}
                  <MonthHeatmap history={history} />
                </Animated.View>
              );
            }}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <View style={styles.emptyIcon}>
                  <Text style={{ fontSize: 32 }}>🔥</Text>
                </View>
                <Text style={styles.emptyTitle}>No active streaks</Text>
                <Text style={styles.emptySubtitle}>
                  Complete goals to build your streak!
                </Text>
              </View>
            }
          />
        </View>
      </View>

      <PaywallModal visible={paywallVisible} onClose={() => setPaywallVisible(false)} />
    </Modal>
  );
};

const styles = StyleSheet.create({
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: SCREEN_HEIGHT * 0.9,
    backgroundColor: BG_COLOR,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    overflow: 'hidden',
  },
  handleContainer: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: '#D1D5DB',
    borderRadius: 2,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  title: {
    fontFamily: "Nunito-Bold",
    fontSize: 28,
    color: TEXT_PRIMARY,
  },
  subtitleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  subtitle: {
    fontFamily: "Nunito-Medium",
    fontSize: 14,
    color: TEXT_SECONDARY,
  },
  streakNumber: {
    fontFamily: "Nunito-Bold",
    fontSize: 14,
    color: ACCENT_ORANGE,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
  },
  streakCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  cardTitle: {
    fontFamily: "Nunito-Bold",
    fontSize: 17,
    color: TEXT_PRIMARY,
    marginBottom: 2,
  },
  cardSubtitle: {
    fontFamily: "Nunito-Medium",
    fontSize: 12,
    color: TEXT_SECONDARY,
    textTransform: "capitalize",
  },
  streakBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEF3C7",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    gap: 4,
  },
  streakBadgeNumber: {
    fontFamily: "Nunito-Bold",
    fontSize: 18,
    color: ACCENT_ORANGE,
  },
  streakBadgeLabel: {
    fontSize: 14,
  },
  heatmapHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  monthLabel: {
    fontFamily: "Nunito-Bold",
    fontSize: 11,
    color: TEXT_SECONDARY,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  legendContainer: {
    flexDirection: "row",
    gap: 12,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontFamily: "Nunito-Medium",
    fontSize: 10,
    color: TEXT_SECONDARY,
  },
  calendarGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
  },
  dayCell: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 80,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: "#FEF3C7",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  emptyTitle: {
    fontFamily: "Nunito-Bold",
    fontSize: 18,
    color: TEXT_PRIMARY,
    marginBottom: 4,
  },
  emptySubtitle: {
    fontFamily: "Nunito-Medium",
    fontSize: 14,
    color: TEXT_SECONDARY,
  },
});

import { LockedView } from "@/components/LockedView";
import { PaywallModal } from "@/components/Paywall";
import { useSubscription } from "@/context/SubscriptionContext";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@clerk/clerk-expo";
import { Ionicons } from "@expo/vector-icons";
import { Fire02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { useQuery } from "convex/react";
import { BlurView } from "expo-blur";
import { GlassView } from "expo-glass-effect";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import {
  FlatList,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, { Easing, FadeInDown } from "react-native-reanimated";

// --- HELPER: Generate Calendar Data ---
const getMonthData = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  let startDay = new Date(year, month, 1).getDay();
  // Transform to Monday start (0=Mon, 6=Sun)
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

// --- COMPONENT: The Month Heatmap ---
const MonthHeatmap = ({
  history, // Now accepts history array
}: {
  history: { date: string; value: number }[] | undefined;
}) => {
  const { days, monthName } = useMemo(() => getMonthData(), []);

  // Check if a specific date was completed based on history logs
  const isDateCompleted = (calendarDateStr: string) => {
    if (!history) return false;
    // Find log for this date
    // Note: getResolutionAnalytics returns normalized 0-100 values
    // We consider "Completed" if value >= 100 (or close to it for floating point safety)
    const log = history.find((h) => h.date === calendarDateStr);
    return log ? log.value >= 99.9 : false; // Using epsilon logic just in case
  };

  return (
    <View className="mt-4">
      <View className="flex-row justify-between items-end mb-3 px-1">
        <Text className="text-white/50 text-[11px] font-generalsans-bold uppercase tracking-widest">
          {monthName}
        </Text>
        <View className="flex-row gap-3">
          <View className="flex-row items-center gap-1.5">
            <View className="w-2 h-2 rounded-full bg-white/10" />
            <Text className="text-white/30 text-[10px] font-generalsans-medium">
              Pending
            </Text>
          </View>
          <View className="flex-row items-center gap-1.5">
            <View className="w-2 h-2 rounded-full bg-[#FF9C00]" />
            <Text className="text-white/50 text-[10px] font-generalsans-medium">
              Done
            </Text>
          </View>
        </View>
      </View>

      <View className="flex-row flex-wrap gap-[2px]">
        {days.map((item: any) => {
          if (item.isPadding) {
            return <View key={item.id} style={{ width: 28, height: 28 }} />;
          }
          const isFilled = isDateCompleted(item.date);
          const isToday = item.isToday;

          return (
            <View
              key={item.id}
              style={{
                width: 28,
                height: 28,
                borderRadius: 14,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: isFilled
                  ? "#FF9C00"
                  : isToday
                    ? "rgba(255,255,255,0.15)"
                    : "rgba(255,255,255,0.05)",
                borderWidth: isToday ? 1 : 0,
                borderColor: isToday ? "rgba(255,255,255,0.5)" : "transparent",
                shadowColor: isFilled ? "#FF9C00" : "transparent",
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: isFilled ? 0.4 : 0,
                shadowRadius: 4,
                elevation: isFilled ? 3 : 0,
              }}
            >
              <Text
                style={{
                  fontSize: 10,
                  fontFamily: isFilled
                    ? "GeneralSans-Bold"
                    : "GeneralSans-Medium",
                  color: isFilled
                    ? "#FFF"
                    : isToday
                      ? "#FFF"
                      : "rgba(255,255,255,0.3)",
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
  resolutions: propResolutions, // Renamed to denote these are initial/prop data
  globalStreak,
}: {
  visible: boolean;
  onClose: () => void;
  resolutions: any[] | undefined;
  globalStreak: number;
}) => {
  // Fetch detailed analytics (with history) for heatmap
  const analyticsData = useQuery(api.resolutions.getResolutionAnalytics);

  // Merge prop data with analytics data if available
  const activeStreaks = useMemo(() => {
    // Determine source: prefer analytics if loaded (for history), else props
    const sourceData = analyticsData || propResolutions;

    if (!sourceData) return [];

    return sourceData
      .filter((r) => r.isActive) // Removed strict (> 0) check so you can see history even if streak broke today
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
      router.push('/(auth)/sign-up');
    }
  };

  const getLockedState = () => {
    if (!isPremium) {
      return {
        message: "Upgrade to Premium to view detailed streak history.",
        buttonText: "Unlock Access"
      };
    }
    if (!isSignedIn) {
      return {
        message: "Sign in to save and view your streak history.",
        buttonText: "Sign In / Register"
      };
    }
    return { message: "Locked", buttonText: "Unlock" };
  };

  const { message, buttonText } = getLockedState();

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={StyleSheet.absoluteFill}>
        <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill} />
        <TouchableOpacity
          style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)" }}
          onPress={onClose}
          activeOpacity={1}
        />
      </View>

      <Animated.View
        entering={FadeInDown.duration(450).easing(Easing.out(Easing.cubic))}
        style={{
          position: "absolute",
          bottom: 10,
          left: 5,
          right: 5,
          height: "85%",
          backgroundColor:
            Platform.OS === "android" ? "#3A7AFE" : "transparent",
          borderRadius: 40,
          overflow: "hidden",
        }}
      >
        {Platform.OS === "ios" && (
          <GlassView
            style={{
              ...StyleSheet.absoluteFillObject,
              borderRadius: 40,
              overflow: "hidden",
            }}
            glassEffectStyle="regular"
            tintColor="#3A7AFE"
          />
        )}

        {/* Lock View */}
        {isLocked && (
          <LockedView
            onUnlock={handleUnlock}
            message={message}
            buttonText={buttonText}
          />
        )}

        <View className="z-50 pt-8 pb-2">
          <View className="px-6 flex-row justify-between items-start mb-4">
            <View
              style={{
                backgroundColor: "rgba(255,156,0,0.15)",
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 14,
                borderWidth: 1,
                borderColor: "rgba(255,156,0,0.25)",
                flexDirection: "row",
                alignItems: "center",
                gap: 6,
              }}
            >
              <HugeiconsIcon icon={Fire02Icon} size={14} color="#FF9C00" />
              <Text className="text-[#FF9C00] font-generalsans-bold text-[11px] uppercase tracking-wide">
                Streak Zone
              </Text>
            </View>

            <TouchableOpacity
              onPress={onClose}
              className="w-9 h-9 rounded-full bg-white/10 items-center justify-center border border-white/10"
            >
              <Ionicons name="close" size={20} color="white" />
            </TouchableOpacity>
          </View>

          <View className="px-6 mb-8">
            <Text className="text-white font-generalsans-bold text-4xl tracking-tighter">
              Consistency
            </Text>
            <View className="flex-row items-baseline gap-2 mt-1">
              <Text className="text-white/60 font-generalsans-medium text-sm">
                You are on a
              </Text>
              <Text className="text-[#FF9C00] font-generalsans-bold text-xl">
                {globalStreak} day
              </Text>
              <Text className="text-white/60 font-generalsans-medium text-sm">
                global streak!
              </Text>
            </View>
          </View>
        </View>

        <View style={{ flex: 1 }}>
          <FlatList
            data={activeStreaks}
            keyExtractor={(item) => item._id}
            contentContainerStyle={{
              paddingBottom: 80,
              paddingHorizontal: 16,
              gap: 16,
            }}
            showsVerticalScrollIndicator={false}
            renderItem={({ item, index }) => {
              // Extract history from the item (it will be present if analyticsData loaded)
              const history = (item as any).history;

              return (
                <Animated.View
                  entering={FadeInDown.delay(index * 100).duration(600)}
                  className="rounded-[32px] overflow-hidden"
                  style={{
                    backgroundColor: "rgba(255, 255, 255, 0.08)",
                    borderWidth: 1,
                    borderColor: "rgba(255, 255, 255, 0.08)",
                  }}
                >
                  <View className="p-6">
                    <View className="flex-row justify-between items-start mb-2">
                      <View className="flex-1">
                        <Text
                          className="text-white font-generalsans-semibold text-[19px] tracking-tight"
                          numberOfLines={1}
                        >
                          {item.title}
                        </Text>
                        <Text className="text-white/40 text-xs mt-1 font-generalsans-medium capitalize">
                          {item.frequencyType.replace(/_/g, " ")} schedule
                        </Text>
                      </View>

                      <View className="items-end">
                        <Text className="text-2xl font-generalsans-bold text-[#FF9C00]">
                          {item.currentStreak || 0}
                        </Text>
                        <Text className="text-white/30 text-[9px] uppercase font-generalsans-bold tracking-wider">
                          Streak
                        </Text>
                      </View>
                    </View>

                    <View className="h-[1px] bg-white/5 w-full my-3" />

                    <MonthHeatmap
                      history={history} // Pass full history
                    />
                  </View>
                </Animated.View>
              );
            }}
            ListEmptyComponent={
              <View className="items-center justify-center py-10">
                <Text className="text-center text-white/40 font-generalsans-medium">
                  No active streaks yet.
                </Text>
                <Text className="text-center text-white/20 text-xs mt-2 font-generalsans-medium">
                  Complete your goals today to build a streak!
                </Text>
              </View>
            }
          />
        </View>
      </Animated.View>

      <PaywallModal
        visible={paywallVisible}
        onClose={() => setPaywallVisible(false)}
      />
    </Modal>
  );
};

import { Ionicons } from "@expo/vector-icons";
import { Fire02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { BlurView } from "expo-blur";
import { GlassView } from "expo-glass-effect";
import { useMemo } from "react";
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
  streakCount,
  lastCompletedDate,
}: {
  streakCount: number;
  lastCompletedDate: string | undefined;
}) => {
  const { days, monthName } = useMemo(() => getMonthData(), []);

  const isDateInStreak = (calendarDateStr: string) => {
    if (!lastCompletedDate || streakCount <= 0) return false;

    const calendarDate = new Date(calendarDateStr);
    const lastDoneDate = new Date(lastCompletedDate);

    calendarDate.setHours(0, 0, 0, 0);
    lastDoneDate.setHours(0, 0, 0, 0);

    const diffTime = lastDoneDate.getTime() - calendarDate.getTime();
    const diffDays = Math.round(diffTime / (1000 * 3600 * 24));

    return diffDays >= 0 && diffDays < streakCount;
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
          const isFilled = isDateInStreak(item.date);
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
  resolutions,
  globalStreak,
}: {
  visible: boolean;
  onClose: () => void;
  resolutions: any[] | undefined;
  globalStreak: number;
}) => {
  // --- THE FIX: Filter specifically for Active Streaks (> 0) ---
  const activeStreaks = useMemo(() => {
    if (!resolutions) return [];

    return resolutions
      .filter((r) => r.isActive && (r.currentStreak || 0) > 0) // Filter: Must be active AND have a streak > 0
      .sort((a, b) => (b.currentStreak || 0) - (a.currentStreak || 0)); // Sort: Highest streak first
  }, [resolutions]);

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

        <View className="z-20 pt-8 pb-2">
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
            data={activeStreaks} // Use the filtered data here
            keyExtractor={(item) => item._id}
            contentContainerStyle={{
              paddingBottom: 80,
              paddingHorizontal: 16,
              gap: 16,
            }}
            showsVerticalScrollIndicator={false}
            renderItem={({ item, index }) => (
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
                    streakCount={item.currentStreak || 0}
                    lastCompletedDate={item.lastCompletedDate}
                  />
                </View>
              </Animated.View>
            )}
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
    </Modal>
  );
};

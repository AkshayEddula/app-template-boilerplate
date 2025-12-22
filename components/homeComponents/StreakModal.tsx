import { api } from "@/convex/_generated/api";
import { Ionicons } from "@expo/vector-icons";
import { Fire02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { useQuery } from "convex/react";
import { BlurView } from "expo-blur";
import { GlassView } from "expo-glass-effect";
import { useMemo } from "react";
import {
  Dimensions,
  FlatList,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, { Easing, FadeInDown } from "react-native-reanimated";

// --- HELPER: Generate Calendar Data Correctly ---
const getMonthData = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();

  // Get number of days in month
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Get starting day of week (0=Mon, 6=Sun for this grid)
  let startDay = new Date(year, month, 1).getDay();
  startDay = startDay === 0 ? 6 : startDay - 1;

  const days = [];

  // Padding
  for (let i = 0; i < startDay; i++) {
    days.push({ id: `pad-${i}`, isPadding: true });
  }

  // Actual Days
  for (let i = 1; i <= daysInMonth; i++) {
    // FIX: Construct string manually to avoid UTC conversion shifts
    // This ensures Day 22 is always "2025-12-22" locally
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

  const isDateInStreak = (dateStr: string) => {
    if (!lastCompletedDate) return false;
    if (!streakCount || streakCount <= 0) return false;

    const target = new Date(dateStr);
    const last = new Date(lastCompletedDate);

    // Calculate difference in days using local time components to be safe
    // Or simply compare timestamps normalized to midnight
    const diffTime = last.setHours(0, 0, 0, 0) - target.setHours(0, 0, 0, 0);
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

    return diffDays >= 0 && diffDays < streakCount;
  };

  return (
    <View className="mt-4">
      {/* Calendar Header */}
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

      {/* The Grid */}
      <View className="flex-row flex-wrap gap-[2px]">
        {days.map((item) => {
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
                backgroundColor: isFilled ? "#FF9C00" : "rgba(255,255,255,0.1)",
                borderWidth: isToday ? 1.5 : 0,
                borderColor: isToday ? "#FFFFFF" : "transparent",
                shadowColor: isFilled ? "#FF9C00" : "transparent",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: isFilled ? 0.3 : 0,
                shadowRadius: 3,
              }}
            >
              <Text
                style={{
                  fontSize: 10,
                  fontFamily: "GeneralSans-Medium",
                  color: isFilled
                    ? "#fafafa"
                    : isToday
                      ? "white"
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

export const StreakModal = ({
  visible,
  onClose,
  resolutions,
}: {
  visible: boolean;
  onClose: () => void;
  resolutions: any[] | undefined;
}) => {
  const user = useQuery(api.users.currentUser);
  const globalStreak = user?.currentStreak || 0;

  const activeResolutions = useMemo(() => {
    return resolutions?.filter((r) => r.isActive) || [];
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
            data={activeResolutions}
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
          />
        </View>
      </Animated.View>
    </Modal>
  );
};

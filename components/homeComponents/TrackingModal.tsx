import { api } from "@/convex/_generated/api";
import { Ionicons } from "@expo/vector-icons";
import { Fire02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { useMutation } from "convex/react";
import { BlurView } from "expo-blur";
import { GlassView } from "expo-glass-effect";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, {
  Easing,
  FadeInDown,
  FadeInRight,
  FadeOutLeft,
  LinearTransition,
  useAnimatedProps,
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";
import Svg, { Circle, Defs, LinearGradient, Stop } from "react-native-svg";

// --- CONSTANTS & HELPERS ---
const SMOOTH_EASING = Easing.bezier(0.4, 0.0, 0.2, 1);
const DURATION_NORMAL = 300;
const DURATION_SLOW = 400;
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const formatTime = (totalSeconds: number) => {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
};

// --- SUB-COMPONENT: Progress Dot ---
const ProgressDot = ({ active }: { active: boolean }) => {
  const animatedStyle = useAnimatedStyle(() => {
    return {
      width: withTiming(active ? 24 : 6, { duration: 300 }),
      backgroundColor: withTiming(
        active ? "#FFFFFF" : "rgba(255, 255, 255, 0.2)",
        { duration: 300 },
      ),
    };
  });

  return (
    <Animated.View
      className="h-1.5 rounded-full shadow-sm shadow-white"
      style={animatedStyle}
    />
  );
};

// --- CALENDAR / HEATMAP LOGIC ---
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
    const diffTime = last.setHours(0, 0, 0, 0) - target.setHours(0, 0, 0, 0);
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
    return diffDays >= 0 && diffDays < streakCount;
  };

  return (
    <View className="mt-4 w-full">
      <View className="flex-row justify-between items-end mb-4 px-1">
        <Text className="text-white/40 text-[10px] font-generalsans-bold uppercase tracking-widest">
          {monthName}
        </Text>
        <View className="flex-row items-center gap-1.5">
          <View className="w-1.5 h-1.5 rounded-full bg-[#FF9C00]" />
          <Text className="text-[#FF9C00] text-[10px] font-generalsans-bold">
            Active Streak
          </Text>
        </View>
      </View>

      <View className="flex-row flex-wrap gap-[4px] justify-center">
        {days.map((item) => {
          if (item.isPadding)
            return <View key={item.id} style={{ width: 28, height: 28 }} />;

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
                  : "rgba(255,255,255,0.05)",
                borderWidth: isToday ? 1 : 0,
                borderColor: isToday ? "rgba(255,255,255,0.8)" : "transparent",
              }}
            >
              <Text
                style={{
                  fontSize: 10,
                  fontFamily: "GeneralSans-Medium",
                  color: isFilled ? "#FFF" : "rgba(255,255,255,0.2)",
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

// --- TYPES ---
type Resolution = {
  _id: string;
  title: string;
  categoryKey: string;
  frequencyType: string;
  trackingType: "yes_no" | "time_based" | "count_based";
  targetCount?: number;
  countUnit?: string;
  targetTime?: number;
  currentStreak?: number;
  lastCompletedDate?: string;
};

// --- MAIN COMPONENT ---
export const TrackingModal = ({
  visible,
  onClose,
  resolution,
  initialValue = 0,
  onLevelUp,
}: {
  visible: boolean;
  onClose: () => void;
  resolution: Resolution | null;
  initialValue?: number;
  onLevelUp: (categoryKey: string, newTotalXp: number) => void;
}) => {
  const logProgress = useMutation(api.resolutions.logProgress);
  const [seconds, setSeconds] = useState(0);
  const [countValue, setCountValue] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Tab State: 'log' or 'streak'
  const [activeTab, setActiveTab] = useState<"log" | "streak">("log");

  const isAvailableToday = true;

  // --- LOGIC: Check if Goal is Already Completed ---
  const targetVal = resolution
    ? resolution.trackingType === "time_based"
      ? (resolution.targetTime || 0) * 60
      : resolution.targetCount || 1
    : 1;

  // If the initial value is already met, we consider it done for today
  const isAlreadyCompleted = initialValue >= targetVal;

  // Reset tab when opening
  useEffect(() => {
    if (visible) {
      setActiveTab("log");
    }
  }, [visible]);

  useEffect(() => {
    if (visible && resolution) {
      if (resolution.trackingType === "time_based") {
        setSeconds(initialValue);
        setCountValue(0);
      } else {
        setCountValue(initialValue);
        setSeconds(0);
      }
      setIsTimerRunning(false);
    }
    return () => stopTimer();
  }, [visible, resolution, initialValue]);

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setIsTimerRunning(false);
  };

  const toggleTimer = () => {
    if (isTimerRunning) {
      stopTimer();
    } else {
      setIsTimerRunning(true);
      timerRef.current = setInterval(() => {
        setSeconds((prev) => {
          const next = prev + 1;
          if (
            resolution &&
            resolution.targetTime &&
            next >= resolution.targetTime * 60
          ) {
            stopTimer();
            return resolution.targetTime * 60;
          }
          return next;
        });
      }, 1000);
    }
  };

  const handleSave = async () => {
    if (!isAvailableToday || !resolution) return;
    try {
      const finalValue =
        resolution.trackingType === "time_based" ? seconds : countValue;

      const result = await logProgress({
        userResolutionId: resolution._id as any,
        date: new Date().toISOString().split("T")[0],
        value: finalValue,
      });

      onClose();

      if (result && result.newDailyXp > 0) {
        setTimeout(() => {
          onLevelUp(resolution.categoryKey, result.totalCategoryXp);
        }, 300);
      }
    } catch (e) {
      Alert.alert("Error", "Failed to save progress");
    }
  };

  if (!resolution) return null;

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      {/* 1. Backdrop */}
      <View style={StyleSheet.absoluteFill}>
        <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill} />
        <TouchableOpacity
          style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)" }}
          onPress={onClose}
          activeOpacity={1}
        />
      </View>

      {/* 2. Main Glass Sheet */}
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

        {/* --- HEADER --- */}
        <View className="z-20 pt-8 pb-4">
          <View className="px-6 flex-row justify-between items-center mb-4">
            {/* Tab Switcher (Log / Streak) */}
            <View className="flex-row bg-white/10 rounded-full p-1 border border-white/10">
              <TouchableOpacity
                onPress={() => setActiveTab("log")}
                className={`px-4 py-1.5 rounded-full ${activeTab === "log" ? "bg-white/20" : "bg-transparent"}`}
              >
                <Text
                  className={`text-[12px] font-generalsans-bold ${activeTab === "log" ? "text-white" : "text-white/50"}`}
                >
                  Log
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setActiveTab("streak")}
                className={`px-4 py-1.5 rounded-full ${activeTab === "streak" ? "bg-white/20" : "bg-transparent"}`}
              >
                <Text
                  className={`text-[12px] font-generalsans-bold ${activeTab === "streak" ? "text-white" : "text-white/50"}`}
                >
                  Streak
                </Text>
              </TouchableOpacity>
            </View>

            {/* Close Button */}
            <TouchableOpacity
              onPress={onClose}
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                backgroundColor: "rgba(255,255,255,0.1)",
                alignItems: "center",
                justifyContent: "center",
                borderWidth: 1,
                borderColor: "rgba(255,255,255,0.15)",
              }}
            >
              <Ionicons name="close" size={20} color="white" />
            </TouchableOpacity>
          </View>

          {/* Title Area */}
          <View className="px-6 mt-1 items-center">
            <Text className="text-white font-generalsans-bold text-3xl text-center leading-9">
              {resolution.title}
            </Text>
          </View>
        </View>

        {/* --- CONTENT BODY --- */}
        <View className="flex-1 justify-center px-6">
          {/* LOGGING VIEW */}
          {activeTab === "log" && (
            <Animated.View
              entering={FadeInDown}
              exiting={FadeOutLeft}
              layout={LinearTransition.duration(200)}
              style={{ flex: 1, justifyContent: "center" }}
            >
              {resolution.trackingType === "yes_no" && (
                <View className="items-center">
                  <TouchableOpacity
                    disabled={!isAvailableToday}
                    onPress={() => setCountValue(countValue === 0 ? 1 : 0)}
                    activeOpacity={0.8}
                    className={`w-40 h-40 rounded-[40px] items-center justify-center border-4 shadow-2xl ${
                      countValue > 0
                        ? "bg-[#22c55e] border-[#4ade80]"
                        : "bg-white/10 border-white/20"
                    }`}
                    style={{
                      shadowColor: countValue > 0 ? "#22c55e" : "#000",
                      shadowOpacity: countValue > 0 ? 0.6 : 0.2,
                      shadowRadius: 30,
                      elevation: 10,
                    }}
                  >
                    <Ionicons
                      name="checkmark"
                      size={80}
                      color={countValue > 0 ? "white" : "rgba(255,255,255,0.2)"}
                    />
                  </TouchableOpacity>
                  <Text className="text-white/50 font-generalsans-medium text-sm mt-4 uppercase tracking-wider shadow-sm shadow-white">
                    {countValue > 0 ? "Completed" : "Tap to complete"}
                  </Text>
                </View>
              )}

              {resolution.trackingType === "count_based" && (
                <CountCircles
                  initialCount={countValue}
                  target={resolution.targetCount || 5}
                  onChange={setCountValue}
                  disabled={!isAvailableToday}
                />
              )}

              {resolution.trackingType === "time_based" && (
                <ModernTimer
                  seconds={seconds}
                  targetMinutes={resolution.targetTime || 30}
                  isRunning={isTimerRunning}
                  onToggle={toggleTimer}
                  onAddFive={() => setSeconds((s) => s + 300)}
                  disabled={!isAvailableToday}
                />
              )}
            </Animated.View>
          )}

          {/* STREAK VIEW */}
          {activeTab === "streak" && (
            <Animated.View
              entering={FadeInRight}
              layout={LinearTransition.duration(200)}
              style={{
                flex: 1,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {/* Big Icon */}
              <View className="w-24 h-24 rounded-full bg-[#FF9C00]/30 items-center justify-center border border-[#FF9C00]/20 mb-6 shadow-2xl shadow-[#FF9C00]">
                <HugeiconsIcon
                  icon={Fire02Icon}
                  size={48}
                  color="#FF9C00"
                  variant="solid"
                />
              </View>

              {/* Stats Text */}
              <Text className="text-white font-generalsans-bold text-6xl mb-1 shadow-sm shadow-white">
                {resolution.currentStreak || 0}
              </Text>
              <Text className="text-white/50 font-generalsans-medium text-sm uppercase tracking-tight mb-10">
                Current Streak
              </Text>

              {/* Clean Transparent Heatmap */}
              <View className="w-full">
                <MonthHeatmap
                  streakCount={resolution.currentStreak || 0}
                  lastCompletedDate={resolution.lastCompletedDate}
                />
              </View>
            </Animated.View>
          )}
        </View>

        {/* --- FOOTER ACTIONS --- */}
        {activeTab === "log" && (
          <View className="px-6 pb-8 pt-4 flex-row w-full gap-4">
            <TouchableOpacity
              onPress={onClose}
              className="flex-1 py-4 bg-white/10 rounded-2xl items-center border border-white/5"
              activeOpacity={0.7}
            >
              <Text className="text-white/70 font-generalsans-bold">
                Cancel
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleSave}
              // Disabled if not available today OR if already completed
              disabled={!isAvailableToday || isAlreadyCompleted}
              activeOpacity={0.8}
              className={`flex-1 py-4 rounded-2xl items-center shadow-sm ${
                !isAvailableToday || isAlreadyCompleted
                  ? "bg-white/10 opacity-50"
                  : "bg-white"
              }`}
            >
              <Text
                className={`font-generalsans-bold text-base ${
                  !isAvailableToday || isAlreadyCompleted
                    ? "text-white/50"
                    : "text-[#3A7AFE]"
                }`}
              >
                {isAlreadyCompleted ? "Completed" : "Save Progress"}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Simple Close for Streak View */}
        {activeTab === "streak" && (
          <View className="px-6 pb-8 pt-4 w-full">
            <TouchableOpacity
              onPress={onClose}
              className="py-4 bg-white/10 rounded-2xl items-center border border-white/5 w-full"
              activeOpacity={0.7}
            >
              <Text className="text-white font-generalsans-bold">Close</Text>
            </TouchableOpacity>
          </View>
        )}
      </Animated.View>
    </Modal>
  );
};

// --- SUB-COMPONENT: Glassy Timer ---
const ModernTimer = ({
  seconds,
  targetMinutes,
  isRunning,
  onToggle,
  onAddFive,
  disabled,
}: {
  seconds: number;
  targetMinutes: number;
  isRunning: boolean;
  onToggle: () => void;
  onAddFive: () => void;
  disabled: boolean;
}) => {
  const size = 200;
  const strokeWidth = 14;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  const targetSeconds = (targetMinutes || 1) * 60;
  const progress = Math.min(seconds / targetSeconds, 1);
  const isGoalMet = seconds >= targetSeconds;

  const animatedProps = useAnimatedProps(() => {
    return {
      strokeDashoffset: withTiming(circumference * (1 - progress), {
        duration: DURATION_SLOW,
        easing: SMOOTH_EASING,
      }),
    };
  });

  return (
    <View className="items-center justify-center my-2">
      <Animated.View
        entering={FadeInDown.duration(DURATION_SLOW).easing(SMOOTH_EASING)}
        style={{
          width: size,
          height: size,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Svg width={size} height={size} style={{ position: "absolute" }}>
          <Defs>
            <LinearGradient id="grad" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor="#3A7AFE" stopOpacity="1" />
              <Stop offset="1" stopColor="#60A5FA" stopOpacity="1" />
            </LinearGradient>
            <LinearGradient id="successGrad" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor="#22c55e" stopOpacity="1" />
              <Stop offset="1" stopColor="#4ade80" stopOpacity="1" />
            </LinearGradient>
          </Defs>

          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="rgba(255,255,255,0.1)"
            strokeWidth={strokeWidth}
            fill="none"
          />

          <AnimatedCircle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={isGoalMet ? "url(#successGrad)" : "url(#grad)"}
            strokeWidth={strokeWidth}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={circumference}
            animatedProps={animatedProps}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
            opacity={disabled ? 0.3 : 1}
          />
        </Svg>

        <View className="items-center">
          <Text className="font-generalsans-bold text-5xl text-white tracking-wider font-variant-numeric tabular-nums shadow-sm shadow-white">
            {formatTime(seconds)}
          </Text>
          <Text className="text-white/40 font-generalsans-medium text-xs uppercase tracking-widest mt-1">
            Goal: {targetMinutes} min
          </Text>
        </View>
      </Animated.View>

      <View className="flex-row items-center gap-6 mt-6">
        <TouchableOpacity
          onPress={onToggle}
          disabled={isGoalMet || disabled}
          activeOpacity={0.8}
          className={`w-14 h-14 rounded-full items-center justify-center border ${
            disabled
              ? "bg-white/5 border-white/5"
              : isGoalMet
                ? "bg-[#22c55e] border-[#4ade80]"
                : isRunning
                  ? "bg-red-500 border-red-400"
                  : "bg-white border-white"
          }`}
          style={{
            shadowColor: "#121212",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 6,
          }}
        >
          <Ionicons
            name={isGoalMet ? "checkmark" : isRunning ? "pause" : "play"}
            size={28}
            color={isGoalMet || isRunning ? "white" : "#3A7AFE"}
            style={{ marginLeft: isRunning || isGoalMet ? 0 : 4 }}
          />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={onAddFive}
          disabled={isGoalMet || disabled}
          activeOpacity={0.8}
          className={`w-14 h-14 rounded-full items-center justify-center border ${
            isGoalMet || disabled
              ? "bg-white/5 border-white/5 opacity-50"
              : "bg-white/10 border-white/20"
          }`}
        >
          <Text
            className={`font-generalsans-bold text-xs ${
              isGoalMet ? "text-white/30" : "text-white"
            }`}
          >
            +5m
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

// --- SUB-COMPONENT: Glassy Counter ---
const CountCircles = ({
  initialCount,
  target,
  onChange,
  disabled,
}: {
  initialCount: number;
  target: number;
  onChange: (val: number) => void;
  disabled: boolean;
}) => {
  const [count, setCount] = useState(initialCount);

  useEffect(() => {
    setCount(initialCount);
  }, [initialCount]);

  const increment = () => {
    if (disabled || count >= target) return;
    const newCount = count + 1;
    setCount(newCount);
    onChange(newCount);
  };

  const decrement = () => {
    if (disabled || count <= 0) return;
    const newCount = count - 1;
    setCount(newCount);
    onChange(newCount);
  };

  const maxTarget = target || 5;

  return (
    <View className="items-center justify-center my-4">
      <Animated.View
        entering={FadeInDown.duration(DURATION_SLOW).easing(SMOOTH_EASING)}
        className="relative items-center justify-center mb-8"
      >
        <Animated.Text
          className={`font-generalsans-bold text-[100px] leading-[100px] shadow-sm shadow-white ${
            disabled ? "text-white/20" : "text-white"
          }`}
        >
          {count}
        </Animated.Text>

        <View className="flex-row items-center gap-1.5 mt-4">
          {Array.from({ length: maxTarget }, (_, i) => (
            <ProgressDot key={i} active={i < count} />
          ))}
        </View>

        <Text className="text-white/40 font-generalsans-medium text-sm mt-3 uppercase tracking-widest">
          Target: {maxTarget}
        </Text>
      </Animated.View>

      <View className="flex-row items-center gap-10">
        <TouchableOpacity
          onPress={decrement}
          disabled={disabled || count <= 0}
          activeOpacity={0.7}
          className={`w-16 h-16 rounded-full items-center justify-center border ${
            disabled || count <= 0
              ? "bg-white/5 border-white/5"
              : "bg-white/10 border-white/20"
          }`}
        >
          <Ionicons
            name="remove"
            size={28}
            color={disabled || count <= 0 ? "rgba(255,255,255,0.2)" : "white"}
          />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={increment}
          disabled={disabled || count >= maxTarget}
          activeOpacity={0.7}
          className={`w-16 h-16 rounded-full items-center justify-center shadow-lg border ${
            disabled || count >= maxTarget
              ? "bg-white/5 border-white/5"
              : "bg-white border-white"
          }`}
        >
          <Ionicons
            name="add"
            size={32}
            color={
              disabled || count >= maxTarget
                ? "rgba(255,255,255,0.2)"
                : "#3A7AFE"
            }
          />
        </TouchableOpacity>
      </View>
    </View>
  );
};

import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Ionicons } from "@expo/vector-icons";
import { Fire02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { useMutation } from "convex/react";
import { BlurView } from "expo-blur";
import { GlassView } from "expo-glass-effect";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, {
  Easing,
  FadeIn,
  FadeInDown,
  FadeInRight,
  FadeInUp,
  FadeOut,
  FadeOutLeft,
  LinearTransition,
  useAnimatedProps,
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";
import Svg, { Circle, Defs, LinearGradient, Stop } from "react-native-svg";

// --- CONSTANTS & HELPERS ---
const SMOOTH_EASING = Easing.bezier(0.4, 0.0, 0.2, 1);
const DURATION_SLOW = 400;
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const formatTime = (totalSeconds: number) => {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
};

// --- SUB-COMPONENT: Advanced Day Selector (Ported) ---
const AdvancedDaySelector = ({
  selectedDays = [],
  toggleDay,
  setCustomDays,
}: {
  selectedDays: number[];
  toggleDay: (d: number) => void;
  setCustomDays: (days: number[]) => void;
}) => {
  const days = [
    { l: "S", v: 0 },
    { l: "M", v: 1 },
    { l: "T", v: 2 },
    { l: "W", v: 3 },
    { l: "T", v: 4 },
    { l: "F", v: 5 },
    { l: "S", v: 6 },
  ];

  return (
    <View className="mt-4 mb-4">
      <View className="flex-row justify-between items-end mb-3 px-1">
        <Text className="text-white/30 font-generalsans-bold text-[9px] uppercase tracking-[1px]">
          Select Specific Days
        </Text>
        <TouchableOpacity onPress={() => setCustomDays([])}>
          <Text className="text-white/40 font-generalsans-bold text-[10px] uppercase tracking-tight">
            Reset
          </Text>
        </TouchableOpacity>
      </View>

      <GlassView
        glassEffectStyle="regular"
        tintColor="#3A7AFE"
        style={{
          borderRadius: 20,
          padding: 8,
          borderWidth: 1,
          borderColor: "rgba(255,255,255,0.1)",
          overflow: "hidden",
        }}
      >
        <View className="flex-row justify-between">
          {days.map((day) => {
            const isSelected = selectedDays.includes(day.v);
            return (
              <TouchableOpacity
                key={day.v}
                onPress={() => toggleDay(day.v)}
                activeOpacity={0.6}
                className={`w-10 h-10 rounded-full items-center justify-center ${isSelected ? "bg-white" : "bg-white/5"}`}
              >
                <Text
                  className={`font-generalsans-bold text-xs ${isSelected ? "text-[#3A7AFE]" : "text-white/40"}`}
                >
                  {day.l}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </GlassView>
    </View>
  );
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

          const isFilled = item.date ? isDateInStreak(item.date) : false;
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
  description?: string;
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

// --- MAIN COMPONENT ---
export const TrackingModal = ({
  visible,
  onClose,
  resolution,
  initialValue = 0,
  readOnly = false,
  onLevelUp,
  currentCategoryXp = 0,
}: {
  visible: boolean;
  onClose: () => void;
  resolution: Resolution | null;
  initialValue?: number;
  readOnly?: boolean;
  onLevelUp: (categoryKey: string, newTotalXp: number, oldTotalXp: number) => void;
  currentCategoryXp?: number;
}) => {
  const logProgress = useMutation(api.resolutions.logProgress);
  const editResolution = useMutation(api.resolutions.edit);
  const deleteResolution = useMutation(api.resolutions.deleteResolution);

  const [seconds, setSeconds] = useState(0);
  const [countValue, setCountValue] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Tab State: 'log' | 'streak' | 'edit'
  const [activeTab, setActiveTab] = useState<"log" | "streak" | "edit">("log");

  // --- EDIT STATE ---
  const [editTitle, setEditTitle] = useState("");
  const [editFrequency, setEditFrequency] = useState("daily");
  const [editCustomDays, setEditCustomDays] = useState<number[]>([]);
  const [editTrackingType, setEditTrackingType] = useState("yes_no");
  const [editTargetValue, setEditTargetValue] = useState("");
  const [editCountUnit, setEditCountUnit] = useState("");
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // --- LOGIC: Check if Goal is Already Completed ---
  const targetVal = resolution
    ? resolution.trackingType === "time_based"
      ? (resolution.targetTime || 0) * 60
      : resolution.targetCount || 1
    : 1;

  const isAlreadyCompleted = initialValue >= targetVal;

  // Reset tab when opening
  useEffect(() => {
    if (visible && resolution) {
      setActiveTab("log");
      // Populate Edit State
      setEditTitle(resolution.title);
      setEditFrequency(resolution.frequencyType);
      setEditCustomDays(resolution.customDays || []);
      setEditTrackingType(resolution.trackingType);
      setEditCountUnit(resolution.countUnit || "Times");

      if (resolution.trackingType === "time_based") {
        setEditTargetValue(String(resolution.targetTime || 30));
      } else if (resolution.trackingType === "count_based") {
        setEditTargetValue(String(resolution.targetCount || 1));
      } else {
        setEditTargetValue("1");
      }
    }
  }, [visible, resolution]);

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
    if (readOnly) return;

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
      }, 1000) as unknown as NodeJS.Timeout;
    }
  };

  const handleSaveProgress = async () => {
    if (readOnly || !resolution) return;
    try {
      const finalValue =
        resolution.trackingType === "time_based" ? seconds : countValue;

      const result = await logProgress({
        userResolutionId: resolution._id as Id<"userResolutions">,
        date: new Date().toISOString().split("T")[0],
        value: finalValue,
      });

      onClose();

      if (result && result.newDailyXp > 0) {
        setTimeout(() => {
          onLevelUp(resolution.categoryKey, result.totalCategoryXp, currentCategoryXp);
        }, 300);
      }
    } catch (e) {
      Alert.alert("Error", "Failed to save progress");
    }
  };

  const toggleCustomDay = (day: number) => {
    setEditCustomDays((prev) =>
      prev.includes(day)
        ? prev.filter((d) => d !== day)
        : [...prev, day].sort(),
    );
  };

  const handleEditSave = async () => {
    if (!resolution) return;
    if (!editTitle.trim()) {
      Alert.alert("Required", "Please enter a title");
      return;
    }

    setIsSavingEdit(true);
    try {
      // Calculate final days
      let finalDays: number[] = [];
      if (editFrequency === "daily") finalDays = [0, 1, 2, 3, 4, 5, 6];
      else if (editFrequency === "weekdays") finalDays = [1, 2, 3, 4, 5];
      else if (editFrequency === "weekends") finalDays = [0, 6];
      else finalDays = editCustomDays;

      const updates: any = {
        id: resolution._id as Id<"userResolutions">,
        title: editTitle,
        frequencyType: editFrequency,
        customDays: finalDays,
        trackingType: editTrackingType,
        countUnit:
          editTrackingType === "count_based" ? editCountUnit : undefined,
      };

      // Handle Targets
      const numVal = parseInt(editTargetValue, 10);
      if (
        (editTrackingType === "count_based" ||
          editTrackingType === "time_based") &&
        !isNaN(numVal) &&
        numVal > 0
      ) {
        if (editTrackingType === "count_based") updates.targetCount = numVal;
        if (editTrackingType === "time_based") updates.targetTime = numVal;
      }

      await editResolution(updates);
      Alert.alert("Success", "Goal updated successfully");
      onClose();
    } catch (e) {
      Alert.alert("Error", "Failed to update goal");
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleDelete = () => {
    if (!resolution) return;
    Alert.alert(
      "Delete Goal",
      "Are you sure you want to delete this goal? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteResolution({
                id: resolution._id as Id<"userResolutions">,
              });
              onClose();
            } catch (e) {
              Alert.alert("Error", "Failed to delete goal");
            }
          },
        },
      ],
    );
  };

  // Helper for Section Headers in Edit Mode
  const EditSectionHeader = ({ title, icon }: { title: string; icon: any }) => (
    <View className="flex-row items-center gap-2 mb-3 mt-6">
      <Ionicons name={icon} size={14} color="white" style={{ opacity: 0.5 }} />
      <Text className="text-white/50 font-generalsans-bold text-[9px] uppercase tracking-[-0.1px]">
        {title}
      </Text>
    </View>
  );

  if (!resolution) return null;

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

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{
          position: "absolute",
          bottom: 10,
          left: 5,
          right: 5,
          height: "85%",
        }}
      >
        <Animated.View
          entering={FadeInDown.duration(450).easing(Easing.out(Easing.cubic))}
          style={{
            flex: 1,
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
              {/* Tab Switcher */}
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
                <TouchableOpacity
                  onPress={() => setActiveTab("edit")}
                  className={`px-4 py-1.5 rounded-full ${activeTab === "edit" ? "bg-white/20" : "bg-transparent"}`}
                >
                  <Text
                    className={`text-[12px] font-generalsans-bold ${activeTab === "edit" ? "text-white" : "text-white/50"}`}
                  >
                    Edit
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

            {/* Title Area (Hidden in Edit mode) */}
            {activeTab !== "edit" && (
              <View className="px-6 mt-1 items-center">
                <Text
                  numberOfLines={1}
                  className="text-white font-generalsans-bold text-3xl text-center leading-9"
                >
                  {resolution.title}
                </Text>
              </View>
            )}
          </View>

          {/* --- CONTENT BODY --- */}
          <View className="flex-1 px-6">
            {/* 1. LOGGING VIEW */}
            {activeTab === "log" && (
              <Animated.View
                entering={FadeInDown}
                exiting={FadeOutLeft}
                layout={LinearTransition.duration(200)}
                style={{ flex: 1, justifyContent: "center" }}
              >
                {readOnly && (
                  <View className="bg-orange-500/20 border border-orange-500/30 p-3 rounded-2xl mb-8 flex-row items-center justify-center">
                    <Ionicons
                      name="calendar-outline"
                      size={16}
                      color="#fb923c"
                    />
                    <Text className="text-orange-200 ml-2 font-generalsans-semibold text-xs uppercase tracking-wide">
                      Scheduled for another day
                    </Text>
                  </View>
                )}

                {resolution.trackingType === "yes_no" && (
                  <View className="items-center">
                    <TouchableOpacity
                      disabled={readOnly}
                      onPress={() => setCountValue(countValue === 0 ? 1 : 0)}
                      activeOpacity={0.8}
                      className={`w-40 h-40 rounded-[40px] items-center justify-center border-4 shadow-2xl ${countValue > 0
                        ? "bg-[#22c55e] border-[#4ade80]"
                        : "bg-white/10 border-white/20"
                        }`}
                      style={{
                        shadowColor: countValue > 0 ? "#22c55e" : "#000",
                        shadowOpacity: countValue > 0 ? 0.6 : 0.2,
                        shadowRadius: 30,
                        elevation: 10,
                        opacity: readOnly ? 0.5 : 1,
                      }}
                    >
                      <Ionicons
                        name="checkmark"
                        size={80}
                        color={
                          countValue > 0 ? "white" : "rgba(255,255,255,0.2)"
                        }
                      />
                    </TouchableOpacity>
                    <Text className="text-white/50 font-generalsans-medium text-sm mt-4 uppercase tracking-wider shadow-sm shadow-white">
                      {readOnly
                        ? "View Only"
                        : countValue > 0
                          ? "Completed"
                          : "Tap to complete"}
                    </Text>
                  </View>
                )}

                {resolution.trackingType === "count_based" && (
                  <CountCircles
                    initialCount={countValue}
                    target={resolution.targetCount || 5}
                    onChange={setCountValue}
                    disabled={readOnly}
                  />
                )}

                {resolution.trackingType === "time_based" && (
                  <ModernTimer
                    seconds={seconds}
                    targetMinutes={resolution.targetTime || 30}
                    isRunning={isTimerRunning}
                    onToggle={toggleTimer}
                    onAddFive={() => setSeconds((s) => s + 300)}
                    disabled={readOnly}
                  />
                )}
              </Animated.View>
            )}

            {/* 2. STREAK VIEW */}
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
                <View className="w-24 h-24 rounded-full bg-[#FF9C00]/30 items-center justify-center border border-[#FF9C00]/20 mb-6 shadow-2xl shadow-[#FF9C00]">
                  <HugeiconsIcon
                    icon={Fire02Icon}
                    size={48}
                    color="#FF9C00"
                    variant="solid"
                  />
                </View>
                <Text className="text-white font-generalsans-bold text-6xl mb-1 shadow-sm shadow-white">
                  {resolution.currentStreak || 0}
                </Text>
                <Text className="text-white/50 font-generalsans-medium text-sm uppercase tracking-tight mb-10">
                  Current Streak
                </Text>
                <View className="w-full">
                  <MonthHeatmap
                    streakCount={resolution.currentStreak || 0}
                    lastCompletedDate={resolution.lastCompletedDate}
                  />
                </View>
              </Animated.View>
            )}

            {/* 3. EDIT VIEW */}
            {activeTab === "edit" && (
              <Animated.View
                entering={FadeIn.duration(300)}
                exiting={FadeOut.duration(200)}
                style={{ flex: 1, paddingTop: 0 }}
              >
                <ScrollView
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={{ paddingBottom: 100 }}
                >
                  {/* Title Input */}
                  <EditSectionHeader title="Goal Title" icon="pencil" />
                  <GlassView
                    glassEffectStyle="regular"
                    tintColor="#3A7AFE"
                    style={{
                      borderRadius: 20,
                      height: 56,
                      borderWidth: 1,
                      borderColor: "rgba(255,255,255,0.1)",
                      overflow: "hidden",
                      justifyContent: "center",
                    }}
                  >
                    <TextInput
                      value={editTitle}
                      onChangeText={setEditTitle}
                      style={{
                        color: "white",
                        fontSize: 15,
                        fontFamily: "GeneralSans-Medium",
                        paddingHorizontal: 16,
                        height: "100%",
                      }}
                      placeholderTextColor="rgba(255,255,255,0.4)"
                    />
                  </GlassView>

                  {/* Frequency */}
                  <EditSectionHeader title="Frequency" icon="calendar" />
                  <View className="flex-row gap-2">
                    {["daily", "weekdays", "weekends", "custom"].map((f) => (
                      <TouchableOpacity
                        key={f}
                        onPress={() => setEditFrequency(f)}
                        className="flex-1"
                      >
                        <GlassView
                          isInteractive
                          glassEffectStyle="regular"
                          tintColor={
                            editFrequency === f ? "#FFFFFF" : "#3A7AFE"
                          }
                          style={{
                            borderRadius: 16,
                            padding: 14,
                            alignItems: "center",
                            overflow: "hidden",
                          }}
                        >
                          <Text
                            className={`font-generalsans-semibold capitalize text-[10px] ${editFrequency === f ? "text-[#3A7AFE]" : "text-white"}`}
                          >
                            {f}
                          </Text>
                        </GlassView>
                      </TouchableOpacity>
                    ))}
                  </View>

                  {editFrequency === "custom" && (
                    <Animated.View entering={FadeInUp}>
                      <AdvancedDaySelector
                        selectedDays={editCustomDays}
                        toggleDay={toggleCustomDay}
                        setCustomDays={setEditCustomDays}
                      />
                    </Animated.View>
                  )}

                  {/* Tracking Method */}
                  <EditSectionHeader
                    title="Tracking Method"
                    icon="stats-chart"
                  />
                  <View className="gap-3">
                    {[
                      {
                        key: "yes_no",
                        label: "Simple Check-in",
                        icon: "checkmark-circle",
                      },
                      {
                        key: "count_based",
                        label: "Numerical Goal",
                        icon: "add-circle",
                      },
                      {
                        key: "time_based",
                        label: "Timer / Duration",
                        icon: "time",
                      },
                    ].map((t) => (
                      <TouchableOpacity
                        key={t.key}
                        onPress={() => setEditTrackingType(t.key)}
                      >
                        <GlassView
                          isInteractive
                          glassEffectStyle="regular"
                          tintColor={
                            editTrackingType === t.key ? "#FFFFFF" : "#3A7AFE"
                          }
                          style={{
                            borderRadius: 18,
                            padding: 18,
                            flexDirection: "row",
                            alignItems: "center",
                            gap: 12,
                            overflow: "hidden",
                          }}
                        >
                          <Ionicons
                            name={t.icon as any}
                            size={18}
                            color={
                              editTrackingType === t.key ? "#3A7AFE" : "white"
                            }
                          />
                          <Text
                            className={`font-generalsans-bold text-sm tracking-tight ${editTrackingType === t.key ? "text-[#3A7AFE]" : "text-white"}`}
                          >
                            {t.label}
                          </Text>
                        </GlassView>
                      </TouchableOpacity>
                    ))}
                  </View>

                  {/* Target Inputs */}
                  {editTrackingType !== "yes_no" && (
                    <Animated.View
                      entering={FadeInUp}
                      className="mt-6 flex-row gap-4"
                    >
                      <View className="flex-1">
                        <Text className="text-white/40 font-generalsans-bold text-[9px] uppercase mb-2">
                          Target
                        </Text>
                        <GlassView
                          isInteractive
                          glassEffectStyle="regular"
                          tintColor="#3A7AFE"
                          style={{
                            borderRadius: 16,
                            height: 54,
                            overflow: "hidden",
                            justifyContent: "center",
                          }}
                        >
                          <TextInput
                            keyboardType="numeric"
                            selectionColor="white"
                            cursorColor="white"
                            value={editTargetValue}
                            onChangeText={setEditTargetValue}
                            style={{
                              color: "white",
                              fontSize: 18,
                              fontFamily: "GeneralSans-Bold",
                              textAlign: "center",
                              height: "100%",
                            }}
                          />
                        </GlassView>
                      </View>
                      {editTrackingType === "count_based" && (
                        <View className="flex-1">
                          <Text className="text-white/40 font-generalsans-bold text-[9px] uppercase mb-2">
                            Unit
                          </Text>
                          <GlassView
                            isInteractive
                            glassEffectStyle="regular"
                            tintColor="#3A7AFE"
                            style={{
                              borderRadius: 16,
                              height: 54,
                              overflow: "hidden",
                              justifyContent: "center",
                            }}
                          >
                            <TextInput
                              placeholder="Unit..."
                              placeholderTextColor="rgba(255,255,255,0.3)"
                              selectionColor="white"
                              cursorColor="white"
                              value={editCountUnit}
                              onChangeText={setEditCountUnit}
                              style={{
                                color: "white",
                                fontSize: 14,
                                fontFamily: "GeneralSans-Medium",
                                textAlign: "center",
                                height: "100%",
                              }}
                            />
                          </GlassView>
                        </View>
                      )}
                    </Animated.View>
                  )}

                  {/* Action Buttons */}
                  <View className="mt-8 gap-3">
                    <TouchableOpacity
                      onPress={handleEditSave}
                      disabled={isSavingEdit}
                      className="w-full py-4 bg-white rounded-2xl items-center shadow-lg"
                    >
                      {isSavingEdit ? (
                        <ActivityIndicator color="#3A7AFE" />
                      ) : (
                        <Text className="text-[#3A7AFE] font-generalsans-bold text-base">
                          Save Changes
                        </Text>
                      )}
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={handleDelete}
                      className="w-full py-4 bg-red-500/20 border border-red-500/30 rounded-2xl items-center"
                    >
                      <Text className="text-red-300 font-generalsans-bold text-base">
                        Delete Goal
                      </Text>
                    </TouchableOpacity>
                  </View>
                </ScrollView>
              </Animated.View>
            )}
          </View>

          {/* --- FOOTER ACTIONS (Only for Log/Streak) --- */}
          {(activeTab === "log" || activeTab === "streak") && (
            <View className="px-6 pb-8 pt-4 flex-row w-full gap-4">
              <TouchableOpacity
                onPress={onClose}
                className="flex-1 py-4 bg-white/10 rounded-2xl items-center border border-white/5"
                activeOpacity={0.7}
              >
                <Text className="text-white/70 font-generalsans-bold">
                  {readOnly || activeTab === "streak" ? "Close" : "Cancel"}
                </Text>
              </TouchableOpacity>

              {!readOnly && activeTab === "log" && (
                <TouchableOpacity
                  onPress={handleSaveProgress}
                  disabled={isAlreadyCompleted}
                  activeOpacity={0.8}
                  className={`flex-1 py-4 rounded-2xl items-center shadow-sm ${isAlreadyCompleted ? "bg-white/10 opacity-50" : "bg-white"
                    }`}
                >
                  <Text
                    className={`font-generalsans-bold text-base ${isAlreadyCompleted ? "text-white/50" : "text-[#3A7AFE]"
                      }`}
                  >
                    {isAlreadyCompleted ? "Completed" : "Save Progress"}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </Animated.View>
      </KeyboardAvoidingView>
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
          opacity: disabled ? 0.7 : 1,
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
          className={`w-14 h-14 rounded-full items-center justify-center border ${disabled
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
            color={
              disabled
                ? "rgba(255,255,255,0.2)"
                : isGoalMet || isRunning
                  ? "white"
                  : "#3A7AFE"
            }
            style={{ marginLeft: isRunning || isGoalMet ? 0 : 4 }}
          />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={onAddFive}
          disabled={isGoalMet || disabled}
          activeOpacity={0.8}
          className={`w-14 h-14 rounded-full items-center justify-center border ${isGoalMet || disabled
            ? "bg-white/5 border-white/5 opacity-50"
            : "bg-white/10 border-white/20"
            }`}
        >
          <Text
            className={`font-generalsans-bold text-xs ${isGoalMet || disabled ? "text-white/30" : "text-white"
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
        style={{ opacity: disabled ? 0.7 : 1 }}
      >
        <Animated.Text
          className={`font-generalsans-bold text-[100px] leading-[100px] shadow-sm shadow-white ${disabled ? "text-white/20" : "text-white"
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
          className={`w-16 h-16 rounded-full items-center justify-center border ${disabled || count <= 0
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
          className={`w-16 h-16 rounded-full items-center justify-center shadow-lg border ${disabled || count >= maxTarget
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

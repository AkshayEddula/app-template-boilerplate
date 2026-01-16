import { useGuest } from "@/context/GuestContext";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Ionicons } from "@expo/vector-icons";
import { useMutation } from "convex/react";
import { BlurView } from "expo-blur";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
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
  FadeInUp,
  useAnimatedProps,
  useAnimatedStyle,
  withTiming
} from "react-native-reanimated";
import Svg, { Circle, Defs, LinearGradient, Stop } from "react-native-svg";

// Theme Colors
const BG_COLOR = "#FAF9F6";
const TEXT_PRIMARY = "#1A1A1A";
const TEXT_SECONDARY = "#6B7280";
const ACCENT_ORANGE = "#F97316";
const SUCCESS_GREEN = "#22C55E";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");
const SMOOTH_EASING = Easing.bezier(0.4, 0.0, 0.2, 1);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const formatTime = (totalSeconds: number) => {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
};

// Day Names
const DAY_NAMES = ["S", "M", "T", "W", "T", "F", "S"];

// --- Types ---
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

// --- Calendar Heatmap ---
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
    monthName: now.toLocaleDateString("en-US", { month: "long", year: "numeric" }),
  };
};

const MonthHeatmap = ({ streakCount, lastCompletedDate }: { streakCount: number; lastCompletedDate?: string }) => {
  const { days, monthName } = useMemo(() => getMonthData(), []);

  const isDateInStreak = (dateStr: string) => {
    if (!lastCompletedDate || !streakCount || streakCount <= 0) return false;
    const target = new Date(dateStr);
    const last = new Date(lastCompletedDate);
    const diffTime = last.setHours(0, 0, 0, 0) - target.setHours(0, 0, 0, 0);
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
    return diffDays >= 0 && diffDays < streakCount;
  };

  return (
    <View style={{ marginTop: 16 }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <Text style={styles.miniLabel}>{monthName}</Text>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: ACCENT_ORANGE }} />
          <Text style={{ fontFamily: "Nunito-SemiBold", fontSize: 11, color: ACCENT_ORANGE }}>Active</Text>
        </View>
      </View>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 4, justifyContent: "center" }}>
        {days.map((item) => {
          if (item.isPadding) return <View key={item.id} style={{ width: 32, height: 32 }} />;
          const isFilled = item.date ? isDateInStreak(item.date) : false;
          return (
            <View
              key={item.id}
              style={{
                width: 32,
                height: 32,
                borderRadius: 10,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: isFilled ? ACCENT_ORANGE : "#F3F4F6",
                borderWidth: item.isToday ? 2 : 0,
                borderColor: item.isToday ? TEXT_PRIMARY : "transparent",
              }}
            >
              <Text style={{ fontSize: 11, fontFamily: "Nunito-Bold", color: isFilled ? "#FFF" : TEXT_SECONDARY }}>
                {item.day}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
};

// --- Day Selector ---
const DaySelector = ({ selectedDays, toggleDay, setCustomDays }: any) => (
  <Animated.View entering={FadeInUp.duration(200)} style={{ marginTop: 16 }}>
    <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 8 }}>
      <Text style={styles.miniLabel}>Select Days</Text>
      <TouchableOpacity onPress={() => setCustomDays([])}>
        <Text style={{ fontFamily: "Nunito-Bold", fontSize: 12, color: ACCENT_ORANGE }}>Reset</Text>
      </TouchableOpacity>
    </View>
    <View style={styles.daysRow}>
      {DAY_NAMES.map((d, i) => {
        const isSelected = selectedDays.includes(i);
        return (
          <TouchableOpacity
            key={i}
            onPress={() => toggleDay(i)}
            style={[styles.dayCircle, isSelected && { backgroundColor: ACCENT_ORANGE }]}
          >
            <Text style={[styles.dayText, isSelected && { color: "#FFF" }]}>{d}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  </Animated.View>
);

// --- Progress Dot ---
const ProgressDot = ({ active }: { active: boolean }) => {
  const animStyle = useAnimatedStyle(() => ({
    width: withTiming(active ? 20 : 8, { duration: 200 }),
    backgroundColor: withTiming(active ? ACCENT_ORANGE : "#E5E7EB", { duration: 200 }),
  }));
  return <Animated.View style={[{ height: 8, borderRadius: 4 }, animStyle]} />;
};

// --- Timer Component ---
const ModernTimer = ({ seconds, targetMinutes, isRunning, onToggle, onAddFive, disabled }: any) => {
  const size = 200;
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const targetSeconds = (targetMinutes || 1) * 60;
  const progress = Math.min(seconds / targetSeconds, 1);
  const isGoalMet = seconds >= targetSeconds;

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: withTiming(circumference * (1 - progress), { duration: 400, easing: SMOOTH_EASING }),
  }));

  return (
    <View style={{ alignItems: "center", justifyContent: "center" }}>
      <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
        <Svg width={size} height={size} style={{ position: "absolute" }}>
          <Defs>
            <LinearGradient id="timerGrad" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor={isGoalMet ? SUCCESS_GREEN : ACCENT_ORANGE} />
              <Stop offset="1" stopColor={isGoalMet ? "#4ADE80" : "#FB923C"} />
            </LinearGradient>
          </Defs>
          <Circle cx={size / 2} cy={size / 2} r={radius} stroke="#E5E7EB" strokeWidth={strokeWidth} fill="none" />
          <AnimatedCircle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="url(#timerGrad)"
            strokeWidth={strokeWidth}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={circumference}
            animatedProps={animatedProps}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        </Svg>
        <View style={{ alignItems: "center" }}>
          <Text style={{ fontFamily: "Nunito-Bold", fontSize: 48, color: TEXT_PRIMARY }}>{formatTime(seconds)}</Text>
          <Text style={{ fontFamily: "Nunito-Medium", fontSize: 13, color: TEXT_SECONDARY }}>Goal: {targetMinutes} min</Text>
        </View>
      </View>

      <View style={{ flexDirection: "row", gap: 16, marginTop: 24 }}>
        <TouchableOpacity
          onPress={onToggle}
          disabled={isGoalMet || disabled}
          style={[styles.timerBtn, { backgroundColor: isGoalMet ? SUCCESS_GREEN : isRunning ? "#EF4444" : ACCENT_ORANGE }]}
        >
          <Ionicons name={isGoalMet ? "checkmark" : isRunning ? "pause" : "play"} size={28} color="#FFF" />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={onAddFive}
          disabled={isGoalMet || disabled}
          style={[styles.timerBtnSecondary, (isGoalMet || disabled) && { opacity: 0.4 }]}
        >
          <Text style={{ fontFamily: "Nunito-Bold", fontSize: 14, color: TEXT_PRIMARY }}>+5m</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

// --- Counter Component ---
const CountCircles = ({ initialCount, target, onChange, disabled }: any) => {
  const [count, setCount] = useState(initialCount);
  useEffect(() => setCount(initialCount), [initialCount]);

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

  return (
    <View style={{ alignItems: "center", justifyContent: "center" }}>
      <Text style={{ fontFamily: "Nunito-Bold", fontSize: 100, color: TEXT_PRIMARY }}>{count}</Text>
      <View style={{ flexDirection: "row", gap: 6, marginTop: 8, marginBottom: 8 }}>
        {Array.from({ length: target }, (_, i) => <ProgressDot key={i} active={i < count} />)}
      </View>
      <Text style={{ fontFamily: "Nunito-Medium", fontSize: 13, color: TEXT_SECONDARY, marginBottom: 24 }}>Target: {target}</Text>

      <View style={{ flexDirection: "row", gap: 24 }}>
        <TouchableOpacity onPress={decrement} disabled={disabled || count <= 0} style={styles.counterBtn}>
          <Ionicons name="remove" size={28} color={count <= 0 ? "#D1D5DB" : TEXT_PRIMARY} />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={increment}
          disabled={disabled || count >= target}
          style={[styles.counterBtn, { backgroundColor: count >= target ? "#E5E7EB" : ACCENT_ORANGE }]}
        >
          <Ionicons name="add" size={28} color={count >= target ? "#9CA3AF" : "#FFF"} />
        </TouchableOpacity>
      </View>
    </View>
  );
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
  const { isGuest, logGuestProgress } = useGuest();

  const [seconds, setSeconds] = useState(0);
  const [countValue, setCountValue] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const [activeTab, setActiveTab] = useState<"log" | "streak" | "edit">("log");

  // Edit State
  const [editTitle, setEditTitle] = useState("");
  const [editFrequency, setEditFrequency] = useState("daily");
  const [editCustomDays, setEditCustomDays] = useState<number[]>([]);
  const [editTrackingType, setEditTrackingType] = useState("yes_no");
  const [editTargetValue, setEditTargetValue] = useState("");
  const [editCountUnit, setEditCountUnit] = useState("");
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [isSavingProgress, setIsSavingProgress] = useState(false);

  const targetVal = resolution
    ? resolution.trackingType === "time_based"
      ? (resolution.targetTime || 0) * 60
      : resolution.targetCount || 1
    : 1;
  const isAlreadyCompleted = initialValue >= targetVal;

  useEffect(() => {
    if (visible && resolution) {
      setActiveTab("log");
      setEditTitle(resolution.title);
      setEditFrequency(resolution.frequencyType);
      setEditCustomDays(resolution.customDays || []);
      setEditTrackingType(resolution.trackingType);
      setEditCountUnit(resolution.countUnit || "Times");
      if (resolution.trackingType === "time_based") setEditTargetValue(String(resolution.targetTime || 30));
      else if (resolution.trackingType === "count_based") setEditTargetValue(String(resolution.targetCount || 1));
      else setEditTargetValue("1");
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
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
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
          if (resolution && resolution.targetTime && next >= resolution.targetTime * 60) {
            stopTimer();
            return resolution.targetTime * 60;
          }
          return next;
        });
      }, 1000) as unknown as NodeJS.Timeout;
    }
  };

  const handleSaveProgress = async () => {
    if (readOnly || !resolution || isSavingProgress) return;
    setIsSavingProgress(true);
    try {
      const finalValue = resolution.trackingType === "time_based" ? seconds : countValue;
      if (isGuest) {
        await logGuestProgress(resolution._id, new Date().toISOString().split("T")[0], finalValue);
        onClose();
        return;
      }
      const result = await logProgress({
        userResolutionId: resolution._id as Id<"userResolutions">,
        date: new Date().toISOString().split("T")[0],
        value: finalValue,
      });
      onClose();
      if (result && result.newDailyXp > 0) {
        setTimeout(() => onLevelUp(resolution.categoryKey, result.totalCategoryXp, currentCategoryXp), 300);
      }
    } catch (e) {
      Alert.alert("Error", "Failed to save progress");
    } finally {
      setIsSavingProgress(false);
    }
  };

  const toggleCustomDay = (day: number) => {
    setEditCustomDays((prev) => (prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort()));
  };

  const handleEditSave = async () => {
    if (!resolution || !editTitle.trim()) {
      Alert.alert("Required", "Please enter a title");
      return;
    }
    setIsSavingEdit(true);
    try {
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
        countUnit: editTrackingType === "count_based" ? editCountUnit : undefined,
      };
      const numVal = parseInt(editTargetValue, 10);
      if ((editTrackingType === "count_based" || editTrackingType === "time_based") && !isNaN(numVal) && numVal > 0) {
        if (editTrackingType === "count_based") updates.targetCount = numVal;
        if (editTrackingType === "time_based") updates.targetTime = numVal;
      }
      if (isGuest) {
        Alert.alert("Guest Mode", "Editing is not supported in guest mode.");
        return;
      }
      await editResolution(updates);
      Alert.alert("Success", "Goal updated!");
      onClose();
    } catch (e) {
      Alert.alert("Error", "Failed to update goal");
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleDelete = () => {
    if (!resolution) return;
    Alert.alert("Delete Goal", "Are you sure? This cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            if (isGuest) {
              Alert.alert("Guest Mode", "Deleting is not supported in guest mode.");
              return;
            }
            await deleteResolution({ id: resolution._id as Id<"userResolutions"> });
            onClose();
          } catch (e) {
            Alert.alert("Error", "Failed to delete goal");
          }
        },
      },
    ]);
  };

  if (!resolution) return null;

  return (
    <Modal animationType="fade" transparent visible={visible} onRequestClose={onClose}>
      {/* Backdrop */}
      <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={onClose}>
        <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFill} />
        <View style={{ ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.4)" }} />
      </TouchableOpacity>

      {/* Sheet */}
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: SCREEN_HEIGHT * 0.88 }}
      >
        <Animated.View entering={FadeInDown.duration(300)} style={styles.sheet}>
          {/* Handle */}
          <View style={styles.handleContainer}>
            <View style={styles.handle} />
          </View>

          {/* Tab Switcher */}
          <View style={styles.tabBar}>
            {[
              { key: "log", label: "Log", icon: "checkmark-circle" },
              { key: "streak", label: "Streak", icon: "flame" },
              { key: "edit", label: "Edit", icon: "settings" },
            ].map((tab) => (
              <TouchableOpacity
                key={tab.key}
                onPress={() => setActiveTab(tab.key as any)}
                style={[styles.tab, activeTab === tab.key && styles.tabActive]}
              >
                <Ionicons name={tab.icon as any} size={18} color={activeTab === tab.key ? "#FFF" : TEXT_SECONDARY} />
                <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>{tab.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Title */}
          {activeTab !== "edit" && (
            <Text numberOfLines={1} style={styles.title}>
              {resolution.title}
            </Text>
          )}

          {/* Content */}
          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20, paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
            {/* LOG TAB */}
            {activeTab === "log" && (
              <Animated.View entering={FadeIn} style={{ flex: 1, justifyContent: "center", alignItems: "center", minHeight: 400 }}>
                {readOnly && (
                  <View style={styles.readOnlyBadge}>
                    <Ionicons name="calendar-outline" size={14} color={ACCENT_ORANGE} />
                    <Text style={styles.readOnlyText}>Scheduled for another day</Text>
                  </View>
                )}

                {resolution.trackingType === "yes_no" && (
                  <View style={{ alignItems: "center" }}>
                    <TouchableOpacity
                      disabled={readOnly}
                      onPress={() => setCountValue(countValue === 0 ? 1 : 0)}
                      style={[styles.checkButton, countValue > 0 && styles.checkButtonDone]}
                    >
                      <Ionicons name="checkmark" size={72} color={countValue > 0 ? "#FFF" : "#E5E7EB"} />
                    </TouchableOpacity>
                    <Text style={styles.checkLabel}>
                      {readOnly ? "View Only" : countValue > 0 ? "Completed! 🎉" : "Tap to complete"}
                    </Text>
                  </View>
                )}

                {resolution.trackingType === "count_based" && (
                  <CountCircles initialCount={countValue} target={resolution.targetCount || 5} onChange={setCountValue} disabled={readOnly} />
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

            {/* STREAK TAB */}
            {activeTab === "streak" && (
              <Animated.View entering={FadeIn} style={{ alignItems: "center" }}>
                <View style={styles.streakCircle}>
                  <Text style={{ fontSize: 40 }}>🔥</Text>
                </View>
                <Text style={styles.streakNumber}>{resolution.currentStreak || 0}</Text>
                <Text style={styles.streakLabel}>Day Streak</Text>
                <MonthHeatmap streakCount={resolution.currentStreak || 0} lastCompletedDate={resolution.lastCompletedDate} />
              </Animated.View>
            )}

            {/* EDIT TAB */}
            {activeTab === "edit" && (
              <Animated.View entering={FadeIn}>
                <Text style={styles.sectionLabel}>Goal Title</Text>
                <View style={styles.inputContainer}>
                  <TextInput value={editTitle} onChangeText={setEditTitle} style={styles.input} placeholder="Goal name..." placeholderTextColor={TEXT_SECONDARY} />
                </View>

                <Text style={[styles.sectionLabel, { marginTop: 24 }]}>Frequency</Text>
                <View style={styles.frequencyRow}>
                  {["daily", "weekdays", "weekends", "custom"].map((f) => (
                    <TouchableOpacity key={f} onPress={() => setEditFrequency(f)} style={[styles.freqPill, editFrequency === f && styles.freqPillActive]}>
                      <Text style={[styles.freqText, editFrequency === f && styles.freqTextActive]}>{f.charAt(0).toUpperCase() + f.slice(1)}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                {editFrequency === "custom" && <DaySelector selectedDays={editCustomDays} toggleDay={toggleCustomDay} setCustomDays={setEditCustomDays} />}

                <Text style={[styles.sectionLabel, { marginTop: 24 }]}>Tracking</Text>
                <View style={{ gap: 10 }}>
                  {[
                    { key: "yes_no", label: "Check-in", icon: "checkmark-circle" },
                    { key: "count_based", label: "Count", icon: "add-circle" },
                    { key: "time_based", label: "Timer", icon: "time" },
                  ].map((t) => (
                    <TouchableOpacity key={t.key} onPress={() => setEditTrackingType(t.key)} style={[styles.trackOption, editTrackingType === t.key && styles.trackOptionActive]}>
                      <Ionicons name={t.icon as any} size={20} color={editTrackingType === t.key ? ACCENT_ORANGE : TEXT_SECONDARY} />
                      <Text style={[styles.trackOptionText, editTrackingType === t.key && { color: ACCENT_ORANGE }]}>{t.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {editTrackingType !== "yes_no" && (
                  <Animated.View entering={FadeInUp} style={{ flexDirection: "row", gap: 12, marginTop: 20 }}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.miniLabel}>{editTrackingType === "time_based" ? "Minutes" : "Target"}</Text>
                      <View style={styles.inputContainer}>
                        <TextInput keyboardType="numeric" value={editTargetValue} onChangeText={setEditTargetValue} style={[styles.input, { textAlign: "center" }]} />
                      </View>
                    </View>
                    {editTrackingType === "count_based" && (
                      <View style={{ flex: 1 }}>
                        <Text style={styles.miniLabel}>Unit</Text>
                        <View style={styles.inputContainer}>
                          <TextInput placeholder="cups" placeholderTextColor={TEXT_SECONDARY} value={editCountUnit} onChangeText={setEditCountUnit} style={[styles.input, { textAlign: "center" }]} />
                        </View>
                      </View>
                    )}
                  </Animated.View>
                )}

                <View style={{ marginTop: 32, gap: 12 }}>
                  <TouchableOpacity onPress={handleEditSave} disabled={isSavingEdit} style={styles.saveBtn}>
                    {isSavingEdit ? <ActivityIndicator color="#FFF" /> : <Text style={styles.saveBtnText}>Save Changes</Text>}
                  </TouchableOpacity>
                  <TouchableOpacity onPress={handleDelete} style={styles.deleteBtn}>
                    <Text style={styles.deleteBtnText}>Delete Goal</Text>
                  </TouchableOpacity>
                </View>
              </Animated.View>
            )}
          </ScrollView>

          {/* Footer for Log/Streak */}
          {(activeTab === "log" || activeTab === "streak") && (
            <View style={styles.footer}>
              <TouchableOpacity onPress={onClose} style={styles.cancelBtn}>
                <Text style={styles.cancelBtnText}>{readOnly || activeTab === "streak" ? "Close" : "Cancel"}</Text>
              </TouchableOpacity>
              {!readOnly && activeTab === "log" && (
                <TouchableOpacity
                  onPress={handleSaveProgress}
                  disabled={isAlreadyCompleted || isSavingProgress}
                  style={[styles.saveProgressBtn, (isAlreadyCompleted || isSavingProgress) && { backgroundColor: isSavingProgress ? ACCENT_ORANGE : "#E5E7EB" }]}
                >
                  {isSavingProgress ? (
                    <ActivityIndicator color="#FFF" />
                  ) : (
                    <Text style={[styles.saveProgressText, isAlreadyCompleted && { color: TEXT_SECONDARY }]}>
                      {isAlreadyCompleted ? "Completed ✓" : "Save Progress"}
                    </Text>
                  )}
                </TouchableOpacity>
              )}
            </View>
          )}
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  sheet: {
    flex: 1,
    backgroundColor: BG_COLOR,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    overflow: "hidden",
  },
  handleContainer: { alignItems: "center", paddingVertical: 12 },
  handle: { width: 40, height: 5, borderRadius: 3, backgroundColor: "#D1D5DB" },
  tabBar: { flexDirection: "row", paddingHorizontal: 20, gap: 8, marginBottom: 16 },
  tab: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 999,
    backgroundColor: "#F3F4F6",
  },
  tabActive: { backgroundColor: TEXT_PRIMARY },
  tabText: { fontFamily: "Nunito-Bold", fontSize: 13, color: TEXT_SECONDARY },
  tabTextActive: { color: "#FFF" },
  title: { fontFamily: "Nunito-Bold", fontSize: 24, color: TEXT_PRIMARY, textAlign: "center", marginBottom: 16 },
  sectionLabel: { fontFamily: "Nunito-Bold", fontSize: 13, color: TEXT_PRIMARY, marginBottom: 10 },
  miniLabel: { fontFamily: "Nunito-SemiBold", fontSize: 12, color: TEXT_SECONDARY, marginBottom: 6 },

  inputContainer: { backgroundColor: "#FFF", borderRadius: 999, borderWidth: 2, borderColor: "#E5E7EB" },
  input: { fontFamily: "Nunito-Medium", fontSize: 16, color: TEXT_PRIMARY, paddingHorizontal: 20, paddingVertical: 16 },

  frequencyRow: { flexDirection: "row", gap: 8 },
  freqPill: { flex: 1, alignItems: "center", paddingVertical: 12, borderRadius: 999, backgroundColor: "#F3F4F6" },
  freqPillActive: { backgroundColor: TEXT_PRIMARY },
  freqText: { fontFamily: "Nunito-Bold", fontSize: 12, color: TEXT_SECONDARY },
  freqTextActive: { color: "#FFF" },

  daysRow: { flexDirection: "row", justifyContent: "space-between", backgroundColor: "#FFF", borderRadius: 999, padding: 6, borderWidth: 2, borderColor: "#E5E7EB" },
  dayCircle: { width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center" },
  dayText: { fontFamily: "Nunito-Bold", fontSize: 13, color: TEXT_SECONDARY },

  trackOption: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: "#FFF", borderRadius: 999, padding: 16, paddingHorizontal: 20, borderWidth: 2, borderColor: "#E5E7EB" },
  trackOptionActive: { borderColor: ACCENT_ORANGE, backgroundColor: "#FFF7ED" },
  trackOptionText: { fontFamily: "Nunito-Bold", fontSize: 14, color: TEXT_PRIMARY },

  readOnlyBadge: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#FFF7ED", paddingVertical: 10, paddingHorizontal: 16, borderRadius: 999, marginBottom: 24 },
  readOnlyText: { fontFamily: "Nunito-SemiBold", fontSize: 12, color: ACCENT_ORANGE },

  checkButton: { width: 140, height: 140, borderRadius: 70, backgroundColor: "#F3F4F6", alignItems: "center", justifyContent: "center", borderWidth: 4, borderColor: "#E5E7EB" },
  checkButtonDone: { backgroundColor: SUCCESS_GREEN, borderColor: SUCCESS_GREEN },
  checkLabel: { fontFamily: "Nunito-SemiBold", fontSize: 14, color: TEXT_SECONDARY, marginTop: 16 },

  streakCircle: { width: 100, height: 100, borderRadius: 50, backgroundColor: "#FFF7ED", alignItems: "center", justifyContent: "center", marginBottom: 16 },
  streakNumber: { fontFamily: "Nunito-Bold", fontSize: 64, color: TEXT_PRIMARY },
  streakLabel: { fontFamily: "Nunito-Medium", fontSize: 14, color: TEXT_SECONDARY, marginBottom: 24 },

  timerBtn: { width: 56, height: 56, borderRadius: 28, alignItems: "center", justifyContent: "center" },
  timerBtnSecondary: { width: 56, height: 56, borderRadius: 28, backgroundColor: "#F3F4F6", alignItems: "center", justifyContent: "center" },
  counterBtn: { width: 60, height: 60, borderRadius: 30, backgroundColor: "#F3F4F6", alignItems: "center", justifyContent: "center" },

  footer: { flexDirection: "row", gap: 12, padding: 20, paddingBottom: 32, backgroundColor: BG_COLOR },
  cancelBtn: { flex: 1, alignItems: "center", paddingVertical: 16, backgroundColor: "#F3F4F6", borderRadius: 999 },
  cancelBtnText: { fontFamily: "Nunito-Bold", fontSize: 15, color: TEXT_SECONDARY },
  saveProgressBtn: { flex: 1, alignItems: "center", paddingVertical: 16, backgroundColor: ACCENT_ORANGE, borderRadius: 999 },
  saveProgressText: { fontFamily: "Nunito-Bold", fontSize: 15, color: "#FFF" },

  saveBtn: { alignItems: "center", paddingVertical: 16, backgroundColor: ACCENT_ORANGE, borderRadius: 999 },
  saveBtnText: { fontFamily: "Nunito-Bold", fontSize: 15, color: "#FFF" },
  deleteBtn: { alignItems: "center", paddingVertical: 16, backgroundColor: "#FEE2E2", borderRadius: 999 },
  deleteBtnText: { fontFamily: "Nunito-Bold", fontSize: 15, color: "#EF4444" },
});

import { api } from '@/convex/_generated/api';
import { useUser } from '@clerk/clerk-expo';
import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery } from 'convex/react';
import { BlurView } from 'expo-blur';
import { GlassView } from 'expo-glass-effect';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  FlatList,
  Modal,
  RefreshControl,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import Animated, {
  Easing,
  FadeInDown,
  FadeInUp,
  runOnUI,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle } from 'react-native-svg';

// --- Types ---
type Resolution = {
  _id: string;
  title: string;
  categoryKey: string;
  frequencyType: string;
  trackingType: 'yes_no' | 'time_based' | 'count_based';
  targetCount?: number;
  countUnit?: string;
  targetTime?: number;
  customDays?: number[];
  daysPerWeek?: number;
};

type DailyLog = {
  _id: string;
  userResolutionId: string;
  currentValue: number;
  isCompleted: boolean;
};

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

// --- Config ---
const CARD_COLORS = ['#E0F2FE', '#DCFCE7', '#FAE8FF', '#FFEDD5', '#FFE4E6', '#FEF9C3'];
const INACTIVE_COLOR = '#F1F5F9';

const FILTER_DAYS = [
  { key: 'today', label: 'Today' },
  { key: 'pending', label: 'Pending' },
  { key: 'completed', label: 'Completed' },
  { key: 'all', label: 'All Goals' },
];

// Smooth easing configuration
const SMOOTH_EASING = Easing.bezier(0.4, 0.0, 0.2, 1);
const DURATION_FAST = 200;
const DURATION_NORMAL = 300;
const DURATION_SLOW = 400;

// --- Helpers ---
const getScheduleLabel = (item: Resolution) => {
  if (item.frequencyType === 'daily') return 'Daily';
  if (item.frequencyType === 'weekdays') return 'Weekdays';
  if (item.frequencyType === 'weekends') return 'Weekends';
  if (item.frequencyType === 'custom') return 'Custom Days';
  return 'Scheduled';
};

const getTargetText = (item: Resolution) => {
  if (item.trackingType === 'yes_no') return 'Check In';
  if (item.trackingType === 'time_based') return `${item.targetTime} mins`;
  return `${item.targetCount} ${item.countUnit || 'units'}`;
};

const isTaskAvailableOnDate = (item: Resolution, date: Date) => {
  const day = date.getDay();
  if (item.frequencyType === 'daily') return true;
  if (item.frequencyType === 'weekdays') return day >= 1 && day <= 5;
  if (item.frequencyType === 'weekends') return day === 0 || day === 6;
  if (item.frequencyType === 'custom' && item.customDays) return item.customDays.includes(day);
  if (item.frequencyType === 'x_days_per_week') return true;
  return false;
};

const isTaskToday = (item: Resolution) => isTaskAvailableOnDate(item, new Date());

const formatTime = (totalSeconds: number) => {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

// --- COMPONENT: Day Circles ---
const DayCircles = ({ item, isInactive }: { item: Resolution, isInactive: boolean }) => {
  const daysMap = [1, 2, 3, 4, 5, 6, 0];
  const dayLabels = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

  const isDayActive = (jsDayIndex: number, loopIndex: number) => {
    const { frequencyType, customDays, daysPerWeek } = item;
    if (frequencyType === 'daily') return true;
    if (frequencyType === 'weekdays') return jsDayIndex >= 1 && jsDayIndex <= 5;
    if (frequencyType === 'weekends') return jsDayIndex === 0 || jsDayIndex === 6;
    if (frequencyType === 'custom' && customDays) return customDays.includes(jsDayIndex);
    if (frequencyType === 'x_days_per_week' && daysPerWeek) return loopIndex < daysPerWeek;
    return false;
  };

  return (
    <View className="flex-row items-center space-x-1 mt-3">
      {daysMap.map((jsDayIndex, loopIndex) => {
        const active = isDayActive(jsDayIndex, loopIndex);
        const activeColor = isInactive ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.7)';

        return (
          <Animated.View
            key={loopIndex}
            entering={FadeInUp.delay(loopIndex * 30).duration(DURATION_NORMAL).easing(SMOOTH_EASING)}
            style={{
              width: 22, height: 22, borderRadius: 11,
              backgroundColor: active ? activeColor : 'rgba(0,0,0,0.05)',
              alignItems: 'center', justifyContent: 'center', marginRight: 4,
            }}
          >
            <Text style={{ fontSize: 9, color: active ? '#FFFFFF' : 'rgba(0,0,0,0.3)', fontWeight: '700' }}>
              {dayLabels[loopIndex]}
            </Text>
          </Animated.View>
        );
      })}
    </View>
  );
};

// --- COMPONENT: Modern Ring Timer ---
const ModernTimer = ({
  seconds,
  targetMinutes,
  isRunning,
  onToggle,
  onAddFive,
  disabled
}: {
  seconds: number;
  targetMinutes: number;
  isRunning: boolean;
  onToggle: () => void;
  onAddFive: () => void;
  disabled: boolean;
}) => {
  const size = 220;
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  const targetSeconds = (targetMinutes || 1) * 60;
  const progress = Math.min(seconds / targetSeconds, 1);
  const isGoalMet = seconds >= targetSeconds;

  const animatedProps = useAnimatedProps(() => {
    'worklet';
    return {
      strokeDashoffset: withTiming(
        circumference * (1 - progress),
        { duration: DURATION_SLOW, easing: SMOOTH_EASING }
      )
    };
  });

  const buttonScale = useAnimatedStyle(() => {
    'worklet';
    return {
      transform: [{
        scale: withSequence(
          withTiming(0.95, { duration: 100, easing: SMOOTH_EASING }),
          withTiming(1, { duration: 100, easing: SMOOTH_EASING })
        )
      }]
    };
  });

  return (
    <View className="items-center justify-center my-6">
      <Animated.View
        entering={FadeInDown.duration(DURATION_SLOW).easing(SMOOTH_EASING)}
        style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}
      >
        <Svg width={size} height={size} style={{ position: 'absolute' }}>
          <Circle cx={size / 2} cy={size / 2} r={radius} stroke="#F1F5F9" strokeWidth={strokeWidth} fill="none" />
          <AnimatedCircle
            cx={size / 2} cy={size / 2} r={radius}
            stroke={isGoalMet ? "#22c55e" : "#3A7AFE"}
            strokeWidth={strokeWidth} fill="none"
            strokeLinecap="round" strokeDasharray={circumference}
            animatedProps={animatedProps}
            rotation="-90" origin={`${size / 2}, ${size / 2}`}
            opacity={disabled ? 0.3 : 1}
          />
        </Svg>

        <View className="items-center">
          <Text className="font-generalsans-bold text-5xl text-slate-900 tracking-wider font-variant-numeric tabular-nums">
            {formatTime(seconds)}
          </Text>
          <Text className="text-slate-400 font-medium text-xs uppercase tracking-widest mt-1">
            Goal: {targetMinutes} min
          </Text>
        </View>
      </Animated.View>

      <View className="flex-row items-center gap-6 mt-8">
        <TouchableOpacity
          onPress={onToggle}
          disabled={isGoalMet || disabled}
          activeOpacity={0.8}
          className={`w-16 h-16 rounded-full items-center justify-center shadow-sm ${(disabled) ? 'bg-slate-200' :
            (isGoalMet ? 'bg-green-500' : (isRunning ? 'bg-red-500' : 'bg-[#3A7AFE]'))
            }`}
        >
          <Ionicons
            name={isGoalMet ? "checkmark" : (isRunning ? "pause" : "play")}
            size={32} color="white"
            style={{ marginLeft: (isRunning || isGoalMet) ? 0 : 4 }}
          />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={onAddFive}
          disabled={isGoalMet || disabled}
          activeOpacity={0.8}
          className={`w-16 h-16 rounded-full items-center justify-center ${(isGoalMet || disabled) ? 'bg-slate-100 opacity-50' : 'bg-slate-100'
            }`}
        >
          <Text className={`font-generalsans-bold text-sm ${isGoalMet ? 'text-slate-300' : 'text-slate-600'}`}>
            +5m
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

// --- COMPONENT: Modern Counter ---
const CountCircles = ({
  initialCount,
  target,
  onChange,
  disabled
}: {
  initialCount: number;
  target: number;
  onChange: (val: number) => void;
  disabled: boolean;
}) => {
  const [count, setCount] = useState(initialCount);
  const [direction, setDirection] = useState<'up' | 'down' | null>(null);

  useEffect(() => {
    setCount(initialCount);
  }, [initialCount]);

  const increment = () => {
    if (disabled || count >= target) return;
    setDirection('up');
    const newCount = count + 1;
    setCount(newCount);
    onChange(newCount);
    setTimeout(() => setDirection(null), DURATION_NORMAL);
  };

  const decrement = () => {
    if (disabled || count <= 0) return;
    setDirection('down');
    const newCount = count - 1;
    setCount(newCount);
    onChange(newCount);
    setTimeout(() => setDirection(null), DURATION_NORMAL);
  };

  const maxTarget = target || 5;

  const countAnimStyle = useAnimatedStyle(() => {
    'worklet';
    return {
      transform: [{
        scale: withSequence(
          withTiming(1.1, { duration: 100, easing: SMOOTH_EASING }),
          withTiming(1, { duration: 200, easing: SMOOTH_EASING })
        )
      }]
    };
  });

  return (
    <View className="items-center justify-center my-6">
      <Animated.View
        entering={FadeInDown.duration(DURATION_SLOW).easing(SMOOTH_EASING)}
        className="relative items-center justify-center mb-8"
      >
        <Animated.Text
          style={countAnimStyle}
          className={`font-generalsans-bold text-[120px] leading-[120px] ${disabled ? 'text-slate-300' : 'text-slate-900'
            }`}
        >
          {count}
        </Animated.Text>

        <View className="flex-row items-center gap-1.5 mt-4">
          {Array.from({ length: maxTarget }, (_, i) => (
            <Animated.View
              key={i}
              entering={FadeInUp.delay(i * 50).duration(DURATION_NORMAL).easing(SMOOTH_EASING)}
              className={`h-1.5 rounded-full transition-all ${i < count ? 'bg-[#3A7AFE] w-6' : 'bg-slate-200 w-1.5'
                }`}
            />
          ))}
        </View>

        <Text className="text-slate-400 font-generalsans-medium text-sm mt-3">
          of {maxTarget}
        </Text>
      </Animated.View>

      <View className="flex-row items-center gap-8">
        <TouchableOpacity
          onPress={decrement}
          disabled={disabled || count <= 0}
          activeOpacity={0.7}
          className={`w-20 h-20 rounded-full items-center justify-center shadow-sm ${disabled || count <= 0 ? 'bg-slate-100' : 'bg-white border-2 border-slate-200'
            }`}
        >
          <Ionicons
            name="remove"
            size={32}
            color={disabled || count <= 0 ? '#CBD5E1' : '#3A7AFE'}
          />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={increment}
          disabled={disabled || count >= maxTarget}
          activeOpacity={0.7}
          className={`w-20 h-20 rounded-full items-center justify-center shadow-sm ${disabled || count >= maxTarget ? 'bg-slate-100' : 'bg-[#3A7AFE]'
            }`}
        >
          <Ionicons
            name="add"
            size={36}
            color={disabled || count >= maxTarget ? '#CBD5E1' : 'white'}
          />
        </TouchableOpacity>
      </View>

      {count >= maxTarget && !disabled && (
        <Animated.View
          entering={FadeInDown.duration(DURATION_NORMAL).easing(SMOOTH_EASING)}
          className="mt-6 bg-green-50 px-6 py-3 rounded-full border border-green-100"
        >
          <Text className="text-green-600 font-generalsans-bold text-sm">
            🎉 Goal Achieved!
          </Text>
        </Animated.View>
      )}
    </View>
  );
};

// --- COMPONENT: Tracking Modal ---
const TrackingModal = ({
  visible,
  onClose,
  resolution,
  initialValue = 0
}: {
  visible: boolean;
  onClose: () => void;
  resolution: Resolution | null;
  initialValue?: number;
}) => {
  const logProgress = useMutation(api.resolutions.logProgress);

  const [seconds, setSeconds] = useState(0);
  const [countValue, setCountValue] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const isAvailableToday = resolution ? isTaskToday(resolution) : false;

  useEffect(() => {
    if (visible && resolution) {
      if (resolution.trackingType === 'time_based') {
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
          if (resolution && resolution.targetTime && next >= resolution.targetTime * 60) {
            stopTimer();
            return resolution.targetTime * 60;
          }
          return next;
        });
      }, 1000);
    }
  };

  const addFiveMinutes = () => {
    if (!resolution || !resolution.targetTime) return;
    setSeconds((prev) => {
      const added = prev + (5 * 60);
      const cap = resolution.targetTime! * 60;
      return Math.min(added, cap);
    });
  };

  const handleSave = async () => {
    if (!isAvailableToday) return;
    if (!resolution) return;
    try {
      let finalValue = 0;
      if (resolution.trackingType === 'time_based') {
        finalValue = seconds;
      } else {
        finalValue = countValue;
      }
      await logProgress({
        userResolutionId: resolution._id as any,
        date: new Date().toISOString().split('T')[0],
        value: finalValue,
      });
      onClose();
    } catch (e) {
      Alert.alert("Error", "Failed to save progress");
    }
  };

  if (!resolution) return null;

  return (
    <Modal animationType="slide" transparent={true} visible={visible} onRequestClose={onClose}>
      <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill}>
        <TouchableOpacity style={{ flex: 1 }} onPress={onClose} />

        <Animated.View
          entering={FadeInUp.duration(DURATION_NORMAL).easing(SMOOTH_EASING)}
          className="bg-white w-full rounded-t-[40px] pb-10 pt-8 px-6 shadow-2xl h-[75%] mt-auto"
        >
          <View className="w-12 h-1 bg-slate-200 rounded-full self-center mb-6 opacity-50" />

          <View className="items-center mb-4">
            <Text className="text-slate-400 font-generalsans-medium text-xs uppercase tracking-widest mb-1">
              Log Progress
            </Text>
            <Text className="text-slate-900 font-generalsans-bold text-3xl text-center leading-9 w-[80%]">
              {resolution.title}
            </Text>
            {!isAvailableToday && (
              <View className="bg-red-50 px-3 py-1.5 rounded-full mt-3 border border-red-100">
                <Text className="text-red-500 font-generalsans-medium text-xs">
                  You can't log this today
                </Text>
              </View>
            )}
          </View>

          <View className="flex-1 justify-center">
            {resolution.trackingType === 'yes_no' && (
              <View className="items-center">
                <TouchableOpacity
                  disabled={!isAvailableToday}
                  onPress={() => setCountValue(countValue === 0 ? 1 : 0)}
                  activeOpacity={0.8}
                  className={`w-36 h-36 rounded-full items-center justify-center mb-4 transition-all ${!isAvailableToday ? 'bg-slate-100' :
                    (countValue > 0 ? 'bg-green-500 shadow-xl shadow-green-200' : 'bg-slate-100')
                    }`}
                >
                  <Ionicons
                    name="checkmark"
                    size={72}
                    color={countValue > 0 ? 'white' : '#CBD5E1'}
                  />
                </TouchableOpacity>
                <Text className="text-slate-500 font-generalsans-medium text-lg">
                  {countValue > 0 ? 'Completed!' : 'Tap to Mark Done'}
                </Text>
              </View>
            )}

            {resolution.trackingType === 'count_based' && (
              <CountCircles
                initialCount={countValue}
                target={resolution.targetCount || 5}
                onChange={setCountValue}
                disabled={!isAvailableToday}
              />
            )}

            {resolution.trackingType === 'time_based' && (
              <ModernTimer
                seconds={seconds}
                targetMinutes={resolution.targetTime || 30}
                isRunning={isTimerRunning}
                onToggle={toggleTimer}
                onAddFive={addFiveMinutes}
                disabled={!isAvailableToday}
              />
            )}
          </View>

          <View className="flex-row w-full gap-4 mt-auto">
            <TouchableOpacity
              onPress={onClose}
              className="flex-1 py-4 bg-slate-100 rounded-2xl items-center"
            >
              <Text className="text-slate-500 font-generalsans-bold">Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleSave}
              disabled={!isAvailableToday}
              className={`flex-1 py-4 rounded-2xl items-center shadow-lg ${!isAvailableToday ? 'bg-slate-200 shadow-none' : 'bg-[#3A7AFE] shadow-blue-200'
                }`}
            >
              <Text className={`font-generalsans-bold ${!isAvailableToday ? 'text-slate-400' : 'text-white'
                }`}>
                Save
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </BlurView>
    </Modal>
  );
};

// --- COMPONENT: Main Card ---
const SquircleCard = ({
  item,
  index,
  onPress,
  isCompleted
}: {
  item: Resolution;
  index: number;
  onPress: () => void;
  isCompleted: boolean;
}) => {
  const isAvailableToday = isTaskToday(item);
  const backgroundColor = isAvailableToday ? CARD_COLORS[index % CARD_COLORS.length] : INACTIVE_COLOR;
  const textColor = isAvailableToday ? '#1E293B' : '#64748B';
  const badgeBg = 'rgba(0,0,0,0.05)';
  const badgeText = 'rgba(0,0,0,0.6)';

  return (
    <Animated.View
      entering={FadeInDown.delay(index * 80).duration(DURATION_SLOW).easing(SMOOTH_EASING)}
      className="mb-4"
    >
      <TouchableOpacity activeOpacity={0.9} style={styles.cardShadow} onPress={onPress}>
        <View style={[styles.cardContainer, { backgroundColor }]}>
          <View className="flex-row justify-between items-start mb-2">
            <View style={{ backgroundColor: badgeBg }} className="px-3 py-1.5 rounded-full">
              <Text style={{ color: badgeText }} className="text-[10px] font-generalsans-medium text-center tracking-wider uppercase">
                {item.categoryKey}
              </Text>
            </View>

            <View className="flex-row items-center gap-2">
              <View style={{ backgroundColor: badgeBg }} className="px-3 py-1.5 rounded-full flex-row items-center gap-1.5">
                <Ionicons
                  name={isAvailableToday ? "calendar" : "moon"}
                  size={11}
                  color={badgeText}
                />
                <Text style={{ color: badgeText }} className="text-[10px] font-generalsans-medium uppercase tracking-wider">
                  {getScheduleLabel(item)}
                </Text>
              </View>

              {isCompleted && isAvailableToday && (
                <Animated.View
                  entering={FadeInDown.duration(DURATION_FAST).easing(SMOOTH_EASING)}
                  className="bg-white px-2.5 py-1.5 rounded-full flex-row items-center shadow-sm"
                >
                  <Ionicons name="checkmark-circle" size={14} color="#10B981" />
                  <Text className="text-emerald-600 text-[10px] font-generalsans-bold uppercase tracking-wide ml-1">
                    Done
                  </Text>
                </Animated.View>
              )}
            </View>
          </View>

          <View className="mb-4">
            <DayCircles item={item} isInactive={!isAvailableToday} />
          </View>

          <Text
            style={{ color: textColor }}
            className="font-generalsans-bold tracking-[-0.8px] text-[30px] leading-9 mb-6"
            numberOfLines={2}
          >
            {item.title}
          </Text>

          <View className="flex-row items-center border-t border-black/5 pt-3 mt-auto">
            <View className={`w-2 h-2 rounded-full mr-2 ${isAvailableToday ? (isCompleted ? 'bg-emerald-500' : 'bg-blue-500') : 'bg-slate-300'
              }`} />

            <View className='flex flex-row items-center gap-x-1'>
              <Text className="text-slate-500 font-generalsans-medium text-xs">
                {!isAvailableToday ? "Rest Day" : (isCompleted ? "Completed" : "Goal:")}
              </Text>
              <Text style={{ color: textColor }} className="font-generalsans-bold text-xs">
                {getTargetText(item)}
              </Text>
            </View>



            <Ionicons name="chevron-forward" size={14} color="rgba(0,0,0,0.2)" style={{ marginLeft: 'auto' }} />
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

// --- MAIN SCREEN ---
export default function HomeScreen() {
  const { user } = useUser();
  const router = useRouter();

  const resolutions = useQuery(api.userResolutions.listActive);
  const todayStr = new Date().toISOString().split('T')[0];
  const todayLogs = useQuery(api.resolutions.getTodayLogs, { date: todayStr });

  const [refreshing, setRefreshing] = useState(false);
  const [trackingModalVisible, setTrackingModalVisible] = useState(false);
  const [selectedResolution, setSelectedResolution] = useState<Resolution | null>(null);
  const [selectedDayFilter, setSelectedDayFilter] = useState('today');
  const selectedIndex = useSharedValue(0);
  const containerWidth = useSharedValue(0);
  const [isLayoutReady, setIsLayoutReady] = useState(false);

  const getLogForResolution = (resId: string) => {
    return todayLogs?.find(log => log.userResolutionId === resId);
  };

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  const sortedResolutions = useMemo(() => {
    if (!resolutions) return [];

    const logsMap = new Map();
    if (todayLogs) {
      todayLogs.forEach(log => logsMap.set(log.userResolutionId, log));
    }

    return resolutions.filter(item => {
      const isToday = isTaskToday(item);
      const log = logsMap.get(item._id);
      const isCompleted = log?.isCompleted || false;

      if (selectedDayFilter === 'today') return isToday;
      if (selectedDayFilter === 'pending') return isToday && !isCompleted;
      if (selectedDayFilter === 'completed') return isToday && isCompleted;
      return true;
    }).sort((a, b) => {
      const aToday = isTaskToday(a);
      const bToday = isTaskToday(b);
      const aLog = logsMap.get(a._id);
      const bLog = logsMap.get(b._id);
      const aCompleted = aLog?.isCompleted || false;
      const bCompleted = bLog?.isCompleted || false;

      if (aToday && !bToday) return -1;
      if (!aToday && bToday) return 1;
      if (aToday && bToday) {
        if (!aCompleted && bCompleted) return -1;
        if (aCompleted && !bCompleted) return 1;
      }
      return a.title.localeCompare(b.title);
    });
  }, [resolutions, todayLogs, selectedDayFilter]);

  const handleCardPress = (item: Resolution) => {
    setSelectedResolution(item);
    setTrackingModalVisible(true);
  };

  // Update shared value when filter changes
  useEffect(() => {
    const index = FILTER_DAYS.findIndex(f => f.key === selectedDayFilter);
    runOnUI(() => {
      'worklet';
      selectedIndex.value = index;
    })();
  }, [selectedDayFilter]);

  // Animated indicator position
  const indicatorPosition = useAnimatedStyle(() => {
    'worklet';
    if (containerWidth.value === 0) {
      return {
        transform: [{ translateX: 0 }],
        width: 0,
        opacity: 0
      };
    }

    const tabWidth = containerWidth.value / FILTER_DAYS.length;

    return {
      transform: [{
        translateX: withTiming(selectedIndex.value * tabWidth, {
          duration: DURATION_NORMAL,
          easing: SMOOTH_EASING
        })
      }],
      width: tabWidth,
      opacity: withTiming(1, { duration: DURATION_FAST })
    };
  });

  return (
    <View className="flex-1 bg-[#3A7AFE]">
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      <SafeAreaView style={{ flex: 1 }} edges={['top']}>

        <View className="flex-row justify-between items-end px-6 pb-6 pt-2">
          <View>
            <Text className="text-white font-generalsans-bold text-[34px] tracking-[-2px] leading-tight">Resolutions</Text>
          </View>

        </View>

        <View className="flex-row items-center mx-5 mb-6 gap-3">
          {/* Tabs Container */}
          <GlassView
            glassEffectStyle='regular'
            isInteractive
            tintColor='#3A7AFE'
            style={{ flex: 1, borderRadius: 999, overflow: 'hidden' }}
          >
            <View
              style={{
                padding: 4,
                flexDirection: 'row',
                borderWidth: 1,
                borderColor: 'rgba(255,255,255,0.1)',
                position: 'relative'
              }}
              onLayout={(e) => {
                const width = e.nativeEvent.layout.width - 8; // subtract padding
                runOnUI(() => {
                  'worklet';
                  containerWidth.value = width;
                })();
                setIsLayoutReady(true);
              }}
            >
              {/* Animated Indicator Background */}
              {isLayoutReady && (
                <Animated.View
                  style={[
                    indicatorPosition,
                    {
                      position: 'absolute',
                      left: 4,
                      top: 4,
                      bottom: 4,
                      borderRadius: 999,
                      overflow: 'hidden',
                    }
                  ]}
                >
                  <GlassView
                    glassEffectStyle='regular'
                    isInteractive
                    style={{ flex: 1 }}
                  />
                </Animated.View>
              )}

              {/* Tab Buttons */}
              {FILTER_DAYS.map((filter) => {
                const isActive = selectedDayFilter === filter.key;
                return (
                  <TouchableOpacity
                    key={filter.key}
                    onPress={() => setSelectedDayFilter(filter.key)}
                    className="flex-1"
                    activeOpacity={1}
                  >
                    <View className="py-3.5 items-center justify-center">
                      <Animated.Text
                        entering={FadeInDown.delay(FILTER_DAYS.findIndex(f => f.key === filter.key) * 50).duration(DURATION_NORMAL).easing(SMOOTH_EASING)}
                        className={`text-[12px] font-generalsans-semibold tracking-tighter ${isActive ? 'text-white' : 'text-white/70'
                          }`}
                      >
                        {filter.label}
                      </Animated.Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </GlassView>

          {/* Add Button */}
          <GlassView
            glassEffectStyle='regular'
            tintColor='#3A7AFE'
            isInteractive
            style={{
              width: 48,
              aspectRatio: 1,
              borderRadius: 999,
              overflow: 'hidden',
            }}
          >
            <TouchableOpacity
              onPress={() => router.push('/create')}
              activeOpacity={0.8}
              style={{
                flex: 1,
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Ionicons name="add" size={28} color="white" />
            </TouchableOpacity>
          </GlassView>
        </View>

        <FlatList
          data={sortedResolutions}
          keyExtractor={(item) => item._id}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100, paddingTop: 0 }}
          showsVerticalScrollIndicator={false}
          removeClippedSubviews={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="white"
            />
          }
          ListEmptyComponent={() => (
            <Animated.View
              entering={FadeInDown.duration(DURATION_SLOW).easing(SMOOTH_EASING)}
              className="items-center justify-center mt-20"
            >
              <Text className="text-white/60 text-center font-generalsans-medium">
                {selectedDayFilter === 'today' ? 'No tasks scheduled for today.' :
                  selectedDayFilter === 'pending' ? 'All caught up for today!' :
                    selectedDayFilter === 'completed' ? 'No completed tasks yet.' : 'No goals found.'}
              </Text>
            </Animated.View>
          )}
          renderItem={({ item, index }) => {
            const log = getLogForResolution(item._id);
            return (
              <SquircleCard
                item={item}
                index={index}
                isCompleted={log?.isCompleted || false}
                onPress={() => handleCardPress(item)}
              />
            );
          }}
        />
      </SafeAreaView>

      <TrackingModal
        visible={trackingModalVisible}
        onClose={() => setTrackingModalVisible(false)}
        resolution={selectedResolution}
        initialValue={selectedResolution ? getLogForResolution(selectedResolution._id)?.currentValue : 0}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    paddingVertical: 20,
    paddingHorizontal: 22,
    minHeight: 220,
    borderRadius: 32,
    // @ts-ignore
    cornerCurve: 'continuous',
  },
  cardShadow: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
});
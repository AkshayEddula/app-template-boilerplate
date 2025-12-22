import { api } from "@/convex/_generated/api";
import { Ionicons } from "@expo/vector-icons";
import { useMutation } from "convex/react";
import { BlurView } from "expo-blur";
import { useEffect, useRef, useState } from "react";
import { Alert, Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Animated, { Easing, FadeInDown, FadeInUp, useAnimatedProps, withSequence, withTiming } from "react-native-reanimated";
import Svg, { Circle } from "react-native-svg";

const formatTime = (totalSeconds: number) => {
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};


const SMOOTH_EASING = Easing.bezier(0.4, 0.0, 0.2, 1);
const DURATION_NORMAL = 300;
const DURATION_SLOW = 400;
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

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


export const TrackingModal = ({
    visible,
    onClose,
    resolution,
    initialValue = 0,
    onLevelUp
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

    const handleSave = async () => {
        if (!isAvailableToday || !resolution) return;
        try {
            const finalValue = resolution.trackingType === 'time_based' ? seconds : countValue;

            const result = await logProgress({
                userResolutionId: resolution._id as any,
                date: new Date().toISOString().split('T')[0],
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
        <Modal animationType="slide" transparent={true} visible={visible} onRequestClose={onClose}>
            <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill}>
                <TouchableOpacity style={{ flex: 1 }} onPress={onClose} />
                <Animated.View
                    entering={FadeInUp.duration(DURATION_NORMAL).easing(SMOOTH_EASING)}
                    className="bg-white w-full rounded-t-[40px] pb-10 pt-8 px-6 shadow-2xl h-[75%] mt-auto"
                >
                    <View className="w-12 h-1 bg-slate-200 rounded-full self-center mb-6 opacity-50" />
                    <View className="items-center mb-4">
                        <Text className="text-slate-400 font-generalsans-medium text-xs uppercase tracking-widest mb-1">Log Progress</Text>
                        <Text className="text-slate-900 font-generalsans-bold text-3xl text-center leading-9">{resolution.title}</Text>
                    </View>

                    <View className="flex-1 justify-center">
                        {resolution.trackingType === 'yes_no' && (
                            <View className="items-center">
                                <TouchableOpacity
                                    disabled={!isAvailableToday}
                                    onPress={() => setCountValue(countValue === 0 ? 1 : 0)}
                                    className={`w-36 h-36 rounded-full items-center justify-center ${countValue > 0 ? 'bg-green-500' : 'bg-slate-100'}`}
                                >
                                    <Ionicons name="checkmark" size={72} color={countValue > 0 ? 'white' : '#CBD5E1'} />
                                </TouchableOpacity>
                            </View>
                        )}

                        {resolution.trackingType === 'count_based' && (
                            <CountCircles initialCount={countValue} target={resolution.targetCount || 5} onChange={setCountValue} disabled={!isAvailableToday} />
                        )}

                        {resolution.trackingType === 'time_based' && (
                            <ModernTimer seconds={seconds} targetMinutes={resolution.targetTime || 30} isRunning={isTimerRunning} onToggle={toggleTimer} onAddFive={() => setSeconds(s => s + 300)} disabled={!isAvailableToday} />
                        )}
                    </View>

                    <View className="flex-row w-full gap-4 mt-auto">
                        <TouchableOpacity onPress={onClose} className="flex-1 py-4 bg-slate-100 rounded-2xl items-center">
                            <Text className="text-slate-500 font-generalsans-bold">Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={handleSave} disabled={!isAvailableToday} className={`flex-1 py-4 rounded-2xl items-center ${!isAvailableToday ? 'bg-slate-200' : 'bg-[#3A7AFE]'}`}>
                            <Text className="text-white font-generalsans-bold">Save</Text>
                        </TouchableOpacity>
                    </View>
                </Animated.View>
            </BlurView>
        </Modal>
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

    const countAnimStyle = useAnimatedProps(() => {
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
                    className={`font-generalsans-bold text-[120px] leading-[120px] ${disabled ? 'text-slate-300' : 'text-slate-900'
                        }`}
                >
                    {count}
                </Animated.Text>

                <View className="flex-row items-center gap-1.5 mt-4">
                    {Array.from({ length: maxTarget }, (_, i) => (
                        <Animated.View
                            key={i}
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
        </View>
    );
};

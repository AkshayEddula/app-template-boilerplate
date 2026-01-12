import { Ionicons } from "@expo/vector-icons";
import { GlassView } from "expo-glass-effect"; // <--- Import GlassView
import {
    Dimensions,
    Platform,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import Animated, {
    Easing,
    FadeInDown,
    FadeInUp,
    LinearTransition,
} from "react-native-reanimated";

type Resolution = {
    _id: string;
    title: string;
    categoryKey: string;
    frequencyType: string;
    trackingType: "yes_no" | "time_based" | "count_based";
    targetCount?: number;
    countUnit?: string;
    targetTime?: number;
    customDays?: number[];
    daysPerWeek?: number;
};

// Smooth easing configuration
const SMOOTH_EASING = Easing.bezier(0.4, 0.0, 0.2, 1);
const DURATION_NORMAL = 300;
const DURATION_SLOW = 400;

const getScheduleLabel = (item: Resolution) => {
    if (item.frequencyType === "daily") return "Daily";
    if (item.frequencyType === "weekdays") return "Weekdays";
    if (item.frequencyType === "weekends") return "Weekends";
    if (item.frequencyType === "custom") return "Custom Days";
    return "Scheduled";
};

const getTargetText = (item: Resolution) => {
    if (item.trackingType === "yes_no") return "Check In";
    if (item.trackingType === "time_based") return `${item.targetTime} mins`;
    return `${item.targetCount} ${item.countUnit || "units"}`;
};

const CARD_COLORS = [
    "#E0F2FE",
    "#DCFCE7",
    "#FAE8FF",
    "#FFEDD5",
    "#FFE4E6",
    "#FEF9C3",
];
const INACTIVE_COLOR = "#F1F5F9";
const SCREEN_WIDTH = Dimensions.get("window").width;

const isTaskAvailableOnDate = (item: Resolution, date: Date) => {
    const day = date.getDay();
    if (item.frequencyType === "daily") return true;
    if (item.frequencyType === "weekdays") return day >= 1 && day <= 5;
    if (item.frequencyType === "weekends") return day === 0 || day === 6;
    if (item.frequencyType === "custom" && item.customDays)
        return item.customDays.includes(day);
    if (item.frequencyType === "x_days_per_week") return true;
    return false;
};

const isTaskToday = (item: Resolution) =>
    isTaskAvailableOnDate(item, new Date());

export const SquircleCard = ({
    item,
    index,
    onPress,
    isCompleted,
    currentFilter,
}: any) => {
    const isAvailableToday = isTaskToday(item);

    // Determine base color
    const baseColor = isAvailableToday
        ? CARD_COLORS[index % CARD_COLORS.length]
        : INACTIVE_COLOR;
    const textColor = isAvailableToday ? "#1E293B" : "#64748B";

    return (
        <Animated.View
            key={`${item._id}-${currentFilter}`}
            entering={FadeInDown.delay(index * 60)
                .duration(DURATION_SLOW)
                .easing(SMOOTH_EASING)}
            layout={LinearTransition.duration(300)}
            className="mb-4"
        >
            <TouchableOpacity
                activeOpacity={0.8}
                style={styles.cardShadow}
                onPress={onPress}
            >
                {/* Main Visual Container
                    - Handles Overflow (for glass clipping)
                    - Handles Background (Android fallback)
                    - Handles Border
                */}
                <View
                    style={{
                        overflow: "hidden", // Essential for GlassView
                        minHeight: 220,
                        // Android gets solid color, iOS gets transparent (to show glass)
                        backgroundColor:
                            Platform.OS === "android" ? baseColor : "transparent",
                    }}
                >
                    {/* --- GLASS LAYER (iOS Only) --- */}
                    {Platform.OS === "ios" && (
                        <GlassView
                            style={{
                                ...StyleSheet.absoluteFillObject,
                                borderRadius: 40,
                                overflow: "hidden",
                            }}
                            glassEffectStyle="regular"
                            tintColor={baseColor} // <--- Tint the glass with the card color
                        />
                    )}

                    {/* --- CONTENT LAYER --- */}
                    {/* We use a View here for padding so the glass stays edge-to-edge */}
                    <View style={{ paddingVertical: 20, paddingHorizontal: 22, flex: 1 }}>
                        {/* Header Row */}
                        <View className="flex-row justify-between items-start mb-2">
                            {/* Category Pill - Made semi-transparent white for glass feel */}
                            <View className="bg-white/40 px-3 py-1.5 rounded-full border border-white/20">
                                <Text className="text-[10px] font-generalsans-medium uppercase tracking-wider opacity-70">
                                    {item.categoryKey}
                                </Text>
                            </View>

                            <View className="flex-row items-center gap-2">
                                <View className="bg-white/40 px-3 py-1.5 rounded-full flex-row items-center gap-1.5 border border-white/20">
                                    <Ionicons
                                        name={isAvailableToday ? "calendar" : "moon"}
                                        size={11}
                                        color="rgba(0,0,0,0.6)"
                                    />
                                    <Text className="text-[10px] font-generalsans-medium uppercase opacity-70">
                                        {getScheduleLabel(item)}
                                    </Text>
                                </View>
                                {isCompleted && isAvailableToday && (
                                    <View className="bg-white px-2.5 py-1.5 rounded-full flex-row items-center shadow-sm">
                                        <Ionicons
                                            name="checkmark-circle"
                                            size={14}
                                            color="#10B981"
                                        />
                                        <Text className="text-emerald-600 text-[10px] font-generalsans-bold ml-1">
                                            DONE
                                        </Text>
                                    </View>
                                )}
                            </View>
                        </View>

                        {/* Day Circles */}
                        <DayCircles item={item} isInactive={!isAvailableToday} />

                        {/* Title */}
                        <Text
                            style={{
                                color: textColor,
                                textShadowColor: "rgba(255,255,255,0.4)",
                                textShadowOffset: { width: 0, height: 1 },
                                textShadowRadius: 0,
                            }}
                            className="font-generalsans-bold text-[30px] leading-9 my-6"
                            numberOfLines={2}
                        >
                            {item.title}
                        </Text>

                        {/* Footer */}
                        <View className="flex-row items-center border-t border-black/5 pt-3 mt-auto">
                            <View
                                className={`w-2 h-2 rounded-full mr-2 ${isAvailableToday ? (isCompleted ? "bg-emerald-500" : "bg-blue-500") : "bg-slate-300"}`}
                            />
                            <Text className="text-slate-500 font-generalsans-medium text-xs">
                                {!isAvailableToday
                                    ? "Rest Day"
                                    : `Goal: ${getTargetText(item)}`}
                            </Text>
                            <Ionicons
                                name="chevron-forward"
                                size={14}
                                color="rgba(0,0,0,0.2)"
                                style={{ marginLeft: "auto" }}
                            />
                        </View>
                    </View>
                </View>
            </TouchableOpacity>
        </Animated.View>
    );
};

// --- COMPONENT: Day Circles ---
const DayCircles = ({
    item,
    isInactive,
}: {
    item: Resolution;
    isInactive: boolean;
}) => {
    const daysMap = [1, 2, 3, 4, 5, 6, 0];
    const dayLabels = ["M", "T", "W", "T", "F", "S", "S"];

    const isDayActive = (jsDayIndex: number, loopIndex: number) => {
        const { frequencyType, customDays, daysPerWeek } = item;
        if (frequencyType === "daily") return true;
        if (frequencyType === "weekdays") return jsDayIndex >= 1 && jsDayIndex <= 5;
        if (frequencyType === "weekends")
            return jsDayIndex === 0 || jsDayIndex === 6;
        if (frequencyType === "custom" && customDays)
            return customDays.includes(jsDayIndex);
        if (frequencyType === "x_days_per_week" && daysPerWeek)
            return loopIndex < daysPerWeek;
        return false;
    };

    return (
        <View className="flex-row items-center space-x-1 mt-3">
            {daysMap.map((jsDayIndex, loopIndex) => {
                const active = isDayActive(jsDayIndex, loopIndex);
                // Adjusted colors for glass overlap
                const activeColor = isInactive ? "rgba(0,0,0,0.2)" : "rgba(0,0,0,0.6)";

                return (
                    <Animated.View
                        key={loopIndex}
                        entering={FadeInUp.delay(loopIndex * 30)
                            .duration(DURATION_NORMAL)
                            .easing(SMOOTH_EASING)}
                        style={{
                            width: 22,
                            height: 22,
                            borderRadius: 11,
                            backgroundColor: active ? activeColor : "rgba(255,255,255,0.3)", // Lighter empty state for glass
                            alignItems: "center",
                            justifyContent: "center",
                            marginRight: 4,
                        }}
                    >
                        <Text
                            style={{
                                fontSize: 9,
                                color: active ? "#FFFFFF" : "rgba(0,0,0,0.4)",
                                fontWeight: "700",
                            }}
                        >
                            {dayLabels[loopIndex]}
                        </Text>
                    </Animated.View>
                );
            })}
        </View>
    );
};

const styles = StyleSheet.create({
    // Removed padding/bg from here as it's now handled inline for layer separation
    cardShadow: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.12,
        shadowRadius: 16,
        elevation: 6,
        marginBottom: 8,
    },
});
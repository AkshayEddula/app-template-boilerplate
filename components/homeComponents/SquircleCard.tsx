import { Ionicons } from "@expo/vector-icons";
import {
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from "react-native";
import Animated, {
    Easing,
    FadeInDown,
    LinearTransition,
} from "react-native-reanimated";

// Theme Colors
const TEXT_PRIMARY = "#1A1A1A";
const TEXT_SECONDARY = "#6B7280";
const ACCENT_ORANGE = "#F97316";

// Nice category emojis and colors
const CATEGORY_STYLES: { [key: string]: { icon: string; bg: string } } = {
    health: { icon: "💧", bg: "#E0F2FE" },
    mind: { icon: "🧘", bg: "#F3E8FF" },
    career: { icon: "💼", bg: "#EFF6FF" },
    life: { icon: "🌟", bg: "#FEF3C7" },
    fun: { icon: "🎮", bg: "#FCE7F3" },
    fitness: { icon: "🏋️", bg: "#FCE7F3" },
    mindfulness: { icon: "🧘‍♀️", bg: "#F3E8FF" },
    productivity: { icon: "🚀", bg: "#ECFDF5" },
    learning: { icon: "📖", bg: "#FEF3C7" },
    social: { icon: "💬", bg: "#FEE2E2" },
    creativity: { icon: "🎨", bg: "#FFF7ED" },
    finance: { icon: "💰", bg: "#D1FAE5" },
    sleep: { icon: "😴", bg: "#EDE9FE" },
    nutrition: { icon: "🥗", bg: "#DCFCE7" },
    hydration: { icon: "💦", bg: "#E0F2FE" },
    exercise: { icon: "🏃‍♂️", bg: "#FECACA" },
    meditation: { icon: "🧠", bg: "#F3E8FF" },
    reading: { icon: "📚", bg: "#FEF9C3" },
    writing: { icon: "✍️", bg: "#F1F5F9" },
    default: { icon: "✨", bg: "#F3F4F6" },
};

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
    currentStreak?: number;
};

const SMOOTH_EASING = Easing.bezier(0.4, 0.0, 0.2, 1);

const DAY_NAMES_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const getTargetText = (item: Resolution) => {
    if (item.trackingType === "yes_no") return null;
    if (item.trackingType === "time_based") return `${item.targetTime} min`;
    return `${item.targetCount} ${item.countUnit || ""}`;
};

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

// Get schedule text for unavailable tasks
const getScheduleText = (item: Resolution): string => {
    if (item.frequencyType === "weekdays") return "Weekdays only";
    if (item.frequencyType === "weekends") return "Weekends only";
    if (item.frequencyType === "daily") return "Daily";
    if (item.frequencyType === "custom" && item.customDays && item.customDays.length > 0) {
        const dayLabels = item.customDays
            .sort((a, b) => a - b)
            .map(d => DAY_NAMES_SHORT[d]);
        return dayLabels.join(" · ");
    }
    if (item.frequencyType === "x_days_per_week") {
        return `${item.daysPerWeek || 3}x per week`;
    }
    return "Not scheduled";
};

export const SquircleCard = ({
    item,
    index,
    onPress,
    isCompleted,
    currentFilter,
}: any) => {
    const isAvailableToday = isTaskToday(item);
    const categoryStyle = CATEGORY_STYLES[item.categoryKey?.toLowerCase()] || CATEGORY_STYLES.default;
    const targetText = getTargetText(item);
    const streak = item.currentStreak || 0;
    const scheduleText = getScheduleText(item);

    return (
        <Animated.View
            key={`${item._id}-${currentFilter}`}
            entering={FadeInDown.delay(index * 40).duration(300).easing(SMOOTH_EASING)}
            layout={LinearTransition.duration(200)}
            style={styles.wrapper}
        >
            {/* Left: Completion Status */}
            <View style={styles.statusColumn}>
                {isCompleted && isAvailableToday ? (
                    <View style={styles.completedCircle}>
                        <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                    </View>
                ) : !isAvailableToday ? (
                    <View style={styles.unavailableCircle}>
                        <Ionicons name="moon-outline" size={12} color="#9CA3AF" />
                    </View>
                ) : (
                    <View style={styles.pendingCircle} />
                )}
            </View>

            {/* Main Card */}
            <TouchableOpacity
                activeOpacity={isAvailableToday ? 0.7 : 0.9}
                onPress={onPress}
                style={[
                    styles.card,
                    !isAvailableToday && styles.cardInactive
                ]}
            >
                {/* Icon */}
                <View style={[
                    styles.iconContainer,
                    { backgroundColor: categoryStyle.bg },
                    !isAvailableToday && { opacity: 0.5 }
                ]}>
                    <Text style={{ fontSize: 22 }}>{categoryStyle.icon}</Text>
                </View>

                {/* Content */}
                <View style={styles.content}>
                    <Text
                        style={[styles.title, !isAvailableToday && styles.titleInactive]}
                        numberOfLines={1}
                    >
                        {item.title}
                    </Text>

                    {/* Show different subtitle based on availability */}
                    {isAvailableToday ? (
                        <Text style={styles.streak}>
                            {streak > 0 ? `🔥 ${streak} day streak` : "Start your streak!"}
                        </Text>
                    ) : (
                        <View style={styles.scheduleBadge}>
                            <Ionicons name="calendar-outline" size={11} color="#9CA3AF" />
                            <Text style={styles.scheduleText}>{scheduleText}</Text>
                        </View>
                    )}
                </View>

                {/* Right: Target or Inactive Badge */}
                {isAvailableToday ? (
                    targetText && (
                        <View style={styles.timeContainer}>
                            <Ionicons name="time-outline" size={16} color={TEXT_SECONDARY} />
                            <Text style={styles.timeText}>{targetText}</Text>
                        </View>
                    )
                ) : (
                    <View style={styles.restBadge}>
                        <Text style={styles.restText}>Rest day</Text>
                    </View>
                )}
            </TouchableOpacity>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    wrapper: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 14,
    },
    statusColumn: {
        width: 36,
        alignItems: "center",
    },
    completedCircle: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: ACCENT_ORANGE,
        alignItems: "center",
        justifyContent: "center",
    },
    pendingCircle: {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: "#D1D5DB",
        backgroundColor: "transparent",
    },
    unavailableCircle: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: "#F3F4F6",
        alignItems: "center",
        justifyContent: "center",
    },
    card: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#FFFFFF",
        borderRadius: 999,
        paddingVertical: 12,
        paddingHorizontal: 14,
        paddingRight: 18,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.03,
        shadowRadius: 3,
        elevation: 1,
    },
    cardInactive: {
        backgroundColor: "#FAFAFA",
        opacity: 0.75,
    },
    iconContainer: {
        width: 50,
        height: 50,
        borderRadius: 25,
        alignItems: "center",
        justifyContent: "center",
        marginRight: 14,
    },
    content: {
        flex: 1,
    },
    title: {
        fontSize: 15,
        fontFamily: "Nunito-Bold",
        color: TEXT_PRIMARY,
        marginBottom: 3,
    },
    titleInactive: {
        color: "#9CA3AF",
    },
    streak: {
        fontSize: 12,
        fontFamily: "Nunito-Medium",
        color: TEXT_SECONDARY,
    },
    scheduleBadge: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
    },
    scheduleText: {
        fontSize: 11,
        fontFamily: "Nunito-SemiBold",
        color: "#9CA3AF",
    },
    timeContainer: {
        alignItems: "center",
        paddingLeft: 14,
        borderLeftWidth: 1,
        borderLeftColor: "#F3F4F6",
    },
    timeText: {
        fontSize: 12,
        fontFamily: "Nunito-Medium",
        color: TEXT_SECONDARY,
        marginTop: 2,
    },
    restBadge: {
        backgroundColor: "#F3F4F6",
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 999,
    },
    restText: {
        fontSize: 11,
        fontFamily: "Nunito-SemiBold",
        color: "#9CA3AF",
    },
});
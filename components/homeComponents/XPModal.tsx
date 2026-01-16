import { api } from "@/convex/_generated/api";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "convex/react";
import { BlurView } from "expo-blur";
import { useMemo } from "react";
import { Dimensions, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";

// Theme Colors
const BG_COLOR = "#FAF9F6";
const TEXT_PRIMARY = "#1A1A1A";
const TEXT_SECONDARY = "#6B7280";
const ACCENT_ORANGE = "#F97316";
const SUCCESS_GREEN = "#22C55E";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

// Category Config
const CATEGORY_STYLES: Record<string, { color: string; icon: string; bg: string }> = {
    health: { color: "#10B981", icon: "💧", bg: "#ECFDF5" },
    mind: { color: "#8B5CF6", icon: "🧘", bg: "#F5F3FF" },
    career: { color: "#3B82F6", icon: "💼", bg: "#EFF6FF" },
    life: { color: "#F59E0B", icon: "🌟", bg: "#FFFBEB" },
    fun: { color: "#EC4899", icon: "🎮", bg: "#FDF2F8" },
    default: { color: ACCENT_ORANGE, icon: "✨", bg: "#FFF7ED" },
};

export const XPModal = ({ visible, onClose }: { visible: boolean; onClose: () => void }) => {
    const stats = useQuery(api.stats.getMyStats) || [];

    const totals = useMemo(() => {
        return stats.reduce(
            (acc, curr) => ({
                grandTotal: acc.grandTotal + (curr.totalXp || 0),
                todayTotal: acc.todayTotal + (curr.todayXp || 0),
            }),
            { grandTotal: 0, todayTotal: 0 }
        );
    }, [stats]);

    return (
        <Modal animationType="slide" transparent visible={visible} onRequestClose={onClose}>
            {/* Backdrop */}
            <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={onClose}>
                <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFill} />
                <View style={{ ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.4)" }} />
            </TouchableOpacity>

            {/* Sheet */}
            <Animated.View entering={FadeInDown.duration(300)} style={styles.sheet}>
                {/* Handle */}
                <View style={styles.handleContainer}>
                    <View style={styles.handle} />
                </View>

                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
                    {/* Header */}
                    <View style={styles.header}>
                        <View style={styles.trophyCircle}>
                            <Text style={{ fontSize: 40 }}>🏆</Text>
                        </View>
                        <Text style={styles.totalXp}>{totals.grandTotal.toLocaleString()}</Text>
                        <Text style={styles.totalLabel}>Total XP</Text>

                        {totals.todayTotal > 0 && (
                            <View style={styles.todayBadge}>
                                <Ionicons name="arrow-up" size={14} color={SUCCESS_GREEN} />
                                <Text style={styles.todayText}>+{totals.todayTotal} XP today</Text>
                            </View>
                        )}
                    </View>

                    {/* Categories */}
                    <View style={styles.categoriesContainer}>
                        <Text style={styles.sectionTitle}>By Category</Text>

                        {stats.map((item, index) => {
                            const config = CATEGORY_STYLES[item.categoryKey] || CATEGORY_STYLES.default;
                            const level = Math.floor(item.totalXp / 500) + 1;
                            const progressToNext = (item.totalXp % 500) / 500;

                            return (
                                <Animated.View
                                    key={item.categoryKey}
                                    entering={FadeIn.delay(index * 80)}
                                    style={styles.categoryCard}
                                >
                                    {/* Left: Icon */}
                                    <View style={[styles.categoryIcon, { backgroundColor: config.bg }]}>
                                        <Text style={{ fontSize: 24 }}>{config.icon}</Text>
                                    </View>

                                    {/* Middle: Info */}
                                    <View style={styles.categoryInfo}>
                                        <Text style={styles.categoryName}>
                                            {item.categoryKey.charAt(0).toUpperCase() + item.categoryKey.slice(1)}
                                        </Text>
                                        <Text style={styles.levelText}>Level {level}</Text>

                                        {/* Progress Bar */}
                                        <View style={styles.progressBg}>
                                            <View
                                                style={[
                                                    styles.progressFill,
                                                    { width: `${progressToNext * 100}%`, backgroundColor: config.color },
                                                ]}
                                            />
                                        </View>
                                    </View>

                                    {/* Right: XP */}
                                    <View style={styles.xpContainer}>
                                        <Text style={[styles.xpValue, { color: config.color }]}>
                                            {item.totalXp.toLocaleString()}
                                        </Text>
                                        <Text style={styles.xpLabel}>XP</Text>
                                        {item.todayXp > 0 && (
                                            <Text style={styles.todayXpText}>+{item.todayXp}</Text>
                                        )}
                                    </View>
                                </Animated.View>
                            );
                        })}
                    </View>

                    {/* Close Button */}
                    <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                        <Text style={styles.closeButtonText}>Close</Text>
                    </TouchableOpacity>
                </ScrollView>
            </Animated.View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    sheet: {
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        height: SCREEN_HEIGHT * 0.75,
        backgroundColor: BG_COLOR,
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        overflow: "hidden",
    },
    handleContainer: {
        alignItems: "center",
        paddingVertical: 12,
    },
    handle: {
        width: 40,
        height: 5,
        borderRadius: 3,
        backgroundColor: "#D1D5DB",
    },
    header: {
        alignItems: "center",
        paddingVertical: 24,
        paddingHorizontal: 20,
    },
    trophyCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: "#FEF3C7",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 16,
    },
    totalXp: {
        fontFamily: "Nunito-Bold",
        fontSize: 56,
        color: TEXT_PRIMARY,
        lineHeight: 60,
    },
    totalLabel: {
        fontFamily: "Nunito-SemiBold",
        fontSize: 16,
        color: TEXT_SECONDARY,
        marginTop: 4,
    },
    todayBadge: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        backgroundColor: "#ECFDF5",
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 999,
        marginTop: 16,
    },
    todayText: {
        fontFamily: "Nunito-Bold",
        fontSize: 14,
        color: SUCCESS_GREEN,
    },
    categoriesContainer: {
        paddingHorizontal: 20,
    },
    sectionTitle: {
        fontFamily: "Nunito-Bold",
        fontSize: 18,
        color: TEXT_PRIMARY,
        marginBottom: 16,
    },
    categoryCard: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#FFFFFF",
        borderRadius: 20,
        padding: 16,
        marginBottom: 12,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
        elevation: 2,
    },
    categoryIcon: {
        width: 56,
        height: 56,
        borderRadius: 18,
        alignItems: "center",
        justifyContent: "center",
        marginRight: 14,
    },
    categoryInfo: {
        flex: 1,
    },
    categoryName: {
        fontFamily: "Nunito-Bold",
        fontSize: 16,
        color: TEXT_PRIMARY,
    },
    levelText: {
        fontFamily: "Nunito-Medium",
        fontSize: 12,
        color: TEXT_SECONDARY,
        marginBottom: 8,
    },
    progressBg: {
        height: 6,
        backgroundColor: "#E5E7EB",
        borderRadius: 3,
        overflow: "hidden",
    },
    progressFill: {
        height: "100%",
        borderRadius: 3,
    },
    xpContainer: {
        alignItems: "flex-end",
        marginLeft: 12,
    },
    xpValue: {
        fontFamily: "Nunito-Bold",
        fontSize: 20,
    },
    xpLabel: {
        fontFamily: "Nunito-Medium",
        fontSize: 11,
        color: TEXT_SECONDARY,
        marginTop: -2,
    },
    todayXpText: {
        fontFamily: "Nunito-Bold",
        fontSize: 12,
        color: SUCCESS_GREEN,
        marginTop: 4,
    },
    closeButton: {
        marginTop: 24,
        marginHorizontal: 20,
        backgroundColor: "#F3F4F6",
        paddingVertical: 16,
        borderRadius: 999,
        alignItems: "center",
    },
    closeButtonText: {
        fontFamily: "Nunito-Bold",
        fontSize: 16,
        color: TEXT_SECONDARY,
    },
});
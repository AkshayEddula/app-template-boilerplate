import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";
import { BlurView } from "expo-blur";
import { useMemo } from "react";
import { Dimensions, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";

// Theme
const BG_COLOR = "#FAF9F6";
const TEXT_PRIMARY = "#1A1A1A";
const TEXT_SECONDARY = "#6B7280";
const ACCENT_ORANGE = "#F97316";
const SUCCESS_GREEN = "#22C55E";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

// Categories
const CATEGORIES: Record<string, { icon: string; color: string; bg: string }> = {
    health: { icon: "💧", color: "#10B981", bg: "#ECFDF5" },
    mind: { icon: "🧘", color: "#8B5CF6", bg: "#F5F3FF" },
    career: { icon: "💼", color: "#3B82F6", bg: "#EFF6FF" },
    life: { icon: "🌟", color: "#F59E0B", bg: "#FFFBEB" },
    fun: { icon: "🎮", color: "#EC4899", bg: "#FDF2F8" },
};

export const XPModal = ({ visible, onClose }: { visible: boolean; onClose: () => void }) => {
    const stats = useQuery(api.stats.getMyStats) || [];

    const totals = useMemo(() => {
        return stats.reduce(
            (acc, curr) => ({
                total: acc.total + (curr.totalXp || 0),
                today: acc.today + (curr.todayXp || 0),
            }),
            { total: 0, today: 0 }
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
                <View style={styles.handle} />

                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
                    {/* Header */}
                    <View style={styles.header}>
                        <Text style={{ fontSize: 40 }}>🏆</Text>
                        <Text style={styles.totalXp}>{totals.total.toLocaleString()}</Text>
                        <Text style={styles.label}>Total XP</Text>
                        {totals.today > 0 && (
                            <View style={styles.todayPill}>
                                <Text style={styles.todayText}>+{totals.today} today</Text>
                            </View>
                        )}
                    </View>

                    {/* Categories */}
                    <Text style={styles.sectionTitle}>By Category</Text>

                    {stats.map((item, index) => {
                        const cat = CATEGORIES[item.categoryKey] || { icon: "✨", color: ACCENT_ORANGE, bg: "#FFF7ED" };
                        const level = Math.floor(item.totalXp / 500) + 1;
                        const progress = (item.totalXp % 500) / 500;

                        return (
                            <Animated.View key={item.categoryKey} entering={FadeIn.delay(index * 50)} style={styles.row}>
                                {/* Icon */}
                                <View style={[styles.iconCircle, { backgroundColor: cat.bg }]}>
                                    <Text style={{ fontSize: 20 }}>{cat.icon}</Text>
                                </View>

                                {/* Info */}
                                <View style={styles.rowInfo}>
                                    <View style={styles.rowTop}>
                                        <Text style={styles.catName}>
                                            {item.categoryKey.charAt(0).toUpperCase() + item.categoryKey.slice(1)}
                                        </Text>
                                        <Text style={[styles.xpNum, { color: cat.color }]}>{item.totalXp}</Text>
                                    </View>

                                    {/* Progress */}
                                    <View style={styles.progressRow}>
                                        <View style={styles.progressBg}>
                                            <View style={[styles.progressFill, { width: `${progress * 100}%`, backgroundColor: cat.color }]} />
                                        </View>
                                        <Text style={styles.levelText}>Lv {level}</Text>
                                    </View>
                                </View>
                            </Animated.View>
                        );
                    })}

                    {/* Close */}
                    <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                        <Text style={styles.closeBtnText}>Close</Text>
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
        height: SCREEN_HEIGHT * 0.7,
        backgroundColor: BG_COLOR,
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
    },
    handle: {
        width: 40,
        height: 5,
        borderRadius: 999,
        backgroundColor: "#D1D5DB",
        alignSelf: "center",
        marginTop: 12,
    },
    header: {
        alignItems: "center",
        marginBottom: 28,
    },
    totalXp: {
        fontFamily: "Nunito-Bold",
        fontSize: 48,
        color: TEXT_PRIMARY,
        marginTop: 8,
    },
    label: {
        fontFamily: "Nunito-Medium",
        fontSize: 14,
        color: TEXT_SECONDARY,
    },
    todayPill: {
        backgroundColor: "#ECFDF5",
        paddingHorizontal: 14,
        paddingVertical: 6,
        borderRadius: 999,
        marginTop: 12,
    },
    todayText: {
        fontFamily: "Nunito-Bold",
        fontSize: 13,
        color: SUCCESS_GREEN,
    },
    sectionTitle: {
        fontFamily: "Nunito-Bold",
        fontSize: 16,
        color: TEXT_PRIMARY,
        marginBottom: 14,
    },
    row: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#FFFFFF",
        borderRadius: 999,
        padding: 12,
        paddingRight: 18,
        marginBottom: 10,
        gap: 12,
    },
    iconCircle: {
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: "center",
        justifyContent: "center",
    },
    rowInfo: {
        flex: 1,
    },
    rowTop: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 6,
    },
    catName: {
        fontFamily: "Nunito-Bold",
        fontSize: 15,
        color: TEXT_PRIMARY,
    },
    xpNum: {
        fontFamily: "Nunito-Bold",
        fontSize: 16,
    },
    progressRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    progressBg: {
        flex: 1,
        height: 6,
        backgroundColor: "#E5E7EB",
        borderRadius: 999,
        overflow: "hidden",
    },
    progressFill: {
        height: "100%",
        borderRadius: 999,
    },
    levelText: {
        fontFamily: "Nunito-Bold",
        fontSize: 11,
        color: TEXT_SECONDARY,
    },
    closeBtn: {
        backgroundColor: "#F3F4F6",
        paddingVertical: 16,
        borderRadius: 999,
        alignItems: "center",
        marginTop: 20,
    },
    closeBtnText: {
        fontFamily: "Nunito-Bold",
        fontSize: 15,
        color: TEXT_SECONDARY,
    },
});
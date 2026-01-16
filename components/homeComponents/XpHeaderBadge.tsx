import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";
import { useEffect, useRef, useState } from "react";
import { StyleSheet, Text, TouchableOpacity } from "react-native";
import Animated, { Easing, FadeInDown, FadeOutUp } from "react-native-reanimated";
import { XPModal } from "./XPModal";

// Theme Colors
const TEXT_PRIMARY = "#1A1A1A";
const TEXT_SECONDARY = "#6B7280";
const ACCENT_ORANGE = "#F97316";

// Category Config
const CATEGORY_STYLES: Record<string, { color: string; icon: string; bg: string }> = {
    health: { color: "#10B981", icon: "💧", bg: "#ECFDF5" },
    mind: { color: "#8B5CF6", icon: "🧘", bg: "#F5F3FF" },
    career: { color: "#3B82F6", icon: "💼", bg: "#EFF6FF" },
    life: { color: "#F59E0B", icon: "🌟", bg: "#FFFBEB" },
    fun: { color: "#EC4899", icon: "🎮", bg: "#FDF2F8" },
    default: { color: ACCENT_ORANGE, icon: "✨", bg: "#FFF7ED" },
};

export const XPHeaderBadge = () => {
    const stats = useQuery(api.stats.getMyStats) || [];
    const [currentIndex, setCurrentIndex] = useState(0);
    const [showXPModal, setShowXPModal] = useState(false);
    const previousStats = useRef<Record<string, number>>({});

    // Auto-cycle every 4 seconds
    useEffect(() => {
        if (stats.length === 0) return;
        const interval = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % stats.length);
        }, 4000);
        return () => clearInterval(interval);
    }, [stats.length]);

    // Jump to updated category on XP gain
    useEffect(() => {
        if (stats.length === 0) return;
        stats.forEach((stat, index) => {
            const prevXp = previousStats.current[stat.categoryKey] || 0;
            if (stat.totalXp > prevXp) {
                setCurrentIndex(index);
            }
            previousStats.current[stat.categoryKey] = stat.totalXp;
        });
    }, [stats]);

    const currentStat = stats[currentIndex];
    if (!currentStat) return null;

    const categoryStyle = CATEGORY_STYLES[currentStat.categoryKey] || CATEGORY_STYLES.default;
    const totalXp = stats.reduce((sum, s) => sum + (s.totalXp || 0), 0);

    // Format XP (1250 -> 1.2K)
    const formatXp = (xp: number) => {
        if (xp >= 1000) {
            return (xp / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
        }
        return xp.toString();
    };

    return (
        <>
            <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setShowXPModal(true)}
                style={styles.badge}
            >
                {/* Icon */}
                <Animated.View
                    key={currentStat.categoryKey}
                    entering={FadeInDown.duration(250).easing(Easing.out(Easing.cubic))}
                    exiting={FadeOutUp.duration(150)}
                    style={[styles.iconCircle, { backgroundColor: categoryStyle.bg }]}
                >
                    <Text style={{ fontSize: 14 }}>{categoryStyle.icon}</Text>
                </Animated.View>

                {/* XP Text */}
                <Text style={styles.xpText}>{formatXp(totalXp)}</Text>
            </TouchableOpacity>

            <XPModal visible={showXPModal} onClose={() => setShowXPModal(false)} />
        </>
    );
};

const styles = StyleSheet.create({
    badge: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#FFFFFF",
        height: 44,
        borderRadius: 22,
        paddingLeft: 5,
        paddingRight: 12,
        gap: 6,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 6,
        elevation: 2,
        borderWidth: 1.5,
        borderColor: "#F3F4F6",
    },
    iconCircle: {
        width: 34,
        height: 34,
        borderRadius: 17,
        alignItems: "center",
        justifyContent: "center",
    },
    xpText: {
        fontFamily: "Nunito-Bold",
        fontSize: 14,
        color: TEXT_PRIMARY,
    },
});
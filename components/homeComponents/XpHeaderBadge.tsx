import { api } from "@/convex/_generated/api";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "convex/react";
import { useEffect, useRef, useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import Animated, { Easing, FadeInDown, FadeOutUp, useAnimatedStyle, withTiming } from "react-native-reanimated";
// IMPORTANT: Ensure this path points to where you saved the XPModal file
import { XPModal } from "./XPModal";

// --- VISUAL CONFIGURATION ---
// Premium Pokemon-style colors for the glass badge
const CATEGORY_COLORS: Record<string, string> = {
    health: '#10B981', // Emerald
    mind: '#8B5CF6',   // Violet
    career: '#2563EB', // Blue
    life: '#D97706',   // Amber
    fun: '#DB2777',    // Pink
    default: '#475569' // Slate
};

const CATEGORY_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
    health: 'fitness',
    mind: 'book',
    career: 'briefcase',
    life: 'leaf',
    fun: 'game-controller',
};

export const XPHeaderBadge = () => {
    // 1. Fetch Stats
    const stats = useQuery(api.stats.getMyStats) || [];

    // 2. Local State
    const [currentIndex, setCurrentIndex] = useState(0);
    const [showXPModal, setShowXPModal] = useState(false);

    // 3. Ref to track previous XP (to trigger updates)
    const previousStats = useRef<Record<string, number>>({});

    // --- EFFECT: Auto-Cycle ---
    // Rotates through the available categories every 4 seconds
    useEffect(() => {
        if (stats.length === 0) return;
        const interval = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % stats.length);
        }, 4000);
        return () => clearInterval(interval);
    }, [stats.length]);

    // --- EFFECT: Live Updates ---
    // If XP increases in a specific category, jump to it immediately to show progress
    useEffect(() => {
        if (stats.length === 0) return;
        stats.forEach((stat, index) => {
            const prevXp = previousStats.current[stat.categoryKey] || 0;
            if (stat.totalXp > prevXp) {
                // Jump to the updated category
                setCurrentIndex(index);
            }
            // Update ref
            previousStats.current[stat.categoryKey] = stat.totalXp;
        });
    }, [stats]);

    // --- RENDER HELPERS ---
    const currentStat = stats[currentIndex];
    const activeCategory = currentStat ? currentStat.categoryKey : 'default';
    const activeColor = CATEGORY_COLORS[activeCategory] || CATEGORY_COLORS.default;

    // Smoothly transition the background border/tint color
    const animatedStyle = useAnimatedStyle(() => {
        return {
            backgroundColor: withTiming(activeColor, { duration: 500 })
        };
    }, [activeColor]);

    // Don't render until data loads
    if (!currentStat) return null;

    return (
        <View className="shadow-sm">
            {/* --- BADGE COMPONENT --- */}
            <Animated.View
                style={[
                    animatedStyle,
                    {
                        borderRadius: 999,
                        overflow: 'hidden',
                        borderWidth: 1,
                        borderColor: 'rgba(255, 255, 255, 0.25)', // Subtle frost border
                    }
                ]}
            >
                <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => setShowXPModal(true)}
                    className="flex-row items-center pl-1 pr-3 py-1 bg-transparent"
                >
                    {/* Animated Content Container */}
                    <Animated.View
                        // Unique key ensures React Reanimated treats this as a new element for entry/exit
                        key={currentStat.categoryKey}
                        entering={FadeInDown.duration(300).easing(Easing.out(Easing.cubic))}
                        exiting={FadeOutUp.duration(200)}
                        className="flex-row items-center gap-2"
                    >
                        {/* Icon Circle */}
                        <View className="w-7 h-7 rounded-full bg-white/20 items-center justify-center border border-white/10">
                            <Ionicons
                                name={CATEGORY_ICONS[currentStat.categoryKey] || 'star'}
                                size={14}
                                color="white"
                            />
                        </View>

                        {/* Text Details */}
                        <View>
                            <Text className="text-[9px] font-generalsans-medium text-white/90 uppercase leading-3 tracking-wide">
                                {currentStat.categoryKey}
                            </Text>
                            <Text className="text-sm font-generalsans-bold text-white leading-4">
                                {currentStat.totalXp.toLocaleString()} XP
                            </Text>
                        </View>
                    </Animated.View>
                </TouchableOpacity>
            </Animated.View>

            {/* --- THE XP MODAL --- */}
            <XPModal
                visible={showXPModal}
                onClose={() => setShowXPModal(false)}
            />
        </View>
    );
};
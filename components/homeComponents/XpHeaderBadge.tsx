import { api } from "@/convex/_generated/api";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "convex/react";
import { useEffect, useRef, useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import Animated, { Easing, FadeInDown, FadeOutUp } from "react-native-reanimated";
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
    default: '#64748B' // Slate
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

    // Don't render until data loads
    if (!currentStat) return null;

    return (
        <>
            {/* --- BADGE COMPONENT --- */}
            <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setShowXPModal(true)}
                style={{
                    backgroundColor: 'white',
                    height: 36,
                    borderRadius: 18,
                    paddingLeft: 4,
                    paddingRight: 10,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 5,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.05,
                    shadowRadius: 8,
                    elevation: 2,
                }}
            >
                {/* Animated Content Container */}
                <Animated.View
                    key={currentStat.categoryKey}
                    entering={FadeInDown.duration(300).easing(Easing.out(Easing.cubic))}
                    exiting={FadeOutUp.duration(200)}
                    className="flex-row items-center gap-1.5"
                >
                    {/* Icon Circle */}
                    <View
                        className="w-7 h-7 rounded-full items-center justify-center"
                        style={{ backgroundColor: activeColor + '15' }}
                    >
                        <Ionicons
                            name={CATEGORY_ICONS[currentStat.categoryKey] || 'star'}
                            size={13}
                            color={activeColor}
                        />
                    </View>

                    {/* Text Details */}
                    <View>
                        <Text className="text-[9px] font-inter-bold uppercase leading-3 tracking-wide" style={{ color: '#94A3B8' }}>
                            {currentStat.categoryKey}
                        </Text>
                        <Text className="text-[13px] font-inter-bold leading-4" style={{ color: '#1E293B' }}>
                            {currentStat.totalXp.toLocaleString()} XP
                        </Text>
                    </View>
                </Animated.View>
            </TouchableOpacity>

            {/* --- THE XP MODAL --- */}
            <XPModal
                visible={showXPModal}
                onClose={() => setShowXPModal(false)}
            />
        </>
    );
};
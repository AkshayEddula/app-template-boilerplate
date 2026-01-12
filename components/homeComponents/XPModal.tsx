import { PaywallModal } from "@/components/Paywall";
import { useSubscription } from "@/context/SubscriptionContext";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@clerk/clerk-expo";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "convex/react";
import { GlassView } from "expo-glass-effect";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { Modal, Platform, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Animated, { Easing, FadeInDown } from "react-native-reanimated";

// Visual Configuration
const CATEGORY_CONFIG: Record<string, { color: string, icon: string }> = {
    health: { color: '#34D399', icon: 'fitness' },
    mind: { color: '#A78BFA', icon: 'book' },
    career: { color: '#60A5FA', icon: 'briefcase' },
    life: { color: '#FBBF24', icon: 'leaf' },
    fun: { color: '#F472B6', icon: 'game-controller' },
};

export const XPModal = ({ visible, onClose }: { visible: boolean, onClose: () => void }) => {
    const stats = useQuery(api.stats.getMyStats) || [];

    const totals = useMemo(() => {
        return stats.reduce((acc, curr) => ({
            grandTotal: acc.grandTotal + (curr.totalXp || 0),
            todayTotal: acc.todayTotal + (curr.todayXp || 0)
        }), { grandTotal: 0, todayTotal: 0 });
    }, [stats]);

    const { isPremium } = useSubscription();
    const { isSignedIn } = useAuth();
    const router = useRouter();
    const [paywallVisible, setPaywallVisible] = useState(false);

    const isLocked = !isPremium || !isSignedIn;

    const handleUnlock = () => {
        if (!isPremium) {
            setPaywallVisible(true);
        } else if (!isSignedIn) {
            onClose();
            router.push('/(auth)/sign-up');
        }
    };

    const getLockedState = () => {
        if (!isPremium) {
            return {
                message: "Upgrade to Premium to view detailed value statistics.",
                buttonText: "Unlock Access"
            };
        }
        if (!isSignedIn) {
            return {
                message: "Sign in to save and view your XP progress.",
                buttonText: "Sign In / Register"
            };
        }
        return { message: "Locked", buttonText: "Unlock" };
    };

    const { message, buttonText } = getLockedState();

    return (
        <Modal animationType="slide" transparent={true} visible={visible} onRequestClose={onClose}>


            {/* 2. Main Modal Sheet */}
            <Animated.View
                entering={FadeInDown.duration(500).easing(Easing.out(Easing.cubic))}
                style={{
                    position: 'absolute',
                    bottom: 10,
                    left: 5,
                    right: 5,
                    backgroundColor: Platform.OS === 'android' ? '#3A7AFE' : 'transparent',
                    borderRadius: 44,
                    // Shadows for depth
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 20 },
                    shadowOpacity: 0.6,
                    shadowRadius: 40,
                    elevation: 25,
                }}
            >
                {/* --- GLASS BACKGROUND LAYER --- */}
                {Platform.OS === 'ios' && (
                    <GlassView
                        style={{
                            ...StyleSheet.absoluteFillObject,
                            borderRadius: 44,
                            overflow: 'hidden',
                        }}
                        glassEffectStyle="regular"
                        tintColor="#3A7AFE"
                    />
                )}



                {/* --- CONTENT --- */}
                <View className="p-8 pb-10">

                    {/* --- 1. HEADER: THE BIG NUMBER --- */}
                    <View className="items-center mt-2 mb-12">
                        <View className="flex-row items-center gap-2 mb-2 opacity-60">
                            <Ionicons name="trophy" size={12} color="white" />
                            <Text className="text-white font-generalsans-bold text-[10px] uppercase tracking-[-0.2px]">
                                Lifetime Experience
                            </Text>
                        </View>

                        <Text className="text-white font-bricolagegrotesk-bold text-[72px] leading-[90px] tracking-[-6px] text-center" style={{ paddingHorizontal: 10 }}>
                            {totals.grandTotal.toLocaleString()}
                        </Text>

                        {/* Today Stats Pill */}
                        {totals.todayTotal > 0 && (
                            <View className="mt-4 bg-emerald-500/20 px-4 py-1.5 rounded-full border border-emerald-500/30 flex-row items-center gap-2">
                                <Ionicons name="arrow-up" size={12} color="#34D399" />
                                <Text className="text-[#34D399] font-generalsans-bold text-xs uppercase tracking-tight">
                                    {totals.todayTotal} XP earned today
                                </Text>
                            </View>
                        )}
                    </View>

                    {/* --- 2. LIST: STATS & PROGRESS --- */}
                    <View className="gap-7">
                        {stats.map((item, index) => {
                            const config = CATEGORY_CONFIG[item.categoryKey] || { color: '#94A3B8', icon: 'ellipse' };

                            // Calculate Level (Every 1000 XP is a level)
                            const level = Math.floor(item.totalXp / 1000) + 1;
                            const progressToNextLevel = (item.totalXp % 1000) / 1000; // 0.0 to 1.0

                            return (
                                <Animated.View
                                    key={item.categoryKey}
                                    entering={FadeInDown.delay(index * 50 + 100).duration(500)}
                                >
                                    {/* Top Row: Info */}
                                    <View className="flex-row items-center justify-between mb-2">
                                        <View className="flex-row items-center gap-3">
                                            {/* Icon */}
                                            <View
                                                style={{ backgroundColor: config.color }}
                                                className="w-8 h-8 rounded-full items-center justify-center shadow-lg shadow-black/20"
                                            >
                                                <Ionicons name={config.icon as any} size={14} color="white" />
                                            </View>

                                            {/* Text */}
                                            <View>
                                                <Text className="text-white font-generalsans-bold text-lg capitalize tracking-tighter leading-5">
                                                    {item.categoryKey}
                                                </Text>
                                                <Text className="text-white/50 text-[10px] font-generalsans-medium uppercase tracking-tighter">
                                                    Level {level}
                                                </Text>
                                            </View>
                                        </View>

                                        {/* Right: XP */}
                                        <View className="items-end">
                                            <Text className="text-white font-bricolagegrotesk-bold text-lg tracking-[-1px]">
                                                {item.totalXp.toLocaleString()}
                                            </Text>
                                            {item.todayXp > 0 && (
                                                <Text className="text-emerald-400 text-[10px] font-bricolagegrotesk-bold">
                                                    +{item.todayXp}
                                                </Text>
                                            )}
                                        </View>
                                    </View>

                                    {/* Bottom Row: Progress Bar */}
                                    <View className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                                        <View
                                            style={{
                                                width: `${progressToNextLevel * 100}%`,
                                                backgroundColor: config.color,
                                                shadowColor: config.color,
                                                shadowOpacity: 0.5,
                                                shadowRadius: 4,
                                                shadowOffset: { width: 0, height: 0 }
                                            }}
                                            className="h-full rounded-full"
                                        />
                                    </View>
                                </Animated.View>
                            );
                        })}
                    </View>

                    {/* --- 3. FOOTER BUTTON --- */}
                    <TouchableOpacity
                        onPress={onClose}
                        activeOpacity={0.8}
                        className="mt-10 self-center z-50"
                    >
                        <View className="w-12 h-12 rounded-full bg-white/10 border border-white/10 items-center justify-center">
                            <Ionicons name="close" size={20} color="white" />
                        </View>
                    </TouchableOpacity>

                </View>
            </Animated.View>

            <PaywallModal
                visible={paywallVisible}
                onClose={() => setPaywallVisible(false)}
            />
        </Modal>
    );
};
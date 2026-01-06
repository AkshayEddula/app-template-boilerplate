import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    Platform,
    StyleSheet,
    Text,
    useWindowDimensions,
    View,
    ViewToken
} from "react-native";
import {
    Gesture,
    GestureDetector,
    GestureHandlerRootView,
} from "react-native-gesture-handler";
import Animated, {
    Easing,
    Extrapolation,
    FadeIn,
    FadeInDown,
    FadeInUp,
    FadeOut,
    interpolate,
    LinearTransition,
    runOnJS,
    SharedValue,
    useAnimatedScrollHandler,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withTiming
} from "react-native-reanimated";

// --- CONSTANTS ---

const CATEGORY_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
    health: "heart",
    mind: "prism",
    career: "briefcase",
    life: "compass",
    fun: "sparkles",
};

const CATEGORY_COLORS: Record<string, string> = {
    health: "#10B981",
    mind: "#8B5CF6",
    career: "#3B82F6",
    life: "#F59E0B",
    fun: "#EC4899",
    default: "#94A3B8",
};

// --- COMPONENTS ---

// 1. CHARACTER CARD (Slide 1 - Unchanged)
const CharacterCard = ({
    categoryKey,
    imageUrl,
    xp,
}: {
    categoryKey: string;
    imageUrl: string;
    xp: number;
}) => {
    const [isLoading, setIsLoading] = useState(true);
    const color = CATEGORY_COLORS[categoryKey] || CATEGORY_COLORS.default;
    const progressPercent = 65;

    return (
        <View className="flex-1 w-full h-full relative">
            <Image
                source={{ uri: imageUrl }}
                style={{ position: 'absolute', width: "100%", height: "100%" }}
                contentFit="cover"
                transition={500}
                onLoadStart={() => setIsLoading(true)}
                onLoad={() => setIsLoading(false)}
            />
            {isLoading && (
                <View className="absolute inset-0 items-center justify-center bg-zinc-900 z-10">
                    <ActivityIndicator size="small" color={color} />
                </View>
            )}
            <LinearGradient
                colors={["rgba(0,0,0,0.1)", "rgba(0,0,0,0.3)", "rgba(0,0,0,0.8)", "rgba(0,0,0,0.95)"]}
                locations={[0, 0.4, 0.75, 1]}
                style={{ position: "absolute", width: "100%", height: "100%", zIndex: 20 }}
            />
            <View className="flex-1 z-30 p-8 justify-between">
                <View className="flex-row justify-between items-start pt-2">
                    <View className="flex-row items-center px-3 py-1.5 rounded-full border border-white/20 bg-black/40 backdrop-blur-md self-start">
                        <Ionicons name={CATEGORY_ICONS[categoryKey]} size={12} color={color} />
                        <Text className="text-white text-[10px] font-generalsans-bold uppercase ml-1.5 tracking-wider">
                            {categoryKey}
                        </Text>
                    </View>
                    <View className="bg-white/20 px-2 py-1 rounded-md border border-white/10">
                        <Text className="text-white text-[10px] font-generalsans-bold">LVL 4</Text>
                    </View>
                </View>
                <View>
                    <Text className="text-[11px] font-generalsans-bold uppercase tracking-widest mb-1 opacity-90" style={{ color: color }}>
                        The Vitality Keeper
                    </Text>
                    <Text className="text-white text-[40px] font-generalsans-bold tracking-[-1px] mb-2 leading-tight shadow-black shadow-lg">
                        Vita
                    </Text>
                    <Text className="text-slate-200 text-[13px] leading-5 font-generalsans-medium opacity-90 mb-6 shadow-black shadow-md">
                        Born from the first heartbeat. Vita thrives when you move. Action makes her burn bright.
                    </Text>
                    <View className="flex-row items-end justify-between mb-2">
                        <View>
                            <View className="flex-row items-baseline">
                                <Text className="text-white text-2xl font-generalsans-bold tracking-tighter shadow-black shadow-sm">
                                    {xp}
                                </Text>
                                <Text className="text-slate-400 text-[10px] ml-1 font-generalsans-bold uppercase shadow-black shadow-sm">
                                    / 2500 XP
                                </Text>
                            </View>
                        </View>
                    </View>
                    <View className="h-2 w-full bg-slate-800/80 rounded-full overflow-hidden border border-white/10">
                        <View
                            className="h-full rounded-full shadow-[0_0_10px_rgba(255,255,255,0.5)]"
                            style={{ width: `${progressPercent}%`, backgroundColor: color }}
                        />
                    </View>
                </View>
            </View>
        </View>
    );
};

// --- ANIMATION HELPERS ---

// Updated Breathing Flame for Light Mode
const BreathingFlame = ({ color }: { color: string }) => {
    const sv = useSharedValue(1);

    useEffect(() => {
        sv.value = withRepeat(
            withTiming(1.15, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
            -1,
            true
        );
    }, []);

    const rStyle = useAnimatedStyle(() => ({
        transform: [{ scale: sv.value }],
    }));

    return (
        <View className="items-center justify-center">
            {/* Outer soft glow - Visible on white */}
            <Animated.View
                style={[rStyle, { backgroundColor: "#fed7aa" }]}
                className="absolute w-56 h-56 rounded-full blur-3xl opacity-30"
            />
            {/* Inner intense glow */}
            <Animated.View
                style={[rStyle, { backgroundColor: "#fdba74" }]}
                className="absolute w-36 h-36 rounded-full blur-2xl opacity-40"
            />
            {/* The Icon */}
            <MaterialCommunityIcons name="fire" size={140} color={color} style={{ shadowColor: '#ea580c', shadowOpacity: 0.3, shadowRadius: 15, shadowOffset: { width: 0, height: 10 } }} />
        </View>
    );
};

// Pulse Circle
const PulseCircle = ({ color, size }: { color: string, size: number }) => {
    const sv = useSharedValue(0.8);
    const op = useSharedValue(0.5);

    useEffect(() => {
        sv.value = withRepeat(withTiming(1.2, { duration: 1500 }), -1, true);
        op.value = withRepeat(withTiming(0.2, { duration: 1500 }), -1, true);
    }, []);

    const rStyle = useAnimatedStyle(() => ({ transform: [{ scale: sv.value }], opacity: op.value }));

    return (
        <Animated.View
            style={[rStyle, { width: size, height: size, borderColor: color }]}
            className="absolute border-2 rounded-full"
        />
    );
};


// --- CARD CONTENT SWITCHER ---

const CardContent = ({ id, themeColor }: { id: string, themeColor: string }) => {

    // --- Slide 1: Character ---
    if (id === "1") {
        return (
            <CharacterCard
                categoryKey="health"
                imageUrl="https://i.pinimg.com/736x/2a/23/96/2a2396b47eb0b141f8d80accfb64fab6.jpg"
                xp={1250}
            />
        );
    }

    // --- Slide 2: "The Rank Up" ---
    if (id === "2") {
        return (
            <View className="flex-1 w-full justify-between px-6 py-10 relative overflow-hidden">
                <View className="absolute top-10 -right-10 w-48 h-48 bg-pink-500/20 rounded-full blur-3xl" />

                {/* Top */}
                <View className="items-center z-10">
                    <View className="relative">
                        <PulseCircle color={themeColor} size={90} />
                        <View className="w-20 h-20 rounded-[24px] items-center justify-center border border-white/60 bg-white/30 backdrop-blur-xl shadow-xl shadow-pink-500/10">
                            <MaterialCommunityIcons name="crown" size={36} color={themeColor} />
                            <View className="absolute -top-2 -right-2 bg-slate-900 rounded-full p-1 border-2 border-white">
                                <Feather name="lock" size={10} color="white" />
                            </View>
                        </View>
                        <View className="absolute -bottom-6 items-center w-32">
                            <Text className="text-slate-800 text-[10px] font-generalsans-bold uppercase tracking-widest text-center">Rank V</Text>
                            <Text className="text-slate-500 text-[9px] font-generalsans-medium">Ascended Master</Text>
                        </View>
                    </View>
                </View>

                {/* Middle */}
                <View className="flex-1 items-center justify-center relative my-4">
                    <View className="h-full w-1.5 bg-slate-200/50 rounded-full overflow-hidden relative">
                        <Animated.View
                            entering={FadeInDown.delay(500).duration(2000)}
                            style={{ height: '75%', width: '100%' }}
                        >
                            <LinearGradient
                                colors={[themeColor, '#ec4899']}
                                style={{ flex: 1 }}
                            />
                        </Animated.View>
                    </View>

                    <View className="absolute bg-white px-4 py-2 rounded-xl shadow-sm border border-slate-100 flex-row items-center gap-2 transform translate-x-8">
                        <View className="bg-pink-100 p-1 rounded-md">
                            <MaterialCommunityIcons name="arrow-up-bold" size={12} color={themeColor} />
                        </View>
                        <View>
                            <Text className="text-slate-900 text-[10px] font-generalsans-bold">150 XP to Level 5</Text>
                            <Text className="text-slate-400 text-[8px] font-generalsans-medium">Keep going!</Text>
                        </View>
                    </View>
                </View>

                {/* Bottom */}
                <View className="flex-row items-center bg-white p-4 rounded-3xl shadow-lg shadow-slate-200/50 border border-slate-100 z-10">
                    <Image
                        source={{ uri: "https://i.pinimg.com/736x/2a/23/96/2a2396b47eb0b141f8d80accfb64fab6.jpg" }}
                        style={{ width: 52, height: 52, borderRadius: 18 }}
                        contentFit="cover"
                    />
                    <View className="ml-4 flex-1">
                        <View className="flex-row justify-between items-center mb-1">
                            <Text className="text-slate-900 text-sm font-generalsans-bold">You (Level 4)</Text>
                            <Text className="text-slate-400 text-[10px] font-generalsans-bold">75%</Text>
                        </View>
                        <View className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                            <LinearGradient
                                colors={[themeColor, '#db2777']}
                                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                                style={{ width: '75%', height: '100%' }}
                            />
                        </View>
                    </View>
                </View>
            </View>
        );
    }

    // --- Slide 3: "The Streak" (LIGHT MODE REMASTERED) ---
    if (id === "3") {
        return (
            <View className="flex-1 w-full justify-between items-center px-6 py-8 relative">

                {/* Background Decoration (Subtle Warmth) */}
                <View className="absolute top-0 w-full h-1/2 bg-gradient-to-b from-orange-50 to-transparent opacity-50" />
                <View className="absolute -bottom-10 -left-10 w-48 h-48 bg-orange-100 rounded-full blur-3xl opacity-60" />

                {/* Top Badge */}
                <View className="w-full flex-row justify-between items-center mt-2 z-10">
                    <View className="bg-orange-50 px-3 py-1.5 rounded-full border border-orange-100 shadow-sm">
                        <Text className="text-orange-600 text-[10px] font-generalsans-bold uppercase tracking-wider">Current Streak</Text>
                    </View>
                    <View className="bg-white p-1.5 rounded-full shadow-sm">
                        <MaterialCommunityIcons name="dots-horizontal" size={16} color="#94a3b8" />
                    </View>
                </View>

                {/* MAIN: Breathing Flame (Light Mode) */}
                <View className="flex-1 items-center justify-center z-10">
                    <BreathingFlame color="#f97316" />

                    <View className="items-center mt-6">
                        <Text className="text-slate-900 text-[64px] font-generalsans-bold leading-tight tracking-tight">12</Text>
                        <Text className="text-orange-400 text-lg font-generalsans-bold tracking-[4px] uppercase -mt-1">Days</Text>
                    </View>
                </View>

                {/* BOTTOM: Premium Multiplier Card (White) */}
                <View className="w-full">
                    <View className="bg-white border border-orange-100 p-4 rounded-2xl flex-row items-center gap-4 shadow-xl shadow-orange-500/10">
                        {/* 2x Icon */}
                        <View className="w-12 h-12 rounded-xl bg-orange-500 items-center justify-center shadow-lg shadow-orange-500/30">
                            <Text className="text-white font-generalsans-bold text-sm">2x</Text>
                        </View>
                        <View className="flex-1">
                            <Text className="text-slate-900 font-generalsans-bold text-sm">Multiplier Active</Text>
                            <Text className="text-slate-500 text-[11px] font-generalsans-medium leading-4 mt-0.5">
                                You are earning double XP. Don't let the flame go out!
                            </Text>
                        </View>
                    </View>
                </View>
            </View>
        );
    }
    return null;
};

// --- DATA TYPES & SLIDES ---

type Slide = {
    id: string;
    tag: string;
    title: string;
    description: string;
    cardColors: readonly [string, string, ...string[]];
    themeColor: string;
};

const SLIDES: Slide[] = [
    {
        id: "1",
        tag: "Identity Shifting",
        title: "Gamify Your\n2026 Growth",
        description: "Don't just track habits. Feed your Avatars. Every workout strengthens Vita. Every book levels up Aeris.",
        cardColors: ["#000000", "#111827"],
        themeColor: "#4f46e5",
    },
    {
        id: "2",
        tag: "Visual Rewards",
        title: "Addictive\nProgression",
        description: "Watch your characters physically evolve from a Seed to an Ascended Master. See the change you become.",
        cardColors: ["#ffedea", "#fce7f3"],
        themeColor: "#db2777",
    },
    {
        id: "3",
        tag: "Loss Aversion",
        title: "Keep The\nFire Alive",
        description: "Consistency builds multipliers. Hit a 7-day streak to unlock 2x XP gain for all your characters.",
        // UPDATED: Light Mode Colors for Slide 3
        cardColors: ["#ffffff", "#fff7ed"],
        themeColor: "#f97316",
    },
];

// --- PARENT CARD COMPONENT ---

const ParallaxCard = ({ item, index, scrollX, width }: { item: Slide, index: number, scrollX: SharedValue<number>, width: number }) => {
    const rStyle = useAnimatedStyle(() => {
        const inputRange = [(index - 1) * width, index * width, (index + 1) * width];
        const scale = interpolate(scrollX.value, inputRange, [0.85, 1, 0.85], Extrapolation.CLAMP);
        const rotateZ = interpolate(scrollX.value, inputRange, [5, 0, -5], Extrapolation.CLAMP);
        const opacity = interpolate(scrollX.value, inputRange, [0.7, 1, 0.7], Extrapolation.CLAMP);
        return {
            transform: [{ scale }, { rotateZ: `${rotateZ}deg` }],
            opacity,
        };
    });

    return (
        <Animated.View
            style={[rStyle]}
            className={`w-full aspect-[3.8/5] rounded-[48px] overflow-hidden relative shadow-3xl shadow-blue-900/30 ${Platform.OS === "android" ? "elevation-10" : ""}`}
        >
            <LinearGradient colors={item.cardColors} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />

            {/* Overlay for non-image slides to give depth */}
            {item.id !== "1" && (
                <View className="absolute inset-0 bg-white/5" style={{ mixBlendMode: 'overlay' }} />
            )}

            {/* Content Container */}
            <View className="absolute inset-0">
                <CardContent id={item.id} themeColor={item.themeColor} />
            </View>
        </Animated.View>
    );
};

// --- TEXT & PAGINATION ---

const SlideText = ({ item }: { item: Slide }) => {
    return (
        <View className="items-start justify-start mt-8 px-2">
            <Animated.View entering={FadeInDown.delay(300).springify()}>
                <View className="flex-row items-center gap-2 mb-3 bg-white/10 self-start px-3 py-1.5 rounded-lg border border-white/20 backdrop-blur-md">
                    <Text className="text-blue-100 text-[10px] font-generalsans-semibold uppercase tracking-[2px]">
                        {item.tag}
                    </Text>
                </View>
            </Animated.View>
            <Animated.Text
                entering={FadeInDown.delay(400).duration(800)}
                className="text-white text-[42px] font-generalsans-semibold leading-[1.05] tracking-[-1px] mb-3"
            >
                {item.title}
            </Animated.Text>
            <Animated.Text
                entering={FadeInDown.delay(500).duration(800)}
                className="text-blue-100 text-[17px] font-generalsans-medium leading-[26px]"
            >
                {item.description}
            </Animated.Text>
        </View>
    );
};

const Paginator = ({ data, scrollX, width }: { data: Slide[], scrollX: SharedValue<number>, width: number }) => {
    return (
        <View className="flex-row gap-2.5 h-14 items-center">
            {data.map((_, i) => {
                const rDotStyle = useAnimatedStyle(() => {
                    const inputRange = [(i - 1) * width, i * width, (i + 1) * width];
                    const dotWidth = interpolate(scrollX.value, inputRange, [8, 32, 8], Extrapolation.CLAMP);
                    return { width: dotWidth };
                });
                const rColorStyle = useAnimatedStyle(() => {
                    const inputRange = [(i - 1) * width, i * width, (i + 1) * width];
                    const opacity = interpolate(scrollX.value, inputRange, [0.4, 1, 0.4], Extrapolation.CLAMP);
                    return { opacity };
                });
                return (
                    <Animated.View
                        key={i}
                        style={[rDotStyle, rColorStyle]}
                        className="h-2 rounded-full bg-white"
                    />
                );
            })}
        </View>
    );
};

// --- MAIN SCREEN ---

export default function OnboardingScreen() {
    const { width } = useWindowDimensions();
    const router = useRouter();
    const [currentIndex, setCurrentIndex] = useState(0);
    const slidesRef = useRef<FlatList>(null);
    const scrollX = useSharedValue(0);

    const scrollHandler = useAnimatedScrollHandler((event) => {
        scrollX.value = event.contentOffset.x;
    });

    const viewabilityConfig = useRef({
        itemVisiblePercentThreshold: 50,
        minimumViewTime: 0,
    }).current;

    const onViewableItemsChanged = useCallback(
        ({ viewableItems }: { viewableItems: ViewToken[] }) => {
            if (viewableItems[0] && viewableItems[0].index !== null) {
                setCurrentIndex(viewableItems[0].index);
            }
        },
        []
    );

    const handleNextJS = () => {
        if (currentIndex < SLIDES.length - 1) {
            slidesRef.current?.scrollToIndex({ index: currentIndex + 1 });
        } else {
            router.push("/(auth)/sign-up");
        }
    };

    const tapGesture = Gesture.Tap()
        .maxDuration(250)
        .onEnd(() => {
            runOnJS(handleNextJS)();
        });

    const isLastSlide = currentIndex === SLIDES.length - 1;

    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <View className="flex-1 bg-[#3A7AFE]">
                <StatusBar style="light" />
                <View style={StyleSheet.absoluteFill}>
                    <LinearGradient
                        colors={["#0B0F1A", "#1e3a8a", "#3A7AFE"]}
                        locations={[0, 0.3, 1]}
                        style={{ flex: 1 }}
                    />
                </View>

                <Animated.FlatList
                    ref={slidesRef}
                    data={SLIDES}
                    renderItem={({ item, index }) => (
                        <View
                            style={{ width }}
                            className="h-full px-8 pt-[10%] pb-24 justify-start"
                        >
                            <View className="w-full items-center mb-6">
                                <ParallaxCard
                                    item={item}
                                    index={index}
                                    scrollX={scrollX}
                                    width={width}
                                />
                            </View>
                            <SlideText item={item} />
                        </View>
                    )}
                    horizontal
                    pagingEnabled
                    showsHorizontalScrollIndicator={false}
                    bounces={false}
                    onScroll={scrollHandler}
                    scrollEventThrottle={16}
                    onViewableItemsChanged={onViewableItemsChanged}
                    viewabilityConfig={viewabilityConfig}
                    keyExtractor={(item) => item.id}
                    className="flex-1"
                />

                <View className="h-36 justify-end z-20">
                    <Animated.View
                        entering={FadeInUp.delay(600).springify()}
                        className="px-8 pb-10 flex-row items-center justify-between"
                    >
                        <Paginator data={SLIDES} scrollX={scrollX} width={width} />

                        <GestureDetector gesture={tapGesture}>
                            <Animated.View
                                layout={LinearTransition.duration(250).easing(
                                    Easing.out(Easing.quad)
                                )}
                                className="h-14 px-4 bg-white rounded-[16px] flex-row items-center justify-center gap-2 shadow-xl shadow-blue-900/30"
                            >
                                {isLastSlide ? (
                                    <Animated.Text
                                        key="finish"
                                        entering={FadeIn.duration(200)}
                                        exiting={FadeOut.duration(200)}
                                        className="text-[#3A7AFE] font-generalsans-medium text-[17px] tracking-tight"
                                    >
                                        Start Journey
                                    </Animated.Text>
                                ) : (
                                    <Animated.Text
                                        key="next"
                                        entering={FadeIn.duration(200)}
                                        exiting={FadeOut.duration(200)}
                                        className="text-[#3A7AFE] font-generalsans-medium text-[17px] tracking-tight"
                                    >
                                        Next
                                    </Animated.Text>
                                )}
                                <Feather name="arrow-right" size={18} color="#3A7AFE" />
                            </Animated.View>
                        </GestureDetector>
                    </Animated.View>
                </View>
            </View>
        </GestureHandlerRootView>
    );
}
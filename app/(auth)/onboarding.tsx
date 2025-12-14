import {
    ArrowRight02Icon,
    StarIcon
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React from "react";
import { Dimensions, Pressable, StatusBar, StyleSheet, Text, View } from "react-native";
import Animated, {
    Easing,
    Extrapolation,
    FadeInDown,
    interpolate,
    interpolateColor,
    SharedValue,
    useAnimatedScrollHandler,
    useAnimatedStyle,
    useSharedValue,
    withSpring
} from "react-native-reanimated";

// --- DIMENSIONS ---
const { width, height } = Dimensions.get("window");
const IS_SMALL_SCREEN = height <= 750;
const IS_LARGE_SCREEN = width > 700;
const BOTTOM_CONTROL_HEIGHT = 130;

interface Slide {
    key: string;
    type: 'reels' | 'community' | 'gamification';
    title: string;
    subtitle: string;
    bgColor: string;
    textColor: string;
    subTextColor: string;
    accentColor: string;
    arrowColor: string;
}

const slides: Slide[] = [
    {
        key: "1",
        type: "reels",
        title: "The Word.\nIn Motion.",
        subtitle: "Experience scripture like never before with immersive, cinematic Verse Reels.",
        bgColor: "#09090b", // Deep Black
        textColor: "#FFFFFF",
        subTextColor: "#a1a1aa",
        accentColor: "#FFFFFF",
        arrowColor: "#000000",
    },
    {
        key: "2",
        type: "community",
        title: "Prayers.\nTogether.",
        subtitle: "Share requests and react with prayer hands. Join a community that lifts you up.",
        bgColor: "#ffffff", // Clean White
        textColor: "#09090b",
        subTextColor: "#52525b",
        accentColor: "#09090b",
        arrowColor: "#FFFFFF",
    },
    {
        key: "3",
        type: "gamification",
        title: "Level Up\nYour Faith.",
        subtitle: "Build a daily streak, earn XP, and unlock exclusive badges on your journey.",
        bgColor: "#f8fafc", // Slate 50
        textColor: "#09090b",
        subTextColor: "#475569",
        accentColor: "#F59E0B", // Gold/Amber
        arrowColor: "#FFFFFF",
    },
];

// --- VISUAL COMPONENTS ---

interface SlideContentProps {
    slide: Slide;
    index: number;
    translateX: SharedValue<number>;
}

const SlideContent: React.FC<SlideContentProps> = ({ slide, index, translateX }) => {
    const animatedStyle = useAnimatedStyle(() => {
        const inputRange = [(index - 1) * width, index * width, (index + 1) * width];

        const scale = interpolate(
            translateX.value,
            inputRange,
            IS_SMALL_SCREEN ? [0.75, 0.9, 0.75] : [0.8, 1, 0.8],
            Extrapolation.CLAMP
        );

        const opacity = interpolate(
            translateX.value,
            inputRange,
            [0, 1, 0],
            Extrapolation.CLAMP
        );

        const translateY = interpolate(
            translateX.value,
            inputRange,
            [50, 0, 50],
            Extrapolation.CLAMP
        );

        return {
            transform: [{ scale }, { translateY }],
            opacity,
        };
    });

    return (
        <Animated.View style={[styles.slideInner, animatedStyle]}>
            <View className="items-center justify-center flex-1 w-full pt-10">
                <View
                    className={`${IS_LARGE_SCREEN ? 'w-[340px] h-[580px]' : 'w-[260px] h-[440px]'} rounded-[32px] overflow-hidden relative shadow-2xl shadow-indigo-500/20 border-2 border-gray-100 bg-white items-center justify-center`}
                >
                    <View className="w-20 h-20 rounded-full bg-gray-50 items-center justify-center mb-4">
                        <HugeiconsIcon icon={StarIcon} size={40} color="#D1D5DB" variant="solid" />
                    </View>
                    <Text className="text-gray-400 font-lexend-medium text-sm">Template Content</Text>
                </View>
            </View>
        </Animated.View>
    );
};

// --- MAIN COMPONENT ---

export default function LumiOnboarding() {
    const router = useRouter();
    const translateX = useSharedValue(0);
    const scrollRef = React.useRef<Animated.ScrollView>(null);
    const [activeSlide, setActiveSlide] = React.useState(0);

    const scrollHandler = useAnimatedScrollHandler((event) => {
        translateX.value = event.contentOffset.x;
    });

    const onMomentumScrollEnd = (e: any) => {
        const index = Math.round(e.nativeEvent.contentOffset.x / width);
        setActiveSlide(index);
    };

    const handleNext = () => {
        Haptics.selectionAsync();
        if (activeSlide < slides.length - 1) {
            scrollRef.current?.scrollTo({ x: width * (activeSlide + 1), animated: true });
        } else {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            router.push("/(auth)/sign-up");
        }
    };

    // --- ANIMATED STYLES ---

    const bgStyle = useAnimatedStyle(() => {
        return {
            backgroundColor: interpolateColor(
                translateX.value,
                slides.map((_, i) => i * width),
                slides.map((s) => s.bgColor)
            )
        };
    });

    const buttonStyle = useAnimatedStyle(() => {
        return {
            backgroundColor: interpolateColor(
                translateX.value,
                slides.map((_, i) => i * width),
                slides.map((s) => s.accentColor)
            ),
            transform: [{ scale: withSpring(1) }]
        };
    });

    return (
        <Animated.View style={[{ flex: 1 }, bgStyle]}>
            <StatusBar
                barStyle={activeSlide === 0 ? "light-content" : "dark-content"}
                translucent
                backgroundColor="transparent"
            />

            {/* --- SKIP BUTTON --- */}
            <View className="absolute top-14 right-6 z-50">
                <Pressable onPress={() => router.push("/(auth)/sign-up")} hitSlop={20}>
                    <View
                        className={`px-4 py-2 rounded-full border ${activeSlide === 0 ? 'border-white/20 bg-white/10' : 'border-black/5 bg-black/5'}`}
                        style={IS_LARGE_SCREEN ? { transform: [{ scale: 1.2 }] } : {}}
                    >
                        <Text className={`font-lexend-medium text-[13px] ${activeSlide === 0 ? 'text-white' : 'text-gray-900'}`}>
                            Skip
                        </Text>
                    </View>
                </Pressable>
            </View>

            {/* --- SCROLLVIEW --- */}
            <Animated.ScrollView
                ref={scrollRef}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onScroll={scrollHandler}
                scrollEventThrottle={16}
                onMomentumScrollEnd={onMomentumScrollEnd}
                bounces={false}
            >
                {slides.map((slide, index) => {

                    const textOpacityStyle = useAnimatedStyle(() => {
                        const opacity = interpolate(
                            translateX.value,
                            [(index - 1) * width, index * width, (index + 1) * width],
                            [0, 1, 0],
                            Extrapolation.CLAMP
                        );
                        return { opacity };
                    });

                    return (
                        <View key={slide.key} style={{ width, height }}>

                            {/* 1. VISUAL AREA (Top ~60%) */}
                            <View style={{ flex: 6, paddingBottom: 20 }}>
                                <SlideContent slide={slide} index={index} translateX={translateX} />
                            </View>

                            {/* 2. TEXT AREA (Bottom) */}
                            <Animated.View
                                entering={FadeInDown.delay(300).duration(800).easing(Easing.out(Easing.cubic))}
                                style={[{ flex: 3, paddingHorizontal: 32, paddingBottom: BOTTOM_CONTROL_HEIGHT }, textOpacityStyle]}
                                className="justify-start pt-4 self-center w-full max-w-[600px]"
                            >
                                <Text
                                    className="font-lexend-medium mb-4"
                                    style={{
                                        fontSize: IS_SMALL_SCREEN ? 32 : (IS_LARGE_SCREEN ? 64 : 46),
                                        color: slide.textColor,
                                        letterSpacing: IS_SMALL_SCREEN ? -1.5 : (IS_LARGE_SCREEN ? -3 : -2.5),
                                        lineHeight: IS_SMALL_SCREEN ? 38 : (IS_LARGE_SCREEN ? 70 : 52)
                                    }}
                                >
                                    {slide.title}
                                </Text>

                                <Text
                                    className="font-lexend tracking-tight leading-8"
                                    style={{
                                        color: slide.subTextColor,
                                        maxWidth: '95%',
                                        fontSize: IS_SMALL_SCREEN ? 15 : (IS_LARGE_SCREEN ? 22 : 17),
                                        lineHeight: IS_LARGE_SCREEN ? 34 : undefined,
                                    }}
                                >
                                    {slide.subtitle}
                                </Text>
                            </Animated.View>
                        </View>
                    );
                })}
            </Animated.ScrollView>

            {/* --- BOTTOM CONTROLS --- */}
            <View
                className="absolute bottom-0 left-0 w-full px-8 flex-row items-center justify-between"
                style={{ height: BOTTOM_CONTROL_HEIGHT, paddingBottom: 30 }}
            >
                {/* Pagination Indicators */}
                <View className="flex-row gap-3 h-full pt-10">
                    {slides.map((_, i) => {
                        const dotStyle = useAnimatedStyle(() => {
                            const widthVal = interpolate(
                                translateX.value,
                                [(i - 1) * width, i * width, (i + 1) * width],
                                [8, 32, 8],
                                Extrapolation.CLAMP
                            );

                            const color = interpolateColor(
                                translateX.value,
                                [0, width],
                                ["#ffffff", "#18181b"]
                            );

                            const opacity = interpolate(translateX.value, [(i - 1) * width, i * width, (i + 1) * width], [0.3, 1, 0.3]);

                            return { width: widthVal, backgroundColor: color, opacity };
                        });
                        return <Animated.View key={i} className="h-1.5 rounded-full" style={dotStyle} />;
                    })}
                </View>

                {/* Next Button FAB */}
                <Pressable onPress={handleNext}>
                    <Animated.View
                        className="h-20 w-20 rounded-full items-center justify-center shadow-lg"
                        style={buttonStyle}
                    >
                        <HugeiconsIcon
                            icon={ArrowRight02Icon}
                            size={32}
                            color={slides[activeSlide].arrowColor}
                            strokeWidth={2.5}
                            pointerEvents="none"
                        />
                    </Animated.View>
                </Pressable>
            </View>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    slideInner: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
    },
});
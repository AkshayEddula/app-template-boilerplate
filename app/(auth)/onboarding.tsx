import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useCallback, useRef, useState } from "react";
import {
    FlatList,
    Platform,
    StyleSheet,
    Text,
    useWindowDimensions,
    View,
    ViewToken,
} from "react-native";
import { Gesture, GestureDetector, GestureHandlerRootView } from "react-native-gesture-handler";
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
    useSharedValue
} from "react-native-reanimated";

// --- Types ---
type Slide = {
    id: string;
    tag: string;
    title: string;
    description: string;
    cardColors: readonly [string, string, ...string[]];
};

const SLIDES: Slide[] = [
    {
        id: "1",
        tag: "Visualise Growth",
        title: "Turn resolutions\ninto reality",
        description: "Build habits that stick. Watch your progress compound.",
        cardColors: ['#ffffff', '#f8fafc'],
    },
    {
        id: "2",
        tag: "Gamify Your Life",
        title: "Complete goals.\nLevel Up.",
        description: "Treat life like an RPG. Gain XP for every task.",
        cardColors: ['#ffffff', '#f8fafc'],
    },
    {
        id: "3",
        tag: "Forgive & Forget",
        title: "Progress over\nperfection",
        description: "Miss a day? No stress. Your growth never resets.",
        cardColors: ['#ffffff', '#f8fafc'],
    },
];

// --- Components ---

const ParallaxCard = ({ item, index, scrollX, width }: { item: Slide, index: number, scrollX: SharedValue<number>, width: number }) => {
    const rStyle = useAnimatedStyle(() => {
        const inputRange = [(index - 1) * width, index * width, (index + 1) * width];
        const scale = interpolate(scrollX.value, inputRange, [0.85, 1, 0.85], Extrapolation.CLAMP);
        const rotateZ = interpolate(scrollX.value, inputRange, [8, 0, -8], Extrapolation.CLAMP);
        const opacity = interpolate(scrollX.value, inputRange, [0.5, 1, 0.5], Extrapolation.CLAMP);
        return {
            transform: [{ scale }, { rotateZ: `${rotateZ}deg` }],
            opacity,
        };
    });

    return (
        <Animated.View style={[rStyle]} className={`w-full aspect-[3.8/5] rounded-[40px] overflow-hidden relative shadow-2xl shadow-blue-900/40 ${Platform.OS === 'android' ? 'elevation-10' : ''}`}>
            <LinearGradient colors={item.cardColors} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
            <View className="absolute inset-0 p-8 justify-between">
                <View className="items-end">
                    <Text className="text-blue-500/10 text-[64px] font-bold leading-none tracking-tighter">0{index + 1}</Text>
                </View>
                <View>
                    <View className="w-16 h-16 rounded-[20px] bg-blue-50 mb-4 border border-blue-100" />
                    <View className="w-full h-4 rounded-full bg-blue-50 mb-2" />
                    <View className="w-3/4 h-4 rounded-full bg-blue-50" />
                </View>
            </View>
        </Animated.View>
    );
};

const SlideText = ({ item }: { item: Slide }) => {
    return (
        <View className="items-start justify-start mt-10 px-2">
            <Animated.View entering={FadeInDown.delay(300).springify()}>
                <View className="flex-row items-center gap-2 mb-4 bg-white/10 self-start px-3 py-1.5 rounded-lg border border-white/20">
                    <Text className="text-white text-[10px] font-inter-bold uppercase tracking-widest">{item.tag}</Text>
                </View>
            </Animated.View>
            <Animated.Text entering={FadeInDown.delay(400).duration(800)} className="text-white text-[38px] font-bricolagegrotesk-bold leading-[1.1] tracking-[-0.6px] mb-4">
                {item.title}
            </Animated.Text>
            <Animated.Text entering={FadeInDown.delay(500).duration(800)} className="text-blue-50 text-[17px] font-inter-medium leading-7 tracking">
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
                    const dotWidth = interpolate(scrollX.value, inputRange, [8, 24, 8], Extrapolation.CLAMP);
                    return { width: dotWidth };
                });
                const rColorStyle = useAnimatedStyle(() => {
                    const inputRange = [(i - 1) * width, i * width, (i + 1) * width];
                    const opacity = interpolate(scrollX.value, inputRange, [0.3, 1, 0.3], Extrapolation.CLAMP);
                    return { opacity };
                })
                return <Animated.View key={i} style={[rDotStyle, rColorStyle]} className="h-2 rounded-full bg-white" />;
            })}
        </View>
    )
}

// --- Main Screen ---

export default function OnboardingScreen() {
    const { width } = useWindowDimensions();
    const router = useRouter();
    const [currentIndex, setCurrentIndex] = useState(0);
    const slidesRef = useRef<FlatList>(null);
    const scrollX = useSharedValue(0);

    const scrollHandler = useAnimatedScrollHandler((event) => {
        scrollX.value = event.contentOffset.x;
    });

    // OPTIMIZATION: Faster viewability updates
    const viewabilityConfig = useRef({
        itemVisiblePercentThreshold: 50,
        minimumViewTime: 0
    }).current;

    const onViewableItemsChanged = useCallback(({ viewableItems }: { viewableItems: ViewToken[] }) => {
        if (viewableItems[0] && viewableItems[0].index !== null) {
            setCurrentIndex(viewableItems[0].index);
        }
    }, []);

    // Logic: Runs on JS Thread
    const handleNextJS = () => {
        if (currentIndex < SLIDES.length - 1) {
            slidesRef.current?.scrollToIndex({ index: currentIndex + 1 });
        } else {
            router.push("/(auth)/sign-up");
        }
    };

    // Gesture: Runs on UI Thread for instant response
    const tapGesture = Gesture.Tap()
        .maxDuration(250)
        .onEnd(() => {
            runOnJS(handleNextJS)();
        });

    const isLastSlide = currentIndex === SLIDES.length - 1;

    return (
        // Ensure GestureHandlerRootView wraps the screen if not already in App.tsx
        <GestureHandlerRootView style={{ flex: 1 }}>
            <View className="flex-1 bg-[#3A7AFE]">
                <StatusBar style="light" />
                <View style={StyleSheet.absoluteFill}>
                    <LinearGradient colors={['#0B0F1A', '#121826', '#3A7AFE']} locations={[0, 0.1, 1]} style={{ flex: 1 }} />
                </View>

                <Animated.FlatList
                    ref={slidesRef}
                    data={SLIDES}
                    renderItem={({ item, index }) => (
                        <View style={{ width }} className="h-full px-8 pt-[12%] pb-32 justify-start">
                            <View className="w-full items-center mb-4">
                                <ParallaxCard item={item} index={index} scrollX={scrollX} width={width} />
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
                    <Animated.View entering={FadeInUp.delay(600).springify()} className="px-8 pb-10 flex-row items-center justify-between">
                        <Paginator data={SLIDES} scrollX={scrollX} width={width} />

                        {/* REPLACED TouchableOpacity WITH GestureDetector */}
                        <GestureDetector gesture={tapGesture}>
                            <Animated.View
                                // OPTIMIZATION: Duration-based (non-spring) transition
                                layout={LinearTransition.duration(250).easing(Easing.out(Easing.quad))}
                                className="h-14 px-8 bg-[#f8fafc] rounded-[20px] flex-row items-center justify-center gap-3 shadow-xl shadow-blue-900/20"
                            >
                                {isLastSlide ? (
                                    <Animated.Text
                                        key="finish"
                                        entering={FadeIn.duration(200)}
                                        exiting={FadeOut.duration(200)}
                                        className="text-[#3B82F6] font-inter-bold text-[17px] tracking-tight"
                                    >
                                        Get Started
                                    </Animated.Text>
                                ) : (
                                    <Animated.Text
                                        key="next"
                                        entering={FadeIn.duration(200)}
                                        exiting={FadeOut.duration(200)}
                                        className="text-[#3B82F6] font-inter-bold text-[17px] tracking-tight"
                                    >
                                        Next
                                    </Animated.Text>
                                )}
                            </Animated.View>
                        </GestureDetector>
                    </Animated.View>
                </View>
            </View>
        </GestureHandlerRootView>
    );
}
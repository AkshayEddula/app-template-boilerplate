import { useSSO } from '@clerk/clerk-expo';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as WebBrowser from 'expo-web-browser';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    Platform,
    Pressable,
    StyleSheet,
    Text,
    View,
    useWindowDimensions,
} from 'react-native';
import Animated, {
    Easing,
    FadeInDown,
    FadeInUp,
    useAnimatedStyle,
    useSharedValue,
    withDelay,
    withRepeat,
    withSequence,
    withSpring,
    withTiming
} from 'react-native-reanimated';

WebBrowser.maybeCompleteAuthSession();

// --- Configuration ---
type CategoryType = 'Health' | 'Mind' | 'Career' | 'Life' | 'Fun';

const CATEGORIES: { id: CategoryType; icon: keyof typeof Ionicons.glyphMap; color: string; character: string }[] = [
    { id: 'Health', icon: 'water', color: '#38BDF8', character: 'Vita' },
    { id: 'Mind', icon: 'prism', color: '#A78BFA', character: 'Aeris' },
    { id: 'Career', icon: 'briefcase', color: '#F472B6', character: 'Forge' },
    { id: 'Life', icon: 'compass', color: '#34D399', character: 'Axis' },
    { id: 'Fun', icon: 'color-palette', color: '#FBBF24', character: 'Pulse' }
];

// --- Components ---

const XPPill = ({ label, xp, delay, x, y }: { label: string, xp: string, delay: number, x: number, y: number }) => {
    const opacity = useSharedValue(0);
    const translateY = useSharedValue(10);

    useEffect(() => {
        opacity.value = withDelay(delay, withRepeat(
            withSequence(
                withTiming(1, { duration: 500 }),
                withDelay(2000, withTiming(0, { duration: 500 })),
                withDelay(4000, withTiming(0, { duration: 0 }))
            ), -1, false)
        );

        translateY.value = withDelay(delay, withRepeat(
            withSequence(
                withTiming(0, { duration: 500, easing: Easing.out(Easing.back(1.5)) }),
                withDelay(2000, withTiming(-20, { duration: 500 })),
                withDelay(4000, withTiming(10, { duration: 0 }))
            ), -1, false)
        );
    }, []);

    const style = useAnimatedStyle(() => ({
        opacity: opacity.value,
        transform: [{ translateY: translateY.value }]
    }));

    // Adjusted BG to match the darker top section better
    return (
        <Animated.View
            style={[style, { position: 'absolute', top: y, left: x }]}
            className="flex-row items-center bg-[#0B0F1A]/80 border border-white/10 px-3 py-1.5 rounded-full shadow-lg backdrop-blur-md"
        >
            <Text className="text-white text-[10px] font-inter-semibold mr-2">{label}</Text>
            <View className="bg-yellow-500/20 px-1.5 rounded-md border border-yellow-500/30">
                <Text className="text-yellow-400 text-[10px] font-bricolagegrotesk-bold">{xp}</Text>
            </View>
        </Animated.View>
    );
};

const OrbitIcon = ({ item, index, total, radius }: { item: typeof CATEGORIES[0], index: number, total: number, radius: number }) => {
    const angle = (2 * Math.PI / total) * index;
    const rotation = useSharedValue(0);

    useEffect(() => {
        rotation.value = withRepeat(
            withTiming(2 * Math.PI, { duration: 25000, easing: Easing.linear }),
            -1,
            false
        );
    }, []);

    const animatedStyle = useAnimatedStyle(() => {
        const currentAngle = angle + rotation.value;
        const x = radius * Math.cos(currentAngle);
        const y = radius * Math.sin(currentAngle);

        return {
            transform: [
                { translateX: x },
                { translateY: y },
            ]
        };
    });

    return (
        <Animated.View style={[animatedStyle, { position: 'absolute' }]}>
            <View
                className="w-10 h-10 rounded-full items-center justify-center border border-white/10 bg-white/5 backdrop-blur-md shadow-lg"
                style={{ shadowColor: item.color, shadowOpacity: 0.5, shadowRadius: 12 }}
            >
                <Ionicons name={item.icon} size={16} color={item.color} />
            </View>
        </Animated.View>
    );
};

const ScaleButton = ({ onPress, disabled, children, style }: any) => {
    const scale = useSharedValue(1);
    const onPressIn = () => { scale.value = withSpring(0.96); };
    const onPressOut = () => { scale.value = withSpring(1); };
    const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

    return (
        <Pressable onPressIn={onPressIn} onPressOut={onPressOut} onPress={onPress} disabled={disabled}>
            <Animated.View style={[style, animatedStyle]}>{children}</Animated.View>
        </Pressable>
    );
};

export default function SignUpScreen() {
    const { startSSOFlow } = useSSO();
    const router = useRouter();
    const { width } = useWindowDimensions();
    const [googleLoading, setGoogleLoading] = useState(false);
    const [appleLoading, setAppleLoading] = useState(false);

    const pulse = useSharedValue(1);
    useEffect(() => {
        pulse.value = withRepeat(
            withSequence(
                withTiming(1.1, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
                withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.ease) })
            ), -1, true
        );
    }, []);

    const pulseStyle = useAnimatedStyle(() => ({ transform: [{ scale: pulse.value }] }));

    const onOAuthSignUp = async (strategy: 'oauth_google' | 'oauth_apple') => {
        if (strategy === 'oauth_google') setGoogleLoading(true); else setAppleLoading(true);
        try {
            const { createdSessionId, setActive } = await startSSOFlow({ strategy });
            if (createdSessionId) await setActive!({ session: createdSessionId });
        } catch (err: any) {
            console.error(err);
            Alert.alert('Error', err.message || 'Failed to sign in');
        } finally {
            setGoogleLoading(false); setAppleLoading(false);
        }
    };

    const isLoading = googleLoading || appleLoading;

    return (
        <View style={{ flex: 1, backgroundColor: '#0B0F1A' }}>
            <StatusBar style="light" />

            {/* --- UPDATED GRADIENT --- */}
            <LinearGradient
                colors={['#0B0F1A', '#121826', '#3A7AFE']}
                locations={[0, 0.1, 1]}
                style={StyleSheet.absoluteFill}
            />

            <View className="flex-1 px-8 pt-20">
                {/* --- HERO --- */}
                <View className="h-[48%] w-full items-center justify-center relative mt-4">

                    {/* Background Glow - Adjusted to match the new blue bottom */}
                    <Animated.View style={[{ position: 'absolute' }, pulseStyle]}>
                        <View className="w-[280px] h-[280px] rounded-full bg-blue-500/20 blur-[90px]" />
                    </Animated.View>

                    {/* Orbit System */}
                    <View className="absolute w-[280px] h-[280px] items-center justify-center">
                        <View className="absolute w-[220px] h-[220px] rounded-full border border-white/10" />
                        {CATEGORIES.map((cat, index) => (
                            <OrbitIcon
                                key={cat.id}
                                item={cat}
                                index={index}
                                total={CATEGORIES.length}
                                radius={110}
                            />
                        ))}
                    </View>

                    {/* Core Character */}
                    <Animated.View entering={FadeInDown.duration(1000).springify()} style={pulseStyle}>
                        <View className="w-28 h-28 rounded-full border border-white/20 bg-white/5 backdrop-blur-xl items-center justify-center shadow-2xl shadow-blue-500/40">
                            <View className="w-20 h-20 rounded-full bg-gradient-to-tr from-[#3A7AFE] to-blue-600 items-center justify-center border border-white/20">
                                <Ionicons name="sparkles" size={32} color="white" />
                            </View>
                            {/* Matches top background color for seamless look */}
                            <View className="absolute -bottom-3 bg-[#0B0F1A] px-2 py-0.5 rounded-full border border-white/10">
                                <Text className="text-[9px] text-blue-200 font-inter-bold uppercase tracking-widest">Ascend</Text>
                            </View>
                        </View>
                    </Animated.View>

                    {/* HUD Elements */}
                    <XPPill label="Health Streak" xp="7 Days" delay={500} x={-10} y={60} />
                    <XPPill label="Read Book" xp="+50 XP" delay={1800} x={width * 0.55} y={40} />
                    <XPPill label="Weekly Recap" xp="Ready" delay={3200} x={20} y={230} />
                </View>

                {/* --- CONTENT --- */}
                <View className="flex-1 justify-end pb-12">

                    <Animated.View entering={FadeInDown.delay(300).springify()}>
                        <Text
                            className="text-[40px] font-bricolagegrotesk-bold text-white text-center mb-2 leading-tight tracking-tight"
                        // style={{ textShadowColor: 'rgba(0,0,0,0)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 8 }}
                        >
                            Level up your{'\n'}
                            <Text className="text-blue-100">2026</Text> Resolution.
                        </Text>
                    </Animated.View>

                    <Animated.View entering={FadeInDown.delay(400).springify()}>
                        {/* Text shadow added because background is lighter blue at bottom */}
                        <Text
                            className="text-white/50 text-[15px] font-inter-medium text-center mb-10 leading-6 px-4"
                            style={{ textShadowColor: 'rgba(0,0,0,0.2)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 3 }}
                        >
                            Gamify your Health, Career, and Life. {'\n'}Earn XP, evolve characters, and build streaks.
                        </Text>
                    </Animated.View>

                    <View className="gap-4 mb-8">
                        {Platform.OS === 'ios' && (
                            <Animated.View entering={FadeInDown.delay(500).springify()}>
                                <ScaleButton
                                    style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: 'white', height: 56, borderRadius: 16, gap: 12, shadowColor: '#000', shadowOpacity: 0.15, shadowOffset: { width: 0, height: 4 }, shadowRadius: 8 }}
                                    onPress={() => onOAuthSignUp('oauth_apple')}
                                    disabled={isLoading}
                                >
                                    {appleLoading ? <ActivityIndicator color="#000" /> : (
                                        <View className="flex-row items-center justify-center gap-3">
                                            <Ionicons name="logo-apple" size={22} color="#000" />
                                            <Text className="text-slate-900 text-[17px] font-bricolagegrotesk-bold">Continue with Apple</Text>
                                        </View>
                                    )}
                                </ScaleButton>
                            </Animated.View>
                        )}

                        <Animated.View entering={FadeInDown.delay(600).springify()}>
                            <ScaleButton
                                // Matches the dark top color for the button
                                style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#0B0F1A', height: 56, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)', gap: 12, shadowColor: '#000', shadowOpacity: 0.3, shadowOffset: { width: 0, height: 4 }, shadowRadius: 8 }}
                                onPress={() => onOAuthSignUp('oauth_google')}
                                disabled={isLoading}
                            >
                                {googleLoading ? <ActivityIndicator color="#fff" /> : (
                                    <View className="flex-row items-center justify-center gap-3">
                                        <Image source={{ uri: 'https://www.google.com/favicon.ico' }} className="w-5 h-5 opacity-90" />
                                        <Text className="text-white text-[17px] font-bricolagegrotesk-bold">Continue with Google</Text>
                                    </View>
                                )}
                            </ScaleButton>
                        </Animated.View>
                    </View>

                    <Animated.View entering={FadeInUp.delay(700).springify()}>
                        <Text className="text-[12px] text-blue-100/60 text-center font-inter-medium">
                            By continuing, you agree to our Terms & Privacy Policy.
                        </Text>
                    </Animated.View>
                </View>
            </View>
        </View>
    );
}
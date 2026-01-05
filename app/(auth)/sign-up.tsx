import { useSSO } from '@clerk/clerk-expo';
import { Ionicons } from '@expo/vector-icons';
import { GlassView } from 'expo-glass-effect';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as WebBrowser from 'expo-web-browser';
import { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    Platform,
    Pressable,
    ScrollView,
    Text,
    View,
} from 'react-native';
import Animated, {
    FadeInDown,
    FadeInUp,
    useAnimatedStyle,
    useSharedValue,
    withSpring,
} from 'react-native-reanimated';

WebBrowser.maybeCompleteAuthSession();

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
    const [googleLoading, setGoogleLoading] = useState(false);
    const [appleLoading, setAppleLoading] = useState(false);

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
        <View style={{ flex: 1, backgroundColor: '#3A7AFE' }}>
            <StatusBar style="light" />

            <ScrollView
                className="flex-1"
                contentContainerClassName="px-6 py-12"
                showsVerticalScrollIndicator={false}
            >
                <View className="w-full max-w-[540px] mx-auto">
                    {/* --- HERO SECTION --- */}
                    <View className="items-center mb-6">
                        <Animated.View entering={FadeInDown.duration(600)} className="items-center justify-center">
                            {/* App Icon */}
                            <View
                                className="w-20 h-20 rounded-3xl items-center justify-center mb-3 overflow-hidden"
                                style={{
                                    shadowColor: '#FFD700',
                                    shadowOffset: { width: 0, height: 4 },
                                    shadowOpacity: 0.2,
                                    shadowRadius: 12,
                                }}
                            >
                                <Image
                                    source={require('../../assets/images/icon.png')}
                                    className="w-full h-full"
                                    resizeMode="cover"
                                />
                            </View>

                            {/* App Name */}
                            <Text className="text-5xl font-generalsans-bold tracking-tighter text-white text-center leading-tight mb-2">
                                Levora
                            </Text>

                            {/* Tagline Badge */}
                            <GlassView
                                glassEffectStyle="regular"
                                tintColor="#3A7AFE"
                                style={{
                                    paddingHorizontal: 20,
                                    paddingVertical: 8,
                                    borderRadius: 100,
                                    borderWidth: 1,
                                    borderColor: 'rgba(255,255,255,0.2)',
                                    overflow: 'hidden'
                                }}
                            >
                                <Text className="text-[#FFD700] text-xs font-generalsans-bold tracking-widest uppercase">
                                    ✨ Your 2026 Reset
                                </Text>
                            </GlassView>

                            {/* Headline */}
                            <Animated.View entering={FadeInDown.delay(150).duration(600)} className="mt-5 px-4">
                                <Text className="text-white text-xl font-generalsans-bold text-center leading-7">
                                    Build Habits That Stick
                                </Text>
                                <Text className="text-white/70 text-sm font-generalsans-medium text-center leading-5 mt-1">
                                    Transform your life one resolution at a time
                                </Text>
                            </Animated.View>

                            {/* Stats */}
                            <Animated.View
                                entering={FadeInDown.delay(250).duration(600)}
                                className="mt-6"
                            >
                                <GlassView
                                    glassEffectStyle="regular"
                                    tintColor="#3A7AFE"
                                    style={{
                                        paddingHorizontal: 20,
                                        paddingVertical: 16,
                                        borderRadius: 20,
                                        borderWidth: 1,
                                        borderColor: 'rgba(255,255,255,0.2)',
                                        overflow: 'hidden'
                                    }}
                                >
                                    <View className="flex-row items-center gap-2.5 justify-around">
                                        <View className="items-center">
                                            <Text className="text-white font-generalsans-bold text-2xl tracking-tight">
                                                1,000+
                                            </Text>
                                            <Text className="text-white/60 font-generalsans-medium text-[10px] mt-0.5">
                                                Started Today
                                            </Text>
                                        </View>
                                        <View className="w-px h-10 bg-white/20" />
                                        <View className="items-center">
                                            <Text className="text-white font-generalsans-bold text-2xl tracking-tight">
                                                12.4K+
                                            </Text>
                                            <Text className="text-white/60 font-generalsans-medium text-[10px] mt-0.5">
                                                Active Users
                                            </Text>
                                        </View>
                                    </View>
                                </GlassView>
                            </Animated.View>
                        </Animated.View>
                    </View>

                    {/* --- VALUE PROPS --- */}
                    <View className="mb-8 gap-2.5">
                        {[
                            { emoji: '🎯', text: 'Track unlimited resolutions' },
                            { emoji: '🔥', text: 'Build unbreakable streaks' },
                            { emoji: '🏆', text: 'Unlock exclusive rewards' },
                        ].map((item, index) => (
                            <Animated.View
                                key={index}
                                entering={FadeInDown.delay(350 + (index * 80)).duration(500)}
                                className="flex-row items-center gap-3 bg-white/5 px-4 py-3.5 rounded-2xl border border-white/10"
                            >
                                <Text className="text-2xl">{item.emoji}</Text>
                                <Text className="text-white text-[15px] font-generalsans-medium tracking-tight flex-1">
                                    {item.text}
                                </Text>
                            </Animated.View>
                        ))}
                    </View>

                    {/* --- ACTIONS --- */}
                    <View className="gap-3.5">
                        {Platform.OS === 'ios' && (
                            <Animated.View entering={FadeInUp.delay(600).duration(600)}>
                                <ScaleButton
                                    style={{
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        backgroundColor: '#000',
                                        height: 56,
                                        borderRadius: 16,
                                        gap: 10,
                                        shadowColor: '#000',
                                        shadowOpacity: 0.3,
                                        shadowOffset: { width: 0, height: 4 },
                                        shadowRadius: 12,
                                        elevation: 6,
                                    }}
                                    onPress={() => onOAuthSignUp('oauth_apple')}
                                    disabled={isLoading}
                                >
                                    {appleLoading ? <ActivityIndicator color="#fff" /> : (
                                        <View className="flex-row items-center justify-center gap-3">
                                            <Ionicons name="logo-apple" size={24} color="#fff" />
                                            <Text className="text-white text-[17px] font-generalsans-medium">Continue with Apple</Text>
                                        </View>
                                    )}
                                </ScaleButton>
                            </Animated.View>
                        )}

                        <Animated.View entering={FadeInUp.delay(700).duration(600)}>
                            <ScaleButton
                                style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    backgroundColor: 'white',
                                    height: 56,
                                    borderRadius: 16,
                                    gap: 10,
                                    shadowColor: '#000',
                                    shadowOpacity: 0.15,
                                    shadowOffset: { width: 0, height: 4 },
                                    shadowRadius: 12,
                                    elevation: 6,
                                }}
                                onPress={() => onOAuthSignUp('oauth_google')}
                                disabled={isLoading}
                            >
                                {googleLoading ? <ActivityIndicator color="#3A7AFE" /> : (
                                    <View className="flex-row items-center justify-center gap-3">
                                        <Image
                                            source={{ uri: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c1/Google_%22G%22_logo.svg/768px-Google_%22G%22_logo.svg.png' }}
                                            style={{ width: 22, height: 22 }}
                                        />
                                        <Text className="text-slate-800 text-[17px] font-generalsans-medium">Continue with Google</Text>
                                    </View>
                                )}
                            </ScaleButton>
                        </Animated.View>

                        {/* Trust Badge */}
                        <Animated.View entering={FadeInUp.delay(800).duration(600)} className="flex-row items-center justify-center gap-2 mt-1">
                            <Ionicons name="shield-checkmark" size={16} color="rgba(255,255,255,0.7)" />
                            <Text className="text-white/70 text-xs font-generalsans-medium">
                                Secure sign-in
                            </Text>
                        </Animated.View>
                    </View>

                    {/* --- FOOTER --- */}
                    <Animated.View entering={FadeInUp.delay(900).duration(800)} className="mt-6">
                        <Text className="text-xs text-blue-100/60 text-center font-generalsans-medium leading-4">
                            By continuing, you agree to our{'\n'}Terms of Service & Privacy Policy.
                        </Text>
                    </Animated.View>
                </View>
            </ScrollView>
        </View>
    );
}
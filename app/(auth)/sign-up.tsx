import { useGuest } from '@/context/GuestContext';
import { useSSO } from '@clerk/clerk-expo';
import { Ionicons } from '@expo/vector-icons';
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
    View
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
    const { loginAsGuest } = useGuest();
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
                contentContainerStyle={{
                    paddingHorizontal: 24,
                    paddingTop: 50,
                    paddingBottom: 40,
                    justifyContent: 'center',
                    minHeight: '100%'
                }}
                showsVerticalScrollIndicator={false}
            >
                <View className="w-full max-w-[440px] mx-auto">
                    {/* --- HERO WITH CHARACTER EVOLUTION --- */}
                    <Animated.View entering={FadeInDown.duration(500)} className="items-center mb-8">
                        {/* App Name */}
                        <Text
                            className="text-4xl font-inter-bold tracking-tight text-center mb-1"
                            style={{ color: '#FFFFFF' }}
                        >
                            Levora
                        </Text>

                        {/* Tagline */}
                        <Text
                            className="text-xs font-inter-medium tracking-widest uppercase mb-6"
                            style={{ color: 'rgba(255,255,255,0.7)' }}
                        >
                            Your 2026 Reset
                        </Text>

                        {/* CHARACTER EVOLUTION VISUAL */}
                        <View
                            className="mb-6"
                            style={{
                                backgroundColor: 'rgba(255,255,255,0.1)',
                                paddingHorizontal: 28,
                                paddingVertical: 20,
                                borderRadius: 24,
                                borderWidth: 1,
                                borderColor: 'rgba(255,255,255,0.1)',
                            }}
                        >
                            <View className="flex-row items-center justify-center gap-4">
                                <View className="items-center">
                                    <Text className="text-4xl mb-1">🌱</Text>
                                    <Text className="text-[10px] font-inter-medium" style={{ color: 'rgba(255,255,255,0.6)' }}>
                                        Start
                                    </Text>
                                </View>

                                <Text className="text-2xl" style={{ color: 'rgba(255,255,255,0.4)' }}>→</Text>

                                <View className="items-center">
                                    <Text className="text-4xl mb-1">🌿</Text>
                                    <Text className="text-[10px] font-inter-medium" style={{ color: 'rgba(255,255,255,0.6)' }}>
                                        Grow
                                    </Text>
                                </View>

                                <Text className="text-2xl" style={{ color: 'rgba(255,255,255,0.4)' }}>→</Text>

                                <View className="items-center">
                                    <Text className="text-4xl mb-1">🌳</Text>
                                    <Text className="text-[10px] font-inter-medium" style={{ color: 'rgba(255,255,255,0.6)' }}>
                                        Thrive
                                    </Text>
                                </View>
                            </View>
                        </View>
                    </Animated.View>

                    {/* --- DYNAMIC HEADLINE --- */}
                    <Animated.View entering={FadeInDown.delay(100).duration(500)} className="mb-8">
                        <Text
                            className="text-3xl font-inter-bold text-center leading-tight mb-3"
                            style={{ color: '#FFFFFF' }}
                        >
                            Transform Your Life,{' \n'}One Habit at a Time
                        </Text>
                        <Text
                            className="text-base font-inter-medium text-center leading-relaxed px-2 mb-4"
                            style={{ color: 'rgba(255,255,255,0.7)' }}
                        >
                            Build lasting habits, track your progress, and watch your character evolve with every streak.
                        </Text>
                        {/* Social Proof */}
                        <View className="flex-row items-center justify-center gap-2 mt-2">
                            <View className="w-6 h-6 rounded-full items-center justify-center" style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}>
                                <Ionicons name="checkmark" size={16} color="white" />
                            </View>
                            <Text className="text-sm font-inter-semibold" style={{ color: '#FFFFFF' }}>
                                1,000+ resolutions started
                            </Text>
                        </View>
                    </Animated.View>

                    {/* --- VALUE PROPS --- */}
                    <Animated.View entering={FadeInDown.delay(200).duration(500)} className="mb-10">
                        <View className="flex-row items-center justify-between px-10">
                            <View style={{ flex: 1 }} className="items-center">
                                <View className="w-14 h-14 rounded-2xl items-center justify-center mb-3" style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}>
                                    <Text className="text-3xl">✨</Text>
                                </View>
                                <Text numberOfLines={1} className="text-xs font-inter-bold text-center" style={{ color: '#FFFFFF' }}>Character Growth</Text>
                            </View>

                            <View className="w-px h-16 mx-4" style={{ backgroundColor: 'rgba(255,255,255,0.2)' }} />

                            <View style={{ flex: 1 }} className="items-center">
                                <View className="w-14 h-14 rounded-2xl items-center justify-center mb-3" style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}>
                                    <Text className="text-3xl">🔥</Text>
                                </View>
                                <Text numberOfLines={1} className="text-xs font-inter-bold text-center" style={{ color: '#FFFFFF' }}>Streak Power</Text>
                            </View>
                        </View>
                    </Animated.View>

                    {/* --- PROMINENT CTA BUTTONS --- */}
                    <View className="gap-4 mb-5">
                        {Platform.OS === 'ios' && (
                            <Animated.View entering={FadeInUp.delay(300).duration(500)}>
                                <ScaleButton
                                    style={{
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        backgroundColor: '#000',
                                        height: 60,
                                        borderRadius: 30,
                                        gap: 12,
                                        shadowColor: '#000',
                                        shadowOpacity: 0.15,
                                        shadowOffset: { width: 0, height: 4 },
                                        shadowRadius: 12,
                                        elevation: 6,
                                    }}
                                    onPress={() => onOAuthSignUp('oauth_apple')}
                                    disabled={isLoading}
                                >
                                    {appleLoading ? <ActivityIndicator color="#fff" /> : (
                                        <View className="flex-row items-center justify-center gap-3">
                                            <Ionicons name="logo-apple" size={26} color="#fff" />
                                            <Text className="text-white text-[18px] font-inter-bold">
                                                Continue with Apple
                                            </Text>
                                        </View>
                                    )}
                                </ScaleButton>
                            </Animated.View>
                        )}

                        <Animated.View entering={FadeInUp.delay(400).duration(500)}>
                            <ScaleButton
                                style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    backgroundColor: 'white',
                                    height: 60,
                                    borderRadius: 30,
                                    gap: 12,
                                    shadowColor: '#000',
                                    shadowOpacity: 0.15,
                                    shadowOffset: { width: 0, height: 4 },
                                    shadowRadius: 12,
                                    elevation: 6,
                                }}
                                onPress={() => onOAuthSignUp('oauth_google')}
                                disabled={isLoading}
                            >
                                {googleLoading ? <ActivityIndicator color="#121212" /> : (
                                    <View className="flex-row items-center justify-center gap-3">
                                        <Image
                                            source={{ uri: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c1/Google_%22G%22_logo.svg/768px-Google_%22G%22_logo.svg.png' }}
                                            style={{ width: 24, height: 24 }}
                                        />
                                        <Text className="text-[#121212] text-[18px] font-inter-bold">
                                            Continue with Google
                                        </Text>
                                    </View>
                                )}
                            </ScaleButton>
                        </Animated.View>
                    </View>

                    {/* --- GUEST OPTION --- */}
                    <Animated.View entering={FadeInUp.delay(600).duration(500)}>
                        <ScaleButton
                            onPress={() => {
                                loginAsGuest();
                                router.push('/(auth)/onboarding-steps');
                            }}
                            style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                justifyContent: 'center',
                                backgroundColor: 'transparent',
                                height: 54,
                                borderRadius: 30,
                                borderWidth: 1,
                                borderColor: 'rgba(255,255,255,0.3)',
                            }}
                        >
                            <Text
                                className="text-[16px] font-inter-bold"
                                style={{ color: 'rgba(255,255,255,0.7)' }}
                            >
                                Continue as Guest
                            </Text>
                        </ScaleButton>
                    </Animated.View>

                    {/* --- FOOTER --- */}
                    <Animated.View entering={FadeInUp.delay(700).duration(500)} className="mt-6">
                        <Text className="text-xs text-center font-inter-regular leading-5" style={{ color: 'rgba(255,255,255,0.4)' }}>
                            By continuing, you agree to our{' '}
                            <Text
                                onPress={() => WebBrowser.openBrowserAsync("https://www.apple.com/legal/internet-services/itunes/dev/stdeula/")}
                                style={{ color: 'white', textDecorationLine: 'underline' }}
                            >
                                Terms
                            </Text>
                            {' & '}
                            <Text
                                onPress={() => router.push('/(legal)/privacy-policy')}
                                style={{ color: 'white', textDecorationLine: 'underline' }}
                            >
                                Privacy Policy
                            </Text>
                        </Text>
                    </Animated.View>
                </View>
            </ScrollView>
        </View>
    );
}
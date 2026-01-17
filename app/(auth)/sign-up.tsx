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
    StyleSheet,
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
import { SafeAreaView } from 'react-native-safe-area-context';

WebBrowser.maybeCompleteAuthSession();

// Theme
const BG_COLOR = "#FAF9F6";
const TEXT_PRIMARY = "#1A1A1A";
const TEXT_SECONDARY = "#6B7280";
const ACCENT_ORANGE = "#F97316";

const ScaleButton = ({ onPress, disabled, children, style }: any) => {
    const scale = useSharedValue(1);
    const onPressIn = () => { scale.value = withSpring(0.97); };
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
        <View style={styles.container}>
            <StatusBar style="dark" />
            <SafeAreaView style={{ flex: 1 }}>
                <ScrollView
                    style={{ flex: 1 }}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    <View style={styles.content}>
                        {/* --- HERO SECTION --- */}
                        <Animated.View entering={FadeInDown.duration(600)} style={styles.heroSection}>
                            {/* Large Hero Visual */}
                            <View style={styles.heroVisual}>
                                <Text style={styles.heroEmoji}>🎯</Text>
                            </View>

                            {/* Year Badge */}
                            <View style={styles.yearBadge}>
                                <Text style={styles.yearBadgeText}>✨ NEW YEAR 2026</Text>
                            </View>

                            {/* Main Headline */}
                            <Text style={styles.headline}>
                                Finally Stick To Your{'\n'}Resolutions
                            </Text>

                            {/* Subheadline */}
                            <Text style={styles.subheadline}>
                                Join thousands who transformed their lives with habit tracking, character evolution, and streak rewards
                            </Text>
                        </Animated.View>

                        {/* --- SOCIAL PROOF --- */}
                        <Animated.View entering={FadeInDown.delay(150).duration(500)} style={styles.socialProofPill}>
                            <Ionicons name="checkmark-circle" size={18} color="#22C55E" />
                            <Text style={styles.socialProofText}>1,000+ resolutions started</Text>
                        </Animated.View>

                        {/* --- VALUE PROPS --- */}
                        <Animated.View entering={FadeInDown.delay(250).duration(500)} style={styles.valuePropsCard}>
                            <View style={styles.valueProp}>
                                <View style={[styles.valuePropIcon, { backgroundColor: '#FEF3C7' }]}>
                                    <Text style={{ fontSize: 20 }}>🔥</Text>
                                </View>
                                <View style={styles.valuePropText}>
                                    <Text style={styles.valuePropTitle}>Track Streaks</Text>
                                    <Text style={styles.valuePropDesc}>Never break your chain</Text>
                                </View>
                            </View>

                            <View style={styles.valuePropDivider} />

                            <View style={styles.valueProp}>
                                <View style={[styles.valuePropIcon, { backgroundColor: '#E0E7FF' }]}>
                                    <Text style={{ fontSize: 20 }}>🎴</Text>
                                </View>
                                <View style={styles.valuePropText}>
                                    <Text style={styles.valuePropTitle}>Unlock Characters</Text>
                                    <Text style={styles.valuePropDesc}>Watch them evolve</Text>
                                </View>
                            </View>

                            <View style={styles.valuePropDivider} />

                            <View style={styles.valueProp}>
                                <View style={[styles.valuePropIcon, { backgroundColor: '#D1FAE5' }]}>
                                    <Text style={{ fontSize: 20 }}>📊</Text>
                                </View>
                                <View style={styles.valuePropText}>
                                    <Text style={styles.valuePropTitle}>See Progress</Text>
                                    <Text style={styles.valuePropDesc}>Visual insights daily</Text>
                                </View>
                            </View>
                        </Animated.View>

                        {/* --- AUTH BUTTONS --- */}
                        <View style={styles.authSection}>
                            {Platform.OS === 'ios' && (
                                <Animated.View entering={FadeInUp.delay(350).duration(500)}>
                                    <ScaleButton
                                        style={styles.appleButton}
                                        onPress={() => onOAuthSignUp('oauth_apple')}
                                        disabled={isLoading}
                                    >
                                        {appleLoading ? <ActivityIndicator color="#fff" /> : (
                                            <View style={styles.buttonContent}>
                                                <Ionicons name="logo-apple" size={22} color="#fff" />
                                                <Text style={styles.appleButtonText}>Continue with Apple</Text>
                                            </View>
                                        )}
                                    </ScaleButton>
                                </Animated.View>
                            )}

                            <Animated.View entering={FadeInUp.delay(400).duration(500)}>
                                <ScaleButton
                                    style={styles.googleButton}
                                    onPress={() => onOAuthSignUp('oauth_google')}
                                    disabled={isLoading}
                                >
                                    {googleLoading ? <ActivityIndicator color="#1A1A1A" /> : (
                                        <View style={styles.buttonContent}>
                                            <Image
                                                source={{ uri: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c1/Google_%22G%22_logo.svg/768px-Google_%22G%22_logo.svg.png' }}
                                                style={{ width: 22, height: 22 }}
                                            />
                                            <Text style={styles.googleButtonText}>Continue with Google</Text>
                                        </View>
                                    )}
                                </ScaleButton>
                            </Animated.View>

                            {/* Guest Option with urgency */}
                            <Animated.View entering={FadeInUp.delay(450).duration(500)}>
                                <ScaleButton
                                    onPress={() => {
                                        loginAsGuest();
                                        router.push('/(auth)/onboarding-steps');
                                    }}
                                    style={styles.guestButton}
                                >
                                    <Text style={styles.guestButtonText}>Try Free Without Account</Text>
                                    <Ionicons name="arrow-forward" size={18} color={ACCENT_ORANGE} />
                                </ScaleButton>
                            </Animated.View>
                        </View>

                        {/* --- TRUST INDICATORS --- */}
                        <Animated.View entering={FadeInUp.delay(500).duration(500)} style={styles.trustRow}>
                            <View style={styles.trustItem}>
                                <Ionicons name="shield-checkmark" size={16} color="#22C55E" />
                                <Text style={styles.trustText}>Privacy First</Text>
                            </View>
                            <View style={styles.trustItem}>
                                <Ionicons name="lock-closed" size={16} color="#22C55E" />
                                <Text style={styles.trustText}>Secure Data</Text>
                            </View>
                            <View style={styles.trustItem}>
                                <Ionicons name="cloud-done" size={16} color="#22C55E" />
                                <Text style={styles.trustText}>Auto Sync</Text>
                            </View>
                        </Animated.View>

                        {/* --- FOOTER --- */}
                        <Animated.View entering={FadeInUp.delay(550).duration(500)} style={styles.footer}>
                            <Text style={styles.footerText}>
                                By continuing, you agree to our{' '}
                                <Text
                                    onPress={() => WebBrowser.openBrowserAsync("https://www.apple.com/legal/internet-services/itunes/dev/stdeula/")}
                                    style={styles.footerLink}
                                >
                                    Terms
                                </Text>
                                {' & '}
                                <Text
                                    onPress={() => router.push('/(legal)/privacy-policy')}
                                    style={styles.footerLink}
                                >
                                    Privacy
                                </Text>
                            </Text>
                        </Animated.View>
                    </View>
                </ScrollView>
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: BG_COLOR,
    },
    scrollContent: {
        flexGrow: 1,
        paddingHorizontal: 24,
        paddingTop: 16,
        paddingBottom: 24,
    },
    content: {
        flex: 1,
        maxWidth: 440,
        alignSelf: 'center',
        width: '100%',
    },

    // Hero
    heroSection: {
        alignItems: 'center',
        marginBottom: 24,
    },
    heroVisual: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#FFFFFF',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
        shadowColor: ACCENT_ORANGE,
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.2,
        shadowRadius: 28,
        elevation: 8,
        borderWidth: 3,
        borderColor: '#FFF7ED',
    },
    heroEmoji: {
        fontSize: 48,
    },
    yearBadge: {
        backgroundColor: '#FEF3C7',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 999,
        marginBottom: 16,
    },
    yearBadgeText: {
        fontFamily: 'Nunito-Bold',
        fontSize: 12,
        color: '#D97706',
        letterSpacing: 1,
    },
    headline: {
        fontFamily: 'Nunito-Bold',
        fontSize: 32,
        color: TEXT_PRIMARY,
        textAlign: 'center',
        lineHeight: 40,
        marginBottom: 12,
    },
    subheadline: {
        fontFamily: 'Nunito-Medium',
        fontSize: 15,
        color: TEXT_SECONDARY,
        textAlign: 'center',
        lineHeight: 23,
        paddingHorizontal: 8,
    },

    // Social Proof
    socialProofPill: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 999,
        gap: 8,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
        elevation: 2,
    },
    socialProofText: {
        fontFamily: 'Nunito-Bold',
        fontSize: 14,
        color: TEXT_PRIMARY,
    },

    // Value Props
    valuePropsCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        padding: 6,
        marginBottom: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
        elevation: 2,
    },
    valueProp: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 14,
    },
    valuePropIcon: {
        width: 44,
        height: 44,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 14,
    },
    valuePropText: {
        flex: 1,
    },
    valuePropTitle: {
        fontFamily: 'Nunito-Bold',
        fontSize: 15,
        color: TEXT_PRIMARY,
        marginBottom: 2,
    },
    valuePropDesc: {
        fontFamily: 'Nunito-Medium',
        fontSize: 13,
        color: TEXT_SECONDARY,
    },
    valuePropDivider: {
        height: 1,
        backgroundColor: '#F3F4F6',
        marginHorizontal: 14,
    },

    // Auth
    authSection: {
        gap: 12,
        marginBottom: 20,
    },
    appleButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#000000',
        height: 56,
        borderRadius: 999,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.2,
        shadowRadius: 14,
        elevation: 6,
    },
    appleButtonText: {
        fontFamily: 'Nunito-Bold',
        fontSize: 16,
        color: '#FFFFFF',
    },
    googleButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FFFFFF',
        height: 56,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
        elevation: 2,
    },
    googleButtonText: {
        fontFamily: 'Nunito-Bold',
        fontSize: 16,
        color: TEXT_PRIMARY,
    },
    buttonContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    guestButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FFF7ED',
        height: 52,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: '#FDBA74',
        gap: 8,
    },
    guestButtonText: {
        fontFamily: 'Nunito-Bold',
        fontSize: 15,
        color: ACCENT_ORANGE,
    },

    // Trust
    trustRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 20,
        marginBottom: 20,
    },
    trustItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    trustText: {
        fontFamily: 'Nunito-Medium',
        fontSize: 12,
        color: TEXT_SECONDARY,
    },

    // Footer
    footer: {
        alignItems: 'center',
    },
    footerText: {
        fontFamily: 'Nunito-Medium',
        fontSize: 12,
        color: TEXT_SECONDARY,
        textAlign: 'center',
        lineHeight: 18,
    },
    footerLink: {
        color: ACCENT_ORANGE,
        textDecorationLine: 'underline',
    },
});
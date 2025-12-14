import { useSSO } from '@clerk/clerk-expo';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    Platform,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';


WebBrowser.maybeCompleteAuthSession();

export default function SignUpScreen() {
    const { startSSOFlow } = useSSO();
    const router = useRouter();
    const [googleLoading, setGoogleLoading] = useState(false);
    const [appleLoading, setAppleLoading] = useState(false);

    const onOAuthSignUp = async (strategy: 'oauth_google' | 'oauth_apple') => {
        if (strategy === 'oauth_google') {
            setGoogleLoading(true);
        } else {
            setAppleLoading(true);
        }

        try {
            const { createdSessionId, setActive } = await startSSOFlow({
                strategy
            });

            if (createdSessionId) {
                await setActive!({ session: createdSessionId });
                // router.replace('/(tabs)');
            }
        } catch (err: any) {
            console.error('OAuth error', err);
            Alert.alert(
                'Error',
                err.message || 'Failed to sign in with OAuth'
            );
        } finally {
            setGoogleLoading(false);
            setAppleLoading(false);
        }
    };

    const isLoading = googleLoading || appleLoading;

    return (
        <View className="flex-1 bg-white">
            <View className="flex-1 justify-center p-5">
                {/* Logo/Icon Section */}
                <View className="items-center mb-10">
                    <View className="w-[100px] h-[100px] rounded-full bg-[#f0f0f0] justify-center items-center">
                        <Text className="text-[50px]">🚀</Text>
                    </View>
                </View>

                {/* Title Section */}
                <Text className="text-3xl font-bold mb-2 text-center">Welcome!</Text>
                <Text className="text-base text-gray-500 mb-10 text-center leading-6">
                    Sign up to get started with our app
                </Text>

                {/* Apple Sign Up Button - Show only on iOS or both platforms */}
                {Platform.OS === 'ios' && (
                    <TouchableOpacity
                        className={`flex-row items-center justify-center bg-black p-4 rounded-lg shadow-sm gap-2 ${appleLoading ? 'opacity-60' : ''}`}
                        onPress={() => onOAuthSignUp('oauth_apple')}
                        disabled={isLoading}
                    >
                        {appleLoading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <>
                                <Ionicons name="logo-apple" size={20} color="#fff" />
                                <Text className="text-white text-base font-semibold">Continue with Apple</Text>
                            </>
                        )}
                    </TouchableOpacity>
                )}

                {/* Google Sign Up Button */}
                <TouchableOpacity
                    className={`flex-row items-center justify-center bg-white border border-gray-200 p-4 rounded-lg shadow-sm gap-2 ${googleLoading ? 'opacity-60' : ''} ${Platform.OS === 'ios' ? 'mt-3' : ''}`}
                    onPress={() => onOAuthSignUp('oauth_google')}
                    disabled={isLoading}
                >
                    {googleLoading ? (
                        <ActivityIndicator color="#000" />
                    ) : (
                        <>
                            <Image
                                source={{ uri: 'https://www.google.com/favicon.ico' }}
                                className="w-5 h-5"
                            />
                            <Text className="text-black text-base font-semibold">Continue with Google</Text>
                        </>
                    )}
                </TouchableOpacity>

                {/* Divider */}
                <View className="flex-row items-center my-6">
                    <View className="flex-1 h-[1px] bg-gray-200" />
                    <Text className="mx-4 text-gray-500 text-sm">or</Text>
                    <View className="flex-1 h-[1px] bg-gray-200" />
                </View>

                {/* Alternative sign up message */}
                <Text className="text-sm text-gray-500 text-center mb-4">
                    Sign up to access all features
                </Text>

                {/* Terms and Privacy */}
                <Text className="text-xs text-gray-500 text-center mt-4 leading-5">
                    By continuing, you agree to our{'\n'}
                    <Text onPress={() => router.push('/(legal)/terms-of-service')} className="text-blue-500 font-semibold">Terms of Service</Text> and{' '}
                    <Text onPress={() => router.push('/(legal)/privacy-policy')} className="text-blue-500 font-semibold">Privacy Policy</Text>
                </Text>
            </View>
        </View>
    );
}
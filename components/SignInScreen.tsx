import { useAuthActions } from "@convex-dev/auth/react";
import { LinearGradient } from 'expo-linear-gradient';
import * as WebBrowser from 'expo-web-browser';
import React from 'react';
import { Alert, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

// This is crucial for React Native OAuth
WebBrowser.maybeCompleteAuthSession();

export default function SignInScreen() {
    const { signIn } = useAuthActions();

    const handleSignIn = async (provider: "google" | "github") => {
        try {
            // Call signIn and get the redirect URL
            const result = await signIn(provider);

            // Check if we got a redirect URL (OAuth flow)
            if (result && 'redirect' in result && result.redirect) {
                // Convert URL object to string
                const redirectUrl = typeof result.redirect === 'string'
                    ? result.redirect
                    : result.redirect.toString();

                console.log('Opening URL:', redirectUrl);

                // Open the OAuth URL in the browser
                const authResult = await WebBrowser.openAuthSessionAsync(
                    redirectUrl,
                    null // Let the redirect handle it
                );

                if (authResult.type === 'success') {
                    console.log('Auth successful!');
                } else if (authResult.type === 'cancel') {
                    Alert.alert('Cancelled', 'Sign in was cancelled');
                }
            }
        } catch (error) {
            console.error("Sign in error:", error);
            Alert.alert("Sign In Error", "Failed to sign in. Please try again.");
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <LinearGradient
                colors={['#667eea', '#764ba2']}
                style={styles.gradient}
            >
                <View style={styles.content}>
                    {/* Logo/Icon Area */}
                    <View style={styles.logoContainer}>
                        <View style={styles.logoCircle}>
                            <Text style={styles.logoText}>🚀</Text>
                        </View>
                    </View>

                    {/* Title */}
                    <Text style={styles.title}>Welcome Back!</Text>
                    <Text style={styles.subtitle}>
                        Sign in to continue to your account
                    </Text>

                    {/* Sign In Buttons */}
                    <View style={styles.buttonsContainer}>
                        <TouchableOpacity
                            style={styles.button}
                            onPress={() => handleSignIn("google")}
                            activeOpacity={0.8}
                        >
                            <View style={styles.buttonContent}>
                                <Text style={styles.buttonIcon}>G</Text>
                                <Text style={styles.buttonText}>Continue with Google</Text>
                            </View>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.button, styles.buttonGithub]}
                            onPress={() => handleSignIn("github")}
                            activeOpacity={0.8}
                        >
                            <View style={styles.buttonContent}>
                                <Text style={styles.buttonIcon}>⚡</Text>
                                <Text style={[styles.buttonText, styles.buttonTextWhite]}>
                                    Continue with GitHub
                                </Text>
                            </View>
                        </TouchableOpacity>
                    </View>

                    {/* Footer */}
                    <Text style={styles.footerText}>
                        By continuing, you agree to our{'\n'}
                        <Text style={styles.link}>Terms of Service</Text> and{' '}
                        <Text style={styles.link}>Privacy Policy</Text>
                    </Text>
                </View>
            </LinearGradient>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    gradient: {
        flex: 1,
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 30,
    },
    logoContainer: {
        marginBottom: 40,
    },
    logoCircle: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: 'rgba(255, 255, 255, 0.3)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: 'rgba(255, 255, 255, 0.5)',
    },
    logoText: {
        fontSize: 50,
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 10,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 16,
        color: 'rgba(255, 255, 255, 0.9)',
        marginBottom: 50,
        textAlign: 'center',
    },
    buttonsContainer: {
        width: '100%',
        maxWidth: 350,
    },
    button: {
        backgroundColor: '#fff',
        borderRadius: 12,
        paddingVertical: 16,
        paddingHorizontal: 20,
        marginBottom: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    buttonGithub: {
        backgroundColor: '#24292e',
    },
    buttonContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    buttonIcon: {
        fontSize: 24,
        marginRight: 12,
    },
    buttonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#000',
    },
    buttonTextWhite: {
        color: '#fff',
    },
    footerText: {
        marginTop: 40,
        fontSize: 12,
        color: 'rgba(255, 255, 255, 0.8)',
        textAlign: 'center',
        lineHeight: 18,
    },
    link: {
        fontWeight: '600',
        textDecorationLine: 'underline',
    },
});
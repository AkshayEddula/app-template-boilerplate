import { Ionicons } from '@expo/vector-icons';
import { GlassView } from 'expo-glass-effect';
import { useRouter } from 'expo-router';
import React from 'react';
import { ScrollView, StatusBar, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function TermsOfServiceScreen() {
    const router = useRouter();

    return (
        <View className="flex-1 bg-[#3A7AFE]">
            <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

            <SafeAreaView className="flex-1" edges={['top']}>
                {/* Header */}
                <View className="px-6 py-4 flex-row items-center">
                    <TouchableOpacity
                        onPress={() => router.back()}
                        className="w-10 h-10 rounded-full bg-white/10 items-center justify-center mr-4"
                    >
                        <Ionicons name="arrow-back" size={24} color="white" />
                    </TouchableOpacity>
                    <Text className="text-white text-2xl font-clashdisplay-semibold">Terms of Service</Text>
                </View>

                <ScrollView
                    className="flex-1 px-6"
                    contentContainerStyle={{ paddingBottom: 40 }}
                    showsVerticalScrollIndicator={false}
                >
                    <GlassView
                        glassEffectStyle="regular"
                        tintColor="#3A7AFE"
                        style={{ borderRadius: 24, overflow: 'hidden', marginBottom: 20 }}
                    >
                        <View className="p-6 bg-white/5">
                            <Text className="text-white/60 text-xs font-generalsans-medium mb-6 uppercase tracking-wider">
                                Last updated: January 2026
                            </Text>

                            <Text className="text-white text-base font-generalsans-regular leading-7 mb-6">
                                By accessing and using Levora, you accept and agree to be bound by the terms and provisions of this agreement.
                            </Text>

                            <Section title="1. User Accounts">
                                <Text className="text-white/80 text-sm font-generalsans-regular leading-6 mb-2">
                                    You are responsible for maintaining the confidentiality of your account and password. You agree to accept responsibility for all activities that occur under your account.
                                </Text>
                            </Section>

                            <Section title="2. Use License">
                                <Text className="text-white/80 text-sm font-generalsans-regular leading-6 mb-2">
                                    Permission is granted to temporarily use the application for personal, non-commercial transitory viewing only.
                                </Text>
                            </Section>

                            <Section title="3. Prohibited Uses">
                                <Text className="text-white/80 text-sm font-generalsans-regular leading-6">
                                    You may not use the application for any illegal purpose or to violate any laws in your jurisdiction.
                                </Text>
                            </Section>

                            <Section title="4. Termination">
                                <Text className="text-white/80 text-sm font-generalsans-regular leading-6">
                                    We may terminate or suspend your account immediately, without prior notice, for any reason whatsoever, including violation of these Terms.
                                </Text>
                            </Section>

                            <Section title="5. Contact Us">
                                <Text className="text-white/80 text-sm font-generalsans-regular leading-6">
                                    Questions about the Terms of Service should be sent to:
                                </Text>
                                <Text className="text-white font-generalsans-semibold mt-2">
                                    support@levora.app
                                </Text>
                            </Section>

                        </View>
                    </GlassView>
                </ScrollView>
            </SafeAreaView>
        </View>
    );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <View className="mb-8">
            <Text className="text-white text-lg font-generalsans-semibold mb-3">{title}</Text>
            {children}
        </View>
    );
}
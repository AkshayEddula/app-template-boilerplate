import { Ionicons } from '@expo/vector-icons';
import { GlassView } from 'expo-glass-effect';
import { useRouter } from 'expo-router';
import React from 'react';
import { ScrollView, StatusBar, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function PrivacyPolicyScreen() {
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
                    <Text className="text-white text-2xl font-generalsans-semibold">Privacy Policy</Text>
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
                                Levora ("we", "our", or "us") respects your privacy. This Privacy Policy explains how we collect, use, and protect your information when you use the Levora mobile application.
                            </Text>

                            <Section title="1. Information We Collect">
                                <Text className="text-white/80 text-sm font-generalsans-regular leading-6 mb-2">
                                    Levora collects only the information necessary to provide its core functionality. This may include:
                                </Text>
                                <BulletPoint>Basic account information such as email address or a unique user identifier (if you choose to sign in)</BulletPoint>
                                <BulletPoint>User-created content including goals, habits, resolutions, progress data, and preferences</BulletPoint>
                                <BulletPoint>App usage and performance data to improve stability, functionality, and user experience</BulletPoint>
                            </Section>

                            <Section title="2. How We Use Your Information">
                                <Text className="text-white/80 text-sm font-generalsans-regular leading-6 mb-2">
                                    We use the information we collect to:
                                </Text>
                                <BulletPoint>Provide, operate, and maintain the Levora app</BulletPoint>
                                <BulletPoint>Save your progress and personalize your experience</BulletPoint>
                                <BulletPoint>Improve app features, performance, and reliability</BulletPoint>
                            </Section>

                            <Section title="3. Data Sharing">
                                <Text className="text-white/80 text-sm font-generalsans-regular leading-6">
                                    Levora does not sell, rent, or trade your personal information.
                                    We may share limited data with trusted service providers (such as authentication or cloud storage services) only as necessary to operate the app, or when required by law.
                                </Text>
                            </Section>

                            <Section title="4. Data Security">
                                <Text className="text-white/80 text-sm font-generalsans-regular leading-6">
                                    We implement reasonable technical and organizational measures to protect your information using industry-standard security practices.
                                </Text>
                            </Section>

                            <Section title="5. Children’s Privacy">
                                <Text className="text-white/80 text-sm font-generalsans-regular leading-6">
                                    Levora is not specifically intended for children under the age of 13. We do not knowingly collect personal data from children.
                                </Text>
                            </Section>

                            <Section title="6. Changes to This Privacy Policy">
                                <Text className="text-white/80 text-sm font-generalsans-regular leading-6">
                                    We may update this Privacy Policy from time to time. Any changes will be posted on this page with an updated revision date.
                                </Text>
                            </Section>

                            <Section title="7. Contact Us">
                                <Text className="text-white/80 text-sm font-generalsans-regular leading-6">
                                    If you have any questions or concerns about this Privacy Policy, you may contact us at:
                                </Text>
                                <Text className="text-white font-generalsans-semibold mt-2">
                                    Email: levora.contact@gmail.com
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

function BulletPoint({ children }: { children: React.ReactNode }) {
    return (
        <View className="flex-row mb-2 pl-2">
            <View className="w-1.5 h-1.5 rounded-full bg-white/60 mt-2 mr-3" />
            <Text className="text-white/80 text-sm font-generalsans-regular leading-6 flex-1">
                {children}
            </Text>
        </View>
    );
}

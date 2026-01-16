import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { setStatusBarStyle } from "expo-status-bar";
import React, { useCallback } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// Theme
const BG_COLOR = "#FAF9F6";
const TEXT_PRIMARY = "#1A1A1A";
const TEXT_SECONDARY = "#6B7280";
const ACCENT_ORANGE = "#F97316";

export default function PrivacyPolicyScreen() {
    const router = useRouter();

    useFocusEffect(
        useCallback(() => {
            setStatusBarStyle("dark");
        }, [])
    );

    return (
        <View style={styles.container}>
            <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                        <Ionicons name="chevron-back" size={22} color={TEXT_PRIMARY} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Privacy Policy</Text>
                    <View style={{ width: 44 }} />
                </View>

                <ScrollView
                    contentContainerStyle={{ padding: 20, paddingBottom: 60 }}
                    showsVerticalScrollIndicator={false}
                >
                    <View style={styles.card}>
                        <Text style={styles.date}>Last updated: January 2026</Text>

                        <Text style={styles.intro}>
                            Levora ("we", "our", or "us") respects your privacy. This Privacy Policy explains how
                            we collect, use, and protect your information when you use the Levora mobile
                            application.
                        </Text>

                        <Section title="1. Information We Collect">
                            <Text style={styles.text}>
                                Levora collects only the information necessary to provide its core functionality.
                                This may include:
                            </Text>
                            <Bullet>
                                Basic account information such as email address or a unique user identifier (if you
                                choose to sign in)
                            </Bullet>
                            <Bullet>
                                User-created content including goals, habits, resolutions, progress data, and
                                preferences
                            </Bullet>
                            <Bullet>
                                App usage and performance data to improve stability, functionality, and user
                                experience
                            </Bullet>
                        </Section>

                        <Section title="2. How We Use Your Information">
                            <Text style={styles.text}>We use the information we collect to:</Text>
                            <Bullet>Provide, operate, and maintain the Levora app</Bullet>
                            <Bullet>Save your progress and personalize your experience</Bullet>
                            <Bullet>Improve app features, performance, and reliability</Bullet>
                        </Section>

                        <Section title="3. Data Sharing">
                            <Text style={styles.text}>
                                Levora does not sell, rent, or trade your personal information. We may share limited
                                data with trusted service providers (such as authentication or cloud storage
                                services) only as necessary to operate the app, or when required by law.
                            </Text>
                        </Section>

                        <Section title="4. Data Security">
                            <Text style={styles.text}>
                                We implement reasonable technical and organizational measures to protect your
                                information using industry-standard security practices.
                            </Text>
                        </Section>

                        <Section title="5. Children's Privacy">
                            <Text style={styles.text}>
                                Levora is not specifically intended for children under the age of 13. We do not
                                knowingly collect personal data from children.
                            </Text>
                        </Section>

                        <Section title="6. Changes to This Privacy Policy">
                            <Text style={styles.text}>
                                We may update this Privacy Policy from time to time. Any changes will be posted on
                                this page with an updated revision date.
                            </Text>
                        </Section>

                        <Section title="7. Contact Us" isLast>
                            <Text style={styles.text}>
                                If you have any questions or concerns about this Privacy Policy, you may contact us
                                at:
                            </Text>
                            <Text style={styles.email}>conatactlevora@gmail.com</Text>
                        </Section>
                    </View>
                </ScrollView>
            </SafeAreaView>
        </View>
    );
}

function Section({
    title,
    children,
    isLast,
}: {
    title: string;
    children: React.ReactNode;
    isLast?: boolean;
}) {
    return (
        <View style={[styles.section, !isLast && styles.sectionBorder]}>
            <Text style={styles.sectionTitle}>{title}</Text>
            {children}
        </View>
    );
}

function Bullet({ children }: { children: React.ReactNode }) {
    return (
        <View style={styles.bulletRow}>
            <View style={styles.bulletDot} />
            <Text style={[styles.text, { flex: 1 }]}>{children}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: BG_COLOR,
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 20,
        paddingTop: 8,
        paddingBottom: 16,
    },
    backBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: "#F3F4F6",
        alignItems: "center",
        justifyContent: "center",
    },
    headerTitle: {
        fontFamily: "Nunito-Bold",
        fontSize: 20,
        color: TEXT_PRIMARY,
    },
    card: {
        backgroundColor: "#FFFFFF",
        borderRadius: 24,
        padding: 24,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
        elevation: 2,
    },
    date: {
        fontFamily: "Nunito-Medium",
        fontSize: 12,
        color: TEXT_SECONDARY,
        marginBottom: 16,
    },
    intro: {
        fontFamily: "Nunito-Medium",
        fontSize: 15,
        color: TEXT_PRIMARY,
        lineHeight: 24,
        marginBottom: 24,
    },
    section: {
        paddingBottom: 20,
        marginBottom: 20,
    },
    sectionBorder: {
        borderBottomWidth: 1,
        borderBottomColor: "#F3F4F6",
    },
    sectionTitle: {
        fontFamily: "Nunito-Bold",
        fontSize: 16,
        color: TEXT_PRIMARY,
        marginBottom: 10,
    },
    text: {
        fontFamily: "Nunito-Medium",
        fontSize: 14,
        color: TEXT_SECONDARY,
        lineHeight: 22,
    },
    bulletRow: {
        flexDirection: "row",
        marginTop: 8,
        paddingLeft: 4,
    },
    bulletDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: ACCENT_ORANGE,
        marginTop: 8,
        marginRight: 12,
    },
    email: {
        fontFamily: "Nunito-Bold",
        fontSize: 15,
        color: ACCENT_ORANGE,
        marginTop: 12,
    },
});

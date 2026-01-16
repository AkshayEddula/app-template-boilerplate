import { LockedView } from "@/components/LockedView";
import { PaywallModal } from "@/components/Paywall";
import { useSubscription } from "@/context/SubscriptionContext";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@clerk/clerk-expo";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "convex/react";
import { BlurView } from "expo-blur";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useMemo, useState } from "react";
import { Dimensions, FlatList, Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Animated, { Easing, FadeInDown, FadeOut, Layout } from "react-native-reanimated";
import { CharacterCard } from "./CharacterCard";

// Theme Colors - matching home screen
const BG_COLOR = "#FAF9F6";
const TEXT_PRIMARY = "#1A1A1A";
const TEXT_SECONDARY = "#6B7280";
const ACCENT_ORANGE = "#F97316";

const SCREEN_WIDTH = Dimensions.get('window').width;
const SCREEN_HEIGHT = Dimensions.get('window').height;

const FILTERS = [
    { id: 'all', label: 'All', icon: '✨' },
    { id: 'health', label: 'Health', icon: '💧' },
    { id: 'mind', label: 'Mind', icon: '🧘' },
    { id: 'career', label: 'Career', icon: '💼' },
    { id: 'life', label: 'Life', icon: '🌟' },
    { id: 'fun', label: 'Fun', icon: '🎮' },
] as const;

export const CollectionModal = ({ visible, onClose }: { visible: boolean, onClose: () => void }) => {
    const stats = useQuery(api.stats.getMyStats) || [];
    const [activeFilter, setActiveFilter] = useState<string>('all');

    const filteredData = useMemo(() => {
        if (activeFilter === 'all') return stats;
        return stats.filter(s => s.categoryKey === activeFilter);
    }, [stats, activeFilter]);

    const { isPremium } = useSubscription();
    const { isSignedIn } = useAuth();
    const router = useRouter();
    const [paywallVisible, setPaywallVisible] = useState(false);

    const isLocked = !isPremium || !isSignedIn;

    const handleUnlock = () => {
        if (!isPremium) {
            setPaywallVisible(true);
        } else if (!isSignedIn) {
            onClose();
            router.push('/(auth)/sign-up');
        }
    };

    const getLockedState = () => {
        if (!isPremium) {
            return {
                message: "Upgrade to Premium to view your card collection.",
                buttonText: "Unlock Access"
            };
        }
        if (!isSignedIn) {
            return {
                message: "Sign in to save and view your collected cards.",
                buttonText: "Sign In / Register"
            };
        }
        return { message: "Locked", buttonText: "Unlock" };
    };

    const { message, buttonText } = getLockedState();

    return (
        <Modal animationType="slide" transparent={true} visible={visible} onRequestClose={onClose}>
            <StatusBar style="light" />

            {/* Blur Background */}
            <View style={StyleSheet.absoluteFill}>
                <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFill} />
                <TouchableOpacity
                    style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' }}
                    onPress={onClose}
                    activeOpacity={1}
                />
            </View>

            {/* Bottom Sheet */}
            <View style={styles.sheet}>
                {/* Handle */}
                <View style={styles.handleContainer}>
                    <View style={styles.handle} />
                </View>

                {/* Header */}
                <View style={styles.header}>
                    <View>
                        <Text style={styles.title}>Vault</Text>
                        <Text style={styles.subtitle}>
                            {stats.length} cards unlocked 📦
                        </Text>
                    </View>
                    <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                        <Ionicons name="close" size={22} color={TEXT_PRIMARY} />
                    </TouchableOpacity>
                </View>

                {/* Filter Pills */}
                <View style={styles.filterContainer}>
                    <FlatList
                        data={FILTERS}
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={{ paddingHorizontal: 20, gap: 8 }}
                        keyExtractor={(item) => item.id}
                        renderItem={({ item }) => {
                            const isActive = activeFilter === item.id;
                            return (
                                <TouchableOpacity
                                    onPress={() => setActiveFilter(item.id)}
                                    activeOpacity={0.7}
                                    style={[styles.filterPill, isActive && styles.filterPillActive]}
                                >
                                    <Text style={{ fontSize: 14 }}>{item.icon}</Text>
                                    <Text style={[styles.filterText, isActive && styles.filterTextActive]}>
                                        {item.label}
                                    </Text>
                                </TouchableOpacity>
                            );
                        }}
                    />
                </View>

                {/* Lock View */}
                {isLocked && (
                    <LockedView
                        onUnlock={handleUnlock}
                        message={message}
                        buttonText={buttonText}
                    />
                )}

                {/* Cards Grid */}
                <View style={{ flex: 1 }}>
                    <FlatList
                        data={filteredData}
                        keyExtractor={(item) => item.categoryKey}
                        key={activeFilter}
                        numColumns={2}
                        contentContainerStyle={{
                            paddingTop: 16,
                            paddingBottom: 40,
                            paddingHorizontal: 16,
                        }}
                        columnWrapperStyle={{
                            gap: 12,
                            marginBottom: 12,
                            justifyContent: 'space-between',
                        }}
                        showsVerticalScrollIndicator={false}
                        renderItem={({ item, index }) => (
                            <Animated.View
                                layout={Layout.duration(400).easing(Easing.out(Easing.cubic))}
                                entering={FadeInDown.delay(index * 50).duration(400).easing(Easing.out(Easing.cubic))}
                                exiting={FadeOut.duration(200)}
                                style={{ width: (SCREEN_WIDTH - 44) / 2 }}
                            >
                                <CharacterCard
                                    imageUrl={item.imageUrl}
                                    categoryKey={item.categoryKey}
                                    xp={item.totalXp}
                                />
                            </Animated.View>
                        )}
                        ListEmptyComponent={
                            <View style={styles.emptyState}>
                                <View style={styles.emptyIcon}>
                                    <Text style={{ fontSize: 32 }}>📦</Text>
                                </View>
                                <Text style={styles.emptyTitle}>Empty Vault</Text>
                                <Text style={styles.emptySubtitle}>
                                    Complete goals to unlock cards!
                                </Text>
                            </View>
                        }
                    />
                </View>
            </View>

            <PaywallModal
                visible={paywallVisible}
                onClose={() => setPaywallVisible(false)}
            />
        </Modal>
    );
};

const styles = StyleSheet.create({
    sheet: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: SCREEN_HEIGHT * 0.9,
        backgroundColor: BG_COLOR,
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        overflow: 'hidden',
    },
    handleContainer: {
        alignItems: 'center',
        paddingVertical: 12,
    },
    handle: {
        width: 40,
        height: 4,
        backgroundColor: '#D1D5DB',
        borderRadius: 2,
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
        paddingHorizontal: 20,
        paddingBottom: 16,
    },
    title: {
        fontFamily: "Nunito-Bold",
        fontSize: 28,
        color: TEXT_PRIMARY,
    },
    subtitle: {
        fontFamily: "Nunito-Medium",
        fontSize: 14,
        color: TEXT_SECONDARY,
        marginTop: 2,
    },
    closeButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: "#F3F4F6",
        alignItems: "center",
        justifyContent: "center",
    },
    filterContainer: {
        marginBottom: 8,
    },
    filterPill: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 999,
        backgroundColor: "#FFFFFF",
        borderWidth: 1,
        borderColor: "#E5E7EB",
    },
    filterPillActive: {
        backgroundColor: TEXT_PRIMARY,
        borderColor: TEXT_PRIMARY,
    },
    filterText: {
        fontFamily: "Nunito-SemiBold",
        fontSize: 14,
        color: TEXT_SECONDARY,
    },
    filterTextActive: {
        color: "#FFFFFF",
    },
    emptyState: {
        alignItems: "center",
        justifyContent: "center",
        paddingTop: 80,
    },
    emptyIcon: {
        width: 80,
        height: 80,
        borderRadius: 24,
        backgroundColor: "#F3F4F6",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 16,
    },
    emptyTitle: {
        fontFamily: "Nunito-Bold",
        fontSize: 18,
        color: TEXT_PRIMARY,
        marginBottom: 4,
    },
    emptySubtitle: {
        fontFamily: "Nunito-Medium",
        fontSize: 14,
        color: TEXT_SECONDARY,
    },
});
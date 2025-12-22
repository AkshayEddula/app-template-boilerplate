import { api } from "@/convex/_generated/api";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "convex/react";
import { BlurView } from "expo-blur";
import { GlassView } from "expo-glass-effect";
import { useMemo, useState } from "react";
import { Dimensions, FlatList, Modal, Platform, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Animated, { Easing, FadeInDown, FadeOut, Layout } from "react-native-reanimated";
import { CharacterCard } from "./CharacterCard";

const SCREEN_WIDTH = Dimensions.get('window').width;

const FILTERS = [
    { id: 'all', label: 'All', icon: 'layers' },
    { id: 'health', label: 'Health', icon: 'heart' },
    { id: 'mind', label: 'Mind', icon: 'prism' },
    { id: 'career', label: 'Career', icon: 'briefcase' },
    { id: 'life', label: 'Life', icon: 'compass' },
    { id: 'fun', label: 'Fun', icon: 'sparkles' },
] as const;

export const CollectionModal = ({ visible, onClose }: { visible: boolean, onClose: () => void }) => {
    const stats = useQuery(api.stats.getMyStats) || [];
    const [activeFilter, setActiveFilter] = useState<string>('all');

    const filteredData = useMemo(() => {
        if (activeFilter === 'all') return stats;
        return stats.filter(s => s.categoryKey === activeFilter);
    }, [stats, activeFilter]);

    const ORIGINAL_CARD_WIDTH = SCREEN_WIDTH * 0.85;
    const PADDING = 16;
    const AVAILABLE_WIDTH = SCREEN_WIDTH - (PADDING * 2);
    const SCALE_FACTOR = Math.min(1, AVAILABLE_WIDTH / ORIGINAL_CARD_WIDTH);

    return (
        <Modal animationType="slide" transparent={true} visible={visible} onRequestClose={onClose}>

            {/* 1. Backdrop */}
            <View style={StyleSheet.absoluteFill}>
                <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFill} />
                <TouchableOpacity style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' }} onPress={onClose} activeOpacity={1} />
            </View>

            {/* 2. Main Modal Sheet */}
            <Animated.View
                entering={FadeInDown.duration(400).easing(Easing.out(Easing.cubic))}
                style={{
                    position: 'absolute',
                    bottom: 10,
                    left: 5,
                    right: 5,
                    height: '85%',
                    backgroundColor: Platform.OS === 'android' ? '#3A7AFE' : 'transparent',
                    // --- FIX START ---
                    borderRadius: 40,      // Ensures the container itself is rounded
                    overflow: 'hidden',    // Clips content (cards) that scrolls past the rounded corners
                    // --- FIX END ---
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 10 },
                    shadowOpacity: 0.4,
                    shadowRadius: 30,
                    elevation: 10,
                }}
            >
                {/* --- GLASS BACKGROUND LAYER --- */}
                {Platform.OS === 'ios' && (
                    <GlassView
                        style={{
                            ...StyleSheet.absoluteFillObject,
                            borderRadius: 40,
                            overflow: 'hidden',
                        }}
                        glassEffectStyle="regular"
                        tintColor="#3A7AFE"
                    />
                )}

                {/* --- HEADER SECTION --- */}
                <View className="z-20 pt-8 pb-4">

                    {/* Top Row: Badge & Close Button */}
                    <View className="px-6 flex-row justify-between items-start mb-2">
                        {/* Glass Badge */}
                        <View style={{
                            backgroundColor: 'rgba(255,255,255,0.15)',
                            paddingHorizontal: 10,
                            paddingVertical: 4,
                            borderRadius: 12,
                            borderWidth: 1,
                            borderColor: 'rgba(255,255,255,0.2)',
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: 6
                        }}>
                            <Ionicons name="grid" size={10} color="rgba(255,255,255,0.9)" />
                            <Text className="text-white/90 font-generalsans-bold text-[10px] uppercase tracking-wide">
                                My Collection
                            </Text>
                        </View>

                        {/* Glass Orb Close Button */}
                        <TouchableOpacity
                            onPress={onClose}
                            style={{
                                width: 36,
                                height: 36,
                                borderRadius: 18,
                                backgroundColor: 'rgba(255,255,255,0.1)',
                                alignItems: 'center',
                                justifyContent: 'center',
                                borderWidth: 1,
                                borderColor: 'rgba(255,255,255,0.15)'
                            }}
                        >
                            <Ionicons name="close" size={20} color="white" />
                        </TouchableOpacity>
                    </View>

                    {/* Title Row */}
                    <View className="px-6 mb-6">
                        <Text className="text-white font-generalsans-bold text-5xl tracking-tighter" style={{
                            textShadowColor: 'rgba(0,0,0,0.1)',
                            textShadowOffset: { width: 0, height: 2 },
                            textShadowRadius: 4
                        }}>
                            Vault
                        </Text>
                        <Text className="text-white/60 font-generalsans-medium text-sm mt-1">
                            {stats.length} cards unlocked
                        </Text>
                    </View>

                    {/* Awesome Filter Bar */}
                    <View>
                        <FlatList
                            data={FILTERS}
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={{ paddingHorizontal: 16, gap: 6 }}
                            keyExtractor={(item) => item.id}
                            renderItem={({ item }) => {
                                const isActive = activeFilter === item.id;

                                const bgStyle = isActive
                                    ? {
                                        backgroundColor: '#FFFFFF',
                                        shadowColor: "#000",
                                        shadowOffset: { width: 0, height: 2 },
                                        shadowOpacity: 0.1,
                                        shadowRadius: 4,
                                        elevation: 2,
                                    }
                                    : { backgroundColor: 'rgba(255,255,255,0.1)' };

                                const borderStyle = isActive
                                    ? { borderColor: '#FFFFFF', borderWidth: 0 }
                                    : { borderColor: 'rgba(255,255,255,0.15)', borderWidth: 1 };

                                return (
                                    <TouchableOpacity
                                        onPress={() => setActiveFilter(item.id)}
                                        activeOpacity={0.8}
                                        style={{
                                            ...bgStyle,
                                            ...borderStyle,
                                            paddingVertical: 12,
                                            paddingHorizontal: 20,
                                            borderRadius: 100,
                                            flexDirection: 'row',
                                            alignItems: 'center',
                                            gap: 8,
                                        }}
                                    >
                                        <Ionicons
                                            name={item.icon as any}
                                            size={16}
                                            color={isActive ? '#3A7AFE' : 'rgba(255,255,255,0.8)'}
                                        />
                                        <Text
                                            style={{
                                                color: isActive ? '#3A7AFE' : 'rgba(255,255,255,0.9)',
                                                fontFamily: isActive ? 'GeneralSans-Bold' : 'GeneralSans-Medium',
                                                fontSize: 14,
                                                letterSpacing: -0.3
                                            }}
                                        >
                                            {item.label}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            }}
                        />
                    </View>
                </View>

                {/* --- CONTENT --- */}
                {/* Wrapped in Flex 1 to ensure list respects container height */}
                <View style={{ flex: 1 }}>
                    <FlatList
                        data={filteredData}
                        keyExtractor={(item) => item.categoryKey}
                        contentContainerStyle={{
                            paddingTop: 10,
                            paddingBottom: 80,
                            paddingHorizontal: PADDING,
                            alignItems: 'center',
                            gap: 24,
                        }}
                        showsVerticalScrollIndicator={false}
                        renderItem={({ item, index }) => (
                            <Animated.View
                                layout={Layout.duration(400).easing(Easing.out(Easing.cubic))}
                                entering={FadeInDown
                                    .delay(index * 35)
                                    .duration(450)
                                    .easing(Easing.out(Easing.cubic))}
                                exiting={FadeOut.duration(200)}
                            >
                                <CharacterCard
                                    categoryKey={item.categoryKey}
                                    xp={item.totalXp}
                                    scale={SCALE_FACTOR}
                                />
                            </Animated.View>
                        )}
                        ListEmptyComponent={
                            <View className="items-center justify-center mt-20 opacity-60">
                                <View className="w-16 h-16 rounded-full bg-white/10 items-center justify-center mb-4 border border-white/10">
                                    <Ionicons name="file-tray-outline" size={28} color="white" />
                                </View>
                                <Text className="text-white font-generalsans-medium text-base">
                                    Empty Vault
                                </Text>
                            </View>
                        }
                    />
                </View>
            </Animated.View>
        </Modal>
    );
};
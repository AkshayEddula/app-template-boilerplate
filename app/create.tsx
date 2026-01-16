import { PaywallModal } from "@/components/Paywall";
import { useGuest } from '@/context/GuestContext';
import { useSubscription } from "@/context/SubscriptionContext";
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery } from 'convex/react';
import { useRouter } from 'expo-router';
import { setStatusBarStyle } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import Animated, {
    FadeInUp
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

// Theme Colors
const BG_COLOR = "#FAF9F6";
const TEXT_PRIMARY = "#1A1A1A";
const TEXT_SECONDARY = "#6B7280";
const ACCENT_ORANGE = "#F97316";

// Category configuration
const CATEGORY_CONFIG: Record<string, { emoji: string; color: string; bg: string }> = {
    health: { emoji: "💧", color: "#10B981", bg: "#ECFDF5" },
    mind: { emoji: "🧘", color: "#8B5CF6", bg: "#F5F3FF" },
    career: { emoji: "💼", color: "#3B82F6", bg: "#EFF6FF" },
    life: { emoji: "🌟", color: "#F59E0B", bg: "#FFFBEB" },
    fun: { emoji: "🎮", color: "#EC4899", bg: "#FDF2F8" },
};

// Day Selector Component
const DaySelector = ({ selectedDays = [], toggleDay, setCustomDays }: {
    selectedDays: number[],
    toggleDay: (d: number) => void,
    setCustomDays: (days: number[]) => void
}) => {
    const days = [
        { l: 'S', v: 0 }, { l: 'M', v: 1 }, { l: 'T', v: 2 },
        { l: 'W', v: 3 }, { l: 'T', v: 4 }, { l: 'F', v: 5 }, { l: 'S', v: 6 }
    ];

    return (
        <Animated.View entering={FadeInUp.duration(200)} style={{ marginTop: 12 }}>
            <View style={styles.daysRow}>
                {days.map((day) => {
                    const isSelected = selectedDays.includes(day.v);
                    return (
                        <TouchableOpacity
                            key={day.v}
                            onPress={() => toggleDay(day.v)}
                            activeOpacity={0.7}
                            style={[styles.dayCircle, isSelected && styles.dayCircleSelected]}
                        >
                            <Text style={[styles.dayText, isSelected && styles.dayTextSelected]}>
                                {day.l}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </View>
            <TouchableOpacity onPress={() => setCustomDays([1, 3, 5])} style={styles.presetButton}>
                <Text style={styles.presetText}>⚡ Mon/Wed/Fri</Text>
            </TouchableOpacity>
        </Animated.View>
    );
};

// --- Main Screen ---
export default function CreateResolution() {
    const router = useRouter();

    useEffect(() => {
        setStatusBarStyle("dark");
    }, []);

    const categories = useQuery(api.categories.list);
    const createResolution = useMutation(api.userResolutions.create);
    const { isGuest, addGuestResolution, guestResolutions } = useGuest();
    const { isPremium } = useSubscription();
    const resolutions = useQuery(api.userResolutions.listActive);
    const [paywallVisible, setPaywallVisible] = useState(false);

    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
    const [title, setTitle] = useState('');
    const [frequency, setFrequency] = useState('daily');
    const [customDays, setCustomDays] = useState<number[]>([]);
    const [trackingType, setTrackingType] = useState('yes_no');
    const [targetValue, setTargetValue] = useState('30');
    const [countUnit, setCountUnit] = useState('times');
    const [submitting, setSubmitting] = useState(false);

    const templates = useQuery(
        api.resolutionTemplates.listByCategory,
        selectedCategory ? { categoryKey: selectedCategory } : "skip"
    );

    const toggleCustomDay = (day: number) => {
        setCustomDays(prev =>
            prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day].sort()
        );
    };

    const handleSelectTemplate = (template: any) => {
        setSelectedTemplateId(template._id);
        setTitle(template.title);
        setFrequency(template.suggestedFrequency || 'daily');
        setTrackingType(template.trackingType || 'yes_no');
        if (template.trackingType === 'time_based') {
            setTargetValue(String(template.suggestedTargetTime || 30));
        } else if (template.trackingType === 'count_based') {
            setTargetValue(String(template.suggestedTargetCount || 10));
            setCountUnit(template.suggestedCountUnit || 'times');
        }
    };

    const handleCreate = async () => {
        const currentCount = isGuest ? guestResolutions.length : (resolutions?.length || 0);
        if (!isPremium && currentCount >= 2) {
            setPaywallVisible(true);
            return;
        }
        if (!selectedCategory) return Alert.alert("Oops", "Pick a focus area first!");
        if (!title.trim()) return Alert.alert("Oops", "Give your goal a name!");

        setSubmitting(true);
        let finalDays: number[] = [];
        if (frequency === 'daily') finalDays = [0, 1, 2, 3, 4, 5, 6];
        else if (frequency === 'weekdays') finalDays = [1, 2, 3, 4, 5];
        else if (frequency === 'weekends') finalDays = [0, 6];
        else finalDays = customDays;

        try {
            if (isGuest) {
                await addGuestResolution({
                    categoryKey: selectedCategory,
                    title,
                    trackingType: trackingType as any,
                    frequencyType: frequency as any,
                    customDays: finalDays,
                    targetCount: trackingType === 'count_based' ? parseInt(targetValue) : undefined,
                    targetTime: trackingType === 'time_based' ? parseInt(targetValue) : undefined,
                    countUnit: trackingType === 'count_based' ? countUnit : undefined,
                });
                router.back();
                return;
            }

            await createResolution({
                categoryKey: selectedCategory,
                title,
                trackingType: trackingType as any,
                frequencyType: frequency as any,
                customDays: finalDays,
                targetCount: trackingType === 'count_based' ? parseInt(targetValue) : undefined,
                targetTime: trackingType === 'time_based' ? parseInt(targetValue) : undefined,
                countUnit: trackingType === 'count_based' ? countUnit : undefined,
                isActive: true,
                templateId: selectedTemplateId ? (selectedTemplateId as Id<"resolutionTemplates">) : undefined,
            });
            router.back();
        } catch (e) {
            Alert.alert("Error", "Something went wrong!");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <View style={styles.container}>
            <SafeAreaView style={{ flex: 1 }} edges={['top']}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
                        <Ionicons name="close" size={24} color={TEXT_PRIMARY} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>New Goal ✨</Text>
                    <View style={{ width: 48 }} />
                </View>

                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
                    <ScrollView
                        style={{ flex: 1 }}
                        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 140 }}
                        showsVerticalScrollIndicator={false}
                    >
                        {/* FOCUS AREA */}
                        <Text style={styles.label}>🎯 Focus Area</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -20 }}>
                            <View style={styles.categoryRow}>
                                {categories?.map((cat: any) => {
                                    const config = CATEGORY_CONFIG[cat.key] || { emoji: "✨", color: ACCENT_ORANGE, bg: "#FFF7ED" };
                                    const isSelected = selectedCategory === cat.key;
                                    return (
                                        <TouchableOpacity
                                            key={cat.key}
                                            onPress={() => { setSelectedCategory(cat.key); setSelectedTemplateId(null); }}
                                            style={[
                                                styles.categoryPill,
                                                isSelected && { backgroundColor: config.color, borderColor: config.color }
                                            ]}
                                            activeOpacity={0.7}
                                        >
                                            <Text style={{ fontSize: 20 }}>{config.emoji}</Text>
                                            <Text style={[styles.categoryText, isSelected && { color: '#FFF' }]}>
                                                {cat.name}
                                            </Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                        </ScrollView>

                        {/* TEMPLATES */}
                        {selectedCategory && templates && templates.length > 0 && (
                            <>
                                <Text style={styles.label}>⚡ Quick Pick</Text>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -20 }}>
                                    <View style={styles.templateRow}>
                                        <TouchableOpacity
                                            onPress={() => { setSelectedTemplateId(null); setTitle(''); }}
                                            style={[styles.templatePill, !selectedTemplateId && styles.templatePillActive]}
                                        >
                                            <Text style={{ fontSize: 16 }}>✏️</Text>
                                            <Text style={[styles.templateText, !selectedTemplateId && { color: '#FFF' }]}>Custom</Text>
                                        </TouchableOpacity>
                                        {templates.map((t: any) => (
                                            <TouchableOpacity
                                                key={t._id}
                                                onPress={() => handleSelectTemplate(t)}
                                                style={[styles.templatePill, selectedTemplateId === t._id && styles.templatePillActive]}
                                            >
                                                <Text style={{ fontSize: 16 }}>💡</Text>
                                                <Text numberOfLines={1} style={[styles.templateText, selectedTemplateId === t._id && { color: '#FFF' }]}>
                                                    {t.title}
                                                </Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                </ScrollView>
                            </>
                        )}

                        {/* GOAL TITLE */}
                        <Text style={styles.label}>📝 Goal Name</Text>
                        <View style={styles.inputContainer}>
                            <TextInput
                                placeholder="What's your goal?"
                                placeholderTextColor={TEXT_SECONDARY}
                                value={title}
                                onChangeText={(t) => { setTitle(t); setSelectedTemplateId(null); }}
                                style={styles.input}
                            />
                        </View>

                        {/* FREQUENCY */}
                        <Text style={styles.label}>📅 How Often?</Text>
                        <View style={styles.frequencyGrid}>
                            {[
                                { k: 'daily', l: 'Daily', e: '�' },
                                { k: 'weekdays', l: 'Weekdays', e: '💼' },
                                { k: 'weekends', l: 'Weekends', e: '🌴' },
                                { k: 'custom', l: 'Custom', e: '⚙️' },
                            ].map((f) => (
                                <TouchableOpacity
                                    key={f.k}
                                    onPress={() => setFrequency(f.k)}
                                    style={[styles.freqPill, frequency === f.k && styles.freqPillActive]}
                                    activeOpacity={0.7}
                                >
                                    <Text style={{ fontSize: 18 }}>{f.e}</Text>
                                    <Text style={[styles.freqText, frequency === f.k && { color: '#FFF' }]}>{f.l}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                        {frequency === 'custom' && (
                            <DaySelector selectedDays={customDays} toggleDay={toggleCustomDay} setCustomDays={setCustomDays} />
                        )}

                        {/* TRACKING */}
                        <Text style={styles.label}>📊 Track By</Text>
                        <View style={styles.trackingGrid}>
                            {[
                                { k: 'yes_no', l: 'Check-in', e: '✅' },
                                { k: 'count_based', l: 'Count', e: '🔢' },
                                { k: 'time_based', l: 'Timer', e: '⏱️' },
                            ].map((t) => (
                                <TouchableOpacity
                                    key={t.k}
                                    onPress={() => setTrackingType(t.k)}
                                    style={[styles.trackPill, trackingType === t.k && styles.trackPillActive]}
                                    activeOpacity={0.7}
                                >
                                    <Text style={{ fontSize: 26 }}>{t.e}</Text>
                                    <Text style={[styles.trackText, trackingType === t.k && styles.trackTextActive]}>{t.l}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        {/* TARGET */}
                        {trackingType !== 'yes_no' && (
                            <Animated.View entering={FadeInUp.duration(200)} style={styles.targetContainer}>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.miniLabel}>{trackingType === 'time_based' ? 'Minutes' : 'Target'}</Text>
                                    <View style={styles.targetInput}>
                                        <TextInput
                                            keyboardType="numeric"
                                            value={targetValue}
                                            onChangeText={setTargetValue}
                                            style={styles.targetText}
                                        />
                                    </View>
                                </View>
                                {trackingType === 'count_based' && (
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.miniLabel}>Unit</Text>
                                        <View style={styles.targetInput}>
                                            <TextInput
                                                placeholder="cups"
                                                placeholderTextColor={TEXT_SECONDARY}
                                                value={countUnit}
                                                onChangeText={setCountUnit}
                                                style={styles.targetText}
                                            />
                                        </View>
                                    </View>
                                )}
                            </Animated.View>
                        )}
                    </ScrollView>
                </KeyboardAvoidingView>

                {/* CREATE BUTTON */}
                <View style={styles.footer}>
                    <TouchableOpacity
                        onPress={handleCreate}
                        disabled={submitting}
                        style={[styles.createBtn, (!selectedCategory || !title.trim()) && styles.createBtnDisabled]}
                        activeOpacity={0.8}
                    >
                        {submitting ? (
                            <ActivityIndicator color="#FFF" />
                        ) : (
                            <>
                                <Text style={styles.createText}>Create Goal</Text>
                                <Text style={{ fontSize: 20 }}>🚀</Text>
                            </>
                        )}
                    </TouchableOpacity>
                </View>
            </SafeAreaView>

            <PaywallModal visible={paywallVisible} onClose={() => setPaywallVisible(false)} />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: BG_COLOR },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 12,
    },
    closeBtn: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#F3F4F6',
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        fontFamily: 'Nunito-Bold',
        fontSize: 22,
        color: TEXT_PRIMARY,
    },
    label: {
        fontFamily: 'Nunito-Bold',
        fontSize: 15,
        color: TEXT_PRIMARY,
        marginTop: 24,
        marginBottom: 12,
    },
    miniLabel: {
        fontFamily: 'Nunito-SemiBold',
        fontSize: 12,
        color: TEXT_SECONDARY,
        marginBottom: 8,
    },

    // Categories
    categoryRow: {
        flexDirection: 'row',
        gap: 10,
        paddingHorizontal: 20,
    },
    categoryPill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: '#FFFFFF',
        paddingVertical: 14,
        paddingHorizontal: 20,
        borderRadius: 999,
        borderWidth: 2,
        borderColor: '#E5E7EB',
    },
    categoryText: {
        fontFamily: 'Nunito-Bold',
        fontSize: 14,
        color: TEXT_PRIMARY,
    },

    // Templates
    templateRow: {
        flexDirection: 'row',
        gap: 10,
        paddingHorizontal: 20,
    },
    templatePill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: '#FFFFFF',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 999,
        borderWidth: 2,
        borderColor: '#E5E7EB',
    },
    templatePillActive: {
        backgroundColor: ACCENT_ORANGE,
        borderColor: ACCENT_ORANGE,
    },
    templateText: {
        fontFamily: 'Nunito-Bold',
        fontSize: 13,
        color: TEXT_PRIMARY,
    },

    // Input
    inputContainer: {
        backgroundColor: '#FFFFFF',
        borderRadius: 999,
        borderWidth: 2,
        borderColor: '#E5E7EB',
    },
    input: {
        fontFamily: 'Nunito-SemiBold',
        fontSize: 16,
        color: TEXT_PRIMARY,
        paddingHorizontal: 24,
        paddingVertical: 18,
    },

    // Frequency
    frequencyGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    freqPill: {
        width: '48%',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: '#FFFFFF',
        paddingVertical: 16,
        borderRadius: 999,
        borderWidth: 2,
        borderColor: '#E5E7EB',
    },
    freqPillActive: {
        backgroundColor: TEXT_PRIMARY,
        borderColor: TEXT_PRIMARY,
    },
    freqText: {
        fontFamily: 'Nunito-Bold',
        fontSize: 14,
        color: TEXT_PRIMARY,
    },

    // Day selector
    daysRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        backgroundColor: '#FFFFFF',
        borderRadius: 999,
        padding: 6,
        borderWidth: 2,
        borderColor: '#E5E7EB',
    },
    dayCircle: {
        width: 42,
        height: 42,
        borderRadius: 21,
        alignItems: 'center',
        justifyContent: 'center',
    },
    dayCircleSelected: {
        backgroundColor: ACCENT_ORANGE,
    },
    dayText: {
        fontFamily: 'Nunito-Bold',
        fontSize: 14,
        color: TEXT_SECONDARY,
    },
    dayTextSelected: {
        color: '#FFFFFF',
    },
    presetButton: {
        marginTop: 10,
        backgroundColor: '#FFFFFF',
        borderRadius: 999,
        paddingVertical: 14,
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#E5E7EB',
    },
    presetText: {
        fontFamily: 'Nunito-SemiBold',
        fontSize: 13,
        color: TEXT_SECONDARY,
    },

    // Tracking
    trackingGrid: {
        flexDirection: 'row',
        gap: 10,
    },
    trackPill: {
        flex: 1,
        alignItems: 'center',
        gap: 8,
        backgroundColor: '#FFFFFF',
        paddingVertical: 20,
        borderRadius: 24,
        borderWidth: 2,
        borderColor: '#E5E7EB',
    },
    trackPillActive: {
        backgroundColor: '#FFF7ED',
        borderColor: ACCENT_ORANGE,
    },
    trackText: {
        fontFamily: 'Nunito-Bold',
        fontSize: 12,
        color: TEXT_SECONDARY,
    },
    trackTextActive: {
        color: ACCENT_ORANGE,
    },

    // Target
    targetContainer: {
        flexDirection: 'row',
        gap: 14,
        marginTop: 16,
    },
    targetInput: {
        backgroundColor: '#FFFFFF',
        borderRadius: 999,
        borderWidth: 2,
        borderColor: '#E5E7EB',
    },
    targetText: {
        fontFamily: 'Nunito-Bold',
        fontSize: 22,
        color: TEXT_PRIMARY,
        textAlign: 'center',
        paddingVertical: 16,
    },

    // Footer
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        paddingHorizontal: 20,
        paddingBottom: 36,
        paddingTop: 16,
        backgroundColor: BG_COLOR,
    },
    createBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        backgroundColor: ACCENT_ORANGE,
        borderRadius: 999,
        paddingVertical: 20,
        shadowColor: ACCENT_ORANGE,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 16,
        elevation: 8,
    },
    createBtnDisabled: {
        backgroundColor: '#D1D5DB',
        shadowOpacity: 0,
    },
    createText: {
        fontFamily: 'Nunito-Bold',
        fontSize: 18,
        color: '#FFFFFF',
    },
});
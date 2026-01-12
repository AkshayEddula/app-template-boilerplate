import { PaywallModal } from "@/components/Paywall";
import { useGuest } from '@/context/GuestContext';
import { useSubscription } from "@/context/SubscriptionContext";
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery } from 'convex/react';
import { GlassView } from 'expo-glass-effect';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import Animated, {
    FadeInRight,
    FadeInUp,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withSequence,
    withTiming
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

// --- Types & Constants ---
type CategoryKey = "health" | "mind" | "career" | "life" | "fun";

const CATEGORY_ICONS: Record<CategoryKey, keyof typeof Ionicons.glyphMap> = {
    health: "fitness",
    mind: "leaf",
    career: "briefcase",
    life: "heart",
    fun: "game-controller"
};

// --- Components ---

const SkeletonCard = () => {
    const opacity = useSharedValue(0.3);
    useEffect(() => {
        opacity.value = withRepeat(
            withSequence(withTiming(0.6, { duration: 800 }), withTiming(0.3, { duration: 800 })),
            -1,
            true
        );
    }, []);
    const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

    return (
        <Animated.View style={[{ width: '47%' }, animatedStyle]}>
            <View className="bg-white/10 rounded-[24px] p-4 h-24 border border-white/5" />
        </Animated.View>
    );
};

const AdvancedDaySelector = ({ selectedDays = [], toggleDay, setCustomDays }: {
    selectedDays: number[],
    toggleDay: (d: number) => void,
    setCustomDays: (days: number[]) => void
}) => {
    const days = [
        { l: 'S', v: 0 }, { l: 'M', v: 1 }, { l: 'T', v: 2 },
        { l: 'W', v: 3 }, { l: 'T', v: 4 }, { l: 'F', v: 5 }, { l: 'S', v: 6 }
    ];

    return (
        <View className="mt-4">
            <View className="flex-row justify-between items-end mb-3 px-1">
                <Text className="text-white/30 font-generalsans-bold text-[9px] uppercase tracking-[1px]">Select Specific Days</Text>
                <TouchableOpacity onPress={() => setCustomDays([])}>
                    <Text className="text-white/40 font-generalsans-bold text-[10px] uppercase tracking-tight">Reset</Text>
                </TouchableOpacity>
            </View>

            <GlassView
                glassEffectStyle="regular"
                tintColor="#3A7AFE"
                style={{
                    borderRadius: 20,
                    padding: 8,
                    borderWidth: 1,
                    borderColor: 'rgba(255,255,255,0.1)',
                    overflow: 'hidden'
                }}
            >
                <View className="flex-row justify-between">
                    {days.map((day) => {
                        const isSelected = selectedDays.includes(day.v);
                        return (
                            <TouchableOpacity
                                key={day.v}
                                onPress={() => toggleDay(day.v)}
                                activeOpacity={0.6}
                                className={`w-12 h-12 rounded-full items-center justify-center ${isSelected ? 'bg-white' : 'bg-white/5'}`}
                            >
                                <Text className={`font-generalsans-bold text-xs ${isSelected ? 'text-[#3A7AFE]' : 'text-white/40'}`}>
                                    {day.l}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>
            </GlassView>

            <TouchableOpacity
                onPress={() => setCustomDays([1, 3, 5])}
                activeOpacity={0.8}
                className="mt-3 w-full"
            >
                <GlassView glassEffectStyle="regular" tintColor="#3A7AFE" style={{ borderRadius: 16, paddingVertical: 14, alignItems: 'center', overflow: 'hidden' }}>
                    <Text className="text-white/60 font-generalsans-bold text-[9px] uppercase tracking-tight">⚡ Preset: Mon / Wed / Fri</Text>
                </GlassView>
            </TouchableOpacity>
        </View>
    );
};

// --- Main Screen ---

export default function CreateResolution() {
    const router = useRouter();

    const categories = useQuery(api.categories.list);
    const createResolution = useMutation(api.userResolutions.create);
    const { isGuest, addGuestResolution, guestResolutions } = useGuest();
    const { isPremium } = useSubscription();
    // Fetch active resolutions to check limit
    const resolutions = useQuery(api.userResolutions.listActive);
    const [paywallVisible, setPaywallVisible] = useState(false);

    const [selectedCategory, setSelectedCategory] = useState<CategoryKey | null>(null);
    const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
    const [title, setTitle] = useState('');
    const [frequency, setFrequency] = useState('daily');
    const [customDays, setCustomDays] = useState<number[]>([]);
    const [trackingType, setTrackingType] = useState('yes_no');
    const [targetValue, setTargetValue] = useState('1');
    const [countUnit, setCountUnit] = useState('Times');
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
            setCountUnit(template.suggestedCountUnit || 'Times');
        }
    };

    const handleCreate = async () => {
        // --- LIMIT CHECK ---
        const currentCount = isGuest ? guestResolutions.length : (resolutions?.length || 0);
        if (!isPremium && currentCount >= 2) {
            setPaywallVisible(true);
            return;
        }

        if (!selectedCategory) return Alert.alert("Wait", "Select focus.");
        if (!title.trim()) return Alert.alert("Wait", "Name your goal.");

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
            Alert.alert("Error", "Initialization failed.");
        } finally {
            setSubmitting(false);
        }
    };

    const SectionHeader = ({ title, icon }: { title: string, icon: any }) => (
        <View className="flex-row items-center gap-2 mb-4 mt-8">
            <Ionicons name={icon} size={14} color="white" style={{ opacity: 0.5 }} />
            <Text className="text-white/50 font-generalsans-bold text-[9px] uppercase tracking-[-0.1px]">{title}</Text>
        </View>
    );

    return (
        <LinearGradient colors={["#2F6CF6",
            "#3A7AFE",
            "#5C94FF",]} style={{ flex: 1 }} className="flex-1 bg-[#3A7AFE]">
            <SafeAreaView className="flex-1" edges={['top']}>
                {/* Header */}
                <View className="flex-row justify-between items-center px-6 pb-0 py-4">
                    <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2">
                        <Ionicons name="close" size={28} color="white" />
                    </TouchableOpacity>
                    <Text className="text-white font-generalsans-bold text-xl tracking-tighter">New Resolution</Text>
                    <View className="w-10" />
                </View>

                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
                    <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 150 }}>

                        {/* Step 1: Focus Area */}
                        <SectionHeader title="Focus Area" icon="apps" />
                        <View className="flex-row flex-wrap gap-3">
                            {!categories ? (
                                <View className="flex-row gap-3 w-full">
                                    <SkeletonCard /><SkeletonCard />
                                </View>
                            ) : (
                                categories.map((cat: any) => {
                                    // Match the category key to an icon, fallback to "flash"
                                    const iconName = CATEGORY_ICONS[cat.key as CategoryKey] || "flash";
                                    const isSelected = selectedCategory === cat.key;

                                    return (
                                        <TouchableOpacity
                                            key={cat.key}
                                            onPress={() => { setSelectedCategory(cat.key as CategoryKey); setSelectedTemplateId(null); }}
                                            activeOpacity={0.8}
                                            style={{ width: '47%' }}
                                        >
                                            <GlassView
                                                isInteractive
                                                glassEffectStyle="regular"
                                                tintColor={isSelected ? '#FFFFFF' : '#3A7AFE'}
                                                style={{
                                                    borderRadius: 24,
                                                    padding: 20,
                                                    borderWidth: 1,
                                                    borderColor: 'rgba(255,255,255,0.1)',
                                                    overflow: 'hidden'
                                                }}
                                            >
                                                <Ionicons
                                                    name={iconName}
                                                    size={20}
                                                    color={isSelected ? '#3A7AFE' : 'white'}
                                                />
                                                <Text className={`font-generalsans-bold mt-2 tracking-tight ${isSelected ? 'text-[#3A7AFE]' : 'text-white'}`}>
                                                    {cat.name}
                                                </Text>
                                            </GlassView>
                                        </TouchableOpacity>
                                    );
                                })
                            )}
                        </View>

                        {/* Step 2: Recommendations */}
                        {selectedCategory && (
                            <Animated.View entering={FadeInRight}>
                                <SectionHeader title="Recommendations" icon="flash" />
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} className="-mx-6 px-6">
                                    <View className="flex-row gap-3 pr-10">
                                        <TouchableOpacity className='my-1' onPress={() => { setSelectedTemplateId(null); setTitle(''); }}>
                                            <GlassView
                                                glassEffectStyle="regular"
                                                tintColor={!selectedTemplateId ? '#FFFFFF' : '#3A7AFE'}
                                                style={{ borderRadius: 20, padding: 16, minWidth: 120, minHeight: 100, justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', overflow: 'hidden' }}
                                            >
                                                <Ionicons name="create-outline" size={20} color={!selectedTemplateId ? '#3A7AFE' : 'white'} />
                                                <Text className={`font-generalsans-bold mt-2 tracking-tight ${!selectedTemplateId ? 'text-[#3A7AFE]' : 'text-white'}`}>Custom</Text>
                                            </GlassView>
                                        </TouchableOpacity>

                                        {!templates ? (
                                            <View className="w-32 h-[100px] bg-white/10 rounded-[20px] animate-pulse" />
                                        ) : (
                                            templates.map((template: any) => (
                                                <TouchableOpacity className='my-1' key={template._id} onPress={() => handleSelectTemplate(template)}>
                                                    <GlassView
                                                        glassEffectStyle="regular"
                                                        isInteractive
                                                        tintColor={selectedTemplateId === template._id ? '#FFFFFF' : '#3A7AFE'}
                                                        style={{ borderRadius: 20, padding: 16, minWidth: 140, minHeight: 100, justifyContent: 'space-between', overflow: 'hidden' }}
                                                    >
                                                        <Ionicons name="medal-outline" size={18} color={selectedTemplateId === template._id ? '#3A7AFE' : 'white'} />
                                                        <View>
                                                            <Text numberOfLines={1} className={`font-generalsans-bold text-sm  ${selectedTemplateId === template._id ? 'text-[#3A7AFE]' : 'text-white'}`}>{template.title}</Text>
                                                            <Text className={`text-[8px] font-generalsans-medium uppercase ${selectedTemplateId === template._id ? 'text-[#3A7AFE]/60' : 'text-white/40'}`}>{template.trackingType.replace('_', ' ')}</Text>
                                                        </View>
                                                    </GlassView>
                                                </TouchableOpacity>
                                            ))
                                        )}
                                    </View>
                                </ScrollView>
                            </Animated.View>
                        )}

                        {/* Step 3: Goal Title (Compact 54px) */}
                        <SectionHeader title="Goal Title" icon="pencil" />
                        <GlassView
                            glassEffectStyle="regular"
                            isInteractive
                            tintColor="#3A7AFE"
                            style={{
                                borderRadius: 20,
                                height: 56,
                                borderWidth: 1,
                                borderColor: 'rgba(255,255,255,0.1)',
                                overflow: 'hidden',
                                justifyContent: 'center'
                            }}
                        >
                            <TextInput
                                placeholder="e.g. Morning Run"
                                placeholderTextColor="rgba(255, 255, 255, 0.4)"
                                selectionColor="white"
                                cursorColor="white"
                                value={title}
                                onChangeText={(text) => { setTitle(text); setSelectedTemplateId(null); }}
                                style={{
                                    color: 'white',
                                    fontSize: 15,
                                    fontFamily: 'GeneralSans-Medium',
                                    paddingHorizontal: 16,
                                    height: '100%',
                                    textAlignVertical: 'center',
                                    includeFontPadding: false,
                                }}
                            />
                        </GlassView>

                        {/* Step 4: Frequency */}
                        <SectionHeader title="Frequency" icon="calendar" />
                        <View className="flex-row gap-2">
                            {['daily', 'weekdays', 'weekends', 'custom'].map((f) => (
                                <TouchableOpacity key={f} onPress={() => setFrequency(f)} className="flex-1">
                                    <GlassView isInteractive glassEffectStyle="regular" tintColor={frequency === f ? '#FFFFFF' : '#3A7AFE'} style={{ borderRadius: 16, padding: 14, alignItems: 'center', overflow: 'hidden' }}>
                                        <Text className={`font-generalsans-semibold capitalize text-[10px] ${frequency === f ? 'text-[#3A7AFE]' : 'text-white'}`}>{f}</Text>
                                    </GlassView>
                                </TouchableOpacity>
                            ))}
                        </View>
                        {frequency === 'custom' && (
                            <Animated.View entering={FadeInUp}>
                                <AdvancedDaySelector
                                    selectedDays={customDays}
                                    toggleDay={toggleCustomDay}
                                    setCustomDays={setCustomDays}
                                />
                            </Animated.View>
                        )}

                        {/* Step 5: Tracking Method */}
                        <SectionHeader title="Tracking Method" icon="stats-chart" />
                        <View className="gap-3">
                            {[
                                { key: 'yes_no', label: 'Simple Check-in', icon: 'checkmark-circle' },
                                { key: 'count_based', label: 'Numerical Goal', icon: 'add-circle' },
                                { key: 'time_based', label: 'Timer / Duration', icon: 'time' },
                            ].map((t) => (
                                <TouchableOpacity key={t.key} onPress={() => setTrackingType(t.key)}>
                                    <GlassView isInteractive glassEffectStyle="regular" tintColor={trackingType === t.key ? '#FFFFFF' : '#3A7AFE'} style={{ borderRadius: 18, padding: 18, flexDirection: 'row', alignItems: 'center', gap: 12, overflow: 'hidden' }}>
                                        <Ionicons name={t.icon as any} size={18} color={trackingType === t.key ? '#3A7AFE' : 'white'} />
                                        <Text className={`font-generalsans-bold text-sm tracking-tight ${trackingType === t.key ? 'text-[#3A7AFE]' : 'text-white'}`}>{t.label}</Text>
                                    </GlassView>
                                </TouchableOpacity>
                            ))}
                        </View>

                        {/* Step 6: Target Inputs (Compact 54px) */}
                        {trackingType !== 'yes_no' && (
                            <Animated.View entering={FadeInUp} className="mt-6 flex-row gap-4">
                                <View className="flex-1">
                                    <Text className="text-white/40 font-generalsans-bold text-[9px] uppercase mb-2">Target</Text>
                                    <GlassView isInteractive glassEffectStyle="regular" tintColor="#3A7AFE" style={{ borderRadius: 16, height: 54, overflow: 'hidden', justifyContent: 'center' }}>
                                        <TextInput
                                            keyboardType="numeric"
                                            selectionColor="white"
                                            cursorColor="white"
                                            value={targetValue}
                                            onChangeText={setTargetValue}
                                            style={{
                                                color: 'white',
                                                fontSize: 18,
                                                fontFamily: 'GeneralSans-Bold',
                                                textAlign: 'center',
                                                height: '100%',
                                                textAlignVertical: 'center',
                                                includeFontPadding: false,
                                            }}
                                        />
                                    </GlassView>
                                </View>
                                {trackingType === 'count_based' && (
                                    <View className="flex-1">
                                        <Text className="text-white/40 font-generalsans-bold text-[9px] uppercase mb-2">Unit</Text>
                                        <GlassView isInteractive glassEffectStyle="regular" tintColor="#3A7AFE" style={{ borderRadius: 16, height: 54, overflow: 'hidden', justifyContent: 'center' }}>
                                            <TextInput
                                                placeholder="Unit..."
                                                placeholderTextColor="rgba(255,255,255,0.3)"
                                                selectionColor="white"
                                                cursorColor="white"
                                                value={countUnit}
                                                onChangeText={setCountUnit}
                                                style={{
                                                    color: 'white',
                                                    fontSize: 14,
                                                    fontFamily: 'GeneralSans-Medium',
                                                    textAlign: 'center',
                                                    height: '100%',
                                                    textAlignVertical: 'center',
                                                    includeFontPadding: false,
                                                }}
                                            />
                                        </GlassView>
                                    </View>
                                )}
                            </Animated.View>
                        )}
                    </ScrollView>
                </KeyboardAvoidingView>

                {/* Footer Button */}
                <View className="px-6 pb-10">
                    <TouchableOpacity onPress={handleCreate} disabled={submitting}>
                        <GlassView isInteractive glassEffectStyle="regular" tintColor="#FFFFFF" style={{ borderRadius: 20, height: 60, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                            {submitting ? <ActivityIndicator color="#3A7AFE" /> : <Text className="text-[#3A7AFE] font-generalsans-bold text-lg tracking-tight">Initialize Goal</Text>}
                        </GlassView>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>

            {/* Paywall Modal */}
            <PaywallModal
                visible={paywallVisible}
                onClose={() => setPaywallVisible(false)}
            />
        </LinearGradient>
    );
}
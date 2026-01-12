import { PaywallModal } from '@/components/Paywall';
import { useGuest } from '@/context/GuestContext';
import { useSubscription } from '@/context/SubscriptionContext';
import { api } from '@/convex/_generated/api';
import { useAuth } from '@clerk/clerk-expo';
import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery } from 'convex/react';
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
    useWindowDimensions,
    View
} from 'react-native';
import Animated, {
    FadeInDown,
    FadeInRight,
    FadeOutLeft,
    LinearTransition,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withSequence,
    withTiming,
    ZoomIn
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

// --- Types ---
type CategoryKey = 'health' | 'mind' | 'career' | 'life' | 'fun';
type TrackingType = 'yes_no' | 'time_based' | 'count_based';
type FrequencyType = 'daily' | 'weekdays' | 'weekends' | 'custom' | 'x_days_per_week';

// --- Theme Config ---
// Keeping colors but adjusting bg opacity for cleaner look
const CATEGORY_CONFIG: Record<string, { icon: keyof typeof Ionicons.glyphMap; color: string; bgColor: string; accent: string }> = {
    health: { icon: 'leaf', color: '#059669', bgColor: '#ECFDF5', accent: '#34D399' },
    mind: { icon: 'prism', color: '#7C3AED', bgColor: '#F5F3FF', accent: '#A78BFA' },
    career: { icon: 'briefcase', color: '#D97706', bgColor: '#FFFBEB', accent: '#FBBF24' },
    life: { icon: 'compass', color: '#2563EB', bgColor: '#EFF6FF', accent: '#60A5FA' },
    fun: { icon: 'sparkles', color: '#DB2777', bgColor: '#FDF2F8', accent: '#F472B6' },
    default: { icon: 'star', color: '#475569', bgColor: '#F8FAFC', accent: '#94A3B8' }
};

// --- Reusable Components (Redesigned) ---

const Skeleton = ({ width, height, style }: { width: number | string, height: number, style?: any }) => {
    const opacity = useSharedValue(0.3);
    useEffect(() => {
        opacity.value = withRepeat(
            withSequence(withTiming(0.6, { duration: 1000 }), withTiming(0.3, { duration: 1000 })),
            -1,
            true
        );
    }, []);
    const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));
    return <Animated.View style={[{ width, height, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 24 }, style, animatedStyle]} />;
};

const CustomInput = ({ value, onChangeText, placeholder, keyboardType = 'default', label, autoFocus }: any) => (
    <View className="mb-8">
        <Text className="text-xs font-inter-bold uppercase tracking-widest mb-3" style={{ color: 'rgba(255,255,255,0.7)' }}>{label}</Text>
        <View
            style={{
                borderRadius: 24,
                height: 68,
                paddingHorizontal: 24,
                justifyContent: 'center',
                backgroundColor: 'rgba(255,255,255,0.1)',
                borderWidth: 1,
                borderColor: value ? '#FFFFFF' : 'rgba(255,255,255,0.2)',
            }}
        >
            <TextInput
                value={value}
                onChangeText={onChangeText}
                placeholder={placeholder}
                placeholderTextColor="rgba(255,255,255,0.4)"
                keyboardType={keyboardType}
                autoFocus={autoFocus}
                style={{
                    fontSize: 18,
                    color: '#FFFFFF',
                    fontFamily: 'Inter-Semibold',
                    height: '100%',
                }}
                selectionColor="#FFFFFF"
            />
        </View>
    </View>
);

const BigNumberInput = ({ value, onChangeText, suffix }: any) => (
    <View className="items-center py-3">
        <View className="flex-row items-baseline justify-center rounded-[20px] px-4 py-4" style={{
            backgroundColor: 'rgba(255,255,255,0.1)',
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.2)',
        }}>
            <TextInput
                value={value}
                onChangeText={onChangeText}
                keyboardType="number-pad"
                style={{
                    includeFontPadding: false,
                    padding: 0,
                    margin: 0,
                    color: '#FFFFFF',
                    fontFamily: 'Inter-Bold',
                    fontSize: 32,
                }}
                className="text-center min-w-[50px]"
                placeholder="0"
                placeholderTextColor="rgba(255,255,255,0.3)"
                selectionColor="#FFFFFF"
                autoFocus
            />
            <Text className="font-inter-bold text-lg ml-2" style={{ color: 'rgba(255,255,255,0.6)' }}>{suffix}</Text>
        </View>
    </View>
);

const SelectionCard = ({ selected, onPress, title, subtitle, icon }: any) => {
    return (
        <TouchableOpacity onPress={onPress} activeOpacity={0.8} className="mb-3">
            <Animated.View
                layout={LinearTransition}
                style={{
                    backgroundColor: selected ? '#FFFFFF' : 'rgba(255,255,255,0.1)',
                    borderRadius: 24,
                    padding: 18,
                    borderWidth: selected ? 0 : 1,
                    borderColor: 'rgba(255,255,255,0.15)',
                    shadowColor: selected ? '#000' : 'transparent',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: selected ? 0.2 : 0,
                    shadowRadius: 8,
                    elevation: selected ? 4 : 0,
                }}
            >
                <View className="flex-row items-center">
                    <View
                        style={{ backgroundColor: selected ? '#3A7AFE' : 'rgba(255,255,255,0.1)' }}
                        className="w-14 h-14 rounded-2xl items-center justify-center"
                    >
                        <Ionicons name={icon} size={26} color={selected ? '#FFFFFF' : 'rgba(255,255,255,0.7)'} />
                    </View>
                    <View className="ml-4 flex-1 pr-3">
                        <Text className="text-base font-inter-bold" style={{ color: selected ? '#3A7AFE' : '#FFFFFF' }}>{title}</Text>
                        {subtitle && <Text className="text-sm font-inter-medium leading-5 mt-0.5" style={{ color: selected ? 'rgba(58,122,254,0.7)' : 'rgba(255,255,255,0.5)' }}>{subtitle}</Text>}
                    </View>
                    {selected && (
                        <Animated.View entering={ZoomIn.duration(300)}>
                            <Ionicons name="checkmark-circle" size={28} color="#3A7AFE" />
                        </Animated.View>
                    )}
                </View>
            </Animated.View>
        </TouchableOpacity>
    );
};

const SimpleDaySelector = ({ selectedDays, toggleDay }: { selectedDays: number[], toggleDay: (d: number) => void }) => {
    const days = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

    return (
        <View className="mb-8 mt-4 p-6 rounded-[32px]" style={{
            backgroundColor: 'rgba(255,255,255,0.05)',
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.1)',
        }}>
            <Text className="text-xs font-inter-bold text-white/50 uppercase tracking-widest mb-6 text-center">Select Active Days</Text>
            <View className="flex-row justify-between items-center px-2">
                {days.map((day, idx) => {
                    const isSelected = (selectedDays || []).includes(idx);
                    return (
                        <TouchableOpacity
                            key={idx}
                            onPress={() => toggleDay(idx)}
                            activeOpacity={0.7}
                        >
                            <Animated.View
                                layout={LinearTransition}
                                style={{
                                    width: 42,
                                    height: 42,
                                    borderRadius: 21,
                                    backgroundColor: isSelected ? '#FFFFFF' : 'rgba(255,255,255,0.1)',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    borderWidth: isSelected ? 0 : 1,
                                    borderColor: isSelected ? 'transparent' : 'rgba(255,255,255,0.2)'
                                }}
                            >
                                <Text style={{ color: isSelected ? '#3A7AFE' : 'rgba(255,255,255,0.6)' }} className="font-inter-bold text-sm">
                                    {day}
                                </Text>
                            </Animated.View>
                        </TouchableOpacity>
                    );
                })}
            </View>
        </View>
    );
};

const HeaderProgress = ({ current, total }: { current: number, total: number }) => {
    return (
        <View className="h-1.5 flex-row gap-1.5 flex-1 mx-4">
            {[1, 2, 3, 4].map(i => (
                <View
                    key={i}
                    className="flex-1 rounded-full h-full"
                    style={{
                        backgroundColor: i <= current ? '#FFFFFF' : 'rgba(255,255,255,0.2)',
                        opacity: i <= current ? 1 : 0.5
                    }}
                />
            ))}
        </View>
    );
};

// --- MAIN SCREEN ---

export default function ResolutionOnboarding() {
    const router = useRouter();
    const { width } = useWindowDimensions();
    const { isPremium } = useSubscription();
    const { isSignedIn } = useAuth();
    const { isGuest, addGuestResolution, isLoading: isGuestLoading, completeGuestOnboarding, hasCompletedOnboarding } = useGuest();

    const [step, setStep] = useState(1);
    const [submitting, setSubmitting] = useState(false);
    const [showPaywall, setShowPaywall] = useState(false);

    // Data
    const user = useQuery(api.users.currentUser);
    const categories = useQuery(api.categories.list);
    const [selectedCategory, setSelectedCategory] = useState<CategoryKey | null>(null);
    const templates = useQuery(
        api.resolutionTemplates.listByCategory,
        selectedCategory ? { categoryKey: selectedCategory } : "skip"
    );

    // Form
    const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
    const [customTitle, setCustomTitle] = useState('');
    const [isCustom, setIsCustom] = useState(false);
    const [frequencyType, setFrequencyType] = useState<FrequencyType>('daily');
    const [customDays, setCustomDays] = useState<number[]>([]);
    const [daysPerWeek, setDaysPerWeek] = useState(5);
    const [trackingType, setTrackingType] = useState<TrackingType>('yes_no');

    const [targetTime, setTargetTime] = useState(30);
    const [targetCount, setTargetCount] = useState(8);
    const [countUnit, setCountUnit] = useState('times');

    const createResolution = useMutation(api.userResolutions.create);
    const completeOnboarding = useMutation(api.users.completeOnboarding);

    // Logic Functions (Identical to original)
    const handleNumberInput = (text: string, setter: (val: number) => void) => {
        const cleanText = text.replace(/[^0-9]/g, '');
        if (cleanText === '') setter(0);
        else setter(parseInt(cleanText, 10));
    };

    const handleCategorySelect = (key: CategoryKey) => {
        setSelectedCategory(key);
        setSelectedTemplate(null);
        setIsCustom(false);
        setStep(2);
    };

    const handleTemplateSelect = (template: any) => {
        setSelectedTemplate(template);
        setIsCustom(false);
        setFrequencyType(template.suggestedFrequency || 'daily');
        setTrackingType(template.trackingType || 'yes_no');
        if (template.suggestedTargetTime) setTargetTime(template.suggestedTargetTime);
        if (template.suggestedTargetCount) setTargetCount(template.suggestedTargetCount);
        if (template.suggestedCountUnit) setCountUnit(template.suggestedCountUnit);
        setStep(3);
    };

    const handleCustomResolution = () => {
        setIsCustom(true);
        setSelectedTemplate(null);
        setStep(3);
    };

    const toggleCustomDay = (day: number) => {
        const current = [...customDays];
        if (current.includes(day)) {
            setCustomDays(current.filter(d => d !== day));
        } else {
            setCustomDays([...current, day].sort((a, b) => a - b));
        }
    };

    const submitResolution = async (shouldNavigate = true) => {
        setSubmitting(true);
        let finalCustomDays: number[] | undefined = undefined;

        if (frequencyType === 'daily') finalCustomDays = [0, 1, 2, 3, 4, 5, 6];
        else if (frequencyType === 'weekdays') finalCustomDays = [1, 2, 3, 4, 5];
        else if (frequencyType === 'weekends') finalCustomDays = [0, 6];
        else if (frequencyType === 'custom') finalCustomDays = customDays;

        try {
            if (isGuest) {
                await addGuestResolution({
                    categoryKey: selectedCategory!,
                    title: isCustom ? customTitle : selectedTemplate.title,
                    description: isCustom ? '' : selectedTemplate.description,
                    trackingType,
                    targetTime: trackingType === 'time_based' ? targetTime : undefined,
                    targetCount: trackingType === 'count_based' ? targetCount : undefined,
                    countUnit: trackingType === 'count_based' ? countUnit : undefined,
                    frequencyType,
                    customDays: finalCustomDays,
                    daysPerWeek: frequencyType === 'x_days_per_week' ? daysPerWeek : undefined,
                });
                await completeGuestOnboarding();
                if (shouldNavigate) router.replace('/(tabs)');
                return true;
            }

            if (!isSignedIn) {
                Alert.alert("Authentication Required", "Please sign in or continue as guest to create a resolution.");
                return false;
            }

            await createResolution({
                categoryKey: selectedCategory!,
                title: isCustom ? customTitle : selectedTemplate.title,
                description: isCustom ? '' : selectedTemplate.description,
                trackingType,
                targetTime: trackingType === 'time_based' ? targetTime : undefined,
                targetCount: trackingType === 'count_based' ? targetCount : undefined,
                countUnit: trackingType === 'count_based' ? countUnit : undefined,
                frequencyType,
                customDays: finalCustomDays,
                daysPerWeek: frequencyType === 'x_days_per_week' ? daysPerWeek : undefined,
                isActive: true,
                templateId: !isCustom ? selectedTemplate?._id : undefined,
            });

            await completeOnboarding({ is_onboarded: true });

            // Navigation handled by _layout.tsx reactive listener
            return true;
        } catch (error: any) {
            console.error("Resolution Creation Error:", error);
            Alert.alert("Error", `Failed to create resolution: ${error.message || "Unknown error"}`);
            return false;
        } finally {
            setSubmitting(false);
        }
    };

    const handleFinish = async () => {
        // Initialize resolution in background
        const promise = submitResolution(false);

        if (!isPremium) {
            setShowPaywall(true);
        } else {
            await promise;
            router.replace('/(tabs)');
        }
    };

    // --- Render Steps (Visual Redesign) ---

    const renderStep1_Categories = () => (
        <Animated.View entering={FadeInRight.springify()} exiting={FadeOutLeft}>
            <Text className="text-3xl font-inter-bold text-center leading-tight mb-3" style={{ color: '#FFFFFF' }}>Focus Area</Text>
            <Text className="font-inter-medium text-base text-center leading-relaxed mb-8" style={{ color: 'rgba(255,255,255,0.7)' }}>What aspect of your life needs a reset?</Text>

            <View className="gap-4">
                {!categories ? (
                    [1, 2, 3, 4, 5].map((i) => <Skeleton key={i} width="100%" height={88} />)
                ) : (
                    categories.map((cat: any, index: number) => {
                        const config = CATEGORY_CONFIG[cat.key] || CATEGORY_CONFIG.default;

                        return (
                            <TouchableOpacity
                                key={cat.key}
                                onPress={() => handleCategorySelect(cat.key)}
                                activeOpacity={0.8}
                            >
                                <Animated.View
                                    entering={FadeInDown.delay(index * 50).duration(400)}
                                >
                                    <View
                                        style={{
                                            backgroundColor: 'rgba(255,255,255,0.1)',
                                            borderRadius: 28,
                                            padding: 20,
                                            borderWidth: 1,
                                            borderColor: 'rgba(255,255,255,0.15)'
                                        }}
                                    >
                                        <View className="flex-row items-center gap-5">
                                            <View
                                                style={{ backgroundColor: config.bgColor }}
                                                className="w-16 h-16 rounded-[20px] items-center justify-center"
                                            >
                                                <Ionicons name={config.icon} size={32} color={config.color} />
                                            </View>
                                            <View className="flex-1">
                                                <Text className="font-inter-bold text-base" style={{ color: '#FFFFFF' }}>{cat.name}</Text>
                                                <Text className="text-sm font-inter-medium leading-5" style={{ color: 'rgba(255,255,255,0.6)' }}>{cat.description}</Text>
                                            </View>
                                            <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.3)" />
                                        </View>
                                    </View>
                                </Animated.View>
                            </TouchableOpacity>
                        );
                    })
                )}
            </View>
        </Animated.View>
    );

    const renderStep2_Templates = () => (
        <Animated.View entering={FadeInRight.springify()} exiting={FadeOutLeft}>
            <Text className="text-3xl font-inter-bold text-center leading-tight mb-3" style={{ color: '#FFFFFF' }}>Choose Goal</Text>
            <Text className="font-inter-medium text-base text-center leading-relaxed mb-8" style={{ color: 'rgba(255,255,255,0.7)' }}>Select a template or build your own.</Text>

            <TouchableOpacity onPress={handleCustomResolution} className="mb-8" activeOpacity={0.8}>
                <View
                    style={{
                        backgroundColor: 'rgba(255,255,255,0.05)',
                        borderRadius: 24,
                        padding: 20,
                        borderWidth: 1,
                        borderColor: 'rgba(255,255,255,0.2)',
                        borderStyle: 'dashed'
                    }}
                >
                    <View className="flex-row items-center gap-4">
                        <View className="w-14 h-14 rounded-2xl bg-white/10 items-center justify-center">
                            <Ionicons name="add-circle" size={32} color="#FFFFFF" />
                        </View>
                        <View className="flex-1">
                            <Text className="font-inter-bold text-base" style={{ color: '#FFFFFF' }}>Create Custom</Text>
                            <Text className="text-sm font-inter-medium" style={{ color: 'rgba(255,255,255,0.6)' }}>Design your own habit</Text>
                        </View>
                    </View>
                </View>
            </TouchableOpacity>

            <Text className="text-xs font-inter-bold uppercase tracking-widest mb-6" style={{ color: 'rgba(255,255,255,0.5)' }}>Popular Options</Text>

            {!templates ? (
                [1, 2, 3].map(i => <Skeleton key={i} width="100%" height={88} style={{ marginBottom: 12 }} />)
            ) : (
                templates.filter((t: any) => t.isPopular).map((template: any, index: number) => (
                    <Animated.View key={template._id} entering={FadeInDown.delay(index * 80).springify()}>
                        <SelectionCard
                            title={template.title}
                            subtitle={template.description}
                            icon="star-outline"
                            onPress={() => handleTemplateSelect(template)}
                            selected={false}
                        />
                    </Animated.View>
                ))
            )}
        </Animated.View>
    );

    const renderStep3_Frequency = () => (
        <Animated.View entering={FadeInRight.springify()} exiting={FadeOutLeft}>
            {isCustom && (
                <View className="mb-6">
                    <CustomInput
                        label="Name your goal"
                        placeholder="e.g. Morning Meditation"
                        value={customTitle}
                        onChangeText={setCustomTitle}
                        autoFocus={true}
                    />
                </View>
            )}

            <Text className="text-3xl font-inter-bold text-center leading-tight mb-3" style={{ color: '#FFFFFF' }}>Routine</Text>
            <Text className="font-inter-medium text-base text-center leading-relaxed mb-8" style={{ color: 'rgba(255,255,255,0.7)' }}>When will you perform this action?</Text>

            <Animated.View entering={FadeInDown.delay(100).springify()}>
                <SelectionCard title="Every Day" subtitle="Perfect for building habits" icon="infinite" selected={frequencyType === 'daily'} onPress={() => setFrequencyType('daily')} />
            </Animated.View>
            <Animated.View entering={FadeInDown.delay(150).springify()}>
                <SelectionCard title="Weekdays" subtitle="Monday through Friday" icon="briefcase-outline" selected={frequencyType === 'weekdays'} onPress={() => setFrequencyType('weekdays')} />
            </Animated.View>
            <Animated.View entering={FadeInDown.delay(200).springify()}>
                <SelectionCard title="Weekends" subtitle="Saturday & Sunday only" icon="cafe-outline" selected={frequencyType === 'weekends'} onPress={() => setFrequencyType('weekends')} />
            </Animated.View>
            <Animated.View entering={FadeInDown.delay(250).springify()}>
                <SelectionCard title="Specific Days" subtitle="Custom weekly schedule" icon="calendar-outline" selected={frequencyType === 'custom'} onPress={() => setFrequencyType('custom')} />
            </Animated.View>

            {frequencyType === 'custom' && (
                <Animated.View entering={FadeInDown.springify()}>
                    <SimpleDaySelector selectedDays={customDays} toggleDay={toggleCustomDay} />
                </Animated.View>
            )}

            <View className="mt-10">
                <TouchableOpacity onPress={() => setStep(4)} activeOpacity={0.8}>
                    <View
                        style={{
                            borderRadius: 100,
                            height: 60,
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: '#FFFFFF',
                            shadowColor: '#000',
                            shadowOffset: { width: 0, height: 8 },
                            shadowOpacity: 0.1,
                            shadowRadius: 16,
                            elevation: 8,
                        }}
                    >
                        <Text className="text-[#3A7AFE] font-inter-bold text-base">Continue</Text>
                    </View>
                </TouchableOpacity>
            </View>
        </Animated.View>
    );

    const renderStep4_Tracking = () => (
        <Animated.View entering={FadeInRight.springify()} exiting={FadeOutLeft}>
            <Text className="text-3xl font-inter-bold text-center leading-tight mb-3" style={{ color: '#FFFFFF' }}>Measurement</Text>
            <Text className="font-inter-medium text-base text-center leading-relaxed mb-8" style={{ color: 'rgba(255,255,255,0.7)' }}>Define success for your daily goal.</Text>

            <Animated.View entering={FadeInDown.delay(100).springify()}>
                <SelectionCard title="Completion Only" subtitle="Simple checkbox" icon="checkmark-circle-outline" selected={trackingType === 'yes_no'} onPress={() => setTrackingType('yes_no')} />
            </Animated.View>
            <Animated.View entering={FadeInDown.delay(150).springify()}>
                <SelectionCard title="Time Duration" subtitle="Track minutes spent" icon="timer-outline" selected={trackingType === 'time_based'} onPress={() => setTrackingType('time_based')} />
            </Animated.View>

            {trackingType === 'time_based' && (
                <Animated.View entering={FadeInDown} className="mb-6">
                    <BigNumberInput value={String(targetTime)} onChangeText={(t: string) => handleNumberInput(t, setTargetTime)} suffix="Min" />
                </Animated.View>
            )}

            <Animated.View entering={FadeInDown.delay(200).springify()}>
                <SelectionCard title="Numeric Count" subtitle="Reps, pages, units" icon="stats-chart-outline" selected={trackingType === 'count_based'} onPress={() => setTrackingType('count_based')} />
            </Animated.View>

            {trackingType === 'count_based' && (
                <Animated.View entering={FadeInDown} className="mb-6">
                    <BigNumberInput value={String(targetCount)} onChangeText={(t: string) => handleNumberInput(t, setTargetCount)} suffix={countUnit} />
                    <View className="mt-2">
                        <CustomInput label="Unit Name" placeholder="e.g. Pages" value={countUnit} onChangeText={setCountUnit} />
                    </View>
                </Animated.View>
            )}

            <View className="mt-10">
                <TouchableOpacity onPress={() => setStep(5)} activeOpacity={0.8}>
                    <View
                        style={{
                            borderRadius: 100,
                            height: 60,
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: '#FFFFFF',
                            shadowColor: '#000',
                            shadowOffset: { width: 0, height: 8 },
                            shadowOpacity: 0.1,
                            shadowRadius: 16,
                            elevation: 8,
                        }}
                    >
                        <Text className="text-[#3A7AFE] font-inter-bold text-base">Continue</Text>
                    </View>
                </TouchableOpacity>
            </View>
        </Animated.View>
    );

    const renderStep5_Summary = () => {
        const catConfig = selectedCategory ? CATEGORY_CONFIG[selectedCategory] : CATEGORY_CONFIG.default;

        return (
            <Animated.View entering={FadeInRight.delay(100).springify()} exiting={FadeOutLeft} className="flex-1 justify-center pb-8">

                {/* Header Text */}
                <View className="items-center mb-10">
                    <Text className="font-inter-medium text-xs uppercase tracking-widest mb-3" style={{ color: 'rgba(255,255,255,0.6)' }}>Review Quest</Text>
                    <Text className="font-inter-bold text-4xl text-center leading-tight mb-2" style={{ color: '#FFFFFF' }}>Ready to Commit?</Text>
                    <Text className="font-inter-medium text-base text-center" style={{ color: 'rgba(255,255,255,0.7)' }}>Your journey starts now</Text>
                </View>

                {/* Main Card */}
                <View
                    style={{
                        borderRadius: 32,
                        backgroundColor: '#FFFFFF',
                        shadowColor: "#000",
                        shadowOffset: { width: 0, height: 12 },
                        shadowOpacity: 0.08,
                        shadowRadius: 24,
                        elevation: 10,
                        overflow: 'hidden'
                    }}
                >
                    {/* Card Header (Colored) */}
                    <View style={{ backgroundColor: catConfig.bgColor }} className="p-8 pb-8">
                        <View className="flex-row justify-between items-start mb-8">
                            <View
                                style={{ backgroundColor: 'rgba(255,255,255,0.8)' }}
                                className="px-4 py-2 rounded-full border border-white/40"
                            >
                                <Text style={{ color: catConfig.color }} className="text-xs font-inter-bold uppercase tracking-wider">
                                    {selectedCategory}
                                </Text>
                            </View>
                            <View style={{ backgroundColor: 'rgba(255,255,255,0.8)' }} className="w-12 h-12 rounded-full items-center justify-center">
                                <Ionicons name={catConfig.icon} size={24} color={catConfig.color} />
                            </View>
                        </View>

                        <Text style={{ color: '#1E293B' }} className="font-inter-bold text-[32px] leading-[38px]">
                            {isCustom ? customTitle || 'New Goal' : selectedTemplate?.title}
                        </Text>
                    </View>

                    {/* Card Body (White) */}
                    <View className="p-8 pt-6">
                        {/* Stats Grid */}
                        <View className="gap-3 mb-6">
                            <View className="flex-1 p-4 rounded-2xl" style={{ backgroundColor: '#FAFAFA' }}>
                                <View className="flex-row items-center gap-2 mb-2">
                                    <Ionicons name="calendar" size={16} color="#F97316" />
                                    <Text className="text-[10px] font-inter-bold uppercase tracking-wider" style={{ color: '#999' }}>Frequency</Text>
                                </View>
                                <Text className="font-inter-bold text-base" style={{ color: '#1E293B' }}>
                                    {frequencyType === 'daily' ? 'Daily' :
                                        frequencyType === 'weekdays' ? 'Weekdays' :
                                            frequencyType === 'weekends' ? 'Weekends' : 'Custom'}
                                </Text>
                            </View>
                            <View className="flex-1 p-4 rounded-2xl" style={{ backgroundColor: '#FAFAFA' }}>
                                <View className="flex-row items-center gap-2 mb-2">
                                    <Ionicons name="flag" size={16} color="#F97316" />
                                    <Text className="text-[10px] font-inter-bold uppercase tracking-wider" style={{ color: '#999' }}>Target</Text>
                                </View>
                                <Text className="font-inter-bold text-base" style={{ color: '#1E293B' }}>
                                    {trackingType === 'yes_no' ? 'Complete' : trackingType === 'time_based' ? `${targetTime} Mins` : `${targetCount} ${countUnit}`}
                                </Text>
                            </View>
                        </View>

                        {/* Character Unlock Message */}
                        <View className="flex-row items-center gap-3 p-4 rounded-2xl" style={{ backgroundColor: '#FFF4ED' }}>
                            <View className="w-12 h-12 rounded-full items-center justify-center" style={{ backgroundColor: '#FFEDD5' }}>
                                <Text className="text-2xl">🎯</Text>
                            </View>
                            <View className="flex-1">
                                <Text className="font-inter-bold text-sm" style={{ color: '#1E293B' }}>Complete to unlock characters</Text>
                                <Text className="font-inter-medium text-xs mt-0.5" style={{ color: '#64748B' }}>Build streaks and evolve your character</Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Primary Action */}
                <View className="w-full mt-10">
                    <TouchableOpacity
                        onPress={handleFinish}
                        disabled={submitting}
                        activeOpacity={0.8}
                    >
                        <Animated.View
                            entering={FadeInDown.delay(300).springify()}
                            style={{
                                borderRadius: 100,
                                height: 72,
                                alignItems: 'center',
                                justifyContent: 'center',
                                backgroundColor: '#FFFFFF',
                                shadowColor: '#000',
                                shadowOffset: { width: 0, height: 12 },
                                shadowOpacity: 0.15,
                                shadowRadius: 20,
                                elevation: 8,
                                flexDirection: 'row',
                                gap: 10
                            }}
                        >
                            {submitting ? (
                                <ActivityIndicator color="#3A7AFE" />
                            ) : (
                                <>
                                    <Text className="text-[#3A7AFE] font-inter-bold text-xl">Initialize Resolution</Text>
                                    <Ionicons name="arrow-forward" size={24} color="#3A7AFE" />
                                </>
                            )}
                        </Animated.View>
                    </TouchableOpacity>

                    <TouchableOpacity onPress={() => setStep(4)} className="mt-6 items-center py-2">
                        <Text className="font-inter-bold text-white/50 text-xs uppercase tracking-widest">Edit Details</Text>
                    </TouchableOpacity>
                </View>
            </Animated.View>
        );
    }

    return (
        <View style={{ flex: 1, backgroundColor: '#3A7AFE' }}>
            <SafeAreaView className="flex-1">
                {/* Global Header */}
                <View className="px-6 py-2 flex-row items-center justify-between h-14 z-10">
                    <View style={{ width: 40 }}>
                        {step > 1 && step < 5 && (
                            <TouchableOpacity
                                onPress={() => setStep(step - 1)}
                                className="w-10 h-10 rounded-full bg-white/10 items-center justify-center border border-white/10"
                            >
                                <Ionicons name="arrow-back" size={20} color="white" />
                            </TouchableOpacity>
                        )}
                    </View>

                    {/* Progress Bar */}
                    {step < 5 && (
                        <HeaderProgress current={step} total={4} />
                    )}

                    <View style={{ width: 40 }} />
                </View>

                {/* Scroll Content */}
                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
                    <ScrollView
                        className="flex-1 px-6"
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={{ flexGrow: 1, paddingBottom: 40, paddingTop: 20 }}
                    >
                        <View className="w-full max-w-[420px] self-center">
                            {isGuestLoading ? (
                                <View className="flex-1 items-center justify-center pt-20">
                                    <ActivityIndicator size="large" color="white" />
                                </View>
                            ) : (
                                <>
                                    {step === 1 && renderStep1_Categories()}
                                    {step === 2 && renderStep2_Templates()}
                                    {step === 3 && renderStep3_Frequency()}
                                    {step === 4 && renderStep4_Tracking()}
                                    {step === 5 && renderStep5_Summary()}
                                </>
                            )}
                        </View>
                    </ScrollView>
                </KeyboardAvoidingView>
            </SafeAreaView>

            <PaywallModal
                visible={showPaywall}
                onClose={() => {
                    setShowPaywall(false);
                    if (user?.is_onboarded || (isGuest && hasCompletedOnboarding)) {
                        router.replace('/(tabs)');
                    }
                }}
                isHardPaywall={false}
            />
        </View>
    );
}
import { PaywallModal } from '@/components/Paywall';
import { useSubscription } from '@/context/SubscriptionContext';
import { api } from '@/convex/_generated/api';
import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery } from 'convex/react';
import { GlassView } from 'expo-glass-effect';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    useWindowDimensions
} from 'react-native';
import Animated, {
    FadeIn,
    FadeInDown,
    FadeInRight,
    FadeOutLeft,
    LinearTransition,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withSequence,
    withTiming
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

// --- Types ---
type CategoryKey = 'health' | 'mind' | 'career' | 'life' | 'fun';
type TrackingType = 'yes_no' | 'time_based' | 'count_based';
type FrequencyType = 'daily' | 'weekdays' | 'weekends' | 'custom' | 'x_days_per_week';

// --- Theme Config ---
const CATEGORY_CONFIG: Record<string, { icon: keyof typeof Ionicons.glyphMap; color: string; bgColor: string }> = {
    health: { icon: 'water', color: '#059669', bgColor: '#ECFDF5' }, // Emerald dark text, light bg
    mind: { icon: 'prism', color: '#7C3AED', bgColor: '#F5F3FF' }, // Violet
    career: { icon: 'briefcase', color: '#D97706', bgColor: '#FFFBEB' }, // Amber
    life: { icon: 'compass', color: '#2563EB', bgColor: '#EFF6FF' }, // Blue
    fun: { icon: 'color-palette', color: '#DB2777', bgColor: '#FDF2F8' }, // Pink
    default: { icon: 'star', color: '#475569', bgColor: '#F8FAFC' } // Slate
};

// --- Reusable Components ---

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
    return <Animated.View style={[{ width, height, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 16 }, style, animatedStyle]} />;
};

const CustomInput = ({ value, onChangeText, placeholder, keyboardType = 'default', label, autoFocus }: any) => (
    <View className="mb-5">
        <Text className="text-white/90 text-xs font-generalsans-bold uppercase tracking-widest mb-2 ml-1">{label}</Text>
        <GlassView
            glassEffectStyle="regular"
            tintColor="#3A7AFE"
            style={{ borderRadius: 16, height: 60, paddingHorizontal: 20, justifyContent: 'center', overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' }}
        >
            <TextInput
                value={value}
                onChangeText={onChangeText}
                placeholder={placeholder}
                placeholderTextColor="rgba(255,255,255,0.5)"
                keyboardType={keyboardType}
                autoFocus={autoFocus}
                style={{
                    fontSize: 18,
                    color: 'white',
                    fontFamily: 'GeneralSans-Bold',
                    textAlignVertical: 'center',
                    includeFontPadding: false,
                    height: '100%',
                }}
                selectionColor="white"
            />
        </GlassView>
    </View>
);

const BigNumberInput = ({ value, onChangeText, suffix }: any) => (
    <View className="items-center py-8">
        <View className="flex-row items-end justify-center">
            <TextInput
                value={value}
                onChangeText={onChangeText}
                keyboardType="number-pad"
                style={{
                    includeFontPadding: false,
                    lineHeight: 80,
                    padding: 0,
                    margin: 0,
                    textAlignVertical: 'center'
                }}
                className="text-white font-generalsans-bold text-7xl text-center min-w-[80px] h-[80px]"
                placeholder="0"
                placeholderTextColor="rgba(255,255,255,0.3)"
                selectionColor="white"
                autoFocus
            />
            <Text className="text-white/50 font-generalsans-bold text-2xl mb-4 ml-2">{suffix}</Text>
        </View>
        <View className="h-1 w-32 bg-white/20 rounded-full mt-4" />
    </View>
);

const SelectionCard = ({ selected, onPress, title, subtitle, icon }: any) => {
    return (
        <TouchableOpacity onPress={onPress} activeOpacity={0.8} className="mb-3">
            <GlassView
                glassEffectStyle="regular"
                tintColor={selected ? "#FFFFFF" : "#3A7AFE"}
                style={{ borderRadius: 24, overflow: 'hidden', borderWidth: 1, borderColor: selected ? 'white' : 'rgba(255,255,255,0.1)' }}
            >
                <Animated.View
                    layout={LinearTransition}
                    className="flex-row items-center p-5"
                >
                    <View className={`w-12 h-12 rounded-full items-center justify-center ${selected ? 'bg-[#3A7AFE]' : 'bg-white/20'}`}>
                        <Ionicons name={icon} size={24} color={selected ? 'white' : 'white'} />
                    </View>
                    <View className="ml-4 flex-1">
                        <Text className={`text-[17px] font-generalsans-semibold ${selected ? 'text-[#3A7AFE]' : 'text-white'}`}>{title}</Text>
                        {subtitle && <Text className={`text-xs font-generalsans-medium mt-0.5 ${selected ? 'text-[#3A7AFE]/70' : 'text-blue-100/70'}`}>{subtitle}</Text>}
                    </View>
                    {selected && (
                        <Animated.View entering={FadeIn.duration(200)}>
                            <Ionicons name="checkmark-circle" size={26} color="#3A7AFE" />
                        </Animated.View>
                    )}
                </Animated.View>
            </GlassView>
        </TouchableOpacity>
    );
};

const SimpleDaySelector = ({ selectedDays, toggleDay }: { selectedDays: number[], toggleDay: (d: number) => void }) => {
    const days = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

    return (
        <View className="mb-8 mt-6">
            <Text className="text-white/70 text-xs font-generalsans-bold uppercase tracking-widest mb-4 ml-1">Select Days</Text>

            <GlassView
                glassEffectStyle="regular"
                tintColor="#3A7AFE"
                style={{ borderRadius: 24, padding: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', overflow: "hidden" }}
            >
                <View className="flex-row justify-between items-center">
                    {days.map((day, idx) => {
                        const isSelected = (selectedDays || []).includes(idx);

                        return (
                            <TouchableOpacity
                                key={idx}
                                onPress={() => toggleDay(idx)}
                                activeOpacity={0.7}
                                className={`w-10 h-10 rounded-full items-center justify-center ${isSelected ? 'bg-white' : 'bg-white/10'}`}
                            >
                                <Text className={`font-generalsans-bold text-xs ${isSelected ? 'text-[#3A7AFE]' : 'text-white/60'}`}>
                                    {day.slice(0, 1)}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>
            </GlassView>
        </View>
    );
};

// --- MAIN SCREEN ---

export default function ResolutionOnboarding() {
    const router = useRouter();
    const { width } = useWindowDimensions();
    const { isPremium } = useSubscription();

    const [step, setStep] = useState(1);
    const [submitting, setSubmitting] = useState(false);
    const [showPaywall, setShowPaywall] = useState(false);

    // Data
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

    const handleNumberInput = (text: string, setter: (val: number) => void) => {
        const cleanText = text.replace(/[^0-9]/g, '');
        if (cleanText === '') {
            setter(0);
        } else {
            setter(parseInt(cleanText, 10));
        }
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

    const submitResolution = async () => {
        setSubmitting(true);

        // Map presets to actual day arrays for DB logic
        let finalCustomDays: number[] | undefined = undefined;

        if (frequencyType === 'daily') {
            finalCustomDays = [0, 1, 2, 3, 4, 5, 6];
        } else if (frequencyType === 'weekdays') {
            finalCustomDays = [1, 2, 3, 4, 5];
        } else if (frequencyType === 'weekends') {
            finalCustomDays = [0, 6];
        } else if (frequencyType === 'custom') {
            finalCustomDays = customDays;
        }

        try {
            await createResolution({
                categoryKey: selectedCategory!,
                title: isCustom ? customTitle : selectedTemplate.title,
                description: isCustom ? '' : selectedTemplate.description,
                trackingType,
                targetTime: trackingType === 'time_based' ? targetTime : undefined,
                targetCount: trackingType === 'count_based' ? targetCount : undefined,
                countUnit: trackingType === 'count_based' ? countUnit : undefined,
                frequencyType,
                customDays: finalCustomDays, // Send explicit days
                daysPerWeek: frequencyType === 'x_days_per_week' ? daysPerWeek : undefined,
                isActive: true,
                templateId: !isCustom ? selectedTemplate?._id : undefined,
            });

            router.replace('/(tabs)');
        } catch (error) {
            Alert.alert("Error", "Failed to create resolution");
            console.error(error);
        } finally {
            setSubmitting(false);
        }
    };

    const handleFinish = async () => {
        if (!isPremium) {
            setShowPaywall(true);
        } else {
            await submitResolution();
        }
    };

    const renderStep1_Categories = () => (
        <Animated.View entering={FadeInRight} exiting={FadeOutLeft}>
            <Text className="text-[40px] font-generalsans-semibold text-white mb-2 leading-tight">Focus Area</Text>
            <Text className="text-white/80 font-generalsans-medium text-lg mb-8">What do you want to improve?</Text>

            <View className="flex-row flex-wrap justify-between gap-y-4">
                {!categories ? (
                    [1, 2, 3, 4].map((i) => <Skeleton key={i} width="48%" height={160} />)
                ) : (
                    categories.map((cat: any, index: number) => {
                        const config = CATEGORY_CONFIG[cat.key] || CATEGORY_CONFIG.default;
                        return (
                            <TouchableOpacity
                                key={cat.key}
                                style={{ width: '48%' }}
                                onPress={() => handleCategorySelect(cat.key)}
                                activeOpacity={0.8}
                            >
                                <Animated.View entering={FadeInDown.delay(index * 100).springify()}>
                                    <GlassView
                                        glassEffectStyle="regular"
                                        tintColor="#3A7AFE"
                                        style={{
                                            borderRadius: 32,
                                            overflow: 'hidden',
                                            borderWidth: 1,
                                            borderColor: 'rgba(255,255,255,0.1)'
                                        }}
                                    >
                                        <View className="p-6 aspect-[4/5] justify-between relative">
                                            {/* Colored background blob for depth */}


                                            <View className="w-12 h-12 rounded-full bg-white/10 items-center justify-center border border-white/10">
                                                <Ionicons name={config.icon} size={22} color="white" />
                                            </View>
                                            <View>
                                                <Text className="text-white font-generalsans-semibold text-xl tracking-tight">{cat.name}</Text>
                                                <Text className="text-white/60 text-xs font-generalsans-medium mt-1 leading-4">{cat.description}</Text>
                                            </View>
                                        </View>
                                    </GlassView>
                                </Animated.View>
                            </TouchableOpacity>
                        );
                    })
                )}
            </View>
        </Animated.View>
    );

    const renderStep2_Templates = () => (
        <Animated.View entering={FadeInRight} exiting={FadeOutLeft}>
            <Text className="text-3xl font-generalsans-semibold text-white mb-2">Select Goal</Text>
            <Text className="text-white/80 font-generalsans-medium text-lg mb-6">Choose a template or create new.</Text>

            <TouchableOpacity onPress={handleCustomResolution} className="mb-8" activeOpacity={0.8}>
                <GlassView
                    glassEffectStyle="regular"
                    tintColor="#FFFFFF"
                    style={{ borderRadius: 24, overflow: 'hidden' }}
                >
                    <View className="p-5 flex-row items-center justify-between">
                        <View className="flex-row items-center gap-4">
                            <View className="w-12 h-12 rounded-full bg-[#3A7AFE]/10 items-center justify-center">
                                <Ionicons name="add" size={28} color="#3A7AFE" />
                            </View>
                            <View>
                                <Text className="text-[#3A7AFE] font-generalsans-semibold text-lg">Create Custom</Text>
                                <Text className="text-slate-400 text-xs font-generalsans-medium">Start from scratch</Text>
                            </View>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color="#3A7AFE" />
                    </View>
                </GlassView>
            </TouchableOpacity>

            <Text className="text-white/50 text-xs font-generalsans-bold uppercase tracking-widest mb-4 ml-2">Recommended</Text>

            {!templates ? (
                [1, 2, 3].map(i => <Skeleton key={i} width="100%" height={80} style={{ marginBottom: 12 }} />)
            ) : (
                templates.filter((t: any) => t.isPopular).map((template: any) => (
                    <SelectionCard
                        key={template._id}
                        title={template.title}
                        subtitle={template.description}
                        icon="star-outline"
                        onPress={() => handleTemplateSelect(template)}
                        selected={false}
                    />
                ))
            )}
        </Animated.View>
    );

    const renderStep3_Frequency = () => (
        <Animated.View entering={FadeInRight} exiting={FadeOutLeft}>
            {isCustom && (
                <View className="mb-4">
                    <CustomInput
                        label="Goal Title"
                        placeholder="e.g. Morning Run"
                        value={customTitle}
                        onChangeText={setCustomTitle}
                        autoFocus={true}
                    />
                </View>
            )}

            <Text className="text-3xl font-generalsans-semibold text-white mb-2">Commitment</Text>
            <Text className="text-white/80 font-generalsans-medium text-lg mb-6">How often will you do this?</Text>

            <SelectionCard title="Every Day" subtitle="Build a daily habit" icon="infinite" selected={frequencyType === 'daily'} onPress={() => setFrequencyType('daily')} />
            <SelectionCard title="Weekdays" subtitle="Monday to Friday" icon="briefcase-outline" selected={frequencyType === 'weekdays'} onPress={() => setFrequencyType('weekdays')} />
            <SelectionCard title="Weekends" subtitle="Saturday & Sunday" icon="cafe-outline" selected={frequencyType === 'weekends'} onPress={() => setFrequencyType('weekends')} />
            <SelectionCard title="Custom Days" subtitle="Specific schedule" icon="calendar-outline" selected={frequencyType === 'custom'} onPress={() => setFrequencyType('custom')} />

            {frequencyType === 'custom' && (
                <Animated.View entering={FadeInDown.springify()}>
                    <SimpleDaySelector selectedDays={customDays} toggleDay={toggleCustomDay} />
                </Animated.View>
            )}

            <View className="mt-8">
                <TouchableOpacity onPress={() => setStep(4)}>
                    <GlassView
                        glassEffectStyle="regular"
                        tintColor="#FFFFFF"
                        style={{ borderRadius: 16, height: 64, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}
                    >
                        <Text className="text-[#3A7AFE] font-generalsans-semibold text-xl">Continue</Text>
                    </GlassView>
                </TouchableOpacity>
            </View>
        </Animated.View>
    );

    const renderStep4_Tracking = () => (
        <Animated.View entering={FadeInRight} exiting={FadeOutLeft}>
            <Text className="text-3xl font-generalsans-semibold text-white mb-2">Tracking</Text>
            <Text className="text-white/80 font-generalsans-medium text-lg mb-6">How do you measure success?</Text>

            <SelectionCard title="Simple Check" subtitle="Yes or No" icon="checkmark-circle-outline" selected={trackingType === 'yes_no'} onPress={() => setTrackingType('yes_no')} />
            <SelectionCard title="Time Duration" subtitle="Track minutes" icon="timer-outline" selected={trackingType === 'time_based'} onPress={() => setTrackingType('time_based')} />

            {trackingType === 'time_based' && (
                <Animated.View entering={FadeInDown} className="mb-4">
                    <BigNumberInput value={String(targetTime)} onChangeText={(t: string) => handleNumberInput(t, setTargetTime)} suffix="Mins" />
                </Animated.View>
            )}

            <SelectionCard title="Specific Count" subtitle="Reps, pages, glasses, etc." icon="stats-chart-outline" selected={trackingType === 'count_based'} onPress={() => setTrackingType('count_based')} />

            {trackingType === 'count_based' && (
                <Animated.View entering={FadeInDown} className="mb-4">
                    <BigNumberInput value={String(targetCount)} onChangeText={(t: string) => handleNumberInput(t, setTargetCount)} suffix={countUnit} />
                    <CustomInput label="Unit Name" placeholder="e.g. Pages" value={countUnit} onChangeText={setCountUnit} />
                </Animated.View>
            )}

            <View className="mt-8">
                <TouchableOpacity onPress={() => setStep(5)}>
                    <GlassView
                        glassEffectStyle="regular"
                        tintColor="#FFFFFF"
                        style={{ borderRadius: 16, height: 64, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}
                    >
                        <Text className="text-[#3A7AFE] font-generalsans-semibold text-xl">Review Quest</Text>
                    </GlassView>
                </TouchableOpacity>
            </View>
        </Animated.View>
    );

    const renderStep5_Summary = () => {
        const catConfig = selectedCategory ? CATEGORY_CONFIG[selectedCategory] : CATEGORY_CONFIG.default;
        const textColor = catConfig.color; // Use the darker category color for text

        return (
            <Animated.View entering={FadeInRight} exiting={FadeOutLeft} className="flex-1 justify-center items-center pb-12">
                <View className="items-center mb-8">
                    <Text className="text-[32px] font-generalsans-bold tracking-tighter text-white text-center leading-tight shadow-sm shadow-blue-500/50">
                        Levora
                    </Text>
                    <View className="mt-2 bg-white/10 px-3 py-1 rounded-full border border-white/10">
                        <Text className="text-[#FFD700] text-[10px] font-generalsans-bold tracking-[2px] uppercase">
                            Your 2026 Reset
                        </Text>
                    </View>

                    {/* Social Proof */}
                    <View className="flex-row items-center mt-5 bg-black/10 px-3 py-1.5 rounded-full border border-white/5 mx-auto">
                        <View className="flex-row -space-x-1.5 mr-2">
                            {[12, 5, 8].map((i) => (
                                <Image
                                    key={i}
                                    source={{ uri: `https://i.pravatar.cc/150?img=${i}` }}
                                    style={{ width: 16, height: 16, borderRadius: 8, borderWidth: 1, borderColor: '#3A7AFE' }}
                                />
                            ))}
                        </View>
                        <Text className="text-blue-100/80 text-[10px] font-generalsans-medium">
                            <Text className="text-white font-generalsans-bold">1k+</Text> resolutions started
                        </Text>
                    </View>
                </View>

                {/* SQUIRCLE STYLE CARD */}
                <View style={{ width: '100%', borderRadius: 40, overflow: 'hidden', shadowColor: "#000", shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.15, shadowRadius: 20 }}>
                    {/* Glass container using the category background color as tint */}
                    <GlassView
                        glassEffectStyle="regular"
                        tintColor={catConfig.bgColor}
                        style={{ width: '100%' }}
                    >
                        <View className="p-8 justify-between min-h-[420px]">

                            {/* Top Section */}
                            <View>
                                <View className="flex-row justify-between items-start mb-6">
                                    <View className="bg-white/60 px-4 py-2 rounded-full border border-white/20 backdrop-blur-md">
                                        <Text style={{ color: textColor }} className="text-xs font-generalsans-bold uppercase tracking-wider opacity-80">
                                            {selectedCategory}
                                        </Text>
                                    </View>
                                    <View className="w-14 h-14 rounded-full bg-white/60 items-center justify-center border border-white/20">
                                        <Ionicons name={catConfig.icon} size={24} color={textColor} />
                                    </View>
                                </View>

                                <Text style={{ color: '#1E293B', textShadowColor: 'rgba(255,255,255,0.5)', textShadowRadius: 1 }} className="font-generalsans-bold text-[42px] leading-[46px] mb-8">
                                    {isCustom ? customTitle || 'New Resolution' : selectedTemplate?.title}
                                </Text>
                            </View>

                            {/* Stats Section - Removed Circles, using clean layout */}
                            <View className="gap-4">
                                <View className="flex-row items-center gap-4 border-b border-black/5 pb-4">
                                    <View className="w-10 h-10 rounded-full bg-white/50 items-center justify-center">
                                        <Ionicons name="calendar-outline" size={20} color={textColor} />
                                    </View>
                                    <View>
                                        <Text className="text-slate-500 text-[10px] font-generalsans-bold uppercase">Frequency</Text>
                                        <Text className="text-slate-800 font-generalsans-bold text-lg">
                                            {frequencyType === 'daily' ? 'Daily' :
                                                frequencyType === 'weekdays' ? 'Weekdays' :
                                                    frequencyType === 'weekends' ? 'Weekends' : 'Custom Days'}
                                        </Text>
                                    </View>
                                </View>

                                <View className="flex-row items-center gap-4 pb-2">
                                    <View className="w-10 h-10 rounded-full bg-white/50 items-center justify-center">
                                        <Ionicons name="radio-button-on" size={20} color={textColor} />
                                    </View>
                                    <View>
                                        <Text className="text-slate-500 text-[10px] font-generalsans-bold uppercase">Goal Target</Text>
                                        <Text className="text-slate-800 font-generalsans-bold text-lg">
                                            {trackingType === 'yes_no' ? 'Check In' : trackingType === 'time_based' ? `${targetTime} Minutes` : `${targetCount} ${countUnit}`}
                                        </Text>
                                    </View>
                                </View>
                            </View>

                            {/* Footer / XP */}
                            <View className="mt-6 pt-6 border-t border-black/5 flex-row items-center justify-between">
                                <View className="flex-row items-center gap-2">
                                    <View className="w-2 h-2 rounded-full bg-emerald-500" />
                                    <Text className="text-slate-600 font-generalsans-bold text-xs uppercase">Resolution Ready</Text>
                                </View>
                                <Text style={{ color: textColor }} className="font-generalsans-bold text-sm bg-white/50 px-3 py-1 rounded-lg overflow-hidden">+50 XP</Text>
                            </View>

                        </View>
                    </GlassView>
                </View>

                {/* Confirm Button */}
                <View className="w-full mt-10">
                    <TouchableOpacity
                        onPress={handleFinish}
                        disabled={submitting}
                    >
                        <GlassView
                            glassEffectStyle="regular"
                            tintColor="#FFFFFF"
                            style={{ borderRadius: 24, height: 72, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.5)' }}
                        >
                            {submitting ? (
                                <ActivityIndicator color="#3A7AFE" />
                            ) : (
                                <Text className="text-[#3A7AFE] font-generalsans-semibold text-xl">Initialize Resolution</Text>
                            )}
                        </GlassView>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setStep(4)} className="mt-6 items-center">
                        <Text className="text-white/50 font-generalsans-bold text-xs uppercase tracking-widest">Reconfigure</Text>
                    </TouchableOpacity>
                </View>
            </Animated.View>
        );
    }

    return (
        <View className="flex-1 bg-[#3A7AFE]">
            <LinearGradient
                colors={['#3A7AFE', '#2563EB']}
                style={StyleSheet.absoluteFill}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            />

            <SafeAreaView className="flex-1">
                {/* Header */}
                <View className="px-6 py-2 flex-row items-center justify-between h-16 z-10">
                    {step > 1 && step < 5 ? (
                        <TouchableOpacity onPress={() => setStep(step - 1)} className="w-10 h-10 rounded-full bg-white/10 items-center justify-center border border-white/20">
                            <Ionicons name="arrow-back" size={20} color="white" />
                        </TouchableOpacity>
                    ) : <View className="w-10" />}

                    {step < 5 && (
                        <View className="flex-row gap-2">
                            {[1, 2, 3, 4, 5].map(i => (
                                <Animated.View
                                    key={i}
                                    layout={LinearTransition}
                                    className={`h-1.5 rounded-full ${i === step ? 'w-6 bg-white' : i < step ? 'w-1.5 bg-white/40' : 'w-1.5 bg-white/10'}`}
                                />
                            ))}
                        </View>
                    )}
                    <View className="w-10" />
                </View>

                {/* Content */}
                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
                    <ScrollView
                        className="flex-1 px-6"
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={{ flexGrow: 1, paddingBottom: 40, paddingTop: 10 }}
                    >
                        <View className="w-full max-w-[500px] self-center">
                            {step === 1 && renderStep1_Categories()}
                            {step === 2 && renderStep2_Templates()}
                            {step === 3 && renderStep3_Frequency()}
                            {step === 4 && renderStep4_Tracking()}
                            {step === 5 && renderStep5_Summary()}
                        </View>
                    </ScrollView>
                </KeyboardAvoidingView>
            </SafeAreaView>

            <PaywallModal
                visible={showPaywall}
                onClose={() => {
                    setShowPaywall(false);
                    submitResolution();
                }}
                onCancel={() => setShowPaywall(false)}
                isHardPaywall={true}
            />
        </View>
    );
}
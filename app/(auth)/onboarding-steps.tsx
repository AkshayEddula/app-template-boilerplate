import { api } from '@/convex/_generated/api';
import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery } from 'convex/react';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
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
const CATEGORY_CONFIG: Record<string, { icon: keyof typeof Ionicons.glyphMap }> = {
    health: { icon: 'water' },
    mind: { icon: 'prism' },
    career: { icon: 'briefcase' },
    life: { icon: 'compass' },
    fun: { icon: 'color-palette' },
    default: { icon: 'star' }
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
        <Text className="text-white/80 text-xs font-inter-bold uppercase tracking-widest mb-2 ml-1">{label}</Text>
        <TextInput
            value={value}
            onChangeText={onChangeText}
            placeholder={placeholder}
            placeholderTextColor="rgba(255,255,255,0.5)"
            keyboardType={keyboardType}
            autoFocus={autoFocus}
            style={{
                textAlignVertical: 'center',
                includeFontPadding: false,
                paddingTop: Platform.OS === 'android' ? 12 : 16,
                paddingBottom: Platform.OS === 'android' ? 12 : 16,
            }}
            className="bg-white/20 border border-white/30 rounded-2xl px-5 text-white font-inter-bold text-[18px]"
            selectionColor="white"
        />
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
                className="text-white font-bricolagegrotesk-bold text-7xl text-center min-w-[80px] h-[80px]"
                placeholder="0"
                placeholderTextColor="rgba(255,255,255,0.3)"
                selectionColor="white"
                autoFocus
            />
            <Text className="text-white/50 font-inter-bold text-2xl mb-4 ml-2">{suffix}</Text>
        </View>
        <View className="h-1 w-32 bg-white/20 rounded-full mt-4" />
    </View>
);

const SelectionCard = ({ selected, onPress, title, subtitle, icon }: any) => {
    return (
        <TouchableOpacity onPress={onPress} activeOpacity={0.8} className="mb-3">
            <Animated.View
                layout={LinearTransition}
                className={`flex-row items-center p-5 rounded-3xl border transition-all ${selected ? 'bg-white border-white' : 'bg-white/10 border-white/20'}`}
                style={selected ? { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10 } : {}}
            >
                <View className={`w-12 h-12 rounded-full items-center justify-center ${selected ? 'bg-[#3A7AFE]' : 'bg-white/20'}`}>
                    <Ionicons name={icon} size={24} color={selected ? 'white' : 'white'} />
                </View>
                <View className="ml-4 flex-1">
                    <Text className={`text-[17px] font-bricolagegrotesk-bold ${selected ? 'text-[#3A7AFE]' : 'text-white'}`}>{title}</Text>
                    {subtitle && <Text className={`text-xs font-inter-medium mt-0.5 ${selected ? 'text-[#3A7AFE]/70' : 'text-blue-100/70'}`}>{subtitle}</Text>}
                </View>
                {selected && (
                    <Animated.View entering={FadeIn.duration(200)}>
                        <Ionicons name="checkmark-circle" size={26} color="#3A7AFE" />
                    </Animated.View>
                )}
            </Animated.View>
        </TouchableOpacity>
    );
};

const SimpleDaySelector = ({ selectedDays, toggleDay }: { selectedDays: number[], toggleDay: (d: number) => void }) => {
    const days = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

    return (
        <View className="mb-8 mt-6">
            <Text className="text-white/70 text-xs font-inter-bold uppercase tracking-widest mb-4 ml-1">Select Days</Text>

            <View className="flex-row justify-between items-center bg-white/5 rounded-[24px] p-4 border border-white/10">
                {days.map((day, idx) => {
                    const isSelected = (selectedDays || []).includes(idx);

                    return (
                        <TouchableOpacity
                            key={idx}
                            onPress={() => toggleDay(idx)}
                            activeOpacity={0.7}
                            className={`w-10 h-10 rounded-full items-center justify-center ${isSelected ? 'bg-white' : 'bg-white/10'}`}
                        >
                            <Text className={`font-inter-bold text-xs ${isSelected ? 'text-[#3A7AFE]' : 'text-white/60'}`}>
                                {day.slice(0, 1)}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </View>
        </View>
    );
};

// --- MAIN SCREEN ---

export default function ResolutionOnboarding() {
    const router = useRouter();
    const { width } = useWindowDimensions();

    const [step, setStep] = useState(1);
    const [submitting, setSubmitting] = useState(false);

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

    const handleFinish = async () => {
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

    const renderStep1_Categories = () => (
        <Animated.View entering={FadeInRight} exiting={FadeOutLeft}>
            <Text className="text-[40px] font-bricolagegrotesk-bold text-white mb-2 leading-tight">Focus Area</Text>
            <Text className="text-white/80 font-inter-medium text-lg mb-8">What do you want to improve?</Text>

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
                                <Animated.View entering={FadeInDown.delay(index * 100).springify()} className="aspect-[4/5] bg-white/10 border border-white/20 rounded-[32px] p-6 justify-between overflow-hidden relative shadow-lg">
                                    <View className="w-12 h-12 rounded-full bg-white/20 items-center justify-center border border-white/10 backdrop-blur-md">
                                        <Ionicons name={config.icon} size={22} color="white" />
                                    </View>
                                    <View>
                                        <Text className="text-white font-bricolagegrotesk-bold text-xl tracking-tight">{cat.name}</Text>
                                        <Text className="text-white/60 text-xs font-inter-medium mt-1 leading-4">{cat.description}</Text>
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
        <Animated.View entering={FadeInRight} exiting={FadeOutLeft}>
            <Text className="text-3xl font-bricolagegrotesk-bold text-white mb-2">Select Goal</Text>
            <Text className="text-white/80 font-inter-medium text-lg mb-6">Choose a template or create new.</Text>

            <TouchableOpacity onPress={handleCustomResolution} className="mb-8" activeOpacity={0.8}>
                <View className="bg-white rounded-[24px] p-5 flex-row items-center justify-between shadow-lg shadow-blue-900/20">
                    <View className="flex-row items-center gap-4">
                        <View className="w-12 h-12 rounded-full bg-[#3A7AFE]/10 items-center justify-center">
                            <Ionicons name="add" size={28} color="#3A7AFE" />
                        </View>
                        <View>
                            <Text className="text-[#3A7AFE] font-bricolagegrotesk-bold text-lg">Create Custom</Text>
                            <Text className="text-slate-400 text-xs">Start from scratch</Text>
                        </View>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="#3A7AFE" />
                </View>
            </TouchableOpacity>

            <Text className="text-white/50 text-xs font-inter-bold uppercase tracking-widest mb-4 ml-2">Recommended</Text>

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

            <Text className="text-3xl font-bricolagegrotesk-bold text-white mb-2">Commitment</Text>
            <Text className="text-white/80 font-inter-medium text-lg mb-6">How often will you do this?</Text>

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
                <TouchableOpacity onPress={() => setStep(4)} className="bg-white rounded-2xl h-16 items-center justify-center shadow-lg shadow-black/10">
                    <Text className="text-[#3A7AFE] font-bricolagegrotesk-bold text-xl">Continue</Text>
                </TouchableOpacity>
            </View>
        </Animated.View>
    );

    const renderStep4_Tracking = () => (
        <Animated.View entering={FadeInRight} exiting={FadeOutLeft}>
            <Text className="text-3xl font-bricolagegrotesk-bold text-white mb-2">Tracking</Text>
            <Text className="text-white/80 font-inter-medium text-lg mb-6">How do you measure success?</Text>

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
                <TouchableOpacity onPress={() => setStep(5)} className="bg-white rounded-2xl h-16 items-center justify-center shadow-lg shadow-black/10">
                    <Text className="text-[#3A7AFE] font-bricolagegrotesk-bold text-xl">Review Quest</Text>
                </TouchableOpacity>
            </View>
        </Animated.View>
    );

    const renderStep5_Summary = () => {
        const catConfig = selectedCategory ? CATEGORY_CONFIG[selectedCategory] : CATEGORY_CONFIG.default;

        return (
            <Animated.View entering={FadeInRight} exiting={FadeOutLeft} className="flex-1 justify-center items-center pb-12">
                <Text className="text-white/70 font-inter-bold uppercase tracking-[4px] mb-8 text-xs">System Initialization</Text>

                {/* HUD CARD */}
                <View className="w-full bg-white/10 border border-white/20 rounded-[40px] p-1 backdrop-blur-2xl relative">
                    <View className="bg-gradient-to-b from-white/5 to-transparent rounded-[36px] p-6 items-center">

                        {/* GLOWING CORE ICON */}
                        <View className="w-24 h-24 rounded-full border-4 border-white/10 items-center justify-center mb-6 relative">
                            {/* Inner Glow */}
                            <View className="absolute inset-0 bg-white/20 blur-xl rounded-full" />
                            <Ionicons name={catConfig.icon} size={42} color="white" />
                        </View>

                        {/* TITLE */}
                        <Text className="text-white font-bricolagegrotesk-bold text-4xl text-center leading-10 mb-2">
                            {isCustom ? customTitle || 'New Quest' : selectedTemplate?.title}
                        </Text>
                        <Text className="text-blue-100 font-inter-medium text-sm mb-8 uppercase tracking-widest opacity-60">
                            {selectedCategory}
                        </Text>

                        {/* DATA GRID */}
                        <View className="w-full flex-row gap-4 mb-6">
                            <View className="flex-1 bg-black/20 p-4 rounded-2xl border border-white/5 items-center justify-center">
                                <Text className="text-white/40 text-[10px] font-inter-bold uppercase mb-2">Frequency</Text>
                                <Ionicons name="calendar" size={20} color="white" style={{ marginBottom: 4, opacity: 0.8 }} />
                                <Text className="text-white font-inter-bold text-xs text-center">
                                    {frequencyType === 'daily' ? 'Daily' :
                                        frequencyType === 'weekdays' ? 'Weekdays' :
                                            frequencyType === 'weekends' ? 'Weekends' : 'Custom'}
                                </Text>
                            </View>
                            <View className="flex-1 bg-black/20 p-4 rounded-2xl border border-white/5 items-center justify-center">
                                <Text className="text-white/40 text-[10px] font-inter-bold uppercase mb-2">Target</Text>
                                <Ionicons name="radio-button-on" size={20} color="white" style={{ marginBottom: 4, opacity: 0.8 }} />
                                <Text className="text-white font-inter-bold text-xs text-center">
                                    {trackingType === 'yes_no' ? 'Complete' : trackingType === 'time_based' ? `${targetTime} Mins` : `${targetCount} ${countUnit}`}
                                </Text>
                            </View>
                        </View>

                        {/* SYSTEM STATUS / XP */}
                        <View className="w-full bg-white/10 rounded-xl py-3 px-4 flex-row items-center justify-between border border-white/10">
                            <View className="flex-row items-center gap-2">
                                <View className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                                <Text className="text-white/70 text-[10px] font-inter-bold uppercase">Quest Active</Text>
                            </View>
                            <Text className="text-white font-bricolagegrotesk-bold text-sm">+50 XP REWARD</Text>
                        </View>

                    </View>
                </View>

                {/* Confirm Button */}
                <View className="w-full mt-10">
                    <TouchableOpacity
                        onPress={handleFinish}
                        disabled={submitting}
                        className="bg-white rounded-2xl h-16 items-center justify-center shadow-[0_0_30px_rgba(255,255,255,0.3)]"
                    >
                        {submitting ? (
                            <ActivityIndicator color="#3A7AFE" />
                        ) : (
                            <Text className="text-[#3A7AFE] font-bricolagegrotesk-bold text-xl">Initialize Quest</Text>
                        )}
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setStep(4)} className="mt-6 items-center">
                        <Text className="text-white/50 font-inter-bold text-xs uppercase tracking-widest">Reconfigure</Text>
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
                        {step === 1 && renderStep1_Categories()}
                        {step === 2 && renderStep2_Templates()}
                        {step === 3 && renderStep3_Frequency()}
                        {step === 4 && renderStep4_Tracking()}
                        {step === 5 && renderStep5_Summary()}
                    </ScrollView>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </View>
    );
}
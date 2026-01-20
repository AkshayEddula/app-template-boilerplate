import { PaywallModal } from '@/components/Paywall';
import { useGuest } from '@/context/GuestContext';
import { useSubscription } from '@/context/SubscriptionContext';
import { api } from '@/convex/_generated/api';
import { useAuth } from '@clerk/clerk-expo';
import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery } from 'convex/react';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Keyboard,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View
} from 'react-native';
import Animated, {
    FadeInDown,
    FadeInRight,
    FadeOutLeft,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withSequence,
    withTiming,
    ZoomIn
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

// --- Theme ---
const BG_COLOR = "#FAF9F6";
const TEXT_PRIMARY = "#1A1A1A";
const TEXT_SECONDARY = "#6B7280";
const ACCENT_ORANGE = "#F97316";

// --- Types ---
type CategoryKey = 'health' | 'mind' | 'career' | 'life' | 'fun';
type TrackingType = 'yes_no' | 'time_based' | 'count_based';
type FrequencyType = 'daily' | 'weekdays' | 'weekends' | 'custom' | 'x_days_per_week';

// --- Category Config ---
const CATEGORY_CONFIG: Record<string, { emoji: string; color: string; bgColor: string }> = {
    health: { emoji: '💧', color: '#059669', bgColor: '#ECFDF5' },
    mind: { emoji: '🧘', color: '#7C3AED', bgColor: '#F5F3FF' },
    career: { emoji: '💼', color: '#D97706', bgColor: '#FFFBEB' },
    life: { emoji: '🌟', color: '#2563EB', bgColor: '#EFF6FF' },
    fun: { emoji: '🎮', color: '#DB2777', bgColor: '#FDF2F8' },
    default: { emoji: '✨', color: '#475569', bgColor: '#F8FAFC' }
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
    return <Animated.View style={[{ width, height, backgroundColor: '#E5E7EB', borderRadius: 20 }, style, animatedStyle]} />;
};

const CustomInput = ({ value, onChangeText, placeholder, keyboardType = 'default', label, autoFocus }: any) => (
    <View style={{ marginBottom: 20 }}>
        <Text style={styles.inputLabel}>{label}</Text>
        <View style={[styles.inputContainer, value && styles.inputContainerActive]}>
            <TextInput
                value={value}
                onChangeText={onChangeText}
                placeholder={placeholder}
                placeholderTextColor={TEXT_SECONDARY}
                keyboardType={keyboardType}
                autoFocus={autoFocus}
                style={styles.inputText}
                selectionColor={ACCENT_ORANGE}
            />
        </View>
    </View>
);

const BigNumberInput = ({ value, onChangeText, suffix }: any) => (
    <View style={styles.bigNumberContainer}>
        <View style={styles.bigNumberBox}>
            <TextInput
                value={value}
                onChangeText={onChangeText}
                keyboardType="number-pad"
                style={styles.bigNumberInput}
                placeholder="0"
                placeholderTextColor="#D1D5DB"
                selectionColor={ACCENT_ORANGE}
                autoFocus
            />
            <Text style={styles.bigNumberSuffix}>{suffix}</Text>
        </View>
    </View>
);

const SelectionCard = ({ selected, onPress, title, subtitle, emoji }: any) => (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8} style={{ marginBottom: 12 }}>
        <View style={[styles.selectionCard, selected && styles.selectionCardSelected]}>
            <View style={[styles.selectionIcon, selected && styles.selectionIconSelected]}>
                <Text style={{ fontSize: 22 }}>{emoji}</Text>
            </View>
            <View style={{ flex: 1 }}>
                <Text style={[styles.selectionTitle, selected && { color: ACCENT_ORANGE }]}>{title}</Text>
                {subtitle && <Text style={styles.selectionSubtitle}>{subtitle}</Text>}
            </View>
            {selected && (
                <Animated.View entering={ZoomIn.duration(200)}>
                    <Ionicons name="checkmark-circle" size={26} color={ACCENT_ORANGE} />
                </Animated.View>
            )}
        </View>
    </TouchableOpacity>
);

const SimpleDaySelector = ({ selectedDays, toggleDay }: { selectedDays: number[], toggleDay: (d: number) => void }) => {
    const days = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
    return (
        <View style={styles.daySelectorContainer}>
            <Text style={styles.daySelectorLabel}>Select Active Days</Text>
            <View style={styles.daySelectorRow}>
                {days.map((day, idx) => {
                    const isSelected = (selectedDays || []).includes(idx);
                    return (
                        <TouchableOpacity key={idx} onPress={() => toggleDay(idx)} activeOpacity={0.7}>
                            <View style={[styles.dayCircle, isSelected && styles.dayCircleSelected]}>
                                <Text style={[styles.dayText, isSelected && styles.dayTextSelected]}>{day}</Text>
                            </View>
                        </TouchableOpacity>
                    );
                })}
            </View>
        </View>
    );
};

const HeaderProgress = ({ current }: { current: number }) => {
    const stepEmojis = ['🎯', '📝', '📅', '⚡'];
    return (
        <View style={styles.progressContainer}>
            {[1, 2, 3, 4].map((i, idx) => (
                <View key={i} style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <View style={[styles.progressCircle, i <= current && styles.progressCircleActive]}>
                        {i < current ? (
                            <Ionicons name="checkmark" size={14} color="#FFF" />
                        ) : (
                            <Text style={[styles.progressNum, i <= current && styles.progressNumActive]}>{i}</Text>
                        )}
                    </View>
                    {idx < 3 && <View style={[styles.progressLine, i < current && styles.progressLineActive]} />}
                </View>
            ))}
        </View>
    );
};

// --- MAIN SCREEN ---

export default function ResolutionOnboarding() {
    const router = useRouter();
    const { isPremium } = useSubscription();
    const { isSignedIn } = useAuth();
    const { isGuest, addGuestResolution, isLoading: isGuestLoading, completeGuestOnboarding, hasCompletedOnboarding } = useGuest();

    const [step, setStep] = useState(1);
    const [submitting, setSubmitting] = useState(false);
    const [showPaywall, setShowPaywall] = useState(false);

    const user = useQuery(api.users.currentUser);
    const categories = useQuery(api.categories.list);
    const [selectedCategory, setSelectedCategory] = useState<CategoryKey | null>(null);
    const templates = useQuery(
        api.resolutionTemplates.listByCategory,
        selectedCategory ? { categoryKey: selectedCategory } : "skip"
    );

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
        const promise = submitResolution(false);
        if (!isPremium) {
            setShowPaywall(true);
        } else {
            await promise;
            router.replace('/(tabs)');
        }
    };

    // --- Render Steps ---

    const renderStep1_Categories = () => (
        <Animated.View entering={FadeInRight.springify()} exiting={FadeOutLeft}>
            <View style={styles.stepHeader}>
                <Text style={styles.stepEmoji}>🎯</Text>
                <Text style={styles.stepLabel}>STEP 1 OF 4</Text>
            </View>
            <Text style={styles.stepTitle}>Pick Your Focus</Text>
            <Text style={styles.stepSubtitle}>What part of your life are you ready to transform?</Text>

            <View style={{ gap: 10, marginTop: 28 }}>
                {!categories ? (
                    [1, 2, 3, 4, 5].map((i) => <Skeleton key={i} width="100%" height={76} />)
                ) : (
                    categories.map((cat: any, index: number) => {
                        const config = CATEGORY_CONFIG[cat.key] || CATEGORY_CONFIG.default;
                        return (
                            <TouchableOpacity key={cat.key} onPress={() => handleCategorySelect(cat.key)} activeOpacity={0.7}>
                                <Animated.View entering={FadeInDown.delay(index * 60).duration(400)}>
                                    <View style={styles.categoryCard}>
                                        <View style={[styles.categoryIcon, { backgroundColor: config.bgColor }]}>
                                            <Text style={{ fontSize: 26 }}>{config.emoji}</Text>
                                        </View>
                                        <View style={{ flex: 1 }}>
                                            <Text style={styles.categoryTitle}>{cat.name}</Text>
                                            <Text style={styles.categoryDesc}>{cat.description}</Text>
                                        </View>
                                        <View style={styles.categoryArrow}>
                                            <Ionicons name="arrow-forward" size={16} color={ACCENT_ORANGE} />
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
            <View style={styles.stepHeader}>
                <Text style={styles.stepEmoji}>📝</Text>
                <Text style={styles.stepLabel}>STEP 2 OF 4</Text>
            </View>
            <Text style={styles.stepTitle}>Choose Your Goal</Text>
            <Text style={styles.stepSubtitle}>Start with a template or create your own</Text>

            <TouchableOpacity onPress={handleCustomResolution} style={{ marginTop: 28, marginBottom: 24 }} activeOpacity={0.8}>
                <View style={styles.customCard}>
                    <View style={styles.customIcon}>
                        <Text style={{ fontSize: 24 }}>✨</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.customTitle}>Create Custom Goal</Text>
                        <Text style={styles.customSubtitle}>Build something unique</Text>
                    </View>
                    <View style={styles.customArrow}>
                        <Ionicons name="arrow-forward" size={16} color={ACCENT_ORANGE} />
                    </View>
                </View>
            </TouchableOpacity>

            <Text style={styles.sectionLabel}>Popular Options</Text>

            {!templates ? (
                [1, 2, 3].map(i => <Skeleton key={i} width="100%" height={72} style={{ marginBottom: 12 }} />)
            ) : (
                templates.filter((t: any) => t.isPopular).map((template: any, index: number) => (
                    <Animated.View key={template._id} entering={FadeInDown.delay(index * 80).springify()}>
                        <SelectionCard
                            title={template.title}
                            subtitle={template.description}
                            emoji="⭐"
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
                <CustomInput
                    label="Name your goal"
                    placeholder="e.g. Morning Meditation"
                    value={customTitle}
                    onChangeText={setCustomTitle}
                    autoFocus={true}
                />
            )}

            <View style={styles.stepHeader}>
                <Text style={styles.stepEmoji}>📅</Text>
                <Text style={styles.stepLabel}>STEP 3 OF 4</Text>
            </View>
            <Text style={styles.stepTitle}>Set Your Routine</Text>
            <Text style={styles.stepSubtitle}>When will you take action?</Text>

            <View style={{ marginTop: 24 }}>
                <SelectionCard title="Every Day" subtitle="Perfect for building habits" emoji="♾️" selected={frequencyType === 'daily'} onPress={() => setFrequencyType('daily')} />
                <SelectionCard title="Weekdays" subtitle="Monday through Friday" emoji="💼" selected={frequencyType === 'weekdays'} onPress={() => setFrequencyType('weekdays')} />
                <SelectionCard title="Weekends" subtitle="Saturday & Sunday only" emoji="☕" selected={frequencyType === 'weekends'} onPress={() => setFrequencyType('weekends')} />
                <SelectionCard title="Specific Days" subtitle="Custom weekly schedule" emoji="📅" selected={frequencyType === 'custom'} onPress={() => setFrequencyType('custom')} />
            </View>

            {frequencyType === 'custom' && (
                <Animated.View entering={FadeInDown}>
                    <SimpleDaySelector selectedDays={customDays} toggleDay={toggleCustomDay} />
                </Animated.View>
            )}

            <TouchableOpacity onPress={() => setStep(4)} style={styles.continueButton} activeOpacity={0.8}>
                <Text style={styles.continueText}>Continue</Text>
            </TouchableOpacity>
        </Animated.View>
    );

    const renderStep4_Tracking = () => (
        <Animated.View entering={FadeInRight.springify()} exiting={FadeOutLeft}>
            <View style={styles.stepHeader}>
                <Text style={styles.stepEmoji}>⚡</Text>
                <Text style={styles.stepLabel}>STEP 4 OF 4</Text>
            </View>
            <Text style={styles.stepTitle}>Track Progress</Text>
            <Text style={styles.stepSubtitle}>How will you measure success?</Text>

            <View style={{ marginTop: 24 }}>
                <SelectionCard title="Completion Only" subtitle="Simple checkbox" emoji="✅" selected={trackingType === 'yes_no'} onPress={() => setTrackingType('yes_no')} />
                <SelectionCard title="Time Duration" subtitle="Track minutes spent" emoji="⏱️" selected={trackingType === 'time_based'} onPress={() => setTrackingType('time_based')} />

                {trackingType === 'time_based' && (
                    <Animated.View entering={FadeInDown}>
                        <BigNumberInput value={String(targetTime)} onChangeText={(t: string) => handleNumberInput(t, setTargetTime)} suffix="Min" />
                    </Animated.View>
                )}

                <SelectionCard title="Numeric Count" subtitle="Reps, pages, units" emoji="🔢" selected={trackingType === 'count_based'} onPress={() => setTrackingType('count_based')} />

                {trackingType === 'count_based' && (
                    <Animated.View entering={FadeInDown}>
                        <BigNumberInput value={String(targetCount)} onChangeText={(t: string) => handleNumberInput(t, setTargetCount)} suffix={countUnit} />
                        <CustomInput label="Unit Name" placeholder="e.g. Pages" value={countUnit} onChangeText={setCountUnit} />
                    </Animated.View>
                )}
            </View>

            <TouchableOpacity onPress={() => setStep(5)} style={styles.continueButton} activeOpacity={0.8}>
                <Text style={styles.continueText}>Continue</Text>
            </TouchableOpacity>
        </Animated.View>
    );

    const renderStep5_Summary = () => {
        const catConfig = selectedCategory ? CATEGORY_CONFIG[selectedCategory] : CATEGORY_CONFIG.default;

        return (
            <Animated.View entering={FadeInRight.delay(100).springify()} exiting={FadeOutLeft} style={{ flex: 1 }}>
                {/* Celebration Header */}
                <Animated.View entering={FadeInDown.delay(200)} style={styles.celebrationHeader}>
                    <Text style={styles.celebrationEmoji}>🎉</Text>
                    <Text style={styles.celebrationTitle}>You're All Set!</Text>
                    <Text style={styles.celebrationSubtitle}>Your transformation begins today</Text>
                </Animated.View>

                {/* Main Goal Card */}
                <Animated.View entering={FadeInDown.delay(300)} style={styles.goalCard}>
                    {/* Category Icon Circle */}
                    <View style={[styles.goalIconCircle, { backgroundColor: catConfig.bgColor }]}>
                        <Text style={{ fontSize: 44 }}>{catConfig.emoji}</Text>
                    </View>

                    {/* Category Badge */}
                    <View style={[styles.goalBadge, { borderColor: catConfig.color }]}>
                        <Text style={[styles.goalBadgeText, { color: catConfig.color }]}>
                            {selectedCategory?.toUpperCase()}
                        </Text>
                    </View>

                    {/* Goal Title */}
                    <Text style={styles.goalTitle}>
                        {isCustom ? customTitle || 'New Goal' : selectedTemplate?.title}
                    </Text>

                    {/* Stats Row */}
                    <View style={styles.goalStats}>
                        <View style={styles.goalStatItem}>
                            <View style={styles.goalStatIcon}>
                                <Text style={{ fontSize: 18 }}>📅</Text>
                            </View>
                            <Text style={styles.goalStatLabel}>Frequency</Text>
                            <Text style={styles.goalStatValue}>
                                {frequencyType === 'daily' ? 'Every Day' :
                                    frequencyType === 'weekdays' ? 'Weekdays' :
                                        frequencyType === 'weekends' ? 'Weekends' : 'Custom'}
                            </Text>
                        </View>
                        <View style={styles.goalStatDivider} />
                        <View style={styles.goalStatItem}>
                            <View style={styles.goalStatIcon}>
                                <Text style={{ fontSize: 18 }}>🎯</Text>
                            </View>
                            <Text style={styles.goalStatLabel}>Target</Text>
                            <Text style={styles.goalStatValue}>
                                {trackingType === 'yes_no' ? 'Complete' : trackingType === 'time_based' ? `${targetTime} Min` : `${targetCount} ${countUnit}`}
                            </Text>
                        </View>
                    </View>
                </Animated.View>

                {/* Reward Hint */}
                <Animated.View entering={FadeInDown.delay(400)} style={styles.rewardHint}>
                    <View style={styles.rewardIconBg}>
                        <Text style={{ fontSize: 24 }}>🏆</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.rewardTitle}>Unlock Characters & Rewards</Text>
                        <Text style={styles.rewardSubtitle}>Complete daily goals to earn XP and evolve</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color={TEXT_SECONDARY} />
                </Animated.View>

                {/* CTA Button */}
                <Animated.View entering={FadeInDown.delay(500)}>
                    <TouchableOpacity onPress={handleFinish} disabled={submitting} style={styles.launchButton} activeOpacity={0.85}>
                        {submitting ? (
                            <ActivityIndicator color="#FFF" size="small" />
                        ) : (
                            <>
                                <Text style={styles.launchText}>Launch My Journey</Text>
                                <Text style={styles.launchEmoji}>🚀</Text>
                            </>
                        )}
                    </TouchableOpacity>
                </Animated.View>

                {/* Edit Link */}
                <TouchableOpacity onPress={() => setStep(4)} style={styles.editRow}>
                    <Ionicons name="pencil" size={14} color={TEXT_SECONDARY} />
                    <Text style={styles.editText}>Edit Details</Text>
                </TouchableOpacity>
            </Animated.View>
        );
    };

    return (
        <View style={styles.container}>
            <StatusBar style="dark" />
            <SafeAreaView style={{ flex: 1 }}>
                <View style={styles.header}>
                    <View style={{ width: 44 }}>
                        {step > 1 && step < 5 && (
                            <TouchableOpacity onPress={() => setStep(step - 1)} style={styles.backButton}>
                                <Ionicons name="chevron-back" size={22} color={TEXT_PRIMARY} />
                            </TouchableOpacity>
                        )}
                    </View>
                    {step < 5 && <HeaderProgress current={step} />}
                    <View style={{ width: 44 }} />
                </View>

                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={{ flex: 1 }}
                    keyboardVerticalOffset={Platform.OS === 'ios' ? 10 : 0}
                >
                    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
                        <ScrollView
                            style={{ flex: 1, paddingHorizontal: 24 }}
                            showsVerticalScrollIndicator={false}
                            contentContainerStyle={{ flexGrow: 1, paddingBottom: 40, paddingTop: 8 }}
                            keyboardShouldPersistTaps="handled"
                        >
                            <View style={{ width: '100%', maxWidth: 420, alignSelf: 'center' }}>
                                {isGuestLoading ? (
                                    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80 }}>
                                        <ActivityIndicator size="large" color={ACCENT_ORANGE} />
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
                    </TouchableWithoutFeedback>
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

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: BG_COLOR,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 12,
    },
    backButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#F3F4F6',
        alignItems: 'center',
        justifyContent: 'center',
    },
    progressContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        flex: 1,
    },
    progressCircle: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: '#F3F4F6',
        alignItems: 'center',
        justifyContent: 'center',
    },
    progressCircleActive: {
        backgroundColor: ACCENT_ORANGE,
    },
    progressNum: {
        fontFamily: 'Nunito-Bold',
        fontSize: 12,
        color: TEXT_SECONDARY,
    },
    progressNumActive: {
        color: '#FFFFFF',
    },
    progressLine: {
        width: 32,
        height: 2,
        backgroundColor: '#E5E7EB',
        marginHorizontal: 4,
    },
    progressLineActive: {
        backgroundColor: ACCENT_ORANGE,
    },
    progressRow: {
        flexDirection: 'row',
        gap: 8,
        flex: 1,
        justifyContent: 'center',
    },
    progressDot: {
        width: 40,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#E5E7EB',
    },
    progressDotActive: {
        backgroundColor: ACCENT_ORANGE,
    },
    stepHeader: {
        alignItems: 'center',
        marginBottom: 16,
    },
    stepEmoji: {
        fontSize: 40,
        marginBottom: 12,
    },
    stepLabel: {
        fontFamily: 'Nunito-Bold',
        fontSize: 11,
        color: ACCENT_ORANGE,
        letterSpacing: 2,
    },
    stepTitle: {
        fontFamily: 'Nunito-Bold',
        fontSize: 28,
        color: TEXT_PRIMARY,
        textAlign: 'center',
        marginBottom: 8,
    },
    stepSubtitle: {
        fontFamily: 'Nunito-Medium',
        fontSize: 15,
        color: TEXT_SECONDARY,
        textAlign: 'center',
    },
    categoryCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 999,
        padding: 16,
        gap: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
        elevation: 2,
    },
    categoryIcon: {
        width: 56,
        height: 56,
        borderRadius: 999,
        alignItems: 'center',
        justifyContent: 'center',
    },
    categoryTitle: {
        fontFamily: 'Nunito-Bold',
        fontSize: 16,
        color: TEXT_PRIMARY,
        marginBottom: 2,
    },
    categoryDesc: {
        fontFamily: 'Nunito-Medium',
        fontSize: 13,
        color: TEXT_SECONDARY,
    },
    categoryArrow: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#FFF7ED',
        alignItems: 'center',
        justifyContent: 'center',
    },
    customCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF7ED',
        borderRadius: 999,
        padding: 20,
        borderWidth: 1,
        borderColor: '#FDBA74',
        borderStyle: 'dashed',
        gap: 16,
    },
    customIcon: {
        width: 52,
        height: 52,
        borderRadius: 999,
        backgroundColor: '#FFEDD5',
        alignItems: 'center',
        justifyContent: 'center',
    },
    customTitle: {
        fontFamily: 'Nunito-Bold',
        fontSize: 16,
        color: TEXT_PRIMARY,
    },
    customSubtitle: {
        fontFamily: 'Nunito-Medium',
        fontSize: 13,
        color: TEXT_SECONDARY,
    },
    customArrow: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#FFEDD5',
        alignItems: 'center',
        justifyContent: 'center',
    },
    sectionLabel: {
        fontFamily: 'Nunito-Bold',
        fontSize: 12,
        color: TEXT_SECONDARY,
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 16,
    },
    selectionCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 999,
        padding: 16,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        gap: 14,
    },
    selectionCardSelected: {
        borderColor: ACCENT_ORANGE,
        backgroundColor: '#FFF7ED',
    },
    selectionIcon: {
        width: 48,
        height: 48,
        borderRadius: 999,
        backgroundColor: '#F9FAFB',
        alignItems: 'center',
        justifyContent: 'center',
    },
    selectionIconSelected: {
        backgroundColor: '#FFEDD5',
    },
    selectionTitle: {
        fontFamily: 'Nunito-Bold',
        fontSize: 15,
        color: TEXT_PRIMARY,
    },
    selectionSubtitle: {
        fontFamily: 'Nunito-Medium',
        fontSize: 13,
        color: TEXT_SECONDARY,
        marginTop: 2,
    },
    daySelectorContainer: {
        backgroundColor: '#FFFFFF',
        borderRadius: 999,
        padding: 20,
        marginTop: 16,
    },
    daySelectorLabel: {
        fontFamily: 'Nunito-Bold',
        fontSize: 12,
        color: TEXT_SECONDARY,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        textAlign: 'center',
        marginBottom: 16,
    },
    daySelectorRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    dayCircle: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#F3F4F6',
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
    continueButton: {
        backgroundColor: ACCENT_ORANGE,
        borderRadius: 999,
        paddingVertical: 18,
        alignItems: 'center',
        marginTop: 32,
        shadowColor: ACCENT_ORANGE,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 4,
    },
    continueText: {
        fontFamily: 'Nunito-Bold',
        fontSize: 16,
        color: '#FFFFFF',
    },
    inputLabel: {
        fontFamily: 'Nunito-Bold',
        fontSize: 12,
        color: TEXT_SECONDARY,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 8,
    },
    inputContainer: {
        backgroundColor: '#FFFFFF',
        borderRadius: 999,
        paddingHorizontal: 20,
        height: 56,
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    inputContainerActive: {
        borderColor: ACCENT_ORANGE,
    },
    inputText: {
        fontFamily: 'Nunito-SemiBold',
        fontSize: 16,
        color: TEXT_PRIMARY,
    },
    bigNumberContainer: {
        alignItems: 'center',
        paddingVertical: 16,
    },
    bigNumberBox: {
        flexDirection: 'row',
        alignItems: 'baseline',
        backgroundColor: '#FFFFFF',
        borderRadius: 999,
        paddingHorizontal: 24,
        paddingVertical: 16,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    bigNumberInput: {
        fontFamily: 'Nunito-Bold',
        fontSize: 36,
        color: TEXT_PRIMARY,
        minWidth: 60,
        textAlign: 'center',
    },
    bigNumberSuffix: {
        fontFamily: 'Nunito-Bold',
        fontSize: 18,
        color: TEXT_SECONDARY,
        marginLeft: 8,
    },
    reviewLabel: {
        fontFamily: 'Nunito-Bold',
        fontSize: 11,
        color: TEXT_SECONDARY,
        letterSpacing: 2,
        marginBottom: 8,
    },
    reviewTitle: {
        fontFamily: 'Nunito-Bold',
        fontSize: 30,
        color: TEXT_PRIMARY,
        marginBottom: 8,
    },
    reviewSubtitle: {
        fontFamily: 'Nunito-Medium',
        fontSize: 15,
        color: TEXT_SECONDARY,
    },
    summaryCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 28,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.08,
        shadowRadius: 24,
        elevation: 6,
    },
    summaryHeader: {
        padding: 24,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    summaryBadge: {
        backgroundColor: 'rgba(255,255,255,0.8)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 999,
    },
    summaryBadgeText: {
        fontFamily: 'Nunito-Bold',
        fontSize: 11,
        letterSpacing: 1,
    },
    summaryTitle: {
        fontFamily: 'Nunito-Bold',
        fontSize: 24,
        color: TEXT_PRIMARY,
        paddingHorizontal: 24,
        paddingBottom: 20,
    },
    summaryStats: {
        flexDirection: 'row',
        gap: 12,
        paddingHorizontal: 24,
        marginBottom: 20,
    },
    statBox: {
        flex: 1,
        backgroundColor: '#F9FAFB',
        borderRadius: 999,
        padding: 16,
        alignItems: 'center',
    },
    statLabel: {
        fontFamily: 'Nunito-Medium',
        fontSize: 11,
        color: TEXT_SECONDARY,
        marginTop: 6,
    },
    statValue: {
        fontFamily: 'Nunito-Bold',
        fontSize: 14,
        color: TEXT_PRIMARY,
        marginTop: 2,
    },
    hintBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF7ED',
        marginHorizontal: 24,
        marginBottom: 24,
        padding: 16,
        borderRadius: 999,
    },
    hintTitle: {
        fontFamily: 'Nunito-Bold',
        fontSize: 14,
        color: TEXT_PRIMARY,
    },
    hintSubtitle: {
        fontFamily: 'Nunito-Medium',
        fontSize: 12,
        color: TEXT_SECONDARY,
        marginTop: 2,
    },
    finishButton: {
        backgroundColor: ACCENT_ORANGE,
        borderRadius: 999,
        paddingVertical: 20,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        marginTop: 24,
        shadowColor: ACCENT_ORANGE,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.35,
        shadowRadius: 16,
        elevation: 6,
    },
    finishText: {
        fontFamily: 'Nunito-Bold',
        fontSize: 18,
        color: '#FFFFFF',
    },
    editLink: {
        fontFamily: 'Nunito-Bold',
        fontSize: 13,
        color: TEXT_SECONDARY,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    // New Summary Screen Styles
    celebrationHeader: {
        alignItems: 'center',
        marginBottom: 28,
    },
    celebrationEmoji: {
        fontSize: 56,
        marginBottom: 12,
    },
    celebrationTitle: {
        fontFamily: 'Nunito-Bold',
        fontSize: 28,
        color: TEXT_PRIMARY,
        marginBottom: 6,
    },
    celebrationSubtitle: {
        fontFamily: 'Nunito-Medium',
        fontSize: 15,
        color: TEXT_SECONDARY,
    },
    goalCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 32,
        padding: 28,
        alignItems: 'center',
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.08,
        shadowRadius: 24,
        elevation: 6,
    },
    goalIconCircle: {
        width: 88,
        height: 88,
        borderRadius: 44,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    goalBadge: {
        paddingHorizontal: 14,
        paddingVertical: 6,
        borderRadius: 999,
        borderWidth: 1,
        marginBottom: 12,
    },
    goalBadgeText: {
        fontFamily: 'Nunito-Bold',
        fontSize: 11,
        letterSpacing: 1.5,
    },
    goalTitle: {
        fontFamily: 'Nunito-Bold',
        fontSize: 22,
        color: TEXT_PRIMARY,
        textAlign: 'center',
        marginBottom: 20,
    },
    goalStats: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F9FAFB',
        borderRadius: 20,
        padding: 16,
        width: '100%',
    },
    goalStatItem: {
        flex: 1,
        alignItems: 'center',
    },
    goalStatIcon: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#FFFFFF',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 8,
    },
    goalStatLabel: {
        fontFamily: 'Nunito-Medium',
        fontSize: 11,
        color: TEXT_SECONDARY,
        marginBottom: 2,
    },
    goalStatValue: {
        fontFamily: 'Nunito-Bold',
        fontSize: 14,
        color: TEXT_PRIMARY,
    },
    goalStatDivider: {
        width: 1,
        height: 40,
        backgroundColor: '#E5E7EB',
        marginHorizontal: 12,
    },
    rewardHint: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 999,
        padding: 16,
        paddingRight: 20,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: '#F3F4F6',
    },
    rewardIconBg: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#FEF3C7',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 14,
    },
    rewardTitle: {
        fontFamily: 'Nunito-Bold',
        fontSize: 14,
        color: TEXT_PRIMARY,
    },
    rewardSubtitle: {
        fontFamily: 'Nunito-Medium',
        fontSize: 12,
        color: TEXT_SECONDARY,
        marginTop: 2,
    },
    launchButton: {
        backgroundColor: ACCENT_ORANGE,
        borderRadius: 999,
        paddingVertical: 20,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        shadowColor: ACCENT_ORANGE,
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.4,
        shadowRadius: 20,
        elevation: 8,
    },
    launchText: {
        fontFamily: 'Nunito-Bold',
        fontSize: 18,
        color: '#FFFFFF',
    },
    launchEmoji: {
        fontSize: 22,
    },
    editRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 18,
        gap: 6,
    },
    editText: {
        fontFamily: 'Nunito-SemiBold',
        fontSize: 14,
        color: TEXT_SECONDARY,
    },
});
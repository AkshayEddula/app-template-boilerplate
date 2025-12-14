import { api } from '@/convex/_generated/api';
import { useMutation } from 'convex/react';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    ActivityIndicator, Alert,
    StyleSheet,
    Text, TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function OnboardingSteps() {
    const router = useRouter();
    const completeOnboarding = useMutation(api.users.completeOnboarding);

    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        goal: '',
        experience: '',
    });

    const handleSelection = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleNext = () => {
        if (step === 1 && !formData.goal) {
            Alert.alert("Please select a goal");
            return;
        }
        setStep(step + 1);
    };

    const handleFinish = async () => {
        if (!formData.experience) {
            Alert.alert("Please select your experience level");
            return;
        }

        setLoading(true);
        try {
            await completeOnboarding({
                goal: formData.goal,
                experience: formData.experience,
                is_onboarded: true,
            });
            // Navigate to home after successful DB update
            router.replace('/(tabs)');
        } catch (error) {
            Alert.alert("Error", "Failed to save preferences. Please try again.");
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Progress Bar */}
            <View style={styles.progressContainer}>
                <View style={[styles.progressBar, { width: step === 1 ? '50%' : '100%' }]} />
            </View>

            <View style={styles.content}>
                {/* STEP 1: GOALS */}
                {step === 1 && (
                    <View>
                        <Text style={styles.header}>What brings you here?</Text>
                        <Text style={styles.subHeader}>Select your primary goal so we can tailor the experience.</Text>

                        <OptionButton
                            label="Learn new skills"
                            selected={formData.goal === 'learn'}
                            onPress={() => handleSelection('goal', 'learn')}
                        />
                        <OptionButton
                            label="Build a project"
                            selected={formData.goal === 'build'}
                            onPress={() => handleSelection('goal', 'build')}
                        />
                        <OptionButton
                            label="Connect with others"
                            selected={formData.goal === 'connect'}
                            onPress={() => handleSelection('goal', 'connect')}
                        />
                    </View>
                )}

                {/* STEP 2: EXPERIENCE */}
                {step === 2 && (
                    <View>
                        <Text style={styles.header}>What's your experience?</Text>
                        <Text style={styles.subHeader}>We'll adjust the content difficulty based on this.</Text>

                        <OptionButton
                            label="Just starting out"
                            selected={formData.experience === 'beginner'}
                            onPress={() => handleSelection('experience', 'beginner')}
                        />
                        <OptionButton
                            label="I have some experience"
                            selected={formData.experience === 'intermediate'}
                            onPress={() => handleSelection('experience', 'intermediate')}
                        />
                        <OptionButton
                            label="I'm a pro"
                            selected={formData.experience === 'advanced'}
                            onPress={() => handleSelection('experience', 'advanced')}
                        />

                        <View style={styles.termsContainer}>
                            <Text style={styles.termsText}>
                                By tapping Finish, you agree to our Terms of Service.
                            </Text>
                        </View>
                    </View>
                )}
            </View>

            {/* Footer / Buttons */}
            <View style={styles.footer}>
                {step === 1 ? (
                    <TouchableOpacity style={styles.button} onPress={handleNext}>
                        <Text style={styles.buttonText}>Next</Text>
                    </TouchableOpacity>
                ) : (
                    <TouchableOpacity
                        style={[styles.button, styles.buttonPrimary]}
                        onPress={handleFinish}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.buttonText}>Finish Setup</Text>
                        )}
                    </TouchableOpacity>
                )}
            </View>
        </SafeAreaView>
    );
}

// Reusable Option Component
function OptionButton({ label, selected, onPress }: { label: string, selected: boolean, onPress: () => void }) {
    return (
        <TouchableOpacity
            style={[styles.option, selected && styles.optionSelected]}
            onPress={onPress}
            activeOpacity={0.7}
        >
            <Text style={[styles.optionText, selected && styles.optionTextSelected]}>
                {label}
            </Text>
            {selected && <View style={styles.circleChecked} />}
            {!selected && <View style={styles.circleUnchecked} />}
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FFFFFF' },
    progressContainer: { height: 4, backgroundColor: '#F0F0F0', marginHorizontal: 20, marginTop: 20, borderRadius: 2 },
    progressBar: { height: '100%', backgroundColor: '#007AFF', borderRadius: 2 },
    content: { flex: 1, paddingHorizontal: 24, paddingTop: 40 },
    header: { fontSize: 28, fontWeight: '700', color: '#111', marginBottom: 12 },
    subHeader: { fontSize: 16, color: '#666', marginBottom: 32, lineHeight: 24 },
    option: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 18, borderRadius: 16, backgroundColor: '#F8F9FA', marginBottom: 12, borderWidth: 2, borderColor: 'transparent' },
    optionSelected: { backgroundColor: '#F0F7FF', borderColor: '#007AFF' },
    optionText: { fontSize: 16, fontWeight: '600', color: '#333' },
    optionTextSelected: { color: '#007AFF' },
    circleUnchecked: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: '#DDD' },
    circleChecked: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#007AFF' },
    footer: { padding: 24, borderTopWidth: 1, borderTopColor: '#F0F0F0' },
    button: { backgroundColor: '#007AFF', height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', shadowColor: '#007AFF', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4 },
    buttonPrimary: { backgroundColor: '#111', shadowColor: '#000' },
    buttonText: { color: '#FFF', fontSize: 18, fontWeight: '600' },
    termsContainer: { marginTop: 24, paddingHorizontal: 12 },
    termsText: { fontSize: 13, color: '#888', textAlign: 'center', lineHeight: 18 },
});
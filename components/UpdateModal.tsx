import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import React from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';

// Theme
const BG_COLOR = "#FAF9F6";
const TEXT_PRIMARY = "#1A1A1A";
const TEXT_SECONDARY = "#6B7280";
const ACCENT_ORANGE = "#F97316";

export type UpdateModalProps = {
    visible: boolean;
    type: 'mandatory' | 'optional';
    onUpdate: () => void;
    onDismiss?: () => void;
};

const UpdateModal: React.FC<UpdateModalProps> = ({ visible, type, onUpdate, onDismiss }) => {
    const isMandatory = type === 'mandatory';

    return (
        <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
            <View style={styles.overlay}>
                {/* Background Blur */}
                <BlurView intensity={25} tint="light" style={StyleSheet.absoluteFill} />
                <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.3)' }]} />

                {/* Modal Content */}
                <Animated.View entering={FadeInUp.springify().damping(15)} style={styles.modalCard}>
                    {/* Icon */}
                    <View style={styles.iconCircle}>
                        <Text style={styles.iconEmoji}>🚀</Text>
                    </View>

                    {/* Badge */}
                    <View style={styles.badge}>
                        <Text style={styles.badgeText}>
                            {isMandatory ? '⚠️ REQUIRED' : '✨ NEW'}
                        </Text>
                    </View>

                    {/* Title */}
                    <Text style={styles.title}>
                        {isMandatory ? "Update Required" : "New Version Available"}
                    </Text>

                    {/* Description */}
                    <Text style={styles.description}>
                        {isMandatory
                            ? "This version of Levora is no longer supported. Please update to continue your journey."
                            : "A new improved version is ready! Update now for the best experience and new features."}
                    </Text>

                    {/* Features hint for optional */}
                    {!isMandatory && (
                        <View style={styles.featuresRow}>
                            <View style={styles.featureItem}>
                                <Text style={styles.featureEmoji}>🐛</Text>
                                <Text style={styles.featureText}>Bug Fixes</Text>
                            </View>
                            <View style={styles.featureDot} />
                            <View style={styles.featureItem}>
                                <Text style={styles.featureEmoji}>⚡</Text>
                                <Text style={styles.featureText}>Faster</Text>
                            </View>
                            <View style={styles.featureDot} />
                            <View style={styles.featureItem}>
                                <Text style={styles.featureEmoji}>🎨</Text>
                                <Text style={styles.featureText}>New UI</Text>
                            </View>
                        </View>
                    )}

                    {/* Update Button */}
                    <TouchableOpacity
                        onPress={onUpdate}
                        activeOpacity={0.85}
                        style={styles.updateButton}
                    >
                        <Text style={styles.updateButtonText}>Update Now</Text>
                        <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
                    </TouchableOpacity>

                    {/* Dismiss Option */}
                    {!isMandatory && onDismiss && (
                        <TouchableOpacity
                            onPress={onDismiss}
                            activeOpacity={0.6}
                            style={styles.dismissButton}
                        >
                            <Text style={styles.dismissText}>Maybe Later</Text>
                        </TouchableOpacity>
                    )}
                </Animated.View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    modalCard: {
        width: '100%',
        maxWidth: 360,
        backgroundColor: '#FFFFFF',
        borderRadius: 32,
        padding: 32,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 16 },
        shadowOpacity: 0.15,
        shadowRadius: 32,
        elevation: 12,
    },
    iconCircle: {
        width: 88,
        height: 88,
        borderRadius: 44,
        backgroundColor: '#FFF7ED',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
        shadowColor: ACCENT_ORANGE,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 20,
        elevation: 4,
    },
    iconEmoji: {
        fontSize: 44,
    },
    badge: {
        backgroundColor: '#FEF3C7',
        paddingHorizontal: 14,
        paddingVertical: 6,
        borderRadius: 999,
        marginBottom: 16,
    },
    badgeText: {
        fontFamily: 'Nunito-Bold',
        fontSize: 11,
        color: '#D97706',
        letterSpacing: 1,
    },
    title: {
        fontFamily: 'Nunito-Bold',
        fontSize: 24,
        color: TEXT_PRIMARY,
        textAlign: 'center',
        marginBottom: 12,
    },
    description: {
        fontFamily: 'Nunito-Medium',
        fontSize: 15,
        color: TEXT_SECONDARY,
        textAlign: 'center',
        lineHeight: 23,
        marginBottom: 24,
    },
    featuresRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 24,
        flexWrap: 'wrap',
    },
    featureItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    featureEmoji: {
        fontSize: 14,
    },
    featureText: {
        fontFamily: 'Nunito-SemiBold',
        fontSize: 12,
        color: TEXT_SECONDARY,
    },
    featureDot: {
        width: 4,
        height: 4,
        borderRadius: 2,
        backgroundColor: '#D1D5DB',
        marginHorizontal: 10,
    },
    updateButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: ACCENT_ORANGE,
        paddingVertical: 18,
        borderRadius: 999,
        width: '100%',
        gap: 10,
        shadowColor: ACCENT_ORANGE,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.35,
        shadowRadius: 16,
        elevation: 6,
    },
    updateButtonText: {
        fontFamily: 'Nunito-Bold',
        fontSize: 16,
        color: '#FFFFFF',
    },
    dismissButton: {
        paddingVertical: 14,
        width: '100%',
        alignItems: 'center',
    },
    dismissText: {
        fontFamily: 'Nunito-SemiBold',
        fontSize: 14,
        color: TEXT_SECONDARY,
    },
});

export default UpdateModal;

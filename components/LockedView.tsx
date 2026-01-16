import { BlurView } from 'expo-blur';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

// Theme
const ACCENT_ORANGE = "#F97316";
const TEXT_PRIMARY = "#1A1A1A";

interface LockedViewProps {
    onUnlock: () => void;
    message: string;
    buttonText: string;
}

export const LockedView = ({ onUnlock, message, buttonText }: LockedViewProps) => (
    <View style={styles.container}>
        <BlurView intensity={30} tint="light" style={StyleSheet.absoluteFill} />
        <View style={styles.overlay} />

        <View style={styles.content}>
            {/* Lock Icon */}
            <View style={styles.iconContainer}>
                <Text style={{ fontSize: 40 }}>🔒</Text>
            </View>

            <Text style={styles.title}>Premium Access</Text>
            <Text style={styles.message}>{message}</Text>

            <TouchableOpacity onPress={onUnlock} activeOpacity={0.8} style={styles.button}>
                <Text style={styles.buttonText}>{buttonText}</Text>
            </TouchableOpacity>
        </View>
    </View>
);

const styles = StyleSheet.create({
    container: {
        ...StyleSheet.absoluteFillObject,
        zIndex: 45,
        alignItems: 'center',
        justifyContent: 'center',
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(255, 255, 255, 0.7)',
    },
    content: {
        alignItems: 'center',
        paddingHorizontal: 40,
        maxWidth: 400,
    },
    iconContainer: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#FFF7ED',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 24,
        shadowColor: ACCENT_ORANGE,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 4,
    },
    title: {
        fontFamily: 'Nunito-Bold',
        fontSize: 26,
        color: TEXT_PRIMARY,
        textAlign: 'center',
        marginBottom: 8,
    },
    message: {
        fontFamily: 'Nunito-Medium',
        fontSize: 15,
        color: '#6B7280',
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 28,
    },
    button: {
        backgroundColor: ACCENT_ORANGE,
        paddingHorizontal: 32,
        paddingVertical: 16,
        borderRadius: 999,
        shadowColor: ACCENT_ORANGE,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 4,
    },
    buttonText: {
        fontFamily: 'Nunito-Bold',
        fontSize: 16,
        color: '#FFFFFF',
    },
});

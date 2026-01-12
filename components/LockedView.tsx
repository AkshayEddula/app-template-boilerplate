import { LockKeyIcon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { BlurView } from 'expo-blur';
import { GlassView } from 'expo-glass-effect';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface LockedViewProps {
    onUnlock: () => void;
    message: string;
    buttonText: string;
}

export const LockedView = ({ onUnlock, message, buttonText }: LockedViewProps) => (
    <View style={[StyleSheet.absoluteFill, { zIndex: 45, alignItems: 'center', justifyContent: 'center' }]}>
        <BlurView
            intensity={20}
            tint="dark"
            style={StyleSheet.absoluteFill}
        />
        {/* Gradient Overlay for extra depth */}
        <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.4)' }]} />

        <View className="items-center px-8 w-full max-w-[400px]">
            {/* Icon Container with Glow */}
            <View className="mb-8 relative items-center justify-center">
                {/* <View className="absolute w-[120px] h-[120px] bg-[#3A7AFE]/30 rounded-full blur-2xl" /> */}
                <View
                    className="w-32 h-32 rounded-full items-center justify-center border border-white/10 relative"
                    style={{
                        backgroundColor: 'rgba(255, 255, 255, 0.08)',
                        shadowColor: '#3A7AFE',
                        shadowOffset: { width: 0, height: 0 },
                        borderRadius: 64,
                        shadowOpacity: 0.5,
                        shadowRadius: 20,
                    }}
                >
                    <GlassView glassEffectStyle="regular" style={{ ...StyleSheet.absoluteFillObject, borderRadius: 64 }} tintColor="#3A7AFE" />
                    <HugeiconsIcon icon={LockKeyIcon} size={42} color="#FFFFFF" variant="solid" />
                </View>
            </View>

            <Text className="text-white font-generalsans-bold text-[32px] text-center mb-3 tracking-tight">
                Premium Access
            </Text>
            <Text className="text-white/70 font-generalsans-medium text-[16px] text-center leading-6 mb-10">
                {message}
            </Text>

            <TouchableOpacity
                onPress={onUnlock}
                activeOpacity={0.8}
                className="w-full"
            >
                <View
                    style={{
                        shadowColor: '#3A7AFE',
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: 0.4,
                        shadowRadius: 12,
                        elevation: 8,
                    }}
                >
                    <GlassView
                        glassEffectStyle="regular"
                        tintColor="#3A7AFE"
                        style={{
                            height: 60,
                            borderRadius: 20,
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderWidth: 1,
                            borderColor: 'rgba(255,255,255,0.2)'
                        }}
                    >
                        <Text className="text-white font-generalsans-bold text-[18px]">
                            {buttonText}
                        </Text>
                    </GlassView>
                </View>
            </TouchableOpacity>
        </View>
    </View>
);

import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';

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
            <View className="flex-1 justify-center items-center p-6">
                {/* Background Blur */}
                <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />

                {/* Modal Content */}
                <Animated.View
                    entering={FadeInUp.springify().damping(0)}
                    className="w-full max-w-[360px] bg-white rounded-[32px] p-8 items-center shadow-2xl shadow-black/20"
                >
                    <View className="w-20 h-20 rounded-full bg-[#3A7AFE] justify-center items-center mb-6 shadow-lg shadow-[#3A7AFE]/30">
                        <Ionicons name="rocket-outline" size={40} color="#fff" />
                    </View>

                    <Text className="text-2xl font-generalsans-semibold text-[#0F172A] mb-3 text-center">
                        {isMandatory ? "Update Required" : "New Version Available"}
                    </Text>

                    <Text className="text-base font-generalsans-medium text-[#64748B] text-center mb-8 leading-6">
                        {isMandatory
                            ? "This version of Resolution is no longer supported. Please update to continue your journey."
                            : "A new improved version of Resolution is ready! Update now for the best experience."}
                    </Text>

                    <Pressable
                        onPress={onUpdate}
                        className="bg-[#0F172A] py-[18px] rounded-[20px] w-full items-center mb-3 active:opacity-90 active:scale-[0.98]"
                    >
                        <Text className="text-white text-base font-generalsans-semibold">Update App</Text>
                    </Pressable>

                    {!isMandatory && onDismiss && (
                        <Pressable
                            onPress={onDismiss}
                            className="py-2 w-full items-center active:opacity-60"
                        >
                            <Text className="text-[#94A3B8] text-base font-generalsans-medium">Maybe Later</Text>
                        </Pressable>
                    )}
                </Animated.View>
            </View>
        </Modal>
    );
};

export default UpdateModal;

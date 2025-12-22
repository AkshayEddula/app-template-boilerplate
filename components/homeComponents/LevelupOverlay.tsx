import { useEffect } from "react";
import { Modal, StyleSheet, Text, TouchableOpacity } from "react-native";
import Animated, { Easing, useAnimatedStyle, useSharedValue, withSequence, withSpring, withTiming } from "react-native-reanimated";
import { CharacterCard } from "./CharacterCard";

export const LevelUpOverlay = ({ visible, onClose, categoryKey, newTotalXp }: { visible: boolean, onClose: () => void, categoryKey: string | null, newTotalXp: number }) => {
    const scale = useSharedValue(0);
    const rotateY = useSharedValue(0);
    const opacity = useSharedValue(0);

    useEffect(() => {
        if (visible) {
            scale.value = 0;
            rotateY.value = 0;
            opacity.value = 0;

            opacity.value = withTiming(1, { duration: 300 });
            scale.value = withSequence(
                withTiming(0, { duration: 100 }),
                withSpring(1, { damping: 12 })
            );
            rotateY.value = withSequence(
                withTiming(0, { duration: 100 }),
                withTiming(360, { duration: 1200, easing: Easing.out(Easing.cubic) })
            );
        }
    }, [visible]);

    const cardStyle = useAnimatedStyle(() => ({
        transform: [
            { perspective: 1000 },
            { scale: scale.value },
            { rotateY: `${rotateY.value}deg` }
        ]
    }));

    const bgStyle = useAnimatedStyle(() => ({
        opacity: opacity.value
    }));

    if (!visible || !categoryKey) return null;

    return (
        <Modal transparent visible={visible} animationType="none">
            <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.9)', alignItems: 'center', justifyContent: 'center' }, bgStyle]}>
                <Animated.View style={[cardStyle, { alignItems: 'center' }]}>
                    <Text className="text-white font-generalsans-bold text-4xl mb-6 tracking-tighter shadow-lg" style={{ textShadowColor: '#fff', textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 10 }}>
                        NEW CARD!
                    </Text>

                    <CharacterCard categoryKey={categoryKey} xp={newTotalXp} />

                    <TouchableOpacity onPress={onClose} className="mt-12 bg-white px-10 py-4 rounded-full shadow-xl">
                        <Text className="text-black font-generalsans-bold text-lg uppercase tracking-widest">Collect</Text>
                    </TouchableOpacity>
                </Animated.View>
            </Animated.View>
        </Modal>
    );
};
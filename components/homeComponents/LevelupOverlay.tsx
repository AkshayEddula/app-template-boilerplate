import { useEffect } from "react";
import { Modal, StyleSheet, Text, TouchableOpacity, useWindowDimensions } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from "react-native-reanimated";
import { CharacterCard, getCurrentStageInfo } from "./CharacterCard";

export const LevelUpOverlay = ({
  visible,
  onClose,
  categoryKey,
  newTotalXp,
  imageUrl,
  isLevelUp = false,
}: {
  visible: boolean;
  onClose: () => void;
  categoryKey: string | null;
  newTotalXp: number;
  imageUrl?: string;
  isLevelUp?: boolean;
}) => {
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;

  const { current, next } = getCurrentStageInfo(newTotalXp);
  const xpNeeded = next ? next.minXp - newTotalXp : 0;
  // Card Values
  const scale = useSharedValue(0);
  const rotateY = useSharedValue(0);
  const opacity = useSharedValue(0);

  // UI Elements Values (Button/Text)
  const contentOpacity = useSharedValue(0);
  const contentTranslateY = useSharedValue(20);

  useEffect(() => {
    if (visible) {
      // 1. Reset values
      scale.value = 0.2; // Start small, but visible
      rotateY.value = 0;
      opacity.value = 0;
      contentOpacity.value = 0;
      contentTranslateY.value = 20;

      // 2. Main Card Animation (Spin + Zoom)
      // Duration: 1000ms, Smooth deceleration (Cubic)
      const CONFIG = {
        duration: 1000,
        easing: Easing.out(Easing.cubic),
      };

      opacity.value = withTiming(1, { duration: 200 }); // Fade in quickly

      // Spin 2 full times (720deg)
      rotateY.value = withTiming(1440, CONFIG);

      // Zoom from 0.2 to 1.0 same timing
      scale.value = withTiming(1, CONFIG);

      // 3. Reveal Text and Button AFTER card lands (delay 700ms)
      contentOpacity.value = withDelay(700, withTiming(1, { duration: 500 }));
      contentTranslateY.value = withDelay(
        700,
        withTiming(0, { duration: 500, easing: Easing.out(Easing.back(1)) }),
      );
    }
  }, [visible]);

  const cardStyle = useAnimatedStyle(() => ({
    transform: [
      { perspective: 1000 },
      { scale: scale.value },
      { rotateY: `${rotateY.value}deg` },
    ],
    opacity: opacity.value,
  }));

  const uiStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
    transform: [{ translateY: contentTranslateY.value }],
  }));

  if (!visible || !categoryKey) return null;

  return (
    <Modal transparent visible={visible} animationType="fade">
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          {
            backgroundColor: "rgba(0,0,0,0.9)",
            alignItems: "center",
            justifyContent: "center",
          },
        ]}
      >
        {/* 1. Title (Appears after card) */}
        <Animated.View style={[uiStyle, { marginBottom: 40 }]}>
          <Text
            className="text-white font-generalsans-bold text-4xl tracking-tighter"
            style={{
              textShadowColor: "rgba(255,255,255,0.5)",
              textShadowOffset: { width: 0, height: 0 },
              textShadowRadius: 20,
            }}
          >
            {isLevelUp ? "NEW CARD!" : "XP GAINED!"}
          </Text>
          {!isLevelUp && next && (
            <Text className="text-white/70 font-generalsans-medium text-sm mt-2 text-center uppercase tracking-widest">
              {xpNeeded} XP to {next.name}
            </Text>
          )}
        </Animated.View>

        {/* 2. The Card (Spins and Zooms) - With Tablet Size Limit */}
        <Animated.View
          style={[
            cardStyle,
            {
              alignItems: "center",
              zIndex: 10,
              maxWidth: isTablet ? 400 : undefined,
              width: isTablet ? 400 : undefined,
            }
          ]}
        >
          <CharacterCard
            categoryKey={categoryKey}
            xp={newTotalXp}
            imageUrl={imageUrl || ""}
            scale={isTablet ? 0.6 : 1}
          />
        </Animated.View>

        {/* 3. Button (Appears after card) */}
        <Animated.View style={[uiStyle, { marginTop: 50 }]}>
          <TouchableOpacity
            onPress={onClose}
            activeOpacity={0.8}
            className="bg-white px-12 py-4 rounded-full shadow-xl shadow-white/20"
          >
            <Text className="text-black font-generalsans-bold text-lg uppercase tracking-widest">
              Collect
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

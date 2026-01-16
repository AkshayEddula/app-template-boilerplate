import { BlurView } from "expo-blur";
import { Image } from "expo-image";
import { useEffect } from "react";
import { Modal, StyleSheet, Text, TouchableOpacity, useWindowDimensions, View } from "react-native";
import Animated, {
  Easing,
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { getCurrentStageInfo } from "./CharacterCard";

// Theme Colors
const ACCENT_ORANGE = "#F97316";
const SUCCESS_GREEN = "#22C55E";

// Category Config
const CATEGORY_STYLES: Record<string, { color: string; icon: string; bg: string }> = {
  health: { color: "#10B981", icon: "💧", bg: "#ECFDF5" },
  mind: { color: "#8B5CF6", icon: "🧘", bg: "#F5F3FF" },
  career: { color: "#3B82F6", icon: "💼", bg: "#EFF6FF" },
  life: { color: "#F59E0B", icon: "🌟", bg: "#FFFBEB" },
  fun: { color: "#EC4899", icon: "🎮", bg: "#FDF2F8" },
  default: { color: ACCENT_ORANGE, icon: "✨", bg: "#FFF7ED" },
};

// Mini Card for Overlay
const MiniCard = ({ categoryKey, imageUrl, xp }: { categoryKey: string; imageUrl?: string; xp: number }) => {
  const { current, next } = getCurrentStageInfo(xp);
  const categoryStyle = CATEGORY_STYLES[categoryKey] || CATEGORY_STYLES.default;

  const rangeStart = current.minXp;
  const rangeEnd = next ? next.minXp : current.minXp * 1.5;
  const progressPercent = Math.min(Math.max((xp - rangeStart) / (rangeEnd - rangeStart), 0), 1) * 100;

  return (
    <View style={[styles.miniCard, { borderColor: categoryStyle.color }]}>
      {/* Image */}
      {imageUrl ? (
        <Image source={{ uri: imageUrl }} style={styles.cardImage} contentFit="cover" />
      ) : (
        <View style={[styles.cardImagePlaceholder, { backgroundColor: categoryStyle.bg }]}>
          <Text style={{ fontSize: 60 }}>{categoryStyle.icon}</Text>
        </View>
      )}

      {/* Bottom Info */}
      <View style={styles.cardInfo}>
        <View style={[styles.categoryBadge, { backgroundColor: categoryStyle.bg }]}>
          <Text style={{ fontSize: 16 }}>{categoryStyle.icon}</Text>
          <Text style={[styles.categoryText, { color: categoryStyle.color }]}>
            {categoryKey.charAt(0).toUpperCase() + categoryKey.slice(1)}
          </Text>
        </View>

        <View style={styles.stageRow}>
          <Text style={styles.stageName}>{current.name}</Text>
          <Text style={styles.xpText}>{xp} XP</Text>
        </View>

        {/* Progress Bar */}
        <View style={styles.progressBg}>
          <View style={[styles.progressFill, { width: `${progressPercent}%`, backgroundColor: categoryStyle.color }]} />
        </View>
      </View>
    </View>
  );
};

export const LevelUpOverlay = ({
  visible,
  onClose,
  categoryKey,
  newTotalXp,
  imageUrl,
  isLevelUp = false,
  xpGained = 10,
}: {
  visible: boolean;
  onClose: () => void;
  categoryKey: string | null;
  newTotalXp: number;
  imageUrl?: string;
  isLevelUp?: boolean;
  xpGained?: number;
}) => {
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;

  const { current, next } = getCurrentStageInfo(newTotalXp);
  const xpNeeded = next ? next.minXp - newTotalXp : 0;

  // Animation Values
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);
  const contentOpacity = useSharedValue(0);
  const contentTranslateY = useSharedValue(20);
  const glowScale = useSharedValue(1);

  useEffect(() => {
    if (visible) {
      // Reset
      scale.value = 0.5;
      opacity.value = 0;
      contentOpacity.value = 0;
      contentTranslateY.value = 20;
      glowScale.value = 1;

      // Simple scale up animation
      const CONFIG = { duration: 600, easing: Easing.out(Easing.back(1.2)) };

      opacity.value = withTiming(1, { duration: 300 });
      scale.value = withTiming(1, CONFIG);

      contentOpacity.value = withDelay(400, withTiming(1, { duration: 400 }));
      contentTranslateY.value = withDelay(400, withTiming(0, { duration: 400, easing: Easing.out(Easing.cubic) }));

      // Glow pulse
      glowScale.value = withDelay(
        500,
        withRepeat(withSequence(withTiming(1.1, { duration: 1500 }), withTiming(1, { duration: 1500 })), -1, true)
      );
    }
  }, [visible]);

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const uiStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
    transform: [{ translateY: contentTranslateY.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    transform: [{ scale: glowScale.value }],
  }));

  if (!visible || !categoryKey) return null;

  const categoryStyle = CATEGORY_STYLES[categoryKey] || CATEGORY_STYLES.default;

  return (
    <Modal transparent visible={visible} animationType="fade">
      {/* Backdrop */}
      <View style={StyleSheet.absoluteFill}>
        <BlurView intensity={50} tint="dark" style={StyleSheet.absoluteFill} />
        <View style={{ ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.7)" }} />
      </View>

      <View style={styles.container}>
        {/* Celebration Emojis */}
        <Animated.View entering={FadeIn.delay(500)} style={styles.emojisTop}>
          <Text style={{ fontSize: 36 }}>🎉</Text>
          <Text style={{ fontSize: 28 }}>✨</Text>
          <Text style={{ fontSize: 36 }}>🎊</Text>
        </Animated.View>

        {/* Title Section */}
        <Animated.View style={[uiStyle, styles.titleContainer]}>
          <View style={[styles.titleBadge, { backgroundColor: categoryStyle.bg }]}>
            <Text style={{ fontSize: 28 }}>{isLevelUp ? "🏆" : "⚡"}</Text>
          </View>
          <Text style={styles.title}>{isLevelUp ? "New Stage!" : "XP Earned!"}</Text>
          {!isLevelUp && next && (
            <View style={styles.xpToBadge}>
              <Text style={styles.xpToText}>{xpNeeded} XP to {next.name}</Text>
            </View>
          )}
        </Animated.View>

        {/* Glow */}
        <Animated.View style={[styles.glowCircle, { backgroundColor: categoryStyle.color }, glowStyle]} />

        {/* The Card */}
        <Animated.View style={[cardStyle, { zIndex: 10, width: isTablet ? 340 : 300 }]}>
          <MiniCard categoryKey={categoryKey} imageUrl={imageUrl} xp={newTotalXp} />
        </Animated.View>


        {/* Collect Button */}
        <Animated.View style={[uiStyle, styles.buttonContainer]}>
          <TouchableOpacity onPress={onClose} activeOpacity={0.8} style={styles.collectButton}>
            <Text style={styles.collectButtonText}>Collect</Text>
            <Text style={{ fontSize: 20 }}>🎁</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  emojisTop: {
    position: "absolute",
    top: 80,
    flexDirection: "row",
    gap: 20,
  },
  titleContainer: {
    alignItems: "center",
    marginBottom: 24,
  },
  titleBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  title: {
    fontFamily: "Nunito-Bold",
    fontSize: 32,
    color: "#FFFFFF",
    textAlign: "center",
    textShadowColor: "rgba(0,0,0,0.4)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 10,
  },
  xpToBadge: {
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    marginTop: 10,
  },
  xpToText: {
    fontFamily: "Nunito-SemiBold",
    fontSize: 13,
    color: "rgba(255,255,255,0.9)",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  glowCircle: {
    position: "absolute",
    width: 280,
    height: 280,
    borderRadius: 140,
    opacity: 0.2,
  },
  xpGainedBadge: {
    backgroundColor: SUCCESS_GREEN,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 999,
    marginTop: 20,
    shadowColor: SUCCESS_GREEN,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4,
  },
  xpGainedText: {
    fontFamily: "Nunito-Bold",
    fontSize: 20,
    color: "#FFFFFF",
  },
  buttonContainer: {
    marginTop: 32,
  },
  collectButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: ACCENT_ORANGE,
    paddingVertical: 18,
    paddingHorizontal: 48,
    borderRadius: 999,
    shadowColor: ACCENT_ORANGE,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 8,
  },
  collectButtonText: {
    fontFamily: "Nunito-Bold",
    fontSize: 18,
    color: "#FFFFFF",
    textTransform: "uppercase",
    letterSpacing: 1,
  },

  // Mini Card Styles
  miniCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    overflow: "hidden",
    borderWidth: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 10,
  },
  cardImage: {
    width: "100%",
    height: 220,
    backgroundColor: "#F3F4F6",
  },
  cardImagePlaceholder: {
    width: "100%",
    height: 220,
    alignItems: "center",
    justifyContent: "center",
  },
  cardInfo: {
    padding: 16,
  },
  categoryBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    marginBottom: 12,
  },
  categoryText: {
    fontFamily: "Nunito-Bold",
    fontSize: 12,
  },
  stageRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  stageName: {
    fontFamily: "Nunito-Bold",
    fontSize: 18,
    color: "#1A1A1A",
  },
  xpText: {
    fontFamily: "Nunito-SemiBold",
    fontSize: 14,
    color: "#6B7280",
  },
  progressBg: {
    height: 8,
    backgroundColor: "#E5E7EB",
    borderRadius: 4,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 4,
  },
});

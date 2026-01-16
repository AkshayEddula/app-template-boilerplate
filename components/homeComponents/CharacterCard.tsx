import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { Image } from "expo-image";
import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import {
  Animated,
  Dimensions,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";

// Theme Colors - matching home screen
const BG_COLOR = "#FAF9F6";
const TEXT_PRIMARY = "#1A1A1A";
const TEXT_SECONDARY = "#6B7280";
const ACCENT_ORANGE = "#F97316";

const SCREEN_WIDTH = Dimensions.get("window").width;
const SCREEN_HEIGHT = Dimensions.get("window").height;
const CARD_WIDTH = (SCREEN_WIDTH - 44) / 2;

// --- CONFIGURATION ---
const CATEGORY_STYLES: Record<string, { color: string; icon: string; bg: string }> = {
  health: { color: "#10B981", icon: "💧", bg: "#ECFDF5" },
  mind: { color: "#8B5CF6", icon: "🧘", bg: "#F5F3FF" },
  career: { color: "#3B82F6", icon: "💼", bg: "#EFF6FF" },
  life: { color: "#F59E0B", icon: "🌟", bg: "#FFFBEB" },
  fun: { color: "#EC4899", icon: "🎮", bg: "#FDF2F8" },
  default: { color: ACCENT_ORANGE, icon: "✨", bg: "#FFF7ED" },
};

export const STAGES = [
  { stage: 1, name: "Seed", minXp: 0 },
  { stage: 2, name: "Rise", minXp: 501 },
  { stage: 3, name: "Flow", minXp: 1501 },
  { stage: 4, name: "Ascend", minXp: 3501 },
];

export const getCurrentStageInfo = (xp: number) => {
  let current = STAGES[0];
  let next = STAGES[1];

  for (let i = 0; i < STAGES.length; i++) {
    if (xp >= STAGES[i].minXp) {
      current = STAGES[i];
      next = STAGES[i + 1] || null;
    }
  }
  return { current, next };
};

export const CharacterCard = ({
  categoryKey,
  imageUrl,
  xp,
  message,
  isLocked = false,
}: {
  categoryKey: string;
  imageUrl: string;
  xp: number;
  scale?: number;
  isEquipped?: boolean;
  isCompleted?: boolean;
  message?: string;
  isLocked?: boolean;
}) => {
  const [modalVisible, setModalVisible] = useState(false);
  const scaleAnim = useState(new Animated.Value(1))[0];

  const { current, next } = getCurrentStageInfo(xp);
  const categoryStyle = CATEGORY_STYLES[categoryKey] || CATEGORY_STYLES.default;

  // XP Progress
  const rangeStart = current.minXp;
  const rangeEnd = next ? next.minXp : current.minXp * 1.5;
  const progressPercent =
    Math.min(Math.max((xp - rangeStart) / (rangeEnd - rangeStart), 0), 1) * 100;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.96,
      useNativeDriver: true,
      speed: 20,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 20,
    }).start();
  };

  return (
    <>
      {/* --- GRID CARD --- */}
      <Pressable
        onPress={() => setModalVisible(true)}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={{ marginBottom: 12 }}
      >
        <Animated.View style={{ transform: [{ scale: scaleAnim }], width: CARD_WIDTH }}>
          {/* Card Container */}
          <View style={[styles.card, { backgroundColor: categoryStyle.bg }]}>
            {/* Image */}
            <View style={styles.imageContainer}>
              <Image
                source={imageUrl}
                style={{ width: "100%", height: "100%" }}
                contentFit="cover"
              />
              {/* Progress Bar Overlay */}
              <View style={styles.progressBarContainer}>
                <View
                  style={[styles.progressBar, { width: `${progressPercent}%`, backgroundColor: categoryStyle.color }]}
                />
              </View>
            </View>

            {/* Info */}
            <View style={styles.cardInfo}>
              <View style={styles.cardInfoLeft}>
                <Text style={styles.stageName}>{current.name}</Text>
                <Text style={styles.categoryLabel}>
                  {categoryKey.charAt(0).toUpperCase() + categoryKey.slice(1)}
                </Text>
              </View>
              <View style={[styles.stageBadge, { backgroundColor: categoryStyle.color }]}>
                <Text style={styles.stageBadgeText}>{current.stage}</Text>
              </View>
            </View>
          </View>
        </Animated.View>
      </Pressable>

      {/* --- MODAL --- */}
      <Modal
        visible={modalVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <StatusBar style="light" />

        {/* Blur Background */}
        <View style={StyleSheet.absoluteFill}>
          <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFill} />
          <Pressable
            style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' }}
            onPress={() => setModalVisible(false)}
          />
        </View>

        {/* Bottom Sheet */}
        <View style={styles.sheet}>
          {/* Handle */}
          <View style={styles.handleContainer}>
            <View style={styles.handle} />
          </View>

          {/* Header */}
          <View style={styles.modalHeader}>
            <View>
              <Text style={styles.modalTitle}>
                {categoryStyle.icon} {categoryKey.charAt(0).toUpperCase() + categoryKey.slice(1)}
              </Text>
              <Text style={styles.modalSubtitle}>Stage {current.stage} • {current.name}</Text>
            </View>
            <TouchableOpacity
              onPress={() => setModalVisible(false)}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={22} color={TEXT_PRIMARY} />
            </TouchableOpacity>
          </View>

          <ScrollView
            contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
            showsVerticalScrollIndicator={false}
          >
            {/* Character Image */}
            <View style={styles.modalImageWrapper}>
              <View style={[styles.modalImageContainer, { borderColor: categoryStyle.color }]}>
                <Image
                  source={imageUrl}
                  style={{ width: "100%", height: "100%" }}
                  contentFit="cover"
                />
              </View>
            </View>

            {/* Stage Name Badge */}
            <View style={styles.stageNameContainer}>
              <View style={[styles.stageNameBadge, { backgroundColor: categoryStyle.bg }]}>
                <Text style={[styles.stageNameText, { color: categoryStyle.color }]}>
                  {current.name}
                </Text>
              </View>
            </View>

            {/* XP Progress Card */}
            <View style={styles.xpCard}>
              <View style={styles.xpHeader}>
                <Text style={styles.xpLabel}>Experience Progress</Text>
                <Text style={styles.xpPercent}>{progressPercent.toFixed(0)}%</Text>
              </View>

              {/* Progress Bar */}
              <View style={styles.xpProgressContainer}>
                <View
                  style={[styles.xpProgressBar, { width: `${progressPercent}%`, backgroundColor: categoryStyle.color }]}
                />
              </View>

              {/* XP Stats */}
              <View style={styles.xpStats}>
                <View>
                  <Text style={styles.xpStatLabel}>Current XP</Text>
                  <Text style={styles.xpStatValue}>{xp.toLocaleString()}</Text>
                </View>
                <View style={styles.xpStatDivider} />
                <View style={{ alignItems: "flex-end" }}>
                  <Text style={styles.xpStatLabel}>{next ? "Next Stage" : "Status"}</Text>
                  <Text style={styles.xpStatValue}>
                    {next ? `${(next.minXp - xp).toLocaleString()} to go` : "MAX ⭐"}
                  </Text>
                </View>
              </View>
            </View>

            {/* Stages Overview */}
            <View style={styles.stagesCard}>
              <Text style={styles.stagesTitle}>Journey Stages</Text>
              <View style={styles.stagesList}>
                {STAGES.map((stage, index) => {
                  const isCurrentStage = current.stage === stage.stage;
                  const isPast = xp >= stage.minXp;
                  return (
                    <View key={index} style={styles.stageItem}>
                      <View
                        style={[
                          styles.stageCircle,
                          {
                            backgroundColor: isPast ? categoryStyle.color : "#E5E7EB",
                            borderColor: isCurrentStage ? categoryStyle.color : "transparent",
                            borderWidth: isCurrentStage ? 3 : 0,
                          },
                        ]}
                      >
                        {isPast && <Ionicons name="checkmark" size={12} color="#FFFFFF" />}
                      </View>
                      <Text
                        style={[
                          styles.stageItemText,
                          { color: isPast ? TEXT_PRIMARY : TEXT_SECONDARY },
                        ]}
                      >
                        {stage.name}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </View>

            {/* Character Description/Message */}
            <View style={styles.messageCard}>
              <View style={styles.messageHeader}>
                <Text style={{ fontSize: 20 }}>✨</Text>
                <Text style={styles.messageTitle}>About This Character</Text>
              </View>
              <Text style={styles.messageText}>
                {message || `This is your ${categoryKey} companion at the ${current.name} stage. Keep completing your goals to help them evolve and unlock new stages!`}
              </Text>
            </View>

            {/* Close Button */}
            <TouchableOpacity
              onPress={() => setModalVisible(false)}
              style={[styles.closeButtonLarge, { backgroundColor: categoryStyle.color }]}
            >
              <Text style={styles.closeButtonText}>Done</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  // Sheet Styles
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: SCREEN_HEIGHT * 0.9,
    backgroundColor: BG_COLOR,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    overflow: 'hidden',
  },
  handleContainer: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: '#D1D5DB',
    borderRadius: 2,
  },
  // Card Styles
  card: {
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  imageContainer: {
    width: "100%",
    height: CARD_WIDTH * 1.3,
    backgroundColor: "#F3F4F6",
    position: "relative",
  },
  progressBarContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: "rgba(0,0,0,0.1)",
  },
  progressBar: {
    height: "100%",
  },
  cardInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 14,
  },
  cardInfoLeft: {
    flex: 1,
  },
  stageName: {
    fontFamily: "Nunito-Bold",
    fontSize: 16,
    color: TEXT_PRIMARY,
    marginBottom: 2,
  },
  categoryLabel: {
    fontFamily: "Nunito-Medium",
    fontSize: 12,
    color: TEXT_SECONDARY,
  },
  stageBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  stageBadgeText: {
    fontFamily: "Nunito-Bold",
    fontSize: 13,
    color: "#FFFFFF",
  },

  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: BG_COLOR,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 20,
  },
  modalTitle: {
    fontFamily: "Nunito-Bold",
    fontSize: 28,
    color: TEXT_PRIMARY,
  },
  modalSubtitle: {
    fontFamily: "Nunito-Medium",
    fontSize: 14,
    color: TEXT_SECONDARY,
    marginTop: 2,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
  },
  modalImageWrapper: {
    alignItems: "center",
    marginBottom: 20,
  },
  modalImageContainer: {
    width: SCREEN_WIDTH - 80,
    height: (SCREEN_WIDTH - 80) * 1.2,
    borderRadius: 24,
    overflow: "hidden",
    borderWidth: 3,
    backgroundColor: "#F3F4F6",
  },
  stageNameContainer: {
    alignItems: "center",
    marginBottom: 24,
  },
  stageNameBadge: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 999,
  },
  stageNameText: {
    fontFamily: "Nunito-Bold",
    fontSize: 20,
  },
  xpCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  xpHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  xpLabel: {
    fontFamily: "Nunito-Bold",
    fontSize: 14,
    color: TEXT_PRIMARY,
  },
  xpPercent: {
    fontFamily: "Nunito-Bold",
    fontSize: 14,
    color: ACCENT_ORANGE,
  },
  xpProgressContainer: {
    height: 8,
    backgroundColor: "#F3F4F6",
    borderRadius: 4,
    marginBottom: 16,
  },
  xpProgressBar: {
    height: "100%",
    borderRadius: 4,
  },
  xpStats: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  xpStatLabel: {
    fontFamily: "Nunito-Medium",
    fontSize: 12,
    color: TEXT_SECONDARY,
    marginBottom: 4,
  },
  xpStatValue: {
    fontFamily: "Nunito-Bold",
    fontSize: 18,
    color: TEXT_PRIMARY,
  },
  xpStatDivider: {
    width: 1,
    height: 40,
    backgroundColor: "#F3F4F6",
  },
  stagesCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
  },
  stagesTitle: {
    fontFamily: "Nunito-Bold",
    fontSize: 14,
    color: TEXT_PRIMARY,
    marginBottom: 16,
  },
  stagesList: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  stageItem: {
    alignItems: "center",
  },
  stageCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  stageItemText: {
    fontFamily: "Nunito-Medium",
    fontSize: 11,
  },
  messageCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  messageHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  messageTitle: {
    fontFamily: "Nunito-Bold",
    fontSize: 14,
    color: TEXT_PRIMARY,
  },
  messageText: {
    fontFamily: "Nunito-Medium",
    fontSize: 14,
    color: TEXT_SECONDARY,
    lineHeight: 22,
  },
  closeButtonLarge: {
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  closeButtonText: {
    fontFamily: "Nunito-Bold",
    fontSize: 16,
    color: "#FFFFFF",
  },
});
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useState } from "react";
import {
  Animated,
  Dimensions,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View
} from "react-native";

const SCREEN_WIDTH = Dimensions.get("window").width;
const SCREEN_HEIGHT = Dimensions.get("window").height;
// explore.tsx has paddingHorizontal: 12 and gap: 4
const CARD_WIDTH = (SCREEN_WIDTH - 24 - 4) / 2;

// --- CONFIGURATION ---
const CATEGORY_COLORS: Record<string, string> = {
  health: "#34D399",
  mind: "#A78BFA",
  career: "#60A5FA",
  life: "#FBBF24",
  fun: "#F472B6",
  default: "#3A7AFE",
};

const CATEGORY_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  health: "heart",
  mind: "prism",
  career: "briefcase",
  life: "compass",
  fun: "happy",
};

export const STAGES = [
  { stage: 1, name: "Seed", minXp: 0 },
  { stage: 2, name: "Rise", minXp: 501 },
  { stage: 3, name: "Flow", minXp: 1501 },
  { stage: 4, name: "Ascend", minXp: 3501 },
  { stage: 5, name: "Apex", minXp: 10000 },
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
  const color = CATEGORY_COLORS[categoryKey] || CATEGORY_COLORS.default;

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
      {/* --- GRID CARD (UNCHANGED) --- */}
      <Pressable
        onPress={() => setModalVisible(true)}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        className="mb-5"
      >
        <Animated.View style={{ transform: [{ scale: scaleAnim }], width: CARD_WIDTH }}>
          {/* 1. Image Container */}
          <View
            className="rounded-[20px] bg-[#1e1e1e] overflow-hidden mb-2 relative"
            style={{ width: CARD_WIDTH, height: CARD_WIDTH * 1.5 }}
          >
            <Image
              source={imageUrl}
              style={{ width: '100%', height: '100%' }}
              contentFit="cover"
            />
            {/* Status Indicator */}
            <View
              className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full"
              style={{ backgroundColor: color }}
            />

            {/* Progress Bar Overlay */}
            <View className="absolute bottom-0 left-0 right-0 h-[3px] bg-black/40">
              <View
                className="h-full"
                style={{ width: `${progressPercent}%`, backgroundColor: color }}
              />
            </View>
          </View>

          {/* 2. Text Content */}
          <View className="items-center px-1">
            <Text
              className="text-white text-[16px] font-bold mb-0.5 text-center"
              style={{ fontFamily: "GeneralSans-Bold" }}
              numberOfLines={1}
            >
              {current.name}
            </Text>
            <Text
              className="text-white/60 text-[12px] text-center"
              style={{ fontFamily: "GeneralSans-Medium" }}
            >
              Stage {current.stage} • {categoryKey.charAt(0).toUpperCase() + categoryKey.slice(1)}
            </Text>
          </View>
        </Animated.View>
      </Pressable>


      {/* --- MODAL (Bottom Sheet) --- */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        {isLocked ? (
          // LOCKED STATE MODAL
          <View className="flex-1 justify-end bg-black/60">
            <Pressable
              className="absolute inset-0"
              onPress={() => setModalVisible(false)}
            />

            {/* Locked Sheet Container */}
            <View
              className="rounded-t-[36px] overflow-hidden border-t border-white/10"
              style={{ height: SCREEN_HEIGHT * 0.65 }}
            >
              <LinearGradient
                colors={["#1E293B", "#0F172A", "#000000"]}
                style={StyleSheet.absoluteFill}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              />
              {/* Handle Indicator */}
              <View className="items-center pt-3 pb-1">
                <View className="w-10 h-1 bg-white/20 rounded-full" />
              </View>

              <ScrollView
                className="flex-1 px-6"
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 60, alignItems: 'center', justifyContent: 'center' }}
              >
                {/* Lock Icon */}
                <View
                  className="w-20 h-20 rounded-full items-center justify-center mb-6"
                  style={{ backgroundColor: `${color}20`, borderWidth: 2, borderColor: `${color}40` }}
                >
                  <Ionicons name="lock-closed" size={40} color={color} />
                </View>

                {/* Blurred Character Preview */}
                <View className="items-center mb-8">
                  <View
                    className="w-48 h-64 rounded-[24px] overflow-hidden border border-white/10 bg-black/40"
                    style={{ opacity: 0.3 }}
                  >
                    <Image
                      source={imageUrl}
                      style={{ width: '100%', height: '100%' }}
                      contentFit="cover"
                      blurRadius={20}
                    />
                  </View>
                </View>

                {/* Locked Message */}
                <View className="items-center mb-8">
                  <Text
                    className="text-white text-[32px] font-bold text-center mb-3"
                    style={{ fontFamily: "GeneralSans-Bold" }}
                  >
                    Locked
                  </Text>
                  <Text
                    className="text-white/70 text-[16px] text-center leading-[24px] px-4"
                    style={{ fontFamily: "GeneralSans-Medium" }}
                  >
                    Complete the previous stage to unlock this character
                  </Text>
                </View>

                {/* Stage Info Card */}
                <View className="bg-white/5 rounded-2xl p-5 border border-white/10 w-full mb-6">
                  <View className="flex-row items-center mb-3">
                    <Ionicons name="trophy" size={20} color={color} style={{ marginRight: 10 }} />
                    <Text
                      className="text-white text-[14px] font-bold uppercase tracking-wide"
                      style={{ fontFamily: "GeneralSans-Bold" }}
                    >
                      Requirements
                    </Text>
                  </View>
                  <Text className="text-white/60 text-[14px] leading-[22px]">
                    Keep building your streak and earning XP to progress through the stages and unlock new characters.
                  </Text>
                </View>

                {/* Close Button */}
                <Pressable
                  onPress={() => setModalVisible(false)}
                  className="w-full h-14 rounded-[20px] overflow-hidden justify-center items-center active:scale-[0.98]"
                  style={{
                    shadowColor: '#000',
                    shadowOpacity: 0.4,
                    shadowRadius: 20,
                    shadowOffset: { width: 0, height: 8 },
                    elevation: 12,
                  }}
                >
                  <LinearGradient
                    colors={[color, `${color}DD`]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={StyleSheet.absoluteFill}
                  />
                  <View className="flex-row items-center">
                    <Text
                      className="text-white font-bold text-[16px] tracking-wide"
                      style={{ fontFamily: "GeneralSans-Bold" }}
                    >
                      Got it
                    </Text>
                  </View>
                </Pressable>
              </ScrollView>
            </View>
          </View>
        ) : (
          // UNLOCKED STATE MODAL (EXISTING)
          <View className="flex-1 justify-end bg-black/60">
            <Pressable
              className="absolute inset-0"
              onPress={() => setModalVisible(false)}
            />

            {/* Sheet Container with Gradient Background */}
            <View
              className="rounded-t-[36px] overflow-hidden border-t border-white/10"
              style={{ height: SCREEN_HEIGHT * 0.8 }}
            >
              <LinearGradient
                colors={["#2563EB", "#1E40AF", "#0F172A"]}
                style={StyleSheet.absoluteFill}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              />
              {/* Handle Indicator */}
              <View className="items-center pt-3 pb-1">
                <View className="w-10 h-1 bg-white/20 rounded-full" />
              </View>

              <ScrollView
                className="flex-1 px-6"
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 60 }}
              >

                {/* Enhanced Image Section with Premium Styling */}
                <View className="items-center mt-6 mb-8">
                  {/* Outer glow container */}
                  <View
                    className="rounded-[28px] p-1"
                    style={{
                      backgroundColor: `${color}20`,
                      shadowColor: color,
                      shadowOpacity: 0.4,
                      shadowRadius: 24,
                      shadowOffset: { width: 0, height: 8 },
                      elevation: 12,
                    }}
                  >
                    <View className="w-64 h-72 rounded-[24px] overflow-hidden border border-white/20 bg-black/40">
                      <Image
                        source={imageUrl}
                        style={{ width: '100%', height: '100%' }}
                        contentFit="cover"
                      />
                      {/* Subtle vignette effect */}
                      <LinearGradient
                        colors={["transparent", "rgba(0,0,0,0.3)"]}
                        style={StyleSheet.absoluteFill}
                        locations={[0.6, 1]}
                      />
                    </View>
                  </View>
                </View>

                {/* Enhanced Title Block */}
                <View className="items-center mb-10">
                  {/* Category Badge with Icon */}
                  <View
                    className="flex-row items-center mb-3 px-4 py-2 rounded-full border border-white/20"
                    style={{ backgroundColor: `${color}30` }}
                  >
                    <Ionicons
                      name={CATEGORY_ICONS[categoryKey] || "star"}
                      size={14}
                      color={color}
                      style={{ marginRight: 6 }}
                    />
                    <Text
                      className="text-white text-[11px] uppercase tracking-widest font-bold"
                      style={{ fontFamily: "GeneralSans-Bold" }}
                    >
                      {categoryKey} • Stage {current.stage}
                    </Text>
                  </View>

                  {/* Stage Name */}
                  <Text
                    className="text-white text-[40px] font-bold leading-tight text-center mb-2"
                    style={{
                      fontFamily: "GeneralSans-Bold",
                      textShadowColor: 'rgba(0, 0, 0, 0.3)',
                      textShadowOffset: { width: 0, height: 2 },
                      textShadowRadius: 4,
                    }}
                  >
                    {current.name}
                  </Text>

                  {/* Decorative underline */}
                  <View className="flex-row items-center gap-2">
                    <View className="w-8 h-[2px] rounded-full" style={{ backgroundColor: color }} />
                    <View className="w-2 h-2 rounded-full" style={{ backgroundColor: color, opacity: 0.6 }} />
                    <View className="w-8 h-[2px] rounded-full" style={{ backgroundColor: color }} />
                  </View>
                </View>

                {/* Premium Message Section */}
                {message && (
                  <View className="mb-10 px-1">
                    <View
                      className="bg-white/10 backdrop-blur-xl rounded-3xl p-7 border border-white/20"
                      style={{
                        shadowColor: '#000',
                        shadowOpacity: 0.3,
                        shadowRadius: 20,
                        shadowOffset: { width: 0, height: 10 },
                        elevation: 10,
                      }}
                    >
                      {/* Large Quote Mark */}
                      <Text
                        className="text-[60px] leading-[40px] mb-2"
                        style={{ color: color, opacity: 0.4, fontFamily: 'GeneralSans-Bold' }}
                      >
                        "
                      </Text>

                      {/* Message Text */}
                      <Text
                        className="text-white text-[18px] leading-[30px] mb-6"
                        style={{
                          fontFamily: Platform.OS === 'ios' ? "Georgia" : "serif",
                          letterSpacing: 0.2,
                        }}
                      >
                        {message}
                      </Text>

                      {/* Signature Line */}
                      <View className="flex-row items-center justify-end">
                        <View className="w-12 h-[1px]" style={{ backgroundColor: color, opacity: 0.5 }} />
                        <Text
                          className="text-white/60 text-[13px] ml-3"
                          style={{ fontFamily: 'GeneralSans-Medium' }}
                        >
                          Your {current.name}
                        </Text>
                      </View>
                    </View>
                  </View>
                )}

                {/* REDESIGNED XP STATS SECTION */}
                <View className="bg-white/10 rounded-3xl p-6 border border-white/20 mb-8">
                  {/* Section Header */}
                  <View className="flex-row items-center mb-5">
                    <Ionicons name="stats-chart" size={16} color="white" style={{ opacity: 0.9 }} />
                    <Text
                      className="text-white text-[13px] font-bold ml-2 tracking-wide uppercase"
                      style={{ fontFamily: "GeneralSans-Bold" }}
                    >
                      Experience Progress
                    </Text>
                  </View>

                  {/* XP Stats Row */}
                  <View className="flex-row justify-between items-start mb-6">
                    {/* Current XP */}
                    <View className="flex-1">
                      <Text className="text-white/70 text-[11px] uppercase font-bold tracking-widest mb-2">
                        Current XP
                      </Text>
                      <Text
                        className="text-white text-3xl font-bold"
                        style={{ fontFamily: "GeneralSans-Bold" }}
                      >
                        {xp.toLocaleString()}
                      </Text>
                    </View>

                    {/* Vertical Divider */}
                    <View className="w-[1px] h-12 bg-white/20 mx-4" />

                    {/* Next Stage XP */}
                    <View className="flex-1 items-end">
                      <Text className="text-white/70 text-[11px] uppercase font-bold tracking-widest mb-2">
                        {next ? "Next Stage" : "Status"}
                      </Text>
                      <Text
                        className="text-white text-3xl font-bold"
                        style={{ fontFamily: "GeneralSans-Bold" }}
                      >
                        {next ? (next.minXp - xp).toLocaleString() : "MAX"}
                      </Text>
                      {next && (
                        <Text className="text-white/50 text-[12px] mt-1">
                          XP needed
                        </Text>
                      )}
                    </View>
                  </View>

                  {/* Progress Bar with Enhanced Styling */}
                  <View className="mb-3">
                    <View className="h-3 bg-black/50 rounded-full overflow-hidden border border-white/10">
                      <View
                        className="h-full rounded-full"
                        style={{
                          width: `${progressPercent}%`,
                          backgroundColor: color,
                          shadowColor: color,
                          shadowOpacity: 0.5,
                          shadowRadius: 4,
                        }}
                      />
                    </View>
                  </View>

                  {/* Progress Labels & Percentage */}
                  <View className="flex-row justify-between items-center">
                    <Text className="text-white/60 text-[11px] font-medium">
                      {current.name}
                    </Text>
                    <View className="bg-white/10 px-2.5 py-1 rounded-full">
                      <Text
                        className="text-white text-[11px] font-bold"
                        style={{ fontFamily: "GeneralSans-Bold" }}
                      >
                        {progressPercent.toFixed(0)}%
                      </Text>
                    </View>
                    <Text className="text-white/60 text-[11px] font-medium">
                      {next ? next.name : "Apex"}
                    </Text>
                  </View>

                  {/* Stage Range Info */}
                  {next && (
                    <View className="mt-4 pt-4 border-t border-white/10">
                      <View className="flex-row justify-between">
                        <View>
                          <Text className="text-white/50 text-[10px] uppercase tracking-wide mb-1">
                            Stage {current.stage} Range
                          </Text>
                          <Text className="text-white/80 text-[13px] font-medium">
                            {current.minXp.toLocaleString()} - {(next.minXp - 1).toLocaleString()} XP
                          </Text>
                        </View>
                        <View className="items-end">
                          <Text className="text-white/50 text-[10px] uppercase tracking-wide mb-1">
                            Next: {next.name}
                          </Text>
                          <Text className="text-white/80 text-[13px] font-medium">
                            @ {next.minXp.toLocaleString()} XP
                          </Text>
                        </View>
                      </View>
                    </View>
                  )}
                </View>

                {/* Sleek Action Button */}
                <Pressable
                  onPress={() => setModalVisible(false)}
                  className="w-full h-16 rounded-[20px] overflow-hidden justify-center items-center active:scale-[0.98]"
                  style={{
                    shadowColor: '#000',
                    shadowOpacity: 0.4,
                    shadowRadius: 20,
                    shadowOffset: { width: 0, height: 8 },
                    elevation: 12,
                  }}
                >
                  <LinearGradient
                    colors={['#FFFFFF', '#F8F9FA']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 0, y: 1 }}
                    style={StyleSheet.absoluteFill}
                  />
                  {/* Colored accent line at top */}
                  <View className="absolute top-0 left-0 right-0 h-[3px]" style={{ backgroundColor: color }} />

                  <View className="flex-row items-center">
                    <Text
                      className="text-[#0F172A] font-bold text-[17px] tracking-wide mr-2"
                      style={{ fontFamily: "GeneralSans-Bold" }}
                    >
                      Close
                    </Text>
                    <Ionicons name="checkmark-circle" size={22} color={color} />
                  </View>
                </Pressable>

              </ScrollView>
            </View>
          </View>
        )}
      </Modal>
    </>
  );
};
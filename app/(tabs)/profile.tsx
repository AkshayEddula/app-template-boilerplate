import { PaywallModal } from "@/components/Paywall";
import { useGuest } from "@/context/GuestContext";
import { useSubscription } from "@/context/SubscriptionContext";
import { api } from "@/convex/_generated/api";
import { useAuth, useUser } from "@clerk/clerk-expo";
import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery } from "convex/react";
import Constants from "expo-constants";
import { useFocusEffect, useRouter } from "expo-router";
import { setStatusBarStyle } from "expo-status-bar";
import * as WebBrowser from "expo-web-browser";
import React, { useCallback, useMemo, useState } from "react";
import {
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, { FadeIn, FadeInUp } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

// Theme
const BG_COLOR = "#FAF9F6";
const TEXT_PRIMARY = "#1A1A1A";
const TEXT_SECONDARY = "#6B7280";
const ACCENT_ORANGE = "#F97316";

export default function ProfileScreen() {
  const router = useRouter();
  const { user: clerkUser } = useUser();
  const { signOut } = useAuth();
  const { isPremium } = useSubscription();
  const { isGuest, logoutGuest, guestResolutions } = useGuest();

  const convexUser = useQuery(api.users.currentUser);
  const user = isGuest
    ? { name: "Guest User", email: undefined, currentStreak: 0, _id: "guest" }
    : convexUser;

  const stats = useQuery(api.stats.getMyStats, isGuest ? "skip" : undefined);
  const convexResolutions = useQuery(
    api.userResolutions.listActive,
    isGuest ? "skip" : undefined
  );
  const resolutions = isGuest ? guestResolutions : convexResolutions;

  const deleteUserMutation = useMutation(api.users.deleteUser);

  const [paywallVisible, setPaywallVisible] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const totalXP = useMemo(() => {
    if (!stats) return 0;
    return stats.reduce((acc, curr) => acc + (curr.totalXp || 0), 0);
  }, [stats]);

  const activeGoalsCount = resolutions?.length || 0;

  useFocusEffect(
    useCallback(() => {
      setStatusBarStyle("dark");
    }, [])
  );

  const handleSignOut = async () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: () => {
          if (isGuest) {
            logoutGuest();
            router.replace("/(auth)/sign-up");
          } else {
            signOut();
          }
        },
      },
    ]);
  };

  const handleDeleteAccount = async () => {
    Alert.alert(
      "Delete Account",
      "This action is permanent. All your data will be wiped immediately. Are you sure?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              setIsDeleting(true);
              if (isGuest) {
                await logoutGuest();
                router.replace("/(auth)/sign-up");
                return;
              }
              if (!user) return;
              await deleteUserMutation();
              await clerkUser?.delete();
            } catch (error) {
              console.error("Delete failed", error);
              setIsDeleting(false);
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 40 }}
        >
          <View style={{ maxWidth: 600, alignSelf: "center", width: "100%" }}>
            {/* Header */}
            <View style={styles.header}>
              <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                <Ionicons name="chevron-back" size={22} color={TEXT_PRIMARY} />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Profile</Text>
              <View style={{ width: 44 }} />
            </View>

            {/* Profile Card */}
            <Animated.View entering={FadeIn} style={styles.profileCard}>
              {/* Avatar */}
              <View style={styles.avatarContainer}>
                {clerkUser?.imageUrl ? (
                  <Image source={{ uri: clerkUser.imageUrl }} style={styles.avatar} />
                ) : (
                  <View style={styles.avatarPlaceholder}>
                    <Text style={styles.avatarText}>{user?.name?.charAt(0) || "U"}</Text>
                  </View>
                )}
              </View>

              {/* Name & Email */}
              <View style={styles.nameRow}>
                <Text style={styles.userName}>{user?.name || "User"}</Text>
                {isPremium && (
                  <View style={styles.premiumBadge}>
                    <Text style={{ fontSize: 10 }}>⭐</Text>
                    <Text style={styles.premiumText}>Premium</Text>
                  </View>
                )}
              </View>
              <Text style={styles.userEmail}>
                {isGuest
                  ? "Local Guest Account"
                  : user?.email || clerkUser?.primaryEmailAddress?.emailAddress}
              </Text>

              {/* Stats Row */}
              <View style={styles.statsRow}>
                <View style={styles.statBox}>
                  <Text style={{ fontSize: 20 }}>🔥</Text>
                  <Text style={styles.statNum}>{user?.currentStreak || 0}</Text>
                  <Text style={styles.statLabel}>Streak</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statBox}>
                  <Text style={{ fontSize: 20 }}>⚡</Text>
                  <Text style={styles.statNum}>{totalXP.toLocaleString()}</Text>
                  <Text style={styles.statLabel}>Total XP</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statBox}>
                  <Text style={{ fontSize: 20 }}>🎯</Text>
                  <Text style={styles.statNum}>{activeGoalsCount}</Text>
                  <Text style={styles.statLabel}>Goals</Text>
                </View>
              </View>
            </Animated.View>

            {/* Upgrade Banner */}
            {!isPremium && (
              <Animated.View entering={FadeInUp.delay(100)}>
                <TouchableOpacity
                  onPress={() => setPaywallVisible(true)}
                  style={styles.upgradeBanner}
                  activeOpacity={0.8}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={styles.upgradeTitle}>Upgrade to Premium ✨</Text>
                    <Text style={styles.upgradeSubtitle}>
                      Unlock unlimited resolutions, advanced analytics, and more
                    </Text>
                  </View>
                  <View style={styles.upgradeArrow}>
                    <Ionicons name="arrow-forward" size={20} color="#FFF" />
                  </View>
                </TouchableOpacity>
              </Animated.View>
            )}

            {/* Settings Sections */}
            <View style={styles.sectionsContainer}>
              {/* Account Section */}
              <Text style={styles.sectionTitle}>Account</Text>
              <View style={styles.sectionCard}>
                <MenuRow
                  icon="mail-outline"
                  label="Email"
                  value={isGuest ? "Not linked" : clerkUser?.primaryEmailAddress?.emailAddress}
                />
                <MenuRow icon="shield-outline" label="User ID" value={user?._id?.slice(0, 12) + "..."} isLast />
              </View>

              {/* Legal Section */}
              <Text style={styles.sectionTitle}>Legal</Text>
              <View style={styles.sectionCard}>
                <MenuRow
                  icon="document-text-outline"
                  label="Terms of Use"
                  hasArrow
                  onPress={() =>
                    WebBrowser.openBrowserAsync(
                      "https://www.apple.com/legal/internet-services/itunes/dev/stdeula/"
                    )
                  }
                />
                <MenuRow
                  icon="lock-closed-outline"
                  label="Privacy Policy"
                  hasArrow
                  onPress={() => router.push("/(legal)/privacy-policy")}
                  isLast
                />
              </View>

              {/* Actions Section */}
              <Text style={styles.sectionTitle}>Actions</Text>
              <View style={styles.sectionCard}>
                <MenuRow icon="log-out-outline" label="Sign Out" hasArrow onPress={handleSignOut} />
                <MenuRow
                  icon="trash-outline"
                  label={isDeleting ? "Deleting..." : "Delete Account"}
                  isDestructive
                  onPress={handleDeleteAccount}
                  isLast
                />
              </View>
            </View>

            {/* Version */}
            <Text style={styles.version}>Version {Constants.expoConfig?.version ?? "1.0.0"}</Text>
          </View>
        </ScrollView>
      </SafeAreaView>

      <PaywallModal visible={paywallVisible} onClose={() => setPaywallVisible(false)} />
    </View>
  );
}

// Menu Row Component
function MenuRow({
  icon,
  label,
  value,
  hasArrow,
  isDestructive,
  onPress,
  isLast,
}: {
  icon: string;
  label: string;
  value?: string;
  hasArrow?: boolean;
  isDestructive?: boolean;
  onPress?: () => void;
  isLast?: boolean;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
      style={[styles.menuRow, !isLast && styles.menuRowBorder]}
    >
      <View style={styles.menuLeft}>
        <View style={[styles.menuIcon, isDestructive && { backgroundColor: "#FEE2E2" }]}>
          <Ionicons name={icon as any} size={18} color={isDestructive ? "#EF4444" : TEXT_SECONDARY} />
        </View>
        <Text style={[styles.menuLabel, isDestructive && { color: "#EF4444" }]}>{label}</Text>
      </View>
      <View style={styles.menuRight}>
        {value && <Text style={styles.menuValue} numberOfLines={1}>{value}</Text>}
        {hasArrow && <Ionicons name="chevron-forward" size={18} color="#D1D5DB" />}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG_COLOR,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontFamily: "Nunito-Bold",
    fontSize: 22,
    color: TEXT_PRIMARY,
  },
  profileCard: {
    marginHorizontal: 20,
    backgroundColor: "#FFFFFF",
    borderRadius: 28,
    padding: 24,
    alignItems: "center",
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  avatarContainer: {
    marginBottom: 16,
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 3,
    borderColor: ACCENT_ORANGE,
  },
  avatarPlaceholder: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: ACCENT_ORANGE,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontFamily: "Nunito-Bold",
    fontSize: 36,
    color: "#FFFFFF",
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  userName: {
    fontFamily: "Nunito-Bold",
    fontSize: 24,
    color: TEXT_PRIMARY,
  },
  premiumBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#FEF3C7",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  premiumText: {
    fontFamily: "Nunito-Bold",
    fontSize: 11,
    color: "#D97706",
  },
  userEmail: {
    fontFamily: "Nunito-Medium",
    fontSize: 14,
    color: TEXT_SECONDARY,
    marginBottom: 24,
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
  },
  statBox: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 8,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: "#E5E7EB",
  },
  statNum: {
    fontFamily: "Nunito-Bold",
    fontSize: 22,
    color: TEXT_PRIMARY,
    marginTop: 4,
  },
  statLabel: {
    fontFamily: "Nunito-Medium",
    fontSize: 12,
    color: TEXT_SECONDARY,
  },
  upgradeBanner: {
    marginHorizontal: 20,
    backgroundColor: ACCENT_ORANGE,
    borderRadius: 20,
    padding: 18,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
    shadowColor: ACCENT_ORANGE,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 4,
  },
  upgradeTitle: {
    fontFamily: "Nunito-Bold",
    fontSize: 17,
    color: "#FFFFFF",
    marginBottom: 4,
  },
  upgradeSubtitle: {
    fontFamily: "Nunito-Medium",
    fontSize: 13,
    color: "rgba(255,255,255,0.85)",
    lineHeight: 18,
  },
  upgradeArrow: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.25)",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 12,
  },
  sectionsContainer: {
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontFamily: "Nunito-Bold",
    fontSize: 13,
    color: TEXT_SECONDARY,
    marginBottom: 10,
    marginLeft: 4,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  sectionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    marginBottom: 20,
    overflow: "hidden",
  },
  menuRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  menuRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  menuLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  menuIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
  },
  menuLabel: {
    fontFamily: "Nunito-SemiBold",
    fontSize: 15,
    color: TEXT_PRIMARY,
  },
  menuRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  menuValue: {
    fontFamily: "Nunito-Medium",
    fontSize: 13,
    color: TEXT_SECONDARY,
    maxWidth: 140,
  },
  version: {
    fontFamily: "Nunito-Medium",
    fontSize: 12,
    color: "#D1D5DB",
    textAlign: "center",
    marginTop: 20,
  },
});

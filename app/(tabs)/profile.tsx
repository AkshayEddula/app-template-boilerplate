import { PaywallModal } from "@/components/Paywall";
import { useSubscription } from "@/context/SubscriptionContext";
import { api } from "@/convex/_generated/api";
import { useAuth, useUser } from "@clerk/clerk-expo";
import { Ionicons } from "@expo/vector-icons";
import {
  ArrowRight01Icon,
  Delete02Icon,
  Logout01Icon,
  Mail01Icon,
  Shield01Icon
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { useMutation, useQuery } from "convex/react";
import { GlassView } from "expo-glass-effect";
import * as Linking from "expo-linking";
import React, { useMemo, useState } from "react";
import {
  Alert,
  Image,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import Animated, {
  FadeInUp
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

// --- COMPONENTS ---

const StatCard = ({
  label,
  value,
  sublabel,
  delay = 0,
}: {
  label: string;
  value: string | number;
  sublabel?: string;
  delay?: number;
}) => (
  <Animated.View
    entering={FadeInUp.delay(delay).duration(500)}
    className="flex-1"
  >
    <GlassView
      glassEffectStyle="regular"
      tintColor="#3A7AFE" // Consistent tint
      style={{
        borderRadius: 24,
        overflow: "hidden",
        height: 100,
      }}
    >
      <View className="flex-1 items-center justify-center p-3 bg-white/5">
        <Text className="text-white/60 font-generalsans-medium text-[11px] uppercase tracking-wide mb-1">
          {label}
        </Text>
        <Text className="text-white font-generalsans-bold text-3xl">
          {value}
        </Text>
        {sublabel && (
          <Text className="text-white/40 font-generalsans-medium text-[10px] mt-1">
            {sublabel}
          </Text>
        )}
      </View>
    </GlassView>
  </Animated.View>
);

const MenuRow = ({
  icon,
  label,
  value,
  onPress,
  isDestructive = false,
  showArrow = true,
}: any) => (
  <TouchableOpacity
    activeOpacity={0.7}
    onPress={onPress}
    className="flex-row items-center justify-between py-4 border-b border-white/5 last:border-0"
  >
    <View className="flex-row items-center gap-3.5">
      <View
        className={`w-9 h-9 rounded-full items-center justify-center ${isDestructive ? "bg-red-500/10" : "bg-white/10"}`}
      >
        <HugeiconsIcon
          icon={icon}
          size={18}
          color={isDestructive ? "#EF4444" : "white"}
        />
      </View>
      <Text
        className={`font-generalsans-medium text-[15px] ${isDestructive ? "text-red-400" : "text-white"}`}
      >
        {label}
      </Text>
    </View>

    <View className="flex-row items-center gap-2">
      {value && (
        <Text className="text-white/50 text-[13px] font-generalsans-medium text-right max-w-[150px]" numberOfLines={1}>
          {value}
        </Text>
      )}
      {showArrow && (
        <HugeiconsIcon
          icon={ArrowRight01Icon}
          size={20}
          color="rgba(255,255,255,0.2)"
        />
      )}
    </View>
  </TouchableOpacity>
);

// --- MODALS ---


// --- MAIN SCREEN ---

export default function ProfileScreen() {
  const { user: clerkUser } = useUser();
  const { signOut } = useAuth();
  const { isPremium } = useSubscription();

  // Queries
  const user = useQuery(api.users.currentUser);
  const stats = useQuery(api.stats.getMyStats);
  const resolutions = useQuery(api.userResolutions.listActive);

  // Mutations
  const deleteUserMutation = useMutation(api.users.deleteUser);

  // State
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [paywallVisible, setPaywallVisible] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Computed
  const totalXP = useMemo(() => {
    if (!stats) return 0;
    return stats.reduce((acc, curr) => acc + (curr.totalXp || 0), 0);
  }, [stats]);

  const activeGoalsCount = resolutions?.length || 0;

  const handleSignOut = async () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: () => signOut(),
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
            if (!user) return;
            try {
              setIsDeleting(true);
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

  const openLink = (url: string) => Linking.openURL(url);

  return (
    <View className="flex-1 bg-[#3A7AFE]">
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
        <ScrollView
          contentContainerStyle={{ paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
          className="flex-1"
        >
          <View className="w-full max-w-[600px] self-center">
            {/* --- HEADER --- */}
            <View className="items-center pt-4 pb-8 px-6">
              {/* Avatar Ring */}
              <View className="relative mb-5">
                {/* Glow behind */}
                <View className="absolute inset-0 bg-white/20 rounded-full blur-xl scale-125" />

                <View className="w-28 h-28 rounded-full bg-white/10 border-[4px] border-white/20 items-center justify-center overflow-hidden p-1">
                  <View className="w-full h-full rounded-full overflow-hidden bg-[#3A7AFE]">
                    {clerkUser?.imageUrl ? (
                      <Image
                        source={{ uri: clerkUser.imageUrl }}
                        className="w-full h-full"
                      />
                    ) : (
                      <View className="items-center justify-center flex-1">
                        <Text className="text-4xl font-generalsans-bold text-white">
                          {user?.name?.charAt(0) || "U"}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>

              </View>

              {/* Name & Badge */}
              <View className="items-center gap-1.5">
                <View className="flex-row items-center gap-2">
                  <Text className="text-white text-3xl font-generalsans-bold tracking-tight">
                    {user?.name || "User"}
                  </Text>

                  {/* Premium Badge */}
                  {isPremium ? (
                    <View className="bg-yellow-400/20 px-2 py-0.5 rounded-full border border-yellow-400/50">
                      <Text className="text-yellow-300 text-[10px] font-generalsans-bold uppercase tracking-widest">Premium</Text>
                    </View>
                  ) : (
                    <TouchableOpacity onPress={() => setPaywallVisible(true)}>
                      <View className="bg-white/20 px-2 py-0.5 rounded-full border border-white/30">
                        <Text className="text-white text-[10px] font-generalsans-bold uppercase tracking-widest">Free</Text>
                      </View>
                    </TouchableOpacity>
                  )}
                </View>

                <Text className="text-white/60 font-generalsans-medium text-base">
                  {user?.email || clerkUser?.primaryEmailAddress?.emailAddress}
                </Text>
              </View>
            </View>

            {/* --- STATS ROW --- */}
            <View className="flex-row gap-3 px-6 mb-8">
              <StatCard label="Streak" value={user?.currentStreak || 0} sublabel="Day Streak" delay={0} />
              <StatCard label="Total XP" value={totalXP.toLocaleString()} sublabel="Lifetime XP" delay={100} />
              <StatCard label="Active" value={activeGoalsCount} sublabel="Goals" delay={200} />
            </View>

            {/* --- UPGRADE BANNER (Free Users Only) --- */}
            {!isPremium && (
              <Animated.View entering={FadeInUp.delay(300)} className="px-6 mb-8">
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => setPaywallVisible(true)}
                >
                  <GlassView
                    glassEffectStyle="regular"
                    tintColor="#ffdd1fff"
                    style={{ borderRadius: 24, overflow: "hidden" }}
                  >
                    <View className="p-5 flex-row items-center justify-between bg-yellow-500/10">
                      <View className="flex-1 mr-4">
                        <View className="flex-row items-center gap-2 mb-1">
                          <Text className="text-white font-generalsans-bold text-lg">
                            Upgrade to Pro
                          </Text>
                          <View className="bg-yellow-400 px-2 py-0.5 rounded-full">
                            <Text className="text-black text-[10px] font-generalsans-bold uppercase tracking-widest">
                              New
                            </Text>
                          </View>
                        </View>
                        <Text className="text-white font-generalsans-medium text-xs leading-5">
                          Unlock unlimited resolutions, advanced stats, and exclusive icons.
                        </Text>
                      </View>
                      <View className="w-10 h-10 rounded-full bg-yellow-400 items-center justify-center shadow-lg shadow-yellow-500/20">
                        <Ionicons name="arrow-forward" size={20} color="#000" />
                      </View>
                    </View>
                  </GlassView>
                </TouchableOpacity>
              </Animated.View>
            )}


            {/* --- SETTINGS GROUPS --- */}

            <View className="px-6 space-y-6 gap-y-6">
              {/* Account */}
              <View>
                <Text className="text-white/40 text-[11px] font-generalsans-bold uppercase tracking-wider mb-3 ml-2">
                  Account
                </Text>
                <GlassView
                  glassEffectStyle="regular"
                  tintColor="#3A7AFE"
                  style={{ borderRadius: 24, overflow: "hidden" }}
                >
                  <View className="px-5 py-1 bg-white/5">
                    <MenuRow
                      icon={Mail01Icon}
                      label="Email"
                      value={clerkUser?.primaryEmailAddress?.emailAddress}
                      showArrow={false}
                    />
                    <MenuRow
                      icon={Shield01Icon}
                      label="User ID"
                      value={user?._id?.slice(0, 12) + "..."}
                      showArrow={false}
                    />
                  </View>
                </GlassView>
              </View>

              {/* Legal */}
              <View>
                <Text className="text-white/40 text-[11px] font-generalsans-bold uppercase tracking-wider mb-3 ml-2">
                  Legal
                </Text>
                <GlassView
                  glassEffectStyle="regular"
                  tintColor="#3A7AFE"
                  style={{ borderRadius: 24, overflow: "hidden" }}
                >
                  <View className="px-5 py-1 bg-white/5">
                    <MenuRow
                      icon={Shield01Icon} // Using Shield as generic legal icon
                      label="Terms of Use"
                      onPress={() =>
                        openLink("https://www.apple.com/legal/internet-services/itunes/dev/stdeula/")
                      }
                    />
                    <MenuRow
                      icon={Shield01Icon}
                      label="Privacy Policy"
                      onPress={() =>
                        openLink("https://www.apple.com/legal/privacy/en-ww/")
                      }
                    />
                  </View>
                </GlassView>
              </View>

              {/* Danger */}
              <View className="mb-8">
                <Text className="text-white/40 text-[11px] font-generalsans-bold uppercase tracking-wider mb-3 ml-2">
                  Actions
                </Text>
                <GlassView
                  glassEffectStyle="regular"
                  tintColor="#3A7AFE"
                  style={{ borderRadius: 24, overflow: "hidden" }}
                >
                  <View className="px-5 py-1 bg-white/5">
                    <MenuRow
                      icon={Logout01Icon}
                      label="Log Out"
                      onPress={handleSignOut}
                    />
                    <MenuRow
                      icon={Delete02Icon}
                      label={isDeleting ? "Deleting..." : "Delete Account"}
                      isDestructive
                      showArrow={false}
                      onPress={handleDeleteAccount}
                    />
                  </View>
                </GlassView>
              </View>
            </View>

            <Text className="text-center text-white/20 text-[11px] font-generalsans-medium pb-10">
              Version 1.0.0 (Build 42)
            </Text>
          </View>

        </ScrollView>
      </SafeAreaView>



      <PaywallModal
        visible={paywallVisible}
        onClose={() => setPaywallVisible(false)}
      />

    </View>
  );
}

import { api } from "@/convex/_generated/api";
import { useAuth, useUser } from "@clerk/clerk-expo";
import {
  ArrowRight01Icon,
  Delete02Icon,
  Logout01Icon,
  Mail01Icon,
  PolicyIcon,
  Shield01Icon,
  File02Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { useMutation } from "convex/react";
import { GlassView } from "expo-glass-effect";
import { LinearGradient } from "expo-linear-gradient";
import * as Linking from "expo-linking";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Dimensions,
  Image,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const { width } = Dimensions.get("window");

export default function ProfileScreen() {
  // 1. Get the Clerk User object
  const { user } = useUser();
  const { signOut } = useAuth();
  const router = useRouter();

  // 2. Convex Mutation to delete data
  const deleteUserMutation = useMutation(api.users.deleteUser);
  const [isDeleting, setIsDeleting] = useState(false);

  // --- ACTIONS ---

  const handleSignOut = async () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          await signOut();
          // The root layout will automatically redirect to onboarding
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
            if (!user) return;

            try {
              setIsDeleting(true);

              // STEP 1: Delete data in Convex Database
              await deleteUserMutation();

              // STEP 2: Delete user in Clerk Auth System
              // This removes them from your Clerk Dashboard users list.
              await user.delete();

              // Navigation is automatic (since user is now null, RootLayout redirects)
            } catch (error) {
              console.error("Delete failed", error);
              Alert.alert(
                "Error",
                "Failed to delete account. Please try again.",
              );
              setIsDeleting(false);
            }
          },
        },
      ],
    );
  };

  const openLink = (url: string) => {
    Linking.openURL(url);
  };

  // --- RENDER HELPERS ---

  const MenuItem = ({
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
      className="flex-row items-center justify-between py-4 border-b border-white/10"
    >
      <View className="flex-row items-center gap-3">
        <View
          className={`w-8 h-8 rounded-full items-center justify-center ${isDestructive ? "bg-red-500/10" : "bg-white/10"}`}
        >
          <HugeiconsIcon
            icon={icon}
            size={16}
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
          <Text className="text-white/50 text-[13px] font-generalsans-medium">
            {value}
          </Text>
        )}
        {showArrow && (
          <HugeiconsIcon
            icon={ArrowRight01Icon}
            size={20}
            color="rgba(255,255,255,0.3)"
          />
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <View className="flex-1 bg-[#3A7AFE]">
      <StatusBar barStyle="light-content" />

      {/* Background Gradient */}
      <LinearGradient
        colors={["#3A7AFE", "#2563EB"]}
        style={StyleSheet.absoluteFill}
      />

      <SafeAreaView className="flex-1">
        <ScrollView
          contentContainerStyle={{ paddingBottom: 10 }}
          showsVerticalScrollIndicator={false}
        >
          {/* --- HEADER --- */}
          <View className="px-6 pt-6 pb-8 items-center">
            <View className="relative mb-4">
              <View className="w-24 h-24 rounded-full bg-white/10 border-[3px] border-white/20 items-center justify-center overflow-hidden">
                {user?.imageUrl ? (
                  <Image
                    source={{ uri: user.imageUrl }}
                    className="w-full h-full"
                  />
                ) : (
                  <Text className="text-3xl font-generalsans-bold text-white">
                    {user?.firstName?.charAt(0) || "U"}
                  </Text>
                )}
              </View>
            </View>
            <Text className="text-white text-2xl font-generalsans-bold mb-1">
              {user?.fullName || "User"}
            </Text>
            <Text className="text-white/60 font-generalsans-medium text-sm">
              {user?.primaryEmailAddress?.emailAddress}
            </Text>
          </View>

          {/* --- SETTINGS GROUP: ACCOUNT --- */}
          <View className="px-5 mb-6">
            <Text className="text-white/40 text-[11px] font-generalsans-bold uppercase tracking-wider mb-2 ml-2">
              Account
            </Text>
            <GlassView
              glassEffectStyle="regular"
              tintColor="#3A7AFE"
              style={{ borderRadius: 24, overflow: "hidden" }}
            >
              <View className="px-5 py-1 bg-white/5">
                <MenuItem
                  icon={Mail01Icon}
                  label="Email"
                  value={user?.primaryEmailAddress?.emailAddress}
                  showArrow={false}
                  onPress={() => {}}
                />
                <MenuItem
                  icon={Shield01Icon}
                  label="User ID"
                  value={user?.id?.slice(0, 12) + "..."}
                  showArrow={false}
                  onPress={() => {}}
                />
              </View>
            </GlassView>
          </View>

          {/* --- SETTINGS GROUP: LEGAL (Apple Requirement) --- */}
          <View className="px-5 mb-6">
            <Text className="text-white/40 text-[11px] font-generalsans-bold uppercase tracking-wider mb-2 ml-2">
              Legal
            </Text>
            <GlassView
              glassEffectStyle="regular"
              tintColor="#3A7AFE"
              style={{ borderRadius: 24, overflow: "hidden" }}
            >
              <View className="px-5 py-1 bg-white/5">
                <MenuItem
                  icon={File02Icon}
                  label="Terms of Use (EULA)"
                  onPress={() =>
                    openLink(
                      "https://www.apple.com/legal/internet-services/itunes/dev/stdeula/",
                    )
                  }
                />
                <MenuItem
                  icon={PolicyIcon}
                  label="Privacy Policy"
                  onPress={() =>
                    openLink("https://www.apple.com/legal/privacy/en-ww/")
                  }
                />
              </View>
            </GlassView>
          </View>

          {/* --- SETTINGS GROUP: DANGER ZONE --- */}
          <View className="px-5 mb-8">
            <Text className="text-white/40 text-[11px] font-generalsans-bold uppercase tracking-wider mb-2 ml-2">
              Actions
            </Text>
            <GlassView
              glassEffectStyle="regular"
              tintColor="#3A7AFE"
              style={{ borderRadius: 24, overflow: "hidden" }}
            >
              <View className="px-5 py-1 ">
                <MenuItem
                  icon={Logout01Icon}
                  label="Log Out"
                  onPress={handleSignOut}
                />
                <View className="h-[1px] bg-white/5" />
                <MenuItem
                  icon={Delete02Icon}
                  label={isDeleting ? "Deleting..." : "Delete Account"}
                  isDestructive
                  showArrow={false}
                  onPress={handleDeleteAccount}
                />
              </View>
            </GlassView>
          </View>

          <Text className="text-center text-white/20 text-[11px] font-generalsans-medium pb-10">
            Version 1.0.0 (Build 42)
          </Text>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

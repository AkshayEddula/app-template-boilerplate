import { useSubscription } from "@/context/SubscriptionContext";
import { Ionicons } from "@expo/vector-icons";
import { GlassView } from "expo-glass-effect";
import * as Linking from "expo-linking";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import Animated, {
  FadeInDown,
  FadeInUp
} from "react-native-reanimated";

// --- Configuration ---
const PRIVACY_URL = "https://your-app.com/privacy";
const TERMS_URL = "https://your-app.com/terms";

// --- Feature List Data ---
const FEATURES = [
  {
    icon: "infinite",
    title: "Unlimited Resolutions",
    desc: "Create and track as many goals as you want.",
  },
  {
    icon: "trophy",
    title: "Exclusive Collections",
    desc: "Unlock rare character cards & animations.",
  },
  {
    icon: "stats-chart",
    title: "Advanced Insights",
    desc: "Visualize your streaks and progress.",
  },
];

interface PaywallModalProps {
  visible: boolean;
  onClose: () => void;
  isHardPaywall?: boolean;
  onCancel?: () => void;
}

export const PaywallModal = ({ visible, onClose, isHardPaywall = false, onCancel }: PaywallModalProps) => {
  const { offerings, purchasePackage, restorePurchases, isLoading, isPremium } =
    useSubscription();
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [selectedPkg, setSelectedPkg] = useState<any>(null);

  // Auto-select the first package (usually annual) when offerings load
  useEffect(() => {
    if (offerings?.availablePackages?.length) {
      // Sort: Annual -> Monthly -> Weekly
      const sorted = [...offerings.availablePackages].sort((a, b) => {
        const order = { ANNUAL: 1, MONTHLY: 2, WEEKLY: 3, LIFETIME: 4 };
        return (
          (order[a.packageType as keyof typeof order] || 99) -
          (order[b.packageType as keyof typeof order] || 99)
        );
      });

      // Default to Annual
      const annual = sorted.find((p) => p.packageType === "ANNUAL");
      setSelectedPkg(annual || sorted[0]);
    }
  }, [offerings]);

  const handlePurchase = async () => {
    if (!selectedPkg) return;
    setIsPurchasing(true);
    try {
      const { success } = await purchasePackage(selectedPkg);
      if (success) onClose();
    } finally {
      setIsPurchasing(false);
    }
  };

  const handleRestore = async () => {
    setIsPurchasing(true);
    try {
      const { success, message } = await restorePurchases();
      if (!success && message) {
        // Optional: Alert.alert("Restore", message);
      } else if (success) {
        onClose();
      }
    } finally {
      setIsPurchasing(false);
    }
  };

  const openLink = (url: string) => {
    Linking.openURL(url).catch((err) =>
      console.error("Couldn't load page", err),
    );
  };

  // Helper to get free trial info from package
  const getTrialInfo = (pkg: any) => {
    const product = pkg?.product;
    if (!product) return null;

    // 🧪 TESTING: Uncomment to manually test free trial UI
    // return { hasTrial: true, trialDays: 7, trialPrice: "Free", regularPrice: product.priceString };

    console.log('🔍 Checking product for trial info:', {
      identifier: pkg?.identifier,
      productId: product?.identifier,
      hasIntroPrice: !!product?.introPrice,
      introPrice: product?.introPrice,
      hasDiscounts: !!product?.discounts,
      discounts: product?.discounts,
      subscriptionPeriod: product?.subscriptionPeriod,
      priceString: product?.priceString,
    });

    // Check for intro price (free trial) - RevenueCat iOS/Android structure
    const introPrice = product.introPrice;
    if (introPrice) {
      console.log('✅ Found introPrice:', introPrice);
      // Get trial period from product
      const subscriptionPeriod = product.subscriptionPeriod;
      const introPeriod = introPrice.period || subscriptionPeriod;

      // Extract trial duration from introPrice
      let trialDays = 0;

      // RevenueCat provides periodUnit and periodNumberOfUnits directly on introPrice
      const unit = introPrice.periodUnit; // "DAY", "WEEK", "MONTH", "YEAR"
      const value = introPrice.periodNumberOfUnits || 1;

      switch (unit?.toUpperCase()) {
        case 'DAY':
          trialDays = value;
          break;
        case 'WEEK':
          trialDays = value * 7;
          break;
        case 'MONTH':
          trialDays = value * 30;
          break;
        case 'YEAR':
          trialDays = value * 365;
          break;
      }

      console.log('📊 Trial info extracted:', { trialDays, introPeriod });

      return {
        hasTrial: true,
        trialDays,
        trialPrice: introPrice.priceString || "Free",
        regularPrice: product.priceString,
      };
    }

    // Check discounts array (alternative structure)
    if (product.discounts && product.discounts.length > 0) {
      const discount = product.discounts[0];
      console.log('✅ Found discount:', discount);

      if (discount.price === 0 || discount.priceString === '$0.00') {
        let trialDays = 0;
        const period = discount.subscriptionPeriod;

        if (period) {
          const unit = period.unit;
          const value = period.value || 1;

          switch (unit?.toUpperCase()) {
            case 'DAY':
              trialDays = value;
              break;
            case 'WEEK':
              trialDays = value * 7;
              break;
            case 'MONTH':
              trialDays = value * 30;
              break;
            case 'YEAR':
              trialDays = value * 365;
              break;
          }
        }

        return {
          hasTrial: true,
          trialDays,
          trialPrice: "Free",
          regularPrice: product.priceString,
        };
      }
    }

    console.log('❌ No trial found for this product');
    return { hasTrial: false, trialDays: 0, regularPrice: product.priceString };
  };

  // Helper to format trial duration text
  const formatTrialDuration = (days: number) => {
    if (days === 7) return "7-Day";
    if (days === 14) return "14-Day";
    if (days === 30 || days === 31) return "1-Month";
    if (days < 7) return `${days}-Day`;
    if (days % 7 === 0) return `${days / 7}-Week`;
    return `${days}-Day`;
  };

  // Helper to sort packages for display
  const getSortedPackages = () => {
    if (!offerings?.availablePackages) return [];
    return [...offerings.availablePackages].sort((a, b) => {
      const order = { ANNUAL: 1, MONTHLY: 2, WEEKLY: 3, LIFETIME: 4 };
      return (
        (order[a.packageType as keyof typeof order] || 99) -
        (order[b.packageType as keyof typeof order] || 99)
      );
    });
  };

  if (!visible) return null;

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={isHardPaywall ? (onCancel || (() => { })) : onClose}
    >
      <View className="flex-1 bg-blue-600">
        {/* Background Blur Effect */}
        <GlassView
          style={StyleSheet.absoluteFill}
          glassEffectStyle="regular"
          tintColor="#3A7AFE"
        />

        <SafeAreaView className="flex-1">
          <ScrollView
            className="px-6 pb-12"
            showsVerticalScrollIndicator={false}
          >
            {/* Header / Close Button */}
            <View className={`flex-row mb-5 ${onCancel ? 'justify-between' : 'justify-end'}`}>
              {onCancel && (
                <TouchableOpacity
                  onPress={onCancel}
                  className="p-2 bg-white/20 rounded-full"
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Text className="text-white font-generalsans-medium text-xs uppercase">Cancel</Text>
                </TouchableOpacity>
              )}

              {!isHardPaywall && (
                <TouchableOpacity
                  onPress={onClose}
                  className="p-2 bg-white/20 rounded-full"
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons name="close" size={24} color="white" />
                </TouchableOpacity>
              )}
            </View>

            {/* Title Section */}
            <Animated.View
              entering={FadeInDown.delay(100).springify()}
              className="mb-8 mt-2 items-center"
            >
              <Text className="text-yellow-400 font-generalsans-bold text-xs tracking-widest mb-3 uppercase">
                ✨ PREMIUM ACCESS
              </Text>
              <Text className="text-white font-generalsans-bold text-4xl text-center mb-2">
                Transform Your 2026
              </Text>
              <Text className="text-white/80 font-generalsans-medium text-base text-center leading-6">
                Join thousands achieving their resolutions
              </Text>
            </Animated.View>

            {/* Features Grid */}
            <View className="mb-9 px-2">
              {FEATURES.map((feature, index) => (
                <Animated.View
                  key={index}
                  entering={FadeInDown.delay(200 + index * 100).duration(500)}
                  className="flex-row items-center mb-5"
                >
                  <View className="w-8 h-8 items-center justify-center mr-3.5">
                    <Ionicons
                      name="checkmark-circle"
                      size={24}
                      color="#4ADE80"
                    />
                  </View>
                  <View className="flex-1">
                    <Text className="text-white font-generalsans-semibold text-base mb-1 leading-5">
                      {feature.title}
                    </Text>
                    <Text className="text-white/75 font-generalsans-regular text-sm leading-5">
                      {feature.desc}
                    </Text>
                  </View>
                </Animated.View>
              ))}
            </View>

            {/* Packages Section */}
            {isLoading ? (
              <ActivityIndicator
                color="#fff"
                size="large"
                className="mt-10"
              />
            ) : (
              <Animated.View
                entering={FadeInUp.delay(600).springify()}
                className="gap-3.5 mb-7"
              >
                {getSortedPackages().map((pkg) => {
                  const isSelected = selectedPkg?.identifier === pkg.identifier;
                  const trialInfo = getTrialInfo(pkg);

                  let title = "Monthly Access";
                  let sub = "/ month";
                  let badge = null;

                  if (pkg.packageType === "ANNUAL") {
                    title = "Yearly Access";
                    sub = "/ year";
                    badge = "BEST VALUE";
                  } else if (pkg.packageType === "WEEKLY") {
                    title = "Weekly Access";
                    sub = "/ week";
                  }

                  return (
                    <TouchableOpacity
                      key={pkg.identifier}
                      activeOpacity={0.8}
                      onPress={() => setSelectedPkg(pkg)}
                      style={{
                        backgroundColor: isSelected ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.08)',
                        borderRadius: 18,
                        padding: 20,
                        borderWidth: 2,
                        borderColor: isSelected ? '#FFD700' : 'rgba(255,255,255,0.15)',
                        position: 'relative',
                        ...(isSelected ? {
                          shadowColor: '#FFD700',
                          shadowOffset: { width: 0, height: 0 },
                          shadowOpacity: 0.4,
                          shadowRadius: 12,
                          elevation: 8,
                          transform: [{ scale: 1.02 }],
                        } : {}),
                      }}
                    >
                      {/* Free Trial Badge */}
                      {trialInfo?.hasTrial && trialInfo.trialDays > 0 && (
                        <View
                          className="absolute -top-2.5 right-4 bg-yellow-400 px-3.5 py-1.5 rounded-xl z-10"
                          style={{
                            shadowColor: '#FFD700',
                            shadowOffset: { width: 0, height: 2 },
                            shadowOpacity: 0.3,
                            shadowRadius: 4,
                          }}
                        >
                          <Text className="text-blue-900 font-generalsans-bold text-xs tracking-tight">
                            🎁 {formatTrialDuration(trialInfo.trialDays)} FREE
                          </Text>
                        </View>
                      )}

                      {/* Best Value Badge */}
                      {badge && (
                        <View className="absolute -top-2.5 left-4 bg-emerald-500 px-3 py-1.5 rounded-xl z-10">
                          <Text className="text-white font-generalsans-bold text-xs tracking-tight">
                            ⭐ {badge}
                          </Text>
                        </View>
                      )}

                      <View className="flex-row justify-between items-start">
                        <View className="flex-1">
                          <Text className="text-white font-generalsans-bold text-lg mb-0.5">
                            {title}
                          </Text>

                          {/* Show trial info if available */}
                          {trialInfo?.hasTrial && trialInfo.trialDays > 0 && (
                            <Text className="text-white/65 font-generalsans-medium text-xs mt-1.5">
                              Then {trialInfo.regularPrice}{sub}
                            </Text>
                          )}
                        </View>
                        <View className="items-end">
                          {trialInfo?.hasTrial && trialInfo.trialDays > 0 ? (
                            <>
                              <Text className="text-white font-generalsans-bold text-2xl tracking-tight">
                                Free
                              </Text>
                              <Text className="text-white/75 font-generalsans-medium text-xs mt-0.5">
                                for {trialInfo.trialDays} day{trialInfo.trialDays !== 1 ? 's' : ''}
                              </Text>
                            </>
                          ) : (
                            <>
                              <Text className="text-white font-generalsans-bold text-2xl tracking-tight">
                                {pkg.product.priceString}
                              </Text>
                              <Text className="text-white/75 font-generalsans-medium text-xs mt-0.5">
                                {sub}
                              </Text>
                            </>
                          )}
                        </View>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </Animated.View>
            )}

            {/* CTA Button */}
            {!isLoading && (
              <Animated.View
                entering={FadeInUp.delay(800)}
                className="items-center"
              >
                <TouchableOpacity
                  onPress={handlePurchase}
                  disabled={isPurchasing}
                  className="bg-white w-full py-5 rounded-2xl items-center justify-center mb-4"
                  style={{
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.15,
                    shadowRadius: 12,
                    elevation: 6,
                  }}
                >
                  {isPurchasing ? (
                    <ActivityIndicator color="#3A7AFE" />
                  ) : (
                    <Text className="text-blue-600 font-generalsans-semibold text-lg">
                      {(() => {
                        const trialInfo = getTrialInfo(selectedPkg);
                        if (trialInfo?.hasTrial && trialInfo.trialDays > 0) {
                          return `Start Free Trial`;
                        }
                        return `Continue`;
                      })()}
                    </Text>
                  )}
                </TouchableOpacity>

                <Text className="text-white/60 font-generalsans-medium text-xs text-center mb-4 leading-4 px-5">
                  {(() => {
                    const trialInfo = getTrialInfo(selectedPkg);
                    if (trialInfo?.hasTrial && trialInfo.trialDays > 0) {
                      return `Free for ${trialInfo.trialDays} days, then ${trialInfo.regularPrice} per ${selectedPkg?.packageType === 'ANNUAL' ? 'year' : selectedPkg?.packageType === 'WEEKLY' ? 'week' : 'month'}. Recurring billing. Cancel anytime.`;
                    }
                    return 'Recurring billing. Cancel anytime.';
                  })()}
                </Text>

                {/* Legal Links (REQUIRED FOR APPLE) */}
                <View className="flex-row items-center justify-center flex-wrap">
                  <TouchableOpacity onPress={() => openLink(TERMS_URL)}>
                    <Text className="text-white/60 font-generalsans-medium text-xs underline">
                      Terms of Use
                    </Text>
                  </TouchableOpacity>
                  <Text className="text-white/40 mx-2.5 text-xs">•</Text>
                  <TouchableOpacity onPress={handleRestore}>
                    <Text className="text-white/60 font-generalsans-medium text-xs underline">
                      Restore Purchases
                    </Text>
                  </TouchableOpacity>
                  <Text className="text-white/40 mx-2.5 text-xs">•</Text>
                  <TouchableOpacity onPress={() => openLink(PRIVACY_URL)}>
                    <Text className="text-white/60 font-generalsans-medium text-xs underline">
                      Privacy Policy
                    </Text>
                  </TouchableOpacity>
                </View>
              </Animated.View>
            )}
          </ScrollView>
        </SafeAreaView>
      </View>
    </Modal>
  );
};

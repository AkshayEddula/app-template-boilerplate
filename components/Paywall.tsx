import { useSubscription } from "@/context/SubscriptionContext";
import { Ionicons } from "@expo/vector-icons";
import { GlassView } from "expo-glass-effect";

import { useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
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
  const router = useRouter();
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [selectedPkg, setSelectedPkg] = useState<any>(null);
  const [subView, setSubView] = useState<'main' | 'privacy'>('main');

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
      const { success } = await restorePurchases();
      // Only close modal if restore was successful
      if (success) {
        onClose();
      }
      // Errors and "no purchases found" are already handled by the context with alerts
    } catch (error) {
      console.error("Unexpected error in handleRestore:", error);
    } finally {
      setIsPurchasing(false);
    }
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

  const handleClose = () => {
    if (subView === 'privacy') {
      setSubView('main');
      return;
    }
    onClose();
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={isHardPaywall ? (onCancel || (() => { })) : handleClose}
    >
      <View className="flex-1 bg-blue-600">
        {/* Background Blur Effect */}
        <GlassView
          style={StyleSheet.absoluteFill}
          glassEffectStyle="regular"
          tintColor="#3A7AFE"
        />

        {subView === 'privacy' ? (
          <PrivacyView onBack={() => setSubView('main')} />
        ) : (
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
                    <TouchableOpacity onPress={() => WebBrowser.openBrowserAsync("https://www.apple.com/legal/internet-services/itunes/dev/stdeula/")}>
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
                    <TouchableOpacity onPress={() => setSubView('privacy')}>
                      <Text className="text-white/60 font-generalsans-medium text-xs underline">
                        Privacy Policy
                      </Text>
                    </TouchableOpacity>
                  </View>
                </Animated.View>
              )}
            </ScrollView>
          </SafeAreaView>

        )}
      </View>
    </Modal>
  );
};

// --- PRIVACY POLICY COMPONENTS ---

function PrivacyView({ onBack }: { onBack: () => void }) {
  return (
    <SafeAreaView className="flex-1">
      {/* Header */}
      <View className="px-6 py-4 flex-row items-center">
        <TouchableOpacity
          onPress={onBack}
          className="w-10 h-10 rounded-full bg-white/10 items-center justify-center mr-4"
        >
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text className="text-white text-2xl font-generalsans-semibold">Privacy Policy</Text>
      </View>

      <ScrollView
        className="flex-1 px-6"
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        <GlassView
          glassEffectStyle="regular"
          tintColor="#3A7AFE"
          style={{ borderRadius: 24, overflow: 'hidden', marginBottom: 20 }}
        >
          <View className="p-6 bg-white/5">
            <Text className="text-white/60 text-xs font-generalsans-medium mb-6 uppercase tracking-wider">
              Last updated: January 2026
            </Text>

            <Text className="text-white text-base font-generalsans-regular leading-7 mb-6">
              Levora ("we", "our", or "us") respects your privacy. This Privacy Policy explains how we collect, use, and protect your information when you use the Levora mobile application.
            </Text>

            <Section title="1. Information We Collect">
              <Text className="text-white/80 text-sm font-generalsans-regular leading-6 mb-2">
                Levora collects only the information necessary to provide its core functionality. This may include:
              </Text>
              <BulletPoint>Basic account information such as email address or a unique user identifier (if you choose to sign in)</BulletPoint>
              <BulletPoint>User-created content including goals, habits, resolutions, progress data, and preferences</BulletPoint>
              <BulletPoint>App usage and performance data to improve stability, functionality, and user experience</BulletPoint>
            </Section>

            <Section title="2. How We Use Your Information">
              <Text className="text-white/80 text-sm font-generalsans-regular leading-6 mb-2">
                We use the information we collect to:
              </Text>
              <BulletPoint>Provide, operate, and maintain the Levora app</BulletPoint>
              <BulletPoint>Save your progress and personalize your experience</BulletPoint>
              <BulletPoint>Improve app features, performance, and reliability</BulletPoint>
            </Section>

            <Section title="3. Data Sharing">
              <Text className="text-white/80 text-sm font-generalsans-regular leading-6">
                Levora does not sell, rent, or trade your personal information.
                We may share limited data with trusted service providers (such as authentication or cloud storage services) only as necessary to operate the app, or when required by law.
              </Text>
            </Section>

            <Section title="4. Data Security">
              <Text className="text-white/80 text-sm font-generalsans-regular leading-6">
                We implement reasonable technical and organizational measures to protect your information using industry-standard security practices.
              </Text>
            </Section>

            <Section title="5. Children’s Privacy">
              <Text className="text-white/80 text-sm font-generalsans-regular leading-6">
                Levora is not specifically intended for children under the age of 13. We do not knowingly collect personal data from children.
              </Text>
            </Section>

            <Section title="6. Changes to This Privacy Policy">
              <Text className="text-white/80 text-sm font-generalsans-regular leading-6">
                We may update this Privacy Policy from time to time. Any changes will be posted on this page with an updated revision date.
              </Text>
            </Section>

            <Section title="7. Contact Us">
              <Text className="text-white/80 text-sm font-generalsans-regular leading-6">
                If you have any questions or concerns about this Privacy Policy, you may contact us at:
              </Text>
              <Text className="text-white font-generalsans-semibold mt-2">
                Email: conatactlevora@gmail.com
              </Text>
            </Section>

          </View>
        </GlassView>
      </ScrollView>
    </SafeAreaView>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View className="mb-8">
      <Text className="text-white text-lg font-generalsans-semibold mb-3">{title}</Text>
      {children}
    </View>
  );
}

function BulletPoint({ children }: { children: React.ReactNode }) {
  return (
    <View className="flex-row mb-2 pl-2">
      <View className="w-1.5 h-1.5 rounded-full bg-white/60 mt-2 mr-3" />
      <Text className="text-white/80 text-sm font-generalsans-regular leading-6 flex-1">
        {children}
      </Text>
    </View>
  );
}


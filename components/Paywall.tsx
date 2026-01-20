import { useSubscription } from "@/context/SubscriptionContext";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
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
  View,
} from "react-native";
import Animated, { FadeIn, FadeInDown, FadeInUp } from "react-native-reanimated";

// Theme
const BG_COLOR = "#FAF9F6";
const TEXT_PRIMARY = "#1A1A1A";
const TEXT_SECONDARY = "#6B7280";
const ACCENT_ORANGE = "#F97316";

// Feature List
const FEATURES = [
  { emoji: "♾️", title: "Unlimited Goals", desc: "Track as many resolutions as you want" },
  { emoji: "🏆", title: "Exclusive Cards", desc: "Unlock rare character collections" },
  { emoji: "📊", title: "Deep Analytics", desc: "Visualize your streaks and progress" },
];

interface PaywallModalProps {
  visible: boolean;
  onClose: () => void;
  isHardPaywall?: boolean;
  onCancel?: () => void;
}

export const PaywallModal = ({
  visible,
  onClose,
  isHardPaywall = false,
  onCancel,
}: PaywallModalProps) => {
  const { offerings, purchasePackage, restorePurchases, isLoading } = useSubscription();
  const router = useRouter();
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [selectedPkg, setSelectedPkg] = useState<any>(null);
  const [showPrivacy, setShowPrivacy] = useState(false);

  useEffect(() => {
    if (offerings?.availablePackages?.length) {
      const sorted = [...offerings.availablePackages].sort((a, b) => {
        const order = { ANNUAL: 1, MONTHLY: 2, WEEKLY: 3, LIFETIME: 4 };
        return (
          (order[a.packageType as keyof typeof order] || 99) -
          (order[b.packageType as keyof typeof order] || 99)
        );
      });
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
      if (success) onClose();
    } catch (error) {
      console.error("Restore error:", error);
    } finally {
      setIsPurchasing(false);
    }
  };

  const getTrialInfo = (pkg: any) => {
    const product = pkg?.product;
    if (!product) return null;

    const introPrice = product.introPrice;
    if (introPrice) {
      let trialDays = 0;
      const unit = introPrice.periodUnit;
      const value = introPrice.periodNumberOfUnits || 1;

      switch (unit?.toUpperCase()) {
        case "DAY": trialDays = value; break;
        case "WEEK": trialDays = value * 7; break;
        case "MONTH": trialDays = value * 30; break;
        case "YEAR": trialDays = value * 365; break;
      }

      return {
        hasTrial: true,
        trialDays,
        trialPrice: introPrice.priceString || "Free",
        regularPrice: product.priceString,
      };
    }

    if (product.discounts?.length > 0) {
      const discount = product.discounts[0];
      if (discount.price === 0 || discount.priceString === "$0.00") {
        let trialDays = 0;
        const period = discount.subscriptionPeriod;
        if (period) {
          const unit = period.unit;
          const value = period.value || 1;
          switch (unit?.toUpperCase()) {
            case "DAY": trialDays = value; break;
            case "WEEK": trialDays = value * 7; break;
            case "MONTH": trialDays = value * 30; break;
            case "YEAR": trialDays = value * 365; break;
          }
        }
        return { hasTrial: true, trialDays, trialPrice: "Free", regularPrice: product.priceString };
      }
    }

    return { hasTrial: false, trialDays: 0, regularPrice: product.priceString };
  };

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
    if (showPrivacy) {
      setShowPrivacy(false);
      return;
    }
    onClose();
  };

  return (
    <Modal
      animationType="slide"
      transparent={false}
      visible={visible}
      onRequestClose={isHardPaywall ? onCancel || (() => { }) : handleClose}
    >
      <StatusBar style="dark" />
      <View style={styles.container}>
        {showPrivacy ? (
          <PrivacyView onBack={() => setShowPrivacy(false)} />
        ) : (
          <SafeAreaView style={{ flex: 1 }}>
            <ScrollView
              contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 40 }}
              showsVerticalScrollIndicator={false}
            >
              {/* Header */}
              <View style={styles.headerRow}>
                {onCancel && (
                  <TouchableOpacity onPress={onCancel} style={styles.cancelBtn}>
                    <Text style={styles.cancelText}>Cancel</Text>
                  </TouchableOpacity>
                )}
                {!isHardPaywall && (
                  <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                    <Ionicons name="close" size={22} color={TEXT_SECONDARY} />
                  </TouchableOpacity>
                )}
              </View>

              {/* Hero */}
              <Animated.View entering={FadeIn} style={styles.hero}>
                <View style={styles.heroBadge}>
                  <Text style={{ fontSize: 16 }}>⭐</Text>
                  <Text style={styles.heroBadgeText}>PREMIUM</Text>
                </View>
                <Text style={styles.heroTitle}>Unlock Your{"\n"}Full Potential</Text>
                <Text style={styles.heroSubtitle}>
                  Join thousands achieving their 2026 resolutions
                </Text>
              </Animated.View>

              {/* Features */}
              <View style={styles.featuresCard}>
                {FEATURES.map((f, i) => (
                  <Animated.View
                    key={i}
                    entering={FadeInDown.delay(100 + i * 60)}
                    style={[styles.featureRow, i < FEATURES.length - 1 && styles.featureRowBorder]}
                  >
                    <View style={styles.featureIcon}>
                      <Text style={{ fontSize: 22 }}>{f.emoji}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.featureTitle}>{f.title}</Text>
                      <Text style={styles.featureDesc}>{f.desc}</Text>
                    </View>
                    <Ionicons name="checkmark-circle" size={22} color="#22C55E" />
                  </Animated.View>
                ))}
              </View>

              {/* Packages */}
              {isLoading ? (
                <ActivityIndicator color={ACCENT_ORANGE} size="large" style={{ marginTop: 40 }} />
              ) : (
                <Animated.View entering={FadeInUp.delay(400)} style={{ gap: 12, marginBottom: 24 }}>
                  {getSortedPackages().map((pkg) => {
                    const isSelected = selectedPkg?.identifier === pkg.identifier;
                    const trialInfo = getTrialInfo(pkg);
                    const isAnnual = pkg.packageType === "ANNUAL";

                    // Calculate per-week/month savings for annual plans
                    const getPerPeriodPrice = () => {
                      if (!isAnnual || !pkg.product.price) return null;
                      const yearlyPrice = pkg.product.price;
                      const monthlyPrice = (yearlyPrice / 12).toFixed(2);
                      return `$${monthlyPrice}/mo`;
                    };

                    // Get billing period text
                    const getBillingText = () => {
                      if (trialInfo?.hasTrial && trialInfo.trialDays > 0) {
                        return `Then ${trialInfo.regularPrice}/${isAnnual ? "year" : pkg.packageType === "WEEKLY" ? "week" : "month"}`;
                      }
                      if (isAnnual) return `Only ${getPerPeriodPrice()}/month`;
                      if (pkg.packageType === "WEEKLY") return "Billed weekly";
                      return "Billed monthly";
                    };

                    return (
                      <TouchableOpacity
                        key={pkg.identifier}
                        onPress={() => setSelectedPkg(pkg)}
                        activeOpacity={0.85}
                        style={[
                          styles.packageCard,
                          isSelected && styles.packageCardSelected,
                          isAnnual && styles.packageCardAnnual
                        ]}
                      >
                        {/* Best Value Badge for Annual */}
                        {isAnnual && (
                          <View style={styles.bestValueBadge}>
                            <Text style={styles.bestValueText}>⭐ BEST VALUE</Text>
                          </View>
                        )}

                        <View style={styles.packageContent}>
                          {/* Checkmark/Radio */}
                          <View style={[styles.radio, isSelected && styles.radioSelected]}>
                            {isSelected && (
                              <Ionicons name="checkmark" size={14} color="#FFF" />
                            )}
                          </View>

                          {/* Plan info */}
                          <View style={styles.packageInfo}>
                            <View style={styles.packageTitleRow}>
                              <Text style={[styles.packageTitle, isSelected && styles.packageTitleSelected]}>
                                {isAnnual ? "Yearly" : pkg.packageType === "WEEKLY" ? "Weekly" : "Monthly"}
                              </Text>
                              {/* Trial pill inline */}
                              {trialInfo?.hasTrial && trialInfo.trialDays > 0 && (
                                <View style={[styles.trialPill, isSelected && styles.trialPillSelected]}>
                                  <Text style={styles.trialPillText}>
                                    {trialInfo.trialDays} DAYS FREE
                                  </Text>
                                </View>
                              )}
                            </View>
                            <Text style={styles.packageSub}>{getBillingText()}</Text>
                          </View>

                          {/* Price */}
                          <View style={styles.packagePriceContainer}>
                            <Text style={[styles.packagePrice, isSelected && styles.packagePriceSelected]}>
                              {pkg.product.priceString}
                            </Text>
                            <Text style={styles.packagePer}>
                              /{isAnnual ? "year" : pkg.packageType === "WEEKLY" ? "week" : "mo"}
                            </Text>
                          </View>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </Animated.View>
              )}

              {/* CTA */}
              {!isLoading && (
                <Animated.View entering={FadeInUp.delay(500)}>
                  <TouchableOpacity
                    onPress={handlePurchase}
                    disabled={isPurchasing}
                    style={styles.ctaButton}
                  >
                    {isPurchasing ? (
                      <ActivityIndicator color="#FFF" />
                    ) : (
                      <Text style={styles.ctaText}>
                        {getTrialInfo(selectedPkg)?.hasTrial ? "Start Free Trial" : "Continue"}
                      </Text>
                    )}
                  </TouchableOpacity>

                  <Text style={styles.disclaimer}>
                    {getTrialInfo(selectedPkg)?.hasTrial
                      ? `Free for ${getTrialInfo(selectedPkg)?.trialDays} days, then ${getTrialInfo(selectedPkg)?.regularPrice}. Cancel anytime.`
                      : "Recurring billing. Cancel anytime."}
                  </Text>

                  <View style={styles.legalRow}>
                    <TouchableOpacity
                      onPress={() =>
                        WebBrowser.openBrowserAsync(
                          "https://www.apple.com/legal/internet-services/itunes/dev/stdeula/"
                        )
                      }
                    >
                      <Text style={styles.legalLink}>Terms</Text>
                    </TouchableOpacity>
                    <Text style={styles.legalDot}>•</Text>
                    <TouchableOpacity onPress={handleRestore}>
                      <Text style={styles.legalLink}>Restore</Text>
                    </TouchableOpacity>
                    <Text style={styles.legalDot}>•</Text>
                    <TouchableOpacity onPress={() => setShowPrivacy(true)}>
                      <Text style={styles.legalLink}>Privacy</Text>
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

// Privacy View - matches privacy-policy.tsx content
function PrivacyView({ onBack }: { onBack: () => void }) {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: BG_COLOR }}>
      <View style={styles.privacyHeader}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color={TEXT_PRIMARY} />
        </TouchableOpacity>
        <Text style={styles.privacyHeaderTitle}>Privacy Policy</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 60 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.privacyCard}>
          <Text style={styles.privacyDate}>Last updated: January 2026</Text>

          <Text style={styles.privacyIntro}>
            Levora ("we", "our", or "us") respects your privacy. This Privacy Policy explains how we
            collect, use, and protect your information when you use the Levora mobile application.
          </Text>

          <PrivacySection title="1. Information We Collect">
            <Text style={styles.privacyText}>
              Levora collects only the information necessary to provide its core functionality. This
              may include:
            </Text>
            <PrivacyBullet>
              Basic account information such as email address or a unique user identifier (if you
              choose to sign in)
            </PrivacyBullet>
            <PrivacyBullet>
              User-created content including goals, habits, resolutions, progress data, and
              preferences
            </PrivacyBullet>
            <PrivacyBullet>
              App usage and performance data to improve stability, functionality, and user experience
            </PrivacyBullet>
          </PrivacySection>

          <PrivacySection title="2. How We Use Your Information">
            <Text style={styles.privacyText}>We use the information we collect to:</Text>
            <PrivacyBullet>Provide, operate, and maintain the Levora app</PrivacyBullet>
            <PrivacyBullet>Save your progress and personalize your experience</PrivacyBullet>
            <PrivacyBullet>Improve app features, performance, and reliability</PrivacyBullet>
          </PrivacySection>

          <PrivacySection title="3. Data Sharing">
            <Text style={styles.privacyText}>
              Levora does not sell, rent, or trade your personal information. We may share limited
              data with trusted service providers (such as authentication or cloud storage services)
              only as necessary to operate the app, or when required by law.
            </Text>
          </PrivacySection>

          <PrivacySection title="4. Data Security">
            <Text style={styles.privacyText}>
              We implement reasonable technical and organizational measures to protect your
              information using industry-standard security practices.
            </Text>
          </PrivacySection>

          <PrivacySection title="5. Children's Privacy">
            <Text style={styles.privacyText}>
              Levora is not specifically intended for children under the age of 13. We do not
              knowingly collect personal data from children.
            </Text>
          </PrivacySection>

          <PrivacySection title="6. Changes to This Privacy Policy">
            <Text style={styles.privacyText}>
              We may update this Privacy Policy from time to time. Any changes will be posted on this
              page with an updated revision date.
            </Text>
          </PrivacySection>

          <PrivacySection title="7. Contact Us" isLast>
            <Text style={styles.privacyText}>
              If you have any questions or concerns about this Privacy Policy, you may contact us at:
            </Text>
            <Text style={styles.privacyEmail}>conatactlevora@gmail.com</Text>
          </PrivacySection>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function PrivacySection({
  title,
  children,
  isLast,
}: {
  title: string;
  children: React.ReactNode;
  isLast?: boolean;
}) {
  return (
    <View style={[styles.privacySection, !isLast && styles.privacySectionBorder]}>
      <Text style={styles.privacySectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function PrivacyBullet({ children }: { children: React.ReactNode }) {
  return (
    <View style={styles.bulletRow}>
      <View style={styles.bulletDot} />
      <Text style={[styles.privacyText, { flex: 1 }]}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG_COLOR,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    paddingTop: 8,
    marginBottom: 8,
  },
  cancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: "auto",
  },
  cancelText: {
    fontFamily: "Nunito-SemiBold",
    fontSize: 14,
    color: TEXT_SECONDARY,
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
  },
  hero: {
    alignItems: "center",
    marginBottom: 28,
  },
  heroBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#FEF3C7",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
    marginBottom: 16,
  },
  heroBadgeText: {
    fontFamily: "Nunito-Bold",
    fontSize: 12,
    color: "#D97706",
    letterSpacing: 1,
  },
  heroTitle: {
    fontFamily: "Nunito-Bold",
    fontSize: 32,
    color: TEXT_PRIMARY,
    textAlign: "center",
    lineHeight: 40,
    marginBottom: 10,
  },
  heroSubtitle: {
    fontFamily: "Nunito-Medium",
    fontSize: 15,
    color: TEXT_SECONDARY,
    textAlign: "center",
  },
  featuresCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 4,
    marginBottom: 28,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 14,
  },
  featureRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  featureIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "#F9FAFB",
    alignItems: "center",
    justifyContent: "center",
  },
  featureTitle: {
    fontFamily: "Nunito-Bold",
    fontSize: 15,
    color: TEXT_PRIMARY,
    marginBottom: 2,
  },
  featureDesc: {
    fontFamily: "Nunito-Medium",
    fontSize: 13,
    color: TEXT_SECONDARY,
  },
  packageCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 18,
    borderWidth: 2,
    borderColor: "#E5E7EB",
    position: "relative",
  },
  packageCardSelected: {
    borderColor: ACCENT_ORANGE,
    backgroundColor: "#FFF7ED",
  },
  bestValueBadge: {
    position: "absolute",
    top: -10,
    left: 16,
    backgroundColor: "#22C55E",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  bestValueText: {
    fontFamily: "Nunito-Bold",
    fontSize: 10,
    color: "#FFFFFF",
    letterSpacing: 0.5,
  },
  packageCardAnnual: {
    marginTop: 8,
  },
  packageInfo: {
    flex: 1,
  },
  packageTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  packageTitleSelected: {
    color: ACCENT_ORANGE,
  },
  trialPill: {
    backgroundColor: "#E0F2FE",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  trialPillSelected: {
    backgroundColor: "#FED7AA",
  },
  trialPillText: {
    fontFamily: "Nunito-Bold",
    fontSize: 9,
    color: "#0369A1",
    letterSpacing: 0.3,
  },
  packagePriceContainer: {
    alignItems: "flex-end",
  },
  packagePriceSelected: {
    color: ACCENT_ORANGE,
  },
  packageContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  radio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#D1D5DB",
    alignItems: "center",
    justifyContent: "center",
  },
  radioSelected: {
    borderColor: ACCENT_ORANGE,
    backgroundColor: ACCENT_ORANGE,
  },
  packageTitle: {
    fontFamily: "Nunito-Bold",
    fontSize: 16,
    color: TEXT_PRIMARY,
  },
  packageSub: {
    fontFamily: "Nunito-Medium",
    fontSize: 12,
    color: TEXT_SECONDARY,
    marginTop: 2,
  },
  packagePrice: {
    fontFamily: "Nunito-Bold",
    fontSize: 20,
    color: TEXT_PRIMARY,
  },
  packagePer: {
    fontFamily: "Nunito-Medium",
    fontSize: 12,
    color: TEXT_SECONDARY,
  },
  ctaButton: {
    backgroundColor: ACCENT_ORANGE,
    paddingVertical: 18,
    borderRadius: 999,
    alignItems: "center",
    marginBottom: 16,
    shadowColor: ACCENT_ORANGE,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 4,
  },
  ctaText: {
    fontFamily: "Nunito-Bold",
    fontSize: 17,
    color: "#FFFFFF",
  },
  disclaimer: {
    fontFamily: "Nunito-Medium",
    fontSize: 12,
    color: TEXT_SECONDARY,
    textAlign: "center",
    marginBottom: 20,
    lineHeight: 18,
  },
  legalRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  legalLink: {
    fontFamily: "Nunito-Medium",
    fontSize: 13,
    color: TEXT_SECONDARY,
    textDecorationLine: "underline",
  },
  legalDot: {
    color: "#D1D5DB",
    marginHorizontal: 12,
  },
  // Privacy View styles
  privacyHeader: {
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
  privacyHeaderTitle: {
    fontFamily: "Nunito-Bold",
    fontSize: 20,
    color: TEXT_PRIMARY,
  },
  privacyCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  privacyDate: {
    fontFamily: "Nunito-Medium",
    fontSize: 12,
    color: TEXT_SECONDARY,
    marginBottom: 16,
  },
  privacyIntro: {
    fontFamily: "Nunito-Medium",
    fontSize: 15,
    color: TEXT_PRIMARY,
    lineHeight: 24,
    marginBottom: 24,
  },
  privacySection: {
    paddingBottom: 20,
    marginBottom: 20,
  },
  privacySectionBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  privacySectionTitle: {
    fontFamily: "Nunito-Bold",
    fontSize: 16,
    color: TEXT_PRIMARY,
    marginBottom: 10,
  },
  privacyText: {
    fontFamily: "Nunito-Medium",
    fontSize: 14,
    color: TEXT_SECONDARY,
    lineHeight: 22,
  },
  bulletRow: {
    flexDirection: "row",
    marginTop: 8,
    paddingLeft: 4,
  },
  bulletDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: ACCENT_ORANGE,
    marginTop: 8,
    marginRight: 12,
  },
  privacyEmail: {
    fontFamily: "Nunito-Bold",
    fontSize: 15,
    color: ACCENT_ORANGE,
    marginTop: 12,
  },
});

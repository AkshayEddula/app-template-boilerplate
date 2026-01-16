import { useAuth } from "@clerk/clerk-expo";
import { useMutation } from "convex/react";
import React, { createContext, useContext, useEffect, useState } from "react";
import { Alert, Platform } from "react-native";
import Purchases, {
  CustomerInfo,
  PurchasesOffering,
} from "react-native-purchases";
import { api } from "../convex/_generated/api";

// 🔑 API Keys
const REVENUECAT_API_KEY = {
  ios: process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY,
  android: process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY,
};

interface SubscriptionContextType {
  isPremium: boolean;
  isLoading: boolean;
  offerings: PurchasesOffering | null;
  customerInfo: CustomerInfo | null;
  purchasePackage: (
    pkg: any,
  ) => Promise<{ success: boolean; message?: string }>;
  restorePurchases: () => Promise<{ success: boolean; message?: string }>;
}

const SubscriptionContext = createContext<SubscriptionContextType | null>(null);

export const SubscriptionProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const { userId, isLoaded } = useAuth(); // Clerk Auth
  const updateSubscriptionMutation = useMutation(api.users.updateSubscription); // Convex Mutation

  const userIdRef = React.useRef(userId);

  useEffect(() => {
    userIdRef.current = userId;
  }, [userId]);

  const [isPremium, setIsPremium] = useState(false);
  const [offerings, setOfferings] = useState<PurchasesOffering | null>(null);
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    initializeRevenueCat();
  }, []);

  // Sync User ID with RevenueCat when Clerk loads
  useEffect(() => {
    if (isLoaded && userId) {
      Purchases.logIn(userId).then(({ customerInfo }) => {
        updateCustomerInfo(customerInfo);
      });
    }
  }, [isLoaded, userId]);

  const initializeRevenueCat = async () => {
    try {
      const apiKey =
        Platform.OS === "ios"
          ? REVENUECAT_API_KEY.ios
          : REVENUECAT_API_KEY.android;
      if (!apiKey) return;

      await Purchases.configure({ apiKey });

      Purchases.addCustomerInfoUpdateListener((info) => {
        updateCustomerInfo(info);
      });

      // Load Offerings
      loadOfferings();
    } catch (error) {
      console.error("Error initializing RevenueCat:", error);
    }
  };

  const loadOfferings = async () => {
    try {
      const offerings = await Purchases.getOfferings();
      if (offerings.current) {
        setOfferings(offerings.current);
      }
      console.log(offerings);
    } catch (error) {
      console.error("Error fetching offerings", error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateCustomerInfo = async (info: CustomerInfo) => {
    setCustomerInfo(info);

    // Check if "premium" entitlement is active
    // MAKE SURE your entitlement identifier in RevenueCat dashboard matches 'premium'
    const isPro = typeof info.entitlements.active["premium"] !== "undefined";
    setIsPremium(isPro);

    // Sync with Convex
    // Use Ref to get current userId even inside stale closure
    if (userIdRef.current) {
      const expiry = info.entitlements.active["premium"]?.expirationDate;
      await updateSubscriptionMutation({
        isPremium: isPro,
        subscriptionExpiry: expiry ?? undefined,
      });
    }
  };

  const purchasePackage = async (pkg: any) => {
    try {
      const { customerInfo } = await Purchases.purchasePackage(pkg);
      updateCustomerInfo(customerInfo);
      return { success: true };
    } catch (error: any) {
      if (!error.userCancelled) {
        Alert.alert("Purchase Failed", error.message);
      }
      return { success: false, message: error.message };
    }
  };

  const restorePurchases = async () => {
    try {
      const customerInfo = await Purchases.restorePurchases();
      updateCustomerInfo(customerInfo);

      // Check if user actually has any active entitlements
      const hasActiveEntitlements = Object.keys(customerInfo.entitlements.active).length > 0;

      if (hasActiveEntitlements) {
        Alert.alert(
          "Success",
          "Your purchases have been restored!",
          [{ text: "OK" }]
        );
        return { success: true };
      } else {
        Alert.alert(
          "No Purchases Found",
          "We couldn't find any previous purchases to restore. If you believe this is an error, please contact support.",
          [{ text: "OK" }]
        );
        return { success: false, message: "No purchases found" };
      }
    } catch (error: any) {
      console.error("Restore purchases error:", error);

      // Handle specific error cases
      let errorMessage = "Unable to restore purchases. Please try again.";

      if (error.code === "NETWORK_ERROR" || error.message?.includes("network")) {
        errorMessage = "Network error. Please check your connection and try again.";
      } else if (error.code === "STORE_PROBLEM") {
        errorMessage = "There was a problem connecting to the store. Please try again later.";
      }

      Alert.alert("Restore Failed", errorMessage, [{ text: "OK" }]);
      return { success: false, message: error.message };
    }
  };

  return (
    <SubscriptionContext.Provider
      value={{
        isPremium,
        isLoading,
        offerings,
        customerInfo,
        purchasePackage,
        restorePurchases,
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
};

export const useSubscription = () => {
  const context = useContext(SubscriptionContext);
  if (!context)
    throw new Error(
      "useSubscription must be used within a SubscriptionProvider",
    );
  return context;
};

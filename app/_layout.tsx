import { ClerkLoaded, ClerkProvider, useAuth } from '@clerk/clerk-expo';
import { ConvexReactClient, useMutation, useQuery } from 'convex/react';
import { ConvexProviderWithClerk } from 'convex/react-clerk';
import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { api } from "../convex/_generated/api"; // Ensure this path is correct
import "../global.css";

// 1. Token Cache Strategy
const tokenCache = {
  async getToken(key: string) {
    try {
      return await SecureStore.getItemAsync(key);
    } catch (err) {
      console.error('SecureStore get error:', err);
      return null;
    }
  },
  async saveToken(key: string, value: string) {
    try {
      return await SecureStore.setItemAsync(key, value);
    } catch (err) {
      console.error('SecureStore set error:', err);
    }
  },
};

// 2. Convex Client
const convex = new ConvexReactClient(
  process.env.EXPO_PUBLIC_CONVEX_URL as string,
  { unsavedChangesWarning: false }
);

export default function RootLayout() {
  const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;

  if (!publishableKey) {
    throw new Error('Missing EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY');
  }

  return (
    <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache}>
      <ConvexWrapper />
    </ClerkProvider>
  );
}

function ConvexWrapper() {
  return (
    <ClerkLoaded>
      <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
        {/* We replace direct <Slot/> with our logic component */}
        <InitialLayout />
      </ConvexProviderWithClerk>
    </ClerkLoaded>
  );
}

// 3. The Logic Component
// Fixed hook order by moving useFonts to top level
function InitialLayout() {
  const { isLoaded, isSignedIn } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  // Import the mutation to create/sync user
  const storeUser = useMutation(api.users.storeUser);
  // Import query to listen to user state reactively
  const user = useQuery(api.users.currentUser);

  const [isUserInitialized, setIsUserInitialized] = useState(false);

  const [fontsLoaded] = useFonts({
    "GeneralSans-Extralight": require("../assets/fonts/generalsans/GeneralSans-Extralight.otf"),
    "GeneralSans-Light": require("../assets/fonts/generalsans/GeneralSans-Light.otf"),
    "GeneralSans-Regular": require("../assets/fonts/generalsans/GeneralSans-Regular.otf"),
    "GeneralSans-Medium": require("../assets/fonts/generalsans/GeneralSans-Medium.otf"),
    "GeneralSans-Semibold": require("../assets/fonts/generalsans/GeneralSans-Semibold.otf"),
    "GeneralSans-Bold": require("../assets/fonts/generalsans/GeneralSans-Bold.otf"),

    "ClashDisplay-Extralight": require("../assets/fonts/clashdisplay/ClashDisplay-Extralight.otf"),
    "ClashDisplay-Light": require("../assets/fonts/clashdisplay/ClashDisplay-Light.otf"),
    "ClashDisplay-Regular": require("../assets/fonts/clashdisplay/ClashDisplay-Regular.otf"),
    "ClashDisplay-Medium": require("../assets/fonts/clashdisplay/ClashDisplay-Medium.otf"),
    "ClashDisplay-Semibold": require("../assets/fonts/clashdisplay/ClashDisplay-Semibold.otf"),
    "ClashDisplay-Bold": require("../assets/fonts/clashdisplay/ClashDisplay-Bold.otf"),

    "BricolageGrotesk-Extralight": require("../assets/fonts/bricolage/BricolageGrotesque-ExtraLight.ttf"),
    "BricolageGrotesk-Light": require("../assets/fonts/bricolage/BricolageGrotesque-Light.ttf"),
    "BricolageGrotesk-Regular": require("../assets/fonts/bricolage/BricolageGrotesque-Regular.ttf"),
    "BricolageGrotesk-Medium": require("../assets/fonts/bricolage/BricolageGrotesque-Medium.ttf"),
    "BricolageGrotesk-Semibold": require("../assets/fonts/bricolage/BricolageGrotesque-SemiBold.ttf"),
    "BricolageGrotesk-Bold": require("../assets/fonts/bricolage/BricolageGrotesque-Bold.ttf"),

    "Inter-Extralight": require("../assets/fonts/Inter_24pt-ExtraLight.ttf"),
    "Inter-Light": require("../assets/fonts/Inter_24pt-Light.ttf"),
    "Inter-Regular": require("../assets/fonts/Inter_24pt-Regular.ttf"),
    "Inter-Medium": require("../assets/fonts/Inter_24pt-Medium.ttf"),
    "Inter-Semibold": require("../assets/fonts/Inter_24pt-SemiBold.ttf"),
    "Inter-Bold": require("../assets/fonts/Inter_24pt-Bold.ttf"),
  });

  useEffect(() => {
    if (!isLoaded) return;

    const syncUser = async () => {
      if (isSignedIn) {
        try {
          // Check database or create user with defaults
          await storeUser();
          setIsUserInitialized(true);
        } catch (error) {
          console.error("Error syncing user:", error);
        }
      } else {
        // Not signed in, so we are initialized (nothing to do)
        setIsUserInitialized(true);
      }
    };

    syncUser();
  }, [isLoaded, isSignedIn]);

  useEffect(() => {
    // Only run navigation logic when:
    // 1. Auth is loaded
    // 2. We have attempted to initialize the user (storeUser)
    // 3. If signed in, we have the user data from useQuery (or know it's null/loading)
    if (!isLoaded || !isUserInitialized) return;

    const inAuthGroup = segments[0] === "(auth)";
    const inLegalGroup = segments[0] === "(legal)";

    if (isSignedIn) {
      if (user === undefined || user === null) return;

      const isOnboarded = user?.is_onboarded;

      if (!isOnboarded) {
        // Redirect to onboarding if not onboarded and not already there
        const isAlreadyOnboarding = segments[1] === "onboarding-steps";
        if (!isAlreadyOnboarding) {
          router.replace("/(auth)/onboarding-steps");
        }
      } else if (inAuthGroup) {
        // User is signed in and onboarded, but in auth group (login/signup pages) -> go to tabs
        router.replace("/(tabs)");
      }
    } else if (!isSignedIn && !inAuthGroup && !inLegalGroup) {
      // Not signed in and not in auth group or legal group -> go to login
      router.replace("/(auth)/onboarding");
    }
  }, [isSignedIn, isLoaded, isUserInitialized, user, segments]);

  // Show loading indicator until we have initialized and (if signed in) loaded user data
  if (!isLoaded || !isUserInitialized || (isSignedIn && (user === undefined || user === null)) || !fontsLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  // If not signed in and trying to access protected route, show nothing (while redirecting)
  const inAuthGroup = segments[0] === "(auth)";
  const inLegalGroup = segments[0] === "(legal)";

  if (!isSignedIn && !inAuthGroup && !inLegalGroup) {
    return null;
  }

  // If signed in but not onboarded, and not on onboarding steps, show nothing (while redirecting)
  if (isSignedIn && user && !user.is_onboarded) {
    if (segments[1] !== "onboarding-steps") return null;
  }

  // If signed in and onboarded, but still on auth pages (while redirecting to tabs)
  if (isSignedIn && user?.is_onboarded && inAuthGroup) {
    return null;
  }



  // Inside your InitialLayout or RootLayout where you have the <Slot /> or <Stack />
  return (
    <Stack>
      {/* The main tab group */}
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />

      {/* The creation modal */}
      <Stack.Screen
        name="create"
        options={{
          presentation: 'modal',
          headerShown: false,
          // On iOS, this makes it a "card" style modal that doesn't cover the whole screen
          gestureEnabled: true,
        }}
      />
    </Stack>
  );
}
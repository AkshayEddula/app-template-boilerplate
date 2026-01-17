import { Ionicons } from '@expo/vector-icons';
import type { BottomTabBarButtonProps } from '@react-navigation/bottom-tabs';
import { Tabs } from 'expo-router';
import { Icon, Label, NativeTabs, VectorIcon } from 'expo-router/unstable-native-tabs';
import { DynamicColorIOS, Platform, TouchableOpacity, useWindowDimensions, View } from 'react-native';

// Theme
const BG_COLOR = "#FAF9F6";
const ACCENT_ORANGE = "#F97316";
const TEXT_SECONDARY = "#6B7280";

export default function TabsLayout() {
  const { width } = useWindowDimensions();

  // Tablet detection: typically tablets are 768px+ wide
  const isTablet = width >= 768;

  // Custom Tab Button with Active Indicator
  const CustomTabButton = ({ children, accessibilityState, style, onPress, onLongPress, testID, accessibilityLabel, accessibilityRole }: BottomTabBarButtonProps) => {
    const isActive = accessibilityState?.selected;

    return (
      <TouchableOpacity
        onPress={onPress ?? undefined}
        onLongPress={onLongPress ?? undefined}
        testID={testID}
        accessibilityLabel={accessibilityLabel}
        accessibilityRole={accessibilityRole}
        accessibilityState={accessibilityState}
        style={[style, { flex: 1 }]}
        activeOpacity={0.7}
      >
        <View style={{
          flex: 1,
          position: 'relative',
          justifyContent: 'center',
          alignItems: 'center',
        }}>
          {isActive && (
            <View
              style={{
                position: 'absolute',
                top: 8,
                bottom: 8,
                left: 8,
                right: 8,
                borderRadius: 26,
                backgroundColor: '#FFF7ED',
                shadowColor: ACCENT_ORANGE,
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.15,
                shadowRadius: 4,
                elevation: 2,
              }}
            />
          )}
          <View style={{ zIndex: 1, alignItems: 'center', justifyContent: 'center' }}>
            {children}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // --- TABLET LAYOUT: Custom Floating Transparent Tab Bar ---
  if (isTablet) {
    const tabBarWidth = 400;
    const horizontalMargin = (width - tabBarWidth) / 2;

    return (
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            position: 'absolute',
            bottom: 30,
            marginLeft: horizontalMargin,
            marginRight: horizontalMargin,
            width: tabBarWidth,
            height: 90,
            borderRadius: 999,
            backgroundColor: '#FFFFFF',
            borderWidth: 1,
            borderColor: '#F3F4F6',
            elevation: 8,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.08,
            shadowRadius: 16,
            overflow: 'hidden',
          },
          tabBarActiveTintColor: ACCENT_ORANGE,
          tabBarInactiveTintColor: TEXT_SECONDARY,
          tabBarShowLabel: true,
          tabBarItemStyle: {
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            height: 90,
          },
          tabBarLabelStyle: {
            fontSize: 11,
            fontFamily: 'Nunito-Bold',
            marginTop: 4,
            marginBottom: 0,
          },
          tabBarIconStyle: {
            marginTop: 0,
            marginBottom: 0,
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Home',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="home" size={size} color={color} />
            ),
            tabBarButton: (props) => <CustomTabButton {...props} />,
          }}
        />
        <Tabs.Screen
          name="explore"
          options={{
            title: 'Explore',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="compass" size={size} color={color} />
            ),
            tabBarButton: (props) => <CustomTabButton {...props} />,
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profile',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="person" size={size} color={color} />
            ),
            tabBarButton: (props) => <CustomTabButton {...props} />,
          }}
        />
      </Tabs>
    );
  }

  // --- MOBILE LAYOUT: Native Tabs ---
  return (
    <NativeTabs
      // Tint color for the selected tab (Text & Icon)
      tintColor={
        Platform.OS === 'ios'
          ? DynamicColorIOS({
            light: ACCENT_ORANGE,
            dark: ACCENT_ORANGE,
          })
          : ACCENT_ORANGE as any
      }
      // Hides the tab bar when scrolling down (Native iOS feature)
      minimizeBehavior="onScrollDown"
    >
      {/* --- HOME TAB --- */}
      <NativeTabs.Trigger name="index">
        <Label>Home</Label>
        {Platform.select({
          // Native SF Symbol for iOS
          ios: <Icon sf="house.fill" />,
          // Vector Icon for Android
          default: <Icon src={<VectorIcon family={Ionicons} name="home" />} />,
        })}
      </NativeTabs.Trigger>

      {/* --- EXPLORE TAB --- */}
      <NativeTabs.Trigger name="explore">
        <Label>Explore</Label>
        {Platform.select({
          ios: <Icon sf="safari.fill" />,
          default: <Icon src={<VectorIcon family={Ionicons} name="compass" />} />,
        })}
      </NativeTabs.Trigger>

      {/* --- PROFILE TAB --- */}
      <NativeTabs.Trigger name="profile">
        <Label>Profile</Label>
        {Platform.select({
          ios: <Icon sf="person.fill" />,
          default: <Icon src={<VectorIcon family={Ionicons} name="person" />} />,
        })}
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
import { Ionicons } from '@expo/vector-icons';
import type { BottomTabBarButtonProps } from '@react-navigation/bottom-tabs';
import { GlassView } from 'expo-glass-effect';
import { Tabs } from 'expo-router';
import { Icon, Label, NativeTabs, VectorIcon } from 'expo-router/unstable-native-tabs';
import { DynamicColorIOS, Platform, StyleSheet, TouchableOpacity, useWindowDimensions, View } from 'react-native';

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
                backgroundColor: 'rgba(255, 255, 255, 0.5)',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
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
            borderRadius: 35,
            backgroundColor: 'transparent',
            borderWidth: 0,
            elevation: 0,
            shadowOpacity: 0,
            overflow: 'hidden',
          },
          tabBarBackground: () => (
            <GlassView
              style={{
                ...StyleSheet.absoluteFillObject,
                borderRadius: 36,
                overflow: "hidden",
              }}
              glassEffectStyle="clear"
              tintColor="#3A7AFE"
            />
          ),
          tabBarActiveTintColor: '#FFFFFF',
          tabBarInactiveTintColor: 'rgba(255, 255, 255, 0.5)',
          tabBarShowLabel: true,
          tabBarItemStyle: {
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            height: 90,
          },
          tabBarLabelStyle: {
            fontSize: 11,
            fontFamily: 'GeneralSans-Semibold',
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
            light: '#3A7AFE',
            dark: '#3A7AFE',
          })
          : '#3A7AFE' as any
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
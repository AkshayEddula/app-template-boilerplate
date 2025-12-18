import { Ionicons } from '@expo/vector-icons';
import { Icon, Label, NativeTabs, VectorIcon } from 'expo-router/unstable-native-tabs';
import { DynamicColorIOS, Platform } from 'react-native';

export default function TabsLayout() {
  return (
    <NativeTabs
      // Tint color for the selected tab (Text & Icon)
      tintColor={Platform.select({
        ios: DynamicColorIOS({
          light: '#3A7AFE',
          dark: '#3A7AFE',
        }),
        default: '#3A7AFE'
      })}
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
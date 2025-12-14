import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function PrivacyPolicyScreen() {
    const router = useRouter();

    return (
        <SafeAreaView className="flex-1 bg-white">
            {/* Header */}
            <View className="flex-row items-center justify-between p-4 border-b border-gray-100">
                <TouchableOpacity onPress={() => router.back()} className="p-2">
                    <Ionicons pointerEvents='none' name="arrow-back" size={24} color="#000" />
                </TouchableOpacity>
                <Text className="text-lg font-bold text-black">Privacy Policy</Text>
                <View className="w-10" />
            </View>

            <ScrollView className="flex-1 px-5" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
                <Text className="text-gray-500 text-sm my-4">Last updated: December 14, 2024</Text>

                <Text className="text-lg font-bold text-black mt-4 mb-2">1. Information We Collect</Text>
                <Text className="text-base text-gray-600 leading-6">
                    We collect information that you provide directly to us, including when you
                    create an account, update your profile, or contact us for support.
                </Text>

                <Text className="text-lg font-bold text-black mt-6 mb-2">2. How We Use Your Information</Text>
                <Text className="text-base text-gray-600 leading-6">
                    We use the information we collect to provide, maintain, and improve our
                    services, to communicate with you, and to protect our users.
                </Text>

                <Text className="text-lg font-bold text-black mt-6 mb-2">3. Information Sharing</Text>
                <Text className="text-base text-gray-600 leading-6">
                    We do not share your personal information with third parties except as
                    described in this policy or with your consent.
                </Text>

                <Text className="text-lg font-bold text-black mt-6 mb-2">4. Data Security</Text>
                <Text className="text-base text-gray-600 leading-6">
                    We implement appropriate security measures to protect your information
                    against unauthorized access, alteration, or destruction.
                </Text>

                <Text className="text-lg font-bold text-black mt-6 mb-2">5. Your Rights</Text>
                <Text className="text-base text-gray-600 leading-6">
                    You have the right to access, update, or delete your personal information
                    at any time through your account settings.
                </Text>

                <Text className="text-lg font-bold text-black mt-6 mb-2">6. Contact Us</Text>
                <Text className="text-base text-gray-600 leading-6">
                    If you have questions about this Privacy Policy, please contact us at{' '}
                    <Text className="text-blue-600 font-semibold">privacy@yourapp.com</Text>
                </Text>
            </ScrollView>
        </SafeAreaView>
    );
}

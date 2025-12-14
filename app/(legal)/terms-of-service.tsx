import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function TermsOfServiceScreen() {
    const router = useRouter();

    return (
        <SafeAreaView className="flex-1 bg-white">
            {/* Header */}
            <View className="flex-row items-center justify-between p-4 border-b border-gray-100">
                <TouchableOpacity onPress={() => router.back()} className="p-2">
                    <Ionicons pointerEvents='none' name="arrow-back" size={24} color="#000" />
                </TouchableOpacity>
                <Text className="text-lg font-bold text-black">Terms of Service</Text>
                <View className="w-10" />
            </View>

            <ScrollView className="flex-1 px-5" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
                <Text className="text-gray-500 text-sm my-4">Last updated: December 14, 2024</Text>

                <Text className="text-lg font-bold text-black mt-4 mb-2">1. Acceptance of Terms</Text>
                <Text className="text-base text-gray-600 leading-6">
                    By accessing and using this application, you accept and agree to be bound
                    by the terms and provision of this agreement.
                </Text>

                <Text className="text-lg font-bold text-black mt-6 mb-2">2. Use License</Text>
                <Text className="text-base text-gray-600 leading-6">
                    Permission is granted to temporarily use the application for personal,
                    non-commercial transitory viewing only.
                </Text>

                <Text className="text-lg font-bold text-black mt-6 mb-2">3. User Account</Text>
                <Text className="text-base text-gray-600 leading-6">
                    You are responsible for maintaining the confidentiality of your account
                    and password. You agree to accept responsibility for all activities that
                    occur under your account.
                </Text>

                <Text className="text-lg font-bold text-black mt-6 mb-2">4. Prohibited Uses</Text>
                <Text className="text-base text-gray-600 leading-6">
                    You may not use the application for any illegal purpose or to violate any
                    laws in your jurisdiction.
                </Text>

                <Text className="text-lg font-bold text-black mt-6 mb-2">5. Termination</Text>
                <Text className="text-base text-gray-600 leading-6">
                    We may terminate or suspend your account immediately, without prior notice,
                    for any reason whatsoever, including violation of these Terms.
                </Text>

                <Text className="text-lg font-bold text-black mt-6 mb-2">6. Contact Information</Text>
                <Text className="text-base text-gray-600 leading-6">
                    Questions about the Terms of Service should be sent to{' '}
                    <Text className="text-blue-600 font-semibold">legal@yourapp.com</Text>
                </Text>
            </ScrollView>
        </SafeAreaView>
    );
}
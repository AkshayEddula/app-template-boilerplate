import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';

// Define types broadly compatible with the app's Resolution type
export type GuestResolution = {
    _id: string;
    title: string;
    categoryKey: string;
    frequencyType: string;
    trackingType: "yes_no" | "time_based" | "count_based";
    targetCount?: number;
    countUnit?: string;
    targetTime?: number;
    customDays?: number[];
    daysPerWeek?: number;
    currentStreak?: number;
    lastCompletedDate?: string;
    isActive: boolean;
    createdAt: number;
    description?: string;
    logs?: Record<string, { value: number, isCompleted: boolean }>;
};

interface GuestContextType {
    isGuest: boolean;
    loginAsGuest: () => Promise<void>;
    logoutGuest: () => Promise<void>;
    guestResolutions: GuestResolution[];
    addGuestResolution: (res: Omit<GuestResolution, '_id' | 'createdAt' | 'currentStreak' | 'isActive' | 'logs'>) => Promise<void>;
    updateGuestResolution: (id: string, updates: Partial<GuestResolution>) => Promise<void>;
    logGuestProgress: (id: string, date: string, value: number) => Promise<void>;
    isLoading: boolean;
    hasCompletedOnboarding: boolean;
    completeGuestOnboarding: () => Promise<void>;
}

const GuestContext = createContext<GuestContextType | null>(null);

export const GuestProvider = ({ children }: { children: React.ReactNode }) => {
    const [isGuest, setIsGuest] = useState(false);
    const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);
    const [guestResolutions, setGuestResolutions] = useState<GuestResolution[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadGuestState();
    }, []);

    const loadGuestState = async () => {
        try {
            const guestFlag = await AsyncStorage.getItem('levora_is_guest');
            if (guestFlag === 'true') {
                setIsGuest(true);
                const resolutions = await AsyncStorage.getItem('levora_guest_resolutions');
                if (resolutions) {
                    setGuestResolutions(JSON.parse(resolutions));
                }
                const onboarded = await AsyncStorage.getItem('levora_guest_onboarded');
                if (onboarded === 'true') {
                    setHasCompletedOnboarding(true);
                }
            }
        } catch (error) {
            console.error('Failed to load guest state', error);
        } finally {
            setIsLoading(false);
        }
    };

    const loginAsGuest = async () => {
        try {
            await AsyncStorage.setItem('levora_is_guest', 'true');
            setIsGuest(true);
            // Don't set onboarding to true here. It defaults to false.
        } catch (error) {
            console.error('Failed to login as guest', error);
        }
    };

    const logoutGuest = async () => {
        try {
            await AsyncStorage.removeItem('levora_is_guest');
            await AsyncStorage.removeItem('levora_guest_onboarded');
            setIsGuest(false);
            setHasCompletedOnboarding(false);
            setGuestResolutions([]);
        } catch (error) {
            console.error('Failed to logout guest', error);
        }
    };

    const addGuestResolution = async (res: Omit<GuestResolution, '_id' | 'createdAt' | 'currentStreak' | 'isActive' | 'logs'>) => {
        const newRes: GuestResolution = {
            ...res,
            _id: Math.random().toString(36).substr(2, 9),
            createdAt: Date.now(),
            currentStreak: 0,
            isActive: true,
            logs: {}
        };
        const updated = [...guestResolutions, newRes];
        setGuestResolutions(updated);
        await AsyncStorage.setItem('levora_guest_resolutions', JSON.stringify(updated));
    };

    const updateGuestResolution = async (id: string, updates: Partial<GuestResolution>) => {
        const updated = guestResolutions.map(r => r._id === id ? { ...r, ...updates } : r);
        setGuestResolutions(updated);
        await AsyncStorage.setItem('levora_guest_resolutions', JSON.stringify(updated));
    };

    const logGuestProgress = async (id: string, date: string, value: number) => {
        const updated = guestResolutions.map(r => {
            if (r._id === id) {
                const isCompleted = r.trackingType === 'yes_no' ? value > 0
                    : r.trackingType === 'time_based' ? value >= (r.targetTime || 30) * 60
                        : value >= (r.targetCount || 1);

                const newLogs = { ...r.logs, [date]: { value, isCompleted } };

                // Simple streak calc (only increases if completed today and wasn't before? keeping it simple for guest)
                let streak = r.currentStreak || 0;
                if (isCompleted && (!r.logs?.[date]?.isCompleted)) {
                    // Check if yesterday was completed to increment? Or just increment? 
                    // For guest, simple increment is fine or just leave it.
                    // Real streak logic is complex.
                }

                return { ...r, logs: newLogs, lastCompletedDate: isCompleted ? date : r.lastCompletedDate };
            }
            return r;
        });
        setGuestResolutions(updated);
        await AsyncStorage.setItem('levora_guest_resolutions', JSON.stringify(updated));
    };

    const completeGuestOnboarding = async () => {
        setHasCompletedOnboarding(true);
        await AsyncStorage.setItem('levora_guest_onboarded', 'true');
    };

    return (
        <GuestContext.Provider value={{
            isGuest,
            loginAsGuest,
            logoutGuest,
            guestResolutions,
            addGuestResolution,
            updateGuestResolution,
            logGuestProgress,
            isLoading,
            hasCompletedOnboarding,
            completeGuestOnboarding,
        }}>
            {children}
        </GuestContext.Provider>
    );
};

export const useGuest = () => {
    const context = useContext(GuestContext);
    if (!context) {
        throw new Error('useGuest must be used within a GuestProvider');
    }
    return context;
};

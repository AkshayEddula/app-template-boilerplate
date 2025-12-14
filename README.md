
# Resolution - Expo Starter Template

A modern, production-ready starter template for building mobile applications with **Expo**, **React Native**, **Clerk Auth**, **Convex Backend**, and **NativeWind (Tailwind CSS)**.

## 🚀 Features

- **Full Stack Type-Safety**: End-to-end type safety with Convex and TypeScript.
- **Authentication**: Pre-configured Authentication flow using **Clerk** (Sign Up, Sign In, Profile).
- **Secure Backend**: Serverless backend with **Convex** for real-time data and storage.
- **Database**: Reactive database with direct hooks (`useQuery`, `useMutation`).
- **Navigation**: File-based routing with **Expo Router**.
- **Styling**: Utility-first styling with **NativeWind v4** (Tailwind CSS).
- **Fonts**: Custom font injection strategy (Inter).
- **Onboarding Flow**: Splash screen -> Auth -> Onboarding -> Tabs.

## 🛠️ Tech Stack

- **Framework**: [Expo SDK 52+](https://expo.dev)
- **Navigation**: [Expo Router](https://docs.expo.dev/router/introduction/)
- **Auth**: [Clerk](https://clerk.com/)
- **Backend**: [Convex](https://convex.dev/)
- **Styling**: [NativeWind](https://www.nativewind.dev/)
- **Animations**: [Reanimated](https://docs.swmansion.com/react-native-reanimated/)

## 📋 Prerequisites

- Node.js (v18+)
- npm or yarn or bun
- Expo Go app on your physical device or an Android/iOS Emulator.

## ⚙️ Installation & Setup

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd resolution
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   Create a `.env` file in the root directory by copying the example:
   ```bash
   cp .env.example .env.local
   ```
   
   Fill in the required keys:
   - **Convex**: Run `npx convex dev`. This will configure your project and give you the Deployment URL.
   - **Clerk**: Create a Clerk application. Get the Publishable Key.
     - **Important**: Go to Clerk Dashboard -> JWT Templates -> New Template -> Select "Convex".
     - Copy the **Issuer Domain** URL and paste it into `EXPO_PUBLIC_CLERK_JWT_ISSUER_DOMAIN`.
     - Update your Convex `auth.config.ts` (if relevant) or ensure the environment variable matches the issuer.

   ```env
   # .env.local
   CONVEX_DEPLOYMENT=...
   EXPO_PUBLIC_CONVEX_URL=...
   EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
   EXPO_PUBLIC_CLERK_JWT_ISSUER_DOMAIN=https://...
   ```

4. **Start the Backend**
   In a separate terminal, run the Convex development server:
   ```bash
   npx convex dev
   ```

5. **Start the App**
   ```bash
   npx expo start -c
   ```
   Press `i` for iOS simulator, `a` for Android emulator, or scan the QR code with Expo Go.

## 📂 Project Structure

```
resolution/
├── app/                  # Expo Router pages
│   ├── (auth)/           # Authentication routes (login, signup, onboarding)
│   ├── (tabs)/           # Main app tabs (home, profile, etc.)
│   └── _layout.tsx       # Root layout & providers (Clerk+Convex)
├── components/           # Reusable UI components
├── convex/               # Backend functions & schema
│   ├── schema.ts         # Database schema definition
│   └── users.ts          # User-related API functions
├── assets/               # Images and Fonts
└── tailwind.config.js    # Tailwind configuration
```

## 🔒 Authentication Flow

The app uses a robust Conditional Routing strategy in `app/_layout.tsx`:
1. **Unauthenticated**: Redirects to `/(auth)/onboarding` or `/(auth)/sign-up`.
2. **Authenticated (New)**: Redirects to `/(auth)/onboardingSteps` to complete profile.
3. **Authenticated (Onboarded)**: Redirects to `/(tabs)` (Home).

## 💾 Database Schema

The core user model is defined in `convex/schema.ts`:
```typescript
users: defineTable({
    tokenIdentifier: v.string(), // Links to Clerk ID
    email: v.optional(v.string()),
    name: v.string(),
    is_onboarded: v.boolean(),
    ...
}).index("by_token", ["tokenIdentifier"])
```

## 🎨 Customizing

- **Fonts**: Add new font files to `assets/fonts/` and update `app/_layout.tsx` + `tailwind.config.js`.
- **Colors**: Update `tailwind.config.js` theme to add your brand colors.

## 🤝 Contributing

1. Fork the repo
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

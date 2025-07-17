# Face Analysis - iOS Skincare MVP App

A React Native + Expo iOS-only skincare analysis app that runs entirely on-device with AI-powered skin analysis and premium subscription features.

## 🎯 Features

### Free Plan
- **1 analysis per month** - Basic skin assessment
- **3 Core Metrics**: Oiliness (0-100), Redness (0-100), Texture (Good/Medium/Poor)
- **Instant Advice** - Personalized tips for each metric
- **Local Storage** - Keep last 3 analysis results
- **Complete Privacy** - All data stays on your device

### Premium Plan
- **Unlimited Analyses** - No monthly restrictions
- **Advanced Acne Detection** - AI-powered acne scoring (Low/Medium/High)
- **Personalized Routines** - Custom morning & evening skincare recommendations
- **Enhanced Features** - Access to all premium metrics and insights

## 🛠 Tech Stack

- **React Native** with Expo SDK 51
- **TypeScript** for type safety
- **MediaPipe FaceMesh** via WebAssembly for face detection
- **OpenCV.js** for image processing and skin analysis
- **SQLite** (expo-sqlite) for local data storage
- **In-App Purchases** (expo-in-app-purchases) for premium subscriptions
- **React Navigation 6** for navigation
- **Expo Camera** for photo capture

## 📋 Prerequisites

- **Node.js** 18+ and npm
- **Expo CLI**: `npm install -g @expo/cli`
- **EAS CLI**: `npm install -g eas-cli`
- **iOS Simulator** (Xcode required on macOS)
- **Apple Developer Account** (for TestFlight deployment)

## 🚀 Local Development Setup

### 1. Clone and Install Dependencies

```bash
git clone <repository-url>
cd face-analysis
npm install
```

### 2. Configure App Settings

Update `app.json` with your details:
```json
{
  "expo": {
    "ios": {
      "bundleIdentifier": "com.yourcompany.faceanalysis"
    },
    "extra": {
      "eas": {
        "projectId": "your-project-id-here"
      }
    }
  }
}
```

### 3. Set Up EAS Project

```bash
# Login to Expo
expo login

# Initialize EAS project
eas build:configure

# Update eas.json with your Apple Developer details
```

Update `eas.json`:
```json
{
  "submit": {
    "production": {
      "ios": {
        "appleId": "your-apple-id@email.com",
        "ascAppId": "your-app-store-connect-app-id",
        "appleTeamId": "your-apple-team-id"
      }
    }
  }
}
```

### 4. Run Development Server

```bash
# Start Expo development server
npm start

# Run on iOS Simulator
npm run ios
```

## 📱 Building for TestFlight

### 1. Prepare App Store Connect

1. **Create App in App Store Connect**:
   - Go to [App Store Connect](https://appstoreconnect.apple.com)
   - Create new app with matching bundle identifier
   - Note your App ID for eas.json

2. **Set Up In-App Purchases**:
   - Add products with IDs: `premium_monthly`, `premium_yearly`
   - Configure pricing and descriptions
   - Submit for review

### 2. Build and Submit

```bash
# Create production build
eas build --platform ios --profile production

# Submit to TestFlight (after build completes)
eas submit --platform ios --profile production
```

### 3. TestFlight Distribution

1. **App Store Connect** → **TestFlight**
2. **Add Internal/External Testers**
3. **Distribute Build** once processing completes

## 🔒 Privacy & App Store Requirements

### Privacy Labels Required

When submitting to App Store, declare these data types:

#### **Data Used to Track You**: None
- App does not track users across other companies' apps or websites

#### **Data Linked to You**: None
- All analysis data is stored locally on device
- No personal information is collected or stored remotely

#### **Data Not Linked to You**: None
- Camera access is used only for real-time analysis
- Photos are processed locally and not stored permanently

### Required Privacy Descriptions

Update `app.json` with these camera permissions:

```json
{
  "ios": {
    "infoPlist": {
      "NSCameraUsageDescription": "This app needs camera access to analyze your facial skin condition. Photos are processed locally and not stored.",
      "NSMicrophoneUsageDescription": "Microphone access is not used by this app."
    }
  }
}
```

### App Store Review Guidelines Compliance

✅ **Medical Disclaimer**: Prominent disclaimer that app is not medical advice  
✅ **Local Processing**: All AI/ML processing happens on-device  
✅ **Data Transparency**: Clear privacy policy about local-only data storage  
✅ **Subscription Clarity**: Clear premium feature descriptions and pricing  
✅ **Camera Purpose**: Explicit explanation of camera usage  

## 🏗 Project Structure

```
src/
├── App.tsx                 # Main app with navigation
├── types/                  # TypeScript definitions
│   └── index.ts
├── screens/               # App screens
│   ├── OnboardingScreen.tsx
│   ├── HomeScreen.tsx
│   ├── CameraScreen.tsx
│   ├── ResultScreen.tsx
│   ├── HistoryScreen.tsx
│   └── UpgradeScreen.tsx
├── components/            # Reusable UI components
│   ├── MetricCard.tsx
│   └── RoutineCard.tsx
├── hooks/                 # Custom React hooks
│   └── useFaceAnalysis.ts
└── lib/                   # Core services
    ├── database.ts        # SQLite operations
    ├── storage.ts         # Secure storage
    ├── iap.ts            # In-app purchases
    ├── mediapipe.ts      # Face detection
    └── opencv.ts         # Image analysis
```

## 🧪 Testing

### Unit Testing
```bash
npm test
```

### Device Testing
1. **iOS Simulator**: `npm run ios`
2. **Physical Device**: Use Expo Go app or development build
3. **TestFlight**: Production testing with real users

### Testing Premium Features
1. **Sandbox Environment**: Test IAP in development
2. **Real Purchases**: Use TestFlight for end-to-end testing
3. **Restore Purchases**: Test subscription restoration flow

## 🔧 Common Issues & Solutions

### Build Errors
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install

# Clear Expo cache
expo r -c
```

### Camera Permissions
- Ensure camera permissions are properly configured in `app.json`
- Test on physical device (simulator camera has limitations)

### In-App Purchase Issues
- Verify product IDs match exactly in code and App Store Connect
- Ensure IAP products are approved before testing
- Use sandbox Apple ID for testing

## 📈 Analytics & Monitoring

### Recommended Services
- **Expo Analytics**: Built-in usage analytics
- **Sentry**: Error tracking and performance monitoring
- **App Store Connect**: Download and revenue analytics

### Key Metrics to Track
- **Analysis Completion Rate**: Users who complete full analysis
- **Premium Conversion**: Free to paid subscription rate
- **User Retention**: Daily/weekly active users
- **Feature Usage**: Most used analysis features

## 🚢 Deployment Checklist

### Pre-Launch
- [ ] Test all user flows on physical device
- [ ] Verify in-app purchases work correctly
- [ ] Test camera functionality in various lighting
- [ ] Validate privacy disclaimers are prominent
- [ ] Performance test with large analysis history

### App Store Submission
- [ ] Complete app metadata and screenshots
- [ ] Upload app privacy details
- [ ] Submit for App Review
- [ ] Prepare promotional materials
- [ ] Plan launch communication strategy

## 📄 License

This project is proprietary software. All rights reserved.

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📞 Support

For technical support or questions:
- **Email**: support@yourapp.com
- **Issues**: GitHub Issues tab
- **Documentation**: [App Documentation](./docs/)

---

**Note**: This is an MVP implementation. For production use, consider implementing:
- Real MediaPipe/TensorFlow.js face detection
- Actual computer vision algorithms for skin analysis
- Server-side subscription validation
- Enhanced error handling and offline support
- Comprehensive user analytics 
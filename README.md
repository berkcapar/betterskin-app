# BetterSkin - AI-Powered Skincare Analysis App

A React Native + Expo iOS skincare analysis app that uses advanced RGB color analysis and AI-powered recommendations for comprehensive skin health assessment and personalized skincare routines.

## 🎯 Features

### Free Plan
- **1 analysis per month** - Basic skin assessment
- **3 Core Metrics**: Oiliness (0-100), Redness (0-100), Texture (0-100)
- **Instant Advice** - Personalized tips for each metric
- **Local Storage** - Keep last 3 analysis results
- **Complete Privacy** - All data stays on your device
- **Face Detection** - Real-time face detection with ML Kit

### Premium Plan
- **Unlimited Analyses** - No monthly restrictions
- **Advanced RGB Analysis** - Enhanced color-based skin assessment
- **5 Comprehensive Metrics**: Oiliness, Redness, Texture, Acne Detection, Wrinkle Analysis
- **AI-Powered Routines** - OpenAI GPT-4 generated personalized routines
- **Seasonal Reports** - AI-generated detailed seasonal skincare analysis ($10 per report)
- **Product Recommendations** - Specific product suggestions with pricing
- **Enhanced Features** - Access to all premium metrics and insights

## 🛠 Tech Stack

- **React Native** with Expo SDK 53
- **TypeScript** for type safety
- **RGB Color Analysis** - Advanced pixel-based skin analysis
- **ML Kit Face Detection** (expo-face-detector) for face detection
- **TensorFlow.js** with BlazeFace for enhanced face detection
- **OpenAI GPT-4** for AI-powered routine generation (text only)
- **SQLite** (expo-sqlite) for local data storage
- **RevenueCat** (react-native-purchases) for premium subscriptions
- **React Navigation 6** for navigation
- **Expo Camera** for photo capture
- **react-native-image-colors** for color extraction

## 📋 Prerequisites

- **Node.js** 18+ and npm
- **Expo CLI**: `npm install -g @expo/cli`
- **EAS CLI**: `npm install -g eas-cli`
- **iOS Simulator** (Xcode required on macOS)
- **Apple Developer Account** (for TestFlight deployment)
- **OpenAI API Key** (for AI routine generation)

## 🚀 Local Development Setup

### 1. Clone and Install Dependencies

```bash
git clone <repository-url>
cd face-analysis
npm install
```

### 2. Configure Environment Variables

Create a `.env` file in the root directory:
```bash
OPENAI_API_KEY=your_openai_api_key_here
```

### 3. Configure App Settings

Update `app.json` with your details:
```json
{
  "expo": {
    "name": "BetterSkin",
    "slug": "betterskin",
    "ios": {
      "bundleIdentifier": "com.yourcompany.betterskin"
    },
    "extra": {
      "eas": {
        "projectId": "your-project-id-here"
      }
    }
  }
}
```

### 4. Set Up EAS Project

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

### 5. Configure RevenueCat

Set up RevenueCat for in-app purchases:
1. Create account at [RevenueCat](https://www.revenuecat.com)
2. Add your app and configure products
3. Update the RevenueCat configuration in `src/lib/iap.ts`

### 6. Run Development Server

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
- OpenAI API calls are made anonymously for routine generation only

#### **Data Not Linked to You**: Camera Usage
- Camera access is used only for real-time analysis
- Photos are processed locally and not stored permanently
- No images are sent to external services

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
✅ **Local Processing**: All image analysis happens on-device  
✅ **Data Transparency**: Clear privacy policy about local-only data storage  
✅ **Subscription Clarity**: Clear premium feature descriptions and pricing  
✅ **Camera Purpose**: Explicit explanation of camera usage  
✅ **AI Integration**: Transparent about text-based AI routine generation  

## 🏗 Project Structure

```
src/
├── App.tsx                 # Main app with navigation
├── types/                  # TypeScript definitions
│   ├── index.ts
│   └── react-native-face-detection.d.ts
├── screens/               # App screens
│   ├── OnboardingScreen.tsx
│   ├── HomeScreen.tsx
│   ├── CameraScreen.tsx
│   ├── ResultScreen.tsx
│   ├── HistoryScreen.tsx
│   ├── UpgradeScreen.tsx
│   └── PremiumReportScreen.tsx
├── components/            # Reusable UI components
│   ├── MetricCard.tsx
│   └── RoutineCard.tsx
├── hooks/                 # Custom React hooks
│   └── useFaceAnalysis.ts
└── lib/                   # Core services
    ├── database.ts        # SQLite operations
    ├── storage.ts         # Secure storage
    ├── iap.ts            # RevenueCat in-app purchases
    ├── mediapipe.ts      # Face detection wrapper
    ├── mlkit.ts          # ML Kit face detection
    ├── realPixelAnalysis.ts # Advanced RGB color analysis
    ├── pixelAnalysis.ts  # Basic pixel analysis
    ├── openaiService.ts  # OpenAI GPT-4 routine generation
    ├── premiumAnalysis.ts # Premium seasonal reports
    ├── algorithmValidation.ts # Analysis validation
    └── imageAnalysis.ts  # Main analysis orchestrator
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
4. **OpenAI Integration**: Test AI routine generation

### Testing Analysis Features
1. **Face Detection**: Test with various lighting conditions
2. **RGB Analysis**: Verify color extraction and analysis
3. **Premium Reports**: Test seasonal report generation
4. **Error Handling**: Test offline scenarios and API failures

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

### OpenAI API Issues
- Verify API key is correctly set in environment variables
- Check API rate limits and billing status
- Test with different routine generation requests

### Face Detection Issues
- Ensure proper lighting for face detection
- Test with various face angles and distances
- Verify ML Kit integration

### RGB Analysis Issues
- Check image quality and lighting conditions
- Verify color extraction accuracy
- Test with different skin tones and conditions

## 📈 Analytics & Monitoring

### Recommended Services
- **Expo Analytics**: Built-in usage analytics
- **Sentry**: Error tracking and performance monitoring
- **App Store Connect**: Download and revenue analytics
- **RevenueCat**: Subscription analytics and insights

### Key Metrics to Track
- **Analysis Completion Rate**: Users who complete full analysis
- **Premium Conversion**: Free to paid subscription rate
- **User Retention**: Daily/weekly active users
- **Feature Usage**: Most used analysis features
- **OpenAI API Usage**: Premium routine generation adoption
- **Seasonal Report Purchases**: Revenue from premium reports

## 🚢 Deployment Checklist

### Pre-Launch
- [ ] Test all user flows on physical device
- [ ] Verify in-app purchases work correctly
- [ ] Test camera functionality in various lighting
- [ ] Validate privacy disclaimers are prominent
- [ ] Performance test with large analysis history
- [ ] Test OpenAI API integration thoroughly
- [ ] Verify face detection accuracy
- [ ] Test premium report generation
- [ ] Validate seasonal analysis features
- [ ] Test RGB analysis with different skin tones

### App Store Submission
- [ ] Complete app metadata and screenshots
- [ ] Upload app privacy details
- [ ] Submit for App Review
- [ ] Prepare promotional materials
- [ ] Plan launch communication strategy
- [ ] Configure RevenueCat for production

## 🔮 Recent Developments

### Version 1.0.0 Updates
- **Advanced RGB Analysis**: Enhanced color-based skin assessment
- **Premium Seasonal Reports**: Detailed $10 seasonal skincare analysis
- **ML Kit Face Detection**: Improved face detection with expo-face-detector
- **RevenueCat Integration**: Robust subscription management
- **Advanced Metrics**: Added acne detection and wrinkle analysis
- **AI Routine Generation**: OpenAI GPT-4 powered personalized routines
- **Seasonal Analysis**: Context-aware seasonal skincare adjustments

### Technical Improvements
- **TypeScript Migration**: Complete type safety implementation
- **Performance Optimization**: Faster analysis and better memory management
- **Error Handling**: Comprehensive error handling and fallback mechanisms
- **Offline Support**: Graceful degradation when services unavailable
- **Security Enhancements**: Secure API key management and data handling

## 🔬 Analysis Technology

### RGB Color Analysis
The app uses advanced RGB color analysis to assess skin conditions:

- **Oiliness Detection**: Analyzes brightness patterns and reflective surfaces
- **Redness Analysis**: Measures red channel dominance vs green/blue channels
- **Texture Assessment**: Calculates color variation between neighboring pixels
- **Acne Detection**: Identifies color anomalies and texture irregularities
- **Wrinkle Analysis**: Detects fine lines through texture pattern analysis

### Environmental Factors
- **Lighting Quality**: Adjusts analysis based on lighting conditions
- **Color Temperature**: Normalizes results for different light sources
- **Contrast Analysis**: Ensures reliable results across various conditions

### AI Integration
- **Routine Generation**: Uses OpenAI GPT-4 for personalized skincare routines
- **Seasonal Reports**: AI-powered detailed seasonal analysis
- **Product Recommendations**: AI-generated product suggestions

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
- **Email**: support@betterskin.com
- **Issues**: GitHub Issues tab
- **Documentation**: [App Documentation](./docs/)

---

**Note**: This app uses advanced RGB color analysis for skin assessment while maintaining complete privacy through local processing. OpenAI integration is limited to text-based routine generation and does not process any images. 
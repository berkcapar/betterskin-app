import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Dimensions,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { Camera, CameraType } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { useFaceAnalysis } from '@/hooks/useFaceAnalysis';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/types';
import { getFirstFace } from '@/lib/mlkit';

type CameraScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Camera'>;

interface CameraScreenProps {
  navigation: CameraScreenNavigationProp;
}

const { width, height } = Dimensions.get('window');

export default function CameraScreen({ navigation }: CameraScreenProps) {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isCountingDown, setIsCountingDown] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const [showGuide, setShowGuide] = useState(true);
  const cameraRef = useRef<Camera>(null);
  
  const { isAnalyzing, progress, currentStep, analyzeImage, checkLighting, error } = useFaceAnalysis();

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  useEffect(() => {
    if (error) {
      Alert.alert('Analysis Error', error);
    }
  }, [error]);

  const handleCapture = async () => {
    if (!cameraRef.current || isCountingDown || isAnalyzing) return;

    try {
      setIsCountingDown(true);
      setShowGuide(false);

      // Countdown
      for (let i = 3; i > 0; i--) {
        setCountdown(i);
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      // Capture photo
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: false,
        skipProcessing: false,
      });

      setIsCountingDown(false);

      // Check lighting conditions
      const hasGoodLighting = await checkLighting(photo.uri);
      if (!hasGoodLighting) {
        setShowGuide(true);
        return;
      }

      // Detect face using ML Kit
      const face = await getFirstFace(photo.uri);
      if (!face) {
        Alert.alert('Face Not Detected', 'Please ensure your face is clearly visible in the frame and try again.');
        setShowGuide(true);
        return;
      }

      // Analyze the captured image
      const result = await analyzeImage(photo.uri);
      
      if (result) {
        navigation.replace('Result', { analysisId: result.id });
      } else {
        setShowGuide(true);
      }
    } catch (err) {
      console.error('Capture failed:', err);
      Alert.alert('Error', 'Failed to capture photo. Please try again.');
      setIsCountingDown(false);
      setShowGuide(true);
    }
  };

  const handleCancel = () => {
    if (isAnalyzing) {
      Alert.alert(
        'Cancel Analysis',
        'Are you sure you want to cancel the ongoing analysis?',
        [
          { text: 'Continue', style: 'cancel' },
          { text: 'Cancel', onPress: () => navigation.goBack(), style: 'destructive' },
        ]
      );
    } else {
      navigation.goBack();
    }
  };

  if (hasPermission === null) {
    return (
      <View style={styles.permissionContainer}>
        <ActivityIndicator size="large" color="#4F46E5" />
        <Text style={styles.permissionText}>Requesting camera permission...</Text>
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={styles.permissionContainer}>
        <Ionicons name="camera-off" size={64} color="#94a3b8" />
        <Text style={styles.permissionTitle}>Camera Access Required</Text>
        <Text style={styles.permissionText}>
          Please grant camera access to analyze your skin condition.
        </Text>
        <TouchableOpacity style={styles.settingsButton} onPress={() => navigation.goBack()}>
          <Text style={styles.settingsButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Camera style={styles.camera} type={CameraType.front} ref={cameraRef}>
        {/* Analysis Overlay */}
        {isAnalyzing && (
          <View style={styles.analysisOverlay}>
            <View style={styles.analysisContainer}>
              <ActivityIndicator size="large" color="#ffffff" style={styles.spinner} />
              <Text style={styles.analysisStep}>{currentStep}</Text>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${progress}%` }]} />
              </View>
              <Text style={styles.progressText}>{Math.round(progress)}%</Text>
            </View>
          </View>
        )}

        {/* Face Guide */}
        {showGuide && !isAnalyzing && (
          <View style={styles.guideContainer}>
            <View style={styles.guideOverlay}>
              {/* Face oval guide */}
              <View style={styles.faceGuide}>
                <View style={styles.faceOval} />
              </View>
              
              {/* Instructions */}
              <View style={styles.instructionsContainer}>
                <Text style={styles.instructionTitle}>Position Your Face</Text>
                <Text style={styles.instructionText}>
                  • Center your face in the oval
                </Text>
                <Text style={styles.instructionText}>
                  • Ensure good lighting
                </Text>
                <Text style={styles.instructionText}>
                  • Remove glasses if possible
                </Text>
                <Text style={styles.instructionText}>
                  • Keep still during capture
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Countdown */}
        {isCountingDown && (
          <View style={styles.countdownContainer}>
            <Text style={styles.countdownText}>{countdown}</Text>
            <Text style={styles.countdownSubtext}>Hold still...</Text>
          </View>
        )}

        {/* Controls */}
        <View style={styles.controls}>
          <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
            <Ionicons name="close" size={24} color="#ffffff" />
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.captureButton,
              (isCountingDown || isAnalyzing) && styles.captureButtonDisabled,
            ]}
            onPress={handleCapture}
            disabled={isCountingDown || isAnalyzing}
          >
            <View style={styles.captureButtonInner} />
          </TouchableOpacity>

          <View style={styles.placeholder} />
        </View>
      </Camera>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  camera: {
    flex: 1,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    padding: 40,
  },
  permissionTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1f2937',
    marginTop: 24,
    marginBottom: 12,
    textAlign: 'center',
  },
  permissionText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  settingsButton: {
    backgroundColor: '#4F46E5',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
  },
  settingsButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  analysisOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  analysisContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 32,
    borderRadius: 16,
    alignItems: 'center',
    marginHorizontal: 40,
  },
  spinner: {
    marginBottom: 16,
  },
  analysisStep: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 16,
  },
  progressBar: {
    width: 200,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 2,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#ffffff',
    borderRadius: 2,
  },
  progressText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
  },
  guideContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  guideOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  faceGuide: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  faceOval: {
    width: width * 0.7,
    height: width * 0.9,
    borderWidth: 3,
    borderColor: '#ffffff',
    borderRadius: (width * 0.7) / 2,
    backgroundColor: 'transparent',
  },
  instructionsContainer: {
    position: 'absolute',
    bottom: 200,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  instructionTitle: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 16,
    textAlign: 'center',
  },
  instructionText: {
    color: '#ffffff',
    fontSize: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  countdownContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  countdownText: {
    color: '#ffffff',
    fontSize: 80,
    fontWeight: '700',
    marginBottom: 8,
  },
  countdownSubtext: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '500',
  },
  controls: {
    position: 'absolute',
    bottom: 50,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  cancelButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  captureButtonDisabled: {
    opacity: 0.5,
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#ffffff',
  },
  placeholder: {
    width: 50,
    height: 50,
  },
}); 
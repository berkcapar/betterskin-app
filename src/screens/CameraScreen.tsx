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
import { Camera, CameraView } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
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
  const [cameraReady, setCameraReady] = useState(false);
  const [pictureSize, setPictureSize] = useState<string | undefined>();
  const cameraRef = useRef<CameraView>(null);
  
  const { isAnalyzing, progress, currentStep, analyzeImage, error } = useFaceAnalysis();

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
    if (!cameraRef.current || isCountingDown) return;

    try {
      setIsCountingDown(true);
      
      // 3 second countdown
      for (let i = 3; i > 0; i--) {
        setCountdown(i);
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      setCountdown(0);

      // Capture photo
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.5, // Quality can be higher now as resolution is controlled
        base64: false,
        exif: false, // Disable EXIF data to prevent potential instability
      });

      setIsCountingDown(false);

      await processImage(photo.uri);

    } catch (err) {
      console.error('Capture failed:', err);
      setIsCountingDown(false);
      setShowGuide(true);
      Alert.alert('Camera Error', 'Failed to capture photo. Please try again.');
    }
  };

  const handleImagePicker = async () => {
    try {
      // Request permission first
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (permissionResult.granted === false) {
        Alert.alert('Permission Required', 'Camera roll access is required to select photos.');
        return;
      }

      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [3, 4], // Portrait aspect ratio
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        await processImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Image picker failed:', error);
      Alert.alert('Error', 'Failed to select image. Please try again.');
    }
  };

  const processImage = async (imageUri: string) => {
    try {
      // Check if photo was captured successfully
      if (!imageUri) {
        Alert.alert('Error', 'Failed to get image. Please try again.');
        setShowGuide(true);
        return;
      }

      console.log('Processing image:', imageUri);

      // Check for face first
      const face = await getFirstFace(imageUri);
      if (!face) {
        Alert.alert('Face Not Detected', 'Please ensure your face is clearly visible and try again.');
        setShowGuide(true);
        return;
      }

      console.log('Face detected:', face);

      // Analyze the captured image
      const result = await analyzeImage(imageUri);
      
      if (result) {
        navigation.replace('Result', { analysisId: result.id });
      } else {
        setShowGuide(true);
      }
    } catch (err) {
      console.error('Image processing failed:', err);
      setShowGuide(true);
      Alert.alert('Processing Error', 'Failed to process image. Please try again.');
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

  const onCameraReady = async () => {
    setCameraReady(true);
    if (cameraRef.current) {
      try {
        const sizes = await cameraRef.current.getAvailablePictureSizesAsync();
        // Simple logic to find a medium-low resolution
        // e.g., aiming for something around 1280x720
        let chosenSize = sizes.find(size => {
          const [w, h] = size.split('x').map(Number);
          return w === 1280 && h === 720;
        });

        // Fallback to the lowest available resolution if 1280x720 is not found
        if (!chosenSize && sizes.length > 0) {
          console.log('1280x720 not found, falling back to lowest resolution.');
          chosenSize = sizes[sizes.length - 1]; 
        }

        if (chosenSize) {
          console.log(`Setting picture size to: ${chosenSize}`);
          setPictureSize(chosenSize);
        }
      } catch (e) {
        console.error("Could not get available picture sizes", e);
      }
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
        <Ionicons name={"camera-off" as any} size={64} color="#94a3b8" />
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
      <View style={styles.cameraWrapper}>
        <CameraView
          style={StyleSheet.absoluteFill}
          facing="front"
          ref={cameraRef}
          onCameraReady={onCameraReady}
          pictureSize={pictureSize}
        />

        {/* Analysis Overlay */}
        {isAnalyzing && (
          <View style={styles.analysisOverlay} pointerEvents="none">
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
          <View style={styles.guideContainer} pointerEvents="none">
            <View style={styles.guideOverlay}>
              {/* Face oval guide */}
              <View style={styles.faceGuide}>
                <View style={styles.faceOval} />
              </View>
              {/* Instructions */}
              <View style={styles.instructionsContainer}>
                <Text style={styles.instructionTitle}>Position Your Face</Text>
                <Text style={styles.instructionText}>• Center your face in the oval</Text>
                <Text style={styles.instructionText}>• Ensure good lighting</Text>
                <Text style={styles.instructionText}>• Remove glasses if possible</Text>
                <Text style={styles.instructionText}>• Keep still during capture</Text>
              </View>
            </View>
          </View>
        )}

        {/* Countdown */}
        {isCountingDown && (
          <View style={styles.countdownContainer} pointerEvents="none">
            <Text style={styles.countdownText}>{countdown}</Text>
            <Text style={styles.countdownSubtext}>Hold still...</Text>
          </View>
        )}
      </View>

        {/* Controls */}
        <View style={styles.controls}>
          <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
            <Ionicons name="close" size={24} color="#ffffff" />
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.captureButton,
              (!cameraReady || isCountingDown || isAnalyzing) && styles.captureButtonDisabled,
            ]}
            onPress={handleCapture}
            disabled={!cameraReady || isCountingDown || isAnalyzing}
          >
            <View style={styles.captureButtonInner} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.imagePickerButton} onPress={handleImagePicker}>
            <Ionicons name="image" size={24} color="#ffffff" />
          </TouchableOpacity>
        </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  cameraWrapper: {
    flex: 1,
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
  imagePickerButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholder: {
    width: 50,
    height: 50,
  },
}); 
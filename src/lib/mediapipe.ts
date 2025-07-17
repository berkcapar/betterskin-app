import { FaceDetectionResult, FaceRegions } from '@/types';

// Real ML Kit face detection
import FaceDetection from 'react-native-face-detection';

interface MLKitFace {
  boundingBox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  landmarks?: Array<{
    type: string;
    position: { x: number; y: number };
  }>;
  leftEyeOpenProbability?: number;
  rightEyeOpenProbability?: number;
  smilingProbability?: number;
  headEulerAngleX?: number;
  headEulerAngleY?: number;
  headEulerAngleZ?: number;
  trackingId?: number;
}

class MediaPipeService {
  private isInitialized = false;

  async initialize(): Promise<void> {
    try {
      console.log('Initializing React Native Face Detection...');
      
      // React Native Face Detection doesn't need explicit initialization
      this.isInitialized = true;
      console.log('React Native Face Detection ready');
    } catch (error) {
      console.error('React Native Face Detection initialization failed:', error);
      this.isInitialized = true; // Don't block the app
    }
  }

  isReady(): boolean {
    return this.isInitialized;
  }

  // Main face detection method using react-native-face-detection
  async detectFace(imageUri: string): Promise<FaceDetectionResult | null> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      console.log('Running face detection on:', imageUri);
      
      // Face detection options for react-native-face-detection
      const options = {
        landmarkMode: 'ALL',     // 'NONE' or 'ALL'
        contourMode: 'NONE',     // 'NONE' or 'ALL'
        classificationMode: 'ALL', // 'NONE' or 'ALL'
        performanceMode: 'FAST', // 'FAST' or 'ACCURATE'
        minFaceSize: 0.1,        // Minimum face size (0.0 to 1.0)
      };

      // Detect faces using react-native-face-detection
      const faces = await FaceDetection.processImage(imageUri, options);
      
      if (!faces || faces.length === 0) {
        console.log('No faces detected');
        return null;
      }

      const face = faces[0]; // Use first detected face
      console.log('Face detected:', face);

      // Convert face detection result to our format
      const landmarks = this.convertMLKitLandmarks(face.landmarks || []);
      
      return {
        landmarks,
        boundingBox: {
          x: face.boundingBox.x,
          y: face.boundingBox.y,
          width: face.boundingBox.width,
          height: face.boundingBox.height,
        },
        confidence: this.calculateConfidence(face),
      };
    } catch (error) {
      console.error('Face detection failed:', error);
      return null;
    }
  }

  // This method is for backward compatibility - will be replaced by real detection
  processFaceDetectionResult(faces: any[]): FaceDetectionResult | null {
    console.log('Note: This method is deprecated, use detectFace() with real ML Kit');
    return null;
  }

  private calculateConfidence(face: MLKitFace): number {
    // Calculate confidence based on available ML Kit data
    let confidence = 0.85; // Base confidence for ML Kit detection
    
    // If eyes are detected and open, increase confidence
    if (face.leftEyeOpenProbability !== undefined && face.rightEyeOpenProbability !== undefined) {
      const eyeOpenness = (face.leftEyeOpenProbability + face.rightEyeOpenProbability) / 2;
      confidence += eyeOpenness * 0.1;
    }
    
    // If landmarks are available, increase confidence
    if (face.landmarks && face.landmarks.length > 0) {
      confidence += 0.05;
    }
    
    // If head pose is reasonable, increase confidence
    if (face.headEulerAngleY !== undefined && face.headEulerAngleZ !== undefined) {
      const headPoseScore = 1 - Math.abs(face.headEulerAngleY) / 90 - Math.abs(face.headEulerAngleZ) / 90;
      confidence += headPoseScore * 0.05;
    }
    
    return Math.min(confidence, 1.0);
  }

  private convertMLKitLandmarks(landmarks: Array<{ type: string; position: { x: number; y: number } }>): Float32Array {
    // Convert ML Kit landmarks to MediaPipe-like format
    const result = new Float32Array(468 * 3); // MediaPipe has 468 landmarks
    
    // Map ML Kit landmarks to approximate MediaPipe positions
    const landmarkMap: { [key: string]: number[] } = {
      'LEFT_EYE': [33, 7, 163, 144, 145, 153, 154, 155, 133, 173, 157, 158, 159, 160, 161, 246],
      'RIGHT_EYE': [362, 382, 381, 380, 374, 373, 390, 249, 263, 466, 388, 387, 386, 385, 384, 398],
      'NOSE_BASE': [1, 2, 5, 4, 6, 19, 20, 94, 125, 141, 235, 236, 3, 51, 48, 115, 131, 134, 102, 49, 220, 305, 281, 363, 360, 279],
      'LEFT_MOUTH': [61, 84, 17, 314, 405, 320, 307, 375, 321, 308, 324, 318],
      'RIGHT_MOUTH': [291, 303, 267, 269, 270, 267, 271, 272],
      'LEFT_CHEEK': [116, 117, 118, 119, 120, 121, 126, 142, 36, 205, 206, 207, 213, 192, 147, 187, 177, 137, 227, 234],
      'RIGHT_CHEEK': [345, 346, 347, 348, 349, 350, 451, 452, 453, 464, 435, 410, 454, 323, 361, 288, 397, 365, 379, 378, 400, 377, 152, 148, 176, 149, 150, 136, 172, 58, 132, 93],
      'LEFT_EAR': [127, 142, 36, 205, 206],
      'RIGHT_EAR': [356, 454, 323, 361, 288],
    };

    // Initialize all landmarks to center position
    for (let i = 0; i < 468; i++) {
      result[i * 3] = 0.5;     // x
      result[i * 3 + 1] = 0.5; // y  
      result[i * 3 + 2] = 0;   // z
    }

    // Apply detected landmarks to approximate positions
    landmarks.forEach(landmark => {
      const indices = landmarkMap[landmark.type] || [];
      indices.forEach(index => {
        if (index < 468) {
          result[index * 3] = landmark.position.x;
          result[index * 3 + 1] = landmark.position.y;
          result[index * 3 + 2] = 0;
        }
      });
    });

    return result;
  }

  extractFaceRegions(landmarks: Float32Array, imageWidth: number, imageHeight: number): FaceRegions {
    // T-Zone: Forehead and nose bridge
    const tZoneIndices = [
      9, 10, 151, 337, 299, 333, 298, 301, 368, // Forehead area
      6, 352, 347, 348, 349, 350, // Nose bridge
      102, 48, 64, 98, 129, 126, 142, 36, 205, 206, 207, // T-zone center
    ];
    
    // U-Zone: Cheeks and lower face
    const uZoneIndices = [
      172, 136, 150, 149, 176, 148, 152, 377, 400, 378, 379, 365, 397, 288, 361, 323,
      234, 227, 137, 177, 215, 213, 192, 147, 187, 207, 206, 203, 177, 137,
    ];

    // Convert landmark indices to coordinate arrays
    const tZone = tZoneIndices.map(idx => {
      const i = Math.min(idx, 467);
      return [
        landmarks[i * 3] * imageWidth,
        landmarks[i * 3 + 1] * imageHeight,
      ];
    });

    const uZone = uZoneIndices.map(idx => {
      const i = Math.min(idx, 467);
      return [
        landmarks[i * 3] * imageWidth,
        landmarks[i * 3 + 1] * imageHeight,
      ];
    });

    // Full face outline
    const faceOutlineIndices = [
      10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288, 397, 365, 379, 378, 400, 377, 152, 148, 176, 149, 150, 136, 172, 58, 132, 93, 234, 127, 162, 21, 54, 103, 67, 109, 10
    ];
    
    const fullFace = faceOutlineIndices.map(idx => {
      const i = Math.min(idx, 467);
      return [
        landmarks[i * 3] * imageWidth,
        landmarks[i * 3 + 1] * imageHeight,
      ];
    });

    return {
      tZone,
      uZone,
      fullFace,
    };
  }
}

export const mediaPipe = new MediaPipeService(); 
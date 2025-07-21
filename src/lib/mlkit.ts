import * as FaceDetector from 'expo-face-detector';

export async function getFirstFace(imageUri: string) {
  try {
    console.log('Starting face detection on:', imageUri);
    
    const options = {
      mode: FaceDetector.FaceDetectorMode.fast,
      detectLandmarks: FaceDetector.FaceDetectorLandmarks.none,
      runClassifications: FaceDetector.FaceDetectorClassifications.none,
    };

    const result = await FaceDetector.detectFacesAsync(imageUri, options);
    console.log('Face detection result:', result);
    
    // expo-face-detector returns an object with faces array
    if (!result || !result.faces || !Array.isArray(result.faces) || result.faces.length === 0) {
      console.log('No faces detected');
      return null;
    }

    console.log('Face detected:', result.faces[0]);
    return result.faces[0];
  } catch (error) {
    console.error('Face detection error:', error);
    return null;
  }
} 
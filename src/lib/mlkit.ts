import { RNMLKitFaceDetector, RNMLKitFace, RNMLKitFaceDetectorOptions, RNMLKitFaceDetectionResult } from '@infinitered/react-native-mlkit-face-detection';

let detector: RNMLKitFaceDetector | null = null;

async function getDetector(options: RNMLKitFaceDetectorOptions = { performanceMode: 'fast' }): Promise<RNMLKitFaceDetector> {
  if (!detector) {
    detector = new RNMLKitFaceDetector(options, true);
    await detector.initialize(options);
  }
  return detector;
}

export async function getFirstFace(uri: string): Promise<RNMLKitFace | null> {
  try {
    const det = await getDetector({ performanceMode: 'fast', landmarkMode: true, classificationMode: true });
    const res: RNMLKitFaceDetectionResult | undefined = await det.detectFaces(uri);
    if (res?.success && res.faces.length > 0) {
      return res.faces[0];
    }
    return null;
  } catch (error) {
    console.error('MLKit detectFaces error:', error);
    return null;
  }
}

export async function detectFacesInImage(uri: string): Promise<RNMLKitFace[]> {
  try {
    const det = await getDetector({ performanceMode: 'fast', landmarkMode: true, classificationMode: true });
    const res: RNMLKitFaceDetectionResult | undefined = await det.detectFaces(uri);
    return res?.success ? res.faces : [];
  } catch (error) {
    console.error('MLKit detectFaces error:', error);
    return [];
  }
} 
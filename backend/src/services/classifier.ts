import { pipeline } from '@xenova/transformers';

let classifierInstance: any = null;

async function getClassifier() {
  if (!classifierInstance) {
    console.log('Loading classification model (onnx-community/tanaos-emotion-detection-v1-ONNX)...');
    classifierInstance = await pipeline(
      'text-classification',
      'onnx-community/tanaos-emotion-detection-v1-ONNX'
    );
    console.log('Classification model loaded successfully.');
  }
  return classifierInstance;
}

export async function classifyMood(text: string): Promise<{ mood: string; score: number }> {
  if (!text || text.trim() === '') {
    return { mood: 'neutral', score: 1.0 };
  }

  try {
    const classifier = await getClassifier();
    const results = await classifier(text);
    
    if (results && results.length > 0) {
      const topResult = results[0];
      return {
        mood: topResult.label.toLowerCase(),
        score: topResult.score
      };
    }
    
    return { mood: 'neutral', score: 1.0 };
  } catch (error) {
    console.error('Error during emotion classification, invoking fallback:', error);
    return fallbackClassify(text);
  }
}

function fallbackClassify(text: string): { mood: string; score: number } {
  const lowercase = text.toLowerCase();
  if (
    lowercase.includes('exhausted') || 
    lowercase.includes('tired') || 
    lowercase.includes('sad') || 
    lowercase.includes('depressed') || 
    lowercase.includes('crying') || 
    lowercase.includes('down') ||
    lowercase.includes('fatigued')
  ) {
    return { mood: 'sadness', score: 0.8 };
  }
  if (
    lowercase.includes('stressed') || 
    lowercase.includes('anxious') || 
    lowercase.includes('panic') || 
    lowercase.includes('overwhelmed') || 
    lowercase.includes('worry') ||
    lowercase.includes('nervous')
  ) {
    return { mood: 'fear', score: 0.8 };
  }
  if (
    lowercase.includes('angry') || 
    lowercase.includes('mad') || 
    lowercase.includes('pissed') || 
    lowercase.includes('annoyed') ||
    lowercase.includes('furious')
  ) {
    return { mood: 'anger', score: 0.8 };
  }
  if (
    lowercase.includes('happy') || 
    lowercase.includes('good') || 
    lowercase.includes('great') || 
    lowercase.includes('excited') || 
    lowercase.includes('joy') ||
    lowercase.includes('awesome')
  ) {
    return { mood: 'joy', score: 0.8 };
  }
  if (
    lowercase.includes('bored') ||
    lowercase.includes('meh') ||
    lowercase.includes('nothing')
  ) {
    return { mood: 'neutral', score: 0.8 };
  }
  return { mood: 'neutral', score: 1.0 };
}

export interface UserState {
  stressLevel: number;      // 0 to 100
  calmLevel: number;        // 0 to 100
  attentionCapacity: number; // 0 to 100
}

export type TimeAvailable = 'short' | 'medium' | 'long';
export type EnergyLevel = 'low' | 'mid' | 'high';

export function computeUserState(
  mood: string,
  timeAvailable: TimeAvailable,
  energyLevel: EnergyLevel,
  hour: number // 0-23
): UserState {
  // 1. Establish base scores from the inferred mood
  let stress = 30;
  let calm = 70;
  let attention = 60;

  const normalizedMood = mood.toLowerCase();
  switch (normalizedMood) {
    case 'sadness':
      stress = 55;
      calm = 35;
      attention = 40;
      break;
    case 'joy':
      stress = 15;
      calm = 85;
      attention = 75;
      break;
    case 'anger':
      stress = 90;
      calm = 10;
      attention = 45;
      break;
    case 'fear':
      stress = 85;
      calm = 15;
      attention = 35;
      break;
    case 'surprise':
      stress = 40;
      calm = 50;
      attention = 65;
      break;
    case 'disgust':
      stress = 70;
      calm = 20;
      attention = 40;
      break;
    case 'excitement':
      stress = 25;
      calm = 65;
      attention = 85;
      break;
    case 'neutral':
    default:
      stress = 30;
      calm = 70;
      attention = 60;
      break;
  }

  // 2. Adjust based on energy level
  if (energyLevel === 'low') {
    stress += 15;      // Exhaustion increases perceived stress/irritability
    calm -= 10;
    attention -= 30;   // Low energy severely caps cognitive capacity
  } else if (energyLevel === 'high') {
    stress -= 10;
    calm += 5;
    attention += 20;   // High energy boosts cognitive/attention focus
  }

  // 3. Adjust based on time availability
  if (timeAvailable === 'short') {
    stress += 20;      // Rushed feelings increase stress
    calm -= 20;        // Cannot feel calm when on a tight schedule
    attention -= 20;   // Inability to invest attention in long content
  } else if (timeAvailable === 'long') {
    stress -= 15;      // Having ample time reduces urgency/stress
    calm += 15;
    attention += 15;   // Can invest in deeper, longer content
  }

  // 4. Adjust based on time of day (hour)
  if (hour >= 22 || hour < 5) {
    // Late Night / Early Morning
    stress += 10;      // Tiredness
    calm += 5;         // Quietness of night
    attention -= 25;   // Natural cognitive decline at night
  } else if (hour >= 5 && hour < 12) {
    // Morning
    stress -= 10;      // Fresh start
    calm += 10;
    attention += 15;   // High mental clarity
  } else if (hour >= 12 && hour < 17) {
    // Afternoon
    stress += 15;      // Workday stress / mid-day slump
    calm -= 10;
    attention += 5;
  } else if (hour >= 17 && hour < 22) {
    // Evening
    stress -= 5;       // Winding down
    calm += 15;        // Relaxation
    attention -= 10;   // Transitioning to rest
  }

  // 5. Clamp values to [0, 100]
  const clamp = (val: number) => Math.min(100, Math.max(0, val));

  return {
    stressLevel: clamp(stress),
    calmLevel: clamp(calm),
    attentionCapacity: clamp(attention),
  };
}

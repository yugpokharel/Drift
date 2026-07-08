import { useState, useEffect } from 'react';
import './App.css';

interface UserState {
  stressLevel: number;
  calmLevel: number;
  attentionCapacity: number;
}

interface ContentItem {
  id: string;
  title: string;
  category: 'tv_show' | 'movie' | 'music';
  extraInfo: string;
  stress: '-' | 'neutral' | '+';
  calm: '-' | 'neutral' | '+';
  attention: '-' | 'neutral' | '+';
}

interface Recommendations {
  tv_show: ContentItem;
  movie: ContentItem;
  music: ContentItem;
}

type Tab = 'drift' | 'focus' | 'habits' | 'profile' | 'about';
type DriftStep = 'mood' | 'auth-prompt' | 'support' | 'time' | 'energy' | 'results';
type AuthStep = 'login' | 'signup' | 'forgot' | 'dashboard';
type BreathState = 'idle' | 'inhale' | 'hold' | 'exhale';

const API_BASE = 'http://localhost:3001/api';

// Curated psychology and digital wellness facts
const WELLNESS_FACTS = [
  "The Doherty Threshold states that a system's response time should be under 400ms to keep a user's attention from drifting.",
  "Studies show that simply having your smartphone visible on your desk, even if off, reduces your available cognitive capacity.",
  "The average adult unlocks their phone 150 times daily, often driven by subconscious habit loops.",
  "Psychologists call the stress of choosing from too many options 'choice paralysis' — a core reason Drift exists.",
  "Taking just three deep breaths can instantly activate your parasympathetic nervous system, lowering heart rate and cortisol.",
  "In 1890, William James defined attention as 'the taking possession by the mind, in clear and vivid form, of one out of several possible objects.'",
  "The Zeigarnik Effect states that humans remember uncompleted tasks better than completed ones, which is why open tabs cause mental clutter."
];

export default function App() {
  // Navigation & Core States
  const [activeTab, setActiveTab] = useState<Tab>('drift');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  
  // Drift Flow States
  const [driftStep, setDriftStep] = useState<DriftStep>('mood');
  const [text, setText] = useState('');
  const [mood, setMood] = useState('neutral');
  const [timeAvailable, setTimeAvailable] = useState<'short' | 'medium' | 'long' | null>(null);
  const [energyLevel, setEnergyLevel] = useState<'low' | 'mid' | 'high' | null>(null);
  const [userState, setUserState] = useState<UserState | null>(null);
  const [recommendations, setRecommendations] = useState<Recommendations | null>(null);
  
  // App Loading / Error States
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentFact, setCurrentFact] = useState('');

  // Auth Form States
  const [authStep, setAuthStep] = useState<AuthStep>('login');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authName, setAuthName] = useState('');
  const [authConfirmPassword, setAuthConfirmPassword] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Focus Mode States
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [focusTimeLeft, setFocusTimeLeft] = useState(1500); // 25 mins
  const [isFocusRunning, setIsFocusRunning] = useState(false);

  // Breathing Exercise States
  const [breathState, setBreathState] = useState<BreathState>('idle');
  const [breathSeconds, setBreathSeconds] = useState(4);

  // Grief support auto-advance countdown (3 seconds)
  const [supportCountdown, setSupportCountdown] = useState(3);

  // Redesign state hooks
  const [animateGauges, setAnimateGauges] = useState(false);
  const [dialOffset, setDialOffset] = useState(502.65);
  const [messageIdx, setMessageIdx] = useState(0);
  const [activePillIdx, setActivePillIdx] = useState<number | null>(null);

  // Set initial random wellness fact
  useEffect(() => {
    setCurrentFact(WELLNESS_FACTS[Math.floor(Math.random() * WELLNESS_FACTS.length)]);
  }, [isLoading]);

  // Handle estimated gauge fill transition with initial 300ms delay on results load
  useEffect(() => {
    if (driftStep === 'results') {
      const t = setTimeout(() => {
        setAnimateGauges(true);
      }, 300);
      return () => clearTimeout(t);
    } else {
      setAnimateGauges(false);
    }
  }, [driftStep]);

  // Handle circular loading dial progress stroke transition
  useEffect(() => {
    if (isLoading && userState) {
      const target = 502.65 - (userState.attentionCapacity / 100) * 502.65;
      const t = setTimeout(() => {
        setDialOffset(target);
      }, 50);
      return () => clearTimeout(t);
    } else {
      setDialOffset(502.65);
    }
  }, [isLoading, userState]);

  const LOADING_MESSAGES = [
    "aligning recommendations...",
    "calibrating cognitive levels...",
    "sifting content databases..."
  ];

  // Cycle loading messages below the circular dial at 900ms interval
  useEffect(() => {
    if (isLoading) {
      const interval = setInterval(() => {
        setMessageIdx((prev) => (prev + 1) % LOADING_MESSAGES.length);
      }, 900);
      return () => clearInterval(interval);
    }
  }, [isLoading]);

  const getBucketName = (capacity: number) => {
    if (capacity < 35) return 'brain-fried';
    if (capacity < 70) return 'relaxed';
    return 'hyper-focused';
  };

  const handleSuggestionClick = (suggestionText: string, index: number) => {
    setText(suggestionText);
    setActivePillIdx(index);
    setTimeout(() => {
      setActivePillIdx(null);
    }, 300);
  };

  // Auto-advance from grief support screen after 3s — no choices presented
  useEffect(() => {
    if (driftStep !== 'support') {
      setSupportCountdown(3);
      return;
    }
    if (supportCountdown <= 0) {
      handleGriefAutoLoad();
      return;
    }
    const t = setTimeout(() => setSupportCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [driftStep, supportCountdown]);

  // Focus mode countdown timer
  useEffect(() => {
    let interval: any = null;
    if (isFocusRunning && focusTimeLeft > 0) {
      interval = setInterval(() => {
        setFocusTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (focusTimeLeft === 0) {
      setIsFocusRunning(false);
    }
    return () => clearInterval(interval);
  }, [isFocusRunning, focusTimeLeft]);

  // Breathing exercise cycle logic
  useEffect(() => {
    let interval: any = null;
    if (breathState !== 'idle') {
      interval = setInterval(() => {
        setBreathSeconds((prev) => {
          if (prev <= 1) {
            // Transition state
            if (breathState === 'inhale') {
              setBreathState('hold');
              return 4; // Hold for 4s
            } else if (breathState === 'hold') {
              setBreathState('exhale');
              return 4; // Exhale for 4s
            } else if (breathState === 'exhale') {
              setBreathState('inhale');
              return 4; // Inhale for 4s
            }
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [breathState]);

  // Suggestion pills
  const suggestions = [
    { text: 'exhausted from work', label: 'Exhausted' },
    { text: 'feeling good, ready to relax', label: 'Feeling Good' },
    { text: 'completely bored and restless', label: 'Bored' },
    { text: 'stressed out and overwhelmed', label: 'Stressed' }
  ];

  // Trigger random wellness fact change
  const triggerLoadingWithFact = (loadingState: boolean) => {
    if (loadingState) {
      setCurrentFact(WELLNESS_FACTS[Math.floor(Math.random() * WELLNESS_FACTS.length)]);
    }
    setIsLoading(loadingState);
  };

  // Submit Mood (Assess text)
  const handleMoodSubmit = async () => {
    if (!text.trim()) return;
    triggerLoadingWithFact(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE}/mood`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      });

      if (!response.ok) {
        throw new Error('Failed to classify mood. Please try again.');
      }

      const data = await response.json();
      setMood(data.mood);

      // Check for sensitive or heavy grief keywords
      const HEAVY_KEYWORDS = [
        'died', 'death', 'lost', 'passed away', 'funeral', 'kill', 'suicide', 
        'depressed', 'grief', 'crying', 'broken', 'divorce', 'mourning', 'cancer', 'sick', 'accident'
      ];
      const isHeavy = HEAVY_KEYWORDS.some(word => text.toLowerCase().includes(word)) || data.mood === 'sadness';

      if (isHeavy) {
        setDriftStep('support');
      } else if (!isLoggedIn) {
        setDriftStep('auth-prompt');
      } else {
        setDriftStep('time');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred.');
    } finally {
      setTimeout(() => {
        triggerLoadingWithFact(false);
      }, 1200);
    }
  };

  // Submit State and Recommendations
  const handleEnergySelect = async (selectedEnergy: 'low' | 'mid' | 'high') => {
    setEnergyLevel(selectedEnergy);
    triggerLoadingWithFact(true);
    setError(null);

    try {
      // 1. Get computed user state
      const stateResponse = await fetch(`${API_BASE}/state`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mood,
          timeAvailable,
          energyLevel: selectedEnergy,
          hour: new Date().getHours()
        })
      });

      if (!stateResponse.ok) {
        throw new Error('Failed to compute user state.');
      }

      const stateData: UserState = await stateResponse.json();
      setUserState(stateData);

      // 2. Get recommendations based on state
      const recsResponse = await fetch(`${API_BASE}/recommendations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userState: stateData })
      });

      if (!recsResponse.ok) {
        throw new Error('Failed to retrieve recommendations.');
      }

      const recsData: Recommendations = await recsResponse.json();
      setRecommendations(recsData);
      setDriftStep('results');
    } catch (err: any) {
      setError(err.message || 'An error occurred during recommendations.');
    } finally {
      setTimeout(() => {
        triggerLoadingWithFact(false);
      }, 1500);
    }
  };

  // Grief auto-load: passes time + energy directly to avoid stale React state
  const handleGriefAutoLoad = async () => {
    const selectedTime = 'short';
    const selectedEnergy = 'low';
    setTimeAvailable(selectedTime);
    setEnergyLevel(selectedEnergy);
    triggerLoadingWithFact(true);
    setError(null);
    try {
      const stateResponse = await fetch(`${API_BASE}/state`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mood,
          timeAvailable: selectedTime,
          energyLevel: selectedEnergy,
          hour: new Date().getHours()
        })
      });
      if (!stateResponse.ok) throw new Error('Failed to compute user state.');
      const stateData: UserState = await stateResponse.json();
      setUserState(stateData);

      const recsResponse = await fetch(`${API_BASE}/recommendations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userState: stateData })
      });
      if (!recsResponse.ok) throw new Error('Failed to retrieve recommendations.');
      const recsData: Recommendations = await recsResponse.json();
      setRecommendations(recsData);
      setDriftStep('results');
    } catch (err: any) {
      setError(err.message || 'An error occurred.');
    } finally {
      setTimeout(() => triggerLoadingWithFact(false), 1500);
    }
  };

  const handleReset = () => {
    setDriftStep('mood');
    setText('');
    setMood('neutral');
    setTimeAvailable(null);
    setEnergyLevel(null);
    setUserState(null);
    setRecommendations(null);
    setError(null);
  };

  // Scaffolding Authentication Flow handlers
  const handleAuthSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);

    // Basic Validation
    if (!authEmail.includes('@')) {
      setAuthError('Please enter a valid email address.');
      return;
    }
    if (authPassword.length < 6) {
      setAuthError('Password must be at least 6 characters.');
      return;
    }

    if (authStep === 'signup') {
      if (!authName.trim()) {
        setAuthError('Please enter your name.');
        return;
      }
      if (authPassword !== authConfirmPassword) {
        setAuthError('Passwords do not match.');
        return;
      }
    }

    setAuthLoading(true);

    setTimeout(() => {
      setAuthLoading(false);
      setIsLoggedIn(true);
      setUserName(authName || authEmail.split('@')[0]);
      setUserEmail(authEmail);
      setAuthStep('dashboard');

      // Clear input fields
      setAuthPassword('');
      setAuthConfirmPassword('');

      // If user was in the middle of onboarding, return them back to it
      if (driftStep === 'auth-prompt') {
        setDriftStep('time');
        setActiveTab('drift');
      }
    }, 1000);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUserName('');
    setUserEmail('');
    setAuthStep('login');
  };

  const formatFocusTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleBreathingStart = () => {
    setBreathState('inhale');
    setBreathSeconds(4);
  };

  const handleBreathingStop = () => {
    setBreathState('idle');
    setBreathSeconds(4);
  };

  const renderTagSymbol = (val: '-' | 'neutral' | '+') => {
    if (val === '+') return <span className="symbol-plus">Low</span>;
    if (val === '-') return <span className="symbol-minus">High</span>;
    return <span className="symbol-neutral">Neutral</span>;
  };

  const renderTagBadge = (label: string, val: '-' | 'neutral' | '+') => {
    let icon = '';
    let colorClass = '';
    if (val === '+') {
      icon = '+';
      colorClass = 'tag-positive';
    } else if (val === '-') {
      icon = '−';
      colorClass = 'tag-negative';
    } else {
      icon = '0';
      colorClass = 'tag-neutral';
    }
    return (
      <span className={`tag-badge ${colorClass}`}>
        <span className="tag-icon">{icon}</span> {label}
      </span>
    );
  };

  const renderStepProgress = () => {
    // 3 steps: mood (0), time (1), energy (2)
    let currentIdx = 0;
    if (driftStep === 'time') currentIdx = 1;
    else if (driftStep === 'energy') currentIdx = 2;
    else if (driftStep === 'results') return null; // hide on results

    // Hide progress indicators for support or loading/auth prompts to preserve clean spacing
    if (driftStep === 'support' || driftStep === 'auth-prompt') return null;

    return (
      <div className="step-progress">
        {/* Step 1 */}
        <div className={`step-progress-item ${currentIdx === 0 ? 's-current' : currentIdx > 0 ? 's-completed' : 'upcoming'}`}>
          <span className="step-num">01</span>
          <span className="step-label">mood</span>
        </div>
        
        {/* Connector 1 -> 2 */}
        <div className={`step-progress-connector ${currentIdx > 0 ? 's-completed' : ''}`} />

        {/* Step 2 */}
        <div className={`step-progress-item ${currentIdx === 1 ? 's-current' : currentIdx > 1 ? 's-completed' : 'upcoming'}`}>
          <span className="step-num">02</span>
          <span className="step-label">time</span>
        </div>

        {/* Connector 2 -> 3 */}
        <div className={`step-progress-connector ${currentIdx > 1 ? 's-completed' : ''}`} />

        {/* Step 3 */}
        <div className={`step-progress-item ${currentIdx === 2 ? 's-current' : currentIdx > 2 ? 's-completed' : 'upcoming'}`}>
          <span className="step-num">03</span>
          <span className="step-label">energy</span>
        </div>
      </div>
    );
  };

  // Humanise raw model label into a readable mood name
  const formatMood = (rawMood: string): string => {
    const map: Record<string, string> = {
      sadness: 'Sadness',
      joy: 'Joy',
      fear: 'Stress / Anxiety',
      anger: 'Frustration',
      surprise: 'Surprise',
      disgust: 'Discomfort',
      excitement: 'Excitement',
      neutral: 'Neutral'
    };
    return map[rawMood.toLowerCase()] ?? rawMood.charAt(0).toUpperCase() + rawMood.slice(1);
  };

  return (
    <div className="app-container">
      {/* Cinematic Background Atmosphere */}
      <div className="ambient-glows">
        <div className="glow-shape glow-1"></div>
        <div className="glow-shape glow-2"></div>
        <div className="glow-shape glow-3"></div>
      </div>
      <div className="vignette"></div>
      <div className="grain"></div>

      {/* Global Frosted Navbar */}
      <nav className="site-nav">
        <div className="nav-inner">
          <span className="nav-wordmark">drift</span>
          <div className="nav-links">
            <a href="#how" className="nav-link" onClick={(e) => e.preventDefault()}>How it works</a>
            <a href="#github" className="nav-link" onClick={(e) => e.preventDefault()}>GitHub</a>
          </div>
        </div>
      </nav>

      {/* Page Shell with centered grid columns */}
      <div className="page-shell">
        <div className="content-col">
          {isLoading ? (
            <div className="loading-scene fade-in">
              {userState ? (
                /* Custom Circular Loading Dial */
                <div className="loading-dial-wrapper">
                  <div className="circular-dial">
                    <svg width="180" height="180" viewBox="0 0 180 180">
                      <circle cx="90" cy="90" r="80" className="dial-track" />
                      <circle
                        cx="90"
                        cy="90"
                        r="80"
                        className="dial-fill"
                        strokeDasharray="502.65"
                        strokeDashoffset={dialOffset}
                      />
                    </svg>
                    <div className="dial-center">
                      <span className="dial-bucket-name">{getBucketName(userState.attentionCapacity)}</span>
                    </div>
                  </div>
                  <div className="loading-messages">
                    <p className="loading-message-text">{LOADING_MESSAGES[messageIdx]}</p>
                  </div>
                </div>
              ) : (
                /* Initial Fact Loader for Mood text analysis */
                <div className="loading-content">
                  <div className="breathing-ring"></div>
                  <div className="fun-fact-container">
                    <span className="fun-fact-label">Wellness Insight</span>
                    <p className="fun-fact-text">"{currentFact}"</p>
                  </div>
                  <div className="calm-spinner-subtitle">Aligning recommendations...</div>
                </div>
              )}
            </div>
          ) : (
            <>
              {driftStep !== 'results' ? (
                /* SCREEN 1: Onboarding Viewport */
                <div className="screen-one">
                  <div className={`onboarding-grid ${driftStep === 'support' || driftStep === 'auth-prompt' ? 'grid-centered' : ''}`}>
                    
                    {/* Left Column: Hero Editorial Info */}
                    {driftStep !== 'support' && driftStep !== 'auth-prompt' && (
                      <div className="onboarding-left fade-up">
                        <div className="hero-section">
                          <p className="hero-eyebrow">Cognitive bandwidth tool</p>
                          <h1 className="hero-headline">what can your brain actually handle right now?</h1>
                          <p className="hero-subline">not what you like — what you can actually absorb tonight.</p>
                          <hr className="hero-divider" />
                          <div className="hero-quote">
                            <p className="hero-quote-text">
                              “Attention is the taking possession by the mind, in clear and vivid form, of one out of several possible objects.”
                            </p>
                            <div className="hero-quote-attr">William James, 1890</div>
                          </div>
                          <div className="hero-pills">
                            <span className="hero-pill">Mood-aware</span>
                            <span className="hero-pill">No sign-up needed</span>
                            <span className="hero-pill">Instant results</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Right Column: Input & Wizard Card */}
                    <div className="onboarding-right">
                      {/* Floating weightless orb graphics */}
                      {driftStep !== 'support' && driftStep !== 'auth-prompt' && (
                        <div className="cosmic-orb-graphic">
                          <div className="orb-ring orb-ring-1"></div>
                          <div className="orb-ring orb-ring-2"></div>
                          <div className="orb-core"></div>
                        </div>
                      )}

                      <div className="input-section fade-in">
                        {/* Step Progress Bar (Labeled Steps with Connector Line) */}
                        {renderStepProgress()}

                        <div className="step-content-wrapper">
                          {/* Step 1: Mood */}
                          {driftStep === 'mood' && (
                            <div className="step-slide fade-up">
                              <div className="prompt-box-card">
                                <label className="prompt-label">How are you feeling right now?</label>
                                <textarea
                                  value={text}
                                  onChange={(e) => setText(e.target.value)}
                                  placeholder="how's it going, really"
                                  className="mood-textarea"
                                  maxLength={500}
                                />
                                <div className="prompt-box-footer">
                                  <span className="hint-text">no thinking required</span>
                                  <button
                                    onClick={handleMoodSubmit}
                                    disabled={!text.trim()}
                                    className="send-btn"
                                    aria-label="Send mood input"
                                  >
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                      <line x1="22" y1="2" x2="11" y2="13"></line>
                                      <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                                    </svg>
                                  </button>
                                </div>
                              </div>

                              <div className="suggestions-row">
                                {suggestions.map((s, idx) => (
                                  <button
                                    key={idx}
                                    onClick={() => handleSuggestionClick(s.text, idx)}
                                    className={`suggestion-pill ${activePillIdx === idx ? 'pill-active' : ''}`}
                                    type="button"
                                  >
                                    {s.label}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Grief Support */}
                          {driftStep === 'support' && (
                            <div className="step-slide fade-up grief-space">
                              <h1 className="title-accent-violet" style={{ fontSize: '2rem', marginBottom: '12px' }}>
                                Take a breath.
                              </h1>
                              <p className="grief-message">
                                I hear you. That sounds really hard.<br />
                                I am finding something gentle for you right now.
                              </p>
                              <div className="grief-countdown-bar">
                                <div
                                  className="grief-countdown-fill"
                                  style={{ width: `${((3 - supportCountdown) / 3) * 100}%` }}
                                />
                              </div>
                              <p className="grief-hint">Loading your comfort space{'.'.repeat(3 - supportCountdown + 1)}</p>
                            </div>
                          )}

                          {/* Auth Prompt */}
                          {driftStep === 'auth-prompt' && (
                            <div className="step-slide fade-up text-center auth-prompt-card">
                              <h1 className="title-accent-green">Track Your State</h1>
                              <p className="subtitle">Would you like to log in to save your cognitive snapshots over time?</p>
                              <div className="button-group-vertical">
                                <button
                                  onClick={() => {
                                    setAuthStep('login');
                                    setDriftStep('time');
                                  }}
                                  className="action-button"
                                >
                                  Sign In / Create Account
                                </button>
                                <button
                                  onClick={() => setDriftStep('time')}
                                  className="secondary-button"
                                >
                                  Continue as Guest
                                </button>
                              </div>
                            </div>
                          )}

                          {/* Step 2: Time Available */}
                          {driftStep === 'time' && (
                            <div className="step-slide fade-up">
                              <h2 className="step-question">how much time do you have to spare?</h2>
                              <div className="step-grid">
                                <div
                                  className={`choice-card ${timeAvailable === 'short' ? 'selected' : ''}`}
                                  onClick={() => {
                                    setTimeAvailable('short');
                                    setDriftStep('energy');
                                  }}
                                >
                                  <div className="choice-title">A few minutes</div>
                                  <div className="choice-desc">Under 30 mins</div>
                                </div>

                                <div
                                  className={`choice-card ${timeAvailable === 'medium' ? 'selected' : ''}`}
                                  onClick={() => {
                                    setTimeAvailable('medium');
                                    setDriftStep('energy');
                                  }}
                                >
                                  <div className="choice-title">An episode or two</div>
                                  <div className="choice-desc">30 to 90 mins</div>
                                </div>

                                <div
                                  className={`choice-card ${timeAvailable === 'long' ? 'selected' : ''}`}
                                  onClick={() => {
                                    setTimeAvailable('long');
                                    setDriftStep('energy');
                                  }}
                                >
                                  <div className="choice-title">The whole evening</div>
                                  <div className="choice-desc">Several hours</div>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Step 3: Energy Level */}
                          {driftStep === 'energy' && (
                            <div className="step-slide fade-up">
                              <h2 className="step-question">what is your cognitive energy like?</h2>
                              <div className="step-grid">
                                <div
                                  className={`choice-card ${energyLevel === 'low' ? 'selected' : ''}`}
                                  onClick={() => handleEnergySelect('low')}
                                >
                                  <div className="choice-title">Basically none</div>
                                  <div className="choice-desc">Exhausted, resting</div>
                                </div>

                                <div
                                  className={`choice-card ${energyLevel === 'mid' ? 'selected' : ''}`}
                                  onClick={() => handleEnergySelect('mid')}
                                >
                                  <div className="choice-title">Some</div>
                                  <div className="choice-desc">Typical attention</div>
                                </div>

                                <div
                                  className={`choice-card ${energyLevel === 'high' ? 'selected' : ''}`}
                                  onClick={() => handleEnergySelect('high')}
                                >
                                  <div className="choice-title">Plenty</div>
                                  <div className="choice-desc">Focused, energetic</div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                  </div>
                </div>
              ) : (
                /* SCREEN 2: Results Display */
                userState && recommendations && (
                  <div className="screen-two fade-in">
                    
                    {/* 1. Horizontal State Band */}
                    <div className="state-band fade-up">
                      <div className="state-band-left">
                        <p className="state-eyebrow">Your cognitive snapshot</p>
                        <div className="state-bucket-name">{getBucketName(userState.attentionCapacity)}</div>
                        <div className="state-descriptor">estimated from your mood, energy, and time — not a real biometric reading.</div>
                      </div>
                      
                      <div className="state-band-right">
                        <div className="state-gauge-item">
                          <span className="gauge-label">Stress</span>
                          <div className="gauge-track">
                            <div
                              className="gauge-fill-bar bar-stress"
                              style={{ width: animateGauges ? `${userState.stressLevel}%` : '0%' }}
                            />
                          </div>
                          <div className="gauge-value">{userState.stressLevel}%</div>
                        </div>

                        <div className="state-gauge-item">
                          <span className="gauge-label">Calm</span>
                          <div className="gauge-track">
                            <div
                              className="gauge-fill-bar bar-calm"
                              style={{ width: animateGauges ? `${userState.calmLevel}%` : '0%' }}
                            />
                          </div>
                          <div className="gauge-value">{userState.calmLevel}%</div>
                        </div>

                        <div className="state-gauge-item">
                          <span className="gauge-label">Attention</span>
                          <div className="gauge-track">
                            <div
                              className="gauge-fill-bar bar-attention"
                              style={{ width: animateGauges ? `${userState.attentionCapacity}%` : '0%' }}
                            />
                          </div>
                          <div className="gauge-value">{userState.attentionCapacity}%</div>
                        </div>
                      </div>
                    </div>

                    {/* 2. Headline & Subline */}
                    <div className="results-section-head fade-up">
                      <h1 className="results-headline">here's what fits tonight</h1>
                      <p className="results-subline">one pick per category, matched to where you're at</p>
                    </div>

                    {/* 3. Three recommendation cards in Bento Grid */}
                    <div className="bento-grid">
                      
                      {/* TV Show - HERO PICK */}
                      <div className="bento-hero card-stagger-1">
                        <div className="recommendation-card">
                          <div className="category-label">TV Show</div>
                          <h2 className="item-title">{recommendations.tv_show.title}</h2>
                          <p className="item-description">{recommendations.tv_show.extraInfo}</p>
                          <div className="item-tags-row">
                            {renderTagBadge('Stress', recommendations.tv_show.stress)}
                            {renderTagBadge('Calm', recommendations.tv_show.calm)}
                            {renderTagBadge('Attention', recommendations.tv_show.attention)}
                          </div>
                        </div>
                      </div>

                      {/* Movie - SECONDARY */}
                      <div className="bento-secondary card-stagger-2">
                        <div className="recommendation-card">
                          <div className="category-label">Movie</div>
                          <h2 className="item-title">{recommendations.movie.title}</h2>
                          <p className="item-description">{recommendations.movie.extraInfo}</p>
                          <div className="item-tags-row">
                            {renderTagBadge('Stress', recommendations.movie.stress)}
                            {renderTagBadge('Calm', recommendations.movie.calm)}
                            {renderTagBadge('Attention', recommendations.movie.attention)}
                          </div>
                        </div>
                      </div>

                      {/* Music - SECONDARY */}
                      <div className="bento-secondary card-stagger-3">
                        <div className="recommendation-card">
                          <div className="category-label">Music</div>
                          <h2 className="item-title">{recommendations.music.title}</h2>
                          <p className="item-description">{recommendations.music.extraInfo}</p>
                          <div className="item-tags-row">
                            {renderTagBadge('Stress', recommendations.music.stress)}
                            {renderTagBadge('Calm', recommendations.music.calm)}
                            {renderTagBadge('Attention', recommendations.music.attention)}
                          </div>
                        </div>
                      </div>

                    </div>

                    {/* 4. Ask again button */}
                    <div className="ask-again-wrapper fade-up">
                      <button onClick={handleReset} className="ask-again-btn">
                        Ask again
                      </button>
                    </div>

                  </div>
                )
              )}
            </>
          )}
        </div>

        {/* Global Footer (Screen 1 only) */}
        {driftStep !== 'results' && !isLoading && (
          <footer className="site-footer">
            <div className="footer-inner">
              <span className="footer-text">Antigravity Agent · 2026</span>
              <span className="footer-text">built with Node.js + Express</span>
            </div>
          </footer>
        )}
      </div>
    </div>
  );
}

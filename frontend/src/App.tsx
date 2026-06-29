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

  // Set initial random wellness fact
  useEffect(() => {
    setCurrentFact(WELLNESS_FACTS[Math.floor(Math.random() * WELLNESS_FACTS.length)]);
  }, [isLoading]);

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
    <div className={`app-container ${isFocusMode ? 'focus-mode-active' : ''}`}>
      {/* Cinematic Background Ambient Elements */}
      <div className="ambient-glows">
        <div className="glow-shape glow-1"></div>
        <div className="glow-shape glow-2"></div>
        <div className="glow-shape glow-3"></div>
      </div>
      <div className="vignette"></div>
      <div className="grain"></div>

      {/* Main Container */}
      <div className="workspace-container">
        
        {/* Navigation Bar (Human-Crafted, On Top, Emojiless) */}
        {!isFocusMode && (
          <nav className="wellness-nav">
            <div className="nav-brand" onClick={() => setActiveTab('drift')}>DRIFT</div>
            <div className="nav-destinations">
              <button 
                className={`nav-item ${activeTab === 'drift' ? 'active' : ''}`}
                onClick={() => setActiveTab('drift')}
                aria-label="Drift Recommendation System"
              >
                <span className="nav-text">Drift</span>
              </button>
              <button 
                className={`nav-item ${activeTab === 'focus' ? 'active' : ''}`}
                onClick={() => setActiveTab('focus')}
                aria-label="Focus and Breathing Space"
              >
                <span className="nav-text">Focus</span>
              </button>
              <button 
                className={`nav-item ${activeTab === 'habits' ? 'active' : ''}`}
                onClick={() => setActiveTab('habits')}
                aria-label="Digital Habits and Screen Time"
              >
                <span className="nav-text">Habits</span>
              </button>
              <button 
                className={`nav-item ${activeTab === 'about' ? 'active' : ''}`}
                onClick={() => setActiveTab('about')}
                aria-label="Digital Wellness Insights"
              >
                <span className="nav-text">Insights</span>
              </button>
              <button 
                className={`nav-item ${activeTab === 'profile' ? 'active' : ''}`}
                onClick={() => setActiveTab('profile')}
                aria-label="User Profile and Account"
              >
                <span className="nav-text">{isLoggedIn ? 'Profile' : 'Log In'}</span>
              </button>
            </div>
          </nav>
        )}

        {/* Global Loading Scene with Fun Facts */}
        {isLoading && (
          <div className="loading-scene fade-in">
            <div className="loading-content">
              <div className="breathing-ring"></div>
              <div className="fun-fact-container">
                <span className="fun-fact-label">Wellness Insight</span>
                <p className="fun-fact-text">"{currentFact}"</p>
              </div>
              <div className="calm-spinner-subtitle">Aligning recommendations to your cognitive capacity...</div>
            </div>
          </div>
        )}

        {/* Main Panel */}
        {!isLoading && (
          <div className="glass-panel fade-in">
            
            {/* ================= TAB 1: DRIFT RECOMMENDATION FLOW ================= */}
            {activeTab === 'drift' && (
              <div>
                {/* STEP 1: Mood Capture */}
                {driftStep === 'mood' && (
                  <div className="slide-content">
                    <h1 className="title-accent-green">Drift</h1>
                    <p className="subtitle">Assess your cognitive state before consuming content.</p>
                    
                    <p className="quote-text">
                      "We get choice-paralyzed deciding what to watch or listen to, ignoring that what we can mentally handle changes hour to hour."
                    </p>

                    <div className="textarea-wrapper">
                      <textarea
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        placeholder="how is your mind feeling, really..."
                        className="mood-textarea"
                        disabled={isLoading}
                        maxLength={500}
                      />
                      <div className="word-counter">{text.length}/500</div>
                    </div>

                    <div className="pills-container">
                      {suggestions.map((s, idx) => (
                        <button
                          key={idx}
                          onClick={() => setText(s.text)}
                          className="suggestion-pill"
                          type="button"
                          disabled={isLoading}
                        >
                          {s.label}
                        </button>
                      ))}
                    </div>

                    {error && <p className="error-message">{error}</p>}

                    <button
                      onClick={handleMoodSubmit}
                      disabled={!text.trim() || isLoading}
                      className="action-button"
                    >
                      Continue
                    </button>
                  </div>
                )}

                {/* STEP 1.7: Support Grief Prompt */}
                {driftStep === 'support' && (
                  <div className="slide-content text-center">
                    <h1 className="title-accent-violet">A Gentle Space</h1>
                    <div className="mood-detected-pill" style={{ marginBottom: '16px' }}>
                      Detected: <strong>{formatMood(mood)}</strong>
                    </div>
                    <p className="subtitle" style={{ maxWidth: '500px', margin: '0 auto 24px auto', lineHeight: '1.6' }}>
                      I am so sorry you are experiencing this. Grief and heavy moments take a significant toll on our minds.
                      Please remember to be kind to yourself right now.
                    </p>

                    <div className="button-group-vertical" style={{ gap: '12px' }}>
                      <button
                        onClick={() => {
                          setTimeAvailable('short');
                          handleEnergySelect('low');
                        }}
                        className="action-button"
                      >
                        View Gentle Comfort Suggestions
                      </button>

                      <button
                        onClick={() => {
                          setActiveTab('focus');
                          handleBreathingStart();
                        }}
                        className="secondary-button"
                      >
                        Take a Slow Breathing Break
                      </button>

                      <button
                        onClick={() => {
                          setActiveTab('focus');
                          setIsFocusMode(true);
                          setIsFocusRunning(true);
                        }}
                        className="secondary-button"
                      >
                        Mute Clutter (Silent Focus Space)
                      </button>

                      <button
                        onClick={() => setDriftStep('time')}
                        className="secondary-button"
                        style={{ borderColor: 'transparent', color: 'var(--text-muted)', fontSize: '0.82rem', textDecoration: 'underline' }}
                      >
                        Continue Standard Assessment
                      </button>
                    </div>
                  </div>
                )}

                {/* STEP 1.5: Onboarding Auth Prompt */}
                {driftStep === 'auth-prompt' && (
                  <div className="slide-content text-center">
                    <h1 className="title-accent-green">Track Your State</h1>
                    <p className="subtitle">Would you like to log in to save your cognitive snapshots over time?</p>
                    
                    <div className="auth-prompt-visual">
                      <div className="metric-preview">Weekly Wellness Reports</div>
                      <div className="metric-preview">Custom Attention Thresholds</div>
                    </div>

                    <div className="button-group-vertical">
                      <button
                        onClick={() => {
                          setAuthStep('login');
                          setActiveTab('profile');
                        }}
                        className="action-button"
                      >
                        Sign In / Create Account
                      </button>
                      <button
                        onClick={() => setDriftStep('time')}
                        className="secondary-button"
                        style={{ marginTop: '12px' }}
                      >
                        Continue as Guest
                      </button>
                    </div>
                  </div>
                )}

                {/* STEP 2: Time Available selection */}
                {driftStep === 'time' && (
                  <div className="slide-content">
                    <h1 className="title-accent-violet">Available Time</h1>
                    <p className="subtitle">How much time do you have to spare?</p>

                    <div className="step-container">
                      <div className="step-options">
                        <div 
                          className={`option-card ${timeAvailable === 'short' ? 'selected' : ''}`}
                          onClick={() => {
                            setTimeAvailable('short');
                            setDriftStep('energy');
                          }}
                        >
                          <div className="option-title">Short</div>
                          <div className="option-desc">Under 30 mins</div>
                        </div>

                        <div 
                          className={`option-card ${timeAvailable === 'medium' ? 'selected' : ''}`}
                          onClick={() => {
                            setTimeAvailable('medium');
                            setDriftStep('energy');
                          }}
                        >
                          <div className="option-title">Medium</div>
                          <div className="option-desc">30 to 90 mins</div>
                        </div>

                        <div 
                          className={`option-card ${timeAvailable === 'long' ? 'selected' : ''}`}
                          onClick={() => {
                            setTimeAvailable('long');
                            setDriftStep('energy');
                          }}
                        >
                          <div className="option-title">Long</div>
                          <div className="option-desc">Several hours</div>
                        </div>
                      </div>

                      <button 
                        onClick={() => setDriftStep('mood')} 
                        className="secondary-button"
                      >
                        Back
                      </button>
                    </div>
                  </div>
                )}

                {/* STEP 3: Energy Level Selection & loading */}
                {driftStep === 'energy' && (
                  <div className="slide-content">
                    <h1 className="title-accent-violet">Energy Level</h1>
                    <p className="subtitle">Select your current cognitive energy.</p>

                    <div className="step-container">
                      <div className="step-options">
                        <div 
                          className={`option-card ${energyLevel === 'low' ? 'selected' : ''}`}
                          onClick={() => handleEnergySelect('low')}
                        >
                          <div className="option-title">Low</div>
                          <div className="option-desc">Exhausted, resting</div>
                        </div>

                        <div 
                          className={`option-card ${energyLevel === 'mid' ? 'selected' : ''}`}
                          onClick={() => handleEnergySelect('mid')}
                        >
                          <div className="option-title">Balanced</div>
                          <div className="option-desc">Typical attention</div>
                        </div>

                        <div 
                          className={`option-card ${energyLevel === 'high' ? 'selected' : ''}`}
                          onClick={() => handleEnergySelect('high')}
                        >
                          <div className="option-title">High</div>
                          <div className="option-desc">Focused, energetic</div>
                        </div>
                      </div>

                      {error && <p className="error-message">{error}</p>}

                      <button 
                        onClick={() => setDriftStep('time')} 
                        className="secondary-button"
                        disabled={isLoading}
                      >
                        Back
                      </button>
                    </div>
                  </div>
                )}

                {/* STEP 4: Results Display */}
                {driftStep === 'results' && userState && recommendations && (
                  <div className="slide-content">
                    <div className="results-header">
                      <h1 className="title-accent-green" style={{ fontSize: '2.25rem', marginBottom: '8px' }}>
                        {mood === 'joy' || mood === 'excitement' ? 'Ready to engage?' : 'Comfort picked for you'}
                      </h1>
                      <div className="mood-detected-pill">
                        Detected mood: <strong>{formatMood(mood)}</strong>
                      </div>
                    </div>
                    
                    {/* Inferred User State Indicator Panel */}
                    <div className="state-panel">
                      <div className="gauge-item state-stress">
                        <span className="gauge-header">Estimated Stress</span>
                        <span className="gauge-number">{userState.stressLevel}%</span>
                        <div className="gauge-bar-bg">
                          <div className="gauge-bar-fill" style={{ width: `${userState.stressLevel}%` }}></div>
                        </div>
                        <span className="gauge-label">Inferred mental load</span>
                      </div>

                      <div className="gauge-item state-calm">
                        <span className="gauge-header">Estimated Calm</span>
                        <span className="gauge-number">{userState.calmLevel}%</span>
                        <div className="gauge-bar-bg">
                          <div className="gauge-bar-fill" style={{ width: `${userState.calmLevel}%` }}></div>
                        </div>
                        <span className="gauge-label">Relaxation potential</span>
                      </div>

                      <div className="gauge-item state-attention">
                        <span className="gauge-header">Attention Span</span>
                        <span className="gauge-number">{userState.attentionCapacity}%</span>
                        <div className="gauge-bar-bg">
                          <div className="gauge-bar-fill" style={{ width: `${userState.attentionCapacity}%` }}></div>
                        </div>
                        <span className="gauge-label">Cognitive focus level</span>
                      </div>
                    </div>

                    <p className="disclaimer-text">
                      *Stress, calm, and attention metrics are simulated estimates inferred entirely from your text input, energy level, and time. No biometric sensors were used.
                    </p>

                    {/* Recommendation cards stack */}
                    <h2 className="recommendations-title">Suggestions matching your capacity:</h2>
                    <div className="cards-stack">
                      
                      {/* Option 1: TV Show */}
                      <div className="recommendation-card category-tv_show">
                        <div className="card-top">
                          <span className="card-category-badge">TV Show</span>
                          <div className="card-tags">
                            <span className="tag-badge" title="Stress Impact">Stress: {renderTagSymbol(recommendations.tv_show.stress)}</span>
                            <span className="tag-badge" title="Calm Level">Calm: {renderTagSymbol(recommendations.tv_show.calm)}</span>
                            <span className="tag-badge" title="Attention Required">Attention: {renderTagSymbol(recommendations.tv_show.attention)}</span>
                          </div>
                        </div>
                        <h3 className="card-title">{recommendations.tv_show.title}</h3>
                        <p className="card-description">{recommendations.tv_show.extraInfo}</p>
                      </div>

                      {/* Option 2: Movie */}
                      <div className="recommendation-card category-movie">
                        <div className="card-top">
                          <span className="card-category-badge">Movie</span>
                          <div className="card-tags">
                            <span className="tag-badge" title="Stress Impact">Stress: {renderTagSymbol(recommendations.movie.stress)}</span>
                            <span className="tag-badge" title="Calm Level">Calm: {renderTagSymbol(recommendations.movie.calm)}</span>
                            <span className="tag-badge" title="Attention Required">Attention: {renderTagSymbol(recommendations.movie.attention)}</span>
                          </div>
                        </div>
                        <h3 className="card-title">{recommendations.movie.title}</h3>
                        <p className="card-description">{recommendations.movie.extraInfo}</p>
                      </div>

                      {/* Option 3: Song / Album */}
                      <div className="recommendation-card category-music">
                        <div className="card-top">
                          <span className="card-category-badge">Music</span>
                          <div className="card-tags">
                            <span className="tag-badge" title="Stress Impact">Stress: {renderTagSymbol(recommendations.music.stress)}</span>
                            <span className="tag-badge" title="Calm Level">Calm: {renderTagSymbol(recommendations.music.calm)}</span>
                            <span className="tag-badge" title="Attention Required">Attention: {renderTagSymbol(recommendations.music.attention)}</span>
                          </div>
                        </div>
                        <h3 className="card-title">{recommendations.music.title}</h3>
                        <p className="card-description">{recommendations.music.extraInfo}</p>
                      </div>

                    </div>

                    <button 
                      onClick={handleReset} 
                      className="action-button"
                    >
                      Reset & Try Again
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* ================= TAB 2: FOCUS SPACE (Wellness Widgets) ================= */}
            {activeTab === 'focus' && (
              <div className="slide-content">
                <h1 className="title-accent-green">Focus Space</h1>
                <p className="subtitle">Mindfully disconnect or adjust your environment.</p>

                {/* Mindful Usage Prompt */}
                <div className="wellness-widget info-widget">
                  <span className="widget-badge">Mindful Prompt</span>
                  <p className="prompt-question">"Is your current screen usage serving your mental well-being, or are you filling empty seconds?"</p>
                  <p className="prompt-suggestion">Consider putting down your device for 5 minutes if you feel restless.</p>
                </div>

                <div className="widgets-grid">
                  
                  {/* Focus Mode Widget */}
                  <div className="wellness-widget">
                    <h3>Focus Mode</h3>
                    <p className="widget-desc">Mutes the digital clutter. Sets a minimalist workspace with zero distractions.</p>
                    
                    <div className="focus-toggle-container">
                      <span className="focus-state-label">{isFocusMode ? 'Distractions Hidden' : 'Distractions Visible'}</span>
                      <label className="tactile-switch">
                        <input 
                          type="checkbox" 
                          checked={isFocusMode}
                          onChange={(e) => {
                            setIsFocusMode(e.target.checked);
                            if (e.target.checked) {
                              setIsFocusRunning(true);
                            } else {
                              setIsFocusRunning(false);
                            }
                          }}
                        />
                        <span className="switch-slider"></span>
                      </label>
                    </div>

                    {isFocusMode && (
                      <div className="focus-timer-section fade-in">
                        <div className="timer-display">{formatFocusTime(focusTimeLeft)}</div>
                        <div className="timer-controls">
                          <button 
                            onClick={() => setIsFocusRunning(!isFocusRunning)}
                            className="timer-btn"
                          >
                            {isFocusRunning ? 'Pause' : 'Start'}
                          </button>
                          <button 
                            onClick={() => {
                              setIsFocusRunning(false);
                              setFocusTimeLeft(1500);
                            }}
                            className="timer-btn secondary"
                          >
                            Reset
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Breathing Exercise Widget */}
                  <div className="wellness-widget">
                    <h3>Breath Guide</h3>
                    <p className="widget-desc">A simple 4-4-4 box breathing technique to lower cortisol levels instantly.</p>
                    
                    {breathState === 'idle' ? (
                      <button onClick={handleBreathingStart} className="action-button-mini">
                        Start Breathing
                      </button>
                    ) : (
                      <div className="breathing-exercise-container fade-in">
                        <div className={`breathing-circle-visual ${breathState}`}>
                          <span className="breath-instruction">{breathState.toUpperCase()}</span>
                          <span className="breath-seconds">{breathSeconds}s</span>
                        </div>
                        <button onClick={handleBreathingStop} className="secondary-button" style={{ marginTop: '16px' }}>
                          Stop Guide
                        </button>
                      </div>
                    )}
                  </div>

                </div>

                {isFocusMode && (
                  <div className="focus-mode-overlay fade-in">
                    <div className="focus-overlay-content">
                      <span className="focus-overlay-label">Meditative Focus</span>
                      <div className="timer-display-large">{formatFocusTime(focusTimeLeft)}</div>
                      <p className="focus-fact-prompt">"{currentFact}"</p>
                      
                      <button 
                        onClick={() => {
                          setIsFocusMode(false);
                          setIsFocusRunning(false);
                        }}
                        className="action-button focus-exit-btn"
                      >
                        Exit Focus Mode
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ================= TAB 3: DIGITAL HABITS & STATS ================= */}
            {activeTab === 'habits' && (
              <div className="slide-content">
                <h1 className="title-accent-violet">Digital Habits</h1>
                <p className="subtitle">Real screen-time awareness. Data to help you log off.</p>

                {/* Digital Usage Chart */}
                <div className="wellness-widget">
                  <h3>Weekly Drift Activity</h3>
                  <p className="widget-desc">Time spent assessing mood vs total estimated smartphone activity (mocked data).</p>
                  
                  <div className="chart-container">
                    <svg viewBox="0 0 400 180" className="usage-svg">
                      {/* Grid Lines */}
                      <line x1="40" y1="20" x2="380" y2="20" stroke="rgba(255,255,255,0.03)" />
                      <line x1="40" y1="70" x2="380" y2="70" stroke="rgba(255,255,255,0.03)" />
                      <line x1="40" y1="120" x2="380" y2="120" stroke="rgba(255,255,255,0.03)" />
                      <line x1="40" y1="150" x2="380" y2="150" stroke="rgba(255,255,255,0.1)" />

                      {/* Bar 1 (Mon) */}
                      <rect x="55" y="60" width="18" height="90" rx="4" fill="rgba(139, 92, 246, 0.2)" />
                      <rect x="55" y="120" width="18" height="30" rx="4" fill="var(--neon-green)" />
                      
                      {/* Bar 2 (Tue) */}
                      <rect x="105" y="40" width="18" height="110" rx="4" fill="rgba(139, 92, 246, 0.2)" />
                      <rect x="105" y="110" width="18" height="40" rx="4" fill="var(--neon-green)" />

                      {/* Bar 3 (Wed) */}
                      <rect x="155" y="80" width="18" height="70" rx="4" fill="rgba(139, 92, 246, 0.2)" />
                      <rect x="155" y="135" width="18" height="15" rx="4" fill="var(--neon-green)" />

                      {/* Bar 4 (Thu) */}
                      <rect x="205" y="30" width="18" height="120" rx="4" fill="rgba(139, 92, 246, 0.2)" />
                      <rect x="205" y="100" width="18" height="50" rx="4" fill="var(--neon-green)" />

                      {/* Bar 5 (Fri) */}
                      <rect x="255" y="70" width="18" height="80" rx="4" fill="rgba(139, 92, 246, 0.2)" />
                      <rect x="255" y="130" width="18" height="20" rx="4" fill="var(--neon-green)" />

                      {/* Bar 6 (Sat) */}
                      <rect x="305" y="90" width="18" height="60" rx="4" fill="rgba(139, 92, 246, 0.2)" />
                      <rect x="305" y="140" width="18" height="10" rx="4" fill="var(--neon-green)" />

                      {/* Bar 7 (Sun) */}
                      <rect x="355" y="110" width="18" height="40" rx="4" fill="rgba(139, 92, 246, 0.2)" />
                      <rect x="355" y="145" width="18" height="5" rx="4" fill="var(--neon-green)" />

                      {/* Labels */}
                      <text x="64" y="168" className="chart-lbl">M</text>
                      <text x="114" y="168" className="chart-lbl">T</text>
                      <text x="164" y="168" className="chart-lbl">W</text>
                      <text x="214" y="168" className="chart-lbl">T</text>
                      <text x="264" y="168" className="chart-lbl">F</text>
                      <text x="314" y="168" className="chart-lbl">S</text>
                      <text x="364" y="168" className="chart-lbl">S</text>
                    </svg>
                  </div>
                  
                  <div className="chart-legend">
                    <span className="legend-item"><span className="legend-dot green"></span>Drift Alignment Time</span>
                    <span className="legend-item"><span className="legend-dot violet"></span>Estimated Screen Time</span>
                  </div>
                </div>

                {/* Habit Summaries & Progressive Disclosure */}
                <div className="wellness-widget">
                  <h3>Weekly Wellness Diagnostics</h3>
                  <p className="widget-desc">Insights compiled from your emotional alignment history.</p>
                  
                  <div className="diagnostics-stack">
                    <details className="diagnostic-detail">
                      <summary>Peak Stress Periods</summary>
                      <p className="diagnostic-expanded-text">
                        Your highest estimated stress markers occurred on **Tuesdays around 8:00 PM**, matching low energy states. We recommend scheduling a 4-minute box breathing block at 7:45 PM.
                      </p>
                    </details>

                    <details className="diagnostic-detail">
                      <summary>Attention Capacity Trends</summary>
                      <p className="diagnostic-expanded-text">
                        Attention capacity shows a **42% decrease** during evening sessions. Content recommendations are automatically scaled down to light, low-attention comedies during these periods to prevent cognitive load.
                      </p>
                    </details>

                    <details className="diagnostic-detail">
                      <summary>Positive Feedback Loops</summary>
                      <p className="diagnostic-expanded-text">
                        After taking focus breathing steps, your estimated calm rating increased on average by **24%** based on subsequent mood assessments.
                      </p>
                    </details>
                  </div>
                </div>

              </div>
            )}

            {/* ================= TAB 4: DIGITAL WELLNESS INSIGHTS ================= */}
            {activeTab === 'about' && (
              <div className="slide-content">
                <h1 className="title-accent-green">Wellness Insights</h1>
                <p className="subtitle">Scientific concepts behind cognitive drift and attention.</p>
                
                <div className="wellness-article">
                  <h2>Hick's Law & Choice Fatigue</h2>
                  <p>
                    Hick's Law describes the time it takes for a human to make a decision as a result of the possible choices presented. Modern streaming services violate this by displaying infinite rows of recommendations, draining your cognitive resources before you even press play. Drift addresses this by limiting choices to a maximum of 3 direct options matching your current state.
                  </p>
                </div>

                <div className="wellness-article">
                  <h2>The Doherty Threshold</h2>
                  <p>
                    A 1982 IBM research paper concluded that computer interaction feels fluid and engaging when the computer's response time is under 400 milliseconds. When it takes longer, humans lose focus. We optimized our core heuristics and models to satisfy this threshold, ensuring your mood assessment is instant and friction-free.
                  </p>
                </div>

                <div className="wellness-article">
                  <h2>The Zeigarnik Effect</h2>
                  <p>
                    Psychologist Bluma Zeigarnik noticed that servers in restaurants remembered complex orders only while they were unpaid. Once paid, they forgot them. Uncompleted tasks create mental tabs that stay open in your subconscious. Focus Mode shuts down this background clutter so your brain can process the present moment.
                  </p>
                </div>

                <div className="wellness-article">
                  <h2>The Peak-End Rule</h2>
                  <p>
                    Psychologist Daniel Kahneman found that people judge an experience almost entirely by how it felt at its peak and at its end — not by the average of every moment. This is why Drift places the most weight on the first and last interaction in every session: the mood input, and the recommendation reveal. A well-timed, satisfying result at the end of the flow leaves a stronger positive memory than a technically smooth middle.
                  </p>
                </div>

                <div className="wellness-article">
                  <h2>Attentional Restoration Theory</h2>
                  <p>
                    Rachel and Stephen Kaplan proposed that the human mind has two modes of attention: directed (effortful, used for work) and involuntary (effortless, triggered by natural scenes and gentle stimuli). Directed attention fatigues over time and needs deliberate restoration. The Focus Space breathing guide and nature-documentary recommendations in Drift are specifically designed to activate involuntary attention, giving your directed attention the recovery time it needs.
                  </p>
                </div>
              </div>
            )}

            {/* ================= TAB 5: AUTHENTICATION FLOW & PROFILE ================= */}
            {activeTab === 'profile' && (
              <div className="slide-content">
                {!isLoggedIn ? (
                  <div>
                    {/* LOGIN SUB-STEP */}
                    {authStep === 'login' && (
                      <form onSubmit={handleAuthSubmit} className="auth-form fade-in">
                        <h1 className="title-accent-green">Welcome Back</h1>
                        <p className="subtitle">Sign in to save your cognitive profiles and wellness graphs.</p>

                        <div className="input-group">
                          <label htmlFor="login-email">Email Address</label>
                          <input 
                            id="login-email"
                            type="email" 
                            value={authEmail}
                            onChange={(e) => setAuthEmail(e.target.value)}
                            placeholder="you@example.com"
                            required
                            disabled={authLoading}
                          />
                        </div>

                        <div className="input-group">
                          <div className="input-header">
                            <label htmlFor="login-password">Password</label>
                            <span 
                              className="forgot-password-link"
                              onClick={() => setAuthStep('forgot')}
                            >
                              Forgot Password?
                            </span>
                          </div>
                          <div className="password-wrapper">
                            <input 
                              id="login-password"
                              type={showPassword ? "text" : "password"} 
                              value={authPassword}
                              onChange={(e) => setAuthPassword(e.target.value)}
                              placeholder="••••••••"
                              required
                              disabled={authLoading}
                            />
                            <button 
                              type="button" 
                              className="password-toggle"
                              onClick={() => setShowPassword(!showPassword)}
                              aria-label={showPassword ? "Hide password" : "Show password"}
                            >
                              {showPassword ? (
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                                  <line x1="1" y1="1" x2="23" y2="23" />
                                </svg>
                              ) : (
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                  <circle cx="12" cy="12" r="3" />
                                </svg>
                              )}
                            </button>
                          </div>
                        </div>

                        {authError && <p className="auth-error-msg">{authError}</p>}

                        <button 
                          type="submit" 
                          className="action-button"
                          disabled={authLoading}
                        >
                          {authLoading ? <div className="spinner"></div> : 'Sign In'}
                        </button>

                        <p className="auth-switch-text">
                          Don't have an account?{' '}
                          <span onClick={() => { setAuthStep('signup'); setAuthError(null); }}>
                            Create account
                          </span>
                        </p>
                      </form>
                    )}

                    {/* SIGNUP SUB-STEP */}
                    {authStep === 'signup' && (
                      <form onSubmit={handleAuthSubmit} className="auth-form fade-in">
                        <h1 className="title-accent-violet">Join Drift</h1>
                        <p className="subtitle">Track your screen habits and optimize your attention index.</p>

                        <div className="input-group">
                          <label htmlFor="signup-name">Full Name</label>
                          <input 
                            id="signup-name"
                            type="text" 
                            value={authName}
                            onChange={(e) => setAuthName(e.target.value)}
                            placeholder="Alex Mercer"
                            required
                            disabled={authLoading}
                          />
                        </div>

                        <div className="input-group">
                          <label htmlFor="signup-email">Email Address</label>
                          <input 
                            id="signup-email"
                            type="email" 
                            value={authEmail}
                            onChange={(e) => setAuthEmail(e.target.value)}
                            placeholder="you@example.com"
                            required
                            disabled={authLoading}
                          />
                        </div>

                        <div className="input-group">
                          <label htmlFor="signup-password">Password</label>
                          <div className="password-wrapper">
                            <input 
                              id="signup-password"
                              type={showPassword ? "text" : "password"} 
                              value={authPassword}
                              onChange={(e) => setAuthPassword(e.target.value)}
                              placeholder="•••••••• (Min 6 chars)"
                              required
                              disabled={authLoading}
                            />
                            <button 
                              type="button" 
                              className="password-toggle"
                              onClick={() => setShowPassword(!showPassword)}
                              aria-label={showPassword ? "Hide password" : "Show password"}
                            >
                              {showPassword ? (
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                                  <line x1="1" y1="1" x2="23" y2="23" />
                                </svg>
                              ) : (
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                  <circle cx="12" cy="12" r="3" />
                                </svg>
                              )}
                            </button>
                          </div>
                        </div>

                        <div className="input-group">
                          <label htmlFor="signup-confirm">Confirm Password</label>
                          <input 
                            id="signup-confirm"
                            type="password" 
                            value={authConfirmPassword}
                            onChange={(e) => setAuthConfirmPassword(e.target.value)}
                            placeholder="••••••••"
                            required
                            disabled={authLoading}
                          />
                        </div>

                        {authError && <p className="auth-error-msg">{authError}</p>}

                        <button 
                          type="submit" 
                          className="action-button"
                          disabled={authLoading}
                        >
                          {authLoading ? <div className="spinner"></div> : 'Create Account'}
                        </button>

                        <p className="auth-switch-text">
                          Already have an account?{' '}
                          <span onClick={() => { setAuthStep('login'); setAuthError(null); }}>
                            Sign in
                          </span>
                        </p>
                      </form>
                    )}

                    {/* FORGOT PASSWORD SUB-STEP */}
                    {authStep === 'forgot' && (
                      <div className="auth-form fade-in">
                        <h1 className="title-accent-green">Reset Password</h1>
                        <p className="subtitle">Enter your email and we'll send a recovery link.</p>

                        <div className="input-group">
                          <label htmlFor="reset-email">Email Address</label>
                          <input 
                            id="reset-email"
                            type="email" 
                            value={authEmail}
                            onChange={(e) => setAuthEmail(e.target.value)}
                            placeholder="you@example.com"
                            required
                          />
                        </div>

                        {authError && <p className="auth-error-msg">{authError}</p>}

                        <button 
                          onClick={() => {
                            if (!authEmail.includes('@')) {
                              setAuthError('Please enter a valid email.');
                              return;
                            }
                            setAuthLoading(true);
                            setAuthError(null);
                            setTimeout(() => {
                              setAuthLoading(false);
                              alert('Reset link sent to ' + authEmail);
                              setAuthStep('login');
                            }, 1000);
                          }}
                          className="action-button"
                          disabled={authLoading}
                        >
                          {authLoading ? <div className="spinner"></div> : 'Send Reset Link'}
                        </button>

                        <p className="auth-switch-text" style={{ marginTop: '20px' }}>
                          <span onClick={() => { setAuthStep('login'); setAuthError(null); }}>
                            Back to Sign In
                          </span>
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  /* LOGGED IN PROFILE DASHBOARD */
                  <div className="profile-dashboard fade-in">
                    <h1 className="title-accent-green">Your Profile</h1>
                    <p className="subtitle">Successfully connected to Drift Cloud.</p>

                    <div className="user-profile-card">
                      <div className="user-avatar">
                        <svg className="avatar-svg" viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                          <circle cx="12" cy="7" r="4" />
                        </svg>
                      </div>
                      <div className="user-meta">
                        <h2>{userName}</h2>
                        <p>{userEmail}</p>
                        <span className="account-tier-badge">Pro Active User</span>
                      </div>
                    </div>

                    <div className="wellness-widget">
                      <h3>Sync Diagnostics</h3>
                      <p className="widget-desc">Your local data is automatically secured and synced.</p>
                      
                      <div className="sync-status">
                        <span className="sync-dot green"></span>
                        <span className="sync-text">Database connected and up to date</span>
                      </div>
                    </div>

                    <button 
                      onClick={handleLogout}
                      className="secondary-button"
                      style={{ borderColor: 'rgba(244,63,94,0.3)', color: '#f43f5e', marginTop: '20px' }}
                    >
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            )}

          </div>
        )}

      </div>
    </div>
  );
}

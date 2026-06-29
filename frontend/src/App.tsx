import { useState } from 'react';
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

type Step = 'mood' | 'time' | 'energy' | 'results';

const API_BASE = 'http://localhost:3001/api';

export default function App() {
  const [step, setStep] = useState<Step>('mood');
  const [text, setText] = useState('');
  const [mood, setMood] = useState('neutral');
  const [timeAvailable, setTimeAvailable] = useState<'short' | 'medium' | 'long' | null>(null);
  const [energyLevel, setEnergyLevel] = useState<'low' | 'mid' | 'high' | null>(null);
  
  const [userState, setUserState] = useState<UserState | null>(null);
  const [recommendations, setRecommendations] = useState<Recommendations | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Suggestion pills for easy input
  const suggestions = [
    { text: 'exhausted from work', label: 'Exhausted' },
    { text: 'feeling good, ready to relax', label: 'Feeling Good' },
    { text: 'completely bored and restless', label: 'Bored' },
    { text: 'stressed out and overwhelmed', label: 'Stressed' }
  ];

  // Call API to classify mood
  const handleMoodSubmit = async () => {
    if (!text.trim()) return;
    setIsLoading(true);
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
      setStep('time');
    } catch (err: any) {
      setError(err.message || 'An error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  // Call APIs to compute state and get recommendations
  const handleEnergySelect = async (selectedEnergy: 'low' | 'mid' | 'high') => {
    setEnergyLevel(selectedEnergy);
    setIsLoading(true);
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
      setStep('results');
    } catch (err: any) {
      setError(err.message || 'An error occurred during recommendations.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setStep('mood');
    setText('');
    setMood('neutral');
    setTimeAvailable(null);
    setEnergyLevel(null);
    setUserState(null);
    setRecommendations(null);
    setError(null);
  };

  // Render tag symbol with appropriate styling
  const renderTagSymbol = (val: '-' | 'neutral' | '+') => {
    if (val === '+') return <span className="symbol-plus">+</span>;
    if (val === '-') return <span className="symbol-minus">-</span>;
    return <span className="symbol-neutral">neutral</span>;
  };

  return (
    <div className="app-container">
      {/* Cinematic Background Ambient Elements */}
      <div className="ambient-glows">
        <div className="glow-shape glow-1"></div>
        <div className="glow-shape glow-2"></div>
        <div className="glow-shape glow-3"></div>
      </div>
      <div className="vignette"></div>
      <div className="grain"></div>

      {/* Main glassmorphic interface wrapper */}
      <div className="glass-panel fade-in">
        
        {/* STEP 1: Mood Capture */}
        {step === 'mood' && (
          <div>
            <h1 className="title-accent-green">Drift</h1>
            <p className="subtitle">Meet your brain where it actually is right now.</p>
            
            <p className="quote-text">
              "We get choice-paralyzed deciding what to watch or listen to, ignoring that what we can mentally handle changes hour to hour."
            </p>

            <div className="textarea-wrapper">
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="how's it going, really..."
                className="mood-textarea"
                disabled={isLoading}
              />
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

            {error && <p style={{ color: '#f43f5e', textAlign: 'center', marginBottom: '16px', fontSize: '0.9rem' }}>{error}</p>}

            <button
              onClick={handleMoodSubmit}
              disabled={!text.trim() || isLoading}
              className="action-button"
            >
              {isLoading ? (
                <>
                  <div className="spinner"></div>
                  Analyzing Mood...
                </>
              ) : (
                'Continue'
              )}
            </button>
          </div>
        )}

        {/* STEP 2: Time Available selection */}
        {step === 'time' && (
          <div>
            <h1 className="title-accent-violet">Available Time</h1>
            <p className="subtitle">How much time do you have to drift?</p>

            <div className="step-container">
              <div className="step-options">
                <div 
                  className={`option-card ${timeAvailable === 'short' ? 'selected' : ''}`}
                  onClick={() => {
                    setTimeAvailable('short');
                    setStep('energy');
                  }}
                >
                  <div style={{ fontSize: '1.5rem', marginBottom: '8px' }}>⏱️</div>
                  <div style={{ fontWeight: 600 }}>Short</div>
                  <div style={{ fontSize: '0.78rem', opacity: 0.8, marginTop: '4px' }}>Under 30 mins</div>
                </div>

                <div 
                  className={`option-card ${timeAvailable === 'medium' ? 'selected' : ''}`}
                  onClick={() => {
                    setTimeAvailable('medium');
                    setStep('energy');
                  }}
                >
                  <div style={{ fontSize: '1.5rem', marginBottom: '8px' }}>⏰</div>
                  <div style={{ fontWeight: 600 }}>Medium</div>
                  <div style={{ fontSize: '0.78rem', opacity: 0.8, marginTop: '4px' }}>30 to 90 mins</div>
                </div>

                <div 
                  className={`option-card ${timeAvailable === 'long' ? 'selected' : ''}`}
                  onClick={() => {
                    setTimeAvailable('long');
                    setStep('energy');
                  }}
                >
                  <div style={{ fontSize: '1.5rem', marginBottom: '8px' }}>⏳</div>
                  <div style={{ fontWeight: 600 }}>Long</div>
                  <div style={{ fontSize: '0.78rem', opacity: 0.8, marginTop: '4px' }}>Several hours</div>
                </div>
              </div>

              <button 
                onClick={() => setStep('mood')} 
                className="secondary-button"
              >
                Back
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Energy Level Selection & loading */}
        {step === 'energy' && (
          <div>
            <h1 className="title-accent-violet">Energy Level</h1>
            <p className="subtitle">What is your current cognitive state?</p>

            <div className="step-container">
              <div className="step-options">
                <div 
                  className={`option-card ${energyLevel === 'low' ? 'selected' : ''}`}
                  onClick={() => handleEnergySelect('low')}
                >
                  <div style={{ fontSize: '1.5rem', marginBottom: '8px' }}>🪫</div>
                  <div style={{ fontWeight: 600 }}>Low</div>
                  <div style={{ fontSize: '0.78rem', opacity: 0.8, marginTop: '4px' }}>Exhausted, brain-dead</div>
                </div>

                <div 
                  className={`option-card ${energyLevel === 'mid' ? 'selected' : ''}`}
                  onClick={() => handleEnergySelect('mid')}
                >
                  <div style={{ fontSize: '1.5rem', marginBottom: '8px' }}>🔋</div>
                  <div style={{ fontWeight: 600 }}>Medium</div>
                  <div style={{ fontSize: '0.78rem', opacity: 0.8, marginTop: '4px' }}>Balanced, standard</div>
                </div>

                <div 
                  className={`option-card ${energyLevel === 'high' ? 'selected' : ''}`}
                  onClick={() => handleEnergySelect('high')}
                >
                  <div style={{ fontSize: '1.5rem', marginBottom: '8px' }}>⚡</div>
                  <div style={{ fontWeight: 600 }}>High</div>
                  <div style={{ fontSize: '0.78rem', opacity: 0.8, marginTop: '4px' }}>Wired, hyper-focused</div>
                </div>
              </div>

              {error && <p style={{ color: '#f43f5e', textAlign: 'center', marginBottom: '16px', fontSize: '0.9rem' }}>{error}</p>}

              <button 
                onClick={() => setStep('time')} 
                className="secondary-button"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <div className="spinner"></div>
                    Matching Content...
                  </>
                ) : (
                  'Back'
                )}
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: Results Display */}
        {step === 'results' && userState && recommendations && (
          <div>
            <h1 className="title-accent-green" style={{ fontSize: '2.25rem', marginBottom: '24px' }}>Your Recommendations</h1>
            
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
                    <span className="tag-badge" title="Stress Impact">⚡ {renderTagSymbol(recommendations.tv_show.stress)}</span>
                    <span className="tag-badge" title="Calm Level">🍃 {renderTagSymbol(recommendations.tv_show.calm)}</span>
                    <span className="tag-badge" title="Attention Required">🧠 {renderTagSymbol(recommendations.tv_show.attention)}</span>
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
                    <span className="tag-badge" title="Stress Impact">⚡ {renderTagSymbol(recommendations.movie.stress)}</span>
                    <span className="tag-badge" title="Calm Level">🍃 {renderTagSymbol(recommendations.movie.calm)}</span>
                    <span className="tag-badge" title="Attention Required">🧠 {renderTagSymbol(recommendations.movie.attention)}</span>
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
                    <span className="tag-badge" title="Stress Impact">⚡ {renderTagSymbol(recommendations.music.stress)}</span>
                    <span className="tag-badge" title="Calm Level">🍃 {renderTagSymbol(recommendations.music.calm)}</span>
                    <span className="tag-badge" title="Attention Required">🧠 {renderTagSymbol(recommendations.music.attention)}</span>
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
    </div>
  );
}

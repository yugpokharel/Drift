import { useState, useEffect, useRef } from 'react';
import './App.css';
import Progress from './Progress';

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
  whyThisPick?: string;
  imdbRating?: string;
  rottenTomatoes?: string;
  genres?: string[];
}

interface Recommendations {
  tv_show: ContentItem;
  movie: ContentItem;
  music: ContentItem;
}

type Tab = 'home' | 'progress' | 'about' | 'soundscapes' | 'profile';
type DriftStep = 'input' | 'support' | 'auth-prompt' | 'results';
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

// WebGL Background Shader Canvas Component
function WebGLBackground() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')) as WebGLRenderingContext | null;
    if (!gl) return;

    const vs = `
      attribute vec2 a_position;
      varying vec2 v_texCoord;
      void main() {
        v_texCoord = a_position * 0.5 + 0.5;
        gl_Position = vec4(a_position, 0.0, 1.0);
      }
    `;

    const fs = `
      precision highp float;
      uniform float u_time;
      uniform vec2 u_resolution;
      uniform vec2 u_mouse;
      varying vec2 v_texCoord;

      void main() {
          vec2 uv = v_texCoord;
          
          // Flowing waves
          for(float i = 1.0; i < 4.0; i++) {
              uv.y += sin(uv.x * 3.0 * i + u_time * 0.4) * 0.08 / i;
              uv.x += cos(uv.y * 2.0 * i + u_time * 0.2) * 0.04 / i;
          }
          
          // Drift Palette colors
          vec3 baseColor = vec3(0.05, 0.08, 0.12); // Deep Indigo (#0A0E1A)
          vec3 teal = vec3(0.52, 0.85, 0.82);     // Soft Teal (#88D8D0)
          vec3 lavender = vec3(0.70, 0.65, 0.84);  // Lavender (#B4A7D6)
          
          // Hover distortion based on mouse position
          vec2 mouseUV = u_mouse / u_resolution;
          float dist = distance(v_texCoord, mouseUV);
          float hoverGlow = smoothstep(0.3, 0.0, dist) * 0.03;
          
          float mixVal = smoothstep(0.2, 0.8, uv.y + sin(u_time * 0.15) * 0.1);
          vec3 waveColor = mix(baseColor, mix(teal, lavender, sin(u_time * 0.3) * 0.5 + 0.5), mixVal);
          vec3 finalColor = waveColor + vec3(hoverGlow * 0.5, hoverGlow, hoverGlow * 0.8);
          
          gl_FragColor = vec4(finalColor, 1.0);
      }
    `;

    const compileShader = (type: number, source: string) => {
      const shader = gl.createShader(type);
      if (!shader) return null;
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error('Shader compilation error:', gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
      }
      return shader;
    };

    const vertexShader = compileShader(gl.VERTEX_SHADER, vs);
    const fragmentShader = compileShader(gl.FRAGMENT_SHADER, fs);
    if (!vertexShader || !fragmentShader) return;

    const program = gl.createProgram();
    if (!program) return;
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error('Program linking error:', gl.getProgramInfoLog(program));
      return;
    }
    gl.useProgram(program);

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, 1,1]), gl.STATIC_DRAW);

    const positionLoc = gl.getAttribLocation(program, 'a_position');
    gl.enableVertexAttribArray(positionLoc);
    gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 0, 0);

    const uTime = gl.getUniformLocation(program, 'u_time');
    const uRes = gl.getUniformLocation(program, 'u_resolution');
    const uMouse = gl.getUniformLocation(program, 'u_mouse');

    let mouse = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = rect.height - (e.clientY - rect.top);
    };
    window.addEventListener('mousemove', handleMouseMove);

    let animationFrameId: number;
    const resizeCanvas = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
        gl.viewport(0, 0, w, h);
      }
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const render = (time: number) => {
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform1f(uTime, time * 0.001);
      gl.uniform2f(uRes, canvas.width, canvas.height);
      gl.uniform2f(uMouse, mouse.x, mouse.y);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      animationFrameId = requestAnimationFrame(render);
    };

    render(0);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', resizeCanvas);
      gl.deleteBuffer(buffer);
      gl.deleteProgram(program);
      gl.deleteShader(vertexShader);
      gl.deleteShader(fragmentShader);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full z-0 pointer-events-none opacity-40"
    />
  );
}

export default function App() {
  // Navigation & Core States
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  
  // Onboarding / Input Form States
  const [driftStep, setDriftStep] = useState<DriftStep>('input');
  const [text, setText] = useState('');
  const [attentionVal, setAttentionVal] = useState(50);
  const [selectedContext, setSelectedContext] = useState<'ALONE' | 'WITH OTHERS' | 'BACKGROUND WATCH' | 'FULLY FOCUSED'>('ALONE');
  const [mood, setMood] = useState('neutral');
  
  // Computed States & Outputs
  const [userState, setUserState] = useState<UserState | null>(null);
  const [recommendations, setRecommendations] = useState<Recommendations | null>(null);
  
  // Loading & Error states
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentFact, setCurrentFact] = useState('');
  const [messageIdx, setMessageIdx] = useState(0);
  const [dialOffset, setDialOffset] = useState(502.65);

  // Auth Form States
  const [authStep, setAuthStep] = useState<AuthStep>('login');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authName, setAuthName] = useState('');
  const [authConfirmPassword, setAuthConfirmPassword] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Focus Timer States
  const [focusTimeLeft, setFocusTimeLeft] = useState(1500); // 25 mins
  const [isFocusRunning, setIsFocusRunning] = useState(false);
  
  // Soundscapes playback states
  const [playingSound, setPlayingSound] = useState<string | null>(null);
  const [soundVolume, setSoundVolume] = useState(60);
  const [isMuted, setIsMuted] = useState(true);

  // Breathing Exercise States
  const [breathState, setBreathState] = useState<BreathState>('idle');
  const [breathSeconds, setBreathSeconds] = useState(4);

  // Grief support countdown
  const [supportCountdown, setSupportCountdown] = useState(3);
  
  // Secondary redesign states
  const [animateGauges, setAnimateGauges] = useState(false);

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
    "Reading your mood...",
    "Calibrating cognitive levels...",
    "Filtering the noise...",
    "Almost there..."
  ];

  // Cycle loading messages below the circular dial at 1000ms interval
  useEffect(() => {
    if (isLoading) {
      const interval = setInterval(() => {
        setMessageIdx((prev) => (prev + 1) % LOADING_MESSAGES.length);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [isLoading]);

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

  const getBucketName = (capacity: number) => {
    if (capacity < 35) return 'brain-fried';
    if (capacity < 70) return 'relaxed';
    return 'hyper-focused';
  };

  // Unified Search Execution calling multi-stage backend API
  const handleExecuteSearch = async () => {
    setIsLoading(true);
    setError(null);

    // Derive energyLevel & timeAvailable based on slider & context selection
    const derivedEnergy = attentionVal < 35 ? 'low' : attentionVal > 70 ? 'high' : 'mid';
    let derivedTime: 'short' | 'medium' | 'long' = 'medium';
    if (selectedContext === 'BACKGROUND WATCH' || selectedContext === 'WITH OTHERS') {
      derivedTime = 'short';
    } else if (selectedContext === 'FULLY FOCUSED') {
      derivedTime = 'long';
    }

    try {
      // 1. Classify Mood
      let classifiedMood = 'neutral';
      if (text.trim()) {
        const moodResponse = await fetch(`${API_BASE}/mood`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text })
        });
        if (moodResponse.ok) {
          const moodData = await moodResponse.json();
          classifiedMood = moodData.mood;
          setMood(classifiedMood);
        }
      }

      // Check for sensitive or heavy grief keywords
      const HEAVY_KEYWORDS = [
        'died', 'death', 'lost', 'passed away', 'funeral', 'kill', 'suicide', 
        'depressed', 'grief', 'crying', 'broken', 'divorce', 'mourning', 'cancer', 'sick', 'accident'
      ];
      const isHeavy = HEAVY_KEYWORDS.some(word => text.toLowerCase().includes(word)) || classifiedMood === 'sadness';

      if (isHeavy) {
        setIsLoading(false);
        setDriftStep('support');
        return;
      }

      // 2. Get Computed User State
      const stateResponse = await fetch(`${API_BASE}/state`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mood: classifiedMood,
          timeAvailable: derivedTime,
          energyLevel: derivedEnergy,
          hour: new Date().getHours()
        })
      });

      if (!stateResponse.ok) {
        throw new Error('Failed to compute user state.');
      }

      const stateData: UserState = await stateResponse.json();
      // Ensure the computed state uses the user's manual slider input to override the attention heuristic
      stateData.attentionCapacity = attentionVal;
      setUserState(stateData);

      // 3. Retrieve Live / Hybrid Recommendations
      const recsResponse = await fetch(`${API_BASE}/recommendations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userState: stateData, moodText: text, moodLabel: classifiedMood })
      });

      if (!recsResponse.ok) {
        throw new Error('Failed to retrieve recommendations.');
      }

      const recsData: Recommendations = await recsResponse.json();
      setRecommendations(recsData);
      setDriftStep('results');

      // 4. Save Session snap to MongoDB (non-blocking)
      const bucketLabel = getBucketName(stateData.attentionCapacity);
      fetch(`${API_BASE}/sessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stress:    stateData.stressLevel,
          calm:      stateData.calmLevel,
          attention: stateData.attentionCapacity,
          bucket:    bucketLabel,
          moodLabel: classifiedMood,
          moodText:  text,
          recommendations: {
            tv:    { title: recsData.tv_show.title,  note: recsData.tv_show.extraInfo },
            music: { title: recsData.music.title,    note: recsData.music.extraInfo },
            movie: { title: recsData.movie.title,    note: recsData.movie.extraInfo }
          }
        })
      }).catch(err => console.warn('[Session log failed]', err));

    } catch (err: any) {
      setError(err.message || 'An error occurred during search.');
    } finally {
      setTimeout(() => {
        setIsLoading(false);
      }, 1500);
    }
  };

  // Grief auto-load fallback
  const handleGriefAutoLoad = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const stateResponse = await fetch(`${API_BASE}/state`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mood: 'sadness',
          timeAvailable: 'short',
          energyLevel: 'low',
          hour: new Date().getHours()
        })
      });
      if (!stateResponse.ok) throw new Error('Failed to compute user state.');
      const stateData: UserState = await stateResponse.json();
      setUserState(stateData);

      const recsResponse = await fetch(`${API_BASE}/recommendations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userState: stateData, moodText: text, moodLabel: 'sadness' })
      });
      if (!recsResponse.ok) throw new Error('Failed to retrieve recommendations.');
      const recsData: Recommendations = await recsResponse.json();
      setRecommendations(recsData);
      setDriftStep('results');
    } catch (err: any) {
      setError(err.message || 'Grief fallback matching failed.');
    } finally {
      setTimeout(() => setIsLoading(false), 1500);
    }
  };

  const handleReset = () => {
    setDriftStep('input');
    setText('');
    setAttentionVal(50);
    setSelectedContext('ALONE');
    setMood('neutral');
    setUserState(null);
    setRecommendations(null);
    setError(null);
  };

  // Auth Submit Scaffold
  const handleAuthSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);

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
      
      setAuthPassword('');
      setAuthConfirmPassword('');
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

  // Emoji graphic helper matching attention slider values
  const getAttentionEmoji = () => {
    if (attentionVal < 35) return '🥱';
    if (attentionVal < 70) return '😌';
    return '🧐';
  };

  const getAttentionEmojiLabel = () => {
    if (attentionVal < 35) return ' momentary / low focus ';
    if (attentionVal < 70) return ' balanced / comfortable ';
    return ' intensive / deep focus ';
  };

  const handleSoundPlayToggle = (soundName: string) => {
    if (playingSound === soundName) {
      setPlayingSound(null);
    } else {
      setPlayingSound(soundName);
      setIsMuted(false);
    }
  };

  return (
    <div className="min-h-screen text-on-surface font-body-md relative overflow-hidden bg-background">
      {/* WebGL Canvas Background */}
      <WebGLBackground />

      {/* Atmospheric overlays */}
      <div className="grain" />
      <div className="vignette" />
      <div className="ambient-glows">
        <div className="glow-shape glow-1"></div>
        <div className="glow-shape glow-2"></div>
        <div className="glow-shape glow-3"></div>
      </div>

      {/* Header Sticky Navigation */}
      <header className="fixed top-0 left-0 w-full z-50 flex justify-between items-center px-8 md:px-margin-desktop h-20 bg-background/80 backdrop-blur-xl border-b border-white/5 select-none">
        <button className="font-headline-md text-headline-md tracking-tighter text-secondary uppercase hover:opacity-90 leading-none focus:outline-none" onClick={() => { handleReset(); setActiveTab('home'); }}>
          Drift
        </button>
        <nav className="hidden md:flex items-center space-x-8">
          <button 
            className={`font-meta-technical text-meta-technical uppercase tracking-wider transition-colors pb-1 ${activeTab === 'home' ? 'text-secondary border-b-2 border-secondary' : 'text-on-surface-variant/60 hover:text-on-surface'}`}
            onClick={() => setActiveTab('home')}
          >
            Home
          </button>
          <button 
            className={`font-meta-technical text-meta-technical uppercase tracking-wider transition-colors pb-1 ${activeTab === 'progress' ? 'text-secondary border-b-2 border-secondary' : 'text-on-surface-variant/60 hover:text-on-surface'}`}
            onClick={() => setActiveTab('progress')}
          >
            Progress
          </button>
          <button 
            className={`font-meta-technical text-meta-technical uppercase tracking-wider transition-colors pb-1 ${activeTab === 'soundscapes' ? 'text-secondary border-b-2 border-secondary' : 'text-on-surface-variant/60 hover:text-on-surface'}`}
            onClick={() => setActiveTab('soundscapes')}
          >
            Soundscapes
          </button>
          <button 
            className={`font-meta-technical text-meta-technical uppercase tracking-wider transition-colors pb-1 ${activeTab === 'about' ? 'text-secondary border-b-2 border-secondary' : 'text-on-surface-variant/60 hover:text-on-surface'}`}
            onClick={() => setActiveTab('about')}
          >
            About
          </button>
          <button 
            className={`font-meta-technical text-meta-technical uppercase tracking-wider transition-colors pb-1 ${activeTab === 'profile' ? 'text-secondary border-b-2 border-secondary' : 'text-on-surface-variant/60 hover:text-on-surface'}`}
            onClick={() => setActiveTab('profile')}
          >
            Profile
          </button>
        </nav>
        <div className="flex items-center gap-4 text-on-surface-variant">
          <button className="hover:text-primary transition-colors p-1.5 focus:outline-none" onClick={() => setActiveTab('profile')}>
            <span className="material-symbols-outlined text-[22px]">account_circle</span>
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="relative z-10 w-full min-h-screen pt-32 pb-24 flex flex-col items-center px-margin-mobile md:px-0">
        
        {/* TAB 1: HOME */}
        {activeTab === 'home' && (
          <div className="w-full max-w-4xl flex flex-col items-center">
            
            {/* Loading Overlay State */}
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-20 animate-settle w-full max-w-2xl">
                {userState ? (
                  <div className="flex flex-col items-center space-y-10">
                    {/* Dial Ring progress */}
                    <div className="relative w-48 h-48 flex items-center justify-center">
                      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 180 180">
                        <circle cx="90" cy="90" r="80" className="stroke-white/5 fill-transparent" strokeWidth="4" />
                        <circle
                          cx="90"
                          cy="90"
                          r="80"
                          className="stroke-secondary fill-transparent dial-fill"
                          strokeWidth="4"
                          strokeLinecap="round"
                          strokeDasharray="502.65"
                          strokeDashoffset={dialOffset}
                          style={{ filter: "drop-shadow(0 0 8px #a7ff8340)" }}
                        />
                      </svg>
                      <div className="absolute flex flex-col items-center justify-center text-center">
                        <span className="font-meta-technical text-[10px] text-outline uppercase tracking-widest">STATE EXPECT</span>
                        <span className="font-headline-sm text-headline-sm text-secondary uppercase mt-1">{getBucketName(userState.attentionCapacity)}</span>
                      </div>
                    </div>
                    
                    <div className="text-center space-y-2">
                      <p className="font-meta-technical text-meta-technical text-secondary uppercase tracking-[0.25em] animate-pulse">
                        {LOADING_MESSAGES[messageIdx]}
                      </p>
                      <p className="text-[12px] text-outline max-w-sm italic">"{currentFact}"</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center space-y-8">
                    <div className="breathing-circle w-16 h-16 bg-secondary/15 rounded-full border border-secondary/30 flex items-center justify-center">
                      <span className="w-6 h-6 bg-secondary rounded-full" style={{ boxShadow: '0 0 15px #a7ff83' }}></span>
                    </div>
                    <div className="text-center space-y-1">
                      <p className="font-meta-technical text-[12px] text-secondary uppercase tracking-[0.2em]">CLASSIFYING MOOD LOG...</p>
                      <p className="text-[13px] text-outline italic">Analyzing input text tokens</p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <>
                {/* STEP A: Onboarding Form */}
                {driftStep === 'input' && (
                  <div className="w-full flex flex-col items-center">
                    {/* Hero copy */}
                    <section className="text-center mb-16 max-w-3xl animate-in fade-in duration-700">
                      <span className="font-meta-technical text-[11px] text-secondary mb-4 block tracking-[0.3em] uppercase">DAILY ARCHIVE // SESSION_INIT</span>
                      <h1 className="font-display-lg text-display-lg-mobile md:text-display-lg mb-6 text-primary leading-none">
                        How was your day?
                      </h1>
                      <div className="max-w-2xl mx-auto border-l-2 border-secondary/30 pl-6 py-1">
                        <p className="font-headline-sm text-[20px] italic text-on-surface-variant font-light text-left leading-relaxed">
                          "Choice is the thief of time. Less choosing, more living."
                        </p>
                      </div>
                    </section>

                    {/* Entry Form Card */}
                    <section className="w-full max-w-2xl glass-card rounded-[24px] p-8 md:p-12 relative shadow-2xl animate-settle">
                      {/* Technical Corner accents */}
                      <div className="absolute top-0 left-0 w-5 h-5 border-t border-l border-secondary"></div>
                      <div className="absolute top-0 right-0 w-5 h-5 border-t border-r border-secondary"></div>
                      <div className="absolute bottom-0 left-0 w-5 h-5 border-b border-l border-secondary"></div>
                      <div className="absolute bottom-0 right-0 w-5 h-5 border-b border-r border-secondary"></div>

                      <div className="space-y-12">
                        {/* Text Journal Input */}
                        <div className="space-y-4">
                          <div className="flex justify-between items-center">
                            <label className="font-meta-technical text-[11px] text-outline uppercase tracking-wider">ENTRY_LOG_01</label>
                            <span className="text-[11px] text-outline/50 font-meta-technical">{text.length}/500</span>
                          </div>
                          <textarea
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            placeholder="Type a few words describing your mental state, or proceed with guest presets..."
                            className="w-full bg-transparent border-0 border-b border-outline-variant pb-3 text-headline-sm placeholder:text-outline/40 focus:ring-0 focus:border-secondary transition-all outline-none text-on-surface resize-none h-16 font-light"
                            maxLength={500}
                          />
                        </div>

                        {/* Slider Attention Level */}
                        <div className="space-y-6">
                          <div className="flex justify-between items-end">
                            <label className="font-meta-technical text-[11px] text-outline uppercase tracking-wider">ATTENTION_SPAN_METRIC</label>
                            <span className="font-meta-technical text-secondary text-[11px] uppercase tracking-wider bg-secondary/5 border border-secondary/15 px-2.5 py-0.5 rounded-full">
                              VALUE: {attentionVal}%
                            </span>
                          </div>
                          <div className="w-full relative py-2">
                            {/* Floating emoji feedback above thumb */}
                            <div 
                              className="absolute -top-12 flex flex-col items-center transition-all duration-300"
                              style={{ left: `calc(${attentionVal}% - 16px)` }}
                            >
                              <span className="text-2xl animate-bounce">{getAttentionEmoji()}</span>
                              <span className="text-[9px] text-outline uppercase tracking-wider whitespace-nowrap bg-background px-1.5 py-0.5 border border-white/5 rounded mt-1">{getAttentionEmojiLabel()}</span>
                            </div>
                            
                            <input
                              type="range"
                              min="1"
                              max="100"
                              value={attentionVal}
                              onChange={(e) => setAttentionVal(Number(e.target.value))}
                              className="cursor-crosshair w-full"
                            />
                            
                            <div className="flex justify-between mt-4 font-meta-technical text-[10px] text-outline px-0">
                              <span className="tracking-widest">MIN // MOMENTARY</span>
                              <span className="tracking-widest">MAX // IMMERSIVE</span>
                            </div>
                          </div>
                        </div>

                        {/* Context Pills */}
                        <div className="space-y-4">
                          <p className="font-meta-technical text-[11px] text-outline uppercase tracking-wider text-center">ENVIRONMENT_CONTEXT</p>
                          <div className="flex flex-wrap justify-center gap-3">
                            {(['ALONE', 'WITH OTHERS', 'BACKGROUND WATCH', 'FULLY FOCUSED'] as const).map((ctx) => (
                              <button
                                key={ctx}
                                type="button"
                                className={`px-6 py-2.5 border rounded-full font-meta-technical text-[11px] uppercase tracking-wider transition-all duration-300 ${
                                  selectedContext === ctx 
                                    ? 'bg-secondary text-on-secondary border-secondary shadow-lg shadow-secondary/10 hover:opacity-90'
                                    : 'border-outline-variant bg-surface-container/60 text-on-surface-variant hover:border-secondary hover:text-secondary'
                                }`}
                                onClick={() => setSelectedContext(ctx)}
                              >
                                {ctx.toLowerCase()}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Error state */}
                        {error && (
                          <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-xl font-meta-technical text-center">
                            ⚠️ {error}
                          </div>
                        )}

                        {/* Primary Submit */}
                        <button
                          onClick={handleExecuteSearch}
                          className="w-full py-5 bg-secondary text-on-secondary font-meta-technical text-[12px] font-bold tracking-[0.2em] uppercase hover:bg-white transition-all border border-secondary active:scale-[0.99] select-none"
                        >
                          EXECUTE_SEARCH
                        </button>
                      </div>
                    </section>

                    {/* Aesthetic credits footer */}
                    <div className="mt-16 w-full max-w-container-max flex flex-col md:flex-row justify-between items-center opacity-40 px-margin-desktop py-6 text-on-surface-variant border-t border-outline-variant/30 text-[10px] font-meta-technical tracking-widest uppercase">
                      <span>© 2025 DRIFT_EDITORIAL / ARCHIVE_SYSTEM</span>
                      <div className="flex gap-8 mt-4 md:mt-0">
                        <span className="text-secondary">EST: ML-32M PIPELINE</span>
                        <span>NODE.JS · MONGODB</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP B: Grief Support */}
                {driftStep === 'support' && (
                  <div className="w-full max-w-xl text-center py-20 animate-settle">
                    <div className="glass-card rounded-[32px] p-12 border border-outline-variant/40 flex flex-col items-center space-y-6">
                      <span className="material-symbols-outlined text-4xl text-tertiary animate-pulse">spa</span>
                      <h1 className="font-display-lg text-headline-md text-tertiary italic">
                        Take a gentle breath.
                      </h1>
                      <p className="text-on-surface-variant text-body-lg leading-relaxed max-w-md">
                        I hear you. That sounds really heavy. We are skipping choices tonight and locating a gentle, comforting space for you now.
                      </p>
                      <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden relative">
                        <div 
                          className="h-full bg-tertiary transition-all duration-1000 ease-linear"
                          style={{ width: `${((3 - supportCountdown) / 3) * 100}%` }}
                        />
                      </div>
                      <p className="font-meta-technical text-[10px] text-outline uppercase tracking-widest">
                        Redirecting in {supportCountdown}s...
                      </p>
                    </div>
                  </div>
                )}

                {/* STEP C: Results Display (Cinematic pick) */}
                {driftStep === 'results' && userState && recommendations && (
                  <div className="w-full space-y-16 animate-in fade-in duration-1000">
                    
                    {/* 1. Curated Pick Hero banner */}
                    <section className="relative rounded-[32px] overflow-hidden border border-outline-variant/40 glass-card flex flex-col md:flex-row min-h-[500px]">
                      {/* Left metadata info column */}
                      <div className="w-full md:w-3/5 p-8 md:p-12 flex flex-col justify-between z-20 space-y-8">
                        <div className="space-y-4">
                          <div>
                            <span className="font-meta-technical text-[10px] text-secondary border border-secondary/30 bg-secondary/5 px-2.5 py-1 uppercase tracking-widest rounded">
                              CURATOR'S DAILY PICK
                            </span>
                          </div>
                          
                          <h1 className="font-display-lg text-display-lg-mobile md:text-display-lg text-primary leading-none tracking-tight">
                            {recommendations.movie.title}
                          </h1>
                          
                          <div className="flex items-center gap-3 font-meta-technical text-[11px] text-outline uppercase tracking-wider">
                            <span>MOVIE PICK</span>
                            <span className="w-1.5 h-1.5 bg-outline-variant rounded-full" />
                            <span>{recommendations.movie.genres?.join(' / ') || 'Film'}</span>
                          </div>
                        </div>

                        {/* OMDb Scores display row */}
                        <div className="flex flex-wrap gap-4">
                          <div className="flex items-center gap-2 border border-outline-variant/40 bg-white/3 px-3.5 py-2 font-meta-technical text-[11px] group hover:border-white/20 transition-colors">
                            <span className="text-[10px] text-outline">IMDB</span>
                            <span className="text-on-surface">[ {recommendations.movie.imdbRating || '7.8'} <span className="text-outline/50">/ 10</span> ]</span>
                          </div>
                          <div className="flex items-center gap-2 border border-outline-variant/40 bg-white/3 px-3.5 py-2 font-meta-technical text-[11px] group hover:border-white/20 transition-colors">
                            <span className="text-[10px] text-outline">ROTTEN TOM.</span>
                            <span className="text-secondary">[ {recommendations.movie.rottenTomatoes || '89% FRESH'} ]</span>
                          </div>
                          <div className="flex items-center gap-2 border border-outline-variant/40 bg-white/3 px-3.5 py-2 font-meta-technical text-[11px] group hover:border-white/20 transition-colors">
                            <span className="text-[10px] text-outline">COGNITIVE MATCH</span>
                            <span className="text-tertiary">[ EXCELLENT ]</span>
                          </div>
                        </div>

                        {/* Why this pick editorial snippet */}
                        <div className="border-t border-outline-variant/30 pt-6 max-w-xl">
                          <h4 className="font-meta-technical text-[10px] text-secondary uppercase tracking-widest mb-2.5 flex items-center gap-2">
                            <span className="w-5 h-[1.5px] bg-secondary" /> Why this pick
                          </h4>
                          <p className="font-headline-sm text-[18px] leading-relaxed italic text-on-surface-variant font-light">
                            {recommendations.movie.whyThisPick || 
                              `This was chosen because it demands comfortable attention and provides the intellectual and atmospheric tone that matches your ${getBucketName(userState.attentionCapacity)} state.`}
                          </p>
                        </div>

                        {/* CTAs */}
                        <div className="flex flex-wrap gap-4 pt-2">
                          <button className="bg-primary text-on-primary px-8 py-4 font-meta-technical text-[12px] uppercase tracking-wider font-semibold hover:bg-secondary hover:text-on-secondary transition-all duration-300 flex items-center gap-2">
                            <span className="material-symbols-outlined text-[18px]">play_arrow</span> Start Watching
                          </button>
                          <button className="border border-outline-variant/60 text-on-surface px-8 py-4 font-meta-technical text-[12px] uppercase tracking-wider hover:bg-white/5 transition-all duration-300 flex items-center gap-2">
                            <span className="material-symbols-outlined text-[18px]">add</span> Add To Archive
                          </button>
                        </div>
                      </div>

                      {/* Right art placeholder column */}
                      <div className="hidden md:block w-2/5 relative z-10 overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/40 to-transparent z-20"></div>
                        <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent z-20"></div>
                        {/* A gorgeous atmospheric cover art placeholder */}
                        <div className="w-full h-full bg-cover bg-center filter saturate-75 brightness-[0.7] group-hover:scale-105 transition-transform duration-[20s]" style={{ backgroundImage: `url('https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&q=80&w=800')` }} />
                      </div>
                    </section>

                    {/* 2. Gauges & Bento Grid secondary picks */}
                    <section className="grid grid-cols-1 md:grid-cols-12 gap-8">
                      {/* Gauges card (4 columns) */}
                      <div className="md:col-span-4 glass-card rounded-[24px] p-8 border border-outline-variant/30 flex flex-col justify-between min-h-[350px]">
                        <div>
                          <span className="font-meta-technical text-[10px] text-outline uppercase tracking-widest block mb-2">METRICS // snap</span>
                          <h3 className="font-headline-sm text-headline-sm text-on-surface">Cognitive load</h3>
                          <p className="text-[12px] text-outline mt-1 mb-8">Estimated values based on log analysis.</p>
                          
                          <div className="space-y-6">
                            <div className="space-y-2">
                              <div className="flex justify-between text-[11px] font-meta-technical">
                                <span className="text-outline uppercase">Stress</span>
                                <span className="text-error font-bold">{userState.stressLevel}%</span>
                              </div>
                              <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                                <div className="h-full bg-error transition-all duration-1000" style={{ width: animateGauges ? `${userState.stressLevel}%` : '0%' }} />
                              </div>
                            </div>
                            
                            <div className="space-y-2">
                              <div className="flex justify-between text-[11px] font-meta-technical">
                                <span className="text-outline uppercase">Calm</span>
                                <span className="text-tertiary font-bold">{userState.calmLevel}%</span>
                              </div>
                              <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                                <div className="h-full bg-tertiary transition-all duration-1000" style={{ width: animateGauges ? `${userState.calmLevel}%` : '0%' }} />
                              </div>
                            </div>

                            <div className="space-y-2">
                              <div className="flex justify-between text-[11px] font-meta-technical">
                                <span className="text-outline uppercase">Attention</span>
                                <span className="text-secondary font-bold">{userState.attentionCapacity}%</span>
                              </div>
                              <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                                <div className="h-full bg-secondary transition-all duration-1000" style={{ width: animateGauges ? `${userState.attentionCapacity}%` : '0%' }} />
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="text-[10px] text-outline/50 font-meta-technical border-t border-outline-variant/35 pt-4 mt-6 uppercase tracking-wider text-center">
                          SESSION SNAPSHOT SAVED
                        </div>
                      </div>

                      {/* Secondary Bento Grid (8 columns) */}
                      <div className="md:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-8">
                        {/* TV Show card */}
                        <div className="glass-card rounded-[24px] p-8 border border-outline-variant/30 flex flex-col justify-between hover:border-white/20 transition-all duration-500 group min-h-[350px]">
                          <div>
                            <div className="flex justify-between items-start mb-6">
                              <span className="font-meta-technical text-[10px] text-tertiary border border-tertiary/20 bg-tertiary/5 px-2 py-0.5 rounded uppercase">
                                📺 TV SHOW
                              </span>
                              <span className="material-symbols-outlined text-outline/40 group-hover:text-tertiary transition-colors">tv</span>
                            </div>
                            <h3 className="font-headline-md text-headline-sm text-primary mb-3 group-hover:text-tertiary transition-colors duration-300">
                              {recommendations.tv_show.title}
                            </h3>
                            <p className="text-on-surface-variant text-[14px] leading-relaxed line-clamp-4">
                              {recommendations.tv_show.extraInfo}
                            </p>
                          </div>

                          <div className="flex items-center justify-between border-t border-outline-variant/20 pt-4 mt-6">
                            <span className="font-meta-technical text-[10px] text-outline uppercase">Match: {getBucketName(userState.attentionCapacity)}</span>
                            <button className="text-[11px] font-meta-technical text-secondary hover:underline uppercase tracking-wider">Explore</button>
                          </div>
                        </div>

                        {/* Music card */}
                        <div className="glass-card rounded-[24px] p-8 border border-outline-variant/30 flex flex-col justify-between hover:border-white/20 transition-all duration-500 group min-h-[350px]">
                          <div>
                            <div className="flex justify-between items-start mb-6">
                              <span className="font-meta-technical text-[10px] text-secondary border border-secondary/20 bg-secondary/5 px-2 py-0.5 rounded uppercase">
                                🎵 MUSIC
                              </span>
                              <span className="material-symbols-outlined text-outline/40 group-hover:text-secondary transition-colors">music_note</span>
                            </div>
                            <h3 className="font-headline-md text-headline-sm text-primary mb-3 group-hover:text-secondary transition-colors duration-300">
                              {recommendations.music.title}
                            </h3>
                            <p className="text-on-surface-variant text-[14px] leading-relaxed line-clamp-4">
                              {recommendations.music.extraInfo}
                            </p>
                          </div>

                          <div className="flex items-center justify-between border-t border-outline-variant/20 pt-4 mt-6">
                            <span className="font-meta-technical text-[10px] text-outline uppercase">Match: all-day comfort</span>
                            <button className="text-[11px] font-meta-technical text-secondary hover:underline uppercase tracking-wider">Play Track</button>
                          </div>
                        </div>
                      </div>
                    </section>

                    {/* Reset Button */}
                    <div className="flex justify-center pt-8">
                      <button 
                        onClick={handleReset}
                        className="px-10 py-4 border border-outline-variant hover:border-secondary hover:text-secondary font-meta-technical text-[12px] uppercase tracking-widest transition-all duration-300 bg-surface-container-low/40 backdrop-blur"
                      >
                        Start Over // Reset
                      </button>
                    </div>

                  </div>
                )}
              </>
            )}

          </div>
        )}

        {/* TAB 2: PROGRESS (Analytics Component) */}
        {activeTab === 'progress' && (
          <Progress onNavigateHome={() => setActiveTab('home')} />
        )}

        {/* TAB 3: SOUNDSCAPES & FOCUS MODE */}
        {activeTab === 'soundscapes' && (
          <div className="w-full max-w-container-max mx-auto py-12 px-6 md:px-margin-desktop fade-in z-10 relative">
            <header className="mb-12 text-center max-w-2xl mx-auto">
              <span className="font-meta-technical text-[11px] text-secondary uppercase tracking-[0.2em] mb-2 block">FOCUS_SPACE // SNAPS</span>
              <h1 className="font-display-lg text-display-lg-mobile md:text-display-lg text-primary leading-none mb-3">Soundscapes & Focus</h1>
              <p className="text-on-surface-variant text-body-lg">Cinematic soundscapes and integrated Pomodoro timers designed to ground your focus and lock out digital noise.</p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              
              {/* Left Column: Pomodoro Timer & Breathing */}
              <div className="lg:col-span-5 space-y-8">
                {/* Timer Card */}
                <div className="glass-card rounded-[24px] p-8 border border-outline-variant/30 text-center relative overflow-hidden flex flex-col items-center">
                  <div className="absolute top-0 left-0 w-4 h-4 border-t border-l border-secondary"></div>
                  <div className="absolute top-0 right-0 w-4 h-4 border-t border-r border-secondary"></div>
                  
                  <span className="font-meta-technical text-[9px] text-outline uppercase tracking-widest block mb-4">Focus Clock</span>
                  
                  <div className="relative w-40 h-40 flex items-center justify-center mb-6">
                    {/* Ring background */}
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="45" className="stroke-white/5 fill-transparent" strokeWidth="2" />
                      <circle 
                        cx="50" 
                        cy="50" 
                        r="45" 
                        className={`fill-transparent transition-all duration-1000 ${isFocusRunning ? 'stroke-secondary' : 'stroke-outline-variant'}`}
                        strokeWidth="2"
                        strokeDasharray="282.7"
                        strokeDashoffset={282.7 - (focusTimeLeft / 1500) * 282.7}
                      />
                    </svg>
                    <span className="absolute text-3xl font-meta-technical text-primary font-bold">{formatFocusTime(focusTimeLeft)}</span>
                  </div>

                  <div className="flex gap-4 w-full">
                    <button 
                      onClick={() => setIsFocusRunning(!isFocusRunning)}
                      className={`flex-1 py-3 text-[11px] font-meta-technical uppercase tracking-wider border transition-all ${
                        isFocusRunning 
                          ? 'border-error text-error hover:bg-error/5' 
                          : 'border-secondary text-secondary hover:bg-secondary/5'
                      }`}
                    >
                      {isFocusRunning ? 'Pause' : 'Start Focus'}
                    </button>
                    <button 
                      onClick={() => { setIsFocusRunning(false); setFocusTimeLeft(1500); }}
                      className="border border-outline-variant hover:border-white px-5 py-3 text-[11px] font-meta-technical uppercase tracking-wider text-on-surface-variant hover:text-on-surface transition-all"
                    >
                      Reset
                    </button>
                  </div>
                </div>

                {/* Breathing box */}
                <div className="glass-card rounded-[24px] p-8 border border-outline-variant/30 text-center relative flex flex-col items-center">
                  <span className="font-meta-technical text-[9px] text-outline uppercase tracking-widest block mb-4">Bio-Feedback Regulator</span>
                  
                  {breathState === 'idle' ? (
                    <div className="py-8 space-y-6 flex flex-col items-center">
                      <p className="text-on-surface-variant text-[14px] leading-relaxed max-w-xs">
                        Trigger a paced breathing cycle to activate your parasympathetic nervous system and settle anxiety.
                      </p>
                      <button 
                        onClick={handleBreathingStart}
                        className="px-8 py-3.5 bg-tertiary text-on-tertiary font-meta-technical text-[11px] uppercase tracking-wider hover:opacity-90 transition-all border border-tertiary"
                      >
                        Breathe Snap-in
                      </button>
                    </div>
                  ) : (
                    <div className="py-6 space-y-6 flex flex-col items-center w-full">
                      {/* Breathing ring scaling graphic */}
                      <div className="w-32 h-32 flex items-center justify-center relative">
                        <div 
                          className="absolute w-24 h-24 rounded-full bg-tertiary/10 border-2 border-tertiary/40 transition-all duration-[4s] ease-in-out"
                          style={{
                            transform: breathState === 'inhale' ? 'scale(1.3)' 
                                     : breathState === 'hold' ? 'scale(1.3)' 
                                     : 'scale(0.85)',
                            boxShadow: breathState === 'inhale' || breathState === 'hold' 
                                      ? '0 0 25px rgba(205, 191, 240, 0.4)' 
                                      : 'none'
                          }}
                        />
                        <span className="text-xl font-meta-technical text-primary font-bold z-10">{breathSeconds}s</span>
                      </div>
                      
                      <div className="space-y-1 text-center">
                        <p className="font-meta-technical text-[12px] text-tertiary uppercase tracking-widest font-bold">
                          {breathState === 'inhale' ? 'Breathe In' 
                           : breathState === 'hold' ? 'Hold' 
                           : 'Breathe Out'}
                        </p>
                        <p className="text-[12px] text-outline italic">Deep diaphragmatic respiration</p>
                      </div>

                      <button 
                        onClick={handleBreathingStop}
                        className="text-[11px] text-outline hover:text-error uppercase tracking-wider font-meta-technical transition-colors pt-2"
                      >
                        Stop Cycle
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: Soundscape Cards */}
              <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-6">
                {[
                  { name: 'Rain', icon: 'umbrella', url: 'https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?auto=format&fit=crop&q=80&w=400' },
                  { name: 'Forest', icon: 'forest', url: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&q=80&w=400' },
                  { name: 'Ocean Waves', icon: 'tsunami', url: 'https://images.unsplash.com/photo-1505118380757-91f5f5632de0?auto=format&fit=crop&q=80&w=400' },
                  { name: 'White Noise', icon: 'texture', url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=400' }
                ].map((scape) => (
                  <div 
                    key={scape.name}
                    className={`glass-card rounded-[24px] overflow-hidden border transition-all duration-500 group flex flex-col justify-between min-h-[250px] ${
                      playingSound === scape.name 
                        ? 'border-secondary/40 shadow-lg shadow-secondary/5 bg-secondary/[0.02]' 
                        : 'border-outline-variant/30 hover:border-white/20'
                    }`}
                  >
                    <div className="relative h-28 overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent z-10" />
                      <div 
                        className="w-full h-full bg-cover bg-center filter grayscale group-hover:grayscale-0 transition-all duration-700 saturate-50 brightness-[0.7]" 
                        style={{ backgroundImage: `url('${scape.url}')` }} 
                      />
                    </div>
                    
                    <div className="p-6 flex-grow flex flex-col justify-between">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-headline-sm text-[18px] text-primary">{scape.name}</h4>
                          <span className="font-meta-technical text-[9px] text-outline uppercase tracking-wider">Cinematic Soundscape</span>
                        </div>
                        <span className="material-symbols-outlined text-outline/30 group-hover:text-secondary transition-colors">{scape.icon}</span>
                      </div>

                      <div className="flex items-center justify-between border-t border-outline-variant/20 pt-4 mt-6">
                        <button 
                          onClick={() => handleSoundPlayToggle(scape.name)}
                          className={`font-meta-technical text-[10px] uppercase tracking-wider font-bold transition-all px-4 py-2 border rounded-full ${
                            playingSound === scape.name 
                              ? 'bg-secondary text-on-secondary border-secondary'
                              : 'border-outline-variant text-on-surface hover:border-secondary hover:text-secondary'
                          }`}
                        >
                          {playingSound === scape.name ? 'Playing' : 'Activate'}
                        </button>
                        
                        {playingSound === scape.name && (
                          <div className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 bg-secondary rounded-full animate-ping" />
                            <span className="font-meta-technical text-[9px] text-secondary uppercase">Streaming</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

            </div>
          </div>
        )}

        {/* TAB 4: ABOUT / PHILOSOPHY */}
        {activeTab === 'about' && (
          <div className="w-full max-w-3xl py-12 px-6 md:px-margin-desktop fade-in z-10 relative">
            <header className="mb-16 border-b border-outline-variant/30 pb-6">
              <span className="font-meta-technical text-[11px] text-secondary uppercase tracking-[0.2em] mb-2 block">MANIFESTO // DRIFT</span>
              <h1 className="font-display-lg text-display-lg-mobile md:text-display-lg text-primary leading-none mb-3">Cinematic Wellness</h1>
              <p className="text-on-surface-variant text-body-lg">Moving away from the sterile trackers toward a soulful, immersive digital aesthetic.</p>
            </header>

            <article className="space-y-12 font-light text-on-surface-variant text-body-lg leading-relaxed">
              <section className="space-y-4">
                <h3 className="font-headline-sm text-headline-sm text-primary font-medium">The Curse of Choice</h3>
                <p>
                  Modern digital systems thrive on endless scroll and aggregate grids. They bombard you with dozens of recommendations, assuming that more options equate to a better experience. We believe this introduces choice paralysis—a hidden cognitive tax that exhausts your attention before you've even hit play.
                </p>
              </section>

              <section className="space-y-4">
                <h3 className="font-headline-sm text-headline-sm text-primary font-medium">Attention as a Finite Asset</h3>
                <p>
                  Drift operates under a simple guideline: we recommend exactly <strong>one</strong> curated pick per session. We assess your mental bandwidth using a hybrid two-stage engine that aligns collaborative filtering with real-time mood context, ensuring your entertainment selection fits your current capability.
                </p>
              </section>

              <section className="space-y-4">
                <h3 className="font-headline-sm text-headline-sm text-primary font-medium">Glassmorphism & Depth Aesthetics</h3>
                <p>
                  Our UI uses dark, nocturnal base layers to soothe eye strain, paired with translucent glass containers and WebGL noise canvases. The design draws inspiration from classic typography and film editorials. Drift is designed to help you settle down and disengage from constant feedback loops.
                </p>
              </section>
            </article>
          </div>
        )}

        {/* TAB 5: PROFILE & AUTHENTICATION */}
        {activeTab === 'profile' && (
          <div className="w-full max-w-xl py-12 px-6 fade-in z-10 relative">
            {isLoggedIn ? (
              <div className="glass-card rounded-[32px] p-8 md:p-12 border border-outline-variant/30 relative flex flex-col items-center text-center animate-settle">
                <div className="absolute top-0 left-0 w-4 h-4 border-t border-l border-secondary"></div>
                <div className="absolute top-0 right-0 w-4 h-4 border-t border-r border-secondary"></div>
                
                <span className="material-symbols-outlined text-4xl text-secondary mb-4">account_circle</span>
                <span className="font-meta-technical text-[9px] text-outline uppercase tracking-widest block mb-1">User profile status</span>
                <h2 className="font-display-lg text-headline-md text-primary mb-2">{userName}</h2>
                <p className="text-[12px] text-on-surface-variant font-meta-technical mb-8">{userEmail}</p>

                <div className="border-t border-outline-variant/30 pt-8 w-full space-y-4">
                  <button 
                    onClick={() => setActiveTab('progress')}
                    className="w-full py-4 bg-white/5 border border-outline-variant hover:border-secondary hover:text-secondary font-meta-technical text-[11px] uppercase tracking-wider transition-all"
                  >
                    View Analytics Dashboard
                  </button>
                  <button 
                    onClick={handleLogout}
                    className="w-full py-4 border border-error/50 text-error hover:bg-error/5 font-meta-technical text-[11px] uppercase tracking-wider transition-all"
                  >
                    Disconnect Session
                  </button>
                </div>
              </div>
            ) : (
              <div className="glass-card rounded-[32px] p-8 md:p-12 border border-outline-variant/30 relative animate-settle">
                <div className="absolute top-0 left-0 w-4 h-4 border-t border-l border-secondary"></div>
                <div className="absolute top-0 right-0 w-4 h-4 border-t border-r border-secondary"></div>
                
                <div className="text-center mb-8">
                  <span className="font-meta-technical text-[10px] text-secondary uppercase tracking-widest block mb-2">ARCHIVE // AUTHSYS</span>
                  <h2 className="font-display-lg text-headline-md text-primary">
                    {authStep === 'login' ? 'Sign In' : authStep === 'signup' ? 'Create Account' : 'Reset Access'}
                  </h2>
                </div>

                <form onSubmit={handleAuthSubmit} className="space-y-6">
                  {authStep === 'signup' && (
                    <div className="space-y-2">
                      <label className="font-meta-technical text-[9px] text-outline uppercase">NAME</label>
                      <input 
                        type="text" 
                        value={authName}
                        onChange={(e) => setAuthName(e.target.value)}
                        placeholder="Your Name"
                        className="w-full bg-white/3 border border-outline-variant rounded-xl p-3 text-sm focus:border-secondary focus:ring-0 text-on-surface font-light outline-none"
                      />
                    </div>
                  )}

                  <div className="space-y-2">
                    <label className="font-meta-technical text-[9px] text-outline uppercase">EMAIL ADDRESS</label>
                    <input 
                      type="email" 
                      value={authEmail}
                      onChange={(e) => setAuthEmail(e.target.value)}
                      placeholder="name@domain.com"
                      className="w-full bg-white/3 border border-outline-variant rounded-xl p-3 text-sm focus:border-secondary focus:ring-0 text-on-surface font-light outline-none"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="font-meta-technical text-[9px] text-outline uppercase">PASSWORD</label>
                    <div className="relative flex items-center">
                      <input 
                        type={showPassword ? 'text' : 'password'} 
                        value={authPassword}
                        onChange={(e) => setAuthPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-white/3 border border-outline-variant rounded-xl p-3 text-sm focus:border-secondary focus:ring-0 text-on-surface font-light outline-none pr-12"
                      />
                      <button 
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 text-outline/50 hover:text-on-surface-variant transition-colors focus:outline-none"
                      >
                        <span className="material-symbols-outlined text-[18px]">
                          {showPassword ? 'visibility_off' : 'visibility'}
                        </span>
                      </button>
                    </div>
                  </div>

                  {authStep === 'signup' && (
                    <div className="space-y-2">
                      <label className="font-meta-technical text-[9px] text-outline uppercase">CONFIRM PASSWORD</label>
                      <input 
                        type="password" 
                        value={authConfirmPassword}
                        onChange={(e) => setAuthConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-white/3 border border-outline-variant rounded-xl p-3 text-sm focus:border-secondary focus:ring-0 text-on-surface font-light outline-none"
                      />
                    </div>
                  )}

                  {authError && (
                    <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl font-meta-technical text-center">
                      ⚠️ {authError}
                    </div>
                  )}

                  <button 
                    type="submit" 
                    disabled={authLoading}
                    className="w-full py-4 bg-secondary text-on-secondary font-meta-technical text-[11px] font-bold uppercase tracking-widest border border-secondary hover:bg-white transition-all select-none"
                  >
                    {authLoading ? 'Compiling Access...' : authStep === 'login' ? 'ESTABLISH SESSION' : 'REGISTER Snaps'}
                  </button>
                </form>

                <div className="mt-8 border-t border-outline-variant/30 pt-6 flex justify-between text-[11px] font-meta-technical text-outline uppercase">
                  {authStep === 'login' ? (
                    <>
                      <button onClick={() => setAuthStep('signup')} className="hover:text-secondary">Register account</button>
                      <button onClick={() => setAuthStep('forgot')} className="hover:text-secondary">Forgot pass</button>
                    </>
                  ) : (
                    <button onClick={() => setAuthStep('login')} className="hover:text-secondary mx-auto">Return to Sign In</button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

      </main>
    </div>
  );
}

import { useState, useEffect, useRef } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

const API_BASE = 'http://localhost:3001/api';

interface SessionRec {
  tv?:    { title: string; note?: string };
  music?: { title: string; note?: string };
  movie?: { title: string; note?: string };
}

interface Session {
  _id: string;
  stress: number;
  calm: number;
  attention: number;
  bucket: string;
  moodLabel: string;
  moodText: string;
  recommendations: SessionRec;
  createdAt: string;
}

interface Props {
  onNavigateHome: () => void;
}

// Format: "Wed 8 Jul · 3:32pm"
function fmtDateTime(iso: string): string {
  const d = new Date(iso);
  const days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const hr = d.getHours();
  const min = d.getMinutes().toString().padStart(2,'0');
  const ampm = hr >= 12 ? 'pm' : 'am';
  const hr12 = hr % 12 || 12;
  return `${days[d.getDay()]} ${d.getDate()} ${months[d.getMonth()]} · ${hr12}:${min}${ampm}`;
}

// Format: "Jul 7, 3pm"
function fmtChartLabel(iso: string): string {
  const d = new Date(iso);
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const hr = d.getHours();
  const ampm = hr >= 12 ? 'pm' : 'am';
  const hr12 = hr % 12 || 12;
  return `${months[d.getMonth()]} ${d.getDate()}, ${hr12}${ampm}`;
}

// Format: "Mon 7 Jul"
function fmtBestDay(iso: string): string {
  const d = new Date(iso);
  const days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${days[d.getDay()]} ${d.getDate()} ${months[d.getMonth()]}`;
}

function getWeekDays(): Date[] {
  const now = new Date();
  const day = now.getDay(); // 0=Sun
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((day + 6) % 7));
  monday.setHours(0,0,0,0);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

function sameCalendarDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() &&
         a.getMonth() === b.getMonth() &&
         a.getDate() === b.getDate();
}

function bucketBadgeStyleClass(bucket: string): string {
  switch (bucket) {
    case 'brain-fried':
      return 'bg-red-500/10 border border-red-500/20 text-red-400';
    case 'relaxed':
      return 'bg-indigo-500/10 border border-indigo-500/20 text-tertiary';
    case 'hyper-focused':
      return 'bg-secondary/10 border border-secondary/20 text-secondary';
    default:
      return 'bg-white/5 border border-white/10 text-on-surface-variant';
  }
}

function stressBarColor(stress: number): string {
  if (stress < 35) return '#a7ff83'; // secondary Neon Green
  if (stress <= 65) return '#fbbf24'; // Amber
  return '#ffb4ab'; // Error/Red
}

export default function Progress({ onNavigateHome }: Props) {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const chartRef = useRef(null);

  useEffect(() => {
    fetch(`${API_BASE}/sessions`)
      .then(r => r.json())
      .then(data => {
        setSessions(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // ── Derived stats ──────────────────────────────────────
  const totalCheckins = sessions.length;
  const avgStress = totalCheckins
    ? Math.round(sessions.reduce((s, x) => s + x.stress, 0) / totalCheckins)
    : 0;

  const bestDay = (() => {
    if (!totalCheckins) return '—';
    const byDay: Record<string, number[]> = {};
    sessions.forEach(s => {
      const key = new Date(s.createdAt).toDateString();
      if (!byDay[key]) byDay[key] = [];
      byDay[key].push(s.stress);
    });
    let best = '';
    let bestAvg = Infinity;
    Object.entries(byDay).forEach(([day, vals]) => {
      const avg = vals.reduce((a,b) => a+b,0) / vals.length;
      if (avg < bestAvg) { bestAvg = avg; best = day; }
    });
    return fmtBestDay(new Date(best).toISOString());
  })();

  const mostCommonBucket = (() => {
    if (!totalCheckins) return '—';
    const counts: Record<string, number> = {};
    sessions.forEach(s => { counts[s.bucket] = (counts[s.bucket] || 0) + 1; });
    return Object.entries(counts).sort((a,b) => b[1]-a[1])[0][0];
  })();

  // ── Chart data (last 14 sessions, oldest first for chart) ──
  const chartSessions = [...sessions].reverse().slice(-14);
  const chartData = {
    labels: chartSessions.map(s => fmtChartLabel(s.createdAt)),
    datasets: [
      {
        label: 'Stress',
        data: chartSessions.map(s => s.stress),
        borderColor: '#ffb4ab',
        backgroundColor: 'transparent',
        tension: 0.4,
        pointRadius: 4,
        pointBackgroundColor: '#ffb4ab',
      },
      {
        label: 'Calm',
        data: chartSessions.map(s => s.calm),
        borderColor: '#cdbff0',
        backgroundColor: 'transparent',
        tension: 0.4,
        pointRadius: 4,
        pointBackgroundColor: '#cdbff0',
      },
      {
        label: 'Attention',
        data: chartSessions.map(s => s.attention),
        borderColor: '#a7ff83',
        backgroundColor: 'transparent',
        tension: 0.4,
        pointRadius: 4,
        pointBackgroundColor: '#a7ff83',
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 600 },
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: '#94a3b8',
          font: { family: 'Inter', size: 12 },
          boxWidth: 10,
          padding: 15,
        },
      },
      tooltip: {
        backgroundColor: '#161c22',
        borderColor: 'rgba(255,255,255,0.05)',
        borderWidth: 1,
        titleColor: '#f8fafc',
        bodyColor: '#94a3b8',
        padding: 10,
      },
    },
    scales: {
      x: {
        grid: { color: 'rgba(255,255,255,0.03)' },
        ticks: { color: '#94a3b8', font: { family: 'Inter', size: 11 } },
      },
      y: {
        min: 0,
        max: 100,
        grid: { color: 'rgba(255,255,255,0.03)' },
        ticks: { color: '#94a3b8', font: { family: 'Inter', size: 11 } },
      },
    },
  };

  // ── Weekly data ────────────────────────────────────────
  const weekDays = getWeekDays();
  const DAY_LABELS = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
  const today = new Date();

  return (
    <div className="w-full max-w-container-max mx-auto py-12 px-6 md:px-margin-desktop fade-in z-10 relative">
      {/* Page Header */}
      <header className="mb-12">
        <span className="font-meta-technical text-[11px] text-secondary uppercase tracking-[0.2em] mb-2 block">ANALYTICS // WORKSPACE</span>
        <h1 className="font-display-lg text-display-lg-mobile md:text-display-lg text-primary leading-none mb-3">Your Wellness Journey</h1>
        <p className="text-on-surface-variant text-body-lg max-w-lg">A quiet reflection of your digital presence and mental space over your logged history.</p>
      </header>

      {/* Loading */}
      {loading && (
        <div className="flex justify-center items-center py-24">
          <div className="breathing-circle w-12 h-12 bg-secondary/20 rounded-full border border-secondary/40 flex items-center justify-center">
            <span className="w-4 h-4 bg-secondary rounded-full"></span>
          </div>
          <span className="ml-4 font-meta-technical text-meta-technical text-outline uppercase tracking-wider">Retrieving Logs...</span>
        </div>
      )}

      {/* Empty State */}
      {!loading && sessions.length === 0 && (
        <div className="w-full max-w-md mx-auto py-16 text-center animate-settle">
          <div className="glass-card rounded-[32px] p-12 border border-outline-variant flex flex-col items-center">
            <span className="material-symbols-outlined text-4xl text-outline mb-6">hourglass_empty</span>
            <p className="font-headline-sm text-headline-sm text-on-surface mb-2">No archive entries found</p>
            <p className="text-on-surface-variant text-body-md mb-8">Complete a daily check-in to start logging your cognitive state.</p>
            <button 
              className="px-8 py-4 bg-secondary text-on-secondary font-meta-technical text-[12px] uppercase tracking-wider hover:bg-white transition-all duration-300 border border-secondary"
              onClick={onNavigateHome}
            >
              Log Session Init
            </button>
          </div>
        </div>
      )}

      {/* Content — only shown when sessions exist */}
      {!loading && sessions.length > 0 && (
        <div className="space-y-16">
          
          {/* Section 1: Stats Grid */}
          <section className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="glass-card rounded-3xl p-8 flex flex-col justify-between min-h-[160px]">
              <div>
                <span className="material-symbols-outlined text-secondary text-2xl mb-4">analytics</span>
                <h4 className="font-meta-technical text-[10px] text-outline uppercase tracking-widest">TOTAL CHECK-INS</h4>
              </div>
              <p className="font-display-lg text-headline-md text-primary mt-2">{totalCheckins}</p>
            </div>
            
            <div className="glass-card rounded-3xl p-8 flex flex-col justify-between min-h-[160px]">
              <div>
                <span className="material-symbols-outlined text-error text-2xl mb-4">bolt</span>
                <h4 className="font-meta-technical text-[10px] text-outline uppercase tracking-widest">AVERAGE STRESS</h4>
              </div>
              <div>
                <p className="font-display-lg text-headline-md text-primary mt-2">{avgStress}</p>
                <span className="font-meta-technical text-[9px] text-outline">OUT OF 100</span>
              </div>
            </div>

            <div className="glass-card rounded-3xl p-8 flex flex-col justify-between min-h-[160px]">
              <div>
                <span className="material-symbols-outlined text-tertiary text-2xl mb-4">calendar_today</span>
                <h4 className="font-meta-technical text-[10px] text-outline uppercase tracking-widest">BEST DAY</h4>
              </div>
              <div>
                <p className="font-meta-technical text-meta-technical text-tertiary mt-2 uppercase">{bestDay}</p>
                <span className="font-meta-technical text-[9px] text-outline">LOWEST STRESS</span>
              </div>
            </div>

            <div className="glass-card rounded-3xl p-8 flex flex-col justify-between min-h-[160px]">
              <div>
                <span className="material-symbols-outlined text-secondary text-2xl mb-4" style={{ fontVariationSettings: "'FILL' 1" }}>spa</span>
                <h4 className="font-meta-technical text-[10px] text-outline uppercase tracking-widest">TYPICAL STATE</h4>
              </div>
              <div>
                <p className="font-meta-technical text-meta-technical text-secondary mt-2 uppercase">{mostCommonBucket}</p>
                <span className="font-meta-technical text-[9px] text-outline">DOMINANT COGNITIVE STATE</span>
              </div>
            </div>
          </section>

          {/* Section 2: Trend Chart */}
          <section className="space-y-4">
            <h3 className="font-meta-technical text-[11px] text-outline uppercase tracking-widest flex items-center gap-2">
              <span className="w-6 h-[1px] bg-outline"></span> COGNITIVE INDEX OVER TIME
            </h3>
            <div className="glass-card rounded-3xl p-6 md:p-8 h-[400px]">
              <Line ref={chartRef} data={chartData} options={chartOptions} />
            </div>
          </section>

          {/* Section 3: Weekly Progress Bar Columns */}
          <section className="space-y-4">
            <h3 className="font-meta-technical text-[11px] text-outline uppercase tracking-widest flex items-center gap-2">
              <span className="w-6 h-[1px] bg-outline"></span> WEEKLY RHYTHM
            </h3>
            <div className="grid grid-cols-7 gap-4">
              {weekDays.map((day, i) => {
                const daySessions = sessions.filter(s => sameCalendarDay(new Date(s.createdAt), day));
                const isToday = sameCalendarDay(day, today);
                const avgDayStress = daySessions.length
                  ? Math.round(daySessions.reduce((a,s) => a + s.stress, 0) / daySessions.length)
                  : null;
                const barHeight = avgDayStress !== null ? Math.max(8, (avgDayStress / 100) * 120) : 0;
                
                return (
                  <div
                    key={i}
                    className={`glass-card rounded-2xl p-4 flex flex-col items-center justify-between min-h-[220px] transition-all duration-300 ${
                      isToday ? 'border-secondary/40 bg-secondary/5' : 'border-outline-variant/30'
                    }`}
                  >
                    <span className="font-meta-technical text-[11px] text-outline uppercase">{DAY_LABELS[i]}</span>
                    
                    <div className="flex-grow flex items-end justify-center w-full my-4">
                      {avgDayStress === null ? (
                        <span className="font-meta-technical text-[10px] text-outline/30">—</span>
                      ) : (
                        <div className="w-2 rounded-full relative" style={{ height: '120px', background: 'rgba(255,255,255,0.03)' }}>
                          <div
                            className="w-full rounded-full absolute bottom-0 transition-all duration-700"
                            style={{
                              height: `${barHeight}px`,
                              background: stressBarColor(avgDayStress),
                              boxShadow: `0 0 10px ${stressBarColor(avgDayStress)}40`
                            }}
                          />
                        </div>
                      )}
                    </div>
                    
                    <span className="font-meta-technical text-[11px] font-semibold text-on-surface">
                      {avgDayStress !== null ? `${avgDayStress}%` : '—'}
                    </span>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Section 4: Session History */}
          <section className="space-y-6">
            <div className="flex justify-between items-end border-b border-outline-variant/30 pb-4">
              <h3 className="font-meta-technical text-[11px] text-outline uppercase tracking-widest flex items-center gap-2">
                <span className="w-6 h-[1px] bg-outline"></span> SESSION LOG HISTORY
              </h3>
              <span className="font-meta-technical text-[10px] text-outline">{sessions.length} snaps saved</span>
            </div>
            
            <div className="space-y-4">
              {sessions.map(s => (
                <div 
                  key={s._id} 
                  className="glass-card rounded-[20px] p-6 hover:bg-surface-container-low/60 transition-all duration-300 flex flex-col md:flex-row justify-between gap-6"
                >
                  <div className="flex-grow space-y-4">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="font-meta-technical text-[12px] text-outline">{fmtDateTime(s.createdAt)}</span>
                      <span className={`px-3 py-1 rounded-full font-meta-technical text-[9px] uppercase tracking-wider ${bucketBadgeStyleClass(s.bucket)}`}>
                        {s.bucket}
                      </span>
                    </div>
                    {s.moodText && (
                      <p className="font-headline-sm text-[18px] text-on-surface italic font-light">
                        "{s.moodText}"
                      </p>
                    )}
                    <div className="flex items-center gap-6 text-[13px] text-on-surface-variant font-meta-technical">
                      {s.recommendations?.movie?.title && (
                        <span className="flex items-center gap-1.5"><span className="text-secondary">🎬</span> {s.recommendations.movie.title}</span>
                      )}
                      {s.recommendations?.tv?.title && (
                        <span className="flex items-center gap-1.5"><span className="text-tertiary">📺</span> {s.recommendations.tv.title}</span>
                      )}
                      {s.recommendations?.music?.title && (
                        <span className="flex items-center gap-1.5"><span>🎵</span> {s.recommendations.music.title}</span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex md:flex-col justify-between md:justify-center md:items-end gap-4 border-t md:border-t-0 md:border-l border-outline-variant/30 pt-4 md:pt-0 md:pl-8 min-w-[120px]">
                    {[
                      { label: 'stress',    value: s.stress, color: 'text-error' },
                      { label: 'calm',      value: s.calm, color: 'text-tertiary' },
                      { label: 'attention', value: s.attention, color: 'text-secondary' },
                    ].map(m => (
                      <div key={m.label} className="flex md:flex-row flex-col md:items-center justify-between md:w-full gap-2">
                        <span className="font-meta-technical text-[9px] text-outline uppercase tracking-wider">{m.label}</span>
                        <span className={`font-meta-technical text-[13px] font-bold ${m.color}`}>{m.value}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>

        </div>
      )}
    </div>
  );
}

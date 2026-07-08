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

function bucketBadgeStyle(bucket: string): React.CSSProperties {
  switch (bucket) {
    case 'brain-fried':
      return { background: 'rgba(224,102,122,0.1)', border: '1px solid rgba(224,102,122,0.25)', color: '#E0667A' };
    case 'relaxed':
      return { background: 'rgba(124,79,224,0.1)', border: '1px solid rgba(124,79,224,0.25)', color: '#A89FD4' };
    case 'hyper-focused':
      return { background: 'rgba(156,255,107,0.1)', border: '1px solid rgba(156,255,107,0.25)', color: '#9CFF6B' };
    default:
      return { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#8FA67A' };
  }
}

function stressBarColor(stress: number): string {
  if (stress < 35) return '#9CFF6B';
  if (stress <= 65) return '#E8A65C';
  return '#E0667A';
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
        borderColor: '#E0667A',
        backgroundColor: 'transparent',
        tension: 0.4,
        pointRadius: 3,
        pointBackgroundColor: '#E0667A',
      },
      {
        label: 'Calm',
        data: chartSessions.map(s => s.calm),
        borderColor: '#7C4FE0',
        backgroundColor: 'transparent',
        tension: 0.4,
        pointRadius: 3,
        pointBackgroundColor: '#7C4FE0',
      },
      {
        label: 'Attention',
        data: chartSessions.map(s => s.attention),
        borderColor: '#9CFF6B',
        backgroundColor: 'transparent',
        tension: 0.4,
        pointRadius: 3,
        pointBackgroundColor: '#9CFF6B',
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: true,
    animation: { duration: 600 },
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: '#8FA67A',
          font: { family: 'Manrope', size: 12 },
          boxWidth: 12,
          padding: 20,
        },
      },
      tooltip: {
        backgroundColor: 'rgba(14,18,10,0.9)',
        borderColor: 'rgba(255,255,255,0.1)',
        borderWidth: 1,
        titleColor: '#EDF4E2',
        bodyColor: '#8FA67A',
        padding: 10,
      },
    },
    scales: {
      x: {
        grid: { color: 'rgba(255,255,255,0.06)' },
        ticks: { color: '#8FA67A', font: { family: 'Manrope', size: 12 } },
      },
      y: {
        min: 0,
        max: 100,
        grid: { color: 'rgba(255,255,255,0.06)' },
        ticks: { color: '#8FA67A', font: { family: 'Manrope', size: 12 } },
      },
    },
  };

  // ── Weekly data ────────────────────────────────────────
  const weekDays = getWeekDays();
  const DAY_LABELS = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
  const today = new Date();

  return (
    <div className="progress-page">
      {/* Page header */}
      <div className="progress-header">
        <p className="progress-eyebrow">your data</p>
        <h1 className="progress-headline">how you've been doing</h1>
        <p className="progress-subline">every check-in you've done, visualised</p>
      </div>

      {/* Loading */}
      {loading && (
        <div className="progress-loading">
          <span className="progress-loading-text">loading your data</span>
        </div>
      )}

      {/* Empty state */}
      {!loading && sessions.length === 0 && (
        <div className="progress-empty-wrap">
          <div className="progress-empty-card">
            <p className="progress-empty-title">nothing here yet</p>
            <p className="progress-empty-sub">complete a check-in and your data will appear here</p>
            <button className="progress-empty-btn" onClick={onNavigateHome}>
              do a check-in
            </button>
          </div>
        </div>
      )}

      {/* Content — only shown when sessions exist */}
      {!loading && sessions.length > 0 && (
        <>
          {/* ── Section 1: Stats row ── */}
          <div className="progress-stats-grid">
            <div className="stat-card">
              <p className="stat-label">total check-ins</p>
              <p className="stat-value">{totalCheckins}</p>
            </div>
            <div className="stat-card">
              <p className="stat-label">avg stress</p>
              <p className="stat-value">{avgStress}</p>
              <p className="stat-sub">out of 100</p>
            </div>
            <div className="stat-card">
              <p className="stat-label">best day</p>
              <p className="stat-value" style={{ fontSize: '22px' }}>{bestDay}</p>
              <p className="stat-sub">lowest stress</p>
            </div>
            <div className="stat-card">
              <p className="stat-label">most common state</p>
              <p className="stat-value" style={{ fontSize: '22px' }}>{mostCommonBucket}</p>
              <p className="stat-sub">your usual</p>
            </div>
          </div>

          {/* ── Section 2: Trend chart ── */}
          <p className="progress-section-label">stress · calm · attention over time</p>
          <div className="progress-chart-card">
            <Line ref={chartRef} data={chartData} options={chartOptions} />
          </div>

          {/* ── Section 3: Weekly mini bars ── */}
          <p className="progress-section-label">this week</p>
          <div className="progress-week-grid">
            {weekDays.map((day, i) => {
              const daySessions = sessions.filter(s => sameCalendarDay(new Date(s.createdAt), day));
              const isToday = sameCalendarDay(day, today);
              const avgDayStress = daySessions.length
                ? Math.round(daySessions.reduce((a,s) => a + s.stress, 0) / daySessions.length)
                : null;
              const barHeight = avgDayStress !== null ? Math.max(4, (avgDayStress / 100) * 48) : 0;
              return (
                <div
                  key={i}
                  className="week-day-card"
                  style={isToday ? { borderColor: 'rgba(127,255,60,0.35)', background: 'rgba(127,255,60,0.04)' } : {}}
                >
                  <p className="week-day-label">{DAY_LABELS[i]}</p>
                  {avgDayStress === null ? (
                    <span className="week-day-empty">—</span>
                  ) : (
                    <>
                      <div className="week-bar-wrap">
                        <div
                          className="week-bar"
                          style={{
                            height: `${barHeight}px`,
                            background: stressBarColor(avgDayStress),
                          }}
                        />
                      </div>
                      <p className="week-day-value">{avgDayStress}</p>
                    </>
                  )}
                </div>
              );
            })}
          </div>

          {/* ── Section 4: Session history ── */}
          <p className="progress-section-label">check-in history</p>
          <div className="progress-history">
            {sessions.map(s => (
              <div key={s._id} className="history-card">
                <div className="history-left">
                  <div className="history-top-row">
                    <span className="history-time">{fmtDateTime(s.createdAt)}</span>
                    <span className="bucket-badge" style={bucketBadgeStyle(s.bucket)}>
                      {s.bucket}
                    </span>
                  </div>
                  <p className="history-mood-text">{s.moodText}</p>
                  <p className="history-recs">
                    {s.recommendations?.tv?.title && `📺 ${s.recommendations.tv.title}`}
                    {s.recommendations?.music?.title && `  🎵 ${s.recommendations.music.title}`}
                    {s.recommendations?.movie?.title && `  🎬 ${s.recommendations.movie.title}`}
                  </p>
                </div>
                <div className="history-right">
                  {[
                    { label: 'stress',    value: s.stress },
                    { label: 'calm',      value: s.calm },
                    { label: 'attention', value: s.attention },
                  ].map(m => (
                    <div key={m.label} className="history-metric">
                      <span className="history-metric-label">{m.label}</span>
                      <span className="history-metric-value">{m.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

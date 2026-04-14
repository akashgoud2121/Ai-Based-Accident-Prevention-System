import React, { useState, useCallback, useEffect } from 'react'
import Scanner from './components/Scanner'
import BiometricGauge from './components/BiometricGauge'
import { motion, AnimatePresence } from 'framer-motion'
import { Shield, Power, Eye, Coffee, UserCircle, Activity, Sun, Moon, Monitor, Clock } from 'lucide-react'

function App() {
  const [metrics, setMetrics] = useState({ 
    ear: 0, 
    mar: 0, 
    posture: null, 
    status: 'OFFLINE', 
    reason: 'System Standby',
    bpm: 0
  })
  const [isMonitoring, setIsMonitoring] = useState(false)
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString())
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark')

  // Theme Sync
  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.remove('light');
    } else if (theme === 'light') {
      root.classList.add('light');
    } else {
      // System
      const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      root.classList.toggle('light', !isDark);
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Real-time Clock
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString('en-US', { hour12: false }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleMetricsUpdate = useCallback((newMetrics) => {
    if (isMonitoring) {
      setMetrics(newMetrics)
    }
  }, [isMonitoring])

  return (
    <div className="min-h-screen transition-colors duration-500 font-sans selection:bg-accent-copper/20">
      <div className="max-w-[1400px] mx-auto p-4 md:p-8 flex flex-col gap-6">
        
        {/* Automotive Instrument Header */}
        <header className="precision-card p-4 flex flex-wrap justify-between items-center gap-4">
          <div className="flex items-center gap-4">
             <div className="w-12 h-12 bg-surface-muted border border-border rounded-xl flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-accent-copper rounded-full flex items-center justify-center p-1">
                   <div className="w-full h-full bg-accent-copper rounded-full" />
                </div>
             </div>
             <div className="flex flex-col">
                <h1 className="text-sm font-bold tracking-tight">AI Accident Prevention System</h1>
                <div className="flex items-center gap-2">
                   <span className="font-mono text-[9px] text-text-muted">v2.4.1</span>
                   <span className="w-1 h-1 rounded-full bg-text-muted" />
                   <span className="font-mono text-[9px] text-text-muted uppercase tracking-widest">DAS MODULE</span>
                </div>
             </div>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="hidden md:flex items-center gap-3 px-4 py-2 bg-surface-muted border border-border rounded-lg font-mono text-xs text-text-secondary">
               <Clock className="w-3 h-3" />
               <span className="tabular-nums">{currentTime}</span>
            </div>

            {/* Theme Toggle */}
            <div className="flex bg-surface-muted border border-border p-1 rounded-lg">
               <button onClick={() => setTheme('light')} className={`p-1.5 rounded ${theme === 'light' ? 'bg-accent-copper text-white' : 'text-text-muted'}`}><Sun className="w-3.5 h-3.5" /></button>
               <button onClick={() => setTheme('dark')} className={`p-1.5 rounded ${theme === 'dark' ? 'bg-accent-copper text-white' : 'text-text-muted'}`}><Moon className="w-3.5 h-3.5" /></button>
               <button onClick={() => setTheme('system')} className={`p-1.5 rounded ${theme === 'system' ? 'bg-accent-copper text-white' : 'text-text-muted'}`}><Monitor className="w-3.5 h-3.5" /></button>
            </div>

            <div className="flex items-center gap-2 px-4 py-2 bg-surface-muted border border-border rounded-lg">
               <div className={`w-1.5 h-1.5 rounded-full ${isMonitoring ? 'bg-status-safe' : 'bg-text-muted'}`} />
               <span className="font-mono text-[10px] uppercase tracking-widest text-text-secondary">
                  {isMonitoring ? 'Active' : 'Offline'}
               </span>
            </div>
          </div>
        </header>

        {/* Operational Grid */}
        <main className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Driver Camera Module */}
          <div className="lg:col-span-12 xl:col-span-8 flex flex-col gap-4">
            <div className="precision-card p-1 aspect-[4/5] sm:aspect-video md:aspect-auto md:h-[500px] relative overflow-hidden group">
              <div className="absolute top-4 left-4 z-20 flex items-center gap-2">
                 <div className="precision-card px-3 py-1 bg-surface-muted/60 backdrop-blur-sm border-border/10">
                    <span className="font-mono text-[9px] text-text-secondary uppercase tracking-[0.2em]">Driver Camera Feed</span>
                 </div>
                 <div className="precision-card px-3 py-1 bg-surface-muted/60 backdrop-blur-sm border-border/10 hidden sm:block">
                    <span className="font-mono text-[9px] text-text-secondary uppercase tracking-[0.2em]">CAM-01 • 1080P</span>
                 </div>
              </div>

              {isMonitoring ? (
                <Scanner onMetricsUpdate={handleMetricsUpdate} />
              ) : (
                <div className="w-full h-full bg-surface-muted flex flex-col items-center justify-center gap-4">
                  <div className="w-20 h-20 border border-border rounded-full flex items-center justify-center relative">
                     <div className="w-16 h-16 border border-border/50 rounded-full border-dashed animate-[spin_10s_linear_infinite]" />
                     <Power className="w-6 h-6 text-text-muted absolute" />
                  </div>
                  <p className="font-mono text-[10px] text-text-muted uppercase tracking-[0.5em]">engine standby</p>
                </div>
              )}

              {/* HUD Corners */}
              <div className="absolute bottom-4 left-4 w-4 h-4 border-l border-b border-border/30" />
              <div className="absolute bottom-4 right-4 w-4 h-4 border-r border-b border-border/30" />
            </div>

            {/* Critical Status Bar */}
            <div className="precision-card p-6 flex flex-wrap justify-between items-center gap-6">
               <div className="flex gap-12">
                 <div className="flex flex-col gap-2">
                    <span className="precision-title">Driver Condition</span>
                    <div className="flex items-center gap-2">
                       <div className={`w-2 h-2 rounded-full ${
                          metrics.status === 'HIGH RISK' ? 'bg-status-danger animate-ping' : 
                          metrics.status === 'NORMAL' ? 'bg-status-safe' : 'bg-status-warning animate-pulse'
                       }`} />
                       <h3 className={`text-xl font-bold tracking-tight transition-colors duration-500 ${
                          metrics.status === 'HIGH RISK' ? 'text-status-danger' : 
                          metrics.status === 'NORMAL' ? 'text-status-safe' : 'text-status-warning'
                       }`}>{metrics.status}</h3>
                    </div>
                 </div>
                 <div className="w-px h-10 bg-border" />
                 <div className="flex flex-col gap-2">
                    <span className="precision-title">Diagnostic Result</span>
                    <div className="flex items-center gap-2">
                       <div className={`w-2 h-2 rounded-full ${
                          metrics.status === 'HIGH RISK' ? 'bg-status-danger' :
                          metrics.status === 'NORMAL' ? 'bg-status-safe' : 'bg-status-neutral'
                       }`} />
                       <h3 className={`text-xl font-bold tracking-tight transition-colors duration-500 ${
                          metrics.status === 'HIGH RISK' ? 'text-status-danger' :
                          metrics.status === 'NORMAL' ? 'text-status-safe' : 'text-text-secondary'
                       }`}>{metrics.reason}</h3>
                    </div>
                 </div>
               </div>

               <button 
                onClick={() => setIsMonitoring(!isMonitoring)}
                className="w-full md:w-auto px-12 py-4 btn-primary font-mono text-[11px] uppercase tracking-[0.2em]"
               >
                 {isMonitoring ? 'Terminate Monitoring' : 'Start System'}
               </button>
            </div>
          </div>

          {/* Precision Telemetry Panel */}
          <div className="lg:col-span-12 xl:col-span-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-1 gap-4">
            
            <BiometricGauge label="Eye Tracking" value={metrics.ear} max={0.4} icon={Eye} />
            <BiometricGauge label="Mouth Tracking" value={metrics.mar} max={0.5} icon={Coffee} />
            
            <div className="precision-card p-6 flex flex-col gap-6">
                <div className="flex items-center gap-3">
                   <div className="w-10 h-10 rounded-lg bg-surface-muted border border-border flex items-center justify-center">
                     <UserCircle className="w-4 h-4 text-text-muted" />
                   </div>
                   <div className="flex flex-col">
                      <span className="precision-title">Stability Feedback</span>
                      <span className="text-sm font-bold text-status-safe border-b border-status-safe/30 inline-block">{metrics.posture?.state || "Normal"}</span>
                   </div>
                </div>
                <div className="space-y-4">
                   <div className="flex justify-between items-end">
                      <span className="precision-title italic">Lateral Shift</span>
                      <span className="precision-value text-lg">{(metrics.posture?.horizontalOffsetRatio || 0).toFixed(3)}</span>
                   </div>
                   <div className="h-1 w-full bg-border rounded-full overflow-hidden">
                      <motion.div 
                        animate={{ 
                          width: `${Math.min(Math.abs(metrics.posture?.horizontalOffsetRatio || 0) * 200, 100)}%`,
                          backgroundColor: Math.abs(metrics.posture?.horizontalOffsetRatio || 0) > 0.18 ? 'var(--status-warning)' : 'var(--status-safe)'
                        }}
                        className="h-full transition-colors duration-500"
                      />
                   </div>
                </div>
            </div>

            {/* New Metrics: Yaw & Blink Rate */}
            <div className="grid grid-cols-2 gap-4">
               <div className="precision-card p-5 flex flex-col gap-3">
                  <span className="precision-title">Head Pose</span>
                  <div className="flex justify-between items-end">
                     <span className="font-mono text-[10px] text-text-muted">YAW</span>
                     <span className="precision-value">{(metrics.posture?.yaw || 0).toFixed(1)}°</span>
                  </div>
                  <div className="h-1 w-full bg-border rounded-full overflow-hidden">
                      <div 
                        style={{ 
                          width: '40%', 
                          marginLeft: '30%',
                          backgroundColor: 'var(--status-neutral)' 
                        }}
                        className="h-full opacity-40"
                      />
                  </div>
               </div>

               <div className="precision-card p-5 flex flex-col gap-3">
                  <span className="precision-title">Blink Rate</span>
                  <div className="flex justify-between items-end">
                     <span className="font-mono text-[10px] text-text-muted">/MIN</span>
                     <span className="precision-value">{metrics.bpm || 18}</span>
                  </div>
                  <div className="h-1 w-full bg-border rounded-full overflow-hidden">
                      <motion.div 
                        animate={{ 
                           width: `${Math.min((metrics.bpm || 18) * 3, 100)}%`,
                           backgroundColor: 'var(--status-safe)' 
                        }}
                        className="h-full"
                      />
                  </div>
               </div>
            </div>

          </div>
        </main>
      </div>
    </div>
  )
}

export default App

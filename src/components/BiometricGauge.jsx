import React from 'react';
import { motion } from 'framer-motion';

const BiometricGauge = ({ label, value, max, icon: Icon }) => {
  const percentage = Math.min((value / max) * 100, 100);
  
  // Automotive Precision Safety Encoding
  const getStatusColor = () => {
    if (label.toLowerCase().includes('fatigue') || label.toLowerCase().includes('perclos')) {
      if (value > 15) return 'var(--status-danger)'; // Critical Red
      if (value > 8) return 'var(--status-warning)'; // Alert Copper
      return 'var(--status-safe)'; // Normal Sage
    } else if (label.toLowerCase().includes('eye')) {
      if (value < 0.18 && value > 0) return 'var(--status-danger)'; // Red for extreme closure
      if (value < 0.25 && value > 0) return 'var(--status-warning)'; // Copper for drowsiness
      return 'var(--status-safe)'; // Sage for normal
    } else {
      if (value > 0.38) return 'var(--status-warning)';
      return 'var(--status-safe)';
    }
  };

  const activeColor = getStatusColor();

  return (
    <div className="precision-card p-5 flex flex-col gap-4 relative overflow-hidden group">
      <div className="flex justify-between items-start">
        <div className="flex flex-col gap-1">
          <span className="precision-title">Telemetry</span>
          <span className="text-base font-bold tracking-tight text-text-primary">{label}</span>
        </div>
        <div className="w-8 h-8 rounded-lg bg-surface-muted border border-border flex items-center justify-center">
           {Icon ? <Icon className="w-3.5 h-3.5 text-text-muted" /> : <Activity className="w-3.5 h-3.5 text-text-muted" />}
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex justify-between items-end">
           <span className="precision-title italic">Measure</span>
           <span className="precision-value text-xl leading-none transition-colors duration-500" style={{ color: activeColor }}>
             {value.toFixed(2)}
           </span>
        </div>
        
        {/* Understated Progress Bar */}
        <div className="h-1 w-full bg-border/40 rounded-full overflow-hidden">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ 
              width: `${percentage}%`,
              backgroundColor: activeColor 
            }}
            transition={{ type: "spring", stiffness: 100, damping: 20 }}
            className="h-full transition-colors duration-500"
          />
        </div>
      </div>
    </div>
  );
};

export default BiometricGauge;

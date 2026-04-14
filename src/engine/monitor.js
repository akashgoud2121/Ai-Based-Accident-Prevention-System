/**
 * monitor.js
 * 
 * Port of StableFatigueMonitor from Python.
 * Handles dual-model metrics (Face + Pose).
 */

export class StabilityMonitor {
  constructor(config = {}) {
    this.fps = config.fps || 30;
    this.earAlpha = config.earAlpha || 0.25;
    this.marAlpha = config.marAlpha || 0.20;
    
    this.earClosedThreshold = config.earClosedThreshold || 0.205;
    this.earOpenThreshold = config.earOpenThreshold || 0.235;
    this.marYawnThreshold = config.marYawnThreshold || 0.38;
    
    this.eyeWarningSeconds = config.eyeWarningSeconds || 0.40;
    this.eyeSleepSeconds = config.eyeSleepSeconds || 1.00;
    
    this.smoothEar = null;
    this.smoothMar = null;
    this.eyeState = "OPEN";
    this.closedEyeFrames = 0;
    this.yawnFrames = 0;
    
    this.currentStatus = "NORMAL";
    this.currentReason = "Stable";
    
    // Blink Frequency Tracking
    this.blinkHistory = []; // Timestamps of blinks
    this.lastBlinkTime = 0;
    this.isBlinkActive = false;

    // PERCLOS (Percentage of Eye Closure) Logic
    this.perclosWindowSize = 150; // 5 seconds @ 30fps
    this.eyeStateHistory = new Array(this.perclosWindowSize).fill(0); // 0 = open, 1 = closed
    this.historyPointer = 0;
  }

  ema(oldVal, newVal, alpha) {
    if (newVal === null || newVal === undefined) return oldVal;
    if (oldVal === null) return newVal;
    return alpha * newVal + (1.0 - alpha) * oldVal;
  }

  update(metrics) {
    const { ear, mar, posture } = metrics;

    this.smoothEar = this.ema(this.smoothEar, ear, this.earAlpha);
    this.smoothMar = this.ema(this.smoothMar, mar, this.marAlpha);

    // Blink Detection (Fast dip in EAR)
    if (ear < 0.18 && !this.isBlinkActive) {
      this.isBlinkActive = true;
      const now = Date.now();
      // De-bounce (max 4 blinks per second)
      if (now - this.lastBlinkTime > 250) {
        this.blinkHistory.push(now);
        this.lastBlinkTime = now;
      }
    } else if (ear > 0.22) {
      this.isBlinkActive = false;
    }

    // Cleanup old blinks (> 60s)
    const sixtySecsAgo = Date.now() - 60000;
    this.blinkHistory = this.blinkHistory.filter(t => t > sixtySecsAgo);
    const bpm = this.blinkHistory.length;

    // Eye state with hysteresis (Longer closures)
    const instantEar = ear || 0;
    
    // Status Sensitivity Tuning: Finding the "Precision Sweet Spot"
    // We increase thresholds slightly to ensure closure is detected reliably.
    const closedThreshold = 0.22; 
    const openThreshold = 0.26;

    // Zero-Confidence Handling: If EAR is exactly 0
    if (instantEar > 0) {
      if (this.eyeState !== "CLOSED") {
        if (instantEar < closedThreshold) {
          this.eyeState = "CLOSED";
        }
      } else {
        if (instantEar > openThreshold) {
          this.eyeState = "OPEN";
        }
      }
    } else {
      // If tracker is lost, we set state to UNKNOWN.
      // We don't record it as CLOSED in history here, 
      // but we let the evaluate function check posture.
      this.eyeState = "UNKNOWN";
    }

    // Update PERCLOS history (5s window)
    this.eyeStateHistory[this.historyPointer] = this.eyeState === "CLOSED" ? 1 : 0;
    this.historyPointer = (this.historyPointer + 1) % this.perclosWindowSize;

    if (this.eyeState === "CLOSED") {
      this.closedEyeFrames++;
    } else {
      this.closedEyeFrames = 0;
    }

    // Yawn tracking
    if (this.smoothMar > this.marYawnThreshold) {
      this.yawnFrames++;
    } else {
      this.yawnFrames = 0;
    }

    return this.evaluate(posture);
  }

  evaluate(posture) {
    const closedSeconds = this.closedEyeFrames / this.fps;
    const yawnSeconds = this.yawnFrames / this.fps;
    
    const closedFramesInWindow = this.eyeStateHistory.reduce((a, b) => a + b, 0);
    const perclos = (closedFramesInWindow / this.perclosWindowSize) * 100;

    let status = "NORMAL";
    let reason = "Monitoring Active";

    // Priority 1: Physical Collapse (Posture - The most reliable signal during sleep)
    if (posture && posture.state !== "NORMAL") {
      status = posture.state.includes("FALLEN") ? "HIGH RISK" : "WARNING";
      reason = `Posture: ${posture.state}`;
    } 
    // Priority 2: Micro-sleep (Instant Threat)
    else if (closedSeconds >= this.eyeSleepSeconds) {
      status = "HIGH RISK";
      reason = "Micro-sleep Pattern";
    }
    // Priority 3: PERCLOS (Accumulated Fatigue)
    else if (perclos > 15) {
      status = "HIGH RISK";
      reason = "Extreme Fatigue (PERCLOS)";
    }
    // Priority 4: Inferred Risk (No Eye Data + Previous State)
    else if (this.eyeState === "UNKNOWN" && closedSeconds > 0) {
       status = "WARNING";
       reason = "Signal Lost (Risk Detected)";
    }
    // Priority 5: Drowsiness / Heavy eyes
    else if (closedSeconds >= this.eyeWarningSeconds) {
      status = "WARNING";
      reason = "Fatigue Indicators";
    }
    // Priority 6: Tracker Visibility
    else if (this.eyeState === "UNKNOWN") {
      status = "NORMAL";
      reason = "Visibility Low";
    }
    // Priority 6: Yawning
    else if (yawnSeconds > 1.2) {
      status = "WARNING";
      reason = "Frequent Yawning";
    }

    this.currentStatus = status;
    this.currentReason = reason;

    return {
      status,
      reason,
      smoothEar: this.smoothEar || 0,
      smoothMar: this.smoothMar || 0,
      closedSeconds,
      yawnSeconds,
      bpm: this.blinkHistory.length,
      perclos: perclos
    };
  }
}

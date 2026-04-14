import React, { useRef, useEffect, useState } from 'react';
import { LANDMARK_INDICES, extractPoints, computeEAR, computeMAR, computePostureMetrics } from '../engine/processor';
import { StabilityMonitor } from '../engine/monitor';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw } from 'lucide-react';

const Scanner = ({ onMetricsUpdate }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const monitorRef = useRef(new StabilityMonitor({ fps: 30 }));
  const [isLoaded, setIsLoaded] = useState(false);

  // Persistence for the callback to prevent closure staleness
  const metricsCallback = useRef(onMetricsUpdate);
  useEffect(() => {
    metricsCallback.current = onMetricsUpdate;
  }, [onMetricsUpdate]);

  useEffect(() => {
    const FaceMesh = window.FaceMesh;
    const Pose = window.Pose;
    const Camera = window.Camera;

    if (!FaceMesh || !Pose || !Camera) return;

    const faceMesh = new FaceMesh({
      locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`,
    });

    const pose = new Pose({
      locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`,
    });

    faceMesh.setOptions({ 
      maxNumFaces: 1, 
      refineLandmarks: false, 
      minDetectionConfidence: 0.5, 
      minTrackingConfidence: 0.5 
    });

    pose.setOptions({ 
      modelComplexity: 0, 
      smoothLandmarks: true, 
      minDetectionConfidence: 0.5, 
      minTrackingConfidence: 0.5 
    });

    let latestPoseLandmarks = null;
    let frameCount = 0;

    pose.onResults((results) => {
      latestPoseLandmarks = results.poseLandmarks;
    });

    faceMesh.onResults((results) => {
      if (!canvasRef.current || !videoRef.current) return;
      const canvasCtx = canvasRef.current.getContext('2d');
      canvasCtx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      
      let finalMetrics = { ear: 0, mar: 0, posture: null, status: 'NO FACE', reason: 'Scanning...', bpm: 0 };

      if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
        const landmarks = results.multiFaceLandmarks[0];
        const leftEye = extractPoints(landmarks, LANDMARK_INDICES.LEFT_EYE);
        const rightEye = extractPoints(landmarks, LANDMARK_INDICES.RIGHT_EYE);
        const mouth = extractPoints(landmarks, LANDMARK_INDICES.MOUTH);
        
        const ear = (computeEAR(leftEye) + computeEAR(rightEye)) / 2.0;
        const mar = computeMAR(mouth);
        const posture = computePostureMetrics(latestPoseLandmarks);
        
        const monitorResult = monitorRef.current.update({ ear, mar, posture });
        
        finalMetrics = {
          ear,
          mar,
          posture,
          status: monitorResult.status,
          reason: monitorResult.reason,
          bpm: monitorResult.bpm,
          perclos: monitorResult.perclos,
          timestamp: Date.now()
        };

        drawMinimalHUD(canvasCtx, landmarks, latestPoseLandmarks);
        if (!isLoaded) setIsLoaded(true);
      } else {
        const posture = computePostureMetrics(latestPoseLandmarks);
        if (posture && posture.state !== "NORMAL") {
           const monitorResult = monitorRef.current.update({ ear: 0, mar: 0, posture });
           finalMetrics = {
             ear: 0, mar: 0, posture,
             status: monitorResult.status,
             reason: monitorResult.reason,
             bpm: monitorResult.bpm || 0,
             perclos: monitorResult.perclos || 0,
             timestamp: Date.now()
           };
        } else {
           finalMetrics = {
             ear: 0, mar: 0, posture: null,
             status: 'NO FACE',
             reason: 'Driver Missing',
             bpm: 0,
             perclos: 0,
             timestamp: Date.now()
           };
        }
      }

      metricsCallback.current(finalMetrics);
    });

    let isActive = true;

    const camera = new Camera(videoRef.current, {
      onFrame: async () => {
        if (!isActive || !videoRef.current || videoRef.current.readyState < 2) return;
        frameCount++;
        try {
          await faceMesh.send({ image: videoRef.current });
          if (isActive && frameCount % 6 === 0) {
             await pose.send({ image: videoRef.current });
          }
        } catch (e) {
          if (isActive) console.error("Vision Process Error:", e);
        }
      },
      width: 640,
      height: 480,
    });
    camera.start();

    return () => {
      isActive = false;
      camera.stop();
      faceMesh.close();
      pose.close();
    };
  }, []);

  const drawSensingFrame = (ctx) => {
    const size = 30;
    const padding = 20;
    const width = ctx.canvas.width;
    const height = ctx.canvas.height;
    
    // Automotive Copper Accent for Brackets
    ctx.strokeStyle = '#c4874a';
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.4;

    // Top Left
    ctx.beginPath();
    ctx.moveTo(padding, padding + size); ctx.lineTo(padding, padding); ctx.lineTo(padding + size, padding);
    ctx.stroke();

    // Top Right
    ctx.beginPath();
    ctx.moveTo(width - padding - size, padding); ctx.lineTo(width - padding, padding); ctx.lineTo(width - padding, padding + size);
    ctx.stroke();

    // Bottom Left
    ctx.beginPath();
    ctx.moveTo(padding, height - padding - size); ctx.lineTo(padding, height - padding); ctx.lineTo(padding + size, height - padding);
    ctx.stroke();

    // Bottom Right
    ctx.beginPath();
    ctx.moveTo(width - padding - size, height - padding); ctx.lineTo(width - padding, height - padding); ctx.lineTo(width - padding, height - padding - size);
    ctx.stroke();
    
    ctx.globalAlpha = 1.0;
  };

  const drawMinimalHUD = (ctx, face, pose) => {
    drawSensingFrame(ctx);
    
    ctx.save();
    ctx.scale(-1, 1);
    ctx.translate(-ctx.canvas.width, 0);
    
    // UI HUD Color - Muted Slate
    ctx.fillStyle = '#64748b'; 
    ctx.globalAlpha = 0.6;
    ctx.font = '700 8px DM Sans, sans-serif';

    const drawPoint = (p, label) => {
      if (!p) return;
      const x = p.x * ctx.canvas.width;
      const y = p.y * ctx.canvas.height;
      
      ctx.beginPath();
      ctx.arc(x, y, 2, 0, 2 * Math.PI);
      ctx.fill();

      // Label (Quiet Typography)
      ctx.save();
      ctx.scale(-1, 1);
      const isLeftSide = label.toLowerCase().includes('left');
      ctx.textAlign = isLeftSide ? 'right' : 'left';
      const offset = isLeftSide ? -8 : 8;
      ctx.fillText(label.toUpperCase(), -x + offset, y + 3);
      ctx.restore();
    };

    if (face) {
      drawPoint(face[33], 'Eye.R');
      drawPoint(face[263], 'Eye.L'); 
    }
    if (pose) {
      drawPoint(pose[11], 'Shoulder.L');
      drawPoint(pose[12], 'Shoulder.R'); 
    }
    ctx.restore();
  };

  return (
    <div className="relative w-full h-full bg-surface-muted flex items-center justify-center">
      <video ref={videoRef} className="w-full h-full object-cover scale-x-[-1] opacity-100" autoPlay muted />
      <canvas ref={canvasRef} className="absolute top-0 left-0 w-full h-full pointer-events-none" width={640} height={480} />
      
      {!isLoaded && (
        <div className="absolute inset-0 bg-[#0f0e0d]/80 backdrop-blur-md flex items-center justify-center">
           <RefreshCw className="w-6 h-6 text-[#c4874a] animate-spin" />
        </div>
      )}
    </div>
  );
};

export default Scanner;

/**
 * processor.js
 * 
 * Logic to calculate EAR, MAR, and Posture Metrics.
 */

export const euclideanDistance = (p1, p2) => {
  return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
};

export const computeEAR = (eyePoints) => {
  if (!eyePoints || eyePoints.length !== 6) return 0.0;
  const [p1, p2, p3, p4, p5, p6] = eyePoints;
  const v1 = euclideanDistance(p2, p6);
  const v2 = euclideanDistance(p3, p5);
  const h = euclideanDistance(p1, p4);
  if (h === 0) return 0.0;
  return (v1 + v2) / (2.0 * h);
};

export const computeMAR = (mouthPoints) => {
  if (!mouthPoints || mouthPoints.length !== 6) return 0.0;
  const [leftCorner, upperOuter, upperInner, rightCorner, lowerInner, lowerOuter] = mouthPoints;
  const h = euclideanDistance(leftCorner, rightCorner);
  if (h === 0) return 0.0;
  const v1 = euclideanDistance(upperOuter, lowerOuter);
  const v2 = euclideanDistance(upperInner, lowerInner);
  return (v1 + v2) / (2.0 * h);
};

/**
 * Ported from upper_body_pose_detector.py
 * Calculates posture state based on Nose and Shoulder landmarks.
 */
export const computePostureMetrics = (poseLandmarks) => {
  if (!poseLandmarks || poseLandmarks.length < 13) return null;

  const nose = poseLandmarks[0];
  const leftShoulder = poseLandmarks[11];
  const rightShoulder = poseLandmarks[12];

  if (!nose || !leftShoulder || !rightShoulder) return null;

  const shoulderMidX = (leftShoulder.x + rightShoulder.x) / 2.0;
  const shoulderMidY = (leftShoulder.y + rightShoulder.y) / 2.0;
  const shoulderWidth = euclideanDistance(leftShoulder, rightShoulder);

  if (shoulderWidth < 0.01) return null;

  // Positive means head is above shoulders
  const headHeightRatio = (shoulderMidY - nose.y) / shoulderWidth;
  // Head horizontal shift relative to shoulder center
  const horizontalOffsetRatio = (nose.x - shoulderMidX) / shoulderWidth;
  
  // Head Yaw Calculation (Estimated by nose horizontal displacement between ears/shoulders)
  // Positive = Right, Negative = Left
  const yaw = horizontalOffsetRatio * 20.0; // Scaled estimate for degrees

  let state = "NORMAL";
  if (headHeightRatio < 0.05) state = "FALLEN FORWARD";
  else if (headHeightRatio < 0.16) state = "FRONT SLUMP";
  else if (horizontalOffsetRatio <= -0.35) state = "FALLEN RIGHT";
  else if (horizontalOffsetRatio >= 0.35) state = "FALLEN LEFT";
  else if (horizontalOffsetRatio <= -0.18) state = "RIGHT SLUMP";
  else if (horizontalOffsetRatio >= 0.18) state = "LEFT SLUMP";

  return {
    headHeightRatio,
    horizontalOffsetRatio,
    yaw,
    state,
    nose,
    leftShoulder,
    rightShoulder
  };
};

// Indices for MediaPipe Face Mesh
export const LANDMARK_INDICES = {
  LEFT_EYE: [33, 160, 158, 133, 153, 144],
  RIGHT_EYE: [362, 385, 387, 263, 373, 380],
  MOUTH: [61, 13, 81, 291, 178, 14]
};

export const extractPoints = (landmarks, indices) => {
  return indices.map(idx => landmarks[idx]);
};

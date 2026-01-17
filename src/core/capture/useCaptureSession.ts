import { useState, useRef, useEffect } from 'react';
import { Quaternion, Vector3 } from 'three';
import { degToRad } from '../../utils/math';
import { poseEstimator } from '../pose/PoseEstimator';

export interface CaptureTarget {
    id: number;
    pitch: number;
    yaw: number;
    vector: Vector3;
    captured: boolean;
}

export interface CapturedFrame {
    id: string; // uuid
    targetId: number;
    imageUrl: string;
    metadata: {
        timestamp: number;
        orientation: { alpha: number; beta: number; gamma: number };
    };
    features?: any;
}

// Generate targets
const generateTargets = (): CaptureTarget[] => {
    const t: CaptureTarget[] = [];
    let id = 0;
    const bands = [
        { pitch: 0, count: 12 },
        { pitch: 30, count: 8 },
        { pitch: -30, count: 8 },
        { pitch: 60, count: 4 },
        { pitch: -60, count: 4 },
        { pitch: 90, count: 1 },
        { pitch: -90, count: 1 },
    ];

    bands.forEach(band => {
        const pitchRad = degToRad(band.pitch);
        const y = Math.sin(pitchRad);
        const r = Math.cos(pitchRad);

        for (let i = 0; i < band.count; i++) {
            const yawRad = (i / band.count) * Math.PI * 2;
            const x = Math.sin(yawRad) * r;
            const z = -Math.cos(yawRad) * r;
            const v = new Vector3(x, y, z);
            t.push({ id: id++, pitch: band.pitch, yaw: (i / band.count) * 360, vector: v, captured: false });
        }
    });
    return t;
};

export function useCaptureSession(
    currentOrientation: Quaternion,
    takePhoto: () => Promise<string | null>
) {
    const [targets, setTargets] = useState<CaptureTarget[]>(generateTargets());
    const [capturedFrames, setCapturedFrames] = useState<CapturedFrame[]>([]);
    const [nearestTargetId, setNearestTargetId] = useState<number | null>(null);
    const [isCapturing, setIsCapturing] = useState(false);

    // Camera forward vector
    const forward = useRef(new Vector3(0, 0, -1));

    useEffect(() => {
        if (isCapturing) return;

        // 1. Calculate camera direction
        const camDir = forward.current.clone().applyQuaternion(currentOrientation);

        // 2. Find nearest non-captured target
        let minDist = Infinity;
        let bestId = -1;

        targets.forEach(t => {
            if (t.captured) return;
            const dist = t.vector.distanceTo(camDir); // Chord distance on unit sphere
            if (dist < minDist) {
                minDist = dist;
                bestId = t.id;
            }
        });

        setNearestTargetId(bestId);

        // 3. Check threshold
        if (bestId !== -1 && minDist < 0.1) {
            setIsCapturing(true);

            setTimeout(async () => {
                const url = await takePhoto();
                if (url) {
                    const frame: CapturedFrame = {
                        id: crypto.randomUUID(),
                        targetId: bestId,
                        imageUrl: url,
                        metadata: {
                            timestamp: Date.now(),
                            orientation: { alpha: 0, beta: 0, gamma: 0 } // Fixme: pass real euler if needed
                        }
                    };

                    // Optimistic update
                    setCapturedFrames(prev => [...prev, frame]);
                    setTargets(prev => prev.map(t => t.id === bestId ? { ...t, captured: true } : t));

                    // Run Feature Detection in background
                    poseEstimator.extractFeatures(frame).then(features => {
                        console.log(`Features detected for frame ${frame.id}:`, features);
                        setCapturedFrames(prev => prev.map(f => f.id === frame.id ? { ...f, features } : f));
                    }).catch(e => console.error("Feature extraction failed:", e));
                }
                setIsCapturing(false);
            }, 500);
        }

    }, [currentOrientation, targets, isCapturing, takePhoto]);

    return { targets, capturedFrames, nearestTargetId, isCapturing };
}

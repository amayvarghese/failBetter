import { useState, useEffect, useCallback } from 'react';
import { degToRad } from '../../utils/math';
import { Quaternion, Euler } from 'three';

export interface OrientationState {
    alpha: number; // Z-axis rotation [0, 360) (Compass)
    beta: number;  // X-axis rotation [-180, 180) (Front/Back tilt)
    gamma: number; // Y-axis rotation [-90, 90) (Left/Right tilt)
    quaternion: Quaternion;
    isAvailable: boolean;
    permissionGranted: boolean;
}

export const useOrientation = () => {
    const [orientation, setOrientation] = useState<OrientationState>({
        alpha: 0,
        beta: 0,
        gamma: 0,
        quaternion: new Quaternion(),
        isAvailable: false,
        permissionGranted: false,
    });

    const handleOrientation = useCallback((event: DeviceOrientationEvent) => {
        const alpha = event.alpha || 0;
        const beta = event.beta || 0;
        const gamma = event.gamma || 0;

        // Convert to Quaternion
        // DeviceOrientation uses Z-X-Y intrinsic order?
        // Three.js Euler default is XYZ. We need to match browser spec.
        // Spec: Rotate Z (alpha), then X (beta), then Y (gamma).

        const euler = new Euler(
            degToRad(beta),
            degToRad(alpha),
            -degToRad(gamma),
            'YXZ' // Intrinsic ZXY? Web/Three conversion is tricky.
            // Standard Web conversion:
            // alpha: Z, beta: X, gamma: Y
        );
        // Note: Accurate sensor fusion is hard. We will use a simplified mapping for now
        // and rely on relative changes or "deviceorientationabsolute" if available.

        // For now, just store raw values and a basic quaternion
        const q = new Quaternion();
        q.setFromEuler(euler);

        setOrientation({
            alpha,
            beta,
            gamma,
            quaternion: q,
            isAvailable: true,
            permissionGranted: true,
        });
    }, []);

    const requestPermission = async () => {
        if (typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
            try {
                const permission = await (DeviceOrientationEvent as any).requestPermission();
                if (permission === 'granted') {
                    window.addEventListener('deviceorientation', handleOrientation);
                    return true;
                }
            } catch (e) {
                console.error(e);
            }
            return false;
        } else {
            // Non-iOS or older devices
            window.addEventListener('deviceorientation', handleOrientation);
            return true;
        }
    };

    useEffect(() => {
        // Check if permission is needed (iOS 13+)
        // If not needed, listener might already work, but usually we wait for user interaction to request.
        // We'll expose requestPermission.

        return () => {
            window.removeEventListener('deviceorientation', handleOrientation);
        };
    }, [handleOrientation]);

    return { orientation, requestPermission };
};

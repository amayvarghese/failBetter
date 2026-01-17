import React, { useState } from 'react';
import { CameraPreview } from './CameraPreview';
import { useOrientation } from '../../core/sensors/useOrientation';
import { SphericalGuidance } from './SphericalGuidance';
import { useCamera } from '../../core/camera/useCamera';
import { useCaptureSession } from '../../core/capture/useCaptureSession';

export const CaptureScreen: React.FC = () => {
    const { orientation, requestPermission } = useOrientation();
    const { videoRef, error, isLoading, takePhoto } = useCamera();

    const { targets, nearestTargetId, capturedFrames, isCapturing } = useCaptureSession(
        orientation.quaternion,
        takePhoto
    );

    const [permissionRequested, setPermissionRequested] = useState(false);

    const handleStart = async () => {
        await requestPermission();
        setPermissionRequested(true);
    };

    return (
        <div style={{ position: 'relative', width: '100%', height: '100%' }}>
            <CameraPreview videoRef={videoRef} error={error} isLoading={isLoading} />

            {/* 3D Guidance */}
            <SphericalGuidance
                deviceQuaternion={orientation.quaternion}
                targets={targets}
                nearestTargetId={nearestTargetId}
            />

            {/* Flash Effect */}
            {isCapturing && (
                <div style={{
                    position: 'absolute', inset: 0, backgroundColor: 'white',
                    opacity: 0.8, transition: 'opacity 0.1s', pointerEvents: 'none'
                }} />
            )}

            {/* Overlay UI */}
            <div style={{ position: 'absolute', top: 20, left: 20, color: 'white', zIndex: 10, textShadow: '0px 0px 5px black' }}>
                <div>Alpha: {orientation.alpha.toFixed(1)}</div>
                <div>Beta: {orientation.beta.toFixed(1)}</div>
                <div>Captured: {capturedFrames.length} / {targets.length}</div>

                {!permissionRequested && (
                    <button
                        onClick={handleStart}
                        style={{
                            marginTop: 20, padding: '10px 20px', fontSize: '16px',
                            background: 'white', color: 'black', border: 'none', borderRadius: '8px',
                            cursor: 'pointer'
                        }}
                    >
                        Start / Enable Sensors
                    </button>
                )}
            </div>
        </div>
    );
};

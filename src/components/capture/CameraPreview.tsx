import React from 'react';

interface Props {
    videoRef: React.RefObject<HTMLVideoElement | null>;
    error: string | null;
    isLoading: boolean;
}

export const CameraPreview: React.FC<Props> = ({ videoRef, error, isLoading }) => {
    return (
        <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', zIndex: 0, background: '#222' }}>
            {error && (
                <div style={{ color: 'red', zIndex: 100, position: 'absolute', top: '50%', width: '100%', textAlign: 'center' }}>
                    Camera Error: {error}
                </div>
            )}
            {/* Video element fills screen */}
            <video
                ref={videoRef}
                autoPlay
                playsInline
                webkit-playsinline="true" // iOS specific
                muted
                style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    display: isLoading ? 'none' : 'block'
                }}
            />
            {isLoading && (
                <div style={{
                    position: 'absolute', inset: 0, backgroundColor: 'black', color: 'white',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1
                }}>
                    Loading Camera...
                </div>
            )}
        </div>
    );
};

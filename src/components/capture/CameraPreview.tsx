import React from 'react';

interface Props {
    videoRef: React.RefObject<HTMLVideoElement | null>;
    error: string | null;
    isLoading: boolean;
}

export const CameraPreview: React.FC<Props> = ({ videoRef, error, isLoading }) => {
    if (error) {
        return (
            <div style={{
                position: 'absolute', inset: 0, display: 'flex',
                alignItems: 'center', justifyContent: 'center',
                backgroundColor: '#000', color: 'red', zIndex: 0
            }}>
                <p>{error}</p>
            </div>
        );
    }

    return (
        <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', zIndex: 0 }}>
            {/* Video element fills screen */}
            <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    transform: 'scaleX(1)',
                }}
            />
            {isLoading && (
                <div style={{
                    position: 'absolute', inset: 0, backgroundColor: 'black',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                    Loading Camera...
                </div>
            )}
        </div>
    );
};

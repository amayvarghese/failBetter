import { useEffect, useState, useRef } from 'react';

export interface CameraState {
    stream: MediaStream | null;
    error: string | null;
    isLoading: boolean;
}

export function useCamera() {
    const [state, setState] = useState<CameraState>({
        stream: null,
        error: null,
        isLoading: true,
    });

    const videoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        let mounted = true;

        async function initCamera() {
            try {
                // Try environment camera first
                const constraints: MediaStreamConstraints = {
                    audio: false,
                    video: {
                        facingMode: { ideal: 'environment' },
                        width: { ideal: 1920 },
                        height: { ideal: 1080 }
                    }
                };

                console.log('Requesting camera with constraints:', constraints);
                const stream = await navigator.mediaDevices.getUserMedia(constraints);

                if (mounted) {
                    if (videoRef.current) {
                        videoRef.current.srcObject = stream;
                    }
                    setState({ stream, error: null, isLoading: false });
                }
            } catch (err: any) {
                if (mounted) {
                    console.error("Camera access failed:", err);
                    // Fallback or explicit error
                    let errorMessage = 'Could not access camera.';
                    if (err.name === 'NotAllowedError') errorMessage = 'Permission denied. Please allow camera access.';
                    else if (err.name === 'NotFoundError') errorMessage = 'No camera found.';

                    setState({ stream: null, error: errorMessage, isLoading: false });
                }
            }
        }

        initCamera();

        return () => {
            mounted = false;
            state.stream?.getTracks().forEach(track => track.stop());
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Run once on mount

    const takePhoto = async (): Promise<string | null> => {
        if (!videoRef.current) return null;
        const video = videoRef.current;

        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        const ctx = canvas.getContext('2d');
        if (!ctx) return null;

        ctx.drawImage(video, 0, 0);
        // return base64 for now, or blob
        return canvas.toDataURL('image/jpeg', 0.9);
    };

    return { videoRef, takePhoto, ...state };
}

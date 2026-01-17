import { CapturedFrame } from "../capture/useCaptureSession";

// We need a way to load the worker.
// In Vite: new Worker(new URL('../../workers/cv.worker.ts', import.meta.url), { type: 'classic' })
// 'classic' is needed for importScripts to work relatively easily, but 'module' is standard.
// If using 'module', importScripts is not available, we use correct imports.
// But OpenCV.js is a big UMD file. 'classic' + importScripts is safest for big libs.

export class PoseEstimator {
    private worker: Worker;
    private initialized = false;
    private callbacks = new Map<string, (data: any) => void>();

    constructor() {
        this.worker = new Worker(new URL('../../workers/cv.worker.ts', import.meta.url), { type: 'classic' });

        this.worker.onmessage = (e) => {
            const { type, id, result, error } = e.data;
            if (this.callbacks.has(id)) {
                if (error) console.error("Worker Error:", error);
                this.callbacks.get(id)?.(result);
                this.callbacks.delete(id);
            }
        };

        this.init();
    }

    private init() {
        const id = crypto.randomUUID();
        this.callbacks.set(id, () => {
            console.log("PoseEstimator Worker Initialized");
            this.initialized = true;
        });
        this.worker.postMessage({ type: 'init', id });
    }

    public async extractFeatures(frame: CapturedFrame) {
        if (!this.initialized) await new Promise(r => setTimeout(r, 500)); // Simple wait

        return new Promise((resolve, reject) => {
            const id = crypto.randomUUID();

            // Convert DataURL to ImageData
            // This needs to happen on main thread (canvas)
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext('2d');
                if (!ctx) return reject("No Context");

                ctx.drawImage(img, 0, 0);
                const imageData = ctx.getImageData(0, 0, img.width, img.height);

                this.callbacks.set(id, (result) => resolve(result));

                // Transferable? ImageData creates a copy usually or we assume structured clone.
                // We should transfer the buffer if possible but ImageData buffer is read-only sometimes?
                // Just postMessage for now.
                this.worker.postMessage({ type: 'detectFeatures', payload: { image: imageData }, id });
            };
            img.src = frame.imageUrl;
        });
    }
}

export const poseEstimator = new PoseEstimator();

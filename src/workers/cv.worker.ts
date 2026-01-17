/// <reference lib="webworker" />

declare var self: DedicatedWorkerGlobalScope;
declare var cv: any;

let cvLoaded = false;

async function loadOpenCV() {
    if (cvLoaded) return;
    try {
        importScripts('/opencv.js');
        if (cv.getBuildInformation) {
            console.log("OpenCV loaded in worker");
            cvLoaded = true;
        } else {
            await new Promise<void>(resolve => {
                cv.onRuntimeInitialized = () => {
                    console.log("OpenCV ready");
                    cvLoaded = true;
                    resolve();
                }
            });
        }
    } catch (e) {
        console.error("Failed to load OpenCV in worker", e);
    }
}

self.onmessage = async (e) => {
    const { type, payload, id } = e.data;

    if (type === 'init') {
        await loadOpenCV();
        self.postMessage({ type: 'init_done', id });
        return;
    }

    if (!cvLoaded) {
        self.postMessage({ type: 'error', error: 'OpenCV not loaded', id });
        return;
    }

    if (type === 'detectFeatures') {
        try {
            const result = detectFeatures(payload.image);
            self.postMessage({ type: 'features_detected', result, id });
        } catch (err: any) {
            self.postMessage({ type: 'error', error: err.message, id });
        }
    }

    if (type === 'stitch') {
        try {
            const result = await stitchImages(payload.images);
            self.postMessage({ type: 'stitch_complete', result, id });
        } catch (err: any) {
            self.postMessage({ type: 'error', error: err.message, id });
        }
    }
};

function detectFeatures(imageData: ImageData) {
    const src = cv.matFromImageData(imageData);
    const gray = new cv.Mat();
    cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);

    const orb = new cv.ORB(500);
    const keypoints = new cv.KeyPointVector();
    const descriptors = new cv.Mat();

    orb.detectAndCompute(gray, new cv.Mat(), keypoints, descriptors);

    const serializedKps = [];
    for (let i = 0; i < keypoints.size(); i++) {
        const kp = keypoints.get(i);
        serializedKps.push({ pt: kp.pt, size: kp.size, angle: kp.angle });
    }

    const descriptorsData = new Uint8Array(descriptors.data);
    const rows = descriptors.rows;
    const cols = descriptors.cols;
    const type = descriptors.type();

    src.delete(); gray.delete(); orb.delete(); keypoints.delete(); descriptors.delete();

    return {
        keypoints: serializedKps,
        descriptors: { rows, cols, type, data: descriptorsData }
    };
}

async function stitchImages(imagesData: ImageData[]) {
    // Basic Pairwise Stitching Demo
    if (imagesData.length < 2) return "Need 2+ images";

    const img1 = cv.matFromImageData(imagesData[0]);
    const img2 = cv.matFromImageData(imagesData[1]);

    const gray1 = new cv.Mat();
    const gray2 = new cv.Mat();
    cv.cvtColor(img1, gray1, cv.COLOR_RGBA2GRAY);
    cv.cvtColor(img2, gray2, cv.COLOR_RGBA2GRAY);

    const orb = new cv.ORB();
    const kp1 = new cv.KeyPointVector();
    const kp2 = new cv.KeyPointVector();
    const des1 = new cv.Mat();
    const des2 = new cv.Mat();

    orb.detectAndCompute(gray1, new cv.Mat(), kp1, des1);
    orb.detectAndCompute(gray2, new cv.Mat(), kp2, des2);

    const bf = new cv.BFMatcher(cv.NORM_HAMMING, true);
    const matches = new cv.DMatchVector();
    bf.match(des1, des2, matches);

    // Simple filtering
    const good_matches = new cv.DMatchVector();
    // Sort matches by distance if needed, but for simplicity take first 20 valid
    let count = 0;
    for (let i = 0; i < matches.size(); i++) {
        const m = matches.get(i);
        if (m.distance < 50) { // arbitrary threshold
            good_matches.push_back(m);
            count++;
            if (count >= 20) break;
        }
    }

    if (count < 4) {
        // Not enough matches
        return "Not enough matches found";
    }

    const srcPoints = [];
    const dstPoints = [];
    for (let i = 0; i < good_matches.size(); i++) {
        const m = good_matches.get(i);
        srcPoints.push(kp1.get(m.queryIdx).pt.x);
        srcPoints.push(kp1.get(m.queryIdx).pt.y);
        dstPoints.push(kp2.get(m.trainIdx).pt.x);
        dstPoints.push(kp2.get(m.trainIdx).pt.y);
    }

    const srcMat = cv.matFromArray(srcPoints.length / 2, 1, cv.CV_32FC2, srcPoints);
    const dstMat = cv.matFromArray(dstPoints.length / 2, 1, cv.CV_32FC2, dstPoints);

    const H = cv.findHomography(srcMat, dstMat, cv.RANSAC);

    // Just return homography data as proof
    const hData = [];
    for (let i = 0; i < 9; i++) hData.push(H.data64F[i]);

    // Clean up
    img1.delete(); img2.delete(); gray1.delete(); gray2.delete();
    orb.delete(); kp1.delete(); kp2.delete(); des1.delete(); des2.delete();
    bf.delete(); matches.delete(); good_matches.delete(); srcMat.delete(); dstMat.delete(); H.delete();

    return { message: "Homography Computed", homography: hData };
}



/**
 * Converts degrees to radians
 */
export const degToRad = (degrees: number): number => {
    return degrees * (Math.PI / 180);
};

/**
 * Converts radians to degrees
 */
export const radToDeg = (radians: number): number => {
    return radians * (180 / Math.PI);
};

/**
 * Normalizes an angle to be within [-180, 180] degrees
 */
export const normalizeAngle = (angle: number): number => {
    let a = angle % 360;
    if (a > 180) a -= 360;
    if (a < -180) a += 360;
    return a;
};

/**
 * Calculates the shortest distance between two angles in degrees
 */
export const angleDistance = (a: number, b: number): number => {
    const diff = Math.abs(a - b) % 360;
    return diff > 180 ? 360 - diff : diff;
};

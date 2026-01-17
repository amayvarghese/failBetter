import React from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Quaternion, Vector3 } from 'three';
import type { CaptureTarget } from '../../core/capture/useCaptureSession';

interface Props {
    deviceQuaternion: Quaternion;
    targets: CaptureTarget[];
    nearestTargetId: number | null;
}

const TargetDot: React.FC<{ position: Vector3; isActive: boolean; captured: boolean }> = ({ position, isActive, captured }) => {
    const color = captured ? '#0000ff' : (isActive ? '#00ff00' : '#ffffff');
    const opacity = captured ? 0.3 : 0.6;

    return (
        <mesh position={position}>
            <sphereGeometry args={[0.1, 16, 16]} />
            <meshBasicMaterial color={color} transparent opacity={opacity} />
            <mesh>
                <sphereGeometry args={[0.12, 16, 16]} />
                <meshBasicMaterial color="#000000" wireframe transparent opacity={0.2} />
            </mesh>
        </mesh>
    );
};

const CameraController: React.FC<{ quaternion: Quaternion }> = ({ quaternion }) => {
    const { camera } = useThree();

    useFrame(() => {
        // Apply device rotation to camera
        camera.quaternion.copy(quaternion);
    });
    return null;
};

const Targets: React.FC<{ targets: CaptureTarget[]; nearestId: number | null }> = ({ targets, nearestId }) => {
    return (
        <group>
            {targets.map((t) => (
                <TargetDot
                    key={t.id}
                    position={t.vector.clone().multiplyScalar(5)}
                    isActive={t.id === nearestId}
                    captured={t.captured}
                />
            ))}
        </group>
    );
};

export const SphericalGuidance: React.FC<Props> = ({ deviceQuaternion, targets, nearestTargetId }) => {
    return (
        <Canvas
            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
            camera={{ position: [0, 0, 0], fov: 75 }}
        >
            <ambientLight />
            <CameraController quaternion={deviceQuaternion} />
            <Targets targets={targets} nearestId={nearestTargetId} />

            {/* Reference Grid/Horizon Line */}
            <mesh rotation={[Math.PI / 2, 0, 0]}>
                <ringGeometry args={[4.95, 5.0, 64]} />
                <meshBasicMaterial color="white" opacity={0.2} transparent side={2} />
            </mesh>
        </Canvas>
    );
};

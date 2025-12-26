
import React, { useRef, useEffect, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Environment, Stars } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import * as THREE from 'three';
import Foliage from './Foliage';
import Ornaments from './Ornaments';
import SpiralLights from './SpiralLights';
import Snow from './Snow';
import TopStar from './TopStar';
import { TreeColors, LuckyDrawStatus } from '../types';

interface ExperienceProps {
  mixFactor: number;
  colors: TreeColors;
  inputRef: React.MutableRefObject<{ x: number, y: number, isDetected?: boolean }>;
  userImages?: string[];
  signatureText?: string;
  luckyDrawState?: LuckyDrawStatus;
  winnerIndex?: number | null;
  prizeImage?: string | null;
}

const BALL_COLORS = ['#8B0000', '#D32F2F', '#1B5E20', '#D4AF37', '#C0C0C0', '#191970', '#E5E5E5']; 
const GIFT_COLORS = ['#A00000', '#1A4D2E', '#0A1D37', '#D4AF37'];

const SceneController: React.FC<{ 
    inputRef: React.MutableRefObject<{ x: number, y: number, isDetected?: boolean }>, 
    groupRef: React.RefObject<THREE.Group>,
    luckyDrawState: LuckyDrawStatus
}> = ({ inputRef, groupRef, luckyDrawState }) => {
    const { camera, gl } = useThree();
    const vec = useMemo(() => new THREE.Vector3(), []);
    const zoomTarget = useRef(32); 
    const rotationVelocity = useRef(0.002);
    const currentInput = useRef({ x: 0, y: 0 }); 

    useEffect(() => {
        const canvas = gl.domElement;
        const onWheel = (e: WheelEvent) => {
            e.preventDefault();
            zoomTarget.current = THREE.MathUtils.clamp(zoomTarget.current + e.deltaY * 0.02, 12, 55);
        };
        canvas.addEventListener('wheel', onWheel, { passive: false });
        return () => canvas.removeEventListener('wheel', onWheel);
    }, [gl]);

    useFrame((state, delta) => {
        const safeDelta = Math.min(delta, 0.1);
        const targetX = inputRef.current.x;
        const targetY = inputRef.current.y;
        const isHandDetected = !!inputRef.current.isDetected;
        
        currentInput.current.x = THREE.MathUtils.lerp(currentInput.current.x, targetX, 4.0 * safeDelta);
        currentInput.current.y = THREE.MathUtils.lerp(currentInput.current.y, targetY, 4.0 * safeDelta);
        
        const camX = currentInput.current.x * 4, camY = currentInput.current.y * 2, camZ = zoomTarget.current; 
        camera.position.lerp(vec.set(camX, camY, camZ), 4.0 * safeDelta);
        camera.lookAt(0, 0, 0);

        if (groupRef.current) {
            if (luckyDrawState === 'PICKING') {
                groupRef.current.rotation.y += delta * 7.5;
                rotationVelocity.current = 0.002;
            } else if (luckyDrawState === 'WINNER' || luckyDrawState === 'REVEALED') {
                groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, Math.round(groupRef.current.rotation.y / (Math.PI*2)) * (Math.PI*2), safeDelta * 2);
            } else if (isHandDetected) {
                groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, targetX * Math.PI, 6.0 * safeDelta);
            } else {
                groupRef.current.rotation.y += rotationVelocity.current;
            }
        }
    });
    return null;
};

const SceneContent: React.FC<ExperienceProps> = ({ mixFactor, colors, inputRef, userImages, signatureText, luckyDrawState = 'IDLE', winnerIndex = null, prizeImage = null }) => {
  const groupRef = useRef<THREE.Group>(null);
  const photoCount = (userImages && userImages.length > 0) ? userImages.length : 0;
  
  return (
    <>
      <SceneController inputRef={inputRef} groupRef={groupRef} luckyDrawState={luckyDrawState} />
      <ambientLight intensity={0.4} />
      <spotLight position={[20, 20, 20]} angle={0.4} penumbra={1} intensity={2.0} color="#fff5d0" />
      <Environment preset="forest" />
      <Stars radius={100} depth={50} count={3000} factor={4} fade speed={1} />
      <Snow mixFactor={mixFactor} />
      
      <group ref={groupRef}>
        <TopStar mixFactor={mixFactor} />
        <Foliage mixFactor={mixFactor} colors={colors} />
        <SpiralLights mixFactor={mixFactor} />
        
        {/* 彩色装饰球 */}
        <Ornaments mixFactor={mixFactor} type="BALL" count={70} scale={0.45} colors={BALL_COLORS} />
        
        {/* 装饰礼物盒 */}
        <Ornaments mixFactor={mixFactor} type="BOX" count={12} scale={1.3} colors={GIFT_COLORS} />

        {/* 拍立得照片 */}
        <Ornaments 
          mixFactor={mixFactor} 
          type="PHOTO" 
          count={photoCount} 
          userImages={userImages} 
          signatureText={signatureText} 
          winnerIndex={winnerIndex} 
          luckyDrawState={luckyDrawState}
          prizeImage={prizeImage} 
        />
      </group>
      
      <EffectComposer multisampling={0}>
        <Bloom luminanceThreshold={0.9} mipmapBlur intensity={1.2} />
        <Vignette eskil={false} offset={0.1} darkness={1.1} />
      </EffectComposer>
    </>
  );
};

const Experience: React.FC<ExperienceProps> = (props) => {
  return (
    <Canvas dpr={[1, 1.25]} camera={{ position: [0, 0, 32], fov: 45 }} gl={{ toneMapping: THREE.ACESFilmicToneMapping }} shadows>
      <SceneContent {...props} />
    </Canvas>
  );
};
export default Experience;

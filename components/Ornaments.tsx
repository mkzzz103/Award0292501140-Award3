
import React, { useMemo, useRef, useLayoutEffect } from 'react';
import { useFrame, useLoader } from '@react-three/fiber';
import * as THREE from 'three';
import { lerp, randomVector3 } from '../utils/math';

interface OrnamentData {
  chaosPos: THREE.Vector3;
  targetPos: THREE.Vector3;
  rotation: THREE.Euler;
  color: THREE.Color;
  targetScale: THREE.Vector3;
  chaosScale: THREE.Vector3;
  chaosTilt: number;
}

interface OrnamentsProps {
  mixFactor: number;
  type: 'BALL' | 'BOX' | 'PHOTO';
  count: number;
  colors?: string[];
  scale?: number;
  userImages?: string[];
  signatureText?: string;
  winnerIndex?: number | null;
  luckyDrawState?: string;
  prizeImage?: string | null;
}

// 专门渲染奖品图的子组件
const ActualPrizeRenderer: React.FC<{ url: string; width: number; height: number }> = ({ url, width, height }) => {
    const prizeMap = useLoader(THREE.TextureLoader, url);
    return (
        <mesh position={[0, -0.05, 0.001]}>
            <planeGeometry args={[width, height]} />
            <meshBasicMaterial map={prizeMap} />
        </mesh>
    );
};

const generatePrizeBackTexture = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 640;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    ctx.fillStyle = '#fffdf0';
    ctx.fillRect(0, 0, 512, 640);
    
    ctx.strokeStyle = '#aa0000';
    ctx.lineWidth = 20;
    ctx.strokeRect(10, 10, 492, 620);
    
    ctx.fillStyle = '#aa0000';
    ctx.textAlign = 'center';
    ctx.font = "bold 60px 'Cinzel', serif";
    ctx.fillText("CHRISTMAS", 256, 110);
    ctx.fillText("GIFT", 256, 180);
    
    ctx.font = "italic 30px 'Playfair Display', serif";
    ctx.fillText("Congratulations!", 256, 250);

    ctx.strokeStyle = '#d4af37';
    ctx.setLineDash([5, 5]);
    ctx.strokeRect(60, 280, 392, 310);
    
    const tex = new THREE.CanvasTexture(canvas);
    return tex;
}

const generateSignatureTexture = (text: string) => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#111111';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = "bold 60px 'Monsieur La Doulaise', cursive";
    ctx.fillText(text, canvas.width / 2, canvas.height / 2);
    return new THREE.CanvasTexture(canvas);
}

const PhotoFrameMesh: React.FC<{
    item: OrnamentData;
    mixFactor: number;
    texture: THREE.Texture;
    signatureTexture?: THREE.Texture | null;
    isWinner?: boolean;
    luckyDrawState?: string;
    prizeCardTexture: THREE.Texture;
    actualPrizeImg?: string | null;
}> = ({ item, mixFactor, texture, signatureTexture, isWinner = false, luckyDrawState, prizeCardTexture, actualPrizeImg }) => {
    const groupRef = useRef<THREE.Group>(null);
    const innerRef = useRef<THREE.Group>(null); 
    const currentMixRef = useRef(1);
    const centerPos = useMemo(() => new THREE.Vector3(0, 0, 22), []);

    const { frameArgs, photoArgs, photoPos, textPos, textArgs } = useMemo(() => {
        const aspect = (texture.image as any)?.width / (texture.image as any)?.height || 1;
        const pw = aspect >= 1 ? 0.85 : 0.85 * aspect;
        const ph = aspect >= 1 ? 0.85 / aspect : 0.85;
        const mSide = 0.08, mTop = 0.08, mBottom = 0.20;
        const fw = pw + mSide * 2, fh = ph + mTop + mBottom;
        return {
            frameArgs: [fw, fh, 0.05] as [number, number, number],
            photoArgs: [pw, ph] as [number, number],
            photoPos: [0, (fh / 2) - mTop - (ph / 2), 0.026] as [number, number, number],
            textPos: [0, -(fh / 2) + (mBottom / 2), 0.026] as [number, number, number],
            textArgs: [fw, mBottom] as [number, number]
        };
    }, [texture]);

    useFrame((state, delta) => {
        if (!groupRef.current || !innerRef.current) return;
        const speed = 2.5 * delta;
        currentMixRef.current = lerp(currentMixRef.current, mixFactor, speed);
        const t = currentMixRef.current;

        if (isWinner && (luckyDrawState === 'WINNER' || luckyDrawState === 'REVEALED')) {
            groupRef.current.position.lerp(centerPos, speed * 2);
            groupRef.current.scale.lerp(new THREE.Vector3(9, 9, 9), speed * 2);
            groupRef.current.rotation.set(0, 0, 0); 

            const targetRotY = luckyDrawState === 'REVEALED' ? Math.PI : 0;
            innerRef.current.rotation.y = lerp(innerRef.current.rotation.y, targetRotY, speed * 3);
        } else {
            const pos = new THREE.Vector3().lerpVectors(item.chaosPos, item.targetPos, t);
            groupRef.current.position.copy(pos);
            const sc = new THREE.Vector3().lerpVectors(item.chaosScale, item.targetScale, t);
            groupRef.current.scale.copy(sc);

            if (t > 0.8) {
                groupRef.current.lookAt(0, groupRef.current.position.y, 0);
                groupRef.current.rotateY(Math.PI);
            } else {
                groupRef.current.lookAt(state.camera.position);
            }
            innerRef.current.rotation.y = lerp(innerRef.current.rotation.y, 0, speed);
        }
    });

    return (
        <group ref={groupRef}>
            <group ref={innerRef}>
                <mesh castShadow>
                    <boxGeometry args={frameArgs} />
                    <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.05} />
                </mesh>
                <mesh position={photoPos}>
                    <planeGeometry args={photoArgs} />
                    <meshStandardMaterial map={texture} />
                </mesh>
                {signatureTexture && !isWinner && (
                    <mesh position={textPos}>
                        <planeGeometry args={textArgs} />
                        <meshBasicMaterial map={signatureTexture} transparent opacity={0.8} />
                    </mesh>
                )}
                <group rotation={[0, Math.PI, 0]} position={[0, 0, -0.026]}>
                    <mesh>
                        <planeGeometry args={[frameArgs[0], frameArgs[1]]} />
                        <meshBasicMaterial map={prizeCardTexture} transparent />
                    </mesh>
                    {isWinner && actualPrizeImg && (
                        <React.Suspense fallback={null}>
                            <ActualPrizeRenderer 
                                url={actualPrizeImg} 
                                width={frameArgs[0] * 0.75} 
                                height={frameArgs[1] * 0.48} 
                            />
                        </React.Suspense>
                    )}
                </group>
            </group>
        </group>
    );
};

const GiftBoxMesh: React.FC<{ item: OrnamentData, mixFactor: number }> = ({ item, mixFactor }) => {
    const groupRef = useRef<THREE.Group>(null);
    useFrame((state, delta) => {
        if (!groupRef.current) return;
        groupRef.current.position.lerpVectors(item.chaosPos, item.targetPos, mixFactor);
        groupRef.current.rotation.copy(item.rotation);
    });
    return (
        <group ref={groupRef} scale={[0.8, 0.8, 0.8]}>
            <mesh castShadow><boxGeometry args={[1, 1, 1]} /><meshStandardMaterial color={item.color} roughness={0.3} /></mesh>
            <mesh scale={[0.12, 1.02, 1.02]}><boxGeometry args={[1, 1, 1]} /><meshStandardMaterial color="#FFD700" metalness={0.8} /></mesh>
            <mesh scale={[1.02, 1.02, 0.12]}><boxGeometry args={[1, 1, 1]} /><meshStandardMaterial color="#FFD700" metalness={0.8} /></mesh>
        </group>
    );
};

const Ornaments: React.FC<OrnamentsProps> = ({ mixFactor, type, count, colors, scale = 1, userImages = [], signatureText, winnerIndex, luckyDrawState, prizeImage }) => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const prizeCardTexture = useMemo(() => generatePrizeBackTexture(), []);
  const signatureTexture = useMemo(() => signatureText ? generateSignatureTexture(signatureText) : null, [signatureText]);

  const data = useMemo(() => {
    const items: OrnamentData[] = [];
    const goldenAngle = Math.PI * (3 - Math.sqrt(5));
    const treeHeight = 18, treeRadiusBase = 7.5, apexY = 9;
    
    for (let i = 0; i < count; i++) {
      const progress = Math.sqrt((i + 1) / (count || 1)) * 0.9;
      const r = progress * treeRadiusBase, y = apexY - progress * treeHeight, theta = i * goldenAngle;
      const tPos = new THREE.Vector3(r * Math.cos(theta), y, r * Math.sin(theta));
      
      // 优化：针对照片缩小 Chaos 半径，使其在散开时更集中（12），而不是原本的 25
      let cRadius = type === 'PHOTO' ? 12 : 25;
      let cPos = randomVector3(cRadius);
      
      if (type === 'PHOTO') tPos.multiplyScalar(1.15); else tPos.multiplyScalar(1.05);

      const colorHex = colors ? colors[i % colors.length] : '#ffffff';
      items.push({ 
          chaosPos: cPos, 
          targetPos: tPos, 
          rotation: new THREE.Euler(Math.random()*Math.PI, Math.random()*Math.PI, 0), 
          color: new THREE.Color(colorHex), 
          targetScale: new THREE.Vector3().setScalar(scale), 
          chaosScale: new THREE.Vector3().setScalar(type === 'PHOTO' ? 3.5 : scale), 
          chaosTilt: Math.random() * 0.5 
      });
    }
    return items;
  }, [count, type, colors, scale]);

  useLayoutEffect(() => {
    if (type === 'BALL' && meshRef.current) {
        data.forEach((item, i) => meshRef.current!.setColorAt(i, item.color));
        if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true;
    }
  }, [data, type]);

  useFrame(() => {
    if (!meshRef.current || type !== 'BALL') return;
    data.forEach((item, i) => {
      dummy.position.lerpVectors(item.chaosPos, item.targetPos, mixFactor);
      dummy.scale.setScalar(scale);
      dummy.updateMatrix();
      meshRef.current!.setMatrixAt(i, dummy.matrix);
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  if (type === 'PHOTO') {
      return (
          <group>
              {data.map((item, i) => {
                  const imgSrc = (userImages && i < userImages.length) ? userImages[i] : null;
                  const isWinner = (winnerIndex !== null && winnerIndex === i);
                  if (!imgSrc) return null;
                  return (
                      <React.Suspense key={i} fallback={null}>
                          <UserPhotoOrnament 
                            item={item} 
                            mixFactor={mixFactor} 
                            url={imgSrc} 
                            signatureTexture={signatureTexture}
                            isWinner={isWinner} 
                            luckyDrawState={luckyDrawState} 
                            prizeCardTexture={prizeCardTexture!}
                            actualPrizeImg={isWinner ? prizeImage : null}
                          />
                      </React.Suspense>
                  );
              })}
          </group>
      )
  }

  if (type === 'BOX') return <group>{data.map((item, i) => <GiftBoxMesh key={i} item={item} mixFactor={mixFactor} />)}</group>;

  return (
    <instancedMesh ref={meshRef} args={[new THREE.SphereGeometry(1, 16, 16), undefined, count]}>
      <meshStandardMaterial roughness={0.1} metalness={0.7} />
    </instancedMesh>
  );
};

const UserPhotoOrnament: React.FC<{
    item: OrnamentData;
    mixFactor: number;
    url: string;
    signatureTexture?: THREE.Texture | null;
    isWinner?: boolean;
    luckyDrawState?: string;
    prizeCardTexture: THREE.Texture;
    actualPrizeImg?: string | null;
}> = ({ item, mixFactor, url, signatureTexture, isWinner, luckyDrawState, prizeCardTexture, actualPrizeImg }) => {
    const texture = useLoader(THREE.TextureLoader, url);
    return <PhotoFrameMesh 
        item={item} 
        mixFactor={mixFactor} 
        texture={texture} 
        signatureTexture={signatureTexture}
        isWinner={isWinner} 
        luckyDrawState={luckyDrawState} 
        prizeCardTexture={prizeCardTexture}
        actualPrizeImg={actualPrizeImg}
    />;
};

export default Ornaments;

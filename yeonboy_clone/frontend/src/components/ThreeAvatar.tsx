import React, { Suspense, useEffect, useMemo, useState } from 'react';
import { Canvas, useLoader, useThree } from '@react-three/fiber';
import { useGLTF, useFBX, useAnimations } from '@react-three/drei';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { KTX2Loader } from 'three/examples/jsm/loaders/KTX2Loader.js';
// @ts-expect-error - three provides a module for meshopt decoder
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';
// @ts-expect-error - retargetClip helper from SkeletonUtils
import { retargetClip } from 'three/examples/jsm/utils/SkeletonUtils.js';

type ThreeAvatarProps = {
  modelUrl?: string;
  isActive?: boolean;
  isThinking?: boolean;
  isRecording?: boolean;
  scale?: number;
  onAnimationChange?: (animationName: string) => void;
};

function AvatarModel({ 
  modelUrl = '/avatars/yeongeol/model.glb', 
  scale = 1.0,
  isActive = true,
  isThinking = false,
  isRecording = false,
  onAnimationChange
}: { 
  modelUrl?: string; 
  scale?: number;
  isActive?: boolean;
  isThinking?: boolean;
  isRecording?: boolean;
  onAnimationChange?: (animationName: string) => void;
}) {
  const gl = useThree((s) => s.gl);
  const gltf = useLoader(
    GLTFLoader as any,
    modelUrl,
    (loader: GLTFLoader) => {
      const draco = new DRACOLoader();
      draco.setDecoderPath('/vendors/draco/');
      loader.setDRACOLoader(draco);

      const ktx2 = new KTX2Loader();
      ktx2.setTranscoderPath('/vendors/basis/');
      ktx2.detectSupport(gl);
      loader.setKTX2Loader(ktx2);

      // @ts-ignore
      loader.setMeshoptDecoder(MeshoptDecoder);
    }
  ) as any;

  const scene = gltf.scene as THREE.Object3D;

  // 외부 FBX 애니메이션 로드
  // 주의: 훅은 조건 없이 고정 개수로 호출해야 합니다.
  const fbxWalking: any = useFBX('/avatars/yeongeol/Walking.fbx');
  const fbxLooking: any = useFBX('/avatars/yeongeol/Looking.fbx');
  const fbxTalking: any = useFBX('/avatars/yeongeol/Talking.fbx');
  const fbxPointing: any = useFBX('/avatars/yeongeol/Pointing.fbx');
  const fbxPunching: any = useFBX('/avatars/yeongeol/Punching Bag.fbx');
  const fbxWatercooler: any = useFBX('/avatars/yeongeol/Talking At Watercooler.fbx');

  // 클립 이름 정규화 및 결합
  const combinedClips = useMemo(() => {
    const clips: any[] = [];
    const pushClip = (obj: any, name: string) => {
      if (obj && obj.animations && obj.animations[0]) {
        // FBX 원본 클립을 GLB 스켈레톤에 리타게팅
        let sourceClip = obj.animations[0];
        try {
          const retargeted = typeof retargetClip === 'function' ? retargetClip(scene as any, obj as any, sourceClip) : null;
          if (retargeted) {
            // 대상 스켈레톤에 존재하는 본만 남기도록 트랙 필터링
            retargeted.name = name;
            retargeted.tracks = retargeted.tracks.filter((t: any) => {
              const boneName = String(t.name).split('.')[0];
              return !!(scene as any).getObjectByName(boneName);
            });
            if (retargeted.tracks.length > 0) clips.push(retargeted);
            return;
          }
        } catch (e) {
          // retarget 실패 시 원본 클립을 그대로 사용(일부 본이 맞으면 동작)
        }
        const fallback = sourceClip.clone();
        fallback.name = name;
        fallback.tracks = fallback.tracks.filter((t: any) => {
          const boneName = String(t.name).split('.')[0];
          return !!(scene as any).getObjectByName(boneName);
        });
        if (fallback.tracks.length > 0) clips.push(fallback);
      }
    };

    // GLB 내부 클립(있다면) 먼저 추가
    if (gltf.animations && gltf.animations.length > 0) {
      gltf.animations.forEach((c: any) => clips.push(c));
    }

    pushClip(fbxWalking, 'Walking');
    pushClip(fbxLooking, 'Looking');
    pushClip(fbxTalking, 'Talking');
    pushClip(fbxPointing, 'Pointing');
    pushClip(fbxPunching, 'Punching');
    pushClip(fbxWatercooler, 'Watercooler');

    return clips;
  }, [gltf.animations, fbxWalking, fbxLooking, fbxTalking, fbxPointing, fbxPunching, fbxWatercooler]);

  // 리타게팅이 성공했는지 판별 (트랙이 살아있는 Walking 존재?)
  const hasRetargetedWalking = useMemo(() =>
    combinedClips.some((c: any) => c?.name === 'Walking' && c.tracks && c.tracks.length > 0), [combinedClips]
  );

  // 사용할 타겟과 클립 결정: 리타게팅 성공 시 GLB + 리타게팅 클립, 실패 시 FBX 자체 + 원본 클립
  const targetScene: any = hasRetargetedWalking ? scene : fbxWalking;
  const clipsForAnim: any[] = hasRetargetedWalking ? combinedClips : (fbxWalking.animations || []);

  const { actions, mixer } = useAnimations(clipsForAnim as any, targetScene);

  const [currentAnimation, setCurrentAnimation] = useState<string>('Walking');

  // 상태 기반 / 자동 사이클 애니메이션 선택
  useEffect(() => {
    if (!actions || Object.keys(actions).length === 0) return;

    const target = 'Walking';
    if (actions[target]) {
      if (currentAnimation !== target && actions[currentAnimation]) actions[currentAnimation].stop();
      actions[target].reset().setLoop(2200).fadeIn(0.2).play();
      setCurrentAnimation(target);
    }

  }, [actions, currentAnimation]);

  // 머티리얼/그림자 설정
  useMemo(() => {
    scene.traverse((obj: any) => {
      if (obj.isMesh && obj.material) {
        obj.castShadow = true;
        obj.receiveShadow = true;
        if (obj.material.color) obj.material.color.multiplyScalar(1.05);
      }
    });
  }, [scene]);

  // 재생 속도 소폭 가변(자연스러움)
  useEffect(() => {
    if (!mixer) return;
    mixer.timeScale = 0.95 + Math.random() * 0.1;
  }, [mixer, currentAnimation]);

  // 리타게팅 성공이면 GLB 표시, 아니면 FBX(워킹 애니) 표시
  const renderObject: any = hasRetargetedWalking ? scene : fbxWalking;
  return <primitive object={renderObject} scale={scale} position={[0, -1.6, 0]} />;
}

export const ThreeAvatar: React.FC<ThreeAvatarProps> = ({ 
  modelUrl = '/avatars/yeongeol/model.glb', 
  isActive = true, 
  isThinking = false,
  isRecording = false,
  scale = 1.0,
  onAnimationChange
}) => {
  const [use3D] = useState(true);
  const [currentAnimation, setCurrentAnimation] = useState<string>('Idle');
 
  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 1000, pointerEvents: 'none' }}>
      <div style={{
        position: 'absolute', top: 16, left: 16, color: '#8bd1ff', fontSize: 12, fontFamily: 'monospace',
        backgroundColor: 'rgba(0,0,0,0.55)', padding: '4px 8px', borderRadius: 4
      }}>
        3D avatar active
      </div>
      <Canvas
        dpr={[1, 1]}
        shadows={false}
        gl={{ antialias: false, powerPreference: 'high-performance' }}
        camera={{ position: [0, 1.6, 2.2], fov: 40 }}
        style={{ width: '100%', height: '100%' }}
      >
        <ambientLight intensity={0.7} />
        <directionalLight position={[2, 4, 2]} intensity={0.9} />
        <pointLight position={[-2, 2, 2]} intensity={0.5} color="#00D1FF" />
        <fog attach="fog" args={['#000000', 5, 15]} />
        <Suspense fallback={null}>
          <AvatarModel 
            modelUrl={modelUrl} 
            scale={scale}
            isActive={isActive}
            isThinking={isThinking}
            isRecording={isRecording}
            onAnimationChange={(name) => {
              setCurrentAnimation(name);
              onAnimationChange?.(name);
            }}
          />
        </Suspense>
      </Canvas>
    </div>
  );
};

useGLTF.preload('/avatars/yeongeol/model.glb');

export default ThreeAvatar;



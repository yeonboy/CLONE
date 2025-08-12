import React, { useRef, useEffect, useState, useCallback } from 'react';

interface AvatarPosition {
  x: number;
  y: number;
}

interface FullBodyAvatarProps {
  isActive?: boolean;
  onAvatarClick?: () => void;
  debug?: boolean; // 디버그 정보/테두리 노출 여부
  interactive?: boolean; // 아바타 클릭/호버 상호작용 활성화 여부
  speed?: number; // 이동 속도 (0.2 ~ 1.0 권장)
  size?: number; // 크기 배율 (0.6 ~ 1.4 권장)
  color?: string; // 윤곽선/네온 색상
  glow?: boolean; // 네온 글로우 사용 여부
}

const FullBodyAvatar: React.FC<FullBodyAvatarProps> = ({ 
  isActive = true, 
  onAvatarClick,
  debug = false,
  interactive = false,
  speed = 0.45,
  size = 1.0,
  color = '#00D1FF',
  glow = true,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [position, setPosition] = useState<AvatarPosition>({ x: 100, y: 200 });
  const [isMoving, setIsMoving] = useState(false);
  const [direction, setDirection] = useState(1); // 1: 오른쪽, -1: 왼쪽
  const [animationId, setAnimationId] = useState<number | null>(null);
  const [debugInfo, setDebugInfo] = useState<string>('아바타 초기화 중...');
  const startTimeRef = useRef<number>(Date.now());
  const clickTargetRef = useRef<AvatarPosition | null>(null);

  // 화면 크기 가져오기
  const getScreenDimensions = () => ({
    width: window.innerWidth,
    height: window.innerHeight
  });

  // 아바타 그리기 함수
  const drawAvatar = useCallback((
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    facingRight: boolean = true,
    scaleOverride?: number
  ) => {
    ctx.save();
    ctx.translate(x, y);
    
    // 스케일 설정
    const baseScale = 0.8 * size;
    const scale = scaleOverride ?? baseScale;
    ctx.scale(facingRight ? scale : -scale, scale);
    
    // 외곽선/채움 스타일: 어두운 배경에서 잘 보이도록 네온 블루 계열
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.5;
    ctx.fillStyle = 'rgba(0, 209, 255, 0.08)';
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.shadowColor = glow ? color : 'transparent';
    ctx.shadowBlur = glow ? 8 : 0;
    
    // 머리 (원형)
    ctx.beginPath();
    ctx.arc(0, 0, 25, 0, 2 * Math.PI);
    ctx.stroke();
    
    // 얼굴 영역 은은한 채움
    ctx.save();
    ctx.fillStyle = 'rgba(0, 209, 255, 0.06)';
    ctx.beginPath();
    ctx.arc(0, 0, 23, 0, 2 * Math.PI);
    ctx.fill();
    ctx.restore();
    
    // 머리 장식 (밴드나 모자)
    ctx.beginPath();
    ctx.arc(0, -5, 20, 0, Math.PI);
    ctx.stroke();
    
    // 안경 프레임 (Vuitton 스타일)
    ctx.beginPath();
    ctx.arc(-8, 0, 8, 0, 2 * Math.PI);
    ctx.arc(8, 0, 8, 0, 2 * Math.PI);
    ctx.stroke();
    
    // 안경 다리
    ctx.beginPath();
    ctx.moveTo(-8, -8);
    ctx.lineTo(-12, -12);
    ctx.moveTo(8, -8);
    ctx.lineTo(12, -12);
    ctx.stroke();
    
    // 몸통 (상의 - 탱크톱, 리브드)
    ctx.beginPath();
    ctx.moveTo(-20, 25);
    ctx.lineTo(-15, 25);
    ctx.lineTo(-15, 80);
    ctx.lineTo(15, 80);
    ctx.lineTo(15, 25);
    ctx.lineTo(20, 25);
    ctx.stroke();
    
    // 리브드 패턴 (세로선)
    for (let i = -15; i <= 15; i += 5) {
      ctx.beginPath();
      ctx.moveTo(i, 25);
      ctx.lineTo(i, 80);
      ctx.stroke();
    }
    
    // 팔 (근육질, 탱크톱)
    ctx.beginPath();
    // 왼팔
    ctx.moveTo(-20, 30);
    ctx.lineTo(-30, 40);
    ctx.lineTo(-25, 70);
    ctx.lineTo(-15, 70);
    ctx.lineTo(-20, 40);
    ctx.closePath();
    ctx.stroke();
    
    // 오른팔
    ctx.beginPath();
    ctx.moveTo(20, 30);
    ctx.lineTo(30, 40);
    ctx.lineTo(25, 70);
    ctx.lineTo(15, 70);
    ctx.lineTo(20, 40);
    ctx.closePath();
    ctx.stroke();
    
    // 다리 (반바지, 그레이)
    ctx.beginPath();
    ctx.moveTo(-15, 80);
    ctx.lineTo(-20, 120);
    ctx.lineTo(-10, 120);
    ctx.lineTo(-5, 80);
    ctx.closePath();
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(15, 80);
    ctx.lineTo(20, 120);
    ctx.lineTo(10, 120);
    ctx.lineTo(5, 80);
    ctx.closePath();
    ctx.stroke();
    
    // 반바지 주머니
    ctx.beginPath();
    ctx.arc(-10, 90, 3, 0, 2 * Math.PI);
    ctx.arc(10, 90, 3, 0, 2 * Math.PI);
    ctx.stroke();
    
    // 손목 밴드 (TEAM 7.5 SAT)
    ctx.beginPath();
    ctx.arc(-25, 70, 5, 0, 2 * Math.PI);
    ctx.stroke();
    
    // 밴드 텍스트 (간단한 선으로 표현)
    ctx.beginPath();
    ctx.moveTo(-28, 68);
    ctx.lineTo(-22, 68);
    ctx.moveTo(-28, 70);
    ctx.lineTo(-22, 70);
    ctx.moveTo(-28, 72);
    ctx.lineTo(-22, 72);
    ctx.stroke();
    
    // 가방 (스트라이프 패턴)
    ctx.beginPath();
    ctx.rect(-25, 60, 10, 15);
    ctx.stroke();
    
    // 가방 스트라이프
    ctx.beginPath();
    ctx.moveTo(-25, 65);
    ctx.lineTo(-15, 65);
    ctx.moveTo(-25, 70);
    ctx.lineTo(-15, 70);
    ctx.moveTo(-25, 75);
    ctx.lineTo(-15, 75);
    ctx.stroke();
    
    // 가방 손잡이
    ctx.beginPath();
    ctx.arc(-20, 58, 2, 0, 2 * Math.PI);
    ctx.stroke();
    
    // 신발 (간단한 직사각형)
    ctx.beginPath();
    ctx.rect(-20, 120, 8, 5);
    ctx.rect(12, 120, 8, 5);
    ctx.stroke();
    
    // 신발 밑창
    ctx.beginPath();
    ctx.rect(-22, 125, 12, 3);
    ctx.rect(10, 125, 12, 3);
    ctx.stroke();
    
    ctx.restore();
  }, [color, glow, size]);

  // 캔버스 초기화 및 아바타 그리기
  const initCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      setDebugInfo('캔버스가 없습니다');
      return;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      setDebugInfo('2D 컨텍스트를 가져올 수 없습니다');
      return;
    }

    const { width, height } = getScreenDimensions();
    
    // 캔버스 크기 설정
    canvas.width = width;
    canvas.height = height;

    // 배경 지우기
    ctx.clearRect(0, 0, width, height);
    
    // 아바타 그리기
    drawAvatar(ctx, position.x, position.y, direction === 1);
    
    // 디버깅 정보 업데이트
    setDebugInfo(`아바타 위치: (${Math.round(position.x)}, ${Math.round(position.y)}) | 방향: ${direction === 1 ? '오른쪽' : '왼쪽'} | 화면: ${width}x${height}`);
  }, [position, direction, drawAvatar]);

  // 아바타 움직임 애니메이션
  const animateAvatar = useCallback(() => {
    if (!isActive) return;

    setPosition(prev => {
      const { width, height } = getScreenDimensions();
      const t = (Date.now() - startTimeRef.current) * Math.max(0.15, speed) * 0.001;

      // 기본 부드러운 배회 경로 (사인 기반 Lissajous 느낌)
      const centerX = width * 0.5;
      const centerY = height * 0.65;
      const ampX = Math.max(120, width * 0.18);
      const ampY = Math.max(60, height * 0.06);
      let targetX = centerX + ampX * Math.sin(t * 0.7);
      let targetY = centerY + ampY * Math.sin(t * 1.1 + 1.2);

      // 클릭 타겟이 있으면 우선 이동
      if (clickTargetRef.current) {
        targetX = clickTargetRef.current.x;
        targetY = clickTargetRef.current.y;
        const dx = targetX - prev.x;
        const dy = targetY - prev.y;
        if (Math.abs(dx) < 1.5 && Math.abs(dy) < 1.5) {
          clickTargetRef.current = null;
          setIsMoving(false);
        }
      }

      // 부드러운 보간 이동
      const smoothing = 0.035; // 낮을수록 더 천천히, 자연스럽게
      const newX = prev.x + (targetX - prev.x) * smoothing;
      const newY = prev.y + (targetY - prev.y) * smoothing;

      // 바라보는 방향 갱신
      const deltaX = newX - prev.x;
      if (Math.abs(deltaX) > 0.3) {
        setDirection(deltaX >= 0 ? 1 : -1);
      }

      return { x: newX, y: newY };
    });
  }, [isActive, speed]);

  // 사용자 클릭에 따른 상호작용
  const handleCanvasClick = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const clickY = event.clientY - rect.top;
    
    // 아바타 클릭 감지 (간단한 원형 충돌 감지)
    const distance = Math.sqrt(
      Math.pow(clickX - position.x, 2) + Math.pow(clickY - position.y, 2)
    );
    
    if (distance < 120) {
      const { width, height } = getScreenDimensions();
      const targetX = Math.max(100, Math.min(width - 100, clickX));
      const targetY = Math.max(120, Math.min(height - 150, clickY));
      clickTargetRef.current = { x: targetX, y: targetY };
      setIsMoving(true);
      if (onAvatarClick) onAvatarClick();
    }
  }, [position, onAvatarClick]);

  // 마우스 움직임에 따른 아바타 반응
  const handleMouseMove = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isActive || isMoving) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;
    
    // 마우스가 아바타 근처에 있으면 아바타가 마우스를 쳐다보는 효과
    const distance = Math.sqrt(
      Math.pow(mouseX - position.x, 2) + Math.pow(mouseY - position.y, 2)
    );
    
    if (distance < 150) {
      // 마우스 방향으로 아바타가 바라보도록 방향 조정
      const newDirection = mouseX > position.x ? 1 : -1;
      if (newDirection !== direction) {
        setDirection(newDirection);
      }
    }
  }, [isActive, isMoving, position, direction]);

  // 애니메이션 루프
  useEffect(() => {
    if (!isActive) return;

    const loop = () => {
      animateAvatar();
      // 그리기까지 한 번에
      initCanvas();
      const id = requestAnimationFrame(loop);
      setAnimationId(id);
    };

    loop();

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [isActive, animateAvatar, initCanvas, animationId]);

  // 캔버스 업데이트
  useEffect(() => {
    initCanvas();
  }, [initCanvas]);

  // 주기적인 캔버스 업데이트는 rAF 루프에서 처리

  // 화면 크기 변경 감지
  useEffect(() => {
    const handleResize = () => {
      // 디바운스 처리로 성능 최적화
      clearTimeout((window as any).resizeTimeout);
      (window as any).resizeTimeout = setTimeout(() => {
        initCanvas();
      }, 100);
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout((window as any).resizeTimeout);
    };
  }, [initCanvas]);

  return (
    <div style={{
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 1000,
      // 상호작용 비활성화 시, 하단 UI 클릭 차단 방지
      pointerEvents: interactive ? 'auto' : 'none',
    }}>
      {/* 디버깅 정보 표시 */}
      {debug && (
        <div style={{
          position: 'absolute',
          top: '10px',
          left: '10px',
          background: 'rgba(0, 0, 0, 0.8)',
          color: 'white',
          padding: '8px 12px',
          borderRadius: '8px',
          fontSize: '12px',
          fontFamily: 'monospace',
          zIndex: 1001,
          pointerEvents: 'none',
        }}>
          {debugInfo}
        </div>
      )}
      
      <canvas
        ref={canvasRef}
        style={{
          width: '100%',
          height: '100%',
          position: 'absolute',
          top: 0,
          left: 0,
          pointerEvents: interactive ? 'auto' : 'none',
          cursor: 'pointer',
          border: debug ? '2px solid red' : 'none',
        }}
        onClick={handleCanvasClick}
        onMouseMove={handleMouseMove}
      />
    </div>
  );
};

export default FullBodyAvatar;

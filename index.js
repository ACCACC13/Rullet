import { useState, useEffect, useRef, useMemo } from 'react';

const LunchRoulette = () => {
  const defaultMenus = ['비빔밥', '김치찌개', '된장찌개', '불고기', '짜장면', '짬뽕', '초밥', '라멘'];
  const COLORS = ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40', '#7CFC00', '#FF6347'];

  // 상태 관리
  const [menus, setMenus] = useState(() => {
    const saved = localStorage.getItem('lunchMenus');
    return saved ? JSON.parse(saved) : defaultMenus;
  });
  const [customMenu, setCustomMenu] = useState('');
  const [rotation, setRotation] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [selectedMenu, setSelectedMenu] = useState(null);
  const [showPopup, setShowPopup] = useState(false);
  const [confetti, setConfetti] = useState([]);
  const [spinDuration, setSpinDuration] = useState(5);
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 375);
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth < 768 : true);
  
  // refs
  const animationRef = useRef(null);
  const startTimeRef = useRef(null);
  const endRotationRef = useRef(null);
  const inputRef = useRef(null);
  
  // 반응형 처리
  useEffect(() => {
    // 모바일 뷰포트 메타 태그 설정
    const metaViewport = document.querySelector('meta[name=viewport]');
    if (!metaViewport) {
      const meta = document.createElement('meta');
      meta.name = 'viewport';
      meta.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no';
      document.getElementsByTagName('head')[0].appendChild(meta);
    } else {
      metaViewport.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no';
    }
    
    const handleResize = () => {
      const width = window.innerWidth;
      setWindowWidth(width);
      setIsMobile(width < 768);
    };
    
    // 디바이스 방향 변경 감지
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);
  
  // 모바일에서 가상 키보드가 올라올 때 화면 조정
  useEffect(() => {
    const handleFocus = () => {
      // 입력창에 포커스가 갔을 때 스크롤 조정
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 300);
    };
    
    const input = inputRef.current;
    if (input && isMobile) {
      input.addEventListener('focus', handleFocus);
      return () => input.removeEventListener('focus', handleFocus);
    }
  }, [isMobile, inputRef.current]);
  
  // 메뉴 변경시 localStorage 업데이트
  useEffect(() => {
    localStorage.setItem('lunchMenus', JSON.stringify(menus));
  }, [menus]);
  
  // 컴포넌트 언마운트 시 애니메이션 정리
  useEffect(() => {
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, []);
  
  // 메뉴 추가 함수
  const addMenu = () => {
    const trimmed = customMenu.trim();
    if (trimmed && !menus.includes(trimmed)) {
      setMenus([...menus, trimmed]);
      setCustomMenu('');
      
      // 모바일에서 입력 후 키보드 닫기
      if (isMobile && inputRef.current) {
        inputRef.current.blur();
      }
    }
  };
  
  // 메뉴 삭제 함수
  const removeMenu = (index) => {
    if (menus.length <= 2) {
      // 모바일 최적화된 경고창
      if (isMobile) {
        // 진동 피드백 (지원되는 기기에서)
        if ('vibrate' in navigator) {
          navigator.vibrate(100);
        }
      }
      
      alert('최소 2개의 메뉴가 필요합니다.');
      return;
    }
    
    // 진동 피드백 (지원되는 기기에서)
    if (isMobile && 'vibrate' in navigator) {
      navigator.vibrate(50);
    }
    
    const newMenus = [...menus];
    newMenus.splice(index, 1);
    setMenus(newMenus);
  };
  
  // 룰렛 스핀 함수
  const spinRoulette = () => {
    if (isSpinning || menus.length < 2) return;
    
    // 진동 피드백 (지원되는 기기에서)
    if (isMobile && 'vibrate' in navigator) {
      navigator.vibrate([50, 30, 100]);
    }
    
    setIsSpinning(true);
    setSelectedMenu(null);
    setShowPopup(false);
    setConfetti([]);
    
    // 2~5회전 + 랜덤한 각도
    const additionalRotation = 720 + 1080 * Math.random();
    endRotationRef.current = rotation + additionalRotation;
    
    if (animationRef.current) cancelAnimationFrame(animationRef.current);
    
    const animate = (timestamp) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp;
      
      const elapsed = timestamp - startTimeRef.current;
      const progress = Math.min(elapsed / (spinDuration * 1000), 1);
      
      // 이징 함수
      const easeOutQuint = (t) => 1 - Math.pow(1 - t, 5);
      
      if (progress < 1) {
        // 회전 진행 중
        const currentRotation = rotation + (endRotationRef.current - rotation) * easeOutQuint(progress);
        setRotation(currentRotation);
        animationRef.current = requestAnimationFrame(animate);
      } else {
        // 회전 완료
        setRotation(endRotationRef.current);
        setIsSpinning(false);
        
        // 선택된 메뉴 계산
        const sectorAngle = 360 / menus.length;
        const normalizedRotation = endRotationRef.current % 360;
        const selectedIndex = Math.floor(((360 - normalizedRotation) % 360) / sectorAngle);
        const selected = menus[selectedIndex];
        setSelectedMenu(selected);
        
        // 폭죽 생성
        createConfetti();
        
        // 팝업 표시
        setTimeout(() => {
          setShowPopup(true);
        }, 300);
        
        // 결과 발표시 진동 피드백
        if (isMobile && 'vibrate' in navigator) {
          navigator.vibrate([50, 50, 100, 50, 100]);
        }
        
        startTimeRef.current = null;
      }
    };
    
    animationRef.current = requestAnimationFrame(animate);
  };
  
  // 폭죽 생성 함수
  const createConfetti = () => {
    const newConfetti = [];
    const colors = ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40'];
    
    // 30-50개 랜덤 폭죽 조각 생성
    const pieces = Math.floor(Math.random() * 20) + 30;
    
    for (let i = 0; i < pieces; i++) {
      newConfetti.push({
        id: i,
        x: 50 + Math.random() * 50 - 25, // 화면 중앙 근처에서 시작
        y: 50 + Math.random() * 10,
        size: Math.random() * 8 + 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * 360,
        xVelocity: Math.random() * 20 - 10, // 좌우 속도
        yVelocity: -(Math.random() * 10 + 5),  // 위로 향하는 속도
        rotationVelocity: Math.random() * 10 - 5,
      });
    }
    
    setConfetti(newConfetti);
    
    // 폭죽 애니메이션
    let frame = 0;
    const animate = () => {
      frame++;
      
      if (frame < 150) { // 약 2.5초 동안 애니메이션
        setConfetti(prev => prev.map(piece => {
          // 중력 적용
          const yVelocity = piece.yVelocity + 0.2; 
          return {
            ...piece,
            x: piece.x + piece.xVelocity * 0.1,
            y: piece.y + yVelocity * 0.1,
            rotation: (piece.rotation + piece.rotationVelocity) % 360,
            yVelocity
          };
        }));
        requestAnimationFrame(animate);
      } else {
        // 애니메이션 종료
        setConfetti([]);
      }
    };
    
    requestAnimationFrame(animate);
  };
  
  // 화면 크기에 따른 룰렛 크기 계산 - 모바일에 최적화
  const wheelSize = useMemo(() => {
    // 모바일에서는 화면 너비의 90%, 최대 320px
    const size = Math.min(windowWidth * 0.9, isMobile ? 320 : 360);
    return {
      width: size,
      height: size,
      center: size / 2,
      radius: (size / 2) * 0.85
    };
  }, [windowWidth, isMobile]);
  
  // 원형 판 렌더링
  const renderWheel = () => {
    const { center: centerX, center: centerY, radius, width, height } = wheelSize;
    const sectorAngle = 360 / menus.length;
    
    return (
      <svg width={width} height={height} className="relative">
        {menus.map((menu, index) => {
          // 섹터 각도 계산
          const startAngle = index * sectorAngle;
          const endAngle = (index + 1) * sectorAngle;
          
          // 각도를 라디안으로 변환
          const startRad = (startAngle - 90) * Math.PI / 180;
          const endRad = (endAngle - 90) * Math.PI / 180;
          
          // 원호 좌표 계산
          const x1 = centerX + radius * Math.cos(startRad);
          const y1 = centerY + radius * Math.sin(startRad);
          const x2 = centerX + radius * Math.cos(endRad);
          const y2 = centerY + radius * Math.sin(endRad);
          
          // SVG 패스 생성
          const largeArcFlag = sectorAngle > 180 ? 1 : 0;
          const pathData = `M ${centerX} ${centerY} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;
          
          // 텍스트 위치 및 크기 계산
          const midAngle = ((startAngle + endAngle) / 2 - 90) * Math.PI / 180;
          const textDistance = radius * 0.6;
          const textX = centerX + textDistance * Math.cos(midAngle);
          const textY = centerY + textDistance * Math.sin(midAngle);
          
          // 모바일 최적화 폰트 크기
          const fontSize = isMobile ? (windowWidth < 360 ? 10 : 12) : 14;
          
          // 모바일에서 긴 텍스트 처리
          let displayMenu = menu;
          if (isMobile) {
            // 화면 크기와 섹터 수에 따라 텍스트 길이 동적 조정
            const maxLength = Math.floor(8 - menus.length / 3);
            if (menu.length > maxLength) {
              displayMenu = menu.substring(0, maxLength - 1) + '..';
            }
          }
          
          return (
            <g key={index}>
              <path 
                d={pathData} 
                fill={COLORS[index % COLORS.length]} 
                cursor="pointer"
                onClick={() => !isSpinning && removeMenu(index)}
              />
              <text
                x={textX}
                y={textY}
                textAnchor="middle"
                dominantBaseline="middle"
                fill="white"
                fontWeight="bold"
                fontSize={fontSize}
                transform={`rotate(${(startAngle + endAngle) / 2 - 90}, ${textX}, ${textY})`}
                pointerEvents="none"
              >
                {displayMenu}
              </text>
            </g>
          );
        })}
        
        {/* 중앙 원 */}
        <circle cx={centerX} cy={centerY} r={radius * 0.07} fill="#333" />
      </svg>
    );
  };
  
  return (
    <div className="flex flex-col items-center p-2 max-w-md mx-auto min-h-screen bg-white">
      {/* 상단 헤더 */}
      <h1 className="text-xl sm:text-2xl font-bold mt-2 mb-3 text-center">오늘의 점심 메뉴는?</h1>
      
      {/* 룰렛 휠 컨테이너 */}
      <div className="relative mb-3 w-full flex justify-center">
        {/* 고정된 화살표 */}
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-2 z-10">
          <svg width="20" height="20">
            <polygon points="10,20 0,5 20,5" fill="red" />
          </svg>
        </div>
        
        {/* 회전하는 룰렛 */}
        <div style={{ 
          transform: `rotate(${rotation}deg)`, 
          transition: isSpinning ? 'none' : 'transform 0.3s ease-out',
          touchAction: 'none',  // 터치 동작 방지
          WebkitTapHighlightColor: 'transparent', // 모바일에서 탭 효과 제거
          userSelect: 'none' // 텍스트 선택 방지
        }}>
          {renderWheel()}
        </div>
        
        {/* 폭죽 효과 */}
        {confetti.length > 0 && (
          <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
            {confetti.map(piece => (
              <div
                key={piece.id}
                className="absolute rounded-full"
                style={{
                  left: `${piece.x}%`,
                  top: `${piece.y}%`,
                  width: `${piece.size}px`,
                  height: `${piece.size}px`,
                  backgroundColor: piece.color,
                  transform: `rotate(${piece.rotation}deg)`,
                  opacity: 0.8,
                  zIndex: 100,
                }}
              />
            ))}
          </div>
        )}
      </div>
      
      {/* 스핀 버튼 - 모바일에서 더 크게 */}
      <button
        onClick={spinRoulette}
        disabled={isSpinning || menus.length < 2}
        className={`mb-3 py-3 px-6 rounded-lg text-white font-bold text-lg
          ${isSpinning || menus.length < 2 ? 'bg-gray-400' : 'bg-blue-500 active:bg-blue-700'}
          shadow-md w-4/5 sm:w-auto touch-manipulation`}
        style={{ 
          WebkitTapHighlightColor: 'transparent',
          touchAction: 'manipulation' 
        }}
      >
        {isSpinning ? '돌아가는 중...' : '룰렛 돌리기'}
      </button>
      
      {/* 메뉴 추가 영역 */}
      <div className="w-full mb-3 px-2">
        <h2 className="text-lg sm:text-xl font-bold mb-1">메뉴 추가</h2>
        <div className="flex">
          <input
            ref={inputRef}
            type="text"
            inputMode={isMobile ? "text" : undefined}
            value={customMenu}
            onChange={(e) => setCustomMenu(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addMenu()}
            placeholder="새 메뉴 입력"
            className="flex-1 p-3 border border-gray-300 rounded-l-lg text-base"
            style={{ 
              WebkitAppearance: 'none', 
              fontSize: isMobile ? '16px' : 'inherit' // iOS에서 확대 방지
            }}
          />
          <button
            onClick={addMenu}
            className="bg-green-500 active:bg-green-700 text-white py-3 px-4 rounded-r-lg text-base touch-manipulation"
            style={{ WebkitTapHighlightColor: 'transparent' }}
          >
            추가
          </button>
        </div>
      </div>
      
      {/* 회전 시간 설정 - 모바일 최적화 */}
      <div className="w-full mt-1 px-2">
        <h2 className="text-lg sm:text-xl font-bold mb-1">회전 시간 설정 (초)</h2>
        <div className="flex items-center">
          <span className="mr-2">{spinDuration}초</span>
          <input
            type="range"
            min="2"
            max="10"
            value={spinDuration}
            onChange={(e) => setSpinDuration(parseInt(e.target.value))}
            className="flex-1 h-10 rounded-lg"
            style={{ 
              WebkitAppearance: 'none',
              appearance: 'none',
              background: '#edf2f7',
              height: '10px',
              borderRadius: '5px'
            }}
          />
        </div>
      </div>
      
      {/* 힌트 메시지 */}
      <div className="mt-3 text-sm text-gray-600 px-2 text-center">
        <p>원하지 않는 메뉴는 파이를 터치하여 제거할 수 있습니다.</p>
      </div>
      
      {/* 결과 팝업 */}
      {showPopup && selectedMenu && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-40" onClick={() => setShowPopup(false)}>
          <div 
            className="bg-white rounded-lg p-5 shadow-xl max-w-xs w-4/5 text-center transform scale-100 transition-transform duration-300"
            style={{ animation: 'popIn 0.3s ease-out' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-lg font-bold mb-2">오늘의 점심 메뉴</div>
            <div className="text-3xl font-extrabold p-4 bg-yellow-100 rounded-lg mb-3">{selectedMenu}</div>
            <p className="text-gray-600 mb-3">맛있게 드세요!</p>
            <button 
              className="bg-blue-500 text-white py-2 px-4 rounded-lg text-lg font-bold w-full"
              onClick={() => setShowPopup(false)}
            >
              확인
            </button>
          </div>
        </div>
      )}
      
      <style jsx global>{`
        @keyframes popIn {
          0% { transform: scale(0.5); opacity: 0; }
          70% { transform: scale(1.1); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default LunchRoulette;

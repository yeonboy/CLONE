import React from 'react';

const FloatingDataBackground: React.FC = () => {
  const particles = Array.from({ length: 100 });
  
  return (
    <>
      <style>{`
        @keyframes float-up-data { 
          0% { transform: translateY(0); opacity: 0; } 
          10%, 90% { opacity: 1; } 
          100% { transform: translateY(-100vh); opacity: 0; } 
        }
        .data-bg-container { 
          position: absolute; 
          top: 0; 
          left: 0; 
          right: 0; 
          bottom: 0; 
          z-index: 0; 
          overflow: hidden; 
        }
        .data-point { 
          position: absolute; 
          bottom: -10px; 
          background-color: rgba(0, 209, 255, 0.7); 
          border-radius: 50%; 
          animation-name: float-up-data; 
          animation-timing-function: linear; 
          animation-iteration-count: infinite; 
          box-shadow: 0 0 5px rgba(0, 209, 255, 0.5), 0 0 10px rgba(0, 209, 255, 0.3); 
        }
      `}</style>
      <div className="data-bg-container">
        {particles.map((_, i) => {
          const size = Math.random() * 3 + 1;
          return (
            <span
              key={i}
              className="data-point"
              style={{
                left: `${Math.random() * 100}%`,
                width: `${size}px`,
                height: `${size}px`,
                animationDuration: `${Math.random() * 15 + 10}s`,
                animationDelay: `${Math.random() * 25}s`,
              }}
            />
          );
        })}
      </div>
    </>
  );
};

export default FloatingDataBackground;

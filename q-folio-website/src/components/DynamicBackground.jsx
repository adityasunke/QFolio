import React, { useState, useEffect, useRef } from 'react';

const DynamicBackground = ({ mousePosition = { x: 0, y: 0 }, time = 0 }) => {
  // Ensure we have valid values with fallbacks
  const safeMousePosition = mousePosition || { x: 0, y: 0 };
  const safeTime = time || 0;

  // Generate realistic stock price movements
  const generatePriceData = (basePrice, volatility, timeOffset) => {
    return basePrice + Math.sin(safeTime * 0.5 + timeOffset) * volatility + 
           Math.random() * 2 - 1;
  };

  // Financial symbols floating
  const financialSymbols = ['$', '€', '¥', '£', '₿', '△', '▽', '◊', '⟡', '⬢'];
  const quantumSymbols = ['ψ', 'Ω', 'λ', 'α', 'β', 'γ', 'δ', 'θ', 'φ', '∞'];

  return (
    <div className="fixed inset-0 w-full h-full bg-black overflow-hidden pointer-events-none z-0">
      {/* Quantum field grid */}
      <div className="absolute inset-0 opacity-15">
        <div 
          className="absolute inset-0"
          style={{
            backgroundImage: `
              linear-gradient(90deg, rgba(0, 255, 157, 0.3) 1px, transparent 1px),
              linear-gradient(rgba(59, 130, 246, 0.2) 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px',
            transform: `translate(${Math.sin(safeTime * 0.1) * 20}px, ${Math.cos(safeTime * 0.08) * 15}px) rotate(${safeTime * 0.5}deg)`,
          }}
        ></div>
      </div>

      {/* Stock price charts floating */}
      <div className="absolute inset-0">
        {Array.from({ length: 6 }, (_, i) => {
          const pricePoints = Array.from({ length: 20 }, (_, j) => 
            generatePriceData(100 + i * 50, 10, i * 2 + j * 0.1)
          );
          
          return (
            <div
              key={`chart-${i}`}
              className="absolute"
              style={{
                left: `${10 + (i * 15) % 80}%`,
                top: `${15 + (i * 12) % 70}%`,
                transform: `translate(${Math.sin(safeTime * 0.2 + i) * 40}px, ${Math.cos(safeTime * 0.15 + i) * 30}px) rotate(${Math.sin(safeTime * 0.1 + i) * 10}deg)`,
                opacity: 0.6 + Math.sin(safeTime + i) * 0.3,
              }}
            >
              {/* Mini chart */}
              <svg width="80" height="40" className="opacity-70">
                <polyline
                  fill="none"
                  stroke="rgba(0, 255, 157, 0.8)"
                  strokeWidth="1.5"
                  points={pricePoints.map((price, idx) => `${idx * 4},${40 - ((price - 50) / 100) * 30}`).join(' ')}
                />
                {/* Price trend indicator */}
                <circle
                  cx={76}
                  cy={40 - ((pricePoints[pricePoints.length - 1] - 50) / 100) * 30}
                  r="2"
                  fill="rgba(0, 255, 157, 0.9)"
                  style={{
                    filter: 'drop-shadow(0 0 4px rgba(0, 255, 157, 0.8))',
                  }}
                />
              </svg>
              
              {/* Price label */}
              <div 
                className="text-xs font-mono text-green-400"
                style={{
                  textShadow: '0 0 8px rgba(0, 255, 157, 0.6)',
                }}
              >
                ${pricePoints[pricePoints.length - 1].toFixed(2)}
              </div>
            </div>
          );
        })}
      </div>

      {/* Quantum entanglement nodes */}
      <div className="absolute inset-0">
        {Array.from({ length: 8 }, (_, i) => {
          const nodeX = 20 + (i * 11) % 60;
          const nodeY = 25 + (i * 13) % 50;
          return (
            <div key={`quantum-node-${i}`}>
              {/* Quantum particle */}
              <div
                className="absolute rounded-full"
                style={{
                  width: `${6 + Math.sin(safeTime * 3 + i) * 3}px`,
                  height: `${6 + Math.sin(safeTime * 3 + i) * 3}px`,
                  left: `${nodeX}%`,
                  top: `${nodeY}%`,
                  background: `radial-gradient(circle, rgba(59, 130, 246, ${0.9 + Math.sin(safeTime * 2 + i) * 0.1}), rgba(0, 255, 157, 0.4))`,
                  transform: `scale(${1 + Math.sin(safeTime * 4 + i) * 0.5})`,
                  boxShadow: `0 0 ${15 + Math.sin(safeTime * 2 + i) * 8}px rgba(59, 130, 246, 0.7)`,
                }}
              ></div>
              
              {/* Quantum entanglement lines */}
              {Array.from({ length: 2 }, (_, j) => (
                <div
                  key={`entangle-${i}-${j}`}
                  className="absolute"
                  style={{
                    height: '1px',
                    left: `${nodeX}%`,
                    top: `${nodeY}%`,
                    width: `${60 + Math.sin(safeTime * 0.8 + i + j) * 40}px`,
                    background: `linear-gradient(90deg, rgba(59, 130, 246, 0.6), rgba(0, 255, 157, 0.4), transparent)`,
                    transform: `rotate(${safeTime * 20 + i * 60 + j * 180}deg)`,
                    opacity: 0.5 + Math.sin(safeTime * 2 + i + j) * 0.3,
                    transformOrigin: 'left center',
                    filter: 'blur(0.5px)',
                  }}
                ></div>
              ))}
            </div>
          );
        })}
      </div>

      {/* Financial symbols matrix rain */}
      <div className="absolute inset-0">
        {Array.from({ length: 30 }, (_, i) => (
          <div
            key={`symbol-${i}`}
            className="absolute font-mono text-lg font-bold"
            style={{
              left: `${(i * 3.3) % 100}%`,
              top: `${-10 + ((safeTime * 2 + i * 0.1) % 120)}%`,
              color: i % 2 === 0 ? 'rgba(0, 255, 157, 0.6)' : 'rgba(59, 130, 246, 0.5)',
              transform: `scale(${0.8 + Math.sin(safeTime + i) * 0.3})`,
              textShadow: `0 0 10px ${i % 2 === 0 ? 'rgba(0, 255, 157, 0.8)' : 'rgba(59, 130, 246, 0.8)'}`,
              opacity: 0.7 + Math.sin(safeTime * 2 + i) * 0.3,
            }}
          >
            {i % 2 === 0 ? financialSymbols[i % financialSymbols.length] : quantumSymbols[i % quantumSymbols.length]}
          </div>
        ))}
      </div>

      {/* Probability wave functions */}
      <div className="absolute inset-0 overflow-hidden">
        {Array.from({ length: 5 }, (_, i) => (
          <div
            key={`wave-${i}`}
            className="absolute w-full h-full"
            style={{
              background: `radial-gradient(ellipse at ${40 + Math.sin(safeTime * (0.2 + i * 0.08)) * 30}% ${45 + Math.cos(safeTime * (0.15 + i * 0.05)) * 25}%, 
                ${i % 2 === 0 ? 'rgba(0, 255, 157, 0.1)' : 'rgba(59, 130, 246, 0.08)'} 0%, 
                transparent ${40 + i * 15}%)`,
              opacity: 0.4 + Math.sin(safeTime * 1.5 + i) * 0.2,
            }}
          ></div>
        ))}
      </div>

      {/* Trading algorithm paths */}
      <div className="absolute inset-0">
        {Array.from({ length: 4 }, (_, i) => (
          <svg
            key={`algo-path-${i}`}
            className="absolute inset-0 w-full h-full"
            style={{ opacity: 0.3 }}
          >
            <path
              d={`M ${20 + i * 20} 50 Q ${200 + Math.sin(safeTime + i) * 100} ${100 + Math.cos(safeTime * 0.5 + i) * 50} ${400 + i * 100} ${200 + Math.sin(safeTime * 0.8 + i) * 80}`}
              fill="none"
              stroke={i % 2 === 0 ? "rgba(0, 255, 157, 0.6)" : "rgba(59, 130, 246, 0.5)"}
              strokeWidth="2"
              strokeDasharray="10,5"
              style={{
                strokeDashoffset: safeTime * 50,
                filter: 'drop-shadow(0 0 3px rgba(0, 255, 157, 0.4))',
              }}
            />
          </svg>
        ))}
      </div>

      
      {/* Quantum superposition particles */}
      <div className="absolute inset-0">
        {Array.from({ length: 20 }, (_, i) => (
          <div
            key={`superposition-${i}`}
            className="absolute"
            style={{
              width: `${1 + (i % 2)}px`,
              height: `${1 + (i % 2)}px`,
              left: `${(i * 5.1) % 100}%`,
              top: `${(i * 3.7) % 100}%`,
              background: i % 3 === 0 ? 'rgba(0, 255, 157, 0.8)' : 'rgba(59, 130, 246, 0.6)',
              borderRadius: '50%',
              transform: `translate(${Math.sin(safeTime * (0.4 + i * 0.02)) * 200}px, ${Math.cos(safeTime * (0.3 + i * 0.015)) * 150}px)`,
              opacity: 0.3 + Math.sin(safeTime * 3 + i) * 0.4,
              boxShadow: `0 0 ${6 + Math.sin(safeTime + i) * 3}px ${i % 3 === 0 ? 'rgba(0, 255, 157, 0.9)' : 'rgba(59, 130, 246, 0.8)'}`,
            }}
          ></div>
        ))}
      </div>

      {/* Market volatility indicators */}
      <div className="absolute inset-0">
        {Array.from({ length: 6 }, (_, i) => (
          <div
            key={`volatility-${i}`}
            className="absolute font-mono text-xs"
            style={{
              left: `${10 + (i * 16) % 80}%`,
              top: `${80 + (i * 3) % 15}%`,
              color: Math.sin(safeTime + i) > 0 ? 'rgba(0, 255, 157, 0.8)' : 'rgba(255, 107, 107, 0.8)',
              transform: `translate(${Math.sin(safeTime * 0.3 + i) * 20}px, ${Math.cos(safeTime * 0.2 + i) * 10}px)`,
              textShadow: `0 0 8px ${Math.sin(safeTime + i) > 0 ? 'rgba(0, 255, 157, 0.6)' : 'rgba(255, 107, 107, 0.6)'}`,
            }}
          >
            {Math.sin(safeTime + i) > 0 ? '↗' : '↘'} {(Math.abs(Math.sin(safeTime * 2 + i)) * 10).toFixed(1)}%
          </div>
        ))}
      </div>

      {/* Quantum tunneling effect borders */}
      <div className="absolute inset-0">
        <div 
          className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-green-400 to-transparent"
          style={{
            opacity: 0.6 + Math.sin(safeTime * 3) * 0.4,
            transform: `scaleX(${0.5 + Math.sin(safeTime * 1.2) * 0.5})`,
            filter: 'blur(1px)',
          }}
        ></div>
        
        <div 
          className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-blue-400 to-transparent"
          style={{
            opacity: 0.6 + Math.cos(safeTime * 2.7) * 0.4,
            transform: `scaleX(${0.5 + Math.cos(safeTime * 1.5) * 0.5})`,
            filter: 'blur(1px)',
          }}
        ></div>
      </div>

      {/* Central quantum-financial nexus */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div
          className="relative"
          style={{
            transform: `rotate(${safeTime * 10}deg) scale(${1 + Math.sin(safeTime * 2) * 0.3})`,
          }}
        >
          {/* Central core */}
          <div
            className="w-3 h-3 rounded-full"
            style={{
              background: `conic-gradient(from 0deg, rgba(0, 255, 157, 0.9), rgba(59, 130, 246, 0.9), rgba(0, 255, 157, 0.9))`,
              boxShadow: `0 0 ${25 + Math.sin(safeTime * 4) * 15}px rgba(0, 255, 157, 0.8)`,
            }}
          ></div>
          
          {/* Orbiting financial symbols */}
          {Array.from({ length: 4 }, (_, i) => (
            <div
              key={`orbit-${i}`}
              className="absolute text-xs font-bold"
              style={{
                left: `${20 + Math.cos(safeTime * 2 + i * Math.PI / 2) * 30}px`,
                top: `${20 + Math.sin(safeTime * 2 + i * Math.PI / 2) * 30}px`,
                color: 'rgba(0, 255, 157, 0.9)',
                textShadow: '0 0 8px rgba(0, 255, 157, 0.8)',
                transform: `rotate(${-safeTime * 10}deg)`,
              }}
            >
              {['$', '€', '¥', '₿'][i]}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DynamicBackground;
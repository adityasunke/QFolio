import React from 'react';

const DynamicBackground = ({ mousePosition, time }) => (
  <div className="fixed inset-0 pointer-events-none">
    {/* Animated grid pattern */}
    <div className="absolute inset-0 opacity-10">
      <div 
        className="absolute inset-0 bg-gradient-to-br from-blue-500/20 via-transparent to-purple-500/20"
        style={{
          backgroundImage: `
            linear-gradient(90deg, rgba(59, 130, 246, 0.1) 1px, transparent 1px),
            linear-gradient(rgba(59, 130, 246, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px',
          transform: `translate(${Math.sin(time * 0.1) * 20}px, ${Math.cos(time * 0.1) * 20}px)`,
        }}
      ></div>
    </div>

    {/* Floating geometric shapes */}
    <div className="absolute inset-0">
      {Array.from({ length: 8 }, (_, i) => (
        <div
          key={i}
          className="absolute border border-blue-400/20 backdrop-blur-sm"
          style={{
            width: `${40 + (i % 3) * 20}px`,
            height: `${40 + (i % 3) * 20}px`,
            left: `${10 + (i * 12) % 80}%`,
            top: `${15 + (i * 8) % 70}%`,
            transform: `rotate(${time * (0.5 + i * 0.1)}deg) translate(${Math.sin(time * 0.2 + i) * 30}px, ${Math.cos(time * 0.3 + i) * 20}px)`,
            borderRadius: i % 2 === 0 ? '50%' : '0%',
            background: i % 3 === 0 ? 'linear-gradient(45deg, rgba(59, 130, 246, 0.05), rgba(147, 51, 234, 0.05))' : 'transparent',
          }}
        ></div>
      ))}
    </div>

    {/* Pulsing nodes with connections */}
    <div className="absolute inset-0">
      {Array.from({ length: 6 }, (_, i) => (
        <div key={`node-${i}`}>
          {/* Node */}
          <div
            className="absolute w-3 h-3 bg-blue-400/40 rounded-full"
            style={{
              left: `${20 + (i * 15) % 60}%`,
              top: `${25 + (i * 12) % 50}%`,
              transform: `scale(${1 + Math.sin(time + i) * 0.3})`,
              boxShadow: '0 0 20px rgba(59, 130, 246, 0.3)',
            }}
          ></div>
          
          {/* Connection lines */}
          {i < 5 && (
            <div
              className="absolute h-px bg-gradient-to-r from-blue-400/20 to-transparent"
              style={{
                left: `${20 + (i * 15) % 60}%`,
                top: `${25 + (i * 12) % 50}%`,
                width: `${100 + Math.sin(time * 0.5) * 50}px`,
                transform: `rotate(${45 + i * 30}deg)`,
                opacity: 0.3 + Math.sin(time + i) * 0.2,
              }}
            ></div>
          )}
        </div>
      ))}
    </div>

    {/* Flowing wave patterns */}
    <div className="absolute inset-0 overflow-hidden">
      <div
        className="absolute w-full h-full opacity-5"
        style={{
          background: `radial-gradient(ellipse at ${50 + Math.sin(time * 0.3) * 20}% ${50 + Math.cos(time * 0.2) * 20}%, rgba(59, 130, 246, 0.3) 0%, transparent 50%)`,
        }}
      ></div>
      <div
        className="absolute w-full h-full opacity-5"
        style={{
          background: `radial-gradient(ellipse at ${50 + Math.sin(time * 0.4) * 25}% ${50 + Math.cos(time * 0.3) * 25}%, rgba(147, 51, 234, 0.3) 0%, transparent 40%)`,
        }}
      ></div>
    </div>

    {/* Interactive mouse trail */}
    <div 
      className="absolute w-20 h-20 rounded-full transition-all duration-700 ease-out"
      style={{
        left: `${mousePosition.x - 40}px`,
        top: `${mousePosition.y - 40}px`,
        background: 'radial-gradient(circle, rgba(59, 130, 246, 0.1) 0%, transparent 70%)',
        filter: 'blur(10px)',
      }}
    ></div>

    {/* Quantum-inspired particle field */}
    <div className="absolute inset-0">
      {Array.from({ length: 15 }, (_, i) => (
        <div
          key={`quantum-${i}`}
          className="absolute w-1 h-1 bg-blue-300/30 rounded-full"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            transform: `translate(${Math.sin(time * 0.5 + i) * 100}px, ${Math.cos(time * 0.3 + i) * 80}px)`,
            opacity: 0.3 + Math.sin(time + i) * 0.3,
            boxShadow: '0 0 10px rgba(59, 130, 246, 0.5)',
          }}
        ></div>
      ))}
    </div>
  </div>
);

export default DynamicBackground;
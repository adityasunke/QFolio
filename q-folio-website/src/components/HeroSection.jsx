import React from 'react';

const HeroSection = ({ scrollToSection }) => (
  <section id="hero" className="min-h-screen flex items-center justify-center relative z-10">
    <div className="container mx-auto px-6 text-center">
      <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-transparent">
        Q-Folio
      </h1>
      <p className="text-xl md:text-2xl text-gray-300 mb-12 max-w-4xl mx-auto">
        The Quantum Edge for Portfolio Optimization
      </p>
      <div className="flex justify-center">
        <button 
          onClick={() => scrollToSection('about')}
          className="px-8 py-4 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold transition-all transform hover:scale-105 shadow-lg shadow-blue-500/25"
        >
          Explore Q-Folio
        </button>
      </div>
    </div>
  </section>
);

export default HeroSection;
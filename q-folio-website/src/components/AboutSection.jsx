import React from 'react';

const AboutSection = ({ scrollToSection }) => (
  <section id="about" className="py-20 bg-black/30 backdrop-blur-sm relative z-10">
    <div className="container mx-auto px-6">
      <h2 className="text-4xl font-bold text-center mb-12 text-blue-400">About The Project</h2>
      <div className="max-w-4xl mx-auto">
        <p className="text-lg text-gray-300 leading-relaxed text-center mb-12">
          This project explores the intersection of quantum computing principles and modern portfolio theory. 
          By leveraging quantum-inspired algorithms, we aim to solve the complex optimization problem of 
          portfolio allocation across the Magnificent 7 stocks. The system analyzes historical price data, 
          market correlations, and risk factors to generate optimal portfolio weights that maximize returns 
          while minimizing risk. Our approach combines traditional financial models with cutting-edge 
          computational techniques to provide superior portfolio performance in volatile market conditions.
        </p>
        <div className="text-center">
          <button 
            onClick={() => scrollToSection('graph')}
            className="px-8 py-4 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold transition-all transform hover:scale-105 shadow-lg shadow-blue-500/25"
          >
            Stock Performance
          </button>
        </div>
      </div>
    </div>
  </section>
);

export default AboutSection;
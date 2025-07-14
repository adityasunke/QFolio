import React from 'react';

const AboutSection = ({ scrollToSection }) => (
  <section id="about" className="py-20 bg-black/30 backdrop-blur-sm relative z-10">
    <div className="container mx-auto px-6">
      <h2 className="text-4xl font-bold text-center mb-12 text-blue-400">About The Project</h2>
      <div className="max-w-4xl mx-auto">
        <p className="text-lg text-gray-300 leading-relaxed text-center mb-12">
          Q-Folio is an innovative quantum finance project that explores the intersection of quantum 
          computing and portfolio optimization. Leveraging the power of the Quantum Approximate Optimization 
          Algorithm (QAOA), Q-Folio tackles the complex problem of optimizing investment allocations among 
          the Magnificent 7 stocks—a group of leading technology companies dominating the market.
          At the heart of Q-Folio lies the Markowitz Portfolio Theory, which provides a mathematical 
          framework to balance risk and return in investment portfolios. By translating this classical 
          financial model into a quantum optimization problem, Q-Folio aims to discover portfolio 
          allocations that maximize expected returns while minimizing risk more efficiently than 
          traditional methods. Q-Folio demonstrates how quantum computing can transform financial 
          decision-making, offering new computational approaches for solving problems that are otherwise 
          challenging for classical computers. This project serves as a proof-of-concept for the future of 
          quantum-enhanced financial analytics and portfolio management.
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
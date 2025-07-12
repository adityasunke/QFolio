import React from 'react';

const Navigation = ({ scrollToSection }) => (
  <nav className="fixed top-0 left-0 right-0 z-50 bg-black/30 backdrop-blur-md border-b border-blue-500/30">
    <div className="container mx-auto px-6 py-4">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-bold text-blue-400">Q-Folio</h1>
        <div className="hidden md:flex space-x-6">
          <button 
            onClick={() => scrollToSection('hero')} 
            className="hover:text-blue-400 transition-colors"
          >
            Home
          </button>
          <button 
            onClick={() => scrollToSection('about')} 
            className="hover:text-blue-400 transition-colors"
          >
            About the Project
          </button>
          <button 
            onClick={() => scrollToSection('graph')} 
            className="hover:text-blue-400 transition-colors"
          >
            Magnificent 7 Stock Performance
          </button>
          <button 
            onClick={() => scrollToSection('implementation')} 
            className="hover:text-blue-400 transition-colors"
          >
            Implementation
          </button>
          <button 
            onClick={() => scrollToSection('aboutme')} 
            className="hover:text-blue-400 transition-colors"
          >
            About Me
          </button>
        </div>
      </div>
    </div>
  </nav>
);

export default Navigation;
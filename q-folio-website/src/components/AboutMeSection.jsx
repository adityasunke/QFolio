import React from 'react';
import { Linkedin, Github, Mail } from 'lucide-react';

const AboutMeSection = () => (
  <section id="aboutme" className="py-20 bg-black/20 backdrop-blur-sm relative z-10">
    <div className="container mx-auto px-6">
      <h2 className="text-4xl font-bold text-center mb-12 text-blue-400">About Me</h2>
      
      <div className="max-w-4xl mx-auto text-center">
        <div className="mb-8">
          <img
            src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80"
            alt="Profile"
            className="w-32 h-32 rounded-full mx-auto border-4 border-blue-400 shadow-lg shadow-blue-500/25"
          />
        </div>
        
        <div className="mb-8">
          <p className="text-lg text-gray-300 leading-relaxed max-w-3xl mx-auto">
            I'm a passionate quantitative analyst and software engineer specializing in financial technology 
            and quantum computing applications. With a background in computer science and mathematics, I focus 
            on developing innovative solutions that bridge the gap between theoretical algorithms and practical 
            financial applications. My work explores the potential of quantum-inspired optimization techniques 
            to solve complex portfolio management challenges.
          </p>
        </div>
        
        <div className="flex justify-center gap-6">
          <a
            href="https://linkedin.com/in/yourprofile"
            target="_blank"
            rel="noopener noreferrer"
            className="p-3 bg-blue-600 hover:bg-blue-700 rounded-full transition-all transform hover:scale-110 shadow-lg shadow-blue-500/25"
          >
            <Linkedin className="w-6 h-6" />
          </a>
          <a
            href="https://github.com/yourusername"
            target="_blank"
            rel="noopener noreferrer"
            className="p-3 bg-gray-800 hover:bg-gray-700 rounded-full transition-all transform hover:scale-110 shadow-lg border border-gray-600 hover:border-blue-400"
          >
            <Github className="w-6 h-6" />
          </a>
          <a
            href="mailto:your.email@example.com"
            className="p-3 bg-purple-600 hover:bg-purple-700 rounded-full transition-all transform hover:scale-110 shadow-lg shadow-purple-500/25"
          >
            <Mail className="w-6 h-6" />
          </a>
        </div>
      </div>
    </div>
  </section>
);

export default AboutMeSection;
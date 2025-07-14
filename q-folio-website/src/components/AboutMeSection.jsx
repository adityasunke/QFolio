import React from 'react';
import { Linkedin, Github, Mail } from 'lucide-react';

const AboutMeSection = () => (
  <section id="aboutme" className="py-20 bg-black/20 backdrop-blur-sm relative z-10">
    <div className="container mx-auto px-6">
      <h2 className="text-4xl font-bold text-center mb-12 text-blue-400">About Me</h2>
      
      <div className="max-w-4xl mx-auto text-center">
        <div className="mb-8">
          <img
            src="https://media.licdn.com/dms/image/v2/D5603AQEciFzeVJNPNA/profile-displayphoto-shrink_400_400/B56ZTPrr9NHQAg-/0/1738651124201?e=1758153600&v=beta&t=O9z5qhoQq-1wA_fUTJaxv5muwPQJ_gxtEHgZdjleDYo"
            alt="Profile"
            className="w-32 h-32 rounded-full mx-auto border-4 border-blue-400 shadow-lg shadow-blue-500/25"
          />
        </div>
        
        <div className="mb-8">
          <p className="text-lg text-gray-300 leading-relaxed max-w-3xl mx-auto">
            I am Aditya Sunke! I am a Computer Science major at Virginia Tech. I am also doing a minor in 
            Quantum Information Science and Engineering. I am deeply fascinated by the ways in which 
            technology can address some of the world's most complex challenges, and quantum computing, 
            in particular, captivates me for its potential to revolutionize the very foundations of 
            computation. I find immense satisfaction in delving into the theoretical principles that 
            underpin quantum technologies, while also exploring practical, real-world applications capable 
            of delivering transformative impact across industries.
          </p>
        </div>
        
        <div className="flex justify-center gap-6">
          <a
            href="https://linkedin.com/in/aditya-sunke"
            target="_blank"
            rel="noopener noreferrer"
            className="p-3 bg-blue-600 hover:bg-blue-700 rounded-full transition-all transform hover:scale-110 shadow-lg shadow-blue-500/25"
          >
            <Linkedin className="w-6 h-6" />
          </a>
          <a
            href="https://github.com/adityasunke"
            target="_blank"
            rel="noopener noreferrer"
            className="p-3 bg-gray-800 hover:bg-gray-700 rounded-full transition-all transform hover:scale-110 shadow-lg border border-gray-600 hover:border-blue-400"
          >
            <Github className="w-6 h-6" />
          </a>
          <a
            href="mailto:adityasunke2004@vt.edu"
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
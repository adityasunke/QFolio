import React, { useState } from 'react';
import { Github, TrendingUp, Database, Cpu, BarChart3, Eye, Clock, Globe, Atom } from 'lucide-react';

const ImplementationSection = ({ scrollToSection }) => {
  const [activeFlow, setActiveFlow] = useState(null);

  const flowSteps = [
    { 
      id: 'trial', 
      title: 'Trial Run', 
      icon: TrendingUp, 
      description: 'Run IBM examples and small scale implementations to understand QAOA' 
    },
    { 
      id: 'qaoa', 
      title: 'QAOA Implementation', 
      icon: Atom, 
      description: 'Implement the QAOA algorithm using IBM Qiskit to optimize stock portfolios based on a fixed dataset' 
    },
    { 
      id: 'benchmarking', 
      title: 'Algorithm Benchmarking', 
      icon: BarChart3, 
      description: 'Benchmarked QAOA and Brute force methods to compare the effectiveness of a quantum approach' 
    },
    { 
      id: 'realtime', 
      title: 'Extract Real Time Data', 
      icon: Database, 
      description: 'Used Alpha Vantage API to extract real-time data from the Magnificent 7 stocks' 
    },
    { 
      id: 'pipeline', 
      title: 'Pipeline', 
      icon: Clock, 
      description: 'Set up a pipeline using Flask and Advanced Python Scheduler to run the optimization algorithm at 7:00 am NYC Time' 
    },
    { 
      id: 'website', 
      title: 'Portfolio Website', 
      icon: Globe, 
      description: 'Portfolio website using React to show the best stocks everyday' 
    }
  ];

  return (
    <section id="implementation" className="py-20 bg-black/30 backdrop-blur-sm relative z-10">
      <div className="container mx-auto px-6">
        <h2 className="text-4xl font-bold text-center mb-12 text-blue-400">Implementation</h2>
        
        <div className="mb-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {flowSteps.map((step, index) => (
              <div key={step.id} className="relative">
                <div
                  className={`relative p-6 rounded-xl border-2 transition-all cursor-pointer transform hover:scale-105 min-h-[160px] flex flex-col justify-center overflow-hidden ${
                    activeFlow === step.id 
                      ? 'bg-blue-600 border-blue-400 shadow-lg shadow-blue-500/25' 
                      : 'bg-black/40 border-blue-500/30 hover:border-blue-400'
                  }`}
                  onMouseEnter={() => setActiveFlow(step.id)}
                  onMouseLeave={() => setActiveFlow(null)}
                >
                  {/* Default state - Icon and Title */}
                  <div className={`transition-all duration-300 ${activeFlow === step.id ? 'opacity-0 transform scale-75' : 'opacity-100'}`}>
                    <step.icon className="w-8 h-8 text-blue-400 mx-auto mb-3" />
                    <div className="text-center">
                      <div className="font-semibold text-sm">{step.title}</div>
                    </div>
                  </div>
                  
                  {/* Hover state - Description text */}
                  <div className={`absolute inset-0 p-4 flex flex-col justify-center transition-all duration-300 ${
                    activeFlow === step.id ? 'opacity-100' : 'opacity-0 pointer-events-none'
                  }`}>
                    <div className="text-green-400 font-medium mb-2 text-center text-xs">Step {index + 1}</div>
                    <div className="text-white text-sm text-center leading-relaxed">
                      {step.description}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {/* Flow indicators for larger screens */}
          <div className="hidden lg:flex justify-center items-center gap-2 mt-6">
            {flowSteps.map((_, index) => (
              <React.Fragment key={index}>
                <div className="w-3 h-3 rounded-full bg-blue-400"></div>
                {index < flowSteps.length - 1 && (
                  <div className="w-8 h-0.5 bg-blue-400"></div>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        <div className="text-center mb-12">
          <a
            href="https://github.com/adityasunke/Q-Folio"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 px-8 py-4 bg-gray-800 hover:bg-gray-700 rounded-lg font-semibold transition-all transform hover:scale-105 shadow-lg border border-gray-600 hover:border-blue-400"
          >
            <Github className="w-5 h-5" />
            View on GitHub
          </a>
        </div>

        <div className="text-center">
          <button 
            onClick={() => scrollToSection('aboutme')}
            className="px-8 py-4 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold transition-all transform hover:scale-105 shadow-lg shadow-blue-500/25"
          >
            About Me
          </button>
        </div>
      </div>
    </section>
  );
};

export default ImplementationSection;
import React, { useState } from 'react';
import { Github, TrendingUp, Database, Cpu, BarChart3, Eye } from 'lucide-react';

const ImplementationSection = ({ scrollToSection }) => {
  const [activeFlow, setActiveFlow] = useState(null);

  const flowSteps = [
    { id: 'data', title: 'Data Collection', icon: Database, description: 'Gather historical stock data from multiple sources' },
    { id: 'preprocessing', title: 'Preprocessing', icon: TrendingUp, description: 'Clean and normalize the financial data' },
    { id: 'model', title: 'Model Building', icon: Cpu, description: 'Implement quantum-inspired optimization algorithms' },
    { id: 'optimization', title: 'Optimization', icon: BarChart3, description: 'Find optimal portfolio allocation weights' },
    { id: 'visualization', title: 'Result Visualization', icon: Eye, description: 'Display results and performance metrics' }
  ];

  return (
    <section id="implementation" className="py-20 bg-black/30 backdrop-blur-sm relative z-10">
      <div className="container mx-auto px-6">
        <h2 className="text-4xl font-bold text-center mb-12 text-blue-400">Implementation</h2>
        
        <div className="mb-12">
          <div className="flex flex-wrap justify-center gap-4 mb-8">
            {flowSteps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div
                  className={`relative p-6 rounded-xl border-2 transition-all cursor-pointer transform hover:scale-105 ${
                    activeFlow === step.id 
                      ? 'bg-blue-600 border-blue-400 shadow-lg shadow-blue-500/25' 
                      : 'bg-black/40 border-blue-500/30 hover:border-blue-400'
                  }`}
                  onMouseEnter={() => setActiveFlow(step.id)}
                  onMouseLeave={() => setActiveFlow(null)}
                >
                  <step.icon className="w-8 h-8 text-blue-400 mx-auto mb-3" />
                  <div className="text-center">
                    <div className="font-semibold text-sm">{step.title}</div>
                  </div>
                  
                  {activeFlow === step.id && (
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 bg-black/90 text-white p-3 rounded-lg text-sm max-w-xs z-10 border border-blue-500/50">
                      {step.description}
                    </div>
                  )}
                </div>
                
                {index < flowSteps.length - 1 && (
                  <div className="hidden md:block w-8 h-0.5 bg-blue-400 mx-2"></div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="text-center mb-12">
          <a
            href="https://github.com/yourusername/portfolio-optimizer"
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
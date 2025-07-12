import React, { useState, useEffect } from 'react';
import Navigation from './components/Navigation';
import HeroSection from './components/HeroSection';
import AboutSection from './components/AboutSection';
import StockChart from './components/StockChart';
import ImplementationSection from './components/ImplementationSection';
import AboutMeSection from './components/AboutMeSection';
import Footer from './components/Footer';
import DynamicBackground from './components/DynamicBackground';
import { scrollToSection } from './utils/scrollUtils';
import { useStockData } from './hooks/useStockData'; // Fixed import path

const QFolioApp = () => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [time, setTime] = useState(0);
  
  // Use the stock data hook
  const { stockData, loading, error } = useStockData();

  // Track mouse position for dynamic background
  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Animation timer for dynamic background (slower animation)
  useEffect(() => {
    const interval = setInterval(() => {
      setTime(Date.now() * 0.0003); // Reduced from 0.001 to 0.0003 for slower movement
    }, 100); // Increased from 50ms to 100ms for smoother, slower updates
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      <DynamicBackground mousePosition={mousePosition} time={time} />
      <Navigation scrollToSection={scrollToSection} />
      <HeroSection scrollToSection={scrollToSection} />
      <AboutSection scrollToSection={scrollToSection} />
      <StockChart 
        stockData={stockData}
        loading={loading}
        error={error}
        scrollToSection={scrollToSection} 
      />
      <ImplementationSection scrollToSection={scrollToSection} />
      <AboutMeSection />
      <Footer />
    </div>
  );
};

export default QFolioApp;
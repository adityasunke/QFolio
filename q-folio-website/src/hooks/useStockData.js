import { useState, useEffect } from 'react';

export const useStockData = () => {
  const [stockData, setStockData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [uploadedFiles, setUploadedFiles] = useState({});

  const parseCSVLine = (line) => {
    const result = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  };

  const parseCSV = (csvContent, stockSymbol) => {
    const lines = csvContent.trim().split('\n');
    if (lines.length < 2) return [];
    
    const headers = parseCSVLine(lines[0]).map(h => h.toLowerCase().replace(/['"]/g, ''));
    console.log(`${stockSymbol} CSV Headers:`, headers);
    
    // Find column indices (flexible header detection)
    const dateIndex = headers.findIndex(h => 
      h.includes('date') || h.includes('time') || h.includes('day') || h === ''
    );
    const priceIndex = headers.findIndex(h => 
      h.includes('close') || h.includes('price') || h.includes('adj') || h.includes('value')
    );
    
    console.log(`${stockSymbol} - Date column index: ${dateIndex}, Price column index: ${priceIndex}`);
    
    if (dateIndex === -1 || priceIndex === -1) {
      throw new Error(`Could not find Date or Price columns in ${stockSymbol} CSV`);
    }
    
    const data = [];
    for (let i = 1; i < lines.length && data.length < 100; i++) {
      const row = parseCSVLine(lines[i]);
      if (row.length > Math.max(dateIndex, priceIndex)) {
        const dateStr = row[dateIndex].replace(/['"]/g, '').trim();
        const priceStr = row[priceIndex].replace(/['"]/g, '').trim();
        
        // Parse date (support multiple formats)
        let date;
        try {
          // Try different date formats
          if (dateStr.includes('/')) {
            // MM/DD/YYYY or DD/MM/YYYY
            const parts = dateStr.split('/');
            if (parts.length === 3) {
              // Assume MM/DD/YYYY for US format
              date = new Date(parts[2], parts[0] - 1, parts[1]);
            }
          } else if (dateStr.includes('-')) {
            // YYYY-MM-DD format
            date = new Date(dateStr);
          } else {
            // Try direct parsing
            date = new Date(dateStr);
          }
          
          // Validate date
          if (isNaN(date.getTime())) {
            console.warn(`${stockSymbol} - Invalid date: ${dateStr}`);
            continue;
          }
        } catch (e) {
          console.warn(`${stockSymbol} - Error parsing date: ${dateStr}`, e);
          continue;
        }
        
        // Parse price
        const price = parseFloat(priceStr);
        if (!isNaN(price) && price > 0) {
          data.push({
            date: date.toISOString().split('T')[0], // Format as YYYY-MM-DD
            price: Math.round(price * 100) / 100
          });
        }
      }
    }
    
    // Sort by date
    data.sort((a, b) => new Date(a.date) - new Date(b.date));
    console.log(`${stockSymbol} - Parsed ${data.length} data points`);
    return data;
  };

  const generateFallbackDataWithDates = () => {
    const stocks = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'NVDA', 'TSLA', 'META'];
    const data = [];
    const startDate = new Date('2024-01-01');
    
    // Base prices for each stock (realistic values)
    const basePrices = {
      'AAPL': 185,
      'MSFT': 375, 
      'GOOGL': 140,
      'AMZN': 155,
      'NVDA': 480,
      'TSLA': 240,
      'META': 350
    };

    // Generate realistic stock data with trends and volatility
    for (let i = 0; i < 100; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      const dataPoint = { date: date.toISOString().split('T')[0] };
      
      stocks.forEach(stock => {
        const basePrice = basePrices[stock];
        
        // Create realistic stock movement patterns
        const trendComponent = i * 0.002; // Slight upward trend
        const cyclicalComponent = Math.sin(i * 0.05) * 0.03; // Cyclical movement
        const volatilityComponent = (Math.random() - 0.5) * 0.04; // Daily volatility
        const momentumComponent = Math.sin(i * 0.1) * 0.02; // Momentum swings
        
        // Different volatility for different stocks
        const volatilityMultiplier = {
          'AAPL': 1.0,
          'MSFT': 0.8,
          'GOOGL': 1.2,
          'AMZN': 1.1,
          'NVDA': 1.8, // More volatile
          'TSLA': 2.0, // Most volatile
          'META': 1.3
        }[stock];
        
        const totalChange = trendComponent + cyclicalComponent + 
                           (volatilityComponent * volatilityMultiplier) + momentumComponent;
        
        const price = basePrice * (1 + totalChange);
        dataPoint[stock] = Math.round(price * 100) / 100;
      });
      data.push(dataPoint);
    }
    
    console.log('Generated fallback data with', data.length, 'data points');
    return data;
  };

  const processUploadedFiles = async () => {
    try {
      setLoading(true);
      setError(null);
      const stocks = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'NVDA', 'TSLA', 'META'];
      const stockDataMap = {};
      let csvFilesFound = 0;
      
      // Process uploaded files
      for (const stock of stocks) {
        if (uploadedFiles[stock]) {
          try {
            const file = uploadedFiles[stock];
            const csvContent = await file.text();
            const stockPrices = parseCSV(csvContent, stock);
            
            if (stockPrices.length > 0) {
              stockDataMap[stock] = stockPrices;
              csvFilesFound++;
              console.log(`✅ Successfully processed ${stock} with ${stockPrices.length} data points`);
            } else {
              console.warn(`⚠️ ${stock} file is empty or invalid`);
            }
          } catch (fileError) {
            console.warn(`❌ Could not process ${stock}:`, fileError.message);
          }
        }
      }
      
      if (csvFilesFound === 0) {
        throw new Error('No valid CSV files uploaded. Using sample data.');
      }
      
      // Combine all stock data by date
      const allDates = new Set();
      Object.values(stockDataMap).forEach(stockPrices => {
        stockPrices.forEach(entry => allDates.add(entry.date));
      });
      
      const sortedDates = Array.from(allDates).sort();
      console.log(`Found ${sortedDates.length} unique dates across all stocks`);
      
      // Limit to recent 100 data points for performance
      const recentDates = sortedDates.slice(-100);
      
      const combinedData = recentDates.map(date => {
        const dataPoint = { date };
        stocks.forEach(stock => {
          if (stockDataMap[stock]) {
            const entry = stockDataMap[stock].find(item => item.date === date);
            dataPoint[stock] = entry ? entry.price : null;
          } else {
            dataPoint[stock] = null;
          }
        });
        return dataPoint;
      });
      
      // Filter out dates where all stocks are null
      const validData = combinedData.filter(dataPoint => 
        stocks.some(stock => dataPoint[stock] !== null)
      );
      
      console.log(`✅ Combined data: ${validData.length} data points`);
      setStockData(validData);
      
      if (csvFilesFound < stocks.length) {
        setError(`Loaded ${csvFilesFound} of ${stocks.length} CSV files successfully`);
      }
      
    } catch (err) {
      console.error('Error processing stock data:', err);
      setError(err.message);
      console.log('📊 Using fallback sample data');
      setStockData(generateFallbackDataWithDates());
    } finally {
      setLoading(false);
    }
  };

  // Initialize with sample data on mount
  useEffect(() => {
    console.log('Initializing with sample data...');
    setStockData(generateFallbackDataWithDates());
  }, []);

  // Process files when uploaded
  useEffect(() => {
    if (Object.keys(uploadedFiles).length > 0) {
      processUploadedFiles();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uploadedFiles]);

  const handleFileUpload = (stock, file) => {
    setUploadedFiles(prev => ({
      ...prev,
      [stock]: file
    }));
  };

  const clearFiles = () => {
    setUploadedFiles({});
    setStockData(generateFallbackDataWithDates());
    setError(null);
  };

  return { 
    stockData, 
    loading, 
    error, 
    handleFileUpload, 
    clearFiles, 
    uploadedFiles 
  };
};
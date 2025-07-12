import { useState, useEffect } from 'react';

export const useStockData = () => {
  const [stockData, setStockData] = useState([]);
  const [loading, setLoading] = useState(true); // Start with loading true
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
    
    const headers = parseCSVLine(lines[0]).map(h => h.toLowerCase().replace(/['"]/g, '').trim());
    console.log(`${stockSymbol} CSV Headers:`, headers);
    
    // Find column indices (more flexible header detection)
    const dateIndex = headers.findIndex(h => 
      h.includes('date') || h.includes('time') || h.includes('day') || h === '' || h.includes('timestamp')
    );
    const priceIndex = headers.findIndex(h => 
      h.includes('close') || h.includes('price') || h.includes('adj') || h.includes('value') || 
      h.includes('closing') || h.includes('last') || h.includes('end')
    );
    
    console.log(`${stockSymbol} - Date column index: ${dateIndex} (${headers[dateIndex]}), Price column index: ${priceIndex} (${headers[priceIndex]})`);
    
    if (dateIndex === -1 || priceIndex === -1) {
      console.error(`${stockSymbol} Headers:`, headers);
      throw new Error(`Could not find Date (${dateIndex}) or Price (${priceIndex}) columns in ${stockSymbol} CSV. Available headers: ${headers.join(', ')}`);
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
              // Try both MM/DD/YYYY and DD/MM/YYYY
              const year = parts[2].length === 4 ? parts[2] : `20${parts[2]}`;
              // Assume MM/DD/YYYY for US format first
              date = new Date(year, parts[0] - 1, parts[1]);
              
              // If that creates an invalid date, try DD/MM/YYYY
              if (isNaN(date.getTime()) || date.getDate() != parts[1]) {
                date = new Date(year, parts[1] - 1, parts[0]);
              }
            }
          } else if (dateStr.includes('-')) {
            // YYYY-MM-DD format or DD-MM-YYYY
            if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
              date = new Date(dateStr);
            } else {
              // Try DD-MM-YYYY format
              const parts = dateStr.split('-');
              if (parts.length === 3) {
                const year = parts[2].length === 4 ? parts[2] : `20${parts[2]}`;
                date = new Date(year, parts[1] - 1, parts[0]);
              }
            }
          } else {
            // Try direct parsing
            date = new Date(dateStr);
          }
          
          // Validate date
          if (isNaN(date.getTime())) {
            console.warn(`${stockSymbol} - Invalid date: ${dateStr} (row ${i})`);
            continue;
          }
        } catch (e) {
          console.warn(`${stockSymbol} - Error parsing date: ${dateStr} (row ${i})`, e);
          continue;
        }
        
        // Parse price
        const price = parseFloat(priceStr);
        if (!isNaN(price) && price > 0) {
          data.push({
            date: date.toISOString().split('T')[0], // Format as YYYY-MM-DD
            price: Math.round(price * 100) / 100
          });
        } else {
          console.warn(`${stockSymbol} - Invalid price: ${priceStr} (row ${i})`);
        }
      }
    }
    
    // Sort by date
    data.sort((a, b) => new Date(a.date) - new Date(b.date));
    console.log(`${stockSymbol} - Parsed ${data.length} data points`);
    if (data.length > 0) {
      console.log(`${stockSymbol} - Date range: ${data[0].date} to ${data[data.length - 1].date}`);
      console.log(`${stockSymbol} - Price range: $${Math.min(...data.map(d => d.price)).toFixed(2)} to $${Math.max(...data.map(d => d.price)).toFixed(2)}`);
    }
    return data;
  };

  // Load CSV files from public/Data folder
  const loadCSVFromPublic = async (stockSymbol) => {
    try {
      // Try different possible filenames
      const possibleFilenames = [
        `${stockSymbol}_yearly_data_compact.csv`,
        `${stockSymbol}_data.csv`,
        `${stockSymbol}.csv`,
        `${stockSymbol.toLowerCase()}_yearly_data_compact.csv`,
        `${stockSymbol.toLowerCase()}_data.csv`,
        `${stockSymbol.toLowerCase()}.csv`
      ];

      for (const filename of possibleFilenames) {
        try {
          const response = await fetch(`/Data/${filename}`);
          if (response.ok) {
            const csvContent = await response.text();
            console.log(`✅ Successfully loaded ${filename}`);
            return parseCSV(csvContent, stockSymbol);
          }
        } catch (fetchError) {
          console.log(`❌ Could not load /Data/${filename}`);
        }
      }
      
      throw new Error(`No CSV file found for ${stockSymbol}`);
    } catch (error) {
      console.warn(`Failed to load CSV for ${stockSymbol}:`, error.message);
      return [];
    }
  };

  const generateFallbackDataWithDates = () => {
    const stocks = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'NVDA', 'TSLA', 'META'];
    const data = [];
    // Use a more recent date range for fallback data
    const startDate = new Date('2023-12-31');
    
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
    console.log('Date range:', data[0]?.date, 'to', data[data.length - 1]?.date);
    return data;
  };

  const loadAllStockData = async () => {
    try {
      setLoading(true);
      setError(null);
      const stocks = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'NVDA', 'TSLA', 'META'];
      const stockDataMap = {};
      let csvFilesLoaded = 0;

      console.log('🔄 Loading CSV files from /public/Data/...');

      // Load all stock CSV files
      for (const stock of stocks) {
        const stockPrices = await loadCSVFromPublic(stock);
        if (stockPrices.length > 0) {
          stockDataMap[stock] = stockPrices;
          csvFilesLoaded++;
          console.log(`✅ ${stock}: ${stockPrices.length} data points loaded`);
        } else {
          console.warn(`⚠️ ${stock}: No data loaded`);
        }
      }

      if (csvFilesLoaded === 0) {
        throw new Error('No CSV files could be loaded from /public/Data/. Using sample data.');
      }

      // Combine all stock data by date
      const allDates = new Set();
      Object.values(stockDataMap).forEach(stockPrices => {
        stockPrices.forEach(entry => allDates.add(entry.date));
      });

      const sortedDates = Array.from(allDates).sort();
      console.log(`📅 Found ${sortedDates.length} unique dates across all stocks`);

      // Take most recent 100 data points for performance
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
      console.log(`📊 Date range: ${validData[0]?.date} to ${validData[validData.length - 1]?.date}`);
      
      setStockData(validData);

      if (csvFilesLoaded < stocks.length) {
        setError(`Loaded ${csvFilesLoaded} of ${stocks.length} CSV files from /public/Data/`);
      }

    } catch (err) {
      console.error('❌ Error loading stock data:', err);
      setError(err.message);
      console.log('🔄 Falling back to sample data');
      setStockData(generateFallbackDataWithDates());
    } finally {
      setLoading(false);
    }
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

  // Initialize by loading CSV files from public/Data
  useEffect(() => {
    console.log('🚀 Initializing stock data from CSV files...');
    loadAllStockData();
  }, []);

  // Process files when uploaded
  useEffect(() => {
    if (Object.keys(uploadedFiles).length > 0) {
      processUploadedFiles();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uploadedFiles]);

  const handleFileUpload = (stock, file) => {
    setUploadedFiles(prev => {
      const newFiles = { ...prev };
      if (file === null) {
        delete newFiles[stock];
      } else {
        newFiles[stock] = file;
      }
      return newFiles;
    });
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
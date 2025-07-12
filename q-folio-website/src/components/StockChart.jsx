import React, { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';

const StockChart = ({ stockData, loading, error, scrollToSection }) => {
  const stockColors = {
    AAPL: '#1e90ff',
    MSFT: '#00bfff', 
    GOOGL: '#4169e1',
    AMZN: '#6495ed',
    NVDA: '#87ceeb',
    TSLA: '#b0c4de',
    META: '#add8e6'
  };

  const stocks = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'NVDA', 'TSLA', 'META'];

  // Memoize processed data to prevent re-renders
  const processedData = useMemo(() => {
    if (!stockData || stockData.length === 0) return [];
    
    // Filter out data points where all stocks are null
    return stockData.filter(dataPoint => {
      return stocks.some(stock => dataPoint[stock] !== null && dataPoint[stock] !== undefined);
    }).map(dataPoint => {
      // Ensure all stock values are numbers or null
      const processedPoint = { date: dataPoint.date };
      stocks.forEach(stock => {
        const value = dataPoint[stock];
        processedPoint[stock] = (value !== null && value !== undefined && !isNaN(value)) ? Number(value) : null;
      });
      return processedPoint;
    });
  }, [stockData, stocks]);

  const getTopPerformers = useMemo(() => {
    if (!processedData || processedData.length === 0) return [];

    const performance = stocks.map((stock) => {
      const validPrices = processedData.filter(
        (day) => day[stock] !== null && day[stock] !== undefined
      );
      
      if (validPrices.length < 2) {
        return { stock, increase: 0, startPrice: 0, endPrice: 0 };
      }

      const firstPrice = validPrices[0][stock];
      const lastPrice = validPrices[validPrices.length - 1][stock];
      const increase = ((lastPrice - firstPrice) / firstPrice) * 100;
      
      return {
        stock,
        increase: Math.round(increase * 100) / 100,
        startPrice: firstPrice,
        endPrice: lastPrice
      };
    });

    return performance.sort((a, b) => b.increase - a.increase).slice(0, 3);
  }, [processedData, stocks]);

  const formatDate = (dateStr) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return dateStr;
    }
  };

  const formatTooltipDate = (dateStr) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return dateStr;
    }
  };

  const getDateRange = () => {
    if (!processedData || processedData.length === 0) return '';
    const startDate = formatTooltipDate(processedData[0].date);
    const endDate = formatTooltipDate(processedData[processedData.length - 1].date);
    return `${startDate} - ${endDate}`;
  };

  // Custom tooltip to handle null values better
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-gray-900 border border-blue-400 rounded-lg p-3 shadow-lg">
          <p className="text-blue-400 font-semibold mb-2">{formatTooltipDate(label)}</p>
          {payload.map((entry) => {
            if (entry.value !== null && entry.value !== undefined) {
              return (
                <p key={entry.dataKey} style={{ color: entry.color }} className="text-sm">
                  {entry.dataKey}: ${entry.value.toFixed(2)}
                </p>
              );
            }
            return null;
          })}
        </div>
      );
    }
    return null;
  };

  return (
    <section
      id="graph"
      className="py-20 bg-black/20 backdrop-blur-sm relative z-10"
    >
      <div className="container mx-auto px-6">
        <h2 className="text-4xl font-bold text-center mb-4 text-blue-400">
          Magnificent 7 Stock Performance
        </h2>

        {/* Date Range Display */}
        {processedData && processedData.length > 0 && (
          <p className="text-center text-gray-400 mb-8">
            Data Period: {getDateRange()} ({processedData.length} trading days)
          </p>
        )}

        <div className="bg-black/40 rounded-2xl p-8 mb-12 backdrop-blur-sm border border-blue-500/20">
          {loading ? (
            <div className="flex items-center justify-center h-96">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4"></div>
                <p className="text-gray-300">Processing data...</p>
              </div>
            </div>
          ) : error ? (
            <div className="h-96 flex items-center justify-center">
              <div className="text-center max-w-lg">
                <p className="text-yellow-400 mb-4">⚠️ {error}</p>
                <p className="text-gray-500 text-sm mt-2">
                  Currently showing sample data
                </p>
              </div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={400}>
              <LineChart
                data={processedData}
                margin={{ top: 20, right: 30, left: 20, bottom: 80 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                <XAxis
                  dataKey="date"
                  stroke="#9CA3AF"
                  tick={{ fontSize: 11, fill: '#9CA3AF' }}
                  tickFormatter={formatDate}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  interval={Math.max(1, Math.floor(processedData.length / 8))}
                />
                <YAxis
                  stroke="#9CA3AF"
                  tick={{ fontSize: 11, fill: '#9CA3AF' }}
                  domain={['dataMin - 10', 'dataMax + 10']}
                  label={{
                    value: 'Stock Price ($)',
                    angle: -90,
                    position: 'insideLeft',
                    style: { textAnchor: 'middle', fill: '#9CA3AF' }
                  }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend 
                  wrapperStyle={{ paddingTop: '20px' }}
                  iconType="line"
                />
                {stocks.map((stock) => (
                  <Line
                    key={stock}
                    type="monotone"
                    dataKey={stock}
                    stroke={stockColors[stock]}
                    strokeWidth={2.5}
                    dot={true}
                    connectNulls={true}
                    activeDot={{ r: 4, stroke: stockColors[stock], strokeWidth: 2 }}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Top Performers */}
        <div className="text-center mb-12">
          <h3 className="text-2xl font-bold mb-8 text-blue-400">
            Top 3 Performing Stocks
          </h3>
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {getTopPerformers.map((performer, index) => (
              <div
                key={performer.stock}
                className="bg-black/40 rounded-xl p-6 backdrop-blur-sm border border-blue-500/20"
              >
                <div className="text-3xl font-bold text-blue-400 mb-2">
                  #{index + 1}
                </div>
                <div className="text-xl font-semibold mb-2">
                  {performer.stock}
                </div>
                <div
                  className={`text-2xl font-bold ${
                    performer.increase >= 0
                      ? 'text-green-400'
                      : 'text-red-400'
                  }`}
                >
                  {performer.increase >= 0 ? '+' : ''}
                  {performer.increase}%
                </div>
                {performer.startPrice > 0 && (
                  <div className="text-sm text-gray-400 mt-2">
                    ${performer.startPrice?.toFixed(2)} → $
                    {performer.endPrice?.toFixed(2)}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="text-center">
          <button
            onClick={() => scrollToSection('implementation')}
            className="px-8 py-4 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold transition-all transform hover:scale-105 shadow-lg shadow-blue-500/25"
          >
            Implementation
          </button>
        </div>
      </div>
    </section>
  );
};

export default StockChart;
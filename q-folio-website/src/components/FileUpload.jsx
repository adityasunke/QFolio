import React from 'react';
import { Upload, X, Check } from 'lucide-react';

const FileUpload = ({ uploadedFiles, handleFileUpload, clearFiles }) => {
  const stocks = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'NVDA', 'TSLA', 'META'];

  const handleFileChange = (stock, event) => {
    const file = event.target.files[0];
    if (file && file.type === 'text/csv') {
      handleFileUpload(stock, file);
    } else {
      alert('Please select a valid CSV file');
    }
  };

  const removeFile = (stock) => {
    const newFiles = { ...uploadedFiles };
    delete newFiles[stock];
    handleFileUpload(stock, null);
  };

  return (
    <div className="bg-black/40 rounded-2xl p-6 backdrop-blur-sm border border-blue-500/20 mb-8">
      <h3 className="text-xl font-bold text-blue-400 mb-6 text-center">
        Upload Stock Data CSV Files
      </h3>
      
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {stocks.map((stock) => (
          <div key={stock} className="bg-black/30 rounded-lg p-4 border border-gray-600">
            <div className="flex items-center justify-between mb-3">
              <span className="font-semibold text-blue-300">{stock}</span>
              {uploadedFiles[stock] && (
                <button
                  onClick={() => removeFile(stock)}
                  className="text-red-400 hover:text-red-300"
                >
                  <X size={16} />
                </button>
              )}
            </div>
            
            {uploadedFiles[stock] ? (
              <div className="flex items-center gap-2 text-green-400 text-sm">
                <Check size={16} />
                <span className="truncate">{uploadedFiles[stock].name}</span>
              </div>
            ) : (
              <label className="flex flex-col items-center gap-2 cursor-pointer hover:bg-blue-600/10 p-3 rounded border-2 border-dashed border-gray-500 hover:border-blue-400 transition-colors">
                <Upload size={20} className="text-gray-400" />
                <span className="text-xs text-gray-400 text-center">
                  Click to upload CSV
                </span>
                <input
                  type="file"
                  accept=".csv"
                  onChange={(e) => handleFileChange(stock, e)}
                  className="hidden"
                />
              </label>
            )}
          </div>
        ))}
      </div>

      <div className="flex justify-center gap-4">
        <button
          onClick={clearFiles}
          className="px-6 py-2 bg-red-600 hover:bg-red-700 rounded-lg font-semibold transition-all"
        >
          Clear All Files
        </button>
        <div className="text-sm text-gray-400 flex items-center">
          {Object.keys(uploadedFiles).length} of {stocks.length} files uploaded
        </div>
      </div>

      <div className="mt-4 text-xs text-gray-500">
        <p className="mb-2">CSV Format Requirements:</p>
        <ul className="list-disc list-inside space-y-1">
          <li>Must contain Date and Price/Close columns</li>
          <li>Date formats supported: YYYY-MM-DD, MM/DD/YYYY</li>
          <li>Price column should contain numeric values</li>
        </ul>
      </div>
    </div>
  );
};

export default FileUpload;
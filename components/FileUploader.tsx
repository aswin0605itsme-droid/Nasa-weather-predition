import React, { useState } from 'react';
import * as XLSX from 'xlsx';

interface FileUploaderProps {
  onDataLoaded: (csvText: string) => void;
}

const FileUploader: React.FC<FileUploaderProps> = ({ onDataLoaded }) => {
  const [dragActive, setDragActive] = useState(false);
  const [pasteContent, setPasteContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const processFile = async (file: File) => {
    setIsLoading(true);
    try {
      if (file.name.endsWith('.csv') || file.name.endsWith('.txt')) {
        const text = await file.text();
        onDataLoaded(text);
      } else if (file.name.match(/\.xlsx?$|\.xls$/)) {
        // Handle Excel
        const data = await file.arrayBuffer();
        const workbook = XLSX.read(data);
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const csv = XLSX.utils.sheet_to_csv(worksheet);
        onDataLoaded(csv);
      } else {
        alert("Unsupported file format. Please upload CSV or Excel.");
      }
    } catch (err) {
      console.error("Error reading file:", err);
      alert("Failed to read file.");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasteSubmit = () => {
    if (pasteContent) {
      onDataLoaded(pasteContent);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-6 bg-space-800 rounded-xl shadow-2xl border border-space-700">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-white mb-2">Import NASA Data</h2>
        <p className="text-gray-400 text-sm">Upload NASA POWER data (CSV/Excel) or paste content.</p>
      </div>

      <div 
        className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200 ${
          dragActive ? 'border-space-accent bg-space-700/50' : 'border-space-700 hover:border-space-accent/50'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          type="file"
          id="file-upload"
          className="hidden"
          onChange={handleChange}
          accept=".csv,.txt,.xlsx,.xls"
        />
        <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center">
          {isLoading ? (
             <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-space-accent mb-4"></div>
          ) : (
             <i className="fas fa-cloud-upload-alt text-4xl text-space-accent mb-4"></i>
          )}
          <span className="text-lg font-medium text-gray-200">
            Drag & drop or <span className="text-space-accent underline">browse</span>
          </span>
          <span className="text-xs text-gray-500 mt-2">Supports CSV, TXT, XLSX, XLS</span>
        </label>
      </div>

      <div className="mt-6">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-space-700"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-space-800 text-gray-500">OR PASTE DATA</span>
          </div>
        </div>

        <div className="mt-6">
          <textarea
            rows={4}
            className="w-full bg-space-900 border border-space-700 rounded-lg p-3 text-sm text-gray-300 focus:ring-2 focus:ring-space-accent focus:border-transparent outline-none resize-none font-mono"
            placeholder="-BEGIN HEADER-&#10;NASA/POWER Source...&#10;YEAR,DOY,T2M_RANGE,PRECTOTCORR&#10;2000,1,6.84,0.04..."
            value={pasteContent}
            onChange={(e) => setPasteContent(e.target.value)}
          ></textarea>
          <button
            onClick={handlePasteSubmit}
            disabled={!pasteContent}
            className="mt-3 w-full bg-space-accent text-space-900 font-bold py-2 px-4 rounded-lg hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Analyze Text Data
          </button>
        </div>
      </div>
    </div>
  );
};

export default FileUploader;
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
    <div className="w-full p-8 bg-slate-900/50">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-white mb-2">Ingest External Data</h2>
        <p className="text-gray-400 text-xs font-mono uppercase tracking-wide">
            Upload custom NASA POWER datasets (CSV/Excel)
        </p>
      </div>

      <div 
        className={`relative border-2 border-dashed rounded-xl p-10 text-center transition-all duration-300 group ${
          dragActive 
            ? 'border-cyan-400 bg-cyan-400/10' 
            : 'border-slate-700 hover:border-cyan-400/50 hover:bg-slate-800'
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
        <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center relative z-10">
          {isLoading ? (
             <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mb-4"></div>
          ) : (
             <div className="w-16 h-16 bg-slate-900 rounded-full flex items-center justify-center mb-4 border border-slate-700 group-hover:border-cyan-400 group-hover:shadow-[0_0_20px_rgba(34,211,238,0.3)] transition-all">
                 <i className="fas fa-cloud-upload-alt text-2xl text-cyan-400"></i>
             </div>
          )}
          <span className="text-lg font-bold text-white">
            Drop Data Stream Here
          </span>
          <span className="text-xs text-gray-500 mt-2 font-mono">
            or <span className="text-cyan-400 underline">browse local drive</span>
          </span>
        </label>
        
        {/* Decorative Grid Background */}
        <div className="absolute inset-0 opacity-10 pointer-events-none" 
             style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
        </div>
      </div>

      <div className="mt-8">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-700"></div>
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="px-3 bg-slate-900 text-gray-500 font-mono uppercase">Manual Override</span>
          </div>
        </div>

        <div className="mt-6">
          <textarea
            rows={4}
            className="w-full bg-slate-950 border border-slate-700 rounded-lg p-4 text-xs text-cyan-400 font-mono focus:ring-1 focus:ring-cyan-400 focus:border-cyan-400 outline-none resize-none transition-all placeholder-slate-700"
            placeholder="PASTE RAW DATA STREAM...&#10;-BEGIN HEADER-&#10;NASA/POWER Source...&#10;YEAR,DOY,T2M_RANGE,PRECTOTCORR"
            value={pasteContent}
            onChange={(e) => setPasteContent(e.target.value)}
          ></textarea>
          <button
            onClick={handlePasteSubmit}
            disabled={!pasteContent}
            className="mt-4 w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 px-4 rounded-lg border border-white/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed uppercase text-xs tracking-widest"
          >
            Initiate Parsing Protocol
          </button>
        </div>
      </div>
    </div>
  );
};

export default FileUploader;
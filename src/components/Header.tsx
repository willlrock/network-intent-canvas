import React, { useRef, useState } from 'react';
import {
  Save,
  Download,
  Upload,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Network as NetworkIcon,
} from 'lucide-react';
import { useNetworkStore } from '../operations/useNetworkStore';
import { saveProjectToStorage } from '../persistence/storage';
import { exportProjectToJSON, parseAndValidateProjectJSON } from '../persistence/export-import';

export function Header({
  onShowValidation,
}: {
  onShowValidation: () => void;
}) {
  const { project, validationIssues, store } = useNetworkStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const errorsCount = validationIssues.filter((i) => i.severity === 'error').length;
  const warningsCount = validationIssues.filter((i) => i.severity === 'warning').length;

  const handleSave = () => {
    const ok = saveProjectToStorage(project);
    if (ok) {
      setSaveMessage('Saved to local storage!');
      setTimeout(() => setSaveMessage(null), 2500);
    } else {
      setSaveMessage('Failed to save.');
      setTimeout(() => setSaveMessage(null), 3000);
    }
  };

  const handleExport = () => {
    const filename = `${project.name.toLowerCase().replace(/\s+/g, '-')}-topology.json`;
    exportProjectToJSON(project, filename);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const res = parseAndValidateProjectJSON(content);
      if (res.success && res.project) {
        store.loadProject(res.project);
        setSaveMessage('Topology imported successfully!');
        setTimeout(() => setSaveMessage(null), 2500);
      } else {
        alert(res.error || 'Failed to import project file.');
      }
    };
    reader.readAsText(file);
    e.target.value = ''; // Reset input
  };

  const handleReset = () => {
    if (project.devices.length > 0 || project.links.length > 0) {
      if (confirm('Clear the current network canvas?')) {
        store.resetProject();
      }
    }
  };

  return (
    <header className="h-14 bg-slate-950 border-b border-slate-800 px-4 flex items-center justify-between z-20 select-none">
      {/* Brand & Project Name */}
      <div className="flex items-center space-x-3">
        <div className="w-8 h-8 rounded-lg bg-blue-600/20 border border-blue-500/40 flex items-center justify-center">
          <NetworkIcon className="w-4 h-4 text-blue-400" />
        </div>
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-sm font-bold tracking-tight text-slate-100">
              Network Intent Canvas
            </h1>
            <span className="text-[10px] font-mono px-1.5 py-0.2 bg-blue-950 text-blue-300 border border-blue-800 rounded">
              v0.1 MVP
            </span>
          </div>
          <div className="text-[11px] text-slate-400 flex items-center space-x-2">
            <span>{project.name}</span>
            <span>•</span>
            <span>{project.devices.length} devices</span>
            <span>•</span>
            <span>{project.links.length} links</span>
          </div>
        </div>
      </div>

      {/* Save indicator toast */}
      {saveMessage && (
        <div className="hidden sm:flex items-center space-x-1.5 px-3 py-1 bg-emerald-950/90 border border-emerald-700 text-emerald-300 rounded text-xs animate-in fade-in">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>{saveMessage}</span>
        </div>
      )}

      {/* Action Bar */}
      <div className="flex items-center space-x-2">
        {/* Validation Status Button */}
        <button
          onClick={onShowValidation}
          className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded text-xs font-medium border transition-colors ${
            errorsCount > 0
              ? 'bg-rose-950/60 border-rose-800 text-rose-300 hover:bg-rose-900/50'
              : warningsCount > 0
              ? 'bg-amber-950/60 border-amber-800 text-amber-300 hover:bg-amber-900/50'
              : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-slate-100'
          }`}
          title="Validate network topology"
        >
          {errorsCount > 0 ? (
            <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
          ) : warningsCount > 0 ? (
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
          ) : (
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          )}
          <span>Validate</span>
          {(errorsCount > 0 || warningsCount > 0) && (
            <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-slate-950 font-mono">
              {errorsCount > 0 ? `${errorsCount} err` : `${warningsCount} warn`}
            </span>
          )}
        </button>

        <div className="w-[1px] h-5 bg-slate-800 my-auto" />

        {/* Save */}
        <button
          onClick={handleSave}
          className="flex items-center space-x-1 px-2.5 py-1.5 rounded text-xs font-medium bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-slate-100 transition-colors"
          title="Save topology to local storage"
        >
          <Save className="w-3.5 h-3.5 text-blue-400" />
          <span>Save</span>
        </button>

        {/* Export JSON */}
        <button
          onClick={handleExport}
          className="flex items-center space-x-1 px-2.5 py-1.5 rounded text-xs font-medium bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-slate-100 transition-colors"
          title="Export topology as JSON"
        >
          <Download className="w-3.5 h-3.5 text-cyan-400" />
          <span>Export</span>
        </button>

        {/* Import JSON */}
        <button
          onClick={handleImportClick}
          className="flex items-center space-x-1 px-2.5 py-1.5 rounded text-xs font-medium bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-slate-100 transition-colors"
          title="Import topology from JSON file"
        >
          <Upload className="w-3.5 h-3.5 text-indigo-400" />
          <span>Import</span>
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          className="hidden"
          onChange={handleFileChange}
        />

        {/* Reset Canvas */}
        <button
          onClick={handleReset}
          className="flex items-center space-x-1 px-2.5 py-1.5 rounded text-xs font-medium bg-slate-900 border border-slate-800 text-slate-400 hover:bg-rose-950/50 hover:text-rose-300 hover:border-rose-800 transition-colors"
          title="Reset topology"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset</span>
        </button>
      </div>
    </header>
  );
}

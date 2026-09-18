import { useState, useEffect } from 'react';
import { PanelGroup, Panel, PanelResizeHandle } from 'react-resizable-panels';
import { Header } from './components/Header';
import { DeviceLibrary } from './components/DeviceLibrary';
import { Inspector } from './components/Inspector';
import { TerminalPanel } from './components/TerminalPanel';
import { ValidationModal } from './components/ValidationModal';
import { NetworkCanvas } from './canvas/NetworkCanvas';
import { useNetworkStore } from './operations/useNetworkStore';
import { loadProjectFromStorage, saveProjectToStorage } from './persistence/storage';
import { AlertCircle, X } from 'lucide-react';

export function App() {
  const { store } = useNetworkStore();
  const [showValidation, setShowValidation] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Auto-load on mount
  useEffect(() => {
    const saved = loadProjectFromStorage();
    if (saved) {
      store.loadProject(saved);
    }
  }, [store]);

  // Auto-persist on changes
  useEffect(() => {
    return store.onProjectChange((project) => {
      saveProjectToStorage(project);
    });
  }, [store]);

  const handleErrorNotification = (msg: string) => {
    setErrorMessage(msg);
  };

  return (
    <div className="flex flex-col w-screen h-screen overflow-hidden bg-slate-950 font-sans text-slate-100">
      {/* Top Header */}
      <Header onShowValidation={() => setShowValidation(true)} />

      {/* Connection / Operation Error Toast */}
      {errorMessage && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-50 flex items-center space-x-2 px-4 py-2 bg-rose-950 border border-rose-600 text-rose-200 rounded-lg shadow-2xl text-xs animate-in slide-in-from-top duration-150">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{errorMessage}</span>
          <button
            onClick={() => setErrorMessage(null)}
            className="p-1 hover:bg-rose-900 rounded text-rose-300"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Main Resizable Layout */}
      <div className="flex-1 min-h-0 relative">
        <PanelGroup direction="vertical">
          {/* Upper Workspace: Library + Canvas + Inspector */}
          <Panel defaultSize={72} minSize={40}>
            <PanelGroup direction="horizontal">
              {/* Left: Device Library */}
              <Panel defaultSize={18} minSize={14} maxSize={30}>
                <DeviceLibrary />
              </Panel>

              <PanelResizeHandle className="w-1 bg-slate-800 hover:bg-blue-600 transition-colors cursor-col-resize z-10" />

              {/* Center: Network Canvas */}
              <Panel defaultSize={62} minSize={30}>
                <NetworkCanvas onConnectError={handleErrorNotification} />
              </Panel>

              <PanelResizeHandle className="w-1 bg-slate-800 hover:bg-blue-600 transition-colors cursor-col-resize z-10" />

              {/* Right: Inspector */}
              <Panel defaultSize={20} minSize={16} maxSize={35}>
                <Inspector />
              </Panel>
            </PanelGroup>
          </Panel>

          <PanelResizeHandle className="h-1 bg-slate-800 hover:bg-blue-600 transition-colors cursor-row-resize z-10" />

          {/* Lower Workspace: Terminal & Model Viewer */}
          <Panel defaultSize={28} minSize={12} maxSize={60}>
            <TerminalPanel />
          </Panel>
        </PanelGroup>
      </div>

      {/* Validation Dialog */}
      <ValidationModal
        isOpen={showValidation}
        onClose={() => setShowValidation(false)}
      />
    </div>
  );
}
export default App;

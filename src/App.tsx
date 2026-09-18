import { useEffect, useState } from 'react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { AlertCircle, X } from 'lucide-react';
import { Header } from './components/Header';
import { DeviceLibrary } from './components/DeviceLibrary';
import { Inspector } from './components/Inspector';
import { TerminalPanel } from './components/TerminalPanel';
import { ValidationModal } from './components/ValidationModal';
import { NetworkCanvas } from './canvas/NetworkCanvas';
import { useNetworkStore } from './operations/useNetworkStore';
import { loadProjectFromStorage, saveProjectToStorage } from './persistence/storage';

export function App() {
  const { store } = useNetworkStore();
  const [showValidation, setShowValidation] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const saved = loadProjectFromStorage();
    if (saved) store.loadProject(saved);
  }, [store]);

  useEffect(
    () =>
      store.onProjectChange((project) => {
        saveProjectToStorage(project);
      }),
    [store]
  );

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-slate-950 font-sans text-slate-100">
      <Header onShowValidation={() => setShowValidation(true)} />

      {errorMessage && (
        <div className="absolute left-1/2 top-16 z-[60] flex -translate-x-1/2 items-center gap-2 rounded-lg border border-rose-600 bg-rose-950 px-4 py-2 text-xs text-rose-200 shadow-2xl">
          <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
          <span>{errorMessage}</span>
          <button onClick={() => setErrorMessage(null)} className="rounded p-1 hover:bg-rose-900">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      <div className="relative min-h-0 flex-1">
        <PanelGroup direction="vertical">
          <Panel defaultSize={72} minSize={48}>
            <PanelGroup direction="horizontal">
              <Panel defaultSize={79} minSize={55}>
                <NetworkCanvas onConnectError={setErrorMessage} />
              </Panel>
              <PanelResizeHandle className="w-1 cursor-col-resize bg-slate-800 hover:bg-blue-600" />
              <Panel defaultSize={21} minSize={16} maxSize={35}>
                <Inspector />
              </Panel>
            </PanelGroup>
          </Panel>

          <PanelResizeHandle className="h-1 cursor-row-resize bg-slate-800 hover:bg-blue-600" />

          <Panel defaultSize={28} minSize={16} maxSize={45}>
            <PanelGroup direction="horizontal">
              <Panel defaultSize={46} minSize={30}>
                <DeviceLibrary />
              </Panel>
              <PanelResizeHandle className="w-1 cursor-col-resize bg-slate-800 hover:bg-blue-600" />
              <Panel defaultSize={54} minSize={35}>
                <TerminalPanel />
              </Panel>
            </PanelGroup>
          </Panel>
        </PanelGroup>
      </div>

      <ValidationModal isOpen={showValidation} onClose={() => setShowValidation(false)} />
    </div>
  );
}

export default App;

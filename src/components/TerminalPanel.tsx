import { useEffect, useRef, useState } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import '@xterm/xterm/css/xterm.css';
import { Terminal as TerminalIcon, Code, History, Copy, Check } from 'lucide-react';
import { useNetworkStore } from '../operations/useNetworkStore';
import { DeviceRegistry } from '../device-registry';

type TabType = 'terminal' | 'model' | 'operations';

export function TerminalPanel() {
  const { project, selectedDeviceId, operationLog } = useNetworkStore();
  const [activeTab, setActiveTab] = useState<TabType>('terminal');
  const [copied, setCopied] = useState(false);

  const terminalContainerRef = useRef<HTMLDivElement>(null);
  const terminalRef = useRef<Terminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);

  const selectedDevice = project.devices.find((d) => d.id === selectedDeviceId);
  const deviceType = selectedDevice ? DeviceRegistry.getById(selectedDevice.deviceTypeId) : null;

  // Initialize and update xterm instance
  useEffect(() => {
    if (activeTab !== 'terminal' || !terminalContainerRef.current) return;

    if (!terminalRef.current) {
      const term = new Terminal({
        cursorBlink: true,
        fontSize: 12,
        fontFamily: 'Consolas, Monaco, "Courier New", monospace',
        theme: {
          background: '#090d16',
          foreground: '#e2e8f0',
          cursor: '#38bdf8',
          selectionBackground: '#1e3a8a',
          black: '#1e293b',
          brightBlack: '#475569',
          red: '#f87171',
          green: '#4ade80',
          yellow: '#facc15',
          blue: '#60a5fa',
          magenta: '#c084fc',
          cyan: '#38bdf8',
          white: '#f8fafc',
        },
      });

      const fitAddon = new FitAddon();
      term.loadAddon(fitAddon);
      term.open(terminalContainerRef.current);
      fitAddon.fit();

      terminalRef.current = term;
      fitAddonRef.current = fitAddon;

      // Handle simple interactive keystrokes (echo back or show notice)
      let currentLine = '';
      term.onData((data) => {
        if (data === '\r') {
          term.write('\r\n\x1b[33mCommand ignored: CLI connection unavailable in v0.1.\x1b[0m\r\n');
          term.write(`\x1b[36m${selectedDevice ? selectedDevice.name : 'device'}#\x1b[0m `);
          currentLine = '';
        } else if (data === '\u007F') {
          // Backspace
          if (currentLine.length > 0) {
            currentLine = currentLine.slice(0, -1);
            term.write('\b \b');
          }
        } else {
          currentLine += data;
          term.write(data);
        }
      });
    }

    const term = terminalRef.current;
    if (term) {
      term.reset();
      if (selectedDevice) {
        term.writeln(`\x1b[1;36m=== Network Intent Canvas CLI Terminal ===\x1b[0m`);
        term.writeln(`\x1b[32mTarget Device:\x1b[0m ${selectedDevice.name} (${selectedDevice.id})`);
        term.writeln(`\x1b[32mHardware:\x1b[0m      ${deviceType?.vendor} ${deviceType?.model}`);
        term.writeln(`\x1b[32mOS Family:\x1b[0m     ${deviceType?.capabilities.osFamily || 'Standard'}`);
        term.writeln('');
        term.writeln('\x1b[33mCLI connection unavailable in v0.1.\x1b[0m');
        term.writeln('\x1b[90mFuture transport: SSH/API via Device Pack.\x1b[0m');
        term.writeln('');
        term.write(`\x1b[36m${selectedDevice.name}#\x1b[0m `);
      } else {
        term.writeln('\x1b[90mSelect a device on the network canvas to initialize terminal session.\x1b[0m');
      }
      fitAddonRef.current?.fit();
    }
  }, [selectedDevice, deviceType, activeTab]);

  // Handle window resize for xterm fit
  useEffect(() => {
    const handleResize = () => {
      fitAddonRef.current?.fit();
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleCopyModel = () => {
    navigator.clipboard.writeText(JSON.stringify(project, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="h-full flex flex-col bg-slate-950 border-t border-slate-800 select-none overflow-hidden">
      {/* Tabs bar */}
      <div className="h-9 bg-slate-900/90 border-b border-slate-800 px-3 flex items-center justify-between">
        <div className="flex items-center space-x-1">
          <button
            onClick={() => setActiveTab('terminal')}
            className={`flex items-center space-x-1.5 px-2.5 py-1 rounded text-xs font-medium transition-colors ${
              activeTab === 'terminal'
                ? 'bg-slate-800 text-blue-400 border border-slate-700'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <TerminalIcon className="w-3.5 h-3.5" />
            <span>CLI Terminal {selectedDevice && `(${selectedDevice.name})`}</span>
          </button>

          <button
            onClick={() => setActiveTab('model')}
            className={`flex items-center space-x-1.5 px-2.5 py-1 rounded text-xs font-medium transition-colors ${
              activeTab === 'model'
                ? 'bg-slate-800 text-cyan-400 border border-slate-700'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Code className="w-3.5 h-3.5" />
            <span>Network Model (JSON)</span>
          </button>

          <button
            onClick={() => setActiveTab('operations')}
            className={`flex items-center space-x-1.5 px-2.5 py-1 rounded text-xs font-medium transition-colors ${
              activeTab === 'operations'
                ? 'bg-slate-800 text-emerald-400 border border-slate-700'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Operation Log ({operationLog.length})</span>
          </button>
        </div>

        {activeTab === 'model' && (
          <button
            onClick={handleCopyModel}
            className="flex items-center space-x-1 text-[11px] text-slate-400 hover:text-slate-200 transition-colors"
          >
            {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
            <span>{copied ? 'Copied' : 'Copy JSON'}</span>
          </button>
        )}
      </div>

      {/* Tab Panels */}
      <div className="flex-1 relative overflow-hidden bg-[#090d16]">
        {/* Tab 1: Terminal */}
        <div
          className={`w-full h-full p-2.5 ${activeTab === 'terminal' ? 'block' : 'hidden'}`}
          ref={terminalContainerRef}
        />

        {/* Tab 2: Raw Model JSON */}
        {activeTab === 'model' && (
          <div className="w-full h-full p-3 overflow-auto font-mono text-[11px] text-emerald-400 select-text">
            <pre>{JSON.stringify(project, null, 2)}</pre>
          </div>
        )}

        {/* Tab 3: Operation Log */}
        {activeTab === 'operations' && (
          <div className="w-full h-full p-3 overflow-auto font-mono text-[11px] space-y-1.5 select-text">
            {operationLog.length === 0 ? (
              <div className="text-slate-600">No operations executed yet.</div>
            ) : (
              operationLog.map((op) => (
                <div
                  key={op.id}
                  className={`p-2 rounded border ${
                    op.success
                      ? 'bg-slate-900/60 border-slate-800 text-slate-300'
                      : 'bg-rose-950/40 border-rose-800 text-rose-300'
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="font-bold text-cyan-400">{op.type}</span>
                    <span className="text-slate-500">{new Date(op.timestamp).toLocaleTimeString()}</span>
                  </div>
                  <div className="text-slate-400 mt-1 break-all">
                    {JSON.stringify(op.payload)}
                  </div>
                  {op.error && <div className="text-rose-400 mt-0.5">Error: {op.error}</div>}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}

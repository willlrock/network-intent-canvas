import { AlertCircle, AlertTriangle, CheckCircle2, X } from 'lucide-react';
import { useNetworkStore } from '../operations/useNetworkStore';

export function ValidationModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const { validationIssues, store } = useNetworkStore();

  if (!isOpen) return null;

  const errors = validationIssues.filter((i) => i.severity === 'error');
  const warnings = validationIssues.filter((i) => i.severity === 'warning');

  const handleSelectEntity = (issue: typeof validationIssues[0]) => {
    if (issue.deviceId) {
      store.selectDevice(issue.deviceId);
      onClose();
    } else if (issue.linkId) {
      store.selectLink(issue.linkId);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl max-w-lg w-full max-h-[80vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <h3 className="text-sm font-bold text-slate-100">Deterministic Topology Validation</h3>
            <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
              {validationIssues.length} issues
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 flex-1 overflow-y-auto space-y-3">
          {validationIssues.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 space-y-2 text-center">
              <div className="w-12 h-12 rounded-full bg-emerald-950/60 border border-emerald-700 flex items-center justify-center text-emerald-400">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div className="text-sm font-semibold text-slate-200">Topology is Valid</div>
              <p className="text-xs text-slate-400 max-w-xs">
                All device models, interfaces, physical links, and port constraints comply with deterministic rules.
              </p>
            </div>
          ) : (
            <>
              {/* Errors */}
              {errors.length > 0 && (
                <div className="space-y-2">
                  <div className="text-xs font-bold text-rose-400 uppercase tracking-wider flex items-center space-x-1.5">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>Errors ({errors.length})</span>
                  </div>
                  <div className="space-y-1.5">
                    {errors.map((err) => (
                      <div
                        key={err.id}
                        onClick={() => handleSelectEntity(err)}
                        className="p-2.5 rounded bg-rose-950/30 border border-rose-800/80 hover:border-rose-600 cursor-pointer transition-colors text-xs text-rose-200 flex items-start justify-between space-x-2"
                      >
                        <div>
                          <div>{err.message}</div>
                          <div className="text-[10px] font-mono text-rose-400 mt-1">
                            {err.deviceId && `Device: ${err.deviceId} `}
                            {err.interfaceId && `Port: ${err.interfaceId} `}
                            {err.linkId && `Link: ${err.linkId}`}
                          </div>
                        </div>
                        <span className="text-[10px] text-rose-400 font-medium underline shrink-0">
                          Inspect
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Warnings */}
              {warnings.length > 0 && (
                <div className="space-y-2 pt-2">
                  <div className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center space-x-1.5">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Warnings ({warnings.length})</span>
                  </div>
                  <div className="space-y-1.5">
                    {warnings.map((warn) => (
                      <div
                        key={warn.id}
                        onClick={() => handleSelectEntity(warn)}
                        className="p-2.5 rounded bg-amber-950/30 border border-amber-800/80 hover:border-amber-600 cursor-pointer transition-colors text-xs text-amber-200 flex items-start justify-between space-x-2"
                      >
                        <div>
                          <div>{warn.message}</div>
                          <div className="text-[10px] font-mono text-amber-400 mt-1">
                            {warn.linkId && `Link: ${warn.linkId}`}
                          </div>
                        </div>
                        <span className="text-[10px] text-amber-400 font-medium underline shrink-0">
                          Inspect
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-950 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 rounded transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

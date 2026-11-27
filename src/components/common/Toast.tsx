import { useToast } from '../../contexts/ToastContext';
import { X, CheckCircle2, AlertCircle, Info } from 'lucide-react';

export default function ToastContainer() {
  const { toasts, removeToast } = useToast();

  if (toasts.length === 0) return null;

  const styles = {
    success: { icon: CheckCircle2, panel: 'border-emerald-200 bg-white text-gray-800', badge: 'bg-emerald-100 text-emerald-700' },
    error: { icon: AlertCircle, panel: 'border-red-200 bg-white text-gray-800', badge: 'bg-red-100 text-red-700' },
    info: { icon: Info, panel: 'border-blue-200 bg-white text-gray-800', badge: 'bg-blue-100 text-blue-700' },
  };

  return (
    <div
      className="fixed top-4 right-4 z-[100] flex w-[calc(100%-2rem)] max-w-sm flex-col gap-3 pointer-events-none sm:top-5 sm:right-5"
      aria-label="Thông báo"
    >
      {toasts.map((t) => {
        const style = styles[t.type];
        const Icon = style.icon;
        return (
        <div
          key={t.id}
          role={t.type === 'error' ? 'alert' : 'status'}
          aria-live={t.type === 'error' ? 'assertive' : 'polite'}
          aria-atomic="true"
          className={`pointer-events-auto flex items-center gap-3 rounded-xl border px-4 py-3 shadow-xl ring-1 ring-black/5 backdrop-blur animate-in slide-in-from-right ${style.panel}`}
        >
          <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${style.badge}`}>
            <Icon size={19} aria-hidden="true" />
          </span>
          <span className="flex-1 break-words text-sm font-medium">{t.message}</span>
          <button
            type="button"
            onClick={() => removeToast(t.id)}
            aria-label="Đóng thông báo"
            className="shrink-0 rounded-md p-1 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <X size={17} />
          </button>
        </div>
        );
      })}
    </div>
  );
}

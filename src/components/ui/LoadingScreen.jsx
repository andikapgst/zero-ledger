// src/components/ui/LoadingScreen.jsx
// Full-screen loading spinner shown during auth state resolution

export default function LoadingScreen() {
  return (
    <div className="fixed inset-0 bg-bg flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-teal flex items-center justify-center shadow-lg shadow-teal/30">
          <span className="text-2xl font-bold text-bg">ZL</span>
        </div>
        <div className="flex gap-1.5">
          {[0, 1, 2].map(i => (
            <div
              key={i}
              className="w-2 h-2 rounded-full bg-teal animate-bounce"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>
        <p className="text-muted text-sm">Memuat Zero Ledger…</p>
      </div>
    </div>
  );
}

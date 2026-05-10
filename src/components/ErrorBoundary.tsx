import { Component, type ReactNode, type ErrorInfo } from "react";
import { AlertTriangle, Home, RefreshCw } from "lucide-react";

interface Props {
  children: ReactNode;
  /** Custom fallback — defaults to the built-in error card */
  fallback?: (error: Error, reset: () => void) => ReactNode;
}

interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[ErrorBoundary]", error, info.componentStack);
  }

  reset = () => this.setState({ error: null });

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    if (this.props.fallback) return this.props.fallback(error, this.reset);

    return <ErrorCard error={error} onReset={this.reset} />;
  }
}

function ErrorCard({ error, onReset }: { error: Error; onReset: () => void }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-white to-red-50/20 flex items-center justify-center p-6">
      <div className="w-full max-w-lg text-center">

        <div className="relative mx-auto mb-8 w-40 h-40">
          <div className="absolute inset-0 rounded-full bg-red-100/50 animate-pulse" />
          <div className="absolute inset-4 rounded-full bg-red-50 border-2 border-red-200 flex items-center justify-center">
            <AlertTriangle className="size-14 text-red-400 stroke-[1.5]" />
          </div>
        </div>

        <h1 className="text-[26px] font-extrabold text-neutral-900 tracking-tight mb-3">
          Something went wrong
        </h1>
        <p className="text-[14px] text-neutral-500 leading-relaxed mb-4 max-w-sm mx-auto">
          An unexpected error crashed this part of the app.
          You can try again or return to the dashboard.
        </p>

        <div className="mx-auto max-w-sm bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-left mb-6">
          <p className="text-[11px] font-semibold text-red-400 uppercase tracking-wide mb-1">Error</p>
          <p className="text-[12px] text-red-700 font-mono break-all">{error.message || String(error)}</p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={onReset}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[14px] font-semibold rounded-xl transition-colors shadow-sm shadow-emerald-200 w-full sm:w-auto justify-center"
          >
            <RefreshCw className="size-4" />
            Try Again
          </button>
          <a
            href="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-white border border-neutral-200 hover:bg-neutral-50 text-neutral-700 text-[14px] font-semibold rounded-xl transition-colors w-full sm:w-auto justify-center"
          >
            <Home className="size-4" />
            Dashboard
          </a>
        </div>

        <p className="text-[12px] text-neutral-400 mt-10">
          TerraTrail &mdash; Real Estate Management Platform
        </p>
      </div>
    </div>
  );
}

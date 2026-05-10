import { Link, useNavigate } from "react-router";
import { AlertTriangle, Home, RefreshCw, ArrowLeft } from "lucide-react";
import { usePageTitle } from "../hooks/usePageTitle";

interface ServerErrorProps {
  /** Optional error message to display (e.g. from error boundary) */
  message?: string;
  /** Called when the user clicks "Try Again" — defaults to page reload */
  onRetry?: () => void;
}

export function ServerError({ message, onRetry }: ServerErrorProps = {}) {
  usePageTitle("Something went wrong");
  const navigate = useNavigate();

  const handleRetry = onRetry ?? (() => window.location.reload());

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-white to-red-50/20 flex items-center justify-center p-6">
      <div className="w-full max-w-lg text-center">

        {/* Illustration */}
        <div className="relative mx-auto mb-8 w-40 h-40">
          <div className="absolute inset-0 rounded-full bg-red-100/50 animate-pulse" />
          <div className="absolute inset-4 rounded-full bg-red-50 border-2 border-red-200 flex items-center justify-center">
            <AlertTriangle className="size-14 text-red-400 stroke-[1.5]" />
          </div>
          <span className="absolute -top-1 -right-1 text-[11px] font-black bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center shadow-lg shadow-red-200">
            500
          </span>
        </div>

        {/* Text */}
        <h1 className="text-[28px] font-extrabold text-neutral-900 tracking-tight mb-3">
          Something went wrong
        </h1>
        <p className="text-[15px] text-neutral-500 leading-relaxed mb-2 max-w-sm mx-auto">
          We hit an unexpected error. Our team has been notified.
          Please try again or go back to the dashboard.
        </p>
        {message && (
          <div className="mt-3 mb-6 mx-auto max-w-sm bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-left">
            <p className="text-[11px] font-semibold text-red-400 uppercase tracking-wide mb-1">Error details</p>
            <p className="text-[12px] text-red-700 font-mono break-all">{message}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-6">
          <button
            onClick={handleRetry}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[14px] font-semibold rounded-xl transition-colors shadow-sm shadow-emerald-200 w-full sm:w-auto justify-center"
          >
            <RefreshCw className="size-4" />
            Try Again
          </button>
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-white border border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50 text-neutral-700 text-[14px] font-semibold rounded-xl transition-colors w-full sm:w-auto justify-center"
          >
            <Home className="size-4" />
            Go to Dashboard
          </Link>
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-white border border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50 text-neutral-700 text-[14px] font-semibold rounded-xl transition-colors w-full sm:w-auto justify-center"
          >
            <ArrowLeft className="size-4" />
            Go Back
          </button>
        </div>

        <p className="text-[12px] text-neutral-400 mt-10">
          TerraTrail &mdash; Real Estate Management Platform
        </p>
      </div>
    </div>
  );
}

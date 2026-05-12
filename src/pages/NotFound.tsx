import { Link, useNavigate } from "react-router";
import { Home, ArrowLeft, Search } from "lucide-react";
import { usePageTitle } from "../hooks/usePageTitle";

export function NotFound() {
  usePageTitle("Page Not Found");
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-white to-[#eef2fb]/30 flex items-center justify-center p-6">
      <div className="w-full max-w-lg text-center">

        {/* Illustration */}
        <div className="relative mx-auto mb-8 w-40 h-40">
          <div className="absolute inset-0 rounded-full bg-[#d6e0f5]/60 animate-pulse" />
          <div className="absolute inset-4 rounded-full bg-[#0E2C72]/6 border-2 border-[#8aaad8] flex items-center justify-center">
            <Search className="size-14 text-[#4a6fc0] stroke-[1.5]" />
          </div>
          <span className="absolute -top-1 -right-1 text-[11px] font-black bg-[#0E2C72] text-white rounded-full w-8 h-8 flex items-center justify-center shadow-lg shadow-[#0E2C72]/20">
            404
          </span>
        </div>

        {/* Text */}
        <h1 className="text-[28px] font-extrabold text-neutral-900 tracking-tight mb-3">
          Page not found
        </h1>
        <p className="text-[15px] text-neutral-500 leading-relaxed mb-8 max-w-sm mx-auto">
          The page you're looking for doesn't exist or may have been moved.
          Double-check the URL or head back home.
        </p>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#0E2C72] hover:bg-[#0a2260] text-white text-[14px] font-semibold rounded-xl transition-colors shadow-sm shadow-[#0E2C72]/20 w-full sm:w-auto justify-center"
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

        {/* Footer hint */}
        <p className="text-[12px] text-neutral-400 mt-10">
          Terratrail &mdash; Real Estate Management Platform
        </p>
      </div>
    </div>
  );
}




import { useState, useRef } from "react";
import {
  Upload,
  Download,
  FileText,
  CheckCircle2,
  XCircle,
  AlertCircle,
  X,
  Building2,
  Users,
  ChevronDown,
  ChevronUp,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { api } from "../services/api";
import { usePageTitle } from "../hooks/usePageTitle";
import { cn } from "../components/ui/utils";

type Tab = "properties" | "customers";

interface UploadResult {
  total_rows: number;
  created: number;
  skipped: number;
  error_count: number;
  errors: { row: number; error: string }[];
}

const PROPERTY_FIELDS = [
  { name: "name", required: true, desc: "Property name" },
  { name: "property_type", required: false, desc: "RESIDENTIAL_LAND · FARM_LAND · COMMERCIAL · MIXED_USE (default: RESIDENTIAL_LAND)" },
  { name: "description", required: false, desc: "Property description" },
  { name: "estate_land_title", required: false, desc: "C of O number or title deed reference" },
  { name: "status", required: false, desc: "DRAFT · PUBLISHED (default: DRAFT)" },
  { name: "city", required: true, desc: "City name" },
  { name: "state", required: true, desc: "State name (e.g. Lagos)" },
  { name: "address", required: false, desc: "Street address" },
  { name: "postal_code", required: false, desc: "Postal/ZIP code" },
  { name: "nearest_landmark", required: false, desc: "Landmark (e.g. Near Shoprite)" },
  { name: "latitude", required: false, desc: "Decimal degrees e.g. 6.524379" },
  { name: "longitude", required: false, desc: "Decimal degrees e.g. 3.379206" },
];

const CUSTOMER_FIELDS = [
  { name: "full_name", required: true, desc: "Customer full name" },
  { name: "email", required: true, desc: "Unique email address" },
  { name: "phone", required: false, desc: "Phone number" },
  { name: "address", required: false, desc: "Home/office address" },
  { name: "next_of_kin_name", required: false, desc: "Next of kin full name" },
  { name: "next_of_kin_phone", required: false, desc: "Next of kin phone" },
  { name: "next_of_kin_relationship", required: false, desc: "e.g. Mother, Spouse" },
  { name: "referral_source", required: false, desc: "WALK_IN · REFERRAL · SOCIAL_MEDIA · WEBSITE · AGENT · OTHER" },
];

function TemplateFieldsTable({ fields }: { fields: typeof PROPERTY_FIELDS }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-neutral-200 rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-neutral-700 bg-neutral-50 hover:bg-neutral-100 transition-colors"
      >
        <span>Template column reference</span>
        {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>
      {open && (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-neutral-50 border-t border-neutral-200">
                <th className="text-left px-4 py-2 font-semibold text-neutral-600">Column</th>
                <th className="text-left px-4 py-2 font-semibold text-neutral-600">Required</th>
                <th className="text-left px-4 py-2 font-semibold text-neutral-600">Notes</th>
              </tr>
            </thead>
            <tbody>
              {fields.map((f) => (
                <tr key={f.name} className="border-t border-neutral-100">
                  <td className="px-4 py-2 font-mono font-semibold text-[#0E2C72]">{f.name}</td>
                  <td className="px-4 py-2">
                    {f.required ? (
                      <span className="text-red-600 font-semibold">Yes</span>
                    ) : (
                      <span className="text-neutral-400">No</span>
                    )}
                  </td>
                  <td className="px-4 py-2 text-neutral-600">{f.desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function UploadZone({
  onFile,
  disabled,
}: {
  onFile: (f: File) => void;
  disabled: boolean;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) onFile(file);
  };

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      onClick={() => !disabled && ref.current?.click()}
      className={cn(
        "border-2 border-dashed rounded-xl p-10 text-center transition-colors",
        dragging ? "border-[#0E2C72] bg-[#0E2C72]/5" : "border-neutral-300",
        disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:border-[#0E2C72] hover:bg-[#0E2C72]/5"
      )}
    >
      <input
        ref={ref}
        type="file"
        accept=".csv,.xlsx,.xls"
        className="hidden"
        disabled={disabled}
        onChange={(e) => { const f = e.target.files?.[0]; if (f) { onFile(f); e.target.value = ""; } }}
      />
      <Upload className="w-10 h-10 text-neutral-400 mx-auto mb-3" />
      <p className="text-sm font-medium text-neutral-700">Drop your file here, or click to browse</p>
      <p className="text-xs text-neutral-400 mt-1">Accepts CSV or Excel (.xlsx)</p>
    </div>
  );
}

function ResultSummary({ result, onReset }: { result: UploadResult; onReset: () => void }) {
  const [showErrors, setShowErrors] = useState(true);
  const allOk = result.error_count === 0 && result.created > 0;

  return (
    <div className="space-y-4">
      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-neutral-800">{result.total_rows}</p>
          <p className="text-xs text-neutral-500 mt-1">Total Rows</p>
        </div>
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-emerald-700">{result.created}</p>
          <p className="text-xs text-emerald-600 mt-1">Created</p>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-amber-700">{result.skipped}</p>
          <p className="text-xs text-amber-600 mt-1">Skipped (duplicates)</p>
        </div>
        <div className={cn(
          "border rounded-lg p-4 text-center",
          result.error_count > 0 ? "bg-red-50 border-red-200" : "bg-neutral-50 border-neutral-200"
        )}>
          <p className={cn("text-2xl font-bold", result.error_count > 0 ? "text-red-700" : "text-neutral-400")}>
            {result.error_count}
          </p>
          <p className={cn("text-xs mt-1", result.error_count > 0 ? "text-red-600" : "text-neutral-500")}>Errors</p>
        </div>
      </div>

      {/* Status banner */}
      {allOk ? (
        <div className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <p className="text-sm text-emerald-800 font-medium">Upload complete — {result.created} record{result.created !== 1 ? "s" : ""} created successfully.</p>
        </div>
      ) : result.error_count > 0 ? (
        <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
          <p className="text-sm text-amber-800 font-medium">
            {result.created} created, {result.error_count} row{result.error_count !== 1 ? "s" : ""} had errors.
            {result.skipped > 0 ? ` ${result.skipped} skipped (already exist).` : ""}
          </p>
        </div>
      ) : (
        <div className="flex items-center gap-3 p-4 bg-neutral-100 border border-neutral-200 rounded-lg">
          <XCircle className="w-5 h-5 text-neutral-500 flex-shrink-0" />
          <p className="text-sm text-neutral-700 font-medium">No new records created.{result.skipped > 0 ? ` ${result.skipped} row(s) already exist.` : ""}</p>
        </div>
      )}

      {/* Row-level errors */}
      {result.errors.length > 0 && (
        <div className="border border-red-200 rounded-lg overflow-hidden">
          <button
            onClick={() => setShowErrors((v) => !v)}
            className="w-full flex items-center justify-between px-4 py-3 bg-red-50 text-sm font-medium text-red-800"
          >
            <span className="flex items-center gap-2">
              <XCircle className="w-4 h-4" />
              {result.errors.length} row error{result.errors.length !== 1 ? "s" : ""}
            </span>
            {showErrors ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          {showErrors && (
            <div className="overflow-x-auto max-h-64 overflow-y-auto">
              <table className="w-full text-xs">
                <thead className="sticky top-0 bg-red-50 border-b border-red-200">
                  <tr>
                    <th className="text-left px-4 py-2 font-semibold text-red-700 w-16">Row</th>
                    <th className="text-left px-4 py-2 font-semibold text-red-700">Error</th>
                  </tr>
                </thead>
                <tbody>
                  {result.errors.map((e, i) => (
                    <tr key={i} className="border-t border-red-100">
                      <td className="px-4 py-2 font-mono text-red-600">{e.row}</td>
                      <td className="px-4 py-2 text-neutral-700">{e.error}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      <button
        onClick={onReset}
        className="w-full py-2.5 border border-neutral-300 rounded-lg text-sm text-neutral-600 hover:bg-neutral-50 transition-colors"
      >
        Upload another file
      </button>
    </div>
  );
}

function UploadPanel({
  type,
  fields,
  uploadFn,
  templateFn,
}: {
  type: string;
  fields: typeof PROPERTY_FIELDS;
  uploadFn: (file: File) => Promise<UploadResult>;
  templateFn: (fmt: "csv" | "xlsx") => string;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<UploadResult | null>(null);

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    try {
      const res = await uploadFn(file);
      setResult(res);
      if (res.created > 0) toast.success(`${res.created} ${type} imported successfully.`);
      else if (res.skipped > 0 && res.error_count === 0) toast.info("All rows already exist — nothing was imported.");
      else if (res.error_count > 0) toast.error(`Upload finished with ${res.error_count} error(s). See report below.`);
    } catch (err: any) {
      toast.error(err.message ?? "Upload failed. Please check your file and try again.");
    } finally {
      setUploading(false);
    }
  };

  const reset = () => { setFile(null); setResult(null); };

  if (result) return <ResultSummary result={result} onReset={reset} />;

  return (
    <div className="space-y-6">
      {/* Download templates */}
      <div>
        <h3 className="text-sm font-semibold text-neutral-700 mb-3">1. Download a sample template</h3>
        <div className="flex flex-wrap gap-2">
          <a
            href={templateFn("csv")}
            download
            className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-neutral-300 text-neutral-700 rounded-lg text-sm hover:bg-neutral-50 transition-colors"
          >
            <FileText className="w-4 h-4 text-[#0E2C72]" />
            Download CSV template
          </a>
          <a
            href={templateFn("xlsx")}
            download
            className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-neutral-300 text-neutral-700 rounded-lg text-sm hover:bg-neutral-50 transition-colors"
          >
            <Download className="w-4 h-4 text-emerald-600" />
            Download Excel template
          </a>
        </div>
        <p className="text-xs text-neutral-400 mt-2">
          Fill in the template and upload it below. Do not change column headers.
        </p>
      </div>

      {/* Column reference */}
      <TemplateFieldsTable fields={fields} />

      {/* Upload zone */}
      <div>
        <h3 className="text-sm font-semibold text-neutral-700 mb-3">2. Upload your completed file</h3>
        {file ? (
          <div className="flex items-center justify-between p-4 bg-[#0E2C72]/5 border border-[#0E2C72]/20 rounded-xl">
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5 text-[#0E2C72] flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-neutral-800">{file.name}</p>
                <p className="text-xs text-neutral-500">{(file.size / 1024).toFixed(1)} KB</p>
              </div>
            </div>
            <button onClick={() => setFile(null)} className="p-1.5 hover:bg-neutral-100 rounded-md">
              <X className="w-4 h-4 text-neutral-500" />
            </button>
          </div>
        ) : (
          <UploadZone onFile={setFile} disabled={uploading} />
        )}
      </div>

      {file && (
        <button
          onClick={handleUpload}
          disabled={uploading}
          className="w-full py-3 bg-[#0E2C72] text-white rounded-xl text-sm font-semibold hover:bg-[#0a2260] transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {uploading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Uploading and processing…
            </>
          ) : (
            <>
              <Upload className="w-4 h-4" />
              Import {type}
            </>
          )}
        </button>
      )}
    </div>
  );
}

export function BulkUpload() {
  usePageTitle("Bulk Upload");
  const [tab, setTab] = useState<Tab>("properties");

  return (
    <div className="min-h-screen bg-neutral-50 p-4 sm:p-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-neutral-900">Bulk Upload</h1>
          <p className="text-sm text-neutral-500 mt-1">
            Import properties or customers from a CSV or Excel file. Duplicates are skipped automatically.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-neutral-100 rounded-xl p-1 mb-6">
          <button
            onClick={() => setTab("properties")}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-medium transition-colors",
              tab === "properties"
                ? "bg-white text-[#0E2C72] shadow-sm"
                : "text-neutral-500 hover:text-neutral-700"
            )}
          >
            <Building2 className="w-4 h-4" />
            Properties
          </button>
          <button
            onClick={() => setTab("customers")}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-medium transition-colors",
              tab === "customers"
                ? "bg-white text-[#0E2C72] shadow-sm"
                : "text-neutral-500 hover:text-neutral-700"
            )}
          >
            <Users className="w-4 h-4" />
            Customers
          </button>
        </div>

        {/* Panel */}
        <div className="bg-white rounded-2xl border border-neutral-200 p-6 sm:p-8">
          {tab === "properties" ? (
            <UploadPanel
              key="properties"
              type="properties"
              fields={PROPERTY_FIELDS}
              uploadFn={(f) => api.properties.bulkUpload(f)}
              templateFn={(fmt) => api.properties.bulkTemplate(fmt)}
            />
          ) : (
            <UploadPanel
              key="customers"
              type="customers"
              fields={CUSTOMER_FIELDS}
              uploadFn={(f) => api.customers.bulkUpload(f)}
              templateFn={(fmt) => api.customers.bulkTemplate(fmt)}
            />
          )}
        </div>

        {/* Notes */}
        <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-xl">
          <p className="text-xs font-semibold text-amber-800 mb-1">Important notes</p>
          <ul className="text-xs text-amber-700 space-y-1 list-disc list-inside">
            <li>Maximum 500 rows per upload. Split larger files into batches.</li>
            <li>Properties: duplicates are matched by name (case-insensitive). Existing records are skipped, not updated.</li>
            <li>Customers: duplicates are matched by email address. Existing records are skipped, not updated.</li>
            <li>Images, pricing plans, and documents must be added individually via the property wizard after import.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

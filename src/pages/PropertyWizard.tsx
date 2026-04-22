import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useParams } from "react-router";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Upload,
  MapPin,
  Plus,
  Trash2,
  Pencil,
  Eye,
  FileText,
  DollarSign,
  CreditCard,
  X,
  AlertCircle,
  Image as ImageIcon,
  Loader2,
  Layers,
} from "lucide-react";
import { toast } from "sonner";
import { api } from "../services/api";
import { usePageTitle } from "../hooks/usePageTitle";
import { Badge } from "../components/ui/badge";
import { cn } from "../components/ui/utils";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";

// ─── Step definitions ────────────────────────────────────────────────────────
const steps = [
  { id: 1, name: "Basic Info",       icon: FileText   },
  { id: 2, name: "Gallery",          icon: Upload     },
  { id: 3, name: "Location",         icon: MapPin     },
  { id: 4, name: "Amenities",        icon: Check      },
  { id: 5, name: "Documents",        icon: FileText   },
  { id: 6, name: "Land Inventory",   icon: Layers     },
  { id: 7, name: "Pricing Plans",    icon: DollarSign },
  { id: 8, name: "Payment Methods",  icon: CreditCard },
];

// ─── Types ───────────────────────────────────────────────────────────────────
interface Amenity { id: string; name: string; status: string; description: string; }
interface Doc {
  id: string; documentType: string; customDocName: string;
  status: string; notes: string; file: File | null; fileName: string;
}
interface LandSizeEntry { id: string; landSize: string; totalSlots: string; description: string; }

const DOCUMENT_TYPES = [
  { value: "C_OF_O",             label: "Certificate of Occupancy (C of O)" },
  { value: "DEED_OF_ASSIGNMENT", label: "Deed of Assignment" },
  { value: "SURVEY_PLAN",        label: "Survey Plan" },
  { value: "OTHER",              label: "Other" },
];
const DOCUMENT_STATUSES = [
  { value: "NOT_STARTED", label: "Not Started" },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "READY",       label: "Ready" },
];
const AMENITY_STATUSES = [
  { value: "NOT_STARTED", label: "Not Started" },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "COMPLETED",   label: "Completed" },
];

const docDisplayLabel = (doc: Doc) =>
  doc.documentType === "OTHER" && doc.customDocName
    ? doc.customDocName
    : DOCUMENT_TYPES.find((d) => d.value === doc.documentType)?.label ?? doc.documentType;

interface PricingPlan {
  id: string; name: string; landSize: string; currency: string;
  totalPrice: string; paymentType: "outright" | "installment";
  initialPayment: string; duration: string; spreadMethod: "separate" | "first_month";
  active: boolean;
}
interface PaymentMethod { id: string; bankName: string; bankCode: string; accountName: string; accountNumber: string; active: boolean; }

const NIGERIAN_BANKS = [
  { name: "Access Bank",                   code: "044" },
  { name: "Citibank Nigeria",              code: "023" },
  { name: "Ecobank Nigeria",               code: "050" },
  { name: "Fidelity Bank",                 code: "070" },
  { name: "First Bank of Nigeria",         code: "011" },
  { name: "First City Monument Bank",      code: "214" },
  { name: "Globus Bank",                   code: "00103" },
  { name: "Guaranty Trust Bank",           code: "058" },
  { name: "Heritage Bank",                 code: "030" },
  { name: "Keystone Bank",                 code: "082" },
  { name: "Kuda Bank",                     code: "50211" },
  { name: "Lotus Bank",                    code: "303" },
  { name: "Moniepoint MFB",               code: "50515" },
  { name: "Opay",                          code: "100004" },
  { name: "Palmpay",                       code: "100033" },
  { name: "Polaris Bank",                  code: "076" },
  { name: "Providus Bank",                 code: "101" },
  { name: "Stanbic IBTC Bank",             code: "221" },
  { name: "Standard Chartered Bank",       code: "068" },
  { name: "Sterling Bank",                 code: "232" },
  { name: "Titan Trust Bank",              code: "102" },
  { name: "Union Bank of Nigeria",         code: "032" },
  { name: "United Bank for Africa",        code: "033" },
  { name: "Unity Bank",                    code: "215" },
  { name: "VFD Microfinance Bank",         code: "566" },
  { name: "Wema Bank",                     code: "035" },
  { name: "Zenith Bank",                   code: "057" },
];

const NIGERIAN_STATES = [
  "Abia","Adamawa","Akwa Ibom","Anambra","Bauchi","Bayelsa","Benue","Borno",
  "Cross River","Delta","Ebonyi","Edo","Ekiti","Enugu","FCT","Gombe","Imo",
  "Jigawa","Kaduna","Kano","Katsina","Kebbi","Kogi","Kwara","Lagos","Nasarawa",
  "Niger","Ogun","Ondo","Osun","Oyo","Plateau","Rivers","Sokoto","Taraba",
  "Yobe","Zamfara",
];

// ─── Validation rules per step ───────────────────────────────────────────────
function validateStep(step: number, state: Record<string, any>): string | null {
  if (step === 1) {
    if (!state.propertyName.trim()) return "Property Name is required.";
  }
  if (step === 3) {
    if (!state.city.trim()) return "City is required.";
    if (!state.state.trim()) return "State is required.";
  }
  if (step === 6) {
    if ((state.landSizes as LandSizeEntry[]).length === 0)
      return "Add at least one land size to the inventory.";
  }
  return null;
}

// ─── Helper ──────────────────────────────────────────────────────────────────
const fmt = (n: number) => `₦${n.toLocaleString("en-NG")}`;
const fmtSqm = (n: number) => n.toLocaleString("en-NG");

export function PropertyWizard() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = !!id;
  usePageTitle(isEditing ? "Edit Property" : "Create Property");

  // ── Step ──────────────────────────────────────────────────────────────────
  const [currentStep, setCurrentStep] = useState(1);

  // ── Step 1 state ─────────────────────────────────────────────────────────
  const [propertyName, setPropertyName] = useState("");
  const [propertyType, setPropertyType] = useState("RESIDENTIAL_LAND");
  const [description, setDescription]   = useState("");

  // ── Step 2 state ─────────────────────────────────────────────────────────
  const [coverImage, setCoverImage]       = useState<File | null>(null);
  const [coverPreview, setCoverPreview]   = useState<string | null>(null);
  const [galleryImages, setGalleryImages] = useState<{ file: File; preview: string }[]>([]);
  const coverRef   = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);

  // ── Step 3 state ─────────────────────────────────────────────────────────
  const [streetAddress, setStreetAddress] = useState("");
  const [city, setCity]                   = useState("");
  const [state, setState]                 = useState("");
  const [postalCode, setPostalCode]       = useState("");
  const [landmark, setLandmark]           = useState("");
  const [latitude,  setLatitude]          = useState("");
  const [longitude, setLongitude]         = useState("");
  const [geoLoading, setGeoLoading]       = useState(false);

  // ── Step 4 state ─────────────────────────────────────────────────────────
  const [amenities, setAmenities]               = useState<Amenity[]>([]);
  const [showAmenityModal, setShowAmenityModal] = useState(false);
  const [editingAmenityId, setEditingAmenityId] = useState<string | null>(null);
  const [amenityForm, setAmenityForm]           = useState({ name: "", status: "NOT_STARTED" });

  // ── Step 5 state ─────────────────────────────────────────────────────────
  const [documents, setDocuments]       = useState<Doc[]>([]);
  const [showDocModal, setShowDocModal] = useState(false);
  const [docForm, setDocForm]           = useState<Omit<Doc, "id">>({
    documentType: "SURVEY_PLAN", customDocName: "", status: "NOT_STARTED",
    notes: "", file: null, fileName: "",
  });
  const docFileRef = useRef<HTMLInputElement>(null);

  // ── Step 6 state — Land Inventory ────────────────────────────────────────
  const [landSizes, setLandSizes]               = useState<LandSizeEntry[]>([]);
  const [showLandSizeModal, setShowLandSizeModal] = useState(false);
  const [editingLandSizeId, setEditingLandSizeId] = useState<string | null>(null);
  const [landSizeForm, setLandSizeForm]           = useState({ landSize: "", totalSlots: "", description: "" });

  // Computed from land inventory
  const computedTotalSqms = landSizes.reduce(
    (sum, ls) => sum + (Number(ls.landSize) || 0) * (Number(ls.totalSlots) || 0), 0
  );
  const computedAvailableUnits = landSizes.reduce(
    (sum, ls) => sum + (Number(ls.totalSlots) || 0), 0
  );

  // ── Submission ─────────────────────────────────────────────────────────
  const [submitting, setSubmitting] = useState(false);

  // ── Step 7 state — Pricing Plans ─────────────────────────────────────────
  const [pricingPlans, setPricingPlans]         = useState<PricingPlan[]>([]);
  const [showPricingModal, setShowPricingModal] = useState(false);
  const [editingPlanId, setEditingPlanId]       = useState<string | null>(null);
  const [pricingForm, setPricingForm]           = useState<Omit<PricingPlan, "id" | "active">>({
    name: "", landSize: "", currency: "NGN", totalPrice: "",
    paymentType: "outright", initialPayment: "", duration: "", spreadMethod: "separate",
  });

  // ── Step 8 state — Payment Methods ───────────────────────────────────────
  const [paymentMethods, setPaymentMethods]     = useState<PaymentMethod[]>([]);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [editingPaymentId, setEditingPaymentId] = useState<string | null>(null);
  const [paymentForm, setPaymentForm]           = useState({ bankName: "", bankCode: "", accountName: "", accountNumber: "" });
  const [verifyingAccount, setVerifyingAccount] = useState(false);
  const [verifyError, setVerifyError]           = useState("");

  // ── Helpers ───────────────────────────────────────────────────────────────
  const monthlyInstallment = useCallback((p: Omit<PricingPlan, "id" | "active">) => {
    const total = Number(p.totalPrice) || 0;
    const init  = Number(p.initialPayment) || 0;
    const dur   = Number(p.duration) || 1;
    if (p.paymentType !== "installment") return null;
    return p.spreadMethod === "separate"
      ? (total - init) / dur
      : (total - init) / (dur - 1 || 1);
  }, []);

  // ── Load property data for editing ───────────────────────────────────────
  useEffect(() => {
    if (!isEditing || !id) return;
    api.properties.get(id).then((prop: any) => {
      setPropertyName(prop.name ?? "");
      setPropertyType(prop.property_type ?? "RESIDENTIAL_LAND");
      setDescription(prop.description ?? "");
      if (prop.featured_image) setCoverPreview(prop.featured_image);
      if (prop.location) {
        setStreetAddress(prop.location.address ?? "");
        setCity(prop.location.city ?? "");
        setState(prop.location.state ?? "");
        setPostalCode(prop.location.postal_code ?? "");
        setLandmark(prop.location.nearest_landmark ?? "");
        setLatitude(prop.location.latitude?.toString() ?? "");
        setLongitude(prop.location.longitude?.toString() ?? "");
      }
      if (prop.amenities?.length) {
        setAmenities(prop.amenities.map((a: any) => ({
          id: a.id, name: a.name, status: a.status, description: a.description ?? "",
        })));
      }
      if (prop.documents?.length) {
        setDocuments(prop.documents.map((d: any) => ({
          id: d.id, documentType: d.document_type, status: d.status,
          customDocName: d.custom_document_name ?? "",
          notes: d.notes ?? "", file: null, fileName: "",
        })));
      }
      if (prop.land_sizes?.length) {
        setLandSizes(prop.land_sizes.map((ls: any) => ({
          id: ls.id,
          landSize: ls.land_size?.toString() ?? "",
          totalSlots: ls.total_slots?.toString() ?? "",
          description: ls.description ?? "",
        })));
      }
      if (prop.pricing_plans?.length) {
        setPricingPlans(prop.pricing_plans.filter((p: any) => !p.is_locked).map((p: any) => ({
          id: p.id, name: p.plan_name, landSize: p.land_size?.toString() ?? "",
          currency: "NGN", totalPrice: p.total_price?.toString() ?? "",
          paymentType: p.payment_type === "OUTRIGHT" ? "outright" : "installment",
          initialPayment: p.initial_payment?.toString() ?? "",
          duration: p.duration_months?.toString() ?? "12",
          spreadMethod: p.payment_spread_method === "INITIAL_SEPARATE" ? "separate" : "first_month",
          active: true,
        })));
      }
      if (prop.bank_accounts?.length) {
        setPaymentMethods(prop.bank_accounts.map((b: any) => ({
          id: b.id, bankName: b.bank_name, bankCode: "",
          accountName: b.account_name, accountNumber: b.account_number, active: true,
        })));
      }
    }).catch(() => toast.error("Failed to load property data."));
  }, [id, isEditing]);

  // ── Geolocation ───────────────────────────────────────────────────────────
  const handleUseLocation = () => {
    if (!navigator.geolocation) { toast.error("Geolocation not supported."); return; }
    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLatitude(pos.coords.latitude.toFixed(6));
        setLongitude(pos.coords.longitude.toFixed(6));
        setGeoLoading(false);
        toast.success("Location detected successfully.");
      },
      (err) => {
        setGeoLoading(false);
        const msg: Record<number, string> = {
          1: "Location access denied. Allow location in browser settings.",
          2: "Location unavailable. Enter coordinates manually.",
          3: "Location request timed out.",
        };
        toast.error(msg[err.code] ?? "Could not detect location.");
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  // ── File upload handlers ──────────────────────────────────────────────────
  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCoverImage(file);
    setCoverPreview(URL.createObjectURL(file));
  };

  const handleGalleryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    const newImages = files.map((f) => ({ file: f, preview: URL.createObjectURL(f) }));
    setGalleryImages((prev) => [...prev, ...newImages].slice(0, 10));
  };

  // ── Amenity CRUD ─────────────────────────────────────────────────────────
  const openAddAmenity = () => {
    setEditingAmenityId(null);
    setAmenityForm({ name: "", status: "NOT_STARTED" });
    setShowAmenityModal(true);
  };
  const openEditAmenity = (a: Amenity) => {
    setEditingAmenityId(a.id);
    setAmenityForm({ name: a.name, status: a.status });
    setShowAmenityModal(true);
  };
  const saveAmenity = () => {
    if (!amenityForm.name.trim()) { toast.error("Amenity name is required."); return; }
    if (editingAmenityId) {
      setAmenities((prev) => prev.map((a) => a.id === editingAmenityId ? { ...a, ...amenityForm } : a));
      toast.success("Amenity updated.");
    } else {
      setAmenities((prev) => [...prev, { id: Date.now().toString(), description: "", ...amenityForm }]);
      toast.success("Amenity added.");
    }
    setShowAmenityModal(false);
  };

  // ── Document CRUD ─────────────────────────────────────────────────────────
  const openAddDoc = () => {
    setDocForm({ documentType: "SURVEY_PLAN", customDocName: "", status: "NOT_STARTED", notes: "", file: null, fileName: "" });
    setShowDocModal(true);
  };
  const saveDoc = () => {
    setDocuments((prev) => [...prev, { id: Date.now().toString(), ...docForm }]);
    toast.success("Document added.");
    setShowDocModal(false);
  };

  // ── Land Size CRUD ────────────────────────────────────────────────────────
  const openAddLandSize = () => {
    setEditingLandSizeId(null);
    setLandSizeForm({ landSize: "", totalSlots: "", description: "" });
    setShowLandSizeModal(true);
  };
  const openEditLandSize = (ls: LandSizeEntry) => {
    setEditingLandSizeId(ls.id);
    setLandSizeForm({ landSize: ls.landSize, totalSlots: ls.totalSlots, description: ls.description });
    setShowLandSizeModal(true);
  };
  const saveLandSize = () => {
    if (!landSizeForm.landSize || !landSizeForm.totalSlots) {
      toast.error("Land size (SQM) and number of slots are required.");
      return;
    }
    if (Number(landSizeForm.landSize) <= 0 || Number(landSizeForm.totalSlots) <= 0) {
      toast.error("Land size and slots must be positive numbers.");
      return;
    }
    if (editingLandSizeId) {
      setLandSizes((prev) => prev.map((ls) =>
        ls.id === editingLandSizeId ? { ...ls, ...landSizeForm } : ls
      ));
      toast.success("Land size updated.");
    } else {
      // Prevent duplicate land sizes
      const duplicate = landSizes.find((ls) => ls.landSize === landSizeForm.landSize);
      if (duplicate) { toast.error(`${landSizeForm.landSize} SQM already exists in the inventory.`); return; }
      setLandSizes((prev) => [...prev, { id: Date.now().toString(), ...landSizeForm }]);
      toast.success("Land size added.");
    }
    setShowLandSizeModal(false);
  };

  // ── Pricing Plan CRUD ─────────────────────────────────────────────────────
  const openAddPricing = () => {
    setEditingPlanId(null);
    setPricingForm({
      name: "", landSize: landSizes[0]?.landSize ?? "", currency: "NGN", totalPrice: "",
      paymentType: "outright", initialPayment: "", duration: "", spreadMethod: "separate",
    });
    setShowPricingModal(true);
  };
  const openEditPricing = (p: PricingPlan) => {
    setEditingPlanId(p.id);
    setPricingForm({ name: p.name, landSize: p.landSize, currency: p.currency, totalPrice: p.totalPrice, paymentType: p.paymentType, initialPayment: p.initialPayment, duration: p.duration, spreadMethod: p.spreadMethod });
    setShowPricingModal(true);
  };
  const savePricing = () => {
    if (!pricingForm.name.trim() || !pricingForm.totalPrice) {
      toast.error("Plan name and total price are required.");
      return;
    }
    if (editingPlanId) {
      setPricingPlans((prev) => prev.map((p) => p.id === editingPlanId ? { ...p, ...pricingForm } : p));
      toast.success("Pricing plan updated.");
    } else {
      setPricingPlans((prev) => [...prev, { id: Date.now().toString(), active: true, ...pricingForm }]);
      toast.success("Pricing plan created.");
    }
    setShowPricingModal(false);
  };

  // ── Payment Method CRUD ───────────────────────────────────────────────────
  const openAddPayment = () => {
    setEditingPaymentId(null);
    setPaymentForm({ bankName: "", bankCode: "", accountName: "", accountNumber: "" });
    setVerifyError("");
    setShowPaymentModal(true);
  };
  const openEditPayment = (m: PaymentMethod) => {
    setEditingPaymentId(m.id);
    setPaymentForm({ bankName: m.bankName, bankCode: m.bankCode ?? "", accountName: m.accountName, accountNumber: m.accountNumber });
    setVerifyError("");
    setShowPaymentModal(true);
  };
  const handleVerifyAccount = async () => {
    if (!paymentForm.bankCode) { setVerifyError("Please select a bank first."); return; }
    if (paymentForm.accountNumber.length !== 10) { setVerifyError("Account number must be exactly 10 digits."); return; }
    setVerifyingAccount(true);
    setVerifyError("");
    try {
      const res = await api.banking.verifyAccount(paymentForm.accountNumber, paymentForm.bankCode);
      setPaymentForm((f) => ({ ...f, accountName: res.account_name }));
    } catch (err: any) {
      setVerifyError(err.message ?? "Could not verify account. Check the number and try again.");
    } finally {
      setVerifyingAccount(false);
    }
  };
  const savePayment = () => {
    if (!paymentForm.bankName.trim() || !paymentForm.accountName.trim() || paymentForm.accountNumber.length < 10) {
      toast.error("Please select a bank, enter a valid account number, and verify the account name.");
      return;
    }
    if (editingPaymentId) {
      setPaymentMethods((prev) => prev.map((m) => m.id === editingPaymentId ? { ...m, ...paymentForm } : m));
      toast.success("Payment method updated.");
    } else {
      setPaymentMethods((prev) => [...prev, { id: Date.now().toString(), active: true, ...paymentForm }]);
      toast.success("Payment method added.");
    }
    setShowPaymentModal(false);
  };

  // ── Submit to API ─────────────────────────────────────────────────────────
  const handleSubmit = async (overrideStatus?: string) => {
    setSubmitting(true);
    try {
      const payload: any = {
        name: propertyName,
        property_type: propertyType,
        description,
        status: overrideStatus ?? "DRAFT",
        unit_measurement: "sqm",
        // total_sqms and available_units are auto-computed server-side from land_sizes
        location: {
          address: streetAddress || `${city}, ${state}`,
          city,
          state,
          country: "Nigeria",
          postal_code: postalCode || undefined,
          nearest_landmark: landmark || undefined,
          latitude: latitude || undefined,
          longitude: longitude || undefined,
        },
        amenities: amenities.map((a) => ({
          name: a.name,
          status: a.status,
          description: a.description,
        })),
        documents: documents.map((d) => ({
          document_type: d.documentType,
          custom_document_name: d.documentType === "OTHER" ? d.customDocName : "",
          status: d.status,
          notes: d.notes,
        })),
        land_sizes: landSizes.map((ls) => ({
          land_size: ls.landSize,
          total_slots: Number(ls.totalSlots),
          description: ls.description,
        })),
        pricing_plans: pricingPlans.map((p) => ({
          plan_name: p.name,
          land_size: p.landSize,
          total_price: p.totalPrice,
          payment_type: p.paymentType === "outright" ? "OUTRIGHT" : "INSTALLMENT",
          initial_payment: p.initialPayment || "0",
          duration_months: Number(p.duration) || 12,
          payment_spread_method:
            p.spreadMethod === "separate" ? "INITIAL_SEPARATE" : "INITIAL_AS_FIRST",
        })),
        bank_accounts: paymentMethods.map((m) => ({
          bank_name: m.bankName,
          account_name: m.accountName,
          account_number: m.accountNumber,
        })),
      };

      const created = isEditing
        ? await api.properties.update(id!, payload)
        : await api.properties.create(payload);

      const propertyId: string = created?.id ?? id!;

      if (coverImage && propertyId) {
        try {
          await api.properties.uploadFeaturedImage(propertyId, coverImage);
        } catch {
          toast.error("Property saved, but cover image upload failed.");
        }
      }

      if (galleryImages.length > 0 && propertyId) {
        await Promise.allSettled(
          galleryImages.map((img, i) =>
            api.properties.uploadGalleryImage(propertyId, img.file, i)
          )
        );
      }

      toast.success(isEditing ? "Property updated!" : "Property created!");
      navigate("/properties");
    } catch (err: any) {
      toast.error(err.message || "Failed to save property. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Navigation ────────────────────────────────────────────────────────────
  const handleBack = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
    else navigate("/properties");
  };

  const handleNext = () => {
    const err = validateStep(currentStep, { propertyName, landSizes, city, state });
    if (err) { toast.error(err); return; }
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    } else {
      handleSubmit();
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col min-h-[calc(100vh-64px)] w-full bg-neutral-50/50">

      {/* ── Header ── */}
      <div className="bg-white border-b border-neutral-200 px-4 sm:px-6 lg:px-8 py-4 sticky top-0 z-10 hidden md:block">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={handleBack}
              className="hover:bg-neutral-100 rounded-lg">
              <ArrowLeft className="w-5 h-5 text-neutral-600" />
            </Button>
            <div>
              <h1 className="text-2xl font-semibold text-neutral-900">
                {isEditing ? `Edit: ${propertyName || "Property"}` : "Create Property"}
              </h1>
              <p className="text-sm text-neutral-500 mt-0.5">
                Step {currentStep} of {steps.length} — {steps[currentStep - 1].name}
              </p>
            </div>
          </div>
        </div>

        {/* Step indicator */}
        <div className="mt-5 flex items-center gap-1.5">
          {steps.map((step, index) => {
            const done   = currentStep > step.id;
            const active = currentStep === step.id;
            return (
              <div key={step.id} className="flex items-center flex-1 min-w-0">
                <button
                  onClick={() => { if (step.id < currentStep) setCurrentStep(step.id); }}
                  title={step.name}
                  className={cn(
                    "flex items-center gap-1.5 px-2.5 py-2 rounded-md text-xs font-medium flex-1 min-w-0 transition-colors truncate",
                    active  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : done  ? "bg-neutral-100 text-neutral-600 cursor-pointer hover:bg-neutral-200"
                                    : "bg-white text-neutral-400 border border-neutral-100 cursor-default"
                  )}
                >
                  {done ? (
                    <span className="w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center shrink-0">
                      <Check className="w-2.5 h-2.5 text-white" />
                    </span>
                  ) : (
                    <span className={cn(
                      "w-4 h-4 rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold",
                      active ? "bg-emerald-500 text-white" : "bg-neutral-200 text-neutral-500"
                    )}>{step.id}</span>
                  )}
                  <span className="truncate hidden lg:inline">{step.name}</span>
                </button>
                {index < steps.length - 1 && (
                  <div className={cn("w-3 h-0.5 shrink-0 mx-0.5", done ? "bg-emerald-300" : "bg-neutral-200")} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Content ── */}
      <div className="p-4 sm:p-6 lg:p-8 flex-1">
        <div className="max-w-3xl mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.22 }}
            >

              {/* ── Step 1: Basic Info ── */}
              {currentStep === 1 && (
                <div className="bg-white rounded-xl border border-neutral-200 p-6 sm:p-8 space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                      Property Name <span className="text-red-500">*</span>
                    </label>
                    <Input value={propertyName} onChange={(e) => setPropertyName(e.target.value)}
                      placeholder="e.g. Tehillah Estate Phase 1" className="bg-white" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                      Property Type <span className="text-red-500">*</span>
                    </label>
                    <select value={propertyType} onChange={(e) => setPropertyType(e.target.value)}
                      className="flex h-10 w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
                      <option value="RESIDENTIAL_LAND">Residential Land</option>
                      <option value="FARM_LAND">Farm Land</option>
                      <option value="COMMERCIAL">Commercial</option>
                      <option value="MIXED_USE">Mixed Use</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1.5">Description</label>
                    <Textarea rows={5} value={description} onChange={(e) => setDescription(e.target.value)}
                      placeholder="Describe your property…" className="bg-white resize-y min-h-[100px]" />
                    <p className="text-xs text-neutral-400 mt-1">Supports Markdown & HTML</p>
                  </div>
                  <div className="p-4 bg-neutral-50 border border-neutral-200 rounded-lg text-sm text-neutral-500">
                    <span className="font-medium text-neutral-700">Total SQMs & Available Units</span> are
                    automatically calculated from the Land Inventory you define in step 6.
                  </div>
                </div>
              )}

              {/* ── Step 2: Gallery ── */}
              {currentStep === 2 && (
                <div className="bg-white rounded-xl border border-neutral-200 p-6 sm:p-8 space-y-6">
                  <input ref={coverRef} type="file" accept="image/*" className="hidden" onChange={handleCoverChange} />
                  <input ref={galleryRef} type="file" accept="image/*" multiple className="hidden" onChange={handleGalleryChange} />

                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                      Cover Image <span className="text-red-500">*</span>
                    </label>
                    <div
                      onClick={() => coverRef.current?.click()}
                      className="border-2 border-dashed border-neutral-300 rounded-lg p-10 text-center hover:border-emerald-500 hover:bg-emerald-50/30 transition-colors cursor-pointer"
                    >
                      {coverPreview ? (
                        <div className="relative inline-block">
                          <img src={coverPreview} alt="Cover preview" className="max-h-48 rounded-md mx-auto object-cover" />
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); setCoverImage(null); setCoverPreview(null); }}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <>
                          <Upload className="w-10 h-10 text-neutral-400 mx-auto mb-3" />
                          <p className="text-sm font-medium text-neutral-700">Click to upload cover image</p>
                          <p className="text-xs text-neutral-400 mt-1">PNG, JPG up to 10 MB</p>
                        </>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                      Gallery Images <span className="text-neutral-400">(Up to 10)</span>
                    </label>
                    <div
                      onClick={() => galleryRef.current?.click()}
                      className="border-2 border-dashed border-neutral-300 rounded-lg p-6 text-center hover:border-emerald-500 hover:bg-emerald-50/30 transition-colors cursor-pointer"
                    >
                      <ImageIcon className="w-8 h-8 text-neutral-400 mx-auto mb-2" />
                      <p className="text-sm text-neutral-600">Click to add gallery images</p>
                      <p className="text-xs text-neutral-400 mt-1">{galleryImages.length}/10 added</p>
                    </div>
                    {galleryImages.length > 0 && (
                      <div className="grid grid-cols-4 gap-3 mt-4">
                        {galleryImages.map((img, i) => (
                          <div key={i} className="relative aspect-square rounded-md overflow-hidden bg-neutral-100">
                            <img src={img.preview} alt="" className="w-full h-full object-cover" />
                            <button
                              onClick={() => setGalleryImages((prev) => prev.filter((_, idx) => idx !== i))}
                              className="absolute top-1 right-1 bg-black/60 text-white rounded-full w-5 h-5 flex items-center justify-center hover:bg-red-600"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ── Step 3: Location ── */}
              {currentStep === 3 && (
                <div className="bg-white rounded-xl border border-neutral-200 p-6 sm:p-8 space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div className="sm:col-span-2">
                      <label className="block text-sm font-medium text-neutral-700 mb-1.5">Street Address</label>
                      <Input value={streetAddress} onChange={(e) => setStreetAddress(e.target.value)}
                        placeholder="Enter address" className="bg-white border-neutral-300 focus-visible:ring-emerald-500/30 focus-visible:border-emerald-400" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                        City <span className="text-red-500">*</span>
                      </label>
                      <Input value={city} onChange={(e) => setCity(e.target.value)} placeholder="e.g. Lagos" className="bg-white" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                        State <span className="text-red-500">*</span>
                      </label>
                      <select value={state} onChange={(e) => setState(e.target.value)}
                        className="flex h-10 w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
                        <option value="">Select state</option>
                        {NIGERIAN_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-1.5">Postal Code</label>
                      <Input value={postalCode} onChange={(e) => setPostalCode(e.target.value)} placeholder="e.g. 101001" className="bg-white" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-1.5">Nearest Landmark</label>
                      <Input value={landmark} onChange={(e) => setLandmark(e.target.value)} placeholder="e.g. Near Shoprite" className="bg-white" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-1.5">Latitude</label>
                      <Input value={latitude} onChange={(e) => setLatitude(e.target.value)} placeholder="e.g. 6.524379" className="bg-white" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-1.5">Longitude</label>
                      <Input value={longitude} onChange={(e) => setLongitude(e.target.value)} placeholder="e.g. 3.379206" className="bg-white" />
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button type="button" onClick={handleUseLocation} disabled={geoLoading}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition-colors disabled:opacity-60">
                      {geoLoading ? (
                        <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                        </svg>
                      ) : <MapPin className="w-4 h-4" />}
                      {geoLoading ? "Detecting…" : "Use Current Location"}
                    </button>
                    {(latitude || longitude) && (
                      <button type="button" onClick={() => { setLatitude(""); setLongitude(""); }}
                        className="px-4 py-2 bg-white border border-neutral-300 text-neutral-500 rounded-md text-sm hover:bg-neutral-50">
                        Clear
                      </button>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1.5">Map Preview</label>
                    {latitude && longitude ? (
                      <div className="h-64 rounded-lg border border-neutral-200 overflow-hidden">
                        <iframe
                          title="Map preview"
                          width="100%" height="100%"
                          style={{ border: 0 }}
                          loading="lazy"
                          src={`https://www.openstreetmap.org/export/embed.html?bbox=${(Number(longitude) - 0.01).toFixed(6)},${(Number(latitude) - 0.01).toFixed(6)},${(Number(longitude) + 0.01).toFixed(6)},${(Number(latitude) + 0.01).toFixed(6)}&layer=mapnik&marker=${latitude},${longitude}`}
                        />
                      </div>
                    ) : (
                      <div className="h-64 bg-neutral-100 rounded-lg flex items-center justify-center border border-neutral-200">
                        <div className="text-center text-neutral-400">
                          <MapPin className="w-10 h-10 mx-auto mb-2 opacity-40" />
                          <p className="text-sm">Use current location or enter coordinates above</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ── Step 4: Amenities ── */}
              {currentStep === 4 && (
                <div className="bg-white rounded-xl border border-neutral-200 p-6 sm:p-8">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="font-semibold text-neutral-900">Property Amenities</h3>
                    <button onClick={openAddAmenity}
                      className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-600 text-white rounded-md text-sm hover:bg-emerald-700">
                      <Plus className="w-4 h-4" /> Add Amenity
                    </button>
                  </div>
                  {amenities.length > 0 ? (
                    <div className="space-y-3">
                      {amenities.map((a) => (
                        <div key={a.id} className="flex items-center justify-between p-4 border border-neutral-200 rounded-lg">
                          <div>
                            <div className="font-medium text-neutral-900">{a.name}</div>
                            <Badge variant="secondary" className="mt-1 text-xs">
                              {AMENITY_STATUSES.find((s) => s.value === a.status)?.label ?? a.status}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-1">
                            <button onClick={() => openEditAmenity(a)} className="p-2 hover:bg-neutral-100 rounded-md transition-colors">
                              <Pencil className="w-4 h-4 text-neutral-500" />
                            </button>
                            <button onClick={() => setAmenities((prev) => prev.filter((x) => x.id !== a.id))}
                              className="p-2 hover:bg-red-50 rounded-md transition-colors">
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Check className="w-10 h-10 text-neutral-300 mx-auto mb-3" />
                      <p className="font-medium text-neutral-700 mb-1">No amenities added yet</p>
                      <p className="text-sm text-neutral-400 mb-5">Add features like fencing, street lights, etc.</p>
                      <button onClick={openAddAmenity}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-md text-sm hover:bg-emerald-700">
                        <Plus className="w-4 h-4" /> Add First Amenity
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* ── Step 5: Documents ── */}
              {currentStep === 5 && (
                <div className="bg-white rounded-xl border border-neutral-200 p-6 sm:p-8">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="font-semibold text-neutral-900">Property Documents</h3>
                    <button onClick={openAddDoc}
                      className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-600 text-white rounded-md text-sm hover:bg-emerald-700">
                      <Plus className="w-4 h-4" /> Add Document
                    </button>
                  </div>
                  {documents.length > 0 ? (
                    <div className="space-y-3">
                      {documents.map((doc) => (
                        <div key={doc.id} className="flex items-center justify-between p-4 border border-neutral-200 rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 bg-emerald-50 rounded-lg flex items-center justify-center">
                              <FileText className="w-4 h-4 text-emerald-600" />
                            </div>
                            <div>
                              <div className="font-medium text-neutral-900">{docDisplayLabel(doc)}</div>
                              <div className="text-xs text-neutral-400">
                                {DOCUMENT_STATUSES.find((s) => s.value === doc.status)?.label ?? doc.status}
                              </div>
                            </div>
                          </div>
                          <button onClick={() => setDocuments((prev) => prev.filter((d) => d.id !== doc.id))}
                            className="p-2 hover:bg-red-50 rounded-md">
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <FileText className="w-10 h-10 text-neutral-300 mx-auto mb-3" />
                      <p className="font-medium text-neutral-700 mb-1">No documents added</p>
                      <p className="text-sm text-neutral-400 mb-5">Upload survey plans, deeds, and other legal documents</p>
                      <button onClick={openAddDoc}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-md text-sm hover:bg-emerald-700">
                        <Plus className="w-4 h-4" /> Add First Document
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* ── Step 6: Land Inventory ── */}
              {currentStep === 6 && (
                <div className="space-y-5">
                  {/* Summary bar */}
                  {landSizes.length > 0 && (
                    <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center justify-between flex-wrap gap-3">
                      <div>
                        <p className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wide">Computed Totals</p>
                        <p className="text-[22px] font-bold text-emerald-900 leading-tight">
                          {fmtSqm(computedTotalSqms)} SQM
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wide">Total Slots</p>
                        <p className="text-[22px] font-bold text-emerald-900 leading-tight">{computedAvailableUnits}</p>
                      </div>
                    </div>
                  )}

                  <div className="bg-white rounded-xl border border-neutral-200 p-6 sm:p-8">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <h3 className="font-semibold text-neutral-900">Land Inventory</h3>
                        <p className="text-xs text-neutral-400 mt-0.5">
                          Define each land size and its total slot count. Total SQMs = Σ(size × slots).
                        </p>
                      </div>
                      <button onClick={openAddLandSize}
                        className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-600 text-white rounded-md text-sm hover:bg-emerald-700 shrink-0">
                        <Plus className="w-4 h-4" /> Add Land Size
                      </button>
                    </div>

                    {landSizes.length > 0 ? (
                      <div className="mt-4 overflow-x-auto">
                        <table className="w-full text-[13px]">
                          <thead>
                            <tr className="border-b border-neutral-100 bg-neutral-50">
                              <th className="text-left px-3 py-2.5 text-[11px] font-bold text-neutral-500 uppercase tracking-wide">Land Size</th>
                              <th className="text-center px-3 py-2.5 text-[11px] font-bold text-neutral-500 uppercase tracking-wide">Slots</th>
                              <th className="text-center px-3 py-2.5 text-[11px] font-bold text-neutral-500 uppercase tracking-wide">Total SQM</th>
                              <th className="text-left px-3 py-2.5 text-[11px] font-bold text-neutral-500 uppercase tracking-wide">Label</th>
                              <th className="px-3 py-2.5" />
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-neutral-50">
                            {landSizes.map((ls) => (
                              <tr key={ls.id} className="hover:bg-neutral-50 transition-colors">
                                <td className="px-3 py-3 font-semibold text-neutral-800">{ls.landSize} SQM</td>
                                <td className="px-3 py-3 text-center text-neutral-600">{ls.totalSlots}</td>
                                <td className="px-3 py-3 text-center font-medium text-emerald-700">
                                  {fmtSqm((Number(ls.landSize) || 0) * (Number(ls.totalSlots) || 0))}
                                </td>
                                <td className="px-3 py-3 text-neutral-400 text-xs">{ls.description || "—"}</td>
                                <td className="px-3 py-3">
                                  <div className="flex items-center justify-end gap-1">
                                    <button onClick={() => openEditLandSize(ls)} className="p-1.5 hover:bg-neutral-100 rounded-md">
                                      <Pencil className="w-3.5 h-3.5 text-neutral-500" />
                                    </button>
                                    <button onClick={() => setLandSizes((prev) => prev.filter((x) => x.id !== ls.id))}
                                      className="p-1.5 hover:bg-red-50 rounded-md">
                                      <Trash2 className="w-3.5 h-3.5 text-red-500" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                          <tfoot>
                            <tr className="border-t-2 border-neutral-200 bg-neutral-50">
                              <td className="px-3 py-2.5 text-[11px] font-bold text-neutral-600 uppercase">Total</td>
                              <td className="px-3 py-2.5 text-center text-[13px] font-bold text-neutral-700">{computedAvailableUnits}</td>
                              <td className="px-3 py-2.5 text-center text-[13px] font-bold text-emerald-700">{fmtSqm(computedTotalSqms)}</td>
                              <td colSpan={2} />
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    ) : (
                      <div className="text-center py-12 mt-2">
                        <Layers className="w-10 h-10 text-neutral-300 mx-auto mb-3" />
                        <p className="font-medium text-neutral-700 mb-1">No land sizes defined</p>
                        <p className="text-sm text-neutral-400 mb-5">
                          e.g. 300 SQM × 30 slots, 500 SQM × 20 slots
                        </p>
                        <button onClick={openAddLandSize}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-md text-sm hover:bg-emerald-700">
                          <Plus className="w-4 h-4" /> Add First Land Size
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ── Step 7: Pricing Plans ── */}
              {currentStep === 7 && (
                <div className="bg-white rounded-xl border border-neutral-200 p-6 sm:p-8">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="font-semibold text-neutral-900">Pricing & Payment Plans</h3>
                      {landSizes.length > 0 && (
                        <p className="text-xs text-neutral-400 mt-0.5">
                          Land sizes from inventory: {landSizes.map((ls) => `${ls.landSize} SQM`).join(" · ")}
                        </p>
                      )}
                    </div>
                    <button onClick={openAddPricing}
                      className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-600 text-white rounded-md text-sm hover:bg-emerald-700">
                      <Plus className="w-4 h-4" /> Add Plan
                    </button>
                  </div>
                  {pricingPlans.length > 0 ? (
                    <div className="space-y-4">
                      {pricingPlans.map((p) => {
                        const monthly = monthlyInstallment(p);
                        return (
                          <div key={p.id} className="p-5 border border-neutral-200 rounded-lg">
                            <div className="flex items-start justify-between mb-3">
                              <div>
                                <div className="flex items-center gap-2">
                                  <h4 className="font-semibold text-neutral-900">{p.name}</h4>
                                  <Badge className={cn("text-xs", p.active ? "bg-emerald-100 text-emerald-700" : "bg-neutral-100 text-neutral-500")}>
                                    {p.active ? "Active" : "Inactive"}
                                  </Badge>
                                </div>
                                <div className="text-sm text-neutral-500 mt-0.5">{p.landSize} sqm · {p.currency}</div>
                              </div>
                              <div className="flex gap-1">
                                <button onClick={() => openEditPricing(p)} className="p-2 hover:bg-neutral-100 rounded-md">
                                  <Pencil className="w-4 h-4 text-neutral-500" />
                                </button>
                                <button onClick={() => setPricingPlans((prev) => prev.filter((x) => x.id !== p.id))}
                                  className="p-2 hover:bg-red-50 rounded-md">
                                  <Trash2 className="w-4 h-4 text-red-500" />
                                </button>
                              </div>
                            </div>
                            <div className="text-2xl font-bold text-neutral-900 mb-2">{fmt(Number(p.totalPrice))}</div>
                            {p.paymentType === "installment" && monthly !== null && (
                              <div className="flex gap-4 text-sm text-neutral-500">
                                <span>Initial: {fmt(Number(p.initialPayment))}</span>
                                <span>Monthly: {fmt(Math.round(monthly))}</span>
                                <span>{p.duration} months</span>
                              </div>
                            )}
                            {p.paymentType === "outright" && (
                              <Badge variant="secondary" className="text-xs">Outright</Badge>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <DollarSign className="w-10 h-10 text-neutral-300 mx-auto mb-3" />
                      <p className="font-medium text-neutral-700 mb-1">No pricing plans yet</p>
                      <p className="text-sm text-neutral-400 mb-5">Set up selling prices and installment options</p>
                      <button onClick={openAddPricing}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-md text-sm hover:bg-emerald-700">
                        <Plus className="w-4 h-4" /> Create Plan
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* ── Step 8: Payment Methods ── */}
              {currentStep === 8 && (
                <div className="bg-white rounded-xl border border-neutral-200 p-6 sm:p-8">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="font-semibold text-neutral-900">Payment Methods</h3>
                    <button onClick={openAddPayment}
                      className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-600 text-white rounded-md text-sm hover:bg-emerald-700">
                      <Plus className="w-4 h-4" /> Add Method
                    </button>
                  </div>
                  {paymentMethods.length > 0 ? (
                    <div className="space-y-3">
                      {paymentMethods.map((m) => (
                        <div key={m.id} className="p-4 border border-neutral-200 rounded-lg">
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-neutral-900">{m.bankName}</span>
                                <Badge className={cn("text-xs", m.active ? "bg-emerald-100 text-emerald-700" : "bg-neutral-100 text-neutral-500")}>
                                  {m.active ? "Active" : "Inactive"}
                                </Badge>
                              </div>
                              <div className="text-sm text-neutral-600 mt-0.5">{m.accountName}</div>
                              <div className="text-sm text-neutral-400">{m.accountNumber}</div>
                            </div>
                            <div className="flex gap-1">
                              <button onClick={() => openEditPayment(m)} className="p-2 hover:bg-neutral-100 rounded-md">
                                <Pencil className="w-4 h-4 text-neutral-500" />
                              </button>
                              <button onClick={() => setPaymentMethods((prev) => prev.filter((x) => x.id !== m.id))}
                                className="p-2 hover:bg-red-50 rounded-md">
                                <Trash2 className="w-4 h-4 text-red-500" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <CreditCard className="w-10 h-10 text-neutral-300 mx-auto mb-3" />
                      <p className="font-medium text-neutral-700 mb-1">No payment methods yet</p>
                      <p className="text-sm text-neutral-400 mb-5">Configure how customers will pay</p>
                      <button onClick={openAddPayment}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-md text-sm hover:bg-emerald-700">
                        <Plus className="w-4 h-4" /> Add Method
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* ── Navigation ── */}
              <div className="flex items-center justify-between mt-6">
                <Button variant="outline" onClick={handleBack}
                  className="inline-flex items-center gap-2 px-6 bg-white text-neutral-700">
                  <ArrowLeft className="w-4 h-4" />
                  {currentStep === 1 ? "Cancel" : "Back"}
                </Button>
                <div className="flex items-center gap-3">
                  {(isEditing || currentStep === steps.length) && (
                    <Button variant="outline" disabled={submitting}
                      onClick={() => handleSubmit("DRAFT")}
                      className="inline-flex items-center gap-2 px-6 bg-white text-neutral-700 border-neutral-300">
                      Save as Draft
                    </Button>
                  )}
                  {isEditing && (
                    <Button disabled={submitting}
                      onClick={() => handleSubmit("PUBLISHED")}
                      className="inline-flex items-center gap-2 px-6 bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-70">
                      {submitting ? (
                        <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</>
                      ) : (
                        <><Check className="w-4 h-4" /> Publish</>
                      )}
                    </Button>
                  )}
                  {!isEditing && (
                    <Button onClick={handleNext} disabled={submitting}
                      className="inline-flex items-center gap-2 px-6 bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-70">
                      {submitting ? (
                        <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</>
                      ) : currentStep === steps.length ? (
                        <><Eye className="w-4 h-4" /> Publish Property</>
                      ) : (
                        <>Save & Continue <ArrowRight className="w-4 h-4" /></>
                      )}
                    </Button>
                  )}
                  {isEditing && currentStep < steps.length && (
                    <Button variant="outline" onClick={handleNext} disabled={submitting}
                      className="inline-flex items-center gap-2 px-4 bg-white text-neutral-700 border-neutral-300">
                      Next <ArrowRight className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* ══ Modals ══════════════════════════════════════════════════════════ */}

      {/* Amenity modal */}
      {showAmenityModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-semibold text-neutral-900">{editingAmenityId ? "Edit Amenity" : "Add Amenity"}</h3>
              <button onClick={() => setShowAmenityModal(false)} className="p-1 hover:bg-neutral-100 rounded-md">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1.5">Amenity Name <span className="text-red-500">*</span></label>
                <input type="text" value={amenityForm.name}
                  onChange={(e) => setAmenityForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Perimeter Fencing"
                  className="w-full px-3 py-2 border border-neutral-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1.5">Status</label>
                <select value={amenityForm.status}
                  onChange={(e) => setAmenityForm((f) => ({ ...f, status: e.target.value }))}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
                  {AMENITY_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <button onClick={() => setShowAmenityModal(false)}
                className="flex-1 px-4 py-2 border border-neutral-300 text-neutral-700 rounded-md text-sm hover:bg-neutral-50">Cancel</button>
              <button onClick={saveAmenity}
                className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-md text-sm hover:bg-emerald-700">
                {editingAmenityId ? "Update" : "Add"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Document modal */}
      {showDocModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-semibold text-neutral-900">Add Document</h3>
              <button onClick={() => setShowDocModal(false)} className="p-1 hover:bg-neutral-100 rounded-md">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1.5">Document Type <span className="text-red-500">*</span></label>
                <select value={docForm.documentType}
                  onChange={(e) => setDocForm((d) => ({ ...d, documentType: e.target.value, customDocName: "" }))}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 transition-colors">
                  {DOCUMENT_TYPES.map((dt) => <option key={dt.value} value={dt.value}>{dt.label}</option>)}
                </select>
                {docForm.documentType === "OTHER" && (
                  <input
                    type="text"
                    value={docForm.customDocName}
                    onChange={(e) => setDocForm((d) => ({ ...d, customDocName: e.target.value }))}
                    placeholder="Enter document name…"
                    className="w-full mt-2 px-3 py-2 border border-neutral-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 transition-colors"
                  />
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1.5">Status</label>
                <select value={docForm.status}
                  onChange={(e) => setDocForm((d) => ({ ...d, status: e.target.value }))}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 transition-colors">
                  {DOCUMENT_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1.5">Notes</label>
                <textarea value={docForm.notes}
                  onChange={(e) => setDocForm((d) => ({ ...d, notes: e.target.value }))}
                  placeholder="Additional notes about this document…"
                  rows={3}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 transition-colors resize-y"
                />
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <button onClick={() => setShowDocModal(false)}
                className="flex-1 px-4 py-2 border border-neutral-300 text-neutral-700 rounded-md text-sm hover:bg-neutral-50">Cancel</button>
              <button onClick={saveDoc}
                className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-md text-sm hover:bg-emerald-700">Add Document</button>
            </div>
          </div>
        </div>
      )}

      {/* Land Size modal */}
      {showLandSizeModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-sm w-full p-6 shadow-xl">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-semibold text-neutral-900">{editingLandSizeId ? "Edit Land Size" : "Add Land Size"}</h3>
              <button onClick={() => setShowLandSizeModal(false)} className="p-1 hover:bg-neutral-100 rounded-md">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1.5">Land Size (SQM) <span className="text-red-500">*</span></label>
                  <input type="number" value={landSizeForm.landSize}
                    onChange={(e) => setLandSizeForm((f) => ({ ...f, landSize: e.target.value }))}
                    placeholder="e.g. 300"
                    className="w-full px-3 py-2 border border-neutral-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1.5">Total Slots <span className="text-red-500">*</span></label>
                  <input type="number" value={landSizeForm.totalSlots}
                    onChange={(e) => setLandSizeForm((f) => ({ ...f, totalSlots: e.target.value }))}
                    placeholder="e.g. 30"
                    className="w-full px-3 py-2 border border-neutral-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>
              {landSizeForm.landSize && landSizeForm.totalSlots && (
                <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200 text-sm">
                  <span className="text-emerald-700 font-medium">
                    {fmtSqm((Number(landSizeForm.landSize) || 0) * (Number(landSizeForm.totalSlots) || 0))} SQM total
                  </span>
                  <span className="text-neutral-500 ml-1.5">
                    ({landSizeForm.landSize} × {landSizeForm.totalSlots} slots)
                  </span>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1.5">Label <span className="text-neutral-400 text-xs">(optional)</span></label>
                <input type="text" value={landSizeForm.description}
                  onChange={(e) => setLandSizeForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="e.g. Half Plot"
                  className="w-full px-3 py-2 border border-neutral-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <button onClick={() => setShowLandSizeModal(false)}
                className="flex-1 px-4 py-2 border border-neutral-300 text-neutral-700 rounded-md text-sm hover:bg-neutral-50">Cancel</button>
              <button onClick={saveLandSize}
                className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-md text-sm hover:bg-emerald-700">
                {editingLandSizeId ? "Update" : "Add"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pricing modal */}
      {showPricingModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-xl my-8">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-semibold text-neutral-900">{editingPlanId ? "Edit Pricing Plan" : "Create Pricing Plan"}</h3>
              <button onClick={() => setShowPricingModal(false)} className="p-1 hover:bg-neutral-100 rounded-md">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1.5">Plan Name <span className="text-red-500">*</span></label>
                <input type="text" value={pricingForm.name}
                  onChange={(e) => setPricingForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Pre-launch Price"
                  className="w-full px-3 py-2 border border-neutral-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1.5">Land Size (SQM) <span className="text-red-500">*</span></label>
                  {landSizes.length > 0 ? (
                    <select value={pricingForm.landSize}
                      onChange={(e) => setPricingForm((f) => ({ ...f, landSize: e.target.value }))}
                      className="w-full px-3 py-2 border border-neutral-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
                      <option value="">— Select —</option>
                      {landSizes.map((ls) => (
                        <option key={ls.id} value={ls.landSize}>
                          {ls.landSize} SQM{ls.description ? ` (${ls.description})` : ""}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input type="number" value={pricingForm.landSize}
                      onChange={(e) => setPricingForm((f) => ({ ...f, landSize: e.target.value }))}
                      placeholder="e.g. 300"
                      className="w-full px-3 py-2 border border-neutral-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1.5">Currency</label>
                  <select value={pricingForm.currency}
                    onChange={(e) => setPricingForm((f) => ({ ...f, currency: e.target.value }))}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
                    <option value="NGN">NGN (₦)</option>
                    <option value="USD">USD ($)</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1.5">Total Price (₦) <span className="text-red-500">*</span></label>
                <input type="number" value={pricingForm.totalPrice}
                  onChange={(e) => setPricingForm((f) => ({ ...f, totalPrice: e.target.value }))}
                  placeholder="e.g. 1500000"
                  className="w-full px-3 py-2 border border-neutral-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1.5">Payment Type</label>
                <div className="flex gap-4">
                  {(["outright", "installment"] as const).map((t) => (
                    <label key={t} className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" value={t} checked={pricingForm.paymentType === t}
                        onChange={() => setPricingForm((f) => ({ ...f, paymentType: t }))}
                        className="accent-emerald-600"
                      />
                      <span className="text-sm capitalize">{t}</span>
                    </label>
                  ))}
                </div>
              </div>
              {pricingForm.paymentType === "installment" && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-1.5">Initial Payment (₦)</label>
                      <input type="number" value={pricingForm.initialPayment}
                        onChange={(e) => setPricingForm((f) => ({ ...f, initialPayment: e.target.value }))}
                        placeholder="e.g. 250000"
                        className="w-full px-3 py-2 border border-neutral-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-1.5">Duration (months)</label>
                      <input type="number" value={pricingForm.duration}
                        onChange={(e) => setPricingForm((f) => ({ ...f, duration: e.target.value }))}
                        placeholder="e.g. 12"
                        className="w-full px-3 py-2 border border-neutral-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1.5">Payment Spread Method</label>
                    <div className="space-y-2">
                      <label className="flex items-start gap-2 cursor-pointer p-3 border border-neutral-200 rounded-md hover:bg-neutral-50">
                        <input type="radio" value="separate" checked={pricingForm.spreadMethod === "separate"}
                          onChange={() => setPricingForm((f) => ({ ...f, spreadMethod: "separate" }))}
                          className="mt-0.5 accent-emerald-600"
                        />
                        <div>
                          <div className="text-sm font-medium">Initial Payment Separate</div>
                          <div className="text-xs text-neutral-400">Initial is upfront; monthly = (Total − Initial) ÷ Duration</div>
                        </div>
                      </label>
                      <label className="flex items-start gap-2 cursor-pointer p-3 border border-neutral-200 rounded-md hover:bg-neutral-50">
                        <input type="radio" value="first_month" checked={pricingForm.spreadMethod === "first_month"}
                          onChange={() => setPricingForm((f) => ({ ...f, spreadMethod: "first_month" }))}
                          className="mt-0.5 accent-emerald-600"
                        />
                        <div>
                          <div className="text-sm font-medium">Initial as First Month</div>
                          <div className="text-xs text-neutral-400">Initial counts as month 1; monthly = (Total − Initial) ÷ (Duration − 1)</div>
                        </div>
                      </label>
                    </div>
                  </div>
                  {pricingForm.totalPrice && pricingForm.duration && (
                    <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-200 text-sm space-y-1">
                      <div className="font-medium text-emerald-800 mb-2">Summary</div>
                      <div className="flex justify-between text-neutral-700">
                        <span>Total Price</span>
                        <span className="font-medium">{fmt(Number(pricingForm.totalPrice))}</span>
                      </div>
                      <div className="flex justify-between text-neutral-700">
                        <span>Initial Payment</span>
                        <span className="font-medium">{fmt(Number(pricingForm.initialPayment) || 0)}</span>
                      </div>
                      <div className="flex justify-between text-neutral-700">
                        <span>Monthly Installment</span>
                        <span className="font-medium">{fmt(Math.round(monthlyInstallment(pricingForm) ?? 0))}</span>
                      </div>
                      <div className="flex justify-between text-neutral-700">
                        <span>Duration</span>
                        <span className="font-medium">{pricingForm.duration} months</span>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
            <div className="flex gap-2 mt-6">
              <button onClick={() => setShowPricingModal(false)}
                className="flex-1 px-4 py-2 border border-neutral-300 text-neutral-700 rounded-md text-sm hover:bg-neutral-50">Cancel</button>
              <button onClick={savePricing}
                className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-md text-sm hover:bg-emerald-700">
                {editingPlanId ? "Update Plan" : "Create Plan"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment method modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="font-semibold text-neutral-900">{editingPaymentId ? "Edit Payment Method" : "Add Payment Method"}</h3>
                <p className="text-xs text-neutral-400 mt-0.5">Account name is auto-verified — do not type it manually.</p>
              </div>
              <button onClick={() => setShowPaymentModal(false)} className="p-1 hover:bg-neutral-100 rounded-md">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1.5">Bank <span className="text-red-500">*</span></label>
                <select value={paymentForm.bankCode}
                  onChange={(e) => {
                    const bank = NIGERIAN_BANKS.find((b) => b.code === e.target.value);
                    setPaymentForm((f) => ({ ...f, bankCode: e.target.value, bankName: bank?.name ?? "", accountName: "" }));
                    setVerifyError("");
                  }}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 transition-colors">
                  <option value="">— Select a bank —</option>
                  {NIGERIAN_BANKS.map((b) => <option key={b.code} value={b.code}>{b.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1.5">Account Number <span className="text-red-500">*</span></label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={paymentForm.accountNumber}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, "");
                      setPaymentForm((f) => ({ ...f, accountNumber: val, accountName: "" }));
                      setVerifyError("");
                    }}
                    placeholder="10-digit account number"
                    maxLength={10}
                    className="flex-1 px-3 py-2 border border-neutral-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 transition-colors"
                  />
                  <button type="button" onClick={handleVerifyAccount}
                    disabled={verifyingAccount || paymentForm.accountNumber.length !== 10 || !paymentForm.bankCode}
                    className="px-3 py-2 bg-emerald-600 text-white rounded-md text-sm hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1.5 shrink-0">
                    {verifyingAccount ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                    {verifyingAccount ? "Checking…" : "Verify"}
                  </button>
                </div>
                {paymentForm.accountNumber && paymentForm.accountNumber.length < 10 && (
                  <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> Must be exactly 10 digits
                  </p>
                )}
                {verifyError && (
                  <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> {verifyError}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                  Account Name <span className="text-neutral-400 text-xs">(auto-verified)</span>
                </label>
                <div className={`w-full px-3 py-2 border rounded-md text-sm min-h-[38px] flex items-center ${
                  paymentForm.accountName
                    ? "border-emerald-300 bg-emerald-50 text-emerald-800 font-medium"
                    : "border-neutral-200 bg-neutral-50 text-neutral-400"
                }`}>
                  {paymentForm.accountName || "Will appear after verification"}
                </div>
                {paymentForm.accountName && (
                  <p className="text-xs text-emerald-600 mt-1 flex items-center gap-1">
                    <span className="w-3 h-3 rounded-full bg-emerald-500 flex items-center justify-center text-white text-[8px] font-bold">✓</span>
                    Account verified
                  </p>
                )}
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <button onClick={() => setShowPaymentModal(false)}
                className="flex-1 px-4 py-2 border border-neutral-300 text-neutral-700 rounded-md text-sm hover:bg-neutral-50">Cancel</button>
              <button onClick={savePayment} disabled={!paymentForm.accountName}
                className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-md text-sm hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                {editingPaymentId ? "Update" : "Add Method"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

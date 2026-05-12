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
  { id: 9, name: "Preview",          icon: Eye        },
];

// ─── Types ───────────────────────────────────────────────────────────────────
interface Amenity { id: string; name: string; status: string; description: string; }
interface Doc {
  id: string; documentType: string; customDocName: string;
  status: string; notes: string; file: File | null; fileName: string;
}
interface LandSizeEntry { id: string; landSize: string; totalSlots: string; description: string; }

const DOCUMENT_TYPES = [
  { value: "PROVISIONAL_SURVEY",  label: "Provisional Survey" },
  { value: "REGISTERED_SURVEY",   label: "Registered Survey" },
  { value: "SURVEY_PLAN",         label: "Survey Plan" },
  { value: "C_OF_O",              label: "Certificate of Occupancy (CofO)" },
  { value: "ALLOCATION_LETTER",   label: "Allocation Letter" },
  { value: "CONTRACT_OF_SALES",   label: "Contract of Sales" },
  { value: "LAND_RECEIPT",        label: "Land Receipt" },
  { value: "DEED_OF_ASSIGNMENT",  label: "Deed of Assignment" },
  { value: "GOVERNORS_CONSENT",   label: "Governor's Consent" },
  { value: "EXCISION",            label: "Excision" },
  { value: "OTHER",               label: "Other" },
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

interface StatutoryFee { id: string; name: string; amount: string; note: string; }
interface PricingPlan {
  id: string; name: string; landSize: string; currency: string;
  basePrice: string; totalPrice: string;
  paymentType: "outright" | "installment";
  initialPayment: string; duration: string; spreadMethod: "separate" | "first_month";
  active: boolean; statutoryFees: StatutoryFee[];
}
interface PaymentMethod { id: string; bankName: string; bankCode: string; accountName: string; accountNumber: string; active: boolean; }

// Bank list is fetched live from Paystack via the backend — see useEffect below.
// This fallback is used only if the API call fails on first mount.
const FALLBACK_BANKS = [
  { name: "Access Bank",             code: "044" },
  { name: "Ecobank Nigeria",         code: "050" },
  { name: "Fidelity Bank",           code: "070" },
  { name: "First Bank of Nigeria",   code: "011" },
  { name: "First City Monument Bank",code: "214" },
  { name: "Guaranty Trust Bank",     code: "058" },
  { name: "Keystone Bank",           code: "082" },
  { name: "Polaris Bank",            code: "076" },
  { name: "Stanbic IBTC Bank",       code: "221" },
  { name: "Sterling Bank",           code: "232" },
  { name: "Union Bank of Nigeria",   code: "032" },
  { name: "United Bank for Africa",  code: "033" },
  { name: "Unity Bank",              code: "215" },
  { name: "Wema Bank",               code: "035" },
  { name: "Zenith Bank",             code: "057" },
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
const fmt = (n: number, sym = "₦") => `${sym}${n.toLocaleString("en-NG")}`;
const fmtSqm = (n: number) => n.toLocaleString("en-NG");

export function PropertyWizard() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = !!id;
  usePageTitle(isEditing ? "Edit Property" : "Create Property");

  // ── Step ──────────────────────────────────────────────────────────────────
  const [currentStep, setCurrentStep] = useState(1);

  // ── Step 1 state ─────────────────────────────────────────────────────────
  const [propertyName, setPropertyName]               = useState("");
  const [propertyType, setPropertyType]               = useState("RESIDENTIAL_LAND");
  const [estateLandTitle, setEstateLandTitle]         = useState("");
  const [description, setDescription]                 = useState("");
  const [brochureFile, setBrochureFile]               = useState<File | null>(null);
  const [brochureExistingUrl, setBrochureExistingUrl] = useState<string | null>(null);
  const brochureRef = useRef<HTMLInputElement>(null);

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
  const [pricingForm, setPricingForm]           = useState<Omit<PricingPlan, "id" | "active" | "statutoryFees" | "totalPrice">>({
    name: "", landSize: "", currency: "NGN", basePrice: "",
    paymentType: "outright", initialPayment: "", duration: "", spreadMethod: "separate",
  });
  const [pricingFees, setPricingFees]           = useState<StatutoryFee[]>([]);

  // ── Step 8 state — Payment Methods ───────────────────────────────────────
  const [paymentMethods, setPaymentMethods]     = useState<PaymentMethod[]>([]);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [editingPaymentId, setEditingPaymentId] = useState<string | null>(null);
  const [paymentForm, setPaymentForm]           = useState({ bankName: "", bankCode: "", accountName: "", accountNumber: "" });
  const [verifyingAccount, setVerifyingAccount] = useState(false);
  const [verifyError, setVerifyError]           = useState("");
  const [verifyFailed, setVerifyFailed]         = useState(false); // true → show manual name input
  // Bank list — fetched live from Paystack on mount
  const [banks, setBanks]       = useState<{ name: string; code: string }[]>(FALLBACK_BANKS);
  const [banksLoading, setBanksLoading] = useState(false);

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

  // ── Fetch live bank list from Paystack (via backend) ─────────────────────
  useEffect(() => {
    setBanksLoading(true);
    api.banking.listBanks()
      .then((res) => { if (res.banks?.length) setBanks(res.banks); })
      .catch(() => { /* keep FALLBACK_BANKS on error */ })
      .finally(() => setBanksLoading(false));
  }, []);

  // ── Load property data for editing ───────────────────────────────────────
  useEffect(() => {
    if (!isEditing || !id) return;
    api.properties.get(id).then((prop: any) => {
      setPropertyName(prop.name ?? "");
      setPropertyType(prop.property_type ?? "RESIDENTIAL_LAND");
      setEstateLandTitle(prop.estate_land_title ?? "");
      setDescription(prop.description ?? "");
      if (prop.brochure) setBrochureExistingUrl(prop.brochure);
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
          currency: "NGN",
          basePrice: (p.base_price ?? p.total_price)?.toString() ?? "",
          totalPrice: p.total_price?.toString() ?? "",
          paymentType: p.payment_type === "OUTRIGHT" ? "outright" : "installment",
          initialPayment: p.initial_payment?.toString() ?? "",
          duration: p.duration_months?.toString() ?? "12",
          spreadMethod: p.payment_spread_method === "INITIAL_SEPARATE" ? "separate" : "first_month",
          active: true,
          statutoryFees: (p.statutory_fees ?? []).map((f: any) => ({
            id: f.id ?? String(Date.now() + Math.random()),
            name: f.name ?? "", amount: f.amount?.toString() ?? "", note: f.note ?? "",
          })),
        })));
      }
      if (prop.bank_accounts?.length) {
        setPaymentMethods(prop.bank_accounts.map((b: any) => ({
          id: b.id, bankName: b.bank_name, bankCode: "",
          accountName: b.account_name, accountNumber: b.account_number, active: b.is_active ?? true,
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
      name: "", landSize: landSizes[0]?.landSize ?? "", currency: "NGN", basePrice: "",
      paymentType: "outright", initialPayment: "", duration: "", spreadMethod: "separate",
    });
    setPricingFees([]);
    setShowPricingModal(true);
  };
  const openEditPricing = (p: PricingPlan) => {
    setEditingPlanId(p.id);
    setPricingForm({ name: p.name, landSize: p.landSize, currency: p.currency, basePrice: p.basePrice || p.totalPrice, paymentType: p.paymentType, initialPayment: p.initialPayment, duration: p.duration, spreadMethod: p.spreadMethod });
    setPricingFees(p.statutoryFees ?? []);
    setShowPricingModal(true);
  };
  const savePricing = () => {
    if (!pricingForm.name.trim() || !pricingForm.basePrice) {
      toast.error("Plan name and base price are required.");
      return;
    }
    const totalPrice = (Number(pricingForm.basePrice) + pricingFees.reduce((sum, f) => sum + (Number(f.amount) || 0), 0)).toString();
    if (editingPlanId) {
      setPricingPlans((prev) => prev.map((p) => p.id === editingPlanId ? { ...p, ...pricingForm, totalPrice, statutoryFees: pricingFees } : p));
      toast.success("Pricing plan updated.");
    } else {
      setPricingPlans((prev) => [...prev, { id: Date.now().toString(), active: true, ...pricingForm, totalPrice, statutoryFees: pricingFees }]);
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
    setVerifyFailed(false);
    try {
      const res = await api.banking.verifyAccount(paymentForm.accountNumber, paymentForm.bankCode);
      setPaymentForm((f) => ({ ...f, accountName: res.account_name }));
      setVerifyFailed(false);
    } catch (err: any) {
      // Some banks (Opay, Palmpay, Kuda, etc.) don't support NUBAN lookup via Paystack.
      // In that case, let the user type the account name manually.
      setVerifyFailed(true);
      setVerifyError(
        "Auto-verification unavailable for this bank. Enter the account name manually below."
      );
      setPaymentForm((f) => ({ ...f, accountName: "" }));
    } finally {
      setVerifyingAccount(false);
    }
  };
  const savePayment = () => {
    if (!paymentForm.bankName.trim()) {
      toast.error("Please select a bank.");
      return;
    }
    if (paymentForm.accountNumber.length < 10) {
      toast.error("Please enter a valid 10-digit account number.");
      return;
    }
    if (!paymentForm.accountName.trim()) {
      toast.error("Account name is required. Verify the account or enter the name manually.");
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
    setVerifyFailed(false);
  };

  // ── Submit to API ─────────────────────────────────────────────────────────
  const handleSubmit = async (overrideStatus?: string) => {
    setSubmitting(true);
    try {
      const payload: any = {
        name: propertyName,
        property_type: propertyType,
        estate_land_title: estateLandTitle || "",
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
          // Include id only for real UUIDs (not Date.now() fake IDs)
          ...(p.id && p.id.includes("-") ? { id: p.id } : {}),
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
          is_active: m.active,
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

      if (brochureFile && propertyId) {
        try {
          await api.properties.uploadBrochure(propertyId, brochureFile);
        } catch {
          toast.error("Property saved, but brochure upload failed.");
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
                  onClick={() => { if (isEditing || step.id <= currentStep) setCurrentStep(step.id); }}
                  title={isEditing ? `Jump to ${step.name}` : step.name}
                  disabled={!isEditing && step.id > currentStep}
                  className={cn(
                    "flex items-center gap-1.5 px-2.5 py-2 rounded-md text-xs font-medium flex-1 min-w-0 transition-colors truncate",
                    active  ? "bg-[#0E2C72]/6 text-[#0E2C72] border border-[#8aaad8] cursor-pointer"
                            : (done || isEditing) ? "bg-neutral-100 text-neutral-600 cursor-pointer hover:bg-neutral-200"
                                    : "bg-white text-neutral-300 border border-neutral-100 cursor-not-allowed"
                  )}
                >
                  {done ? (
                    <span className="w-4 h-4 rounded-full bg-[#1a3d8f] flex items-center justify-center shrink-0">
                      <Check className="w-2.5 h-2.5 text-white" />
                    </span>
                  ) : (
                    <span className={cn(
                      "w-4 h-4 rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold",
                      active ? "bg-[#1a3d8f] text-white" : "bg-neutral-200 text-neutral-500"
                    )}>{step.id}</span>
                  )}
                  <span className="truncate hidden lg:inline">{step.name}</span>
                </button>
                {index < steps.length - 1 && (
                  <div className={cn("w-3 h-0.5 shrink-0 mx-0.5", done ? "bg-[#4a6fc0]" : "bg-neutral-200")} />
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
                  <input ref={brochureRef} type="file" accept=".pdf,application/pdf" className="hidden"
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) { setBrochureFile(f); setBrochureExistingUrl(null); } }} />
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                      Property Name <span className="text-red-500">*</span>
                    </label>
                    <Input value={propertyName} onChange={(e) => setPropertyName(e.target.value)}
                      placeholder="e.g. Tehillah Estate Phase 1" className="bg-white" />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                        Property Type <span className="text-red-500">*</span>
                      </label>
                      <select value={propertyType} onChange={(e) => setPropertyType(e.target.value)}
                        className="flex h-10 w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a3d8f]">
                        <option value="RESIDENTIAL_LAND">Residential Land</option>
                        <option value="FARM_LAND">Farm Land</option>
                        <option value="COMMERCIAL">Commercial Land</option>
                        <option value="MIXED_USE">Mixed Use</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                        Estate Land Title <span className="text-neutral-400 text-xs font-normal">(optional)</span>
                      </label>
                      <Input value={estateLandTitle} onChange={(e) => setEstateLandTitle(e.target.value)}
                        placeholder="e.g. C of O No. 12345" className="bg-white" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1.5">Description</label>
                    <Textarea rows={5} value={description} onChange={(e) => setDescription(e.target.value)}
                      placeholder="Describe your property…" className="bg-white resize-y min-h-[100px]" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                      Brochure <span className="text-neutral-400 text-xs font-normal">(PDF, optional)</span>
                    </label>
                    {brochureFile || brochureExistingUrl ? (
                      <div className="flex items-center gap-3 p-3 border border-neutral-200 rounded-lg bg-neutral-50">
                        <FileText className="w-5 h-5 text-red-500 shrink-0" />
                        <span className="text-sm text-neutral-700 flex-1 truncate">
                          {brochureFile ? brochureFile.name : "Existing brochure"}
                        </span>
                        <div className="flex items-center gap-2 shrink-0">
                          {brochureExistingUrl && !brochureFile && (
                            <a href={brochureExistingUrl} target="_blank" rel="noopener noreferrer"
                              className="text-xs text-[#0E2C72] hover:underline">View</a>
                          )}
                          <button type="button"
                            onClick={() => { setBrochureFile(null); setBrochureExistingUrl(null); if (brochureRef.current) brochureRef.current.value = ""; }}
                            className="p-1 hover:bg-neutral-200 rounded transition-colors">
                            <X className="w-3.5 h-3.5 text-neutral-500" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div onClick={() => brochureRef.current?.click()}
                        className="border-2 border-dashed border-neutral-300 rounded-lg p-5 text-center hover:border-[#1a3d8f] hover:bg-[#eef2fb]/30 transition-colors cursor-pointer">
                        <Upload className="w-7 h-7 text-neutral-400 mx-auto mb-2" />
                        <p className="text-sm text-neutral-600">Click to upload PDF brochure</p>
                        <p className="text-xs text-neutral-400 mt-0.5">PDF up to 20 MB</p>
                      </div>
                    )}
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
                      className="border-2 border-dashed border-neutral-300 rounded-lg p-10 text-center hover:border-[#0E2C72] hover:bg-[#0E2C72]/6/30 transition-colors cursor-pointer"
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
                      className="border-2 border-dashed border-neutral-300 rounded-lg p-6 text-center hover:border-[#0E2C72] hover:bg-[#0E2C72]/6/30 transition-colors cursor-pointer"
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
                        placeholder="Enter address" className="bg-white border-neutral-300 focus-visible:ring-[#1a3d8f]/30 focus-visible:border-[#2a52a8]" />
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
                        className="flex h-10 w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a3d8f]">
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
                      className="inline-flex items-center gap-2 px-4 py-2 bg-[#0E2C72] text-white rounded-md hover:bg-[#0a2260] transition-colors disabled:opacity-60">
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
                      className="inline-flex items-center gap-1.5 px-3 py-2 bg-[#0E2C72] text-white rounded-md text-sm hover:bg-[#0a2260]">
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
                        className="inline-flex items-center gap-2 px-4 py-2 bg-[#0E2C72] text-white rounded-md text-sm hover:bg-[#0a2260]">
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
                      className="inline-flex items-center gap-1.5 px-3 py-2 bg-[#0E2C72] text-white rounded-md text-sm hover:bg-[#0a2260]">
                      <Plus className="w-4 h-4" /> Add Document
                    </button>
                  </div>
                  {documents.length > 0 ? (
                    <div className="space-y-3">
                      {documents.map((doc) => (
                        <div key={doc.id} className="flex items-center justify-between p-4 border border-neutral-200 rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 bg-[#0E2C72]/6 rounded-lg flex items-center justify-center">
                              <FileText className="w-4 h-4 text-[#0E2C72]" />
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
                        className="inline-flex items-center gap-2 px-4 py-2 bg-[#0E2C72] text-white rounded-md text-sm hover:bg-[#0a2260]">
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
                    <div className="bg-[#0E2C72]/6 border border-[#8aaad8] rounded-xl p-4 flex items-center justify-between flex-wrap gap-3">
                      <div>
                        <p className="text-[11px] font-semibold text-[#0E2C72] uppercase tracking-wide">Computed Totals</p>
                        <p className="text-[22px] font-bold text-[#071a45] leading-tight">
                          {fmtSqm(computedTotalSqms)} SQM
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-[11px] font-semibold text-[#0E2C72] uppercase tracking-wide">Total Slots</p>
                        <p className="text-[22px] font-bold text-[#071a45] leading-tight">{computedAvailableUnits}</p>
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
                        className="inline-flex items-center gap-1.5 px-3 py-2 bg-[#0E2C72] text-white rounded-md text-sm hover:bg-[#0a2260] shrink-0">
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
                                <td className="px-3 py-3 text-center font-medium text-[#0E2C72]">
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
                              <td className="px-3 py-2.5 text-center text-[13px] font-bold text-[#0E2C72]">{fmtSqm(computedTotalSqms)}</td>
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
                          className="inline-flex items-center gap-2 px-4 py-2 bg-[#0E2C72] text-white rounded-md text-sm hover:bg-[#0a2260]">
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
                      className="inline-flex items-center gap-1.5 px-3 py-2 bg-[#0E2C72] text-white rounded-md text-sm hover:bg-[#0a2260]">
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
                                  <Badge className={cn("text-xs", p.active ? "bg-[#d6e0f5] text-[#0E2C72]" : "bg-neutral-100 text-neutral-500")}>
                                    {p.active ? "Active" : "Inactive"}
                                  </Badge>
                                </div>
                                <div className="text-sm text-neutral-500 mt-0.5">{p.paymentType === "outright" ? "Outright" : "Installment"}</div>
                              </div>
                              <div className="flex gap-1">
                                <button
                                  onClick={() => setPricingPlans((prev) => prev.map((x) => x.id === p.id ? { ...x, active: !x.active } : x))}
                                  title={p.active ? "Set Inactive" : "Set Active"}
                                  className={`p-2 rounded-md transition-colors ${p.active ? "hover:bg-amber-50 text-[#0E2C72]" : "hover:bg-[#0E2C72]/6 text-neutral-400"}`}
                                >
                                  <div className={`w-8 h-4 rounded-full flex items-center transition-colors ${p.active ? "bg-[#1a3d8f]" : "bg-neutral-300"}`}>
                                    <div className={`w-3 h-3 rounded-full bg-white shadow mx-0.5 transition-transform ${p.active ? "translate-x-4" : "translate-x-0"}`} />
                                  </div>
                                </button>
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
                                <span>{p.landSize} SQM</span>
                                <span>Initial: {fmt(Number(p.initialPayment))}</span>
                                <span>Monthly: {fmt(Math.round(monthly))}</span>
                                <span>{p.duration} months</span>
                              </div>
                            )}
                            {p.paymentType === "outright" && (
                              <div className="flex gap-3 text-sm text-neutral-500">
                                <span>{p.landSize} SQM</span>
                                <Badge variant="secondary" className="text-xs">Outright</Badge>
                              </div>
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
                        className="inline-flex items-center gap-2 px-4 py-2 bg-[#0E2C72] text-white rounded-md text-sm hover:bg-[#0a2260]">
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
                      className="inline-flex items-center gap-1.5 px-3 py-2 bg-[#0E2C72] text-white rounded-md text-sm hover:bg-[#0a2260]">
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
                                <Badge className={cn("text-xs", m.active ? "bg-[#d6e0f5] text-[#0E2C72]" : "bg-neutral-100 text-neutral-500")}>
                                  {m.active ? "Active" : "Inactive"}
                                </Badge>
                              </div>
                              <div className="text-sm text-neutral-600 mt-0.5">{m.accountName}</div>
                              <div className="text-sm text-neutral-400">{m.accountNumber}</div>
                            </div>
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => setPaymentMethods((prev) => prev.map((x) => x.id === m.id ? { ...x, active: !x.active } : x))}
                                title={m.active ? "Set Inactive" : "Set Active"}
                                className={`p-2 rounded-md transition-colors ${m.active ? "hover:bg-amber-50 text-[#0E2C72]" : "hover:bg-[#0E2C72]/6 text-neutral-400"}`}
                              >
                                <div className={`w-8 h-4 rounded-full flex items-center transition-colors ${m.active ? "bg-[#1a3d8f]" : "bg-neutral-300"}`}>
                                  <div className={`w-3 h-3 rounded-full bg-white shadow mx-0.5 transition-transform ${m.active ? "translate-x-4" : "translate-x-0"}`} />
                                </div>
                              </button>
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
                        className="inline-flex items-center gap-2 px-4 py-2 bg-[#0E2C72] text-white rounded-md text-sm hover:bg-[#0a2260]">
                        <Plus className="w-4 h-4" /> Add Method
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* ── Step 9: Preview ── */}
              {currentStep === 9 && (
                <div className="space-y-4">
                  <div className="bg-white rounded-xl border border-neutral-200 p-6 sm:p-8">
                    <h3 className="font-semibold text-neutral-900 mb-5 text-lg">Property Summary</h3>
                    <div className="space-y-5">
                      {/* Basic */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <div className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wide mb-1">Property Name</div>
                          <div className="text-[14px] font-semibold text-neutral-900">{propertyName || "—"}</div>
                        </div>
                        <div>
                          <div className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wide mb-1">Type</div>
                          <div className="text-[14px] font-semibold text-neutral-900 capitalize">{propertyType.replace(/_/g, " ").toLowerCase()}</div>
                        </div>
                        <div className="sm:col-span-2">
                          <div className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wide mb-1">Location</div>
                          <div className="text-[13px] text-neutral-700">{[streetAddress, city, state].filter(Boolean).join(", ") || "—"}</div>
                        </div>
                        {description && (
                          <div className="sm:col-span-2">
                            <div className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wide mb-1">Description</div>
                            <div className="text-[13px] text-neutral-600 line-clamp-3">{description}</div>
                          </div>
                        )}
                      </div>
                      <div className="border-t border-neutral-100" />
                      {/* Stats grid */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <div className="p-3 bg-neutral-50 rounded-lg text-center">
                          <div className="text-[22px] font-bold text-neutral-900">{landSizes.length}</div>
                          <div className="text-[11px] text-neutral-500 mt-0.5">Land Sizes</div>
                        </div>
                        <div className="p-3 bg-neutral-50 rounded-lg text-center">
                          <div className="text-[22px] font-bold text-neutral-900">{computedAvailableUnits}</div>
                          <div className="text-[11px] text-neutral-500 mt-0.5">Total Slots</div>
                        </div>
                        <div className="p-3 bg-neutral-50 rounded-lg text-center">
                          <div className="text-[22px] font-bold text-neutral-900">{pricingPlans.length}</div>
                          <div className="text-[11px] text-neutral-500 mt-0.5">Pricing Plans</div>
                        </div>
                        <div className="p-3 bg-neutral-50 rounded-lg text-center">
                          <div className="text-[22px] font-bold text-neutral-900">{amenities.length}</div>
                          <div className="text-[11px] text-neutral-500 mt-0.5">Amenities</div>
                        </div>
                      </div>
                      {/* Land sizes */}
                      {landSizes.length > 0 && (
                        <>
                          <div className="border-t border-neutral-100" />
                          <div>
                            <div className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wide mb-2">Land Inventory</div>
                            <div className="flex flex-wrap gap-2">
                              {landSizes.map((ls) => (
                                <span key={ls.id} className="px-2.5 py-1 bg-[#0E2C72]/6 text-[#0E2C72] rounded-lg text-[12px] font-medium border border-[#0E2C72]/15">
                                  {ls.landSize} SQM × {ls.totalSlots} slots
                                </span>
                              ))}
                            </div>
                          </div>
                        </>
                      )}
                      {/* Pricing */}
                      {pricingPlans.length > 0 && (
                        <>
                          <div className="border-t border-neutral-100" />
                          <div>
                            <div className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wide mb-2">Pricing Plans</div>
                            <div className="space-y-2">
                              {pricingPlans.map((p) => (
                                <div key={p.id} className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg">
                                  <div>
                                    <div className="text-[13px] font-semibold text-neutral-900">{p.name}</div>
                                    <div className="text-[11px] text-neutral-500">{p.landSize} SQM · {p.paymentType}</div>
                                  </div>
                                  <div className="text-right">
                                    <div className="text-[14px] font-bold text-[#0E2C72]">{fmt(Number(p.totalPrice))}</div>
                                    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${p.active ? "bg-[#d6e0f5] text-[#0E2C72]" : "bg-neutral-200 text-neutral-500"}`}>
                                      {p.active ? "Active" : "Inactive"}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </>
                      )}
                      {/* Amenities */}
                      {amenities.length > 0 && (
                        <>
                          <div className="border-t border-neutral-100" />
                          <div>
                            <div className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wide mb-2">Amenities</div>
                            <div className="flex flex-wrap gap-2">
                              {amenities.map((a) => (
                                <span key={a.id} className={`px-2.5 py-1 rounded-lg text-[12px] font-medium border ${a.status === "AVAILABLE" ? "bg-[#0E2C72]/6 text-[#0E2C72] border-[#0E2C72]/15" : a.status === "COMING_SOON" ? "bg-amber-50 text-amber-700 border-amber-100" : "bg-neutral-50 text-neutral-500 border-neutral-200"}`}>
                                  {a.name}
                                  <span className="ml-1 text-[10px] opacity-70">· {a.status.replace(/_/g, " ").toLowerCase()}</span>
                                </span>
                              ))}
                            </div>
                          </div>
                        </>
                      )}
                      {/* Land Documents */}
                      {documents.length > 0 && (
                        <>
                          <div className="border-t border-neutral-100" />
                          <div>
                            <div className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wide mb-2">Land Documents</div>
                            <div className="space-y-1.5">
                              {documents.map((d) => (
                                <div key={d.id} className="flex items-center justify-between px-3 py-2 bg-neutral-50 rounded-lg">
                                  <span className="text-[13px] font-medium text-neutral-800">
                                    {d.documentType === "CUSTOM" ? d.customDocName || "Custom Document" : d.documentType.replace(/_/g, " ")}
                                  </span>
                                  <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${d.status === "AVAILABLE" ? "bg-[#d6e0f5] text-[#0E2C72]" : d.status === "PENDING" ? "bg-amber-100 text-amber-700" : "bg-neutral-200 text-neutral-500"}`}>
                                    {d.status}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </>
                      )}
                      {/* Payment Methods */}
                      {paymentMethods.length > 0 && (
                        <>
                          <div className="border-t border-neutral-100" />
                          <div>
                            <div className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wide mb-2">Payment Methods</div>
                            <div className="space-y-1.5">
                              {paymentMethods.map((m) => (
                                <div key={m.id} className="flex items-center justify-between px-3 py-2 bg-neutral-50 rounded-lg">
                                  <div>
                                    <p className="text-[13px] font-semibold text-neutral-800">{m.bankName}</p>
                                    <p className="text-[11px] text-neutral-500">{m.accountNumber} · {m.accountName}</p>
                                  </div>
                                  {!m.active && <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-neutral-200 text-neutral-500">Inactive</span>}
                                </div>
                              ))}
                            </div>
                          </div>
                        </>
                      )}
                      {/* Cover image + gallery */}
                      {(coverPreview || galleryImages.length > 0) && (
                        <>
                          <div className="border-t border-neutral-100" />
                          <div>
                            <div className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wide mb-2">Images</div>
                            <div className="grid grid-cols-4 gap-2">
                              {coverPreview && (
                                <div className="relative col-span-2 row-span-1 aspect-video rounded-lg overflow-hidden bg-neutral-100">
                                  <img src={coverPreview} alt="Cover" className="w-full h-full object-cover" />
                                  <span className="absolute bottom-1 left-1 text-[9px] font-bold bg-black/60 text-white px-1.5 py-0.5 rounded">COVER</span>
                                </div>
                              )}
                              {galleryImages.map((img, i) => (
                                <div key={i} className="aspect-square rounded-lg overflow-hidden bg-neutral-100">
                                  <img src={img.preview} alt="" className="w-full h-full object-cover" />
                                </div>
                              ))}
                            </div>
                          </div>
                        </>
                      )}
                      {/* Map preview */}
                      {latitude && longitude && (
                        <>
                          <div className="border-t border-neutral-100" />
                          <div>
                            <div className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wide mb-2">Location Map</div>
                            <div className="h-40 rounded-lg border border-neutral-200 overflow-hidden">
                              <iframe
                                title="Map preview"
                                width="100%" height="100%"
                                style={{ border: 0 }}
                                loading="lazy"
                                src={`https://maps.google.com/maps?q=${latitude},${longitude}&z=15&output=embed`}
                              />
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                  {/* Publish actions */}
                  <div className="bg-gradient-to-br from-[#eef2fb] via-white to-[#eef2fb] border border-[#0E2C72]/15 rounded-xl p-6">
                    <h4 className="font-semibold text-[#071a45] mb-1">Ready to publish?</h4>
                    <p className="text-[13px] text-[#0E2C72]/70 mb-4">Publishing makes this property visible on your public estate page.</p>
                    <div className="flex gap-3 flex-wrap">
                      <Button disabled={submitting} onClick={() => handleSubmit("DRAFT")}
                        variant="outline" className="border-neutral-300 bg-white text-neutral-700">
                        {submitting ? <><Loader2 className="w-4 h-4 animate-spin mr-1.5" />Saving…</> : "Save as Draft"}
                      </Button>
                      <Button disabled={submitting} onClick={() => handleSubmit("PUBLISHED")}
                        className="bg-[#0E2C72] hover:bg-[#0a2260] text-white">
                        {submitting ? <><Loader2 className="w-4 h-4 animate-spin mr-1.5" />Publishing…</> : <><Check className="w-4 h-4 mr-1.5" />Publish Property</>}
                      </Button>
                    </div>
                  </div>
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
                  {(isEditing || currentStep === steps.length) && currentStep !== 9 && (
                    <Button variant="outline" disabled={submitting}
                      onClick={() => handleSubmit("DRAFT")}
                      className="inline-flex items-center gap-2 px-6 bg-white text-neutral-700 border-neutral-300">
                      Save as Draft
                    </Button>
                  )}
                  {isEditing && currentStep !== 9 && (
                    <Button disabled={submitting}
                      onClick={() => handleSubmit("PUBLISHED")}
                      className="inline-flex items-center gap-2 px-6 bg-[#0E2C72] text-white hover:bg-[#0a2260] disabled:opacity-70">
                      {submitting ? (
                        <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</>
                      ) : (
                        <><Check className="w-4 h-4" /> Publish</>
                      )}
                    </Button>
                  )}
                  {currentStep !== 9 && (
                    <Button onClick={handleNext} disabled={submitting}
                      className="inline-flex items-center gap-2 px-6 bg-[#0E2C72] text-white hover:bg-[#0a2260] disabled:opacity-70">
                      {submitting ? (
                        <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</>
                      ) : (
                        <>Save & Continue <ArrowRight className="w-4 h-4" /></>
                      )}
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
                  className="w-full px-3 py-2 border border-neutral-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#1a3d8f]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1.5">Status</label>
                <select value={amenityForm.status}
                  onChange={(e) => setAmenityForm((f) => ({ ...f, status: e.target.value }))}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#1a3d8f]">
                  {AMENITY_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <button onClick={() => setShowAmenityModal(false)}
                className="flex-1 px-4 py-2 border border-neutral-300 text-neutral-700 rounded-md text-sm hover:bg-neutral-50">Cancel</button>
              <button onClick={saveAmenity}
                className="flex-1 px-4 py-2 bg-[#0E2C72] text-white rounded-md text-sm hover:bg-[#0a2260]">
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
                  className="w-full px-3 py-2 border border-neutral-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#1a3d8f]/30 focus:border-[#2a52a8] transition-colors">
                  {DOCUMENT_TYPES.map((dt) => <option key={dt.value} value={dt.value}>{dt.label}</option>)}
                </select>
                {docForm.documentType === "OTHER" && (
                  <input
                    type="text"
                    value={docForm.customDocName}
                    onChange={(e) => setDocForm((d) => ({ ...d, customDocName: e.target.value }))}
                    placeholder="Enter document name…"
                    className="w-full mt-2 px-3 py-2 border border-neutral-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#1a3d8f]/30 focus:border-[#2a52a8] transition-colors"
                  />
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1.5">Notes</label>
                <textarea value={docForm.notes}
                  onChange={(e) => setDocForm((d) => ({ ...d, notes: e.target.value }))}
                  placeholder="Additional notes about this document…"
                  rows={3}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#1a3d8f]/30 focus:border-[#2a52a8] transition-colors resize-y"
                />
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <button onClick={() => setShowDocModal(false)}
                className="flex-1 px-4 py-2 border border-neutral-300 text-neutral-700 rounded-md text-sm hover:bg-neutral-50">Cancel</button>
              <button onClick={saveDoc}
                className="flex-1 px-4 py-2 bg-[#0E2C72] text-white rounded-md text-sm hover:bg-[#0a2260]">Add Document</button>
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
                    className="w-full px-3 py-2 border border-neutral-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#1a3d8f]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1.5">Total Slots <span className="text-red-500">*</span></label>
                  <input type="number" value={landSizeForm.totalSlots}
                    onChange={(e) => setLandSizeForm((f) => ({ ...f, totalSlots: e.target.value }))}
                    placeholder="e.g. 30"
                    className="w-full px-3 py-2 border border-neutral-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#1a3d8f]"
                  />
                </div>
              </div>
              {landSizeForm.landSize && landSizeForm.totalSlots && (
                <div className="p-3 bg-[#0E2C72]/6 rounded-lg border border-[#8aaad8] text-sm">
                  <span className="text-[#0E2C72] font-medium">
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
                  className="w-full px-3 py-2 border border-neutral-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#1a3d8f]"
                />
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <button onClick={() => setShowLandSizeModal(false)}
                className="flex-1 px-4 py-2 border border-neutral-300 text-neutral-700 rounded-md text-sm hover:bg-neutral-50">Cancel</button>
              <button onClick={saveLandSize}
                className="flex-1 px-4 py-2 bg-[#0E2C72] text-white rounded-md text-sm hover:bg-[#0a2260]">
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
                  className="w-full px-3 py-2 border border-neutral-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#1a3d8f]"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1.5">Land Size (SQM) <span className="text-red-500">*</span></label>
                  {landSizes.length > 0 ? (
                    <select value={pricingForm.landSize}
                      onChange={(e) => setPricingForm((f) => ({ ...f, landSize: e.target.value }))}
                      className="w-full px-3 py-2 border border-neutral-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#1a3d8f]">
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
                      className="w-full px-3 py-2 border border-neutral-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#1a3d8f]"
                    />
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1.5">Currency</label>
                  <select value={pricingForm.currency}
                    onChange={(e) => setPricingForm((f) => ({ ...f, currency: e.target.value }))}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#1a3d8f]">
                    <option value="NGN">NGN (₦)</option>
                    <option value="USD">USD ($)</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1.5">Base Price ({pricingForm.currency === "USD" ? "$" : "₦"}) <span className="text-red-500">*</span></label>
                <input type="number" value={pricingForm.basePrice}
                  onChange={(e) => setPricingForm((f) => ({ ...f, basePrice: e.target.value }))}
                  placeholder="e.g. 1500000"
                  className="w-full px-3 py-2 border border-neutral-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#1a3d8f]"
                />
              </div>

              {/* Statutory Fees */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-neutral-700">Statutory Fees</label>
                  <button type="button"
                    onClick={() => setPricingFees((f) => [...f, { id: Date.now().toString(), name: "", amount: "", note: "" }])}
                    className="flex items-center gap-1.5 text-xs text-[#0E2C72] hover:text-[#0a2260] font-medium px-2.5 py-1.5 border border-[#8aaad8] rounded-md hover:bg-[#0E2C72]/6 transition-colors">
                    <Plus className="w-3.5 h-3.5" /> Add Statutory Fee
                  </button>
                </div>
                {pricingFees.length === 0 && (
                  <p className="text-xs text-neutral-400 italic">No statutory fees added.</p>
                )}
                <div className="space-y-3">
                  {pricingFees.map((fee, idx) => (
                    <div key={fee.id} className="p-3 border border-neutral-200 rounded-lg bg-neutral-50 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-neutral-500">Fee {idx + 1}</span>
                        <button type="button" onClick={() => setPricingFees((f) => f.filter((_, i) => i !== idx))}
                          className="text-red-400 hover:text-red-600 p-0.5 rounded transition-colors">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <input type="text" placeholder="Fee name (e.g. Survey Fee)"
                          value={fee.name}
                          onChange={(e) => setPricingFees((f) => f.map((item, i) => i === idx ? { ...item, name: e.target.value } : item))}
                          className="px-2.5 py-1.5 border border-neutral-300 rounded-md text-xs focus:outline-none focus:ring-2 focus:ring-[#1a3d8f]"
                        />
                        <input type="number" placeholder="Amount"
                          value={fee.amount}
                          onChange={(e) => setPricingFees((f) => f.map((item, i) => i === idx ? { ...item, amount: e.target.value } : item))}
                          className="px-2.5 py-1.5 border border-neutral-300 rounded-md text-xs focus:outline-none focus:ring-2 focus:ring-[#1a3d8f]"
                        />
                      </div>
                      <input type="text" placeholder="Note (optional)"
                        value={fee.note}
                        onChange={(e) => setPricingFees((f) => f.map((item, i) => i === idx ? { ...item, note: e.target.value } : item))}
                        className="w-full px-2.5 py-1.5 border border-neutral-300 rounded-md text-xs focus:outline-none focus:ring-2 focus:ring-[#1a3d8f]"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Total Package Price (auto-computed) */}
              {pricingForm.basePrice && (
                <div className="p-3 bg-[#0E2C72]/6 rounded-lg border border-[#8aaad8] flex items-center justify-between">
                  <div>
                    <span className="text-sm font-semibold text-[#071a45]">Total Package Price</span>
                    {pricingFees.length > 0 && (
                      <p className="text-xs text-[#0E2C72] mt-0.5">
                        Base {pricingForm.currency === "USD" ? "$" : "₦"}{Number(pricingForm.basePrice).toLocaleString("en-NG")}
                        {" + "}
                        {pricingFees.map((f) => f.name || "Fee").join(", ")}
                      </p>
                    )}
                  </div>
                  <span className="text-base font-bold text-[#071a45]">
                    {(() => {
                      const sym = pricingForm.currency === "USD" ? "$" : "₦";
                      const total = Number(pricingForm.basePrice) + pricingFees.reduce((s, f) => s + (Number(f.amount) || 0), 0);
                      return fmt(total, sym);
                    })()}
                  </span>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1.5">Payment Type</label>
                <div className="flex gap-4">
                  {(["outright", "installment"] as const).map((t) => (
                    <label key={t} className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" value={t} checked={pricingForm.paymentType === t}
                        onChange={() => setPricingForm((f) => ({ ...f, paymentType: t }))}
                        className="accent-[#0E2C72]"
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
                      <label className="block text-sm font-medium text-neutral-700 mb-1.5">Initial Payment ({pricingForm.currency === "USD" ? "$" : "₦"})</label>
                      <input type="number" value={pricingForm.initialPayment}
                        onChange={(e) => setPricingForm((f) => ({ ...f, initialPayment: e.target.value }))}
                        placeholder="e.g. 250000"
                        className="w-full px-3 py-2 border border-neutral-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#1a3d8f]"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-1.5">Duration (months)</label>
                      <input type="number" value={pricingForm.duration}
                        onChange={(e) => setPricingForm((f) => ({ ...f, duration: e.target.value }))}
                        placeholder="e.g. 12"
                        className="w-full px-3 py-2 border border-neutral-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#1a3d8f]"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1.5">Payment Spread Method</label>
                    <div className="space-y-2">
                      <label className="flex items-start gap-2 cursor-pointer p-3 border border-neutral-200 rounded-md hover:bg-neutral-50">
                        <input type="radio" value="separate" checked={pricingForm.spreadMethod === "separate"}
                          onChange={() => setPricingForm((f) => ({ ...f, spreadMethod: "separate" }))}
                          className="mt-0.5 accent-[#0E2C72]"
                        />
                        <div>
                          <div className="text-sm font-medium">Initial Payment Separate</div>
                          <div className="text-xs text-neutral-400">Initial is upfront; monthly = (Total − Initial) ÷ Duration</div>
                        </div>
                      </label>
                      <label className="flex items-start gap-2 cursor-pointer p-3 border border-neutral-200 rounded-md hover:bg-neutral-50">
                        <input type="radio" value="first_month" checked={pricingForm.spreadMethod === "first_month"}
                          onChange={() => setPricingForm((f) => ({ ...f, spreadMethod: "first_month" }))}
                          className="mt-0.5 accent-[#0E2C72]"
                        />
                        <div>
                          <div className="text-sm font-medium">Initial as First Month</div>
                          <div className="text-xs text-neutral-400">Initial counts as month 1; monthly = (Total − Initial) ÷ (Duration − 1)</div>
                        </div>
                      </label>
                    </div>
                  </div>
                  {pricingForm.basePrice && pricingForm.duration && (
                    <div className="p-4 bg-[#0E2C72]/6 rounded-lg border border-[#8aaad8] text-sm space-y-1">
                      <div className="font-medium text-[#0E2C72] mb-2">Summary</div>
                      {(() => {
                        const sym = pricingForm.currency === "USD" ? "$" : "₦";
                        const computedTotal = Number(pricingForm.basePrice) + pricingFees.reduce((s, f) => s + (Number(f.amount) || 0), 0);
                        const planForCalc = { ...pricingForm, totalPrice: String(computedTotal), statutoryFees: pricingFees };
                        return (
                          <>
                            <div className="flex justify-between text-neutral-700">
                              <span>Total Package Price</span>
                              <span className="font-medium">{fmt(computedTotal, sym)}</span>
                            </div>
                            <div className="flex justify-between text-neutral-700">
                              <span>Initial Payment</span>
                              <span className="font-medium">{fmt(Number(pricingForm.initialPayment) || 0, sym)}</span>
                            </div>
                            <div className="flex justify-between text-neutral-700">
                              <span>Monthly Installment</span>
                              <span className="font-medium">{fmt(Math.round(monthlyInstallment(planForCalc) ?? 0), sym)}</span>
                            </div>
                          </>
                        );
                      })()}
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
                className="flex-1 px-4 py-2 bg-[#0E2C72] text-white rounded-md text-sm hover:bg-[#0a2260]">
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
                  disabled={banksLoading}
                  onChange={(e) => {
                    const bank = banks.find((b) => b.code === e.target.value);
                    setPaymentForm((f) => ({ ...f, bankCode: e.target.value, bankName: bank?.name ?? "", accountName: "" }));
                    setVerifyError("");
                    setVerifyFailed(false);
                  }}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#1a3d8f]/30 focus:border-[#2a52a8] transition-colors disabled:opacity-60">
                  <option value="">{banksLoading ? "Loading banks…" : "— Select a bank —"}</option>
                  {banks.map((b, i) => <option key={`${b.code}-${i}`} value={b.code}>{b.name}</option>)}
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
                      setVerifyFailed(false);
                    }}
                    placeholder="10-digit account number"
                    maxLength={10}
                    className="flex-1 px-3 py-2 border border-neutral-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#1a3d8f]/30 focus:border-[#2a52a8] transition-colors"
                  />
                  <button type="button" onClick={handleVerifyAccount}
                    disabled={verifyingAccount || paymentForm.accountNumber.length !== 10 || !paymentForm.bankCode}
                    className="px-3 py-2 bg-[#0E2C72] text-white rounded-md text-sm hover:bg-[#0a2260] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1.5 shrink-0">
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
                  <p className={`text-xs mt-1 flex items-center gap-1 ${verifyFailed ? "text-amber-600" : "text-red-600"}`}>
                    <AlertCircle className="w-3 h-3" /> {verifyError}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                  Account Name
                  {verifyFailed
                    ? <span className="text-amber-600 text-xs ml-1">(enter manually)</span>
                    : <span className="text-neutral-400 text-xs ml-1">(auto-verified)</span>}
                  <span className="text-red-500 ml-0.5">*</span>
                </label>
                {verifyFailed ? (
                  <input
                    type="text"
                    value={paymentForm.accountName}
                    onChange={(e) => setPaymentForm((f) => ({ ...f, accountName: e.target.value }))}
                    placeholder="Enter account holder name"
                    className="w-full px-3 py-2 border border-amber-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-400 transition-colors"
                  />
                ) : (
                  <div className={`w-full px-3 py-2 border rounded-md text-sm min-h-[38px] flex items-center ${
                    paymentForm.accountName
                      ? "border-[#4a6fc0] bg-[#0E2C72]/6 text-[#0E2C72] font-medium"
                      : "border-neutral-200 bg-neutral-50 text-neutral-400"
                  }`}>
                    {paymentForm.accountName || "Will appear after verification"}
                  </div>
                )}
                {paymentForm.accountName && !verifyFailed && (
                  <p className="text-xs text-[#0E2C72] mt-1 flex items-center gap-1">
                    <span className="w-3 h-3 rounded-full bg-[#1a3d8f] flex items-center justify-center text-white text-[8px] font-bold">✓</span>
                    Account verified
                  </p>
                )}
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <button onClick={() => { setShowPaymentModal(false); setVerifyFailed(false); }}
                className="flex-1 px-4 py-2 border border-neutral-300 text-neutral-700 rounded-md text-sm hover:bg-neutral-50">Cancel</button>
              <button onClick={savePayment} disabled={!paymentForm.accountName.trim()}
                className="flex-1 px-4 py-2 bg-[#0E2C72] text-white rounded-md text-sm hover:bg-[#0a2260] disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                {editingPaymentId ? "Update" : "Add Method"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}





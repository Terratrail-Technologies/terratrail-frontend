import { useState } from "react";
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
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "../components/ui/badge";
import { cn } from "../components/ui/utils";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";

const steps = [
  { id: 1, name: "Basic Information", icon: FileText },
  { id: 2, name: "Property Gallery", icon: Upload },
  { id: 3, name: "Location Details", icon: MapPin },
  { id: 4, name: "Property Amenities", icon: Check },
  { id: 5, name: "Property Documents", icon: FileText },
  { id: 6, name: "Pricing & Payment Plans", icon: DollarSign },
  { id: 7, name: "Payment Methods", icon: CreditCard },
];

export function PropertyWizard() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [currentStep, setCurrentStep] = useState(1);
  const [propertyName, setPropertyName] = useState(id ? "Tehillah Estate Phase 1" : "");
  const [showAmenityModal, setShowAmenityModal] = useState(false);
  const [showDocumentModal, setShowDocumentModal] = useState(false);
  const [showPricingModal, setShowPricingModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const [amenities, setAmenities] = useState(
    id
      ? [
          { id: "1", name: "Perimeter Fencing", status: "Not Started", description: "" },
          { id: "2", name: "Street Lights", status: "In Progress", description: "" },
        ]
      : []
  );

  const [documents, setDocuments] = useState(
    id ? [{ id: "1", name: "Survey Plan", file: "survey-plan.pdf" }] : []
  );

  const [pricingPlans, setPricingPlans] = useState(
    id
      ? [
          {
            id: "1",
            name: "Pre-launch Price",
            pricePerUnit: 5000,
            currency: "NGN",
            active: true,
            paymentPlans: 3,
          },
        ]
      : []
  );

  const [paymentMethods, setPaymentMethods] = useState(
    id
      ? [
          {
            id: "1",
            type: "Bank Transfer",
            bankName: "First Bank",
            accountName: "Tehillah Estate Ltd",
            accountNumber: "1234567890",
            active: true,
          },
        ]
      : []
  );

  const isEditing = !!id;

  const handleSave = () => {
    toast.success(
      currentStep === steps.length && documents.length > 0 ? "Property published successfully!" : "Progress saved"
    );
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    } else if (documents.length > 0) {
      navigate("/properties");
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    } else {
      navigate("/properties");
    }
  };

  const addAmenity = () => {
    const newAmenity = {
      id: Date.now().toString(),
      name: "New Amenity",
      status: "Not Started",
      description: "",
    };
    setAmenities([...amenities, newAmenity]);
    setShowAmenityModal(false);
    toast.success("Amenity added successfully");
  };

  const addDocument = () => {
    const newDocument = {
      id: Date.now().toString(),
      name: "Document",
      file: "document.pdf",
    };
    setDocuments([...documents, newDocument]);
    setShowDocumentModal(false);
    toast.success("Document added successfully");
  };

  const addPricingPlan = () => {
    const newPlan = {
      id: Date.now().toString(),
      name: "New Pricing Plan",
      pricePerUnit: 0,
      currency: "NGN",
      active: true,
      paymentPlans: 0,
    };
    setPricingPlans([...pricingPlans, newPlan]);
    setShowPricingModal(false);
    toast.success("Pricing plan created");
  };

  const addPaymentMethod = () => {
    const newMethod = {
      id: Date.now().toString(),
      type: "Bank Transfer",
      bankName: "Bank Name",
      accountName: "Account Name",
      accountNumber: "0000000000",
      active: true,
    };
    setPaymentMethods([...paymentMethods, newMethod]);
    setShowPaymentModal(false);
    toast.success("Payment method added");
  };

  return (
    <div className="flex flex-col min-h-[calc(100vh-64px)] w-full bg-neutral-50/50">
      {/* Header */}
      <div className="bg-white border-b border-neutral-200 px-4 sm:px-6 lg:px-8 py-4 sm:py-6 sticky top-0 z-10 hidden md:block">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleBack}
              className="hover:bg-neutral-100 rounded-lg transition-colors"
              title="Back"
            >
              <ArrowLeft className="w-5 h-5 text-neutral-600" />
            </Button>
            <div>
              <h1 className="text-2xl font-semibold text-neutral-900">
                {isEditing ? `Edit Property: ${propertyName}` : "Create Property"}
              </h1>
              <p className="text-sm text-neutral-500 mt-1">
                Step {currentStep} of {steps.length}: {steps[currentStep - 1].name}
              </p>
            </div>
          </div>
          {isEditing && currentStep === 1 && (
            <div className="flex gap-2">
              <button className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-neutral-300 text-neutral-700 rounded-md hover:bg-neutral-50 transition-colors">
                Manage Commission
              </button>
              <button className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-neutral-300 text-neutral-700 rounded-md hover:bg-neutral-50 transition-colors">
                Open Booking Form
              </button>
            </div>
          )}
        </div>

        {/* Step Indicator */}
        <div className="mt-6 flex items-center gap-2">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center flex-1">
              <button
                onClick={() => setCurrentStep(step.id)}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-md text-sm flex-1 transition-colors",
                  currentStep === step.id
                    ? "bg-emerald-50 text-emerald-700 font-medium"
                    : currentStep > step.id
                    ? "bg-neutral-100 text-neutral-600"
                    : "bg-white text-neutral-500"
                )}
              >
                {currentStep > step.id ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <span className="w-4 h-4 flex items-center justify-center text-xs">{step.id}</span>
                )}
                <span className="hidden xl:inline">{step.name}</span>
              </button>
              {index < steps.length - 1 && <div className="w-2" />}
            </div>
          ))}
        </div>
      </div>

      <div className="p-4 sm:p-6 lg:p-8 flex-1">
        <div className="max-w-4xl mx-auto">
          {/* Main animated container */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
            >
              {/* Step 1: Basic Information */}
          {currentStep === 1 && (
            <div className="bg-white rounded-lg border border-neutral-200 p-8 space-y-6">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Property Name <span className="text-red-500">*</span>
                </label>
                <Input
                  type="text"
                  value={propertyName}
                  onChange={(e) => setPropertyName(e.target.value)}
                  placeholder="e.g. TehillahEstate"
                  className="bg-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Property Type <span className="text-red-500">*</span>
                </label>
                <select className="flex h-10 w-full items-center justify-between rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
                  <option>Residential Land</option>
                  <option>Farm Land</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Description <span className="text-red-500">*</span>
                </label>
                <Textarea
                  rows={6}
                  placeholder="Describe your property..."
                  className="bg-white resize-y min-h-[120px]"
                  defaultValue={
                    id
                      ? "Premium residential land in the heart of Lekki with excellent infrastructure and proximity to major landmarks."
                      : ""
                  }
                />
                <p className="text-xs text-neutral-500 mt-2">Supports Markdown & HTML</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Total SQMs <span className="text-red-500">*</span>
                </label>
                <Input
                  type="number"
                  placeholder="e.g. 100"
                  defaultValue={id ? "50000" : ""}
                  className="bg-white"
                />
              </div>

              {isEditing && (
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">Brochure (PDF)</label>
                  <div className="border-2 border-dashed border-neutral-300 rounded-md p-6 text-center hover:border-emerald-500 transition-colors cursor-pointer">
                    <Upload className="w-8 h-8 text-neutral-400 mx-auto mb-2" />
                    <p className="text-sm text-neutral-600">Click to upload or drag and drop</p>
                    <p className="text-xs text-neutral-500 mt-1">PDF (max. 10MB)</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Property Gallery */}
          {currentStep === 2 && (
            <div className="bg-white rounded-lg border border-neutral-200 p-8 space-y-6">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Cover Image <span className="text-red-500">*</span>
                </label>
                <div className="border-2 border-dashed border-neutral-300 rounded-md p-12 text-center hover:border-emerald-500 transition-colors cursor-pointer">
                  <Upload className="w-12 h-12 text-neutral-400 mx-auto mb-3" />
                  <p className="text-sm text-neutral-600">Click to upload or drag and drop</p>
                  <p className="text-xs text-neutral-500 mt-1">PNG, JPG up to 10MB</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Gallery Images <span className="text-neutral-500">(Up to 10 images)</span>
                </label>
                <div className="border-2 border-dashed border-neutral-300 rounded-md p-8 text-center hover:border-emerald-500 transition-colors cursor-pointer">
                  <Plus className="w-8 h-8 text-neutral-400 mx-auto mb-2" />
                  <p className="text-sm text-neutral-600">Add gallery images</p>
                  <p className="text-xs text-neutral-500 mt-1">Drag to reorder</p>
                </div>
                <div className="text-sm text-neutral-500 mt-4 text-center">
                  No gallery images added yet — Upload images using the button above
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Location Details */}
          {currentStep === 3 && (
            <div className="bg-white rounded-lg border border-neutral-200 p-8 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">Street Address</label>
                  <Input
                    type="text"
                    placeholder="Enter street address"
                    defaultValue={id ? "Lekki-Epe Expressway" : ""}
                    className="bg-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    City <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="text"
                    placeholder="Enter city"
                    defaultValue={id ? "Lagos" : ""}
                    className="bg-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    State <span className="text-red-500">*</span>
                  </label>
                  <select
                    defaultValue={id ? "Lagos" : ""}
                    className="flex h-10 w-full items-center justify-between rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option>Lagos</option>
                    <option>Abuja</option>
                    <option>Rivers</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">Country</label>
                  <select
                    defaultValue="Nigeria"
                    className="flex h-10 w-full items-center justify-between rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option>Nigeria</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">Latitude</label>
                  <Input
                    type="text"
                    placeholder="Auto-fills via location"
                    className="bg-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">Longitude</label>
                  <Input
                    type="text"
                    placeholder="Auto-fills via location"
                    className="bg-white"
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <button className="px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition-colors">
                  Use Current Location
                </button>
                <button className="px-4 py-2 bg-white border border-neutral-300 text-neutral-700 rounded-md hover:bg-neutral-50 transition-colors">
                  Location Finder
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">Map Preview</label>
                <div className="h-64 bg-neutral-100 rounded-md flex items-center justify-center border border-neutral-300">
                  <div className="text-center text-neutral-500">
                    <MapPin className="w-12 h-12 mx-auto mb-2" />
                    <p>Map preview will appear here</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Property Amenities */}
          {currentStep === 4 && (
            <div className="bg-white rounded-lg border border-neutral-200 p-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-medium text-neutral-900">Property Amenities</h3>
                <button
                  onClick={() => setShowAmenityModal(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Add Amenity
                </button>
              </div>

              {amenities.length > 0 ? (
                <div className="space-y-3">
                  {amenities.map((amenity) => (
                    <div key={amenity.id} className="flex items-center justify-between p-4 border border-neutral-200 rounded-md">
                      <div className="flex items-center gap-3">
                        <div>
                          <div className="font-medium text-neutral-900">{amenity.name}</div>
                          <Badge variant="secondary" className="mt-1">
                            {amenity.status}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button className="p-2 hover:bg-neutral-100 rounded-md">
                          <Pencil className="w-4 h-4 text-neutral-600" />
                        </button>
                        <button
                          onClick={() => setAmenities(amenities.filter((a) => a.id !== amenity.id))}
                          className="p-2 hover:bg-red-50 rounded-md"
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Check className="w-8 h-8 text-neutral-400" />
                  </div>
                  <h3 className="font-medium text-neutral-900 mb-2">No amenities added yet</h3>
                  <p className="text-sm text-neutral-500 mb-6">Add amenities that describe property features</p>
                  <button
                    onClick={() => setShowAmenityModal(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Add Your First Amenity
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Step 5: Property Documents */}
          {currentStep === 5 && (
            <div className="bg-white rounded-lg border border-neutral-200 p-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-medium text-neutral-900">Property Documents</h3>
                <button
                  onClick={() => setShowDocumentModal(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Add Document
                </button>
              </div>

              {documents.length > 0 ? (
                <div className="space-y-3">
                  {documents.map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between p-4 border border-neutral-200 rounded-md">
                      <div className="flex items-center gap-3">
                        <FileText className="w-5 h-5 text-neutral-400" />
                        <div>
                          <div className="font-medium text-neutral-900">{doc.name}</div>
                          <div className="text-xs text-neutral-500">{doc.file}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button className="p-2 hover:bg-neutral-100 rounded-md">
                          <Pencil className="w-4 h-4 text-neutral-600" />
                        </button>
                        <button
                          onClick={() => setDocuments(documents.filter((d) => d.id !== doc.id))}
                          className="p-2 hover:bg-red-50 rounded-md"
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FileText className="w-8 h-8 text-neutral-400" />
                  </div>
                  <h3 className="font-medium text-neutral-900 mb-2">No documents added</h3>
                  <p className="text-sm text-neutral-500 mb-6">
                    Add important property documents like survey plans, deeds of assignment, and other legal documents
                  </p>
                  <button
                    onClick={() => setShowDocumentModal(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Add Your First Document
                  </button>
                </div>
              )}

              {documents.length === 0 && (
                <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-md flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
                  <div className="text-sm text-amber-800">
                    <strong>Publishing requirement:</strong> At least one document is required to publish the property
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 6: Pricing & Payment Plans */}
          {currentStep === 6 && (
            <div className="bg-white rounded-lg border border-neutral-200 p-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-medium text-neutral-900">Pricing & Payment Plans</h3>
                <button
                  onClick={() => setShowPricingModal(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Add Pricing Plan
                </button>
              </div>

              {pricingPlans.length > 0 ? (
                <div className="space-y-4">
                  {pricingPlans.map((plan) => (
                    <div key={plan.id} className="p-6 border border-neutral-200 rounded-md">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium text-neutral-900">{plan.name}</h4>
                            {plan.active && (
                              <Badge className="bg-emerald-100 text-emerald-700">Active</Badge>
                            )}
                          </div>
                          <div className="text-2xl font-semibold text-neutral-900 mt-2">
                            ₦{plan.pricePerUnit.toLocaleString()}/sqm
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button className="p-2 hover:bg-neutral-100 rounded-md">
                            <Pencil className="w-4 h-4 text-neutral-600" />
                          </button>
                          <button className="p-2 hover:bg-red-50 rounded-md">
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </button>
                        </div>
                      </div>
                      <div className="text-sm text-neutral-500">
                        {plan.paymentPlans} payment plan{plan.paymentPlans !== 1 ? "s" : ""}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <DollarSign className="w-8 h-8 text-neutral-400" />
                  </div>
                  <h3 className="font-medium text-neutral-900 mb-2">No pricing plans yet</h3>
                  <p className="text-sm text-neutral-500 mb-6">
                    Set up selling prices and installment payment plans
                  </p>
                  <button
                    onClick={() => setShowPricingModal(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Create Pricing Plan
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Step 7: Payment Methods */}
          {currentStep === 7 && (
            <div className="bg-white rounded-lg border border-neutral-200 p-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-medium text-neutral-900">Payment Methods</h3>
                <button
                  onClick={() => setShowPaymentModal(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Add Method
                </button>
              </div>

              {paymentMethods.length > 0 ? (
                <div>
                  <h4 className="text-sm font-medium text-neutral-700 mb-3">
                    Bank Transfer Methods — {paymentMethods.filter((m) => m.type === "Bank Transfer").length} Bank
                    {paymentMethods.filter((m) => m.type === "Bank Transfer").length !== 1 ? "s" : ""}
                  </h4>
                  <div className="space-y-3">
                    {paymentMethods.map((method) => (
                      <div key={method.id} className="p-4 border border-neutral-200 rounded-md">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <div className="font-medium text-neutral-900">{method.bankName}</div>
                              {method.active && (
                                <Badge className="bg-emerald-100 text-emerald-700">Active</Badge>
                              )}
                            </div>
                            <div className="text-sm text-neutral-600">{method.accountName}</div>
                            <div className="text-sm text-neutral-500">{method.accountNumber}</div>
                          </div>
                          <button className="p-2 hover:bg-neutral-100 rounded-md">
                            <Pencil className="w-4 h-4 text-neutral-600" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CreditCard className="w-8 h-8 text-neutral-400" />
                  </div>
                  <h3 className="font-medium text-neutral-900 mb-2">No payment methods yet</h3>
                  <p className="text-sm text-neutral-500 mb-6">
                    Configure how you'll receive customer payments
                  </p>
                  <button
                    onClick={() => setShowPaymentModal(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Add Payment Method
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between mt-8">
            <Button
              variant="outline"
              onClick={handleBack}
              className="inline-flex items-center gap-2 px-6 py-2 bg-white text-neutral-700"
            >
              <ArrowLeft className="w-4 h-4" />
              {currentStep === 1 ? "Cancel" : "Back"}
            </Button>

            <Button
              onClick={handleSave}
              disabled={currentStep === 7 && documents.length === 0}
              className="inline-flex items-center gap-2 px-6 py-2 bg-emerald-600 text-white hover:bg-emerald-700"
            >
              {currentStep === 7 ? (
                <>
                  <Eye className="w-4 h-4" />
                  {documents.length > 0 ? "Preview & Publish" : "Cannot Publish"}
                </>
              ) : (
                <>
                  Save & Continue
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </Button>
          </div>
          </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Modal overlays */}
      {showAmenityModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-neutral-900">Add New Amenity</h3>
              <button onClick={() => setShowAmenityModal(false)} className="p-1 hover:bg-neutral-100 rounded">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">Amenity Name</label>
                <input
                  type="text"
                  placeholder="e.g. Perimeter Fencing"
                  className="w-full px-4 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">Status</label>
                <select className="w-full px-4 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500">
                  <option>Not Started</option>
                  <option>In Progress</option>
                  <option>Completed</option>
                </select>
              </div>
              <div className="flex gap-2 mt-6">
                <button
                  onClick={() => setShowAmenityModal(false)}
                  className="flex-1 px-4 py-2 bg-white border border-neutral-300 text-neutral-700 rounded-md hover:bg-neutral-50"
                >
                  Cancel
                </button>
                <button
                  onClick={addAmenity}
                  className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700"
                >
                  Create
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showDocumentModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-neutral-900">Add Document</h3>
              <button onClick={() => setShowDocumentModal(false)} className="p-1 hover:bg-neutral-100 rounded">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">Document Name</label>
                <input
                  type="text"
                  placeholder="e.g. Survey Plan"
                  className="w-full px-4 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">Upload Document</label>
                <div className="border-2 border-dashed border-neutral-300 rounded-md p-6 text-center cursor-pointer hover:border-emerald-500">
                  <Upload className="w-8 h-8 text-neutral-400 mx-auto mb-2" />
                  <p className="text-sm text-neutral-600">Click to upload</p>
                </div>
              </div>
              <div className="flex gap-2 mt-6">
                <button
                  onClick={() => setShowDocumentModal(false)}
                  className="flex-1 px-4 py-2 bg-white border border-neutral-300 text-neutral-700 rounded-md hover:bg-neutral-50"
                >
                  Cancel
                </button>
                <button
                  onClick={addDocument}
                  className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700"
                >
                  Add
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showPricingModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-neutral-900">Create Pricing Plan</h3>
              <button onClick={() => setShowPricingModal(false)} className="p-1 hover:bg-neutral-100 rounded">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">Plan Name</label>
                <input
                  type="text"
                  placeholder="e.g. Pre-launch Price"
                  className="w-full px-4 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">Price Per Unit (SQM)</label>
                <input
                  type="number"
                  placeholder="5000"
                  className="w-full px-4 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div className="flex gap-2 mt-6">
                <button
                  onClick={() => setShowPricingModal(false)}
                  className="flex-1 px-4 py-2 bg-white border border-neutral-300 text-neutral-700 rounded-md hover:bg-neutral-50"
                >
                  Cancel
                </button>
                <button
                  onClick={addPricingPlan}
                  className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700"
                >
                  Create Plan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-neutral-900">Add Payment Method</h3>
              <button onClick={() => setShowPaymentModal(false)} className="p-1 hover:bg-neutral-100 rounded">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">Bank Name</label>
                <input
                  type="text"
                  placeholder="e.g. First Bank"
                  className="w-full px-4 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">Account Name</label>
                <input
                  type="text"
                  placeholder="Account Name"
                  className="w-full px-4 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">Account Number</label>
                <input
                  type="text"
                  placeholder="1234567890"
                  className="w-full px-4 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div className="flex gap-2 mt-6">
                <button
                  onClick={() => setShowPaymentModal(false)}
                  className="flex-1 px-4 py-2 bg-white border border-neutral-300 text-neutral-700 rounded-md hover:bg-neutral-50"
                >
                  Cancel
                </button>
                <button
                  onClick={addPaymentMethod}
                  className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700"
                >
                  Add Method
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

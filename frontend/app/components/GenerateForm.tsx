"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { FileText, FileType, Presentation, Table } from "lucide-react";
import { generateDocument } from "../lib/api";

interface Brand { id: string; name: string }

const DOC_TYPES = [
  { value: "report", label: "Report", desc: "Structured analysis & findings" },
  { value: "proposal", label: "Proposal", desc: "Pitch or business case" },
  { value: "presentation", label: "Presentation", desc: "Slide deck content" },
  { value: "brief", label: "Brief", desc: "Short summary document" },
];

const FORMATS = [
  { value: "pdf", label: "PDF", icon: FileText },
  { value: "docx", label: "DOCX", icon: FileType },
  { value: "pptx", label: "PPTX", icon: Presentation },
  { value: "xlsx", label: "XLSX", icon: Table },
];

export default function GenerateForm({ brands }: { brands: Brand[] }) {
  const router = useRouter();
  const [form, setForm] = useState({
    topic: "", doc_type: "report", output_format: "pdf", brand_id: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.topic.trim() || form.topic.trim().length < 10)
      e.topic = "Topic must be at least 10 characters.";
    if (!form.brand_id)
      e.brand_id = "Please select a brand.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setError("");
    try {
      const data = await generateDocument(form);
      if (data.detail) throw new Error(data.detail);
      const selectedBrand = brands.find((b: any) => b.id === form.brand_id) as any;
      const payload = {
        ...data, doc_type: form.doc_type, brand_id: form.brand_id,
        topic: form.topic, output_format: form.output_format,
        brand_color: selectedBrand?.primary_color || "#16a34a",
      };
      sessionStorage.setItem(`doc_${data.doc_id}`, JSON.stringify(payload));
      router.push(`/document/${data.doc_id}`);
    } catch (err: any) {
      setError(err.message || "Generation failed. Please try again.");
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleGenerate} className="space-y-5">
      {/* Topic */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-widest mb-2">
          Topic / Prompt
        </label>
        <textarea
          value={form.topic}
          onChange={(e) => setForm({ ...form, topic: e.target.value })}
          rows={4}
          className={`w-full rounded-xl px-4 py-3 text-sm text-gray-800 bg-gray-50 border focus:outline-none focus:ring-2 focus:ring-green-400 focus:bg-white transition-all resize-none ${errors.topic ? "border-red-300" : "border-gray-200"}`}
          placeholder="Describe the document you want to create..."
        />
        {errors.topic && <p className="text-red-500 text-xs mt-1.5">{errors.topic}</p>}
      </div>

      {/* Document Type */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3">
          Document Type
        </label>
        <div className="grid grid-cols-2 gap-2">
          {DOC_TYPES.map((t) => (
            <button key={t.value} type="button"
              onClick={() => setForm({ ...form, doc_type: t.value })}
              className={`text-left px-4 py-3 rounded-xl border text-sm transition-all ${
                form.doc_type === t.value
                  ? "border-green-500 bg-green-50 text-green-800"
                  : "border-gray-200 hover:border-gray-300 text-gray-700"
              }`}>
              <p className="font-medium">{t.label}</p>
              <p className="text-xs text-gray-400 mt-0.5">{t.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Output Format */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3">
          Output Format
        </label>
        <div className="grid grid-cols-4 gap-2">
          {FORMATS.map((f) => (
            <button key={f.value} type="button"
              onClick={() => setForm({ ...form, output_format: f.value })}
              className={`flex flex-col items-center py-3 rounded-xl border text-sm font-medium transition-all ${
                form.output_format === f.value
                  ? "border-green-500 bg-green-50 text-green-800"
                  : "border-gray-200 hover:border-gray-300 text-gray-600"
              }`}>
              <f.icon size={22} className="mb-1" />
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Brand */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-widest mb-2">
          Brand
        </label>
        <select
          value={form.brand_id}
          onChange={(e) => setForm({ ...form, brand_id: e.target.value })}
          className={`w-full rounded-xl px-4 py-3 text-sm bg-gray-50 border focus:outline-none focus:ring-2 focus:ring-green-400 focus:bg-white transition-all ${errors.brand_id ? "border-red-300" : "border-gray-200"}`}>
          <option value="">Select a brand profile...</option>
          {brands.map((b) => <option key={b.id} value={b.id}>{(b as any).name || b.id}</option>)}
        </select>
        {errors.brand_id && <p className="text-red-500 text-xs mt-1.5">{errors.brand_id}</p>}
      </div>

      {/* Submit */}
      <button type="submit" disabled={loading}
        className="w-full bg-gradient-to-r from-green-500 to-green-700 text-white py-4 rounded-2xl text-sm font-semibold hover:from-green-400 hover:to-green-600 disabled:opacity-50 flex items-center justify-center gap-2 shadow-xl shadow-green-600/30 transition-all active:scale-[0.99]">
        {loading ? (
          <>
            <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
            </svg>
            Generating your document...
          </>
        ) : (
          <>
            <span>✦</span> Generate Document
          </>
        )}
      </button>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-600">
          {error}
        </div>
      )}
    </form>
  );
}

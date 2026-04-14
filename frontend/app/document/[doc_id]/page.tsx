"use client";
import { useState, use, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getDownloadUrl, submitFeedback } from "../../lib/api";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function DocumentPage({ params }: { params: Promise<{ doc_id: string }> }) {
  const { doc_id } = use(params);
  const router = useRouter();

  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    const stored = sessionStorage.getItem(`doc_${doc_id}`);
    if (stored) setResult(JSON.parse(stored));
  }, [doc_id]);
  const [review, setReview] = useState<any>(null);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [updateFeedback, setUpdateFeedback] = useState("");
  const [updateLoading, setUpdateLoading] = useState(false);
  const [rating, setRating] = useState(5);
  const [feedbackSent, setFeedbackSent] = useState(false);
  const [error, setError] = useState("");

  if (!result) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f4f6f9]">
        <div className="text-center space-y-3">
          <p className="text-gray-500">Document not found.</p>
          <button onClick={() => router.push("/")}
            className="text-sm text-green-600 hover:underline">← Back to generator</button>
        </div>
      </div>
    );
  }

  const filename = result?.download_url?.split("/").pop();
  const content = result?.raw_content;
  const docType = result?.doc_type || "document";
  const brandColor = result?.brand_color || "#16a34a";

  const handleReview = async () => {
    setReviewLoading(true);
    setError("");
    try {
      const res = await fetch(`${BASE_URL}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          raw_content: result.raw_content,
          doc_type: docType,
          brand_id: result.brand_id,
        }),
      });
      const data = await res.json();
      if (data.detail) throw new Error(data.detail);
      setReview(data);
    } catch (err: any) {
      setError(err.message || "Review failed.");
    }
    setReviewLoading(false);
  };

  const handleUpdate = async () => {
    if (updateFeedback.trim().length < 5) return;
    setUpdateLoading(true);
    setError("");
    try {
      const res = await fetch(`${BASE_URL}/update`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          raw_content: result.raw_content,
          doc_type: docType,
          output_format: result.output_format?.toLowerCase(),
          topic: result.topic,
          brand_id: result.brand_id,
          feedback: updateFeedback,
          doc_id: result.doc_id,
        }),
      });
      const data = await res.json();
      if (data.detail) throw new Error(data.detail);
      const updated = { ...data, doc_type: docType, brand_id: result.brand_id, topic: result.topic, output_format: result.output_format };
      setResult(updated);
      sessionStorage.setItem(`doc_${data.doc_id}`, JSON.stringify(updated));
      setReview(null);
      setUpdateFeedback("");
    } catch (err: any) {
      setError(err.message || "Update failed.");
    }
    setUpdateLoading(false);
  };

  const handleFeedback = async () => {
    await submitFeedback({ prompt: result.topic, output: result.output_path || "", rating, notes: "" });
    setFeedbackSent(true);
  };

  return (
    <div className="min-h-screen bg-[#f4f6f9]">
      {/* Top bar */}
      <header className="bg-gradient-to-r from-green-600 to-green-800 text-white px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => router.push("/")}
            className="text-white/70 hover:text-white text-sm flex items-center gap-1">
            ← Back
          </button>
          <div className="w-px h-5 bg-white/20" />
          <div>
            <p className="text-sm font-semibold text-white truncate max-w-md">{result.topic}</p>
            <p className="text-xs text-white/60 capitalize">{docType} · {result.output_format?.toUpperCase()}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {result?.auto_review && (
            <span className={`text-xs px-3 py-1 rounded-full font-medium ${result.auto_review.score >= 7 ? "bg-green-500/20 text-green-400" : "bg-yellow-500/20 text-yellow-400"}`}>
              Score {result.auto_review.score}/10
            </span>
          )}
          {result?.improved_from_feedback && (
            <span className="text-xs px-3 py-1 rounded-full font-medium bg-blue-500/20 text-blue-400">
              ✦ Self-improved from {result.examples_used} past example{result.examples_used > 1 ? "s" : ""}
            </span>
          )}
          <a href={getDownloadUrl(filename!)} download={filename}
            className="bg-green-500 hover:bg-green-600 text-white text-sm px-4 py-2 rounded-lg font-medium">
            Download {filename?.split(".").pop()?.toUpperCase()}
          </a>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-8 grid grid-cols-3 gap-6">
        {/* Document preview - left 2/3 */}
        <div className="col-span-2 space-y-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 min-h-[600px]">
            <div className="prose max-w-none">
              {Array.isArray(content) ? (
                content.map((slide: any, i: number) => (
                  <div key={i} className="mb-6 pb-6 border-b last:border-0">
                    <h3 className="text-lg font-bold mb-2" style={{ color: brandColor }}>{slide.title}</h3>
                    <p className="text-gray-600 leading-relaxed">{slide.body}</p>
                  </div>
                ))
              ) : (
                <>
                  <h1 className="text-2xl font-bold mb-6" style={{ color: brandColor }}>{content?.title}</h1>
                  <div className="text-gray-700 leading-relaxed">
                    {content?.content?.split("\n\n").map((para: string, i: number) => {
                      const isHeading = para.trim().split("\n").length === 1 && para.trim().length < 60 && !para.trim().includes(".");
                      return isHeading ? (
                        <p key={i} className="font-bold mt-5 mb-1" style={{ color: brandColor }}>{para.trim()}</p>
                      ) : (
                        <p key={i} className="mb-4">{para.trim()}</p>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar - right 1/3 */}
        <div className="space-y-4">
          {/* Actions */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 space-y-2">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Actions</p>
            <a href={getDownloadUrl(filename!)} download={filename}
              className="w-full flex items-center justify-center gap-2 bg-green-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-green-700">
              Download {filename?.split(".").pop()?.toUpperCase()}
            </a>
            <button onClick={handleReview} disabled={reviewLoading}
              className="w-full bg-slate-800 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-slate-900 disabled:opacity-50">
              {reviewLoading ? "Reviewing..." : "Review Document"}
            </button>
          </div>

          {/* Review results */}
          {review && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Review</p>
                <div className="flex items-center gap-2">
                  <span className={`text-lg font-bold ${review.score >= 7 ? "text-green-600" : review.score >= 5 ? "text-yellow-600" : "text-red-600"}`}>
                    {review.score}/10
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${review.brand_compliance ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                    {review.brand_compliance ? "✓ Brand" : "✗ Brand"}
                  </span>
                </div>
              </div>
              {review.strengths?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 mb-1">Strengths</p>
                  <ul className="text-xs text-gray-600 space-y-1">
                    {review.strengths.map((s: string, i: number) => <li key={i} className="flex gap-1"><span className="text-green-500">✓</span>{s}</li>)}
                  </ul>
                </div>
              )}
              {review.issues?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 mb-1">Issues</p>
                  <ul className="text-xs text-red-500 space-y-1">
                    {review.issues.map((s: string, i: number) => <li key={i} className="flex gap-1"><span>✗</span>{s}</li>)}
                  </ul>
                </div>
              )}
              {review.suggestions?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 mb-1">Suggestions</p>
                  <ul className="text-xs text-slate-600 space-y-1">
                    {review.suggestions.map((s: string, i: number) => <li key={i} className="flex gap-1"><span className="text-blue-400">→</span>{s}</li>)}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Update */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 space-y-2">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Request Changes</p>
            <textarea value={updateFeedback} onChange={(e) => setUpdateFeedback(e.target.value)}
              rows={3} placeholder="e.g. Add a pricing section, make tone more formal..."
              className="w-full border rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-green-400 resize-none" />
            <button onClick={handleUpdate} disabled={updateLoading || updateFeedback.trim().length < 5}
              className="w-full bg-green-600 text-white py-2 rounded-lg text-xs font-medium hover:bg-green-700 disabled:opacity-40">
              {updateLoading ? "Updating..." : "Update Document"}
            </button>
          </div>

          {/* Rating */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 space-y-2">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Rate Output</p>
            {!feedbackSent ? (
              <>
                <div className="flex gap-1.5">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button key={n} onClick={() => setRating(n)}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-medium border transition-all ${rating === n ? "bg-green-600 text-white border-green-600" : "border-gray-200 text-gray-500 hover:border-green-400"}`}>
                      {n}
                    </button>
                  ))}
                </div>
                <button onClick={handleFeedback}
                  className="w-full bg-slate-800 text-white py-2 rounded-lg text-xs font-medium hover:bg-slate-900">
                  Submit Rating
                </button>
              </>
            ) : (
              <p className="text-xs text-green-600 text-center py-1">Rating saved — thanks!</p>
            )}
          </div>

          {error && <p className="text-xs text-red-500 bg-red-50 p-3 rounded-lg">{error}</p>}
        </div>
      </div>
    </div>
  );
}

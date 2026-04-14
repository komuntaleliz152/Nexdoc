"use client";
import { useEffect, useState } from "react";
import { getDownloadUrl } from "../lib/api";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface HistoryItem {
  doc_id: string;
  topic: string;
  doc_type: string;
  output_format: string;
  brand_id: string;
  filename: string;
  created_at: string;
}

export default function HistoryList() {
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const res = await fetch(`${BASE_URL}/history`);
    const data = await res.json();
    setItems(data);
    setLoading(false);
  };

  const handleDelete = async (doc_id: string, topic: string) => {
    if (!confirm(`Delete "${topic}"? This cannot be undone.`)) return;
    await fetch(`${BASE_URL}/history/${doc_id}`, { method: "DELETE" });
    setItems((prev) => prev.filter((i) => i.doc_id !== doc_id));
  };

  useEffect(() => { load(); }, []);

  if (loading) return <p className="text-sm text-gray-400">Loading history...</p>;
  if (items.length === 0) return (
    <div className="bg-white p-6 rounded-xl shadow text-center text-gray-400 text-sm">
      No documents generated yet.
    </div>
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-800">Document History</h2>
        <span className="text-xs text-gray-400">{items.length} document{items.length !== 1 ? "s" : ""}</span>
      </div>
      {items.map((item) => (
        <div key={item.doc_id} className="bg-white p-4 rounded-xl shadow flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-800 truncate">{item.topic}</p>
            <div className="flex gap-2 mt-1 flex-wrap">
              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full capitalize">{item.doc_type}</span>
              <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full uppercase">{item.output_format}</span>
              <span className="text-xs text-gray-400">
                {new Date(item.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
              </span>
            </div>
          </div>
          <div className="flex gap-2 shrink-0">
            <a href={getDownloadUrl(item.filename)} download={item.filename}
              className="text-xs bg-green-600 text-white px-3 py-1.5 rounded-lg hover:bg-green-700">
              Download
            </a>
            <button onClick={() => handleDelete(item.doc_id, item.topic)}
              className="text-xs bg-red-50 text-red-500 px-3 py-1.5 rounded-lg hover:bg-red-100">
              Delete
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

"use client";
import { useEffect, useState } from "react";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface Skill {
  skill: string;
  doc_type: string;
  industry: string;
  source: string;
}

export default function SkillsList() {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const [newSkill, setNewSkill] = useState({ skill: "", doc_type: "general", industry: "general" });
  const [adding, setAdding] = useState(false);

  const load = async () => {
    setLoading(true);
    const res = await fetch(`${BASE_URL}/skills`);
    const data = await res.json();
    setSkills(data);
    setLoading(false);
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSkill.skill.trim()) return;
    setAdding(true);
    await fetch(`${BASE_URL}/skills`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newSkill),
    });
    setNewSkill({ skill: "", doc_type: "general", industry: "general" });
    await load();
    setAdding(false);
  };

  useEffect(() => { load(); }, []);

  const autoSkills = skills.filter(s => s.source === "auto");
  const manualSkills = skills.filter(s => s.source === "manual");

  return (
    <div className="space-y-6">
      {/* Info banner */}
      <div className="bg-green-50 border border-green-200 rounded-xl p-4">
        <p className="text-sm font-medium text-green-800">How skills work</p>
        <p className="text-xs text-green-700 mt-1">
          The agent automatically extracts writing patterns from high-scoring documents (8+/10).
          These skills are injected into future prompts, making every generation smarter over time.
        </p>
      </div>

      {/* Auto-learned skills */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-gray-800">Auto-learned Skills</p>
          <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">{autoSkills.length} skills</span>
        </div>
        {loading ? (
          <p className="text-xs text-gray-400">Loading...</p>
        ) : autoSkills.length === 0 ? (
          <p className="text-xs text-gray-400">No skills learned yet. Generate and rate more documents to build skills.</p>
        ) : (
          <ul className="space-y-2">
            {autoSkills.map((s, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-gray-700 bg-gray-50 rounded-lg p-3">
                <span className="text-green-500 mt-0.5">✦</span>
                <div className="flex-1">
                  <p>{s.skill}</p>
                  <div className="flex gap-2 mt-1">
                    <span className="text-gray-400 capitalize">{s.doc_type}</span>
                    {s.industry !== "general" && <span className="text-gray-400">· {s.industry}</span>}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Manual skills */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 space-y-3">
        <p className="text-sm font-semibold text-gray-800">Manual Skills</p>
        <p className="text-xs text-gray-500">Add your own writing rules the agent should always follow.</p>

        <form onSubmit={handleAdd} className="space-y-2">
          <textarea value={newSkill.skill} onChange={(e) => setNewSkill({ ...newSkill, skill: e.target.value })}
            rows={2} placeholder="e.g. Always end proposals with a clear call to action and next steps"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-green-400 resize-none" />
          <div className="grid grid-cols-2 gap-2">
            <select value={newSkill.doc_type} onChange={(e) => setNewSkill({ ...newSkill, doc_type: e.target.value })}
              className="border border-gray-200 rounded-lg px-3 py-2 text-xs">
              {["general", "report", "proposal", "presentation", "brief"].map(t => <option key={t}>{t}</option>)}
            </select>
            <input value={newSkill.industry} onChange={(e) => setNewSkill({ ...newSkill, industry: e.target.value })}
              placeholder="Industry (e.g. beauty)" className="border border-gray-200 rounded-lg px-3 py-2 text-xs" />
          </div>
          <button type="submit" disabled={adding || !newSkill.skill.trim()}
            className="w-full bg-green-600 text-white py-2 rounded-lg text-xs font-medium hover:bg-green-700 disabled:opacity-50">
            {adding ? "Adding..." : "Add Skill"}
          </button>
        </form>

        {manualSkills.length > 0 && (
          <ul className="space-y-2 pt-2 border-t">
            {manualSkills.map((s, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-gray-700 bg-gray-50 rounded-lg p-3">
                <span className="text-blue-400 mt-0.5">◆</span>
                <p className="flex-1">{s.skill}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

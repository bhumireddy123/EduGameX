import React from "react";
import { Link } from "react-router";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Brain, Clock, ShieldAlert } from "lucide-react";

const mockData = [
  { name: 'Memory', score: 85, avg: 65 },
  { name: 'Reaction', score: 72, avg: 70 },
  { name: 'Logical', score: 45, avg: 60 },
  { name: 'Numerical', score: 90, avg: 55 },
];

export default function Analytics() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8 border-b border-slate-200 pb-6">
        <h1 className="text-3xl font-bold text-slate-900">Performance Analytics</h1>
        <p className="text-slate-600 mt-2">Deep dive into your cognitive strengths and weaknesses.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 mb-2 text-indigo-600">
            <Brain size={20} />
            <h3 className="font-bold">Strongest Area</h3>
          </div>
          <p className="text-2xl font-extrabold text-slate-900">Numerical Ability</p>
          <p className="text-sm text-slate-500 mt-1">Top 15% of all users</p>
        </div>
        
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 mb-2 text-red-500">
            <ShieldAlert size={20} />
            <h3 className="font-bold">Needs Improvement</h3>
          </div>
          <p className="text-2xl font-extrabold text-slate-900">Logical Deduction</p>
          <p className="text-sm text-slate-500 mt-1">Bottom 40% of all users</p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 mb-2 text-emerald-600">
            <Clock size={20} />
            <h3 className="font-bold">Avg. Reaction</h3>
          </div>
          <p className="text-2xl font-extrabold text-slate-900">245 ms</p>
          <p className="text-sm text-slate-500 mt-1">Excellent speed</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm mb-8">
        <h2 className="text-xl font-bold text-slate-900 mb-6">Skill Comparison</h2>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={mockData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} />
              <YAxis axisLine={false} tickLine={false} />
              <Tooltip cursor={{fill: '#f8fafc'}} />
              <Bar dataKey="score" name="Your Score" fill="#4f46e5" radius={[4, 4, 0, 0]} />
              <Bar dataKey="avg" name="Global Average" fill="#cbd5e1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <p className="text-center text-sm text-slate-500 mt-4">*Note: Chart currently showing simulated data until you play more games.</p>
      </div>

      <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-6 text-center">
        <h3 className="text-xl font-bold text-indigo-900 mb-2">Ready to improve your logical deduction?</h3>
        <p className="text-indigo-700 mb-6">Practice targeted exercises that simulate Capgemini's latest hiring rounds.</p>
        <Link to="/games" className="inline-block bg-indigo-600 text-white px-6 py-3 rounded-full font-bold hover:bg-indigo-700 transition">
          Start Practice Routine
        </Link>
      </div>
    </div>
  );
}

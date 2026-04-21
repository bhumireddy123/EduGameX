import React from "react";
import { Link } from "react-router";
import { motion } from "motion/react";
import { ArrowRight, Brain, Target, Zap, ShieldCheck, Trophy, Users } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="flex flex-col flex-1">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-white pt-24 pb-32 px-4 text-center">
        <div className="absolute inset-0 z-0 opacity-30 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#4f46e5 1px, transparent 1px)', backgroundSize: '32px 32px' }}></div>
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="container mx-auto max-w-4xl relative z-10"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-600 text-sm font-semibold mb-6">
            <Trophy size={16} /> #1 Platform for Gamified MNC Hiring
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold text-slate-900 tracking-tight leading-tight mb-8">
            Crack MNC Hiring Games with <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-500">Confidence</span>
          </h1>
          <p className="text-xl text-slate-600 mb-10 max-w-2xl mx-auto leading-relaxed">
            Stop practicing outdated MCQs. Prepare for Accenture, Capgemini, and Cognizant with our interactive, AI-driven gamified aptitude and communication simulators.
          </p>
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
            <Link to="/signup" className="flex items-center gap-2 bg-indigo-600 text-white px-8 py-4 rounded-full font-bold text-lg hover:bg-indigo-700 hover:shadow-lg hover:shadow-indigo-200 transition-all active:scale-95">
              Start Practicing Free <ArrowRight size={20} />
            </Link>
            <Link to="/games" className="flex items-center gap-2 bg-white text-slate-700 border-2 border-slate-200 px-8 py-4 rounded-full font-bold text-lg hover:border-slate-300 hover:bg-slate-50 transition-all active:scale-95">
              Explore Games
            </Link>
          </div>
        </motion.div>
      </section>

      {/* Features / Company Highlight */}
      <section className="py-24 bg-slate-50 px-4 border-t border-slate-200">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Simulate Real Company Assessments</h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">Our games are reverse-engineered from actual hiring rounds of top tier MNCs.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <motion.div whileHover={{ y: -5 }} className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm">
              <div className="w-14 h-14 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-6">
                <Target size={28} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Accenture Mode</h3>
              <p className="text-slate-600 mb-6">Master cognitive assessment games including grid navigation, memory patterns, and numerical reasoning tasks.</p>
            </motion.div>
            
            <motion.div whileHover={{ y: -5 }} className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                <Zap size={100} />
              </div>
              <div className="w-14 h-14 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center mb-6 relative z-10">
                <Brain size={28} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Capgemini Mode</h3>
              <p className="text-slate-600 mb-6">Practice game-based evaluations with high-stress reaction timers and logical deduction scenarios.</p>
            </motion.div>

            <motion.div whileHover={{ y: -5 }} className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm">
              <div className="w-14 h-14 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-6">
                <ShieldCheck size={28} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Cognizant Mode</h3>
              <p className="text-slate-600 mb-6">Interactive time-based assessments focusing on data interpretation and rapid decision making.</p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats/Testimonial Placeholder */}
      <section className="py-24 bg-white px-4">
        <div className="container mx-auto max-w-5xl text-center">
          <h2 className="text-3xl font-bold text-slate-900 mb-12">Why Students Choose HireGame</h2>
          <div className="grid md:grid-cols-3 gap-12">
            <div>
              <div className="text-5xl font-extrabold text-indigo-600 mb-4">50k+</div>
              <p className="text-lg text-slate-600 font-medium">Students Placed</p>
            </div>
            <div>
              <div className="text-5xl font-extrabold text-indigo-600 mb-4">15+</div>
              <p className="text-lg text-slate-600 font-medium">Interactive Games</p>
            </div>
            <div>
              <div className="text-5xl font-extrabold text-indigo-600 mb-4">98%</div>
              <p className="text-lg text-slate-600 font-medium">Success Rate</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

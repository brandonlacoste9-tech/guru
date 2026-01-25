'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Brain,
  Target,
  Mic,
  Video,
  Plus,
  Save,
  ChevronRight,
  Shield,
  Zap,
  Bot
} from 'lucide-react';
import { CopilotPopup } from "@copilotkit/react-ui";
import { useCopilotAction } from "@copilotkit/react-core";
import { InteractiveRecorder } from '@/components/guru-builder/InteractiveRecorder';
import { VisualBuilder } from '@/components/guru-builder/VisualBuilder/VisualBuilder';

interface PageStep {
  type: string;
  payload: Record<string, unknown>;
  timestamp?: string;
  id?: string;
  order?: number;
  enabled?: boolean;
}

export default function GuruBuilderPage() {
  const [viewMode, setViewMode] = useState<'simple' | 'visual'>('visual'); // Default to visual for P0
  const [formData, setFormData] = useState({
    name: '',
    personality: 'motivator',
    mission: '',
    category: 'custom'
  });
  const [steps, setSteps] = useState<PageStep[]>([]);
  const [showRecorder, setShowRecorder] = useState(false);

  useCopilotAction({
    name: "updateGuruIdentity",
    description: "Update the Guru's identity fields (name, personality, mission) based on user consultation.",
    parameters: [
      { name: "name", type: "string", description: "Name of the Guru" },
      { name: "personality", type: "string", description: "Personality ID (motivator, zen_master, analyst, professional)" },
      { name: "mission", type: "string", description: "The Guru's mission statement" },
      { name: "category", type: "string", description: "Category (custom, productivity, fitness, mindfulness, learning)" }
    ],
    handler: async ({ name, personality, mission, category }) => {
      setFormData(prev => ({
        ...prev,
        ...(name && { name }),
        ...(personality && { personality }),
        ...(mission && { mission }),
        ...(category && { category })
      }));
      return "Guru identity updated successfully.";
    }
  });

  const personalities = [
    { id: 'motivator', name: 'Motivator', icon: '🔥', desc: "Let's crush it! 💪" },
    { id: 'zen_master', name: 'Zen Master', icon: '🙏', desc: "One step at a time." },
    { id: 'analyst', name: 'Analyst', icon: '📊', desc: "Data doesn't lie." },
    { id: 'professional', name: 'Pro', icon: '💼', desc: "Efficient and direct." },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-cyan-500/30">

      {showRecorder && (
        <InteractiveRecorder
          onCancel={() => setShowRecorder(false)}
          onSave={(newSteps) => {
            setSteps(prev => [...prev, ...newSteps]);
            setShowRecorder(false);
          }}
        />
      )}

      {/* Background patterns */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 blur-[120px] rounded-full" />
      </div>

      {/* Header */}
      <header className="relative z-10 border-b border-slate-900 bg-slate-950/50 backdrop-blur-md px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-linear-to-br from-cyan-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <Bot className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-xl font-bold bg-linear-to-r from-white to-slate-400 bg-clip-text text-transparent">
            Guru Factory <span className="text-slate-600 font-medium font-mono text-sm ml-2">v8.0</span>
          </h1>
        </div>

        {/* View Switcher */}
        <div className="flex bg-slate-900 rounded-lg p-1 border border-slate-800">
          <button
            onClick={() => setViewMode('simple')}
            className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all ${viewMode === 'simple' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
          >
            Simple
          </button>
          <button
            onClick={() => setViewMode('visual')}
            className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all ${viewMode === 'visual' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
          >
            Visual Studio
          </button>
        </div>

        <div className="flex items-center gap-4">
          <button className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-white transition-colors">
            Cancel
          </button>
          <button
            onClick={async () => {
              if (!formData.name) return alert("Please name your Guru");
              try {
                const res = await fetch('http://localhost:4000/api/gurus', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    name: formData.name,
                    description: formData.mission,
                    category: formData.category,
                    personality: formData.personality,
                    // If we have steps, we might want to create an automation too, 
                    // but for now let's just create the Guru identity
                  })
                });
                if (res.ok) {
                  alert("Guru Created Successfully!");
                  window.location.href = '/gurus';
                } else {
                  throw new Error("Failed to create Guru");
                }
              } catch (e) {
                console.error(e);
                alert("Error saving Guru");
              }
            }}
            className="flex items-center gap-2 px-6 py-2 bg-white text-slate-950 rounded-xl font-bold hover:bg-slate-200 transition-all shadow-lg shadow-white/5 active:scale-95"
          >
            <Save className="w-4 h-4" /> Save Guru
          </button>
        </div>
      </header>

      <main className="relative z-10 container mx-auto px-6 py-8 h-[calc(100vh-80px)]">
        {viewMode === 'visual' ? (
          <div className="h-full bg-slate-900/50 border border-slate-800 rounded-3xl overflow-hidden backdrop-blur-sm">
            <VisualBuilder
              initialTemplate={{
                name: formData.name,
                steps: steps.map((s, i) => ({ ...s, id: i.toString(), order: i, enabled: true }))
              }}
              onSave={(template) => console.log('Saved', template)}
              onRun={(template) => console.log('Running', template)}
            />
          </div>
        ) : (
          <div className="grid grid-cols-12 gap-8 h-full">

            {/* Left Column: Configuration */}
            <div className="col-span-12 lg:col-span-4 space-y-6">

              {/* Identity Card */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-slate-900/40 border border-slate-800 rounded-3xl p-6 backdrop-blur-sm"
              >
                <div className="flex items-center gap-2 mb-6">
                  <Brain className="w-5 h-5 text-cyan-400" />
                  <h2 className="text-sm font-bold uppercase tracking-widest text-slate-400">Guru Identity</h2>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Guru Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Health Nut, Wealth Wiz..."
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-hidden focus:border-cyan-500 transition-colors"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Personality Type</label>
                    <div className="grid grid-cols-2 gap-2">
                      {personalities.map((p) => (
                        <button
                          key={p.id}
                          onClick={() => setFormData({ ...formData, personality: p.id })}
                          className={`p-3 rounded-xl border transition-all text-left ${formData.personality === p.id
                            ? 'bg-cyan-500/10 border-cyan-500 text-white'
                            : 'bg-slate-950/50 border-slate-800 text-slate-400 hover:border-slate-700'
                            }`}
                        >
                          <span className="text-xl mb-1 block">{p.icon}</span>
                          <div className="text-sm font-bold">{p.name}</div>
                          <div className="text-[10px] opacity-60 leading-tight mt-1">{p.desc}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Mission Card */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-slate-900/40 border border-slate-800 rounded-3xl p-6 backdrop-blur-sm"
              >
                <div className="flex items-center gap-2 mb-6">
                  <Target className="w-5 h-5 text-purple-400" />
                  <h2 className="text-sm font-bold uppercase tracking-widest text-slate-400">Mission Statement</h2>
                </div>

                <textarea
                  rows={4}
                  placeholder="What is this Guru's ultimate goal? (e.g. Help me find the cheapest flights every Sunday, or ensure I never miss a gym class...)"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-hidden focus:border-purple-500 transition-colors resize-none mb-4"
                  value={formData.mission}
                  onChange={(e) => setFormData({ ...formData, mission: e.target.value })}
                />

                <div className="flex items-center gap-2 p-3 bg-purple-500/10 border border-purple-500/20 rounded-xl">
                  <Shield className="w-4 h-4 text-purple-400" />
                  <p className="text-[10px] text-purple-200/60 uppercase font-bold tracking-tighter">
                    This mission defines the Guru&apos;s autonomous reasoning core.
                  </p>
                </div>
              </motion.div>
            </div>

            {/* Right Column: Teaching Area (The Bento Grid) */}
            <div className="col-span-12 lg:col-span-8 space-y-8">

              {/* Main Action Area */}
              <div className="grid grid-cols-2 gap-6">

                {/* Record Action */}
                <motion.div
                  onClick={() => setShowRecorder(true)}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="col-span-2 md:col-span-1 bg-linear-to-br from-cyan-600/20 to-slate-900 border border-cyan-500/30 rounded-3xl p-8 flex flex-col items-center justify-center text-center group hover:border-cyan-500/50 transition-all cursor-pointer shadow-lg shadow-cyan-500/5"
                >
                  <div className="w-20 h-20 bg-cyan-500 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500 shadow-2xl shadow-cyan-500/25">
                    <Video className="w-10 h-10 text-slate-950" />
                  </div>
                  <h3 className="text-2xl font-bold mb-2">Record Interaction</h3>
                  <p className="text-slate-400 text-sm max-w-[200px]">
                    Open browser and demonstrate the task to your Guru.
                  </p>
                </motion.div>

                {/* Write Instruction */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="col-span-2 md:col-span-1 bg-linear-to-br from-purple-600/20 to-slate-900 border border-purple-500/30 rounded-3xl p-8 flex flex-col items-center justify-center text-center group hover:border-purple-500/50 transition-all cursor-pointer shadow-lg shadow-purple-500/5"
                >
                  <div className="w-20 h-20 bg-purple-500 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500 shadow-2xl shadow-purple-500/25">
                    <Mic className="w-10 h-10 text-slate-950" />
                  </div>
                  <h3 className="text-2xl font-bold mb-2">Voice Command</h3>
                  <p className="text-slate-400 text-sm max-w-[200px]">
                    Just tell your Guru what to do. They&apos;ll figure out the steps.
                  </p>
                </motion.div>

                {/* Steps List (Simple Mode) */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="col-span-2 bg-slate-900/40 border border-slate-800 rounded-3xl p-8 backdrop-blur-sm"
                >
                  <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-2">
                      <Zap className="w-5 h-5 text-amber-400" />
                      <h2 className="text-sm font-bold uppercase tracking-widest text-slate-400">Recorded Steps</h2>
                    </div>
                    <button onClick={() => setSteps([])} className="text-xs font-bold text-cyan-400 hover:text-cyan-300">
                      Clear All
                    </button>
                  </div>

                  <div className="space-y-4">
                    {steps.map((s, i) => (
                      <div key={i} className="flex items-center gap-4 p-4 bg-slate-950/50 border border-slate-800 rounded-2xl group hover:border-slate-700 transition-colors">
                        <div className="w-8 h-8 rounded-full bg-slate-900 flex items-center justify-center text-xs font-bold text-slate-500">{i + 1}</div>
                        <div className="flex-1">
                          <div className="text-sm font-bold uppercase text-slate-200">{s.type}</div>
                          <div className="text-[10px] text-slate-500 font-mono truncate">{JSON.stringify(s.payload)}</div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-600" />
                      </div>
                    ))}
                    {steps.length === 0 && (
                      <div className="text-center text-slate-500 py-4 italic">No steps yet. Start recording!</div>
                    )}

                    <button className="w-full py-4 border-2 border-dashed border-slate-800 rounded-2xl flex items-center justify-center gap-2 text-slate-500 hover:text-slate-300 hover:border-slate-700 transition-all font-bold text-sm">
                      <Plus className="w-4 h-4" /> Add Manual Step
                    </button>
                  </div>
                </motion.div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Copilot Sidebar */}
      <CopilotPopup
        instructions={`
          You are the Guru Architect.
          Your goal is to conduct a "Guru Consultation" to design the perfect AI assistant for the user.
          
          1. Ask questions to understand their needs (e.g., "What area of life do you want to improve?", "Do you prefer a drill sergeant or a zen master?").
          2. As they answer, use the 'updateGuruIdentity' tool to fill out the form for them.
          3. Suggest a creative name and mission statement if they are stuck.
          4. Once the identity is set, ask if they want to define some initial skills or automations.
          
          Make the experience feel like a premium consultation with an expert system designer.
        `}
        labels={{
          title: "Guru Architect",
          initial: "Hello. I am the Guru Architect. Let's design your ideal AI companion. What aspect of your life needs optimizing?",
        }}
      />
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSocket } from '@/hooks/useSocket';
import { Radio, Zap, Activity, Users } from 'lucide-react';

interface GuruStatus {
  id: string;
  name: string;
  state: 'idle' | 'running' | 'healing' | 'completed' | 'error';
  missionId?: string;
  currentTask?: string;
  lastSeen: number;
}

const GuruIndicator = ({ guru, isActive }: { guru: GuruStatus; isActive: boolean }) => {
  const getStateColor = (state: string) => {
    switch (state) {
      case 'running': return 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]';
      case 'healing': return 'bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]';
      case 'error': return 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]';
      case 'completed': return 'bg-blue-500';
      default: return 'bg-slate-500';
    }
  };

  const getStateIcon = (state: string) => {
    switch(state) {
        case 'healing': return <Zap className="w-3 h-3 text-amber-100" />
        case 'running': return <Activity className="w-3 h-3 text-green-100" />
        default: return null;
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 10 }}
      className={`flex items-center gap-3 p-3 rounded-xl mb-2 transition-colors ${
        isActive ? 'bg-slate-800/80 border border-slate-700' : 'bg-slate-900/50'
      }`}
    >
      <div className="relative">
        <div className={`w-3 h-3 rounded-full ${getStateColor(guru.state)}`} >
             {guru.state === 'running' && (
                 <div className="absolute inset-0 rounded-full animate-ping bg-green-500 opacity-75" />
             )}
        </div>
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
           <span className="font-bold text-sm text-slate-200 truncate">{guru.name}</span>
           <span className="text-[10px] text-slate-500 tabular-nums">
              {Math.floor((Date.now() - guru.lastSeen) / 1000)}s
           </span>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5 truncate h-4">
          {getStateIcon(guru.state)}
          <span className="truncate">
             {guru.currentTask || guru.state}
          </span>
        </div>
      </div>
    </motion.div>
  );
};

export default function GuruRadar() {
  const { socket } = useSocket();
  const [activeGurus, setActiveGurus] = useState<Map<string, GuruStatus>>(new Map());
  const [pulse, setPulse] = useState(false);

  useEffect(() => {
    if (!socket) return;
    
    // Join the swarm feed
    socket.emit('join_swarm');

    socket.on('swarm_update', (event: { type: string; data: GuruStatus }) => {
      if (event.type === 'status') {
        setActiveGurus(prev => {
           const next = new Map(prev);
           // If completed, maybe keep it for a bit then remove?
           // For now just update
           next.set(event.data.id, event.data);
           setPulse(true);
           setTimeout(() => setPulse(false), 200);
           return next;
        });
      }
    });

    // Cleanup interval for stale gurus
    const interval = setInterval(() => {
       const now = Date.now();
       setActiveGurus(prev => {
           const next = new Map(prev);
           let changed = false;
           next.forEach((guru, id) => {
               if (now - guru.lastSeen > 60000) { // Remove after 60s of silence
                   next.delete(id);
                   changed = true;
               }
           });
           return changed ? next : prev;
       });
    }, 5000);

    return () => {
        socket.off('swarm_update');
        clearInterval(interval);
    }
  }, [socket]);

  const sortedGurus = Array.from(activeGurus.values()).sort((a, b) => b.lastSeen - a.lastSeen);

  return (
    <div className="bg-slate-950/50 border border-slate-800 rounded-3xl p-6 overflow-hidden relative">
       {/* Radar Background Effect */}
       <div className="absolute top-0 right-0 p-6 opacity-20 pointer-events-none">
           <Radio className={`w-24 h-24 text-blue-500 transition-opacity duration-1000 ${pulse ? 'opacity-100' : 'opacity-20'}`} />
       </div>

      <div className="flex justify-between items-center mb-6 relative z-10">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Radio className="w-5 h-5 text-blue-500" />
            Swarm Radar
        </h3>
        <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-3 py-1 rounded-full">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span className="text-xs font-bold text-slate-400">{activeGurus.size} Active</span>
        </div>
      </div>
      
      <div className="space-y-1 min-h-[100px] relative z-10">
        <AnimatePresence mode="popLayout">
            {sortedGurus.length > 0 ? (
              sortedGurus.map((guru) => (
                <GuruIndicator 
                  key={guru.id} 
                  guru={guru} 
                  isActive={guru.state === 'running' || guru.state === 'healing'} 
                />
              ))
            ) : (
              <motion.div 
                 initial={{ opacity: 0 }}
                 animate={{ opacity: 1 }}
                 className="flex flex-col items-center justify-center py-8 text-slate-600 gap-2"
              >
                <Users className="w-8 h-8 opacity-50" />
                <span className="text-sm font-medium">No active signals</span>
              </motion.div>
            )}
        </AnimatePresence>
      </div>

       <div className="mt-4 pt-4 border-t border-slate-800/50 flex justify-between items-center">
            <span className="text-[10px] text-slate-600 font-bold uppercase tracking-wider">
                Network: Redis Pub/Sub
            </span>
            <div className="flex gap-1">
                 <div className="w-1 h-1 bg-slate-700 rounded-full" />
                 <div className="w-1 h-1 bg-slate-700 rounded-full" />
                 <div className="w-1 h-1 bg-slate-700 rounded-full" />
            </div>
       </div>
    </div>
  );
}

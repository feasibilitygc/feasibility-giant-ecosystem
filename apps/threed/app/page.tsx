"use client";

import { FgButton, FgCard, FgGlassCard } from "@fg/ui";
import { motion } from "framer-motion";
import { 
  Binary, 
  Cpu, 
  Layers, 
  Settings2, 
  Activity, 
  Wind, 
  Microscope,
  ArrowUpRight
} from "lucide-react";

export default function ThreeDHome() {
  return (
    <main className="relative z-10 overflow-hidden">
      {/* ── HERO SECTION ── */}
      <section className="min-h-screen flex flex-col items-center justify-center text-center px-6 pt-20 relative">
        {/* Engineering Scan Line */}
        <motion.div 
          animate={{ top: ["0%", "100%"] }}
          transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
          className="absolute left-0 right-0 h-[1px] bg-blue/30 -z-10"
        />

        {/* Blueprint Decorative Elements */}
        <div className="absolute top-40 left-20 w-8 h-8 border-t border-l border-blue/40" />
        <div className="absolute top-40 right-20 w-8 h-8 border-t border-r border-blue/40" />
        <div className="absolute bottom-40 left-20 w-8 h-8 border-b border-l border-blue/40" />
        <div className="absolute bottom-40 right-20 w-8 h-8 border-b border-r border-blue/40" />

        <div className="absolute inset-0 -z-20 bg-[radial-gradient(ellipse_80%_60%_at_50%_-5%,rgba(0,123,255,0.18)_0%,transparent_60%),radial-gradient(ellipse_40%_40%_at_90%_70%,rgba(255,107,0,0.08)_0%,transparent_50%),#030608]" />
        
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <div className="inline-flex items-center gap-3 bg-blue/10 border border-blue/30 px-5 py-2 rounded-sm text-[12px] font-rajdhani font-bold uppercase tracking-[0.2em] text-blue-300 mb-8">
            <span className="w-1.5 h-1.5 bg-orange animate-pulse" />
            V1.0.0-Beta · Simulation Engine
          </div>
          
          <h1 className="font-rajdhani text-[clamp(3rem,9vw,8rem)] leading-[0.9] font-bold mb-4">
            <span className="block text-white">ADVANCED ENGINEERING</span>
            <span className="block bg-gradient-to-r from-blue-400 via-blue to-blue-dark bg-clip-text text-transparent">
              SIMULATION PLATFORM
            </span>
          </h1>

          <p className="font-rajdhani text-orange text-xl uppercase tracking-[0.4em] mb-8">Precision. Complexity. Reality.</p>
          
          <p className="max-w-2xl mx-auto text-white/50 text-lg mb-12 leading-relaxed italic font-light">
            Empowering EPCs and environmental agencies with high-fidelity 3D modeling and complex system simulations for oil, gas, and renewable infrastructure.
          </p>
          
          <div className="flex flex-wrap justify-center gap-4 mb-20">
            <FgButton product="threed" size="lg" className="px-10 h-14 text-base rounded-none">
              Initialize Project
            </FgButton>
            <FgButton variant="outline" size="lg" className="px-10 h-14 text-base rounded-none border-orange/40 text-orange">
              View Whitepaper
            </FgButton>
          </div>
        </motion.div>

        {/* Tech Specs Strip */}
        <motion.div 
           initial={{ opacity: 0 }} 
           animate={{ opacity: 1 }} 
           transition={{ delay: 1 }}
           className="grid grid-cols-4 border border-blue/20 bg-blue/5 backdrop-blur-sm max-w-4xl w-full"
        >
           {[
             { label: "Core Engine", val: "WASM-THREE" },
             { label: "Precision", val: "64-bit Float" },
             { label: "Data Rate", val: "4.2 GB/s" },
             { label: "Latency", val: "<12ms" }
           ].map((spec, i) => (
             <div key={i} className={`p-4 text-center ${i < 3 ? 'border-r border-blue/20' : ''}`}>
                <p className="text-[9px] font-bold text-white/30 uppercase tracking-widest mb-1">{spec.label}</p>
                <p className="font-rajdhani text-white text-sm font-semibold">{spec.val}</p>
             </div>
           ))}
        </motion.div>
      </section>

      {/* ── SOLUTIONS GRID ── */}
      <section className="py-32 px-10 max-w-7xl mx-auto">
        <div className="mb-20">
           <div className="inline-flex items-center gap-3 text-blue-400 text-[12px] font-rajdhani font-bold uppercase tracking-[0.3em] mb-4">
              <div className="w-12 h-[1px] bg-blue" />
              Technical Solutions
           </div>
           <h2 className="font-rajdhani text-7xl font-bold">MODELLING <br /> THE IMPOSSIBLE.</h2>
        </div>

        <div className="grid md:grid-cols-2 gap-[1px] bg-blue/10 border border-blue/20 rounded-2xl overflow-hidden">
           {[
             { title: "Fluid Dynamics (CFD)", icon: Wind, num: "01", desc: "Complex gas and liquid flow simulation for pipeline stress analysis and environmental impact." },
             { title: "Structural Analysis", icon: Layers, num: "02", desc: "High-precision finite element analysis (FEA) for offshore rigs and subsea architecture." },
             { title: "Geospatial Intelligence", icon: Activity, num: "03", desc: "Integration of LIDAR and satellite data into interactive 3D environmental twins." },
             { title: "Process Automation", icon: Settings2, num: "04", desc: "Simulation-driven automation for industrial plant workflows and safety protocols." }
           ].map((sol, i) => (
             <div key={i} className="bg-[#030608] p-12 group hover:bg-blue/[0.02] transition-colors relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue/5 blur-[60px] opacity-0 group-hover:opacity-100 transition-opacity" />
                <p className="font-rajdhani text-blue/30 text-xs font-bold tracking-widest mb-4">{sol.num}</p>
                <div className="w-16 h-16 rounded-lg bg-blue/10 flex items-center justify-center text-blue mb-8">
                  <sol.icon className="w-8 h-8" />
                </div>
                <h3 className="font-rajdhani text-2xl font-bold mb-4 tracking-wide uppercase">{sol.title}</h3>
                <p className="text-white/40 text-sm leading-relaxed mb-8">{sol.desc}</p>
                <div className="flex items-center gap-2 text-blue text-xs font-bold uppercase tracking-widest cursor-pointer">
                  Technical Docs <ArrowUpRight className="w-4 h-4" />
                </div>
             </div>
           ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-32 px-10 border-y border-blue/10 bg-gradient-to-tr from-blue/5 to-transparent relative">
         <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] pointer-events-none" />
         <div className="max-w-4xl mx-auto text-center">
            <h2 className="font-rajdhani text-7xl font-bold mb-8 uppercase">Initialize Your <br /> Reality Engine.</h2>
            <p className="text-white/50 text-xl max-w-xl mx-auto mb-12">Contact our technical team for custom simulation development and integration.</p>
            <div className="flex justify-center gap-6">
               <FgButton product="threed" size="lg" className="h-16 px-12 rounded-none uppercase tracking-widest">Connect to Core</FgButton>
               <FgButton variant="outline" size="lg" className="h-16 px-12 rounded-none uppercase tracking-widest">Request Demo</FgButton>
            </div>
         </div>
      </section>
    </main>
  );
}

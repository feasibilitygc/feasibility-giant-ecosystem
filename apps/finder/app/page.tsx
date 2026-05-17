"use client";

import { FgButton, FgCard, FgGlassCard } from "@fg/ui";
import { motion } from "framer-motion";
import { ShieldCheck, MapPin, AlertTriangle, PhoneCall, Download, CheckCircle2 } from "lucide-react";

export default function FinderHome() {
  return (
    <main className="relative z-10 overflow-hidden">
      {/* ── HERO SECTION ── */}
      <section className="min-h-screen flex flex-col items-center justify-center text-center px-6 pt-20 relative">
        {/* Scanning Line Animation */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <motion.div 
            animate={{ top: ["0%", "100%", "0%"] }}
            transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
            className="absolute left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-green/40 to-transparent z-20"
          />
        </div>

        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_70%_60%_at_50%_-10%,rgba(31,175,90,0.2)_0%,transparent_60%)]" />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
        >
          <div className="inline-flex items-center gap-2 bg-green/10 border border-green/20 px-4 py-1.5 rounded-full text-[10px] uppercase tracking-widest text-green mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-green animate-pulse" />
            Now Available · Nigeria
          </div>
          
          <h1 className="font-bebas text-[clamp(3.5rem,10vw,7.5rem)] leading-[0.9] mb-6">
            <span className="block text-white">KNOW WHO'S</span>
            <span className="block bg-gradient-to-r from-green via-green-light to-blue-400 bg-clip-text text-transparent">
              CALLING YOU
            </span>
          </h1>
          
          <p className="max-w-xl mx-auto text-white/50 text-lg mb-10 leading-relaxed font-light">
            Nigeria's indigenous caller identity & location intelligence platform — powered by NIN verification for trusted communications.
          </p>
          
          <div className="flex flex-wrap justify-center gap-4 mb-20">
            <FgButton product="finder" size="lg" className="px-10 h-14 text-base">
              <Download className="mr-2 w-5 h-5" />
              Download App
            </FgButton>
            <FgButton variant="outline" size="lg" className="px-10 h-14 text-base">
              Explore Features
            </FgButton>
          </div>
        </motion.div>

        {/* Phone Mockup Section */}
        <div className="relative group">
          <div className="absolute inset-0 bg-green/20 blur-[100px] -z-10 opacity-50 group-hover:opacity-80 transition-opacity duration-1000" />
          <FgCard className="w-[280px] h-[560px] p-0 rounded-[40px] border-green/30 bg-[#081209] overflow-hidden flex flex-col shadow-2xl">
             <div className="h-6 w-1/3 bg-[#081209] mx-auto rounded-b-2xl border-x border-b border-green/20" />
             <div className="p-4 flex flex-col gap-4">
                <div className="flex justify-between text-[10px] text-white/30 uppercase tracking-widest font-bold">
                  <span>Finder</span>
                  <span>9:41 AM</span>
                </div>
                
                <FgGlassCard className="p-4 border-green/20 bg-green/5">
                   <p className="text-[8px] text-green font-bold uppercase tracking-widest mb-2">📞 Incoming Call</p>
                   <h4 className="text-lg font-extrabold mb-0">Emeka Johnson</h4>
                   <p className="text-[10px] text-white/40 mb-3">+234 803 445 7821</p>
                   <div className="flex items-center gap-2 bg-green/10 p-2 rounded-lg mb-3">
                      <ShieldCheck className="w-3 h-3 text-green" />
                      <span className="text-[9px] text-green font-bold">NIN Verified · ID Confirmed</span>
                   </div>
                   <div className="flex items-center gap-2 text-[9px] text-white/40">
                      <MapPin className="w-3 h-3" />
                      <span>Abuja, FCT · 2.4km away</span>
                   </div>
                   <div className="flex gap-2 mt-4">
                      <div className="flex-1 h-8 rounded-lg bg-red-500/20 border border-red-500/30 flex items-center justify-center text-[10px] font-bold text-red-400">✕ Decline</div>
                      <div className="flex-1 h-8 rounded-lg bg-green/20 border border-green/30 flex items-center justify-center text-[10px] font-bold text-green">✓ Accept</div>
                   </div>
                </FgGlassCard>

                <div className="p-4 rounded-2xl bg-gold/10 border border-gold/20">
                   <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="w-3 h-3 text-gold" />
                      <span className="text-[10px] font-bold text-gold uppercase tracking-tighter">Fraud Alert System</span>
                   </div>
                   <p className="text-[9px] text-white/40 leading-tight">No suspicious patterns detected. Identity confirmed against national database.</p>
                </div>
             </div>
          </FgCard>

          {/* Floating Badges */}
          <motion.div 
            animate={{ y: [0, -10, 0] }} 
            transition={{ duration: 4, repeat: Infinity }}
            className="absolute -left-20 top-20 bg-background/80 backdrop-blur-md border border-green/20 p-3 rounded-xl shadow-xl"
          >
            <p className="text-[8px] text-white/40 uppercase tracking-widest mb-1">Verification</p>
            <p className="text-[10px] font-bold text-green flex items-center gap-2">
              <CheckCircle2 className="w-3 h-3" /> NIN Confirmed
            </p>
          </motion.div>
          <motion.div 
            animate={{ y: [0, 10, 0] }} 
            transition={{ duration: 5, repeat: Infinity }}
            className="absolute -right-20 bottom-40 bg-background/80 backdrop-blur-md border border-green/20 p-3 rounded-xl shadow-xl"
          >
            <p className="text-[8px] text-white/40 uppercase tracking-widest mb-1">Location</p>
            <p className="text-[10px] font-bold text-white flex items-center gap-2">
              <MapPin className="w-3 h-3 text-green" /> Lagos Island
            </p>
          </motion.div>
        </div>
      </section>

      {/* ── FEATURES SECTION ── */}
      <section className="py-32 px-10 max-w-7xl mx-auto">
        <div className="text-center mb-20">
           <div className="inline-flex items-center gap-2 text-green text-[11px] font-bold uppercase tracking-[0.2em] mb-4">
              <div className="w-10 h-[1px] bg-green" />
              Core Intelligence
           </div>
           <h2 className="font-bebas text-6xl">Precision. Security. Trust.</h2>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
           {[
             { title: "Verified Identity", desc: "Each incoming number matched with verified NIN identity data. Reduces impersonation.", icon: ShieldCheck },
             { title: "Real-Time Location", desc: "Geolocation intelligence for incoming callers. Improves security awareness.", icon: MapPin },
             { title: "Fraud Alert", desc: "AI-powered pattern detection flags suspicious and high-risk caller behavior.", icon: AlertTriangle }
           ].map((feat, i) => (
             <FgCard key={i} className="p-8 border-green/10 hover:border-green/30 transition-all bg-green/[0.02]">
                <div className="w-12 h-12 rounded-xl bg-green/10 flex items-center justify-center text-green mb-6">
                  <feat.icon className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold mb-4">{feat.title}</h3>
                <p className="text-white/40 text-sm leading-relaxed">{feat.desc}</p>
             </FgCard>
           ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-32 px-10 border-y border-green/10 bg-gradient-to-br from-green/5 to-transparent">
         <div className="max-w-4xl mx-auto text-center">
            <h2 className="font-bebas text-7xl mb-8">Ready to Secure Your Phone?</h2>
            <p className="text-white/50 text-xl mb-12">Join thousands of Nigerians securing their communications with FeasibilityFinder.</p>
            <div className="flex justify-center gap-6">
               <FgButton product="finder" size="lg" className="h-16 px-12">Download iOS</FgButton>
               <FgButton product="finder" size="lg" className="h-16 px-12">Download Android</FgButton>
            </div>
         </div>
      </section>
    </main>
  );
}

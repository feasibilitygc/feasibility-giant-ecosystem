"use client";

import { FgButton, FgCard, FgGlassCard } from "@fg/ui";
import { motion } from "framer-motion";
import { 
  PiggyBank, 
  Users, 
  HandCoins, 
  BarChart3, 
  ShieldCheck, 
  ChevronRight, 
  TrendingUp, 
  History 
} from "lucide-react";

export default function FinanceHome() {
  return (
    <main className="relative z-10">
      {/* ── HERO SECTION ── */}
      <section className="min-h-screen grid lg:grid-cols-2 gap-20 items-center px-10 pt-20 relative overflow-hidden">
        {/* Background Gradients */}
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_60%_70%_at_-10%_50%,rgba(10,31,68,0.5)_0%,transparent_60%),radial-gradient(ellipse_50%_50%_at_110%_50%,rgba(201,162,39,0.08)_0%,transparent_60%)]" />
        
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
        >
          <div className="inline-flex items-center gap-2 bg-gold/10 border border-gold/20 px-4 py-1.5 rounded-full text-[10px] uppercase tracking-widest text-gold mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-gold animate-pulse" />
            Global SaaS · Cooperatives
          </div>
          
          <h1 className="font-fraunces text-[clamp(2.5rem,5vw,5rem)] leading-[1.05] mb-6 font-black italic">
            DIGITIZING <br />
            <span className="text-gold non-italic">COOPERATIVE</span> <br />
            SOCIETIES
          </h1>
          
          <p className="max-w-lg text-white/50 text-lg mb-10 leading-relaxed font-light">
            A powerful, secure web platform automating savings, loans, and governance for multipurpose cooperative societies worldwide.
          </p>
          
          <div className="flex flex-wrap gap-4 mb-12">
            <FgButton product="finance" size="lg" className="px-10 h-14 text-base">
              Create Cooperative Account
            </FgButton>
            <FgButton variant="outline" size="lg" className="px-10 h-14 text-base">
              Request a Demo
            </FgButton>
          </div>

          <div className="flex gap-10 pt-8 border-t border-white/5">
             <div>
                <p className="font-fraunces text-3xl font-black text-gold">5+</p>
                <p className="text-[10px] text-white/40 uppercase tracking-widest">Coop Types</p>
             </div>
             <div>
                <p className="font-fraunces text-3xl font-black text-gold">∞</p>
                <p className="text-[10px] text-white/40 uppercase tracking-widest">Members Scalable</p>
             </div>
             <div>
                <p className="font-fraunces text-3xl font-black text-gold">GDPR</p>
                <p className="text-[10px] text-white/40 uppercase tracking-widest">Compliant</p>
             </div>
          </div>
        </motion.div>

        {/* Dashboard Preview */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="relative"
        >
           <FgCard className="p-8 border-gold/20 bg-[#080D18] shadow-[0_40px_100px_rgba(0,0,0,0.6)]">
              <div className="flex justify-between items-center mb-8">
                 <h4 className="font-fraunces font-bold">Cooperative Dashboard</h4>
                 <div className="px-3 py-1 rounded-full bg-green/10 border border-green/20 text-[9px] text-green font-bold">● Live</div>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-8">
                 {[
                   { label: "Total Savings", val: "₦14.2M", color: "text-gold" },
                   { label: "Active Loans", val: "47", color: "text-blue-400" },
                   { label: "Members", val: "382", color: "text-green" }
                 ].map((stat, i) => (
                   <div key={i} className="p-4 rounded-xl bg-white/[0.03] border border-white/5">
                      <p className="text-[8px] text-white/30 uppercase tracking-widest mb-1">{stat.label}</p>
                      <p className={`font-fraunces font-bold text-xl ${stat.color}`}>{stat.val}</p>
                      <p className="text-[8px] text-green/60 mt-1">↑ 12% this month</p>
                   </div>
                 ))}
              </div>

              <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4 mb-6">
                 <p className="text-[9px] text-white/30 mb-4">Monthly Contributions</p>
                 <div className="flex items-end gap-2 h-20">
                    {[40, 55, 45, 70, 60, 80, 95].map((h, i) => (
                      <div 
                        key={i} 
                        style={{ height: `${h}%` }} 
                        className={`flex-1 rounded-t-sm ${i === 6 ? 'bg-gold' : 'bg-gold/30'}`}
                      />
                    ))}
                 </div>
              </div>

              <div className="rounded-xl border border-white/5 overflow-hidden">
                 <div className="flex justify-between p-3 bg-white/5 border-b border-white/5">
                    <p className="text-[8px] text-white/30 uppercase tracking-widest">Recent Activity</p>
                    <p className="text-[8px] text-gold cursor-pointer">View All</p>
                 </div>
                 {[
                   { name: "Ada Okafor", amt: "+₦50,000", type: "Contribution" },
                   { name: "Emeka Nwachukwu", amt: "-₦200,000", type: "Loan Issued" }
                 ].map((row, i) => (
                   <div key={i} className="flex justify-between p-3 border-b border-white/[0.03] text-[10px]">
                      <span className="font-medium">{row.name}</span>
                      <span className="font-bold text-gold">{row.amt}</span>
                      <span className="text-white/30 italic">{row.type}</span>
                   </div>
                 ))}
              </div>
           </FgCard>
        </motion.div>
      </section>

      {/* ── MODULES ── */}
      <section className="py-32 px-10 max-w-7xl mx-auto">
         <div className="flex flex-col items-center text-center mb-20">
            <div className="inline-flex items-center gap-2 text-gold text-[11px] font-bold uppercase tracking-[0.2em] mb-4">
              <div className="w-10 h-[1px] bg-gold" />
              Platform Modules
            </div>
            <h2 className="font-fraunces text-6xl font-black">Everything Your <br /> Cooperative Needs</h2>
         </div>

         <div className="grid lg:grid-cols-2 gap-20 items-start">
            <div className="space-y-4">
               {[
                 { id: "01", title: "Financial Management", desc: "Complete savings, contributions, and ledger automation." },
                 { id: "02", title: "Member Management", desc: "Digital onboarding, KYC, and member profiles." },
                 { id: "03", title: "Loan Management", desc: "Application, approval, tracking, and repayment." }
               ].map((mod, i) => (
                 <div key={i} className={`p-6 rounded-xl border transition-all cursor-pointer ${i === 0 ? 'bg-gold/5 border-gold/20' : 'border-transparent hover:bg-white/5'}`}>
                    <div className="flex gap-4">
                       <span className={`font-fraunces text-2xl font-black ${i === 0 ? 'text-gold' : 'text-white/10'}`}>{mod.id}</span>
                       <div>
                          <h4 className="font-bold mb-1">{mod.title}</h4>
                          <p className="text-sm text-white/40">{mod.desc}</p>
                       </div>
                    </div>
                 </div>
               ))}
            </div>

            <FgGlassCard className="p-10 border-gold/10">
               <div className="w-16 h-16 rounded-2xl bg-gold/10 flex items-center justify-center text-gold mb-8 text-3xl">💰</div>
               <h3 className="font-fraunces text-3xl font-bold mb-6">Financial Management</h3>
               <p className="text-white/50 leading-relaxed mb-8">
                  Automate every financial operation from daily savings to yearly share capital. 
                  Support multiple currencies and generate digital receipts instantly.
               </p>
               <ul className="space-y-4">
                  {["Daily, weekly, monthly tracking", "Interest computation engine", "Digital receipts & ledgers", "Surplus distribution"].map((feat, i) => (
                    <li key={i} className="flex items-center gap-3 text-sm">
                       <div className="w-1.5 h-1.5 rounded-full bg-gold" />
                       {feat}
                    </li>
                  ))}
               </ul>
            </FgGlassCard>
         </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-32 px-10 text-center bg-gradient-to-tr from-navy/40 to-gold/5 border-t border-gold/10">
         <h2 className="font-fraunces text-7xl font-black mb-8 italic">Empower Your <br /> <span className="text-gold non-italic">COOPERATIVE.</span></h2>
         <p className="text-white/50 text-xl max-w-lg mx-auto mb-12">Join cooperatives worldwide transforming their operations with FeasibilityFinance.</p>
         <div className="flex justify-center gap-6">
            <FgButton product="finance" size="lg" className="h-16 px-12">Create Account</FgButton>
            <FgButton variant="outline" size="lg" className="h-16 px-12">Request Demo</FgButton>
         </div>
      </section>
    </main>
  );
}

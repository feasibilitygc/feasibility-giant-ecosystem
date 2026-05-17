"use client";

import { FgButton } from "@fg/ui";
import { 
  LayoutDashboard, 
  Users, 
  PiggyBank, 
  HandCoins, 
  FileText, 
  Settings, 
  LogOut 
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { name: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { name: "Members", href: "/dashboard/members", icon: Users },
  { name: "Contributions", href: "/dashboard/contributions", icon: PiggyBank },
  { name: "Loans", href: "/dashboard/loans", icon: HandCoins },
  { name: "Reports", href: "/dashboard/reports", icon: FileText },
  { name: "Settings", href: "/dashboard/settings", icon: Settings },
];

export function DashboardSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-content1 border-r border-content3 flex flex-col h-screen fixed left-0 top-0 z-50">
      <div className="p-6">
        <Link href="/dashboard" className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gold flex items-center justify-center text-navy font-bold">
            F
          </div>
          <span className="font-fraunces font-bold text-lg text-gold">FeasibilityFinance</span>
        </Link>
      </div>

      <nav className="flex-1 px-4 space-y-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isActive 
                  ? "bg-gold/10 text-gold font-semibold" 
                  : "text-white/50 hover:bg-white/5 hover:text-white"
              }`}
            >
              <item.icon className={`w-5 h-5 ${isActive ? "text-gold" : ""}`} />
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-content3">
        <FgButton 
          variant="ghost" 
          className="w-full justify-start text-white/50 hover:text-error"
          product="finance"
        >
          <LogOut className="w-5 h-5 mr-3" />
          Logout
        </FgButton>
      </div>
    </aside>
  );
}

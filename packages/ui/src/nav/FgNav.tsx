"use client";

import React from "react";
import { Button, Dropdown, Label } from "@heroui/react";
import { APP_LINKS } from "@fg/lib";
import { ChevronDown, Globe, Shield, Landmark, Box } from "lucide-react";
import Link from "next/link";

export function FgNav({ activeApp }: { activeApp: keyof typeof APP_LINKS }) {
  const productIcons = {
    corporate: <Globe className="w-4 h-4" />,
    finder: <Shield className="w-4 h-4 text-green-500" />,
    finance: <Landmark className="w-4 h-4 text-yellow-500" />,
    threed: <Box className="w-4 h-4 text-blue-400" />
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-[100] px-10 md:px-[60px] py-[18px] bg-[#070E1C]/85 backdrop-blur-xl border-b border-white/10 flex items-center justify-between">
      <div className="flex items-center gap-[60px]">
        <Link href={APP_LINKS.corporate.href} className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-[#1A4F8B] to-[#1FAF5A] p-[1px] shrink-0">
            <div className="w-full h-full rounded-[7px] bg-[#070E1C] flex items-center justify-center font-black text-white text-xl">
              F
            </div>
          </div>
          <div className="flex flex-col justify-center leading-[1.15]">
            <p className="font-syne font-extrabold text-[15px] tracking-tight text-white uppercase">
              Feasibility
            </p>
            <p className="font-syne font-extrabold text-[15px] tracking-tight text-white uppercase">
              Giant Company
            </p>
            <span className="text-[10px] font-medium tracking-[0.15em] text-white/40 uppercase">
              Digital Infrastructure
            </span>
          </div>
        </Link>

        <div className="hidden lg:flex items-center gap-16">
          <Dropdown>
            <Dropdown.Trigger>
              <div role="button" className="text-white/65 hover:text-white text-[13px] font-medium tracking-wide flex items-center gap-2 cursor-pointer transition-colors outline-none">
                Ecosystem
                <ChevronDown className="w-3.5 h-3.5 opacity-40" />
              </div>
            </Dropdown.Trigger>
            <Dropdown.Popover className="min-w-[340px] bg-[#070E1C]/95 backdrop-blur-2xl border border-white/10 shadow-2xl">
              <Dropdown.Menu aria-label="Ecosystem Apps">
                {Object.entries(APP_LINKS).map(([key, app]) => (
                  <Dropdown.Item
                    key={key}
                    href={app.href}
                    className={`flex items-start gap-4 p-4 rounded-lg transition-all hover:bg-white/5 ${activeApp === key ? "bg-white/10" : ""}`}
                  >
                    <div className="mt-1 p-2 rounded-md bg-white/5">
                      {productIcons[key as keyof typeof productIcons]}
                    </div>
                    <div className="flex flex-col">
                      <Label className="font-bold text-white text-[14px]">{app.name}</Label>
                      <p className="text-[11px] text-white/45 leading-normal mt-0.5">{app.description}</p>
                    </div>
                  </Dropdown.Item>
                ))}
              </Dropdown.Menu>
            </Dropdown.Popover>
          </Dropdown>
          
          <Link href="#" className="text-[13px] font-medium text-white/65 hover:text-white transition-colors tracking-wide">
            Infrastructure
          </Link>
          <Link href="#" className="text-[13px] font-medium text-white/65 hover:text-white transition-colors tracking-wide">
            Security
          </Link>
        </div>
      </div>

      <div className="flex items-center">
        <Link 
          href="#" 
          className="bg-gradient-to-r from-[#1A4F8B] to-[#1FAF5A] text-white text-[13px] font-semibold tracking-wide px-7 py-3 rounded-lg hover:opacity-85 transition-opacity"
        >
          Partner Access
        </Link>
      </div>
    </nav>
  );
}

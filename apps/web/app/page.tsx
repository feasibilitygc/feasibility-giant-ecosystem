/**
 * Feasibility Giant Company — Main Website Page
 * Next.js 16 App Router · HeroUI v3 · TypeScript
 *
 * File location: app/page.tsx  (or wherever your root route lives)
 *
 * Dependencies:
 *   @heroui/react  @heroui/navbar  @heroui/card  @heroui/chip
 *   @heroui/button @heroui/divider @heroui/link
 *   framer-motion  (peer dep of HeroUI)
 *   Google Fonts: Bebas Neue, Syne, DM Sans, JetBrains Mono
 */

"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  Navbar,
  NavbarBrand,
  NavbarContent,
  NavbarItem,
  NavbarMenuToggle,
  NavbarMenu,
  NavbarMenuItem,
} from "@heroui/navbar";
import { Button } from "@heroui/button";
import { Card, CardHeader, CardBody, CardFooter } from "@heroui/card";
import { Chip } from "@heroui/chip";
import { Divider } from "@heroui/divider";
import { Link } from "@heroui/link";

// ─── BRAND COLORS ────────────────────────────────────────────────────────────
const COLORS = {
  navy: "#0A1F44",
  blue: "#1A4F8B",
  green: "#1FAF5A",
  gold: "#C9A227",
  orange: "#FF6B00",
  electric: "#007BFF",
  bg: "#070E1C",
  surface: "#0D1525",
  border: "#1A2840",
} as const;

// ─── LOGO SVG ─────────────────────────────────────────────────────────────────
function CompanyLogo({ size = 42, color = "#1A6BC8" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
      <path
        d="M72 28 A30 30 0 1 0 72 72"
        stroke={color}
        strokeWidth="14"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M42 66 L72 36 L72 55 M72 36 L53 36"
        stroke="url(#logoGrad)"
        strokeWidth="7"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <defs>
        <linearGradient id="logoGrad" x1="42" y1="66" x2="72" y2="36" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#E8681A" />
          <stop offset="100%" stopColor="#F0A500" />
        </linearGradient>
      </defs>
    </svg>
  );
}

// ─── MARQUEE ──────────────────────────────────────────────────────────────────
const MARQUEE_ITEMS = [
  "FeasibilityFinder", "FeasibilityFinance", "Feasibility3D",
  "Oil & Gas Simulation", "NIN Identity Verification", "Cooperative SaaS",
  "Spill Quantification", "Digital Infrastructure", "Enterprise Software",
  "Yenagoa · Bayelsa State",
];

function MarqueeStrip() {
  const doubled = [...MARQUEE_ITEMS, ...MARQUEE_ITEMS];
  return (
    <div className="overflow-hidden border-b border-white/[0.08] py-3.5 bg-white/[0.015]">
      <div
        className="flex whitespace-nowrap"
        style={{ animation: "marquee 28s linear infinite" }}
      >
        {doubled.map((item, i) => (
          <span
            key={i}
            className="inline-flex items-center gap-3 px-7 text-[11px] font-semibold tracking-[0.12em] uppercase text-white/25"
          >
            <span className="w-1 h-1 rounded-full flex-shrink-0" style={{ background: COLORS.gold }} />
            {item}
          </span>
        ))}
      </div>
      <style>{`@keyframes marquee { from { transform:translateX(0) } to { transform:translateX(-50%) } }`}</style>
    </div>
  );
}

// ─── SCROLL REVEAL HOOK ───────────────────────────────────────────────────────
function useReveal() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry?.isIntersecting) setVisible(true); },
      { threshold: 0.08 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return { ref, visible };
}

function Reveal({
  children,
  delay = 0,
}: {
  children: React.ReactNode;
  delay?: number;
}) {
  const { ref, visible } = useReveal();
  return (
    <div
      ref={ref}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(32px)",
        transition: `opacity 0.75s ease ${delay}ms, transform 0.75s ease ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

// ─── SECTION EYEBROW ─────────────────────────────────────────────────────────
function Eyebrow({ children, center = false }: { children: React.ReactNode; center?: boolean }) {
  return (
    <div
      className={`inline-flex items-center gap-4 text-[11px] font-bold tracking-[0.2em] uppercase mb-6 font-dm-sans ${center ? "justify-center" : ""}`}
      style={{ color: COLORS.green }}
    >
      <div className="w-8 h-[1px]" style={{ background: COLORS.green }} />
      {children}
    </div>
  );
}

// ─── PRODUCT DATA ─────────────────────────────────────────────────────────────
const PRODUCTS = [
  {
    num: "01",
    key: "finder",
    tag: "Mobile App",
    name: "FeasibilityFinder",
    desc: "Nigeria's premier caller identity & NIN-linked verification platform. Know who's calling before you answer.",
    features: [
      "NIN-Linked Caller ID",
      "Real-time Identity Lookup",
      "Fraud & Scam Detection",
      "Spam Call Blocking",
      "Business Verification Layer",
    ],
    color: COLORS.green,
    href: "https://finder.feasibilitygiants.com",
    chipColor: "success" as const,
    glowColor: "rgba(31,175,90,0.18)",
  },
  {
    num: "02",
    key: "finance",
    tag: "SaaS",
    name: "FeasibilityFinance",
    desc: "End-to-end cooperative society management — from member registration to loan disbursement and audit-ready reporting.",
    features: [
      "Member & Contribution Ledger",
      "Loan Application & Approval",
      "Dividend Computation Engine",
      "Multi-Level Role Access",
      "Regulatory Audit Reports",
    ],
    color: COLORS.gold,
    href: "https://finance.feasibilitygiants.com",
    chipColor: "warning" as const,
    glowColor: "rgba(201,162,39,0.18)",
  },
  {
    num: "03",
    key: "threed",
    tag: "Enterprise",
    name: "Feasibility3D",
    desc: "Advanced 3D engineering simulation for oil & gas feasibility, spill modeling, and environmental impact assessment.",
    features: [
      "Oil Spill Volume Quantification",
      "Subsurface Flow Modeling",
      "Environmental Impact Reports",
      "DPR & ISO Compliance Outputs",
      "Regulatory-Grade Exports",
    ],
    color: COLORS.electric,
    href: "https://3d.feasibilitygiants.com",
    chipColor: "primary" as const,
    glowColor: "rgba(0,123,255,0.18)",
  },
] as const;

// ─── PRODUCT CARD ─────────────────────────────────────────────────────────────
function ProductCard({
  product,
}: {
  product: (typeof PRODUCTS)[number];
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [hovered, setHovered] = useState(false);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    setMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="product-card group relative p-12 md:p-14 overflow-hidden border-r border-white/[0.04] bg-dark-bg transition-all duration-500 hover:-translate-y-2 cursor-pointer"
      onClick={() => window.open(product.href, "_blank")}
    >
      {/* Flashlight Glow */}
      <div
        className="pointer-events-none absolute opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{
          width: 400,
          height: 400,
          left: mousePos.x,
          top: mousePos.y,
          transform: "translate(-50%, -50%)",
          background: `radial-gradient(circle, ${product.color}25 0%, transparent 70%)`,
          filter: "blur(50px)",
          zIndex: 0,
        }}
      />

      <div className="relative z-10 h-full flex flex-col">
        <div className="mb-10 flex justify-between items-start">
          <CompanyLogo size={56} color={product.color} />
          <span className="font-bebas text-8xl text-white/[0.04] group-hover:text-white/[0.08] transition-colors duration-500 leading-none select-none">
            {product.num}
          </span>
        </div>
        <div
          className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold tracking-[0.12em] uppercase mb-6 border"
          style={{
            background: `${product.color}15`,
            borderColor: `${product.color}40`,
            color: product.color,
          }}
        >
          {product.tag}
        </div>
        <h3 className="font-syne text-2xl font-extrabold text-white mb-4">{product.name}</h3>
        <p className="font-dm-sans text-[14px] text-white/45 leading-relaxed mb-10 max-w-[340px] font-light">
          {product.desc}
        </p>
        <ul className="space-y-3.5 mb-12 flex-grow">
          {product.features.map((f) => (
            <li key={f} className="flex items-center gap-3 text-[13px] text-white/40">
              <span className="w-1 h-1 rounded-full" style={{ background: product.color }} />
              {f}
            </li>
          ))}
        </ul>
        <span
          className="inline-flex items-center gap-2 text-[12px] font-bold tracking-[0.1em] uppercase transition-all group-hover:gap-4"
          style={{ color: product.color }}
        >
          Explore {product.key === "threed" ? "3D" : product.key.charAt(0).toUpperCase() + product.key.slice(1)} <span className="text-lg">→</span>
        </span>
      </div>
    </div>
  );
}

// ─── SERVICE ITEM ─────────────────────────────────────────────────────────────
function ServiceItem({
  icon,
  title,
  desc,
  iconBg,
}: {
  icon: string;
  title: string;
  desc: string;
  iconBg: string;
}) {
  return (
    <div className="flex gap-4 items-start p-5 px-6 rounded-2xl border border-white/[0.06] transition-all duration-300 hover:bg-white/[0.025] hover:border-white/[0.12]">
      <div
        className="w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
        style={{ background: iconBg }}
      >
        {icon}
      </div>
      <div>
        <h4
          className="text-[15px] font-syne font-bold mb-1"
          style={{ color: "#fff" }}
        >
          {title}
        </h4>
        <p className="text-[12px] leading-relaxed" style={{ color: "rgba(255,255,255,0.45)" }}>
          {desc}
        </p>
      </div>
    </div>
  );
}

// ─── TECH ITEM ────────────────────────────────────────────────────────────────
function TechItem({ icon, title, desc }: { icon: string; title: string; desc: string }) {
  return (
    <div
      className="p-9 transition-colors duration-300 hover:bg-white/[0.03]"
      style={{ background: COLORS.bg }}
    >
      <div className="text-3xl mb-4">{icon}</div>
      <h4
        className="text-[14px] font-syne font-bold mb-2"
        style={{ color: "#fff" }}
      >
        {title}
      </h4>
      <p className="text-[12px] leading-relaxed" style={{ color: "rgba(255,255,255,0.38)" }}>
        {desc}
      </p>
    </div>
  );
}

// ─── COMPLIANCE BADGE ─────────────────────────────────────────────────────────
function ComplianceBadge({ dot, children }: { dot: string; children: React.ReactNode }) {
  const dotColors: Record<string, string> = {
    green: COLORS.green,
    gold: COLORS.gold,
    blue: COLORS.electric,
    orange: COLORS.orange,
  };
  return (
    <div className="flex items-center gap-2.5 px-5 py-2.5 rounded-full border border-white/10 bg-white/[0.04] text-[12px] font-medium text-white/60 transition-all duration-300 cursor-default hover:border-white/[0.22] hover:text-white hover:bg-white/[0.08]">
      <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: dotColors[dot] }} />
      {children}
    </div>
  );
}

// ─── DOMAIN CARD ──────────────────────────────────────────────────────────────
function DomainCard({
  type,
  url,
  sub,
  variant,
}: {
  type: string;
  url: string;
  sub: string;
  variant: "green" | "gold" | "blue" | "dim";
}) {
  const styles = {
    green: { bg: "rgba(31,175,90,0.06)", border: "rgba(31,175,90,0.22)", color: COLORS.green },
    gold: { bg: "rgba(201,162,39,0.06)", border: "rgba(201,162,39,0.22)", color: COLORS.gold },
    blue: { bg: "rgba(0,123,255,0.06)", border: "rgba(0,123,255,0.22)", color: COLORS.electric },
    dim: { bg: "rgba(255,255,255,0.03)", border: "rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.38)" },
  };
  const s = styles[variant];
  return (
    <div className="rounded-2xl p-5 px-6 font-dm-sans" style={{ background: s.bg, border: `1px solid ${s.border}` }}>
      <div className="text-[10px] font-bold tracking-[0.12em] uppercase mb-2" style={{ color: s.color }}>
        {type}
      </div>
      <div className="font-semibold text-[12px] mb-1 text-white" style={{ fontFamily: "var(--font-jetbrains)" }}>
        {url}
      </div>
      <div className="text-[11px] font-light" style={{ color: "rgba(255,255,255,0.28)" }}>{sub}</div>
    </div>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
export default function FeasibilityGiantPage() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  return (
    <div style={{ background: COLORS.bg, color: "#F9FAFB", fontFamily: "'Outfit', sans-serif", minHeight: "100vh", padding: "0 16px", overflowX: "hidden" }}>
      {/* ── NAVBAR ── */}
      <Navbar
        isMenuOpen={menuOpen}
        onMenuOpenChange={setMenuOpen}
        isBordered={false}
        isBlurred
        maxWidth="full"
        className="border-b border-white/[0.08] px-[60px] font-dm-sans"
        style={{
          background: scrolled ? "rgba(7,14,28,0.96)" : "rgba(7,14,28,0.8)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          transition: "background 0.4s",
          height: 72,
        }}
      >
        <NavbarContent>
          <NavbarMenuToggle className="sm:hidden text-white" aria-label={menuOpen ? "Close menu" : "Open menu"} />
          <NavbarBrand>
            <Link href="#" className="flex items-center gap-3.5 no-underline">
              <CompanyLogo size={42} />
              <div className="font-syne">
                <p className="font-extrabold text-[15px] text-white leading-tight">Feasibility Giant Company</p>
                <p className="font-normal text-[10px] tracking-[0.14em] uppercase" style={{ color: "rgba(255,255,255,0.45)" }}>
                  Feasibility & Software Consultants
                </p>
              </div>
            </Link>
          </NavbarBrand>
        </NavbarContent>

        <NavbarContent className="hidden sm:flex gap-8" justify="center">
          {["About", "Products", "Technology", "Compliance"].map((item) => (
            <NavbarItem key={item}>
              <Link
                href={`#${item.toLowerCase()}`}
                className="text-[13px] font-medium tracking-wide transition-colors duration-200"
                style={{ color: "rgba(255,255,255,0.6)" }}
              >
                {item}
              </Link>
            </NavbarItem>
          ))}
        </NavbarContent>

        <NavbarContent justify="end">
          <NavbarItem>
            <Button
              as={Link}
              href="#contact"
              size="sm"
              className="font-semibold text-white text-[13px] px-5"
              style={{
                background: `linear-gradient(135deg, ${COLORS.blue}, ${COLORS.green})`,
                borderRadius: 8,
              }}
            >
              Get in Touch
            </Button>
          </NavbarItem>
        </NavbarContent>

        <NavbarMenu style={{ background: "rgba(7,14,28,0.98)", backdropFilter: "blur(24px)" }}>
          {["About", "Products", "Technology", "Compliance"].map((item) => (
            <NavbarMenuItem key={item}>
              <Link
                href={`#${item.toLowerCase()}`}
                className="text-[16px] font-medium py-2 block"
                style={{ color: "rgba(255,255,255,0.7)" }}
                onPress={() => setMenuOpen(false)}
              >
                {item}
              </Link>
            </NavbarMenuItem>
          ))}
        </NavbarMenu>
      </Navbar>

      {/* ── MARQUEE ── */}
      <MarqueeStrip />

      {/* ── HERO ── */}
      <section
        id="hero"
        className="min-h-screen flex flex-col items-center justify-center text-center px-[60px] relative overflow-hidden"
        style={{ paddingTop: 160, paddingBottom: 120 }}
      >
        <div className="flex flex-col items-center relative z-10 w-full">
        {/* Background layers */}
        <div
          className="hero-bg absolute inset-0"
          style={{
            background: `
              radial-gradient(ellipse 80% 60% at 50% 0%, rgba(26,79,139,0.35) 0%, transparent 60%),
              radial-gradient(ellipse 50% 40% at 80% 60%, rgba(31,175,90,0.15) 0%, transparent 50%),
              radial-gradient(ellipse 40% 30% at 10% 80%, rgba(201,162,39,0.1) 0%, transparent 50%),
              ${COLORS.bg}
            `,
          }}
        />
        {/* Hero Grid */}
        <div
          className="hero-grid absolute inset-0 pt-10"
          style={{
            backgroundImage: `
              linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)
            `,
            backgroundSize: "60px 60px",
            maskImage: "radial-gradient(ellipse 100% 100% at 50% 0%, black 30%, transparent 80%)",
            WebkitMaskImage: "radial-gradient(ellipse 100% 100% at 50% 0%, black 30%, transparent 80%)",
          }}
        />

        {/* Pill */}
        <div
          className="flex items-center gap-2.5 mb-18 px-6 py-1.5 rounded-full border text-[12px] font-semibold tracking-[0.14em] uppercase relative z-10"
          style={{
            background: "rgba(26,79,139,0.2)",
            border: "1px solid rgba(26,79,139,0.45)",
            color: "rgba(255,255,255,0.65)",
          }}
        >
          <span
            className="w-1.5 h-1.5 rounded-full"
            style={{
              background: COLORS.green,
              animation: "blink 2s ease-in-out infinite",
            }}
          />
          Feasibility Giant Company · RC 1939172
        </div>
        <style>{`@keyframes blink{0%,100%{opacity:1;transform:scale(1)}50%{opacity:0.4;transform:scale(0.75)}}`}</style>

        {/* Headline */}
        <h1
          className="relative z-10 mb-10 font-bebas uppercase tracking-tight"
          style={{
            fontSize: "clamp(60px, 12vw, 150px)",
            lineHeight: 0.88,
            color: "#fff",
          }}
        >
          <span className="block">Engineering Africa's</span>
          <span
            className="block"
            style={{
              background: `linear-gradient(120deg, ${COLORS.gold} 0%, ${COLORS.orange} 45%, ${COLORS.green} 100%)`,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            Digital Frontier
          </span>
        </h1>

        <p
          className="relative z-10 mb-14 max-w-[560px] text-xl font-dm-sans leading-relaxed"
          style={{ fontWeight: 300, color: "rgba(255,255,255,0.6)" }}
        >
          Building high-integrity platforms across identity verification, cooperative finance,
          and engineering simulation — purpose-built for the continent.
        </p>

        <div className="flex gap-3.5 flex-wrap justify-center relative z-10">
          <Button
            as={Link}
            href="#products"
            size="lg"
            className="font-semibold text-white text-[14px] px-8"
            style={{
              background: `linear-gradient(135deg, ${COLORS.blue} 0%, #0E3D75 100%)`,
              border: "1px solid rgba(255,255,255,0.14)",
              borderRadius: 10,
            }}
          >
            Explore Our Products
          </Button>
          <Button
            as={Link}
            href="#contact"
            size="lg"
            variant="bordered"
            className="font-medium text-[14px] px-8"
            style={{
              background: "transparent",
              border: "1px solid rgba(255,255,255,0.15)",
              color: "rgba(255,255,255,0.7)",
              borderRadius: 10,
            }}
          >
            Partner With Us →
          </Button>
        </div>

        {/* Stats */}
        <div
          className="flex justify-center max-w-[860px] w-full relative z-10 mt-20 border-y"
          style={{ borderColor: "rgba(255,255,255,0.08)", padding: "36px 0" }}
        >
          {[
            { n: "3", l: "Product Platforms" },
            { n: "RC", l: "1939172 · CAC Reg." },
            { n: "3+", l: "Industries Served" },
            { n: "NG", l: "Indigenous Innovation" },
          ].map((s, i, arr) => (
            <div
              key={s.l}
              className="flex-1 text-center"
              style={{
                padding: "0 32px",
                borderRight: i < arr.length - 1 ? "1px solid rgba(255,255,255,0.08)" : "none",
              }}
            >
              <div
                className="stat-num leading-none mb-1.5"
                style={{
                  fontFamily: "'Bebas Neue', sans-serif",
                  fontSize: s.n.length > 2 ? 32 : 42,
                  background: "linear-gradient(135deg, #fff 0%, rgba(255,255,255,0.6) 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                {s.n}
              </div>
              <div
                className="stat-label text-[11px] font-medium tracking-[0.1em] uppercase"
                style={{ color: "rgba(255,255,255,0.35)" }}
              >
                {s.l}
              </div>
            </div>
          ))}
          </div>
        </div>
      </section>

      {/* ── LOGO SHOWCASE ── */}
      <Reveal>
        <section className="px-[60px] py-20 border-y border-white/[0.04]">
          <div className="w-full">
            <p className="text-[11px] font-bold tracking-[0.24em] uppercase text-center mb-12 font-dm-sans" style={{ color: "rgba(255,255,255,0.25)" }}>
              The Feasibility Ecosystem
            </p>
            <div className="flex items-center justify-center gap-12 sm:gap-20 flex-wrap">
            {[
              { name: "FeasibilityFinder" },
              { name: "FeasibilityFinance" },
              { name: "Feasibility3D" },
              { name: "Auth & API" },
            ].map((p) => (
              <div
                key={p.name}
                className="flex flex-col items-center gap-3.5 opacity-50 hover:opacity-100 transition-opacity duration-300 cursor-default"
              >
                <CompanyLogo size={52} />
                <span className="text-[10px] font-semibold tracking-[0.1em] uppercase" style={{ color: "rgba(255,255,255,0.4)" }}>
                  {p.name}
                </span>
              </div>
            ))}
            </div>
          </div>
        </section>
      </Reveal>

      {/* ── PRODUCTS ── */}
      <section id="products" className="px-[60px] py-[100px]" style={{ background: "rgba(255,255,255,0.01)" }}>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-20 gap-10">
          <Reveal>
            <Eyebrow>Our Platforms</Eyebrow>
            <h2
              className="text-6xl md:text-8xl font-syne font-bold leading-[0.95] tracking-tight"
              style={{ color: "#fff" }}
            >
              Three Verticals.
              <br />
              One Vision.
            </h2>
          </Reveal>
          <Reveal delay={120}>
            <p className="max-w-[520px] text-[15px] font-dm-sans leading-relaxed opacity-50 font-light">
              Each product is a standalone platform, purpose-built for a critical sector of Nigeria's
              digital economy — yet connected through a unified identity and API layer.
            </p>
          </Reveal>
        </div>

        <Reveal delay={80}>
          <div
            className="grid gap-px rounded-2xl overflow-hidden border border-white/[0.06]"
            style={{
              gridTemplateColumns: "repeat(3, 1fr)",
              background: COLORS.border,
            }}
          >
            {PRODUCTS.map((p) => (
              <ProductCard key={p.key} product={p} />
            ))}
          </div>
        </Reveal>
      </section>

      {/* ── ABOUT ── */}
      <section id="about" className="px-[60px] py-[120px] overflow-hidden">
        <div className="grid gap-24 items-center" style={{ gridTemplateColumns: "1fr 1fr" }}>
          {/* Visual column */}
          <Reveal>
            <div className="about-visual relative" style={{ height: 500 }}>
              {/* Main composition card */}
              <div
                className="absolute inset-0 rounded-2xl p-8 border"
                style={{
                  background: "linear-gradient(135deg,rgba(26,79,139,0.2),rgba(10,31,68,0.4))",
                  borderColor: "rgba(26,79,139,0.3)",
                  backdropFilter: "blur(10px)",
                }}
              >
                <div className="text-[11px] text-white/30 font-bold uppercase tracking-widest mb-6">Platform Overview</div>
                
                {/* 3 Mini-Cards Grid */}
                <div className="grid grid-cols-3 gap-3 mb-8">
                  {[
                    { i: "📱", n: "FINDER", c: COLORS.green },
                    { i: "🏦", n: "FINANCE", c: COLORS.gold },
                    { i: "⚙️", n: "3D", c: "#60A5FA" }
                  ].map((m) => (
                    <div 
                      key={m.n}
                      className="p-4 rounded-xl text-center border"
                      style={{ background: `${m.c}10`, borderColor: `${m.c}20` }}
                    >
                      <div className="text-xl mb-1.5">{m.i}</div>
                      <div className="text-[9px] font-bold tracking-wider" style={{ color: m.c }}>{m.n}</div>
                    </div>
                  ))}
                </div>

                {/* Tech Pill Cloud */}
                <div className="flex flex-wrap gap-2">
                  {["Next.js", "React Native", "NestJS", "PostgreSQL", "AWS", "Cloudflare"].map((t) => (
                    <span 
                      key={t}
                      className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] text-white/40 font-medium"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>

              {/* Floating Industries Card */}
              <div
                className="absolute w-[210px] -left-6 bottom-16 p-6 rounded-2xl border bg-white/5 backdrop-blur-md"
                style={{
                  borderColor: "rgba(255,255,255,0.08)",
                  animation: "fl1 4s ease-in-out infinite",
                }}
              >
                <div className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-3">Industries</div>
                <div className="font-bebas text-[28px] leading-[0.9] text-white">
                  Telecom<br />
                  <span style={{ color: COLORS.gold }}>Finance</span><br />
                  Oil & Gas
                </div>
              </div>

              {/* Floating CEO Status Card */}
              <div
                className="absolute w-[200px] -right-6 top-32 p-6 rounded-2xl border bg-white/5 backdrop-blur-md"
                style={{
                  borderColor: "rgba(255,255,255,0.08)",
                  animation: "fl2 5s ease-in-out infinite",
                }}
              >
                <div className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-3">Status</div>
                <div className="flex items-center gap-2.5 mb-3">
                  <div className="w-2 h-2 rounded-full bg-green shadow-[0_0_8px_var(--fg-green)]" style={{ animation: "pulse 2s infinite" }} />
                  <span className="text-[12px] font-bold text-white">Active Dev</span>
                </div>
                <div className="text-[11px] text-white/40 leading-tight">
                  Prof. Bunakiye R. Japheth<br />
                  <span className="text-[9px] opacity-60">CEO / Group President</span>
                </div>
              </div>
            </div>
            <style>{`
              @keyframes fl1{0%,100%{transform:translateY(0)}50%{transform:translateY(-12px)}}
              @keyframes fl2{0%,100%{transform:translateY(0)}50%{transform:translateY(8px)}}
            `}</style>
          </Reveal>

          {/* Text column */}
          <Reveal delay={150}>
            <div className="space-y-10">
              <div>
                <Eyebrow>What We Do</Eyebrow>
                <h2
                  className="text-6xl md:text-7xl font-syne font-bold leading-[1.1] mb-6"
                  style={{ color: "#fff" }}
                >
                  Built for Africa's Critical Infrastructure
                </h2>
                <p className="text-lg font-dm-sans leading-relaxed opacity-50 font-light">
                  We identify gaps in Nigeria's digital landscape and engineer purpose-built platforms
                  with security, compliance, and scale at the core.
                </p>
              </div>
              <div className="flex flex-col gap-4">
                <ServiceItem
                  icon="🛡️"
                  title="Identity & Verification"
                  desc="NIN-integrated caller identity solutions that bring trust and accountability to every mobile interaction in Nigeria."
                  iconBg="rgba(26,79,139,0.22)"
                />
                <ServiceItem
                  icon="💰"
                  title="Cooperative Finance"
                  desc="End-to-end SaaS for cooperative societies — eliminating manual ledgers and enabling transparent financial governance at scale."
                  iconBg="rgba(201,162,39,0.15)"
                />
                <ServiceItem
                  icon="🌍"
                  title="Engineering Simulation"
                  desc="3D oil & gas feasibility modeling for environmental impact assessment, spill quantification, and regulatory compliance."
                  iconBg="rgba(31,175,90,0.15)"
                />
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── TECHNOLOGY ── */}
      <section
        id="technology"
        className="px-[60px] py-[100px] border-t border-white/[0.04]"
        style={{ background: "linear-gradient(180deg,rgba(26,79,139,0.07) 0%,transparent 100%)" }}
      >
        <div className="w-full">
          <Reveal>
            <div className="text-center mb-20">
              <Eyebrow center>Technology Stack</Eyebrow>
              <h2
                className="text-6xl md:text-7xl font-syne font-bold leading-tight mb-6"
                style={{ color: "#fff" }}
              >
                Enterprise-Grade Architecture
              </h2>
              <p className="text-[15px] font-dm-sans font-light leading-relaxed max-w-[520px] mx-auto opacity-50">
                Built on modern, battle-tested infrastructure that scales from startup MVP to enterprise
                deployment without compromise.
              </p>
            </div>
          </Reveal>
          <Reveal delay={100}>
            <div
              className="tech-grid grid gap-px border border-white/[0.06] rounded-2xl overflow-hidden mt-16"
              style={{ 
                gridTemplateColumns: "repeat(4, 1fr)", 
                background: "rgba(255,255,255,0.06)" 
              }}
            >
              <TechItem icon="📱" title="React Native" desc="Cross-platform mobile excellence for FeasibilityFinder — consistent UX across iOS and Android with native performance." />
              <TechItem icon="⚡" title="Next.js 14" desc="Server-side rendering and edge-ready deployment for FeasibilityFinance — fast, SEO-optimized, and globally distributed." />
              <TechItem icon="🗄️" title="PostgreSQL" desc="Relational database backbone powering audit-grade financial records with full ACID compliance and row-level security." />
              <TechItem icon="🔐" title="AES-256" desc="Military-grade encryption at rest and in transit across all platforms. Zero-knowledge architecture for sensitive NIN data." />
              <TechItem icon="🧠" title="Three.js / WebGL" desc="GPU-accelerated 3D rendering engine behind Feasibility3D — bringing engineering-grade simulation to the browser." />
              <TechItem icon="🔗" title="REST & GraphQL" desc="Dual API architecture with full OpenAPI documentation — enabling third-party integrations and our B2B API gateway." />
              <TechItem icon="☁️" title="Cloud Native" desc="Multi-region deployments with auto-scaling infrastructure. 99.9% uptime SLA backed by redundant cloud architecture." />
              <TechItem icon="🔁" title="SSO Identity" desc="Unified auth layer across all Feasibility products — one login, every platform. OAuth 2.0 and OpenID Connect compliant." />
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── DOMAIN ARCHITECTURE ── */}
      <section className="px-[60px] py-[100px]">
        <div className="w-full">
          <Reveal>
            <div className="text-center mb-6">
              <Eyebrow center>Platform Architecture</Eyebrow>
              <h2
                className="text-5xl font-syne font-bold leading-tight text-white"
              >
                Unified Subdomain Ecosystem
              </h2>
            </div>
            <div
              className="grid gap-3 max-w-5xl mx-auto mt-14"
              style={{ gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" }}
            >
              <DomainCard variant="green" type="Mobile App" url="finder.feasibilitygiants.com" sub="Caller Identity Platform" />
              <DomainCard variant="gold" type="SaaS" url="finance.feasibilitygiants.com" sub="Cooperative Finance Platform" />
              <DomainCard variant="blue" type="Enterprise" url="3d.feasibilitygiants.com" sub="Engineering Simulation" />
              <DomainCard variant="dim" type="Auth" url="auth.feasibilitygiants.com" sub="SSO & Identity" />
              <DomainCard variant="dim" type="API" url="api.feasibilitygiants.com" sub="API Gateway" />
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── COMPLIANCE ── */}
      <section id="compliance" className="px-[60px] py-[120px] text-center bg-white/[0.01]">
        <div className="w-full">
          <Reveal>
            <Eyebrow center>Trust & Compliance</Eyebrow>
            <h2
              className="text-6xl md:text-7xl font-syne font-bold leading-tight mb-8"
              style={{ color: "#fff" }}
            >
              Built to Regulatory Standards
            </h2>
            <p className="text-lg font-dm-sans font-light leading-relaxed max-w-[580px] mx-auto opacity-50">
              Our platforms are engineered with security, privacy, and regulatory compliance at their core —
              not as an afterthought.
            </p>
          </Reveal>

          <Reveal delay={100}>
            <div className="flex justify-center flex-wrap gap-4 mt-16 mb-20 max-w-5xl mx-auto">
              <ComplianceBadge dot="green">NDPR Compliant</ComplianceBadge>
              <ComplianceBadge dot="gold">CAC Registered · RC 1939172</ComplianceBadge>
              <ComplianceBadge dot="blue">NIN Framework Integration</ComplianceBadge>
              <ComplianceBadge dot="green">AES-256 Encryption</ComplianceBadge>
              <ComplianceBadge dot="orange">GDPR Ready</ComplianceBadge>
              <ComplianceBadge dot="blue">NCC Aligned</ComplianceBadge>
              <ComplianceBadge dot="gold">Audit-Ready Outputs</ComplianceBadge>
              <ComplianceBadge dot="green">Role-Based Access Control</ComplianceBadge>
            </div>
          </Reveal>

          <Reveal delay={150}>
            <div
              className="grid gap-px max-w-4xl mx-auto rounded-2xl overflow-hidden border border-white/[0.06]"
              style={{
                gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                background: "rgba(255,255,255,0.04)",
              }}
            >
              {[
                { icon: "🛡️", title: "Identity Security", desc: "FeasibilityFinder is designed in full alignment with NIMC and NCC standards for NIN integration and lawful data processing." },
                { icon: "⚖️", title: "Financial Compliance", desc: "FeasibilityFinance supports cooperative regulatory frameworks across Nigeria and international jurisdictions with full audit trails." },
                { icon: "🌍", title: "Environmental Standards", desc: "Feasibility3D produces regulatory-grade environmental impact assessments aligned with DPR and ISO standards." },
              ].map((p, i) => (
                <div
                  key={p.title}
                  className="text-left p-12"
                  style={{
                    background: COLORS.bg,
                  }}
                >
                  <div className="text-4xl mb-6">{p.icon}</div>
                  <h4
                    className="text-xl mb-4"
                    style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, color: "#fff" }}
                  >
                    {p.title}
                  </h4>
                  <p className="text-[14px] leading-relaxed text-white/40">
                    {p.desc}
                  </p>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── CTA ── */}
      <section id="contact" className="px-[60px] py-[100px]">
        <div className="w-full">
          <Reveal>
            <div
              className="relative overflow-hidden rounded-[2.5rem] text-center p-12 md:p-24 border"
              style={{
                background: "linear-gradient(135deg, rgba(26,79,139,0.3) 0%, rgba(10,31,68,0.5) 40%, rgba(31,175,90,0.15) 100%)",
                borderColor: "rgba(26,79,139,0.4)",
              }}
            >
              {/* Glow */}
              <div
                className="absolute pointer-events-none"
                style={{
                  top: -100,
                  left: "50%",
                  transform: "translateX(-50%)",
                  width: 600,
                  height: 300,
                  background: "radial-gradient(ellipse,rgba(26,79,139,0.32) 0%,transparent 70%)",
                }}
              />

              <div
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-8 relative z-10 text-[10px] font-bold tracking-[0.14em] uppercase"
                style={{
                  background: "rgba(201,162,39,0.09)",
                  border: "1px solid rgba(201,162,39,0.22)",
                  color: COLORS.gold,
                }}
              >
                ✦ RC 1939172 · CAC Registered
              </div>

              <h2
                className="relative z-10 mb-8 font-bebas uppercase"
                style={{
                  fontSize: "clamp(48px, 10vw, 100px)",
                  lineHeight: 0.88,
                  color: "#fff",
                }}
              >
                Build the Future
                <br />
                With Us.
              </h2>
              <p
                className="relative z-10 text-xl font-dm-sans font-light opacity-60 mb-14 max-w-[560px] mx-auto leading-relaxed"
              >
                Join the ecosystem of forward-thinking institutions building with
                Feasibility Giant Company — from identity to engineering simulation.
              </p>

              <div className="flex gap-4 justify-center flex-wrap relative z-10">
                <Button
                  as={Link}
                  href="mailto:info@feasibilitygiants.com"
                  size="lg"
                  className="font-semibold text-white text-[15px] px-10 h-14"
                  style={{
                    background: `linear-gradient(135deg, ${COLORS.blue} 0%, #0E3D75 100%)`,
                    border: "1px solid rgba(255,255,255,0.14)",
                    borderRadius: 14,
                  }}
                >
                  Contact Us Now
                </Button>
                <Button
                  as={Link}
                  href="#products"
                  size="lg"
                  variant="bordered"
                  className="font-medium text-[15px] px-10 h-14"
                  style={{
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.15)",
                    color: "#fff",
                    borderRadius: 14,
                  }}
                >
                  View Ecosystem →
                </Button>
              </div>

              <div className="flex gap-10 flex-wrap justify-center mt-14 relative z-10">
                <div className="flex items-center gap-3 text-[14px]" style={{ color: "rgba(255,255,255,0.4)" }}>
                  <span className="text-lg">✉️</span><span className="font-light">info@feasibilitygiants.com</span>
                </div>
                <div className="flex items-center gap-3 text-[14px]" style={{ color: "rgba(255,255,255,0.4)" }}>
                  <span className="text-lg">📞</span><span className="font-light">+234 806 132 4564</span>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="px-[60px] pt-[100px] pb-12 border-t border-white/[0.06]">
        <div className="w-full">
          <div
            className="grid gap-20 mb-20"
            style={{ gridTemplateColumns: "2fr 1fr 1fr 1fr" }}
          >
            <div className="md:col-span-2">
              <Link href="#" className="flex items-center gap-4 no-underline mb-6">
                <CompanyLogo size={48} />
                <div>
                  <p className="font-bebas text-2xl text-white leading-none uppercase tracking-wide">Feasibility Giant Company</p>
                  <p className="font-dm-sans font-medium text-[10px] tracking-[0.24em] uppercase text-white/30 mt-1">
                    Feasibility & Software Consultants
                  </p>
                </div>
              </Link>
              <p className="text-[15px] font-dm-sans leading-relaxed max-w-[340px] mb-8 text-white/40 font-light">
                Engineering Africa's Digital Frontier. Indigenous innovation for global impact — from Bayelsa to the world.
              </p>
              <div className="flex gap-3">
                {["in", "X", "▶", "f"].map((s) => (
                  <a
                    key={s}
                    href="#"
                    className="w-10 h-10 rounded-xl border flex items-center justify-center text-sm font-bold no-underline transition-all duration-300 border-white/10 text-white/40 hover:border-white/30 hover:text-white hover:bg-white/5"
                  >
                    {s}
                  </a>
                ))}
              </div>
            </div>

            {[
              { title: "Products", links: ["FeasibilityFinder", "FeasibilityFinance", "Feasibility3D", "API Gateway", "Auth System"] },
              { title: "Company", links: ["About Us", "Research & Innovation", "ICT Training", "Partnerships", "Careers"] },
              { title: "Contact", links: ["info@feasibilitygiants.com", "+234 806 132 4564", "Unit 3, TIC Site", "Gabriel Okara Street", "Yenagoa, Bayelsa State"] },
            ].map((col) => (
              <div key={col.title}>
                <h5 className="text-[11px] font-bold tracking-[0.26em] uppercase mb-8 text-white/25 font-dm-sans">
                  {col.title}
                </h5>
                <ul className="flex flex-col gap-4 list-none p-0">
                  {col.links.map((l) => (
                    <li key={l}>
                      <a
                        href={l.includes("@") ? `mailto:${l}` : l.includes("+234") ? `tel:${l.replace(/\s/g, "")}` : "#"}
                        className="text-[14px] no-underline transition-colors duration-300 text-white/50 hover:text-white font-light"
                      >
                        {l}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="flex flex-col md:flex-row justify-between items-center pt-8 border-t border-white/[0.05] gap-4 text-center md:text-left">
            <p className="text-[13px] text-white/20 font-light">
              © 2026 Feasibility Giant Company Ltd. All rights reserved.
            </p>
            <p className="text-[11px] tracking-[0.06em] text-white/15 uppercase">
              RC: 1939172 · Feasibility & Software Consultants · @feasibilitygc
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

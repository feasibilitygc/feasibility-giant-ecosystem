const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  Header, Footer, AlignmentType, HeadingLevel, BorderStyle, WidthType,
  ShadingType, VerticalAlign, LevelFormat, ExternalHyperlink,
  PageBreak, TableOfContents
} = require('docx');
const fs = require('fs');

// ── COLOUR PALETTE ──────────────────────────────────────────────────────────
const C = {
  navy:    '0A1F44',
  blue:    '1A4F8B',
  green:   '1FAF5A',
  greenDk: '0E8A4F',
  gold:    'C9A227',
  goldLt:  'E8C45A',
  orange:  'FF6B00',
  electric:'007BFF',
  dark:    '070E1C',
  bg:      'F4F6F9',
  white:   'FFFFFF',
  black:   '000000',
  muted:   '6B7280',
  border:  'E5E7EB',
  // Section accent fills
  navyFill:'EBF0F8',
  greenFill:'EDF9F2',
  goldFill: 'FBF6E8',
  blueFill: 'EBF4FF',
  orangeFill:'FFF3EB',
};

// ── BORDER HELPERS ───────────────────────────────────────────────────────────
const bd = (color = C.border, size = 4) => ({
  style: BorderStyle.SINGLE, size, color,
});
const noBorder = { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' };
const allBorders = (color, size = 4) => ({
  top: bd(color, size), bottom: bd(color, size),
  left: bd(color, size), right: bd(color, size),
});
const accentBorder = (color) => ({
  top: noBorder, bottom: noBorder, right: noBorder,
  left: { style: BorderStyle.SINGLE, size: 18, color },
});

// ── TEXT HELPERS ─────────────────────────────────────────────────────────────
const run = (text, opts = {}) => new TextRun({ text, font: 'Calibri', size: 22, ...opts });
const bold = (text, opts = {}) => run(text, { bold: true, ...opts });
const mono = (text, opts = {}) => new TextRun({ text, font: 'Courier New', size: 20, ...opts });

const h1 = (text) => new Paragraph({
  heading: HeadingLevel.HEADING_1,
  children: [new TextRun({ text, font: 'Calibri', size: 44, bold: true, color: C.navy })],
  spacing: { before: 480, after: 200 },
  border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: C.navy } },
});

const h2 = (text, accentColor = C.blue) => new Paragraph({
  heading: HeadingLevel.HEADING_2,
  children: [new TextRun({ text, font: 'Calibri', size: 32, bold: true, color: accentColor })],
  spacing: { before: 360, after: 160 },
});

const h3 = (text, color = C.navy) => new Paragraph({
  heading: HeadingLevel.HEADING_3,
  children: [new TextRun({ text, font: 'Calibri', size: 26, bold: true, color })],
  spacing: { before: 240, after: 120 },
});

const h4 = (text, color = C.muted) => new Paragraph({
  children: [new TextRun({ text, font: 'Calibri', size: 22, bold: true, color, allCaps: true })],
  spacing: { before: 200, after: 80 },
});

const p = (text, color = '2B2B2B') => new Paragraph({
  children: [new TextRun({ text, font: 'Calibri', size: 22, color })],
  spacing: { before: 80, after: 80 },
  alignment: AlignmentType.JUSTIFIED,
});

const pMuted = (text) => p(text, C.muted);

const bullet = (text, level = 0) => new Paragraph({
  numbering: { reference: 'bullets', level },
  children: [new TextRun({ text, font: 'Calibri', size: 22, color: '2B2B2B' })],
  spacing: { before: 60, after: 60 },
});

const codeBlock = (text) => new Paragraph({
  children: [new TextRun({ text, font: 'Courier New', size: 18, color: C.navy })],
  spacing: { before: 60, after: 60 },
  indent: { left: 360 },
  border: { left: { style: BorderStyle.SINGLE, size: 12, color: C.electric } },
  shading: { type: ShadingType.CLEAR, fill: 'EBF4FF' },
});

const divider = (color = C.border) => new Paragraph({
  children: [],
  border: { bottom: { style: BorderStyle.SINGLE, size: 4, color } },
  spacing: { before: 160, after: 160 },
});

const pageBreak = () => new Paragraph({
  children: [new TextRun({ break: 1 })],
  spacing: { before: 0, after: 0 },
});

const spacer = (before = 160) => new Paragraph({
  children: [],
  spacing: { before, after: 0 },
});

// ── TABLE HELPERS ─────────────────────────────────────────────────────────────
const W = 9360; // content width in DXA (8.5" - 2" margins)

const headerCell = (text, width, fill = C.navy, color = C.white) => new TableCell({
  borders: allBorders(fill, 4),
  width: { size: width, type: WidthType.DXA },
  shading: { type: ShadingType.CLEAR, fill },
  margins: { top: 100, bottom: 100, left: 140, right: 140 },
  children: [new Paragraph({
    children: [new TextRun({ text, font: 'Calibri', size: 20, bold: true, color })],
    alignment: AlignmentType.LEFT,
  })],
});

const dataCell = (text, width, fill = C.white, color = '2B2B2B', mono_ = false) => new TableCell({
  borders: allBorders(C.border, 4),
  width: { size: width, type: WidthType.DXA },
  shading: { type: ShadingType.CLEAR, fill },
  margins: { top: 80, bottom: 80, left: 120, right: 120 },
  verticalAlign: VerticalAlign.TOP,
  children: [new Paragraph({
    children: [mono_ ? mono(text) : new TextRun({ text, font: 'Calibri', size: 20, color })],
    alignment: AlignmentType.LEFT,
  })],
});

const accentCell = (text, width, accentColor = C.green) => new TableCell({
  borders: {
    top: noBorder, bottom: noBorder, right: noBorder,
    left: { style: BorderStyle.SINGLE, size: 16, color: accentColor },
  },
  width: { size: width, type: WidthType.DXA },
  shading: { type: ShadingType.CLEAR, fill: C.white },
  margins: { top: 80, bottom: 80, left: 160, right: 80 },
  children: [new Paragraph({
    children: [new TextRun({ text, font: 'Calibri', size: 20, color: '2B2B2B' })],
  })],
});

const twoColRow = (a, b, fillA = C.white, fillB = C.white) => new TableRow({
  children: [
    dataCell(a, W / 2, fillA),
    dataCell(b, W / 2, fillB),
  ],
});

// ── COLOUR SWATCH TABLE ────────────────────────────────────────────────────
const swatchTable = (rows) => new Table({
  width: { size: W, type: WidthType.DXA },
  columnWidths: [1600, 1200, 3360, 3200],
  rows: [
    new TableRow({
      tableHeader: true,
      children: [
        headerCell('Token', 1600),
        headerCell('Hex', 1200),
        headerCell('Usage', 3360),
        headerCell('Product', 3200),
      ],
    }),
    ...rows.map(([token, hex, usage, product], i) => new TableRow({
      children: [
        new TableCell({
          borders: allBorders(C.border, 4),
          width: { size: 1600, type: WidthType.DXA },
          shading: { type: ShadingType.CLEAR, fill: i % 2 === 0 ? 'F9FAFB' : C.white },
          margins: { top: 80, bottom: 80, left: 120, right: 120 },
          children: [new Paragraph({
            children: [mono(token, { size: 18, color: C.navy })],
          })],
        }),
        new TableCell({
          borders: allBorders(C.border, 4),
          width: { size: 1200, type: WidthType.DXA },
          shading: { type: ShadingType.CLEAR, fill: hex },
          margins: { top: 80, bottom: 80, left: 120, right: 120 },
          children: [new Paragraph({
            children: [new TextRun({ text: `#${hex}`, font: 'Courier New', size: 18, color: parseInt(hex, 16) > 0x888888 ? C.black : C.white })],
          })],
        }),
        dataCell(usage, 3360, i % 2 === 0 ? 'F9FAFB' : C.white),
        dataCell(product, 3200, i % 2 === 0 ? 'F9FAFB' : C.white),
      ],
    })),
  ],
});

// ── CALLOUT BOX ─────────────────────────────────────────────────────────────
const callout = (label, text, accentColor = C.electric, fill = 'EBF4FF') => new Table({
  width: { size: W, type: WidthType.DXA },
  columnWidths: [W],
  rows: [
    new TableRow({
      children: [new TableCell({
        borders: {
          top: { style: BorderStyle.SINGLE, size: 4, color: accentColor },
          bottom: { style: BorderStyle.SINGLE, size: 4, color: accentColor },
          right: { style: BorderStyle.SINGLE, size: 4, color: accentColor },
          left: { style: BorderStyle.SINGLE, size: 20, color: accentColor },
        },
        width: { size: W, type: WidthType.DXA },
        shading: { type: ShadingType.CLEAR, fill },
        margins: { top: 140, bottom: 140, left: 200, right: 140 },
        children: [
          new Paragraph({
            children: [new TextRun({ text: label, font: 'Calibri', size: 20, bold: true, color: accentColor })],
            spacing: { after: 60 },
          }),
          new Paragraph({
            children: [new TextRun({ text, font: 'Calibri', size: 21, color: '2B2B2B' })],
          }),
        ],
      })],
    }),
  ],
});

// ── PRODUCT HEADER BANNER ─────────────────────────────────────────────────
const productBanner = (name, tagline, fill, color = C.white) => new Table({
  width: { size: W, type: WidthType.DXA },
  columnWidths: [W],
  rows: [new TableRow({
    children: [new TableCell({
      borders: allBorders(fill, 1),
      width: { size: W, type: WidthType.DXA },
      shading: { type: ShadingType.CLEAR, fill },
      margins: { top: 200, bottom: 200, left: 280, right: 280 },
      children: [
        new Paragraph({
          children: [new TextRun({ text: name, font: 'Calibri', size: 48, bold: true, color })],
          spacing: { after: 80 },
        }),
        new Paragraph({
          children: [new TextRun({ text: tagline, font: 'Calibri', size: 22, color: color === C.white ? 'D1D5DB' : C.muted })],
        }),
      ],
    })],
  })],
});

// ── COMPONENT SPEC TABLE ──────────────────────────────────────────────────
const componentTable = (cols, colWidths, rows, headerFill = C.navy) => new Table({
  width: { size: W, type: WidthType.DXA },
  columnWidths: colWidths,
  rows: [
    new TableRow({
      tableHeader: true,
      children: cols.map((c, i) => headerCell(c, colWidths[i], headerFill)),
    }),
    ...rows.map((row, ri) => new TableRow({
      children: row.map((cell, ci) => dataCell(cell, colWidths[ci], ri % 2 === 0 ? 'F9FAFB' : C.white, ci === 0 ? C.navy : '2B2B2B', ci === 0)),
    })),
  ],
});

// ════════════════════════════════════════════════════════════════════════════
//  DOCUMENT CONTENT
// ════════════════════════════════════════════════════════════════════════════
const children = [];
const add = (...items) => items.forEach(i => children.push(i));

// ── COVER PAGE ───────────────────────────────────────────────────────────────
add(
  new Paragraph({
    children: [new TextRun({ text: 'FEASIBILITY GIANT COMPANY LTD', font: 'Calibri', size: 60, bold: true, color: C.navy })],
    spacing: { before: 1440, after: 120 },
    alignment: AlignmentType.CENTER,
  }),
  new Paragraph({
    children: [new TextRun({ text: 'RC: 1939172  ·  Feasibility & Software Consultants', font: 'Calibri', size: 22, color: C.muted })],
    spacing: { after: 480 },
    alignment: AlignmentType.CENTER,
  }),
  divider(C.navy),
  new Paragraph({
    children: [new TextRun({ text: 'DESIGN SYSTEM & FRONTEND ARCHITECTURE', font: 'Calibri', size: 48, bold: true, color: C.blue })],
    spacing: { before: 240, after: 120 },
    alignment: AlignmentType.CENTER,
  }),
  new Paragraph({
    children: [new TextRun({ text: 'Full-Scale MVP Design Documentation', font: 'Calibri', size: 28, color: C.muted })],
    spacing: { after: 480 },
    alignment: AlignmentType.CENTER,
  }),
  divider(C.border),
  spacer(160),

  // Metadata table
  new Table({
    width: { size: W, type: WidthType.DXA },
    columnWidths: [2800, 6560],
    rows: [
      ['Document Type', 'Full MVP Design System & Component Architecture Documentation'],
      ['Covers', 'HeroUI v3  ·  Turborepo  ·  Next.js 14  ·  TypeScript  ·  Prisma ORM  ·  Supabase'],
      ['Products in Scope', 'FeasibilityFinder  ·  FeasibilityFinance  ·  Feasibility3D  ·  Corporate Site'],
      ['Version', 'v1.0  —  April 2026'],
      ['Based On', 'HTML Design References (4 approved prototypes) + SDLC Blueprint v1.0'],
      ['Author', 'Feasibility Giant Company Engineering'],
      ['Classification', 'CONFIDENTIAL — INTERNAL ENGINEERING DOCUMENT'],
    ].map(([label, value], i) => new TableRow({
      children: [
        headerCell(label, 2800, i % 2 === 0 ? C.navy : '1A3A6B'),
        dataCell(value, 6560, i % 2 === 0 ? 'F4F6F9' : 'EBF0F8'),
      ],
    })),
  }),

  spacer(480),
  pageBreak(),
);

// ── TABLE OF CONTENTS ─────────────────────────────────────────────────────────
add(
  h1('Table of Contents'),
  p('1.  Design System Philosophy & Principles'),
  p('2.  Monorepo Architecture  —  Turborepo + Next.js 14'),
  p('3.  Technology Stack Rationale'),
  p('4.  Global Design Tokens  —  Colours, Typography, Spacing, Motion'),
  p('5.  HeroUI v3 Configuration & Customisation'),
  p('6.  Component Library Specification'),
  p('7.  Product-Specific Theming'),
  p('      7.1  Corporate Site (feasibilitygiants.com)'),
  p('      7.2  FeasibilityFinder'),
  p('      7.3  FeasibilityFinance'),
  p('      7.4  Feasibility3D'),
  p('8.  Layout System & Page Topology'),
  p('9.  Database Layer  —  Prisma ORM + Supabase'),
  p('10. Responsive Design System'),
  p('11. Motion & Animation Specification'),
  p('12. Accessibility Standards'),
  p('13. File & Folder Structure'),
  p('14. Development Conventions & Standards'),
  p('15. MVP Component Delivery Checklist'),
  pageBreak(),
);

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 1 — PHILOSOPHY
// ═══════════════════════════════════════════════════════════════════════════
add(
  h1('1.  Design System Philosophy & Principles'),
  p('The Feasibility Giant design system governs four distinct digital products under one corporate identity. The core tension it resolves is brand family cohesion versus product personality independence — each product must feel native to its audience (public citizens, cooperative societies, oil & gas engineers) while remaining unmistakably part of the Feasibility Giant family.'),
  spacer(120),

  h2('1.1  The Four-Product Identity Model', C.navy),
  p('Four products share one monorepo, one component library, one design token system, and one auth service — but each product has its own colour theme, typography personality, and interaction character. The shared layer lives in packages/design-system and packages/ui. Product-specific themes are applied via HeroUI\'s theme configuration per Next.js app.'),
  spacer(120),

  h2('1.2  Design Principles', C.blue),
  bullet('Unified but distinctive — shared structure, individual personality per product.'),
  bullet('Dark-first, light-capable — all four products launch in dark mode. Finance and Corporate have light-mode variants.'),
  bullet('Performance as design — Core Web Vitals (LCP < 2.5s) are a design constraint, not an afterthought.'),
  bullet('Glass + depth without heaviness — glassmorphism at low opacity (5–8%), never the cliché blurred-card look.'),
  bullet('Typography does the heavy lifting — Bebas Neue / Fraunces / Rajdhani / Plus Jakarta Sans chosen for emotional resonance, not generic defaults.'),
  bullet('Component-first development — no bespoke CSS unless HeroUI cannot satisfy the requirement.'),
  bullet('Accessibility is non-negotiable — WCAG 2.1 AA minimum, HeroUI\'s ARIA primitives enforced.'),

  spacer(120),
  callout(
    'HEROUI V3 AS THE SINGLE UI LIBRARY',
    'Every interactive component (buttons, inputs, cards, modals, tables, dropdowns, tooltips, tabs, avatars, badges, chips) is sourced from HeroUI v3 (formerly NextUI). Custom CSS is limited to design token overrides, background effects (grid patterns, radial gradients, noise textures), and product-specific layout shells. No second component library is introduced.',
    C.green, C.greenFill,
  ),
  pageBreak(),
);

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 2 — MONOREPO ARCHITECTURE
// ═══════════════════════════════════════════════════════════════════════════
add(
  h1('2.  Monorepo Architecture  —  Turborepo + Next.js 14'),

  h2('2.1  Repository Root Structure', C.navy),
  p('The entire Feasibility Giant ecosystem lives in a single Turborepo monorepo managed with npm workspaces. This enables shared UI components, unified CI/CD, consistent dependency versions, and cross-product TypeScript type sharing.'),
  spacer(100),

  componentTable(
    ['Path', 'Type', 'Description'],
    [2800, 1200, 5360],
    [
      ['apps/web', 'Next.js App', 'Corporate site — feasibilitygiants.com'],
      ['apps/finder-web', 'Next.js App', 'FeasibilityFinder landing — finder.feasibilitygiants.com'],
      ['apps/finance-web', 'Next.js App', 'FeasibilityFinance SaaS — finance.feasibilitygiants.com'],
      ['apps/finance-admin', 'Next.js App', 'Finance admin dashboard — internal access only'],
      ['apps/3d-web', 'Next.js App', 'Feasibility3D marketing site — 3d.feasibilitygiants.com'],
      ['apps/auth-app', 'Next.js App', 'SSO portal — auth.feasibilitygiants.com'],
      ['apps/mobile', 'Expo RN', 'FeasibilityFinder iOS & Android app'],
      ['packages/ui', 'Library', 'HeroUI-based shared component library'],
      ['packages/design-system', 'Library', 'Design tokens — CSS vars, Tailwind config, HeroUI themes'],
      ['packages/types', 'Library', 'Shared TypeScript interfaces for all services'],
      ['packages/utils', 'Library', 'Shared utilities — date, currency (NGN/USD), validation'],
      ['packages/config', 'Config', 'ESLint, Prettier, TypeScript, Tailwind base configs'],
      ['services/api-gateway', 'NestJS', 'API gateway routing all requests to microservices'],
      ['services/auth-service', 'NestJS', 'JWT issuance, SSO, OAuth 2.0, MFA, RBAC validation'],
      ['services/finance-service', 'NestJS', 'Cooperative finance — members, savings, loans, reports'],
      ['services/finder-service', 'NestJS', 'Caller identity, NIN integration, location intelligence'],
      ['services/notification-service', 'NestJS', 'Email (SendGrid), SMS (Termii), push notifications'],
      ['infra/docker', 'Config', 'Docker Compose for local dev environment'],
      ['infra/terraform', 'IaC', 'AWS resource provisioning'],
      ['.github/workflows', 'CI/CD', 'GitHub Actions — lint, test, build, deploy per app'],
    ],
  ),

  spacer(200),
  h2('2.2  Turborepo Pipeline Configuration', C.blue),
  codeBlock('// turbo.json — root pipeline'),
  codeBlock('{'),
  codeBlock('  "$schema": "https://turborepo.org/schema.json",'),
  codeBlock('  "pipeline": {'),
  codeBlock('    "build": {'),
  codeBlock('      "dependsOn": ["^build"],'),
  codeBlock('      "outputs": [".next/**", "dist/**"]'),
  codeBlock('    },'),
  codeBlock('    "dev": { "cache": false, "persistent": true },'),
  codeBlock('    "lint": { "outputs": [] },'),
  codeBlock('    "typecheck": { "dependsOn": ["^build"] },'),
  codeBlock('    "test": { "dependsOn": ["^build"], "outputs": ["coverage/**"] }'),
  codeBlock('  }'),
  codeBlock('}'),

  spacer(200),
  h2('2.3  npm Workspace Configuration', C.navy),
  codeBlock('# package.json (root)'),
  codeBlock('"workspaces": ['),
  codeBlock('  "apps/*",'),
  codeBlock('  "packages/*",'),
  codeBlock('  "services/*"'),
  codeBlock(']'),
  spacer(100),

  h2('2.4  Next.js 14 App Router Configuration', C.blue),
  p('Every Next.js app uses the App Router (not Pages Router). This enables React Server Components (RSC) for SEO-critical marketing pages, streaming suspense boundaries, and native server-side data fetching via Supabase server clients.'),
  spacer(100),
  componentTable(
    ['Folder', 'RSC / Client', 'Purpose'],
    [2800, 1600, 4960],
    [
      ['app/layout.tsx', 'Server', 'Root layout — HeroUI provider, fonts, global CSS'],
      ['app/page.tsx', 'Server', 'Homepage — SSG/ISR rendered'],
      ['app/(marketing)/', 'Server', 'All public marketing pages — SSG'],
      ['app/(auth)/', 'Client', 'Login, register, forgot password'],
      ['app/(dashboard)/', 'Mixed', 'Authenticated SaaS dashboard — streaming + client islands'],
      ['app/api/', 'Edge', 'API routes — proxies to NestJS or handles lightweight logic'],
      ['components/ui/', 'Client', 'HeroUI-wrapped components with fg-* prefix'],
      ['components/sections/', 'Server', 'Marketing page sections — RSC'],
      ['lib/supabase/', 'Mixed', 'Supabase clients — server.ts, client.ts, middleware.ts'],
      ['lib/prisma/', 'Server', 'Prisma client singleton'],
    ],
  ),
  pageBreak(),
);

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 3 — TECHNOLOGY STACK
// ═══════════════════════════════════════════════════════════════════════════
add(
  h1('3.  Technology Stack Rationale'),

  componentTable(
    ['Layer', 'Technology', 'Version', 'Rationale'],
    [2000, 2200, 1000, 4160],
    [
      ['Frontend Framework', 'Next.js', '14', 'App Router + RSC for SEO, streaming SSR for dashboards, Vercel-native deployment'],
      ['UI Library', 'HeroUI (NextUI)', 'v3', 'Single unified component library — Radix primitives, Tailwind styling, full ARIA compliance'],
      ['Styling', 'Tailwind CSS', 'v3.4', 'Utility-first; HeroUI\'s native styling layer. No CSS-in-JS overhead'],
      ['Animation', 'Framer Motion', '11', 'HeroUI animations + product hero animations. GPU-accelerated transforms only'],
      ['Language', 'TypeScript', '5.4', 'Strict mode across all apps and services'],
      ['Monorepo', 'Turborepo', '2.x', 'Incremental builds, remote caching, parallel task execution'],
      ['Package Mgr', 'npm', '11.x', 'Native workspace support, dependency resolution, workspace protocol'],
      ['Backend', 'NestJS', '10', 'TypeScript-native microservices, DI container, OpenAPI generation'],
      ['ORM', 'Prisma', '5.x', 'Type-safe DB client, migration engine, multi-schema support, Supabase compatible'],
      ['Database', 'Supabase (PostgreSQL)', '—', 'Managed PostgreSQL + RLS + Auth + Realtime + Storage — replaces standalone RDS for MVP'],
      ['Auth', 'Supabase Auth', '—', 'JWT tokens, SSO, OAuth 2.0, MFA — integrates with HeroUI\'s form components'],
      ['Cache', 'Upstash Redis', '—', 'Serverless Redis for rate limiting, session cache, pub/sub'],
      ['Object Store', 'Supabase Storage', '—', 'KYC documents, media assets — encrypted, signed URL access'],
      ['CDN/Security', 'Cloudflare', 'Pro', 'WAF, DDoS, DNS, Universal SSL, edge caching'],
      ['Deploy (FE)', 'Vercel', '—', 'Git-triggered deploys, preview URLs per PR, Next.js optimisation'],
      ['Deploy (BE)', 'Railway / AWS ECS', '—', 'NestJS microservices containerised — Railway for MVP, ECS for scale'],
      ['CI/CD', 'GitHub Actions', '—', 'Lint → typecheck → test → build → deploy per app'],
      ['Monitoring', 'Sentry + Vercel Analytics', '—', 'Error tracking + Core Web Vitals per product'],
      ['Email', 'Resend', '—', 'Transactional emails — modern API, Next.js SDK, replaces SendGrid for MVP'],
      ['SMS', 'Termii', '—', 'Nigerian SMS — OTP, loan alerts, cooperative notifications'],
    ],
  ),

  spacer(200),
  callout(
    'WHY SUPABASE INSTEAD OF STANDALONE AWS RDS FOR MVP',
    'Supabase provides managed PostgreSQL + Row-Level Security + Auth + Storage + Realtime in a single service. For the MVP phase, this eliminates the need to separately manage RDS, Cognito, and S3. Prisma ORM sits on top of Supabase\'s PostgreSQL connection string, giving full type-safe schema control and migration history. When the product scales post-MVP, the Supabase PostgreSQL instance can be migrated to AWS RDS with zero schema changes — only the DATABASE_URL environment variable changes.',
    C.gold, C.goldFill,
  ),
  pageBreak(),
);

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 4 — DESIGN TOKENS
// ═══════════════════════════════════════════════════════════════════════════
add(
  h1('4.  Global Design Tokens'),

  h2('4.1  Colour Architecture', C.navy),
  p('The design token system uses CSS custom properties defined in packages/design-system/tokens.css and extended in each product\'s HeroUI theme configuration. Every colour in every product traces back to one of these tokens.'),
  spacer(120),

  h3('4.1.1  Brand Palette — Core Tokens'),
  swatchTable([
    ['--fg-navy',       '0A1F44', 'Primary brand — navigation, headings, authority surfaces', 'Corporate · All products'],
    ['--fg-blue',       '1A4F8B', 'Secondary brand — buttons, highlights, links', 'Corporate · Secondary'],
    ['--fg-green',      '1FAF5A', 'FeasibilityFinder primary — trust, growth, Nigerian identity', 'Finder primary'],
    ['--fg-green-dark', '0E8A4F', 'Finder hover states, icon backgrounds, pressed states', 'Finder dark variant'],
    ['--fg-gold',       'C9A227', 'FeasibilityFinance primary — prosperity, authority, finance', 'Finance primary'],
    ['--fg-gold-light', 'E8C45A', 'Finance hover states, highlights, CTA buttons', 'Finance light variant'],
    ['--fg-electric',   '007BFF', 'Feasibility3D primary — precision, technology, engineering', '3D primary'],
    ['--fg-orange',     'FF6B00', 'Feasibility3D alert accent — spill, warnings, CTAs', '3D accent'],
    ['--fg-dark-bg',    '070E1C', 'Unified dark mode background across all products', 'All (dark mode)'],
    ['--fg-light-bg',   'F4F6F9', 'Light mode background — Corporate only at launch', 'Corporate (light mode)'],
    ['--fg-surface',    '0D1525', 'Elevated surface in dark mode — cards, panels', 'All (dark mode)'],
    ['--fg-border',     '1A2840', 'Default border in dark mode — 15% opacity of navy', 'All (dark mode)'],
    ['--fg-muted',      '6B7280', 'Secondary text, captions, placeholder text', 'All'],
    ['--fg-text',       'F0FFF6', 'Primary text on dark backgrounds', 'All (dark mode)'],
  ]),

  spacer(200),
  h3('4.1.2  Semantic Colour Tokens'),
  componentTable(
    ['Token', 'Value', 'Semantic Usage'],
    [2400, 2400, 4560],
    [
      ['--fg-success', '#1FAF5A', 'Success states, confirmations, verified badges'],
      ['--fg-warning', '#C9A227', 'Warning states, pending actions, caution flags'],
      ['--fg-error', '#EF4444', 'Error states, rejection, destructive actions'],
      ['--fg-info', '#007BFF', 'Informational states, help, neutral alerts'],
      ['--fg-verified', '#1FAF5A', 'NIN verified badge, approved status, active'],
      ['--fg-pending', '#C9A227', 'Pending approval, processing, in-review status'],
      ['--fg-rejected', '#EF4444', 'Rejected loan, failed KYC, blocked caller'],
    ],
  ),

  spacer(240),
  h2('4.2  Typography System', C.navy),
  p('Typography is the most important differentiator between products. Each product\'s font pair is chosen to communicate a specific emotional register to its target user segment. Fonts are loaded via Next.js\'s next/font with display: swap and subsetting to minimise LCP impact.'),
  spacer(120),

  componentTable(
    ['Product', 'Display Font', 'Body Font', 'Emotional Register', 'Target Audience'],
    [1600, 1800, 1600, 2400, 1960],
    [
      ['Corporate Site', 'Bebas Neue + Syne', 'DM Sans', 'Bold authority, enterprise gravitas, institutional trust', 'Investors, enterprise clients, media'],
      ['FeasibilityFinder', 'Plus Jakarta Sans', 'Plus Jakarta Sans Light', 'Friendly, modern, approachable, accessible', 'Nigerian public — non-technical citizens'],
      ['FeasibilityFinance', 'Fraunces (Serif)', 'DM Sans', 'Financial trust, institutional credibility, premium SaaS', 'Cooperative treasurers, administrators'],
      ['Feasibility3D', 'Rajdhani', 'Barlow Light', 'Technical precision, engineering blueprint, military', 'O&G engineers, EPC project managers'],
    ],
  ),

  spacer(200),
  h3('4.2.1  Type Scale  —  Shared Across All Products'),
  componentTable(
    ['Token', 'Size', 'Line Height', 'Weight', 'Usage'],
    [2000, 900, 1200, 900, 4360],
    [
      ['--fg-display-2xl', '120px / 7.5rem', '0.90', '700–900', 'Hero headline — Bebas Neue / Rajdhani only'],
      ['--fg-display-xl', '80px / 5rem', '0.92', '700–900', 'Section heroes, product headings'],
      ['--fg-display-lg', '60px / 3.75rem', '1.00', '700', 'Large page titles, clamped headings'],
      ['--fg-display-md', '48px / 3rem', '1.05', '700', 'Section headings, card prominents'],
      ['--fg-display-sm', '36px / 2.25rem', '1.1', '700', 'Subsection headings, modal titles'],
      ['--fg-text-xl', '20px / 1.25rem', '1.6', '400–500', 'Lead paragraphs, hero subtitles'],
      ['--fg-text-lg', '18px / 1.125rem', '1.65', '400', 'Body large — feature descriptions'],
      ['--fg-text-md', '16px / 1rem', '1.7', '400', 'Default body text'],
      ['--fg-text-sm', '14px / 0.875rem', '1.5', '400–500', 'Secondary text, meta, card body'],
      ['--fg-text-xs', '12px / 0.75rem', '1.4', '500–700', 'Labels, badges, eyebrows, captions'],
      ['--fg-text-2xs', '11px / 0.6875rem', '1.4', '700', 'Micro labels — table headers, chips'],
    ],
  ),

  spacer(240),
  h2('4.3  Spacing & Radius System', C.navy),
  componentTable(
    ['Token', 'Value', 'Usage'],
    [2400, 1600, 5360],
    [
      ['--fg-space-1', '4px', 'Micro gaps — icon to label, badge padding'],
      ['--fg-space-2', '8px', 'Component internal gaps — input icon, button icon'],
      ['--fg-space-3', '12px', 'Card internal padding tight'],
      ['--fg-space-4', '16px', 'Standard gap — list items, form rows'],
      ['--fg-space-5', '20px', 'Card padding, section internal'],
      ['--fg-space-6', '24px', 'Panel padding, grid gap default'],
      ['--fg-space-8', '32px', 'Section padding compact'],
      ['--fg-space-10', '40px', 'Hero content spacing'],
      ['--fg-space-12', '48px', 'Section vertical rhythm'],
      ['--fg-space-16', '64px', 'Major section breaks'],
      ['--fg-space-20', '80px', 'Section padding standard'],
      ['--fg-space-24', '96px', 'Section padding generous'],
      ['--fg-radius-sm', '6px', 'Buttons, badges, small chips'],
      ['--fg-radius-md', '10px', 'Cards, inputs, standard components'],
      ['--fg-radius-lg', '16px', 'Modal, large cards, pricing panels'],
      ['--fg-radius-xl', '20px', 'Dashboard surface, glass panels'],
      ['--fg-radius-2xl', '28px', 'Hero panels, phone mockup'],
      ['--fg-radius-full', '9999px', 'Pills, eyebrow badges, avatar circles'],
    ],
  ),
  pageBreak(),
);

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 5 — HEROUI V3 CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════
add(
  h1('5.  HeroUI v3 Configuration & Customisation'),

  h2('5.1  Installation & Workspace Setup', C.navy),
  p('HeroUI v3 is installed once at the workspace root and consumed by all Next.js apps. The shared theme configuration lives in packages/design-system/heroui/ and is imported by each app\'s HeroUI provider.'),
  spacer(100),

  codeBlock('# Install at workspace root'),
  codeBlock('npm install @heroui/react framer-motion -w'),
  codeBlock(''),
  codeBlock('# tailwind.config.ts — packages/design-system/tailwind.config.ts'),
  codeBlock('import { heroui } from "@heroui/react";'),
  codeBlock(''),
  codeBlock('export default {'),
  codeBlock('  content: ['),
  codeBlock('    "./apps/**/*.{ts,tsx}",'),
  codeBlock('    "./packages/**/*.{ts,tsx}",'),
  codeBlock('    "./node_modules/@heroui/theme/dist/**/*.{js,ts,jsx,tsx}",'),
  codeBlock('  ],'),
  codeBlock('  theme: { extend: {} },'),
  codeBlock('  darkMode: "class",'),
  codeBlock('  plugins: [heroui({'),
  codeBlock('    themes: {'),
  codeBlock('      "fg-corporate": { ... },  // see 5.2'),
  codeBlock('      "fg-finder":    { ... },'),
  codeBlock('      "fg-finance":   { ... },'),
  codeBlock('      "fg-3d":        { ... },'),
  codeBlock('    }'),
  codeBlock('  })],'),
  codeBlock('};'),

  spacer(200),
  h2('5.2  Per-Product HeroUI Theme Definitions', C.navy),
  p('Each product app wraps its content in a HeroUI Provider with the correct theme. The theme key switches the entire HeroUI colour system — primary, secondary, danger, warning, success — to the product\'s palette.'),
  spacer(100),

  h3('Theme: fg-corporate (Navy + Blue)'),
  codeBlock('"fg-corporate": {'),
  codeBlock('  extend: "dark",'),
  codeBlock('  colors: {'),
  codeBlock('    background: "#070E1C",'),
  codeBlock('    foreground: "#F9FAFB",'),
  codeBlock('    primary: { DEFAULT: "#1A4F8B", foreground: "#FFFFFF",'),
  codeBlock('      50:"#EBF0F8", 100:"#C5D3EC", 200:"#9DB6DF",'),
  codeBlock('      300:"#6D91CC", 400:"#3D6CB8", 500:"#1A4F8B",'),
  codeBlock('      600:"#143E6E", 700:"#0F2E51", 800:"#0A1F44", 900:"#06122A" },'),
  codeBlock('    secondary: { DEFAULT: "#1FAF5A", foreground: "#FFFFFF" },'),
  codeBlock('    content1: "#0D1525",  // card surface'),
  codeBlock('    content2: "#111C30",  // elevated surface'),
  codeBlock('    content3: "#1A2840",  // border default'),
  codeBlock('    divider: "rgba(255,255,255,0.08)",'),
  codeBlock('  }'),
  codeBlock('},'),

  spacer(160),
  h3('Theme: fg-finder (Green — #1FAF5A)'),
  codeBlock('"fg-finder": {'),
  codeBlock('  extend: "dark",'),
  codeBlock('  colors: {'),
  codeBlock('    background: "#040D08",'),
  codeBlock('    foreground: "#F0FFF6",'),
  codeBlock('    primary: { DEFAULT: "#1FAF5A", foreground: "#FFFFFF",'),
  codeBlock('      50:"#EDF9F2", 500:"#1FAF5A", 600:"#0E8A4F", 900:"#063D22" },'),
  codeBlock('    secondary: { DEFAULT: "#1A6BC8", foreground: "#FFFFFF" },'),
  codeBlock('    content1: "#071410",  // card surface'),
  codeBlock('    content2: "#0A1C14",'),
  codeBlock('    content3: "rgba(31,175,90,0.15)",  // green-tinted border'),
  codeBlock('    divider: "rgba(31,175,90,0.1)",'),
  codeBlock('  }'),
  codeBlock('},'),

  spacer(160),
  h3('Theme: fg-finance (Gold — #C9A227)'),
  codeBlock('"fg-finance": {'),
  codeBlock('  extend: "dark",'),
  codeBlock('  colors: {'),
  codeBlock('    background: "#06090F",'),
  codeBlock('    foreground: "#FAF7F0",'),
  codeBlock('    primary: { DEFAULT: "#C9A227", foreground: "#0A1F44",'),
  codeBlock('      50:"#FBF6E8", 400:"#E8C45A", 500:"#C9A227",'),
  codeBlock('      600:"#A07B10", 900:"#4A3608" },'),
  codeBlock('    secondary: { DEFAULT: "#1A4F8B", foreground: "#FFFFFF" },'),
  codeBlock('    content1: "#080D18",'),
  codeBlock('    content2: "#0D1525",'),
  codeBlock('    content3: "rgba(201,162,39,0.15)",  // gold-tinted border'),
  codeBlock('    divider: "rgba(201,162,39,0.1)",'),
  codeBlock('  }'),
  codeBlock('},'),

  spacer(160),
  h3('Theme: fg-3d (Electric Blue — #007BFF + Orange #FF6B00)'),
  codeBlock('"fg-3d": {'),
  codeBlock('  extend: "dark",'),
  codeBlock('  colors: {'),
  codeBlock('    background: "#030608",'),
  codeBlock('    foreground: "#EDF4FF",'),
  codeBlock('    primary: { DEFAULT: "#007BFF", foreground: "#FFFFFF",'),
  codeBlock('      50:"#EBF4FF", 500:"#007BFF", 600:"#0055C4", 900:"#001F50" },'),
  codeBlock('    secondary: { DEFAULT: "#FF6B00", foreground: "#FFFFFF" },'),
  codeBlock('    content1: "#050A10",'),
  codeBlock('    content2: "#080F1A",'),
  codeBlock('    content3: "rgba(0,123,255,0.18)",'),
  codeBlock('    divider: "rgba(0,123,255,0.12)",'),
  codeBlock('  }'),
  codeBlock('},'),

  spacer(200),
  h2('5.3  HeroUI Provider Setup Per App', C.blue),
  codeBlock('// apps/finder-web/app/layout.tsx'),
  codeBlock('import { HeroUIProvider } from "@heroui/react";'),
  codeBlock('import { ThemeProvider } from "next-themes";'),
  codeBlock(''),
  codeBlock('export default function RootLayout({ children }) {'),
  codeBlock('  return ('),
  codeBlock('    <html lang="en" className="fg-finder dark">'),
  codeBlock('      <body>'),
  codeBlock('        <ThemeProvider attribute="class" defaultTheme="dark" themes={["dark"]}>'),
  codeBlock('          <HeroUIProvider>'),
  codeBlock('            {children}'),
  codeBlock('          </HeroUIProvider>'),
  codeBlock('        </ThemeProvider>'),
  codeBlock('      </body>'),
  codeBlock('    </html>'),
  codeBlock('  );'),
  codeBlock('}'),
  pageBreak(),
);

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 6 — COMPONENT LIBRARY SPECIFICATION
// ═══════════════════════════════════════════════════════════════════════════
add(
  h1('6.  Component Library Specification'),
  p('All components in packages/ui wrap HeroUI v3 primitives. The fg- prefix is used on all component names to namespace them from HeroUI internals. Components are typed with TypeScript generics, export their own props interfaces, and are individually documented with Storybook stories.'),
  spacer(120),

  h2('6.1  Button System', C.navy),
  p('Extracted from the HTML prototypes. All four products share the button shape system (border-radius: --fg-radius-sm = 6px for 3D; --fg-radius-md = 10px for Finder/Finance; --fg-radius-sm = 6px for Corporate). Buttons are HeroUI Button components with variant and size overrides.'),
  spacer(100),

  componentTable(
    ['Component', 'HeroUI Base', 'Product Usage', 'Key Props', 'Visual Spec'],
    [1800, 1500, 1500, 2000, 2560],
    [
      ['FgButton', 'Button', 'All products', 'variant, size, color, isLoading', 'Radius: md (10px). Hover: translateY(-2px). Shadow on hover'],
      ['FgButtonGreen', 'Button', 'Finder', 'size, isLoading', 'bg: #1FAF5A. Hover shadow: rgba(31,175,90,0.35)'],
      ['FgButtonGold', 'Button', 'Finance', 'size, isLoading', 'bg: #C9A227. text: #0A1F44. Hover: #E8C45A'],
      ['FgButtonBlue', 'Button', '3D, Corporate', 'size, isLoading', 'bg: gradient(#007BFF, #0055C4). radius: 6px. Hover glow'],
      ['FgButtonOutline', 'Button', 'All products', 'product, size', 'transparent bg. border: rgba(255,255,255,0.12). Hover: tinted border'],
      ['FgButtonGhost', 'Button', 'Nav, tables', 'size, color', 'No border. Hover: bg surface. Used in nav links, table actions'],
      ['FgButtonIcon', 'Button', 'All products', 'icon, aria-label', 'Square. isIconOnly. Used for close, search, notification toggles'],
      ['FgDownloadButton', 'Button', 'Finder', 'store, href', 'App Store / Play Store. Custom icon left. Pill radius (--fg-radius-full)'],
    ],
  ),

  spacer(200),
  h2('6.2  Card & Surface System', C.navy),
  p('Cards are the primary surface unit across all products. The card system is derived directly from the HTML prototypes and uses HeroUI\'s Card primitive with custom Tailwind variants.'),
  spacer(100),

  componentTable(
    ['Component', 'Border Radius', 'Background', 'Border', 'Usage'],
    [2000, 1400, 2400, 2000, 1560],
    [
      ['FgCard', '--fg-radius-xl (20px)', 'content1 (product dark surface)', 'content3 (product tinted border)', 'Feature cards, pricing, module panels'],
      ['FgGlassCard', '--fg-radius-xl (20px)', 'rgba(product-primary, 0.05)', 'rgba(product-primary, 0.15)', 'Hero floating cards, stats, proof elements'],
      ['FgStat', '--fg-radius-md (10px)', 'rgba(white, 0.02)', 'rgba(white, 0.06)', 'Dashboard metric tiles (Finance dashboard)'],
      ['FgProblemCard', '--fg-radius-md (12px)', 'rgba(red, 0.04)', 'rgba(red, 0.12)', 'Finder — problem statement items'],
      ['FgSolutionCard', '--fg-radius-md (12px)', 'product surface', 'product border', 'Finder — solution / how it works items'],
      ['FgPricingCard', '--fg-radius-lg (16px)', 'rgba(white, 0.02)', '1px white 7% / featured: product', 'Finance / 3D pricing tiers'],
      ['FgIndustryCard', '--fg-radius-md (10px)', 'rgba(blue, 0.03)', 'rgba(blue, 0.10)', '3D — industry vertical cards'],
      ['FgDashCard', '--fg-radius-md (12px)', 'rgba(white, 0.03)', 'rgba(white, 0.06)', 'Finance dashboard module cards'],
      ['FgPhoneCard', '--fg-radius-2xl (28px)', 'gradient dark green', 'rgba(green, 0.30)', 'Finder — phone mockup shell'],
    ],
  ),

  spacer(200),
  h2('6.3  Navigation System', C.navy),
  p('Every product has a fixed top navigation bar built from HeroUI Navbar. The nav is product-themed via HeroUI\'s className prop. Glassmorphism effect (backdrop-blur-md, product-bg/80) is applied uniformly.'),
  spacer(100),

  componentTable(
    ['Component', 'Product', 'Logo Font', 'CTA Style', 'Nav Links Color'],
    [2000, 1400, 2000, 2200, 1760],
    [
      ['FgNav (Corporate)', 'feasibilitygiants.com', 'Syne 800 + span 400 uppercase', 'gradient blue→green, radius 6px', 'rgba(255,255,255,0.65)'],
      ['FgNav (Finder)', 'finder.fg.com', 'Plus Jakarta Sans 800, green accent span', 'solid green #1FAF5A, radius 8px', 'rgba(240,255,246,0.45)'],
      ['FgNav (Finance)', 'finance.fg.com', 'Fraunces 700, gold accent span', 'solid gold #C9A227, navy text, radius 8px', 'rgba(250,247,240,0.45)'],
      ['FgNav (3D)', '3d.fg.com', 'Rajdhani 700, orange accent span', 'gradient blue, radius 6px, border', 'rgba(237,244,255,0.45)'],
    ],
  ),

  spacer(200),
  h2('6.4  Form Components', C.navy),
  p('All form inputs use HeroUI Input, Select, Textarea, and Checkbox. Product themes control focus ring colour automatically via the HeroUI primary colour token. All forms use React Hook Form + Zod for validation.'),
  spacer(100),

  componentTable(
    ['Component', 'HeroUI Base', 'Variant', 'Usage'],
    [2200, 1800, 1800, 3560],
    [
      ['FgInput', 'Input', 'bordered + dark product fill', 'All text inputs — email, name, phone, search'],
      ['FgSelect', 'Select', 'bordered + dark product fill', 'Dropdowns — role, country, industry, frequency'],
      ['FgTextarea', 'Textarea', 'bordered', 'Message fields — demo request, contact, enquiry'],
      ['FgCheckbox', 'Checkbox', 'product primary color', 'Consent gates (NDPR), feature comparison, settings'],
      ['FgSwitch', 'Switch', 'product primary color', 'Settings toggles, notification preferences'],
      ['FgSlider', 'Slider', 'product primary color', 'Finance — loan amount selector, term selector'],
      ['FgDatePicker', 'DateInput', 'bordered', 'Finance — repayment dates, statement period'],
      ['FgOTPInput', 'InputOTP (custom)', 'custom 6-box layout', 'Auth — NIN verification OTP, login MFA'],
    ],
  ),

  spacer(200),
  h2('6.5  Badge & Status Components', C.navy),
  componentTable(
    ['Component', 'HeroUI Base', 'Variants', 'Usage'],
    [2200, 1800, 2400, 2960],
    [
      ['FgBadge', 'Chip', 'solid / bordered / flat', 'Feature labels, tech stack tags, module tags'],
      ['FgStatusBadge', 'Chip', 'verified / pending / rejected / active', 'NIN status, KYC status, loan status'],
      ['FgEyebrow', 'Custom (div)', 'pill + animated dot', 'Section eyebrows — "IDENTITY VERIFICATION", "PHASE 3"'],
      ['FgTag', 'Chip', 'flat rounded-full', 'Category tags, solution types, industry tags'],
      ['FgNotificationDot', 'Badge', 'pulsing primary color', 'Nav notifications, live data indicators'],
    ],
  ),

  spacer(200),
  h2('6.6  Layout & Structural Components', C.navy),
  componentTable(
    ['Component', 'Description', 'Usage'],
    [2400, 4000, 2960],
    [
      ['FgSection', 'Full-width section wrapper. padding: 100px 60px (desk), 60px 20px (mob). position: relative. overflow: hidden', 'Wraps every page section'],
      ['FgContainer', 'Max-width: 1280px. auto margins. responsive padding', 'Inner content constraint for all pages'],
      ['FgGrid', 'CSS Grid wrapper. grid-template-columns configurable via props. gap: 20px default', 'Feature cards, pricing, industry grids'],
      ['FgHeroBackground', 'Layered div with product radial gradient + grid pattern + noise texture via CSS', 'Every product hero section'],
      ['FgScanline', 'Animated horizontal line (CSS ::after). Product primary color at 40% opacity', 'Finder + 3D hero animation'],
      ['FgCorner', 'Blueprint corner marks (20px L-shaped borders). 4 positions', '3D product pages exclusively'],
      ['FgSpecsStrip', 'Flex container with bordered dividers. Rajdhani font. Engineering metadata', '3D hero specs bar'],
      ['FgDivider', 'HeroUI Divider. tinted with product colour at 10–15% opacity', 'Section separators, form field groups'],
    ],
  ),

  spacer(200),
  h2('6.7  Feedback & Overlay Components', C.navy),
  componentTable(
    ['Component', 'HeroUI Base', 'Usage'],
    [2400, 2000, 4960],
    [
      ['FgModal', 'Modal', 'Demo request form, KYC upload, loan application, whitepaper gate'],
      ['FgDrawer', 'Drawer', 'Mobile nav, Finance module detail, 3D case study preview'],
      ['FgToast', 'useDisclosure + custom', 'Form submission confirmations, API error alerts, loan status updates'],
      ['FgTooltip', 'Tooltip', 'Dashboard metric explanations, form field hints, feature tag definitions'],
      ['FgPopover', 'Popover', 'User profile menu, notification panel, date pickers'],
      ['FgAlert', 'Custom (div)', 'NDPR consent notices, regulatory warnings, important system messages'],
      ['FgProgressBar', 'Progress', 'Loan repayment progress, onboarding completion, KYC verification steps'],
      ['FgSkeleton', 'Skeleton', 'Dashboard data loading states, news feed, member directory'],
      ['FgSpinner', 'Spinner', 'Button loading states, page transitions, API fetch indicators'],
    ],
  ),

  spacer(200),
  h2('6.8  Data Display Components', C.navy),
  componentTable(
    ['Component', 'HeroUI Base', 'Finance Usage', 'Finder Usage', '3D Usage'],
    [2000, 1600, 2000, 1800, 1960],
    [
      ['FgTable', 'Table', 'Loan list, member directory, audit log, repayment schedule', 'Call history, fraud alerts', 'Comparison table, licensing'],
      ['FgPagination', 'Pagination', 'Member directory paging, transaction history', 'Call log pagination', 'Case studies pagination'],
      ['FgTabs', 'Tabs', 'Dashboard module tabs, pricing toggle, settings sections', 'Privacy tabs', 'Solutions / Tech / Industries tabs'],
      ['FgAccordion', 'Accordion', 'FAQ sections, loan terms, cooperative bylaws', 'Privacy FAQ, App FAQ', 'Technical FAQ, API docs'],
      ['FgAvatar', 'Avatar', 'Member profile, loan officer assignments, admin header', 'User profile', 'Enterprise client portal'],
      ['FgUser', 'User', 'Member list rows, dashboard header with role badge', '—', '—'],
      ['FgAvatarGroup', 'AvatarGroup', 'Cooperative members count display, team section', '—', 'Enterprise seat holders'],
      ['FgCode', 'Code', 'API documentation, integration guide', 'SDK code samples', 'API integration guide'],
    ],
  ),
  pageBreak(),
);

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 7 — PRODUCT-SPECIFIC THEMING
// ═══════════════════════════════════════════════════════════════════════════
add(
  h1('7.  Product-Specific Theming'),

  // ── 7.1 CORPORATE ──
  productBanner('7.1  Feasibility Giant Corporate Site', 'feasibilitygiants.com  ·  Navy #0A1F44  ·  Bebas Neue + Syne / DM Sans', C.navy),
  spacer(160),

  h2('Design Character', C.navy),
  p('The corporate site is the institutional trust anchor of the ecosystem. It must communicate: "We are a serious, legitimate, enterprise-grade Nigerian technology company." The Bebas Neue headline with Syne body creates a bold editorial feel — part architecture firm, part consulting giant. Dark mode primary (#070E1C background) with blue/green radial gradient.'),
  spacer(100),

  h3('Hero Section Specification'),
  componentTable(
    ['Element', 'Specification'],
    [2400, 6960],
    [
      ['Background', '#070E1C + radial gradient: blue 35% at 50% 0%, green 15% at 80% 60%, gold 10% at 10% 80%'],
      ['Grid overlay', 'linear-gradient lines rgba(255,255,255,0.03) every 60px. Masked with radial (80% → transparent 80%)'],
      ['Eyebrow badge', 'pill. bg: rgba(26,79,139,0.25). border: rgba(26,79,139,0.5). pulsing green dot. Syne 11px 700 uppercase'],
      ['H1 Display', 'Bebas Neue 130px clamped. Line-height 0.92. Two lines: white + gradient (blue→green)'],
      ['Hero subtitle', 'DM Sans 18px 300. color: rgba(255,255,255,0.6). max-width 560px'],
      ['Primary CTA', 'FgButton. gradient(blue→green). radius 6px. "Get in Touch"'],
      ['Secondary CTA', 'FgButtonOutline. "Explore Products"'],
      ['Product cards row', '3x FgCard below hero — Finder (green), Finance (gold), 3D (blue). Each routes to subdomain'],
    ],
  ),

  spacer(160),
  h3('Page Structure — All Pages'),
  componentTable(
    ['Page', 'Route', 'Key Sections', 'Render Strategy'],
    [1400, 1600, 4000, 2360],
    [
      ['Home', '/', 'Hero, Product Ecosystem (3 cards), Services, About snippet, Trust stats, CTA', 'SSG'],
      ['About', '/about', 'Leadership (Prof. Japheth), Mission, History, RC: 1939172, Values, Team', 'SSG'],
      ['Products', '/products', 'Product cards (3) routing to subdomains, Feature comparison, CTA', 'SSG'],
      ['Training', '/training', 'Programme overview, Course catalogue (Sanity CMS), Enrolment CTA', 'ISR'],
      ['Research', '/research', 'Innovation lab overview, Publications (Sanity CMS), Partnerships', 'ISR'],
      ['Contact', '/contact', 'Form (name/email/subject/message), Map embed, Address, Phone, Email', 'SSG'],
    ],
  ),

  spacer(240),
  // ── 7.2 FINDER ──
  productBanner('7.2  FeasibilityFinder', 'finder.feasibilitygiants.com  ·  Green #1FAF5A  ·  Plus Jakarta Sans', C.greenDk),
  spacer(160),

  h2('Design Character', C.greenDk),
  p('FeasibilityFinder is a consumer-facing mobile app landing page. The green palette evokes Nigerian national identity, safety, and trust. The design is bold and approachable — not technical. The phone mockup is the centrepiece. Scan line animation and floating verification badges communicate real-time identity intelligence.'),
  spacer(100),

  h3('Hero Section Specification'),
  componentTable(
    ['Element', 'Specification'],
    [2400, 6960],
    [
      ['Background', '#040D08 + radial gradient: green 20% at 50% -10%, green-dark 8% at 80% 80%'],
      ['Grid overlay', 'green lines rgba(31,175,90,0.04) every 50px. Scan line animation 4s linear infinite'],
      ['Eyebrow badge', 'pill. bg: rgba(31,175,90,0.10). border: rgba(31,175,90,0.25). blinking green dot. Plus Jakarta 11px 700 uppercase'],
      ['H1 Display', 'Bebas Neue 120px clamped. Line-height 0.90. "KNOW WHO CALLS" (white) + "BEFORE YOU ANSWER" (gradient green→blue)'],
      ['Hero subtitle', 'Plus Jakarta Sans 16px 400. color: rgba(240,255,246,0.45). max-width 520px'],
      ['Primary CTA', 'FgButtonGreen. "Download App". Play Store icon'],
      ['Secondary CTA', 'FgButtonOutline. "Enterprise Demo"'],
      ['Phone mockup', 'FgPhoneCard 220x440px. radius 36px. Incoming call card (green). NIN verified badge. Location row. Actions row'],
      ['Floating badges', '3x FgGlassCard. Absolute positioned. Animation: floatA/B keyframes. "NIN Verified", "Live Location", "Fraud Alert"'],
    ],
  ),

  spacer(160),
  h3('Page Structure — FeasibilityFinder'),
  componentTable(
    ['Page', 'Route', 'Key Sections', 'Render Strategy'],
    [1600, 1800, 3800, 2160],
    [
      ['Landing', '/', 'Hero + phone, Problem (red cards), Solution (green cards), Features (6 grid), How It Works (5 steps)', 'SSG'],
      ['Features', '/features', 'Verified Caller Identity, Real-Time Location, NIN Integration, Fraud Alert, Enterprise Dashboard', 'SSG'],
      ['How It Works', '/how-it-works', '5-step user flow: Install → Register → Detect → Match → Alert. Animated step timeline', 'SSG'],
      ['Privacy', '/privacy', 'NDPR compliance statement, AES-256 disclosure, consent architecture, data retention', 'SSG'],
      ['Enterprise', '/enterprise', 'Enterprise dashboard preview, demo request form (FgModal), ROI stats', 'SSG'],
      ['Download', '/download', 'App Store + Play Store deep links with UTM tracking, QR code', 'SSG'],
      ['FAQ', '/faq', 'FgAccordion. Government approval status, NIN storage, pricing, data safety', 'SSG'],
      ['Blog', '/blog', 'Sanity CMS. NIN security posts, phone fraud prevention, identity systems', 'ISR'],
    ],
  ),

  spacer(160),
  h3('NDPR Consent Gate  —  Critical Regulatory Component'),
  callout(
    'LEGAL REQUIREMENT',
    'FeasibilityFinder must display an explicit NDPR consent gate (FgAlert variant="regulatory") before any data collection form renders. This is implemented as an FgModal that cannot be dismissed without accepting or rejecting. Rejection = no form rendered. Acceptance = localStorage flag set + analytics consent granted. This component is mandatory and must be approved by Legal before deployment.',
    C.orange, C.orangeFill,
  ),

  spacer(240),
  // ── 7.3 FINANCE ──
  productBanner('7.3  FeasibilityFinance', 'finance.feasibilitygiants.com  ·  Gold #C9A227  ·  Fraunces + DM Sans', C.gold, C.navy),
  spacer(160),

  h2('Design Character', C.gold),
  p('FeasibilityFinance is the most complex product — a multi-tenant SaaS with a full dashboard. The Fraunces serif display font communicates institutional financial credibility. The gold palette evokes established Nigerian financial institutions. The dashboard preview in the hero (3 metric cards + bar chart + transaction table) immediately communicates the product value.'),
  spacer(100),

  h3('Marketing Landing Page  —  Hero Section'),
  componentTable(
    ['Element', 'Specification'],
    [2400, 6960],
    [
      ['Background', '#06090F + radial gradient: navy 50% at -10% 50%, gold 8% at 110% 50%'],
      ['Grid overlay', 'gold lines rgba(201,162,39,0.03) every 60px'],
      ['H1 Display', 'Fraunces 900 72px serif. "Cooperative Finance" + "Made Effortless" with italic gold span'],
      ['Hero subtitle', 'DM Sans 16px 300. max-width 480px'],
      ['Primary CTA', 'FgButtonGold. bg: #C9A227. text: #0A1F44. "Start Free Trial"'],
      ['Stats row', '3x FgGlassCard below CTA: "10,000+ Members Managed", "₦2.4B Tracked", "99.9% Uptime"'],
      ['Dashboard preview', 'FgCard glass. Contains: 3 FgStat cards (gold/green/blue values), bar chart, transactions table (5 rows)'],
    ],
  ),

  spacer(160),
  h3('SaaS Dashboard  —  Module Architecture'),
  p('The Finance dashboard is a Next.js App Router layout with a persistent sidebar (FgDashboardSidebar) and a content area. The sidebar renders different items per role. Five main dashboard modules are implemented as separate route segments under /app/(dashboard)/.'),
  spacer(100),

  componentTable(
    ['Module', 'Route', 'Components', 'Role Access'],
    [1600, 2000, 3600, 2160],
    [
      ['Overview', '/dashboard', 'FgStat x4, FgChart (recharts), FgTable recent transactions, FgCard alerts', 'All roles'],
      ['Members', '/dashboard/members', 'FgTable + FgPagination, FgModal (add member), FgUser rows, FgStatusBadge KYC', 'Admin, Auditor (read)'],
      ['Contributions', '/dashboard/contributions', 'FgTable, FgStat summary bar, CSV export button, FgDatePicker filter', 'Treasurer, Admin, Auditor'],
      ['Loans', '/dashboard/loans', 'FgTable, FgModal (application), FgProgressBar (repayment), FgTabs (pending/active/closed)', 'Loan Officer, Treasurer, Admin'],
      ['Reports', '/dashboard/reports', 'FgTabs (monthly/annual), PDF export, FgDatePicker, FgChart, FgTable audit log', 'All roles (scoped)'],
      ['Settings', '/dashboard/settings', 'FgTabs (org/users/notifications/billing), FgSwitch, FgInput, FgSelect', 'Admin only'],
    ],
  ),

  spacer(160),
  h3('Dashboard Sidebar Specification'),
  componentTable(
    ['Element', 'Specification'],
    [2400, 6960],
    [
      ['Width', '240px fixed. Collapsible to 64px icon-only mode (FgSwitch toggle)'],
      ['Background', 'content1 (#080D18). border-right: 1px rgba(201,162,39,0.12)'],
      ['Logo area', 'FgUser component. Cooperative name (Fraunces font). Role badge (FgBadge)'],
      ['Nav items', 'FgButtonGhost. Active: bg gold 8%, left border 3px gold. Icon + label. FgTooltip on collapsed'],
      ['Bottom section', 'Divider. Settings link. User avatar (FgAvatar). Logout (FgButtonGhost destructive)'],
      ['Mobile', 'FgDrawer from left. Triggered by hamburger in FgNav mobile variant'],
    ],
  ),

  spacer(240),
  // ── 7.4 3D ──
  productBanner('7.4  Feasibility3D', '3d.feasibilitygiants.com  ·  Electric #007BFF + Orange #FF6B00  ·  Rajdhani + Barlow', C.electric),
  spacer(160),

  h2('Design Character', C.electric),
  p('Feasibility3D targets oil & gas engineers and EPC project managers. The Rajdhani font communicates engineering precision and military-grade technical authority. Blueprint grid, corner marks, and scan line effects make the UI feel like a CAD environment. The dark background (#030608) is as dark as possible — closer to pure black than any other product.'),
  spacer(100),

  h3('Hero Section Specification'),
  componentTable(
    ['Element', 'Specification'],
    [2400, 6960],
    [
      ['Background', '#030608 + radial gradient: blue 18% at 50% -5%, orange 8% at 90% 70%'],
      ['Grid overlay', 'blue lines rgba(0,123,255,0.06) every 40px. Blueprint aesthetic. Corner marks (FgCorner) at 4 positions'],
      ['Scan line', 'CSS ::before. height 1px. gradient blue at 50%. animation: 5s linear infinite'],
      ['Eyebrow badge', 'radius 4px (NOT pill). Rajdhani 12px 600. bg: rgba(0,123,255,0.10). border: rgba(0,123,255,0.30). blinking orange square'],
      ['H1 Display', 'Rajdhani 700 110px. Line-height 0.92. Letter-spacing -0.01em. "ADVANCED" (white block) + gradient blue line + orange tag line'],
      ['Hero subtitle', 'Barlow 300 italic 16px. max-width 600px'],
      ['Primary CTA', 'FgButtonBlue. gradient(#007BFF, #0055C4). radius 6px. border rgba(0,123,255,0.40). "Request Demo"'],
      ['Secondary CTA', 'FgButtonOutline. text: orange. border: rgba(255,107,0,0.30). "Download Whitepaper"'],
      ['Specs strip', 'FgSpecsStrip. flex bordered dividers. 5 specs: C++ Engine, GIS Integrated, ML Modules, ISO-Aligned, Enterprise Grade'],
    ],
  ),

  spacer(160),
  h3('Page Structure — Feasibility3D'),
  componentTable(
    ['Page', 'Route', 'Key Sections', 'Render Strategy'],
    [1600, 1800, 3600, 2360],
    [
      ['Landing', '/', 'Hero, Solutions Grid (2x2), Technology Stack, Industries (8 cards), Comparison Table, Licensing, CTA', 'SSG'],
      ['Solutions', '/solutions', '4 modules: Engineering Design, Spill Quantification, Simulation, Economic Feasibility. Each with sub-features', 'SSG'],
      ['Technology', '/technology', 'Architecture diagram, C++/Python engine, GIS integration, ML modules, Security architecture', 'SSG'],
      ['Industries', '/industries', '8 vertical cards: O&G Operators, EPC, Pipeline, Environmental, Offshore, Consultants, Regulatory, Academic', 'SSG'],
      ['Case Studies', '/case-studies', 'FgCard grid from Sanity CMS. Format: Project, Challenge, Approach, Results, Impact', 'ISR'],
      ['Pricing', '/pricing', 'FgLicGrid 4 tiers: Enterprise Annual, Government, Academic, Add-on. Annual vs monthly toggle', 'SSG'],
      ['Security', '/security', 'ISO alignment, AES-256, encrypted local data, audit-ready outputs, compliance badges', 'SSG'],
      ['Demo Request', '/demo', 'FgModal trigger. 7-field form: Name, Organisation, Industry, Role, Country, Email, Project Type', 'SSG'],
    ],
  ),
  pageBreak(),
);

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 8 — LAYOUT TOPOLOGY
// ═══════════════════════════════════════════════════════════════════════════
add(
  h1('8.  Layout System & Page Topology'),

  h2('8.1  Shared Page Shell', C.navy),
  p('Every Next.js app shares an identical page shell pattern: FgNav (fixed top) + main content + FgFooter. The root layout.tsx for each app provides the HeroUI provider, theme class, and font loading. Page-level backgrounds (radial gradients, grid overlays) are applied in the hero section component, not the root layout.'),
  spacer(100),

  codeBlock('// Standard page shell pattern (all apps)'),
  codeBlock('<html className={`${theme} dark`}>'),
  codeBlock('  <body className="bg-background text-foreground">'),
  codeBlock('    <FgNav product="finder" />       {/* fixed z-100 */}'),
  codeBlock('    <main className="pt-[72px]">    {/* offset for fixed nav */}'),
  codeBlock('      <HeroSection />'),
  codeBlock('      <FeaturesSection />'),
  codeBlock('      <PricingSection />'),
  codeBlock('      {/* ...other sections */}'),
  codeBlock('    </main>'),
  codeBlock('    <FgFooter product="finder" />'),
  codeBlock('  </body>'),
  codeBlock('</html>'),

  spacer(200),
  h2('8.2  Marketing Page Section Rhythm', C.blue),
  componentTable(
    ['Breakpoint', 'Container Width', 'Section Padding (V)', 'Section Padding (H)', 'Grid Columns'],
    [1600, 1800, 1800, 1800, 2360],
    [
      ['Mobile (< 768px)', '100% - 40px', '60px', '20px', '1 column'],
      ['Tablet (768–1023px)', '100% - 80px', '80px', '40px', '2 columns'],
      ['Desktop (1024–1279px)', '100% - 120px', '100px', '60px', '3–4 columns'],
      ['Large (≥ 1280px)', '1280px max', '100px', '60px', '4–6 columns'],
      ['XL (≥ 1536px)', '1280px max (centered)', '100px', '60px', '4–6 columns'],
    ],
  ),

  spacer(200),
  h2('8.3  Dashboard Layout Topology (FeasibilityFinance)', C.gold),
  p('The Finance SaaS dashboard uses a two-column layout: fixed sidebar (240px) + fluid content area. This is implemented as a Next.js App Router nested layout under /app/(dashboard)/layout.tsx.'),
  spacer(100),

  componentTable(
    ['Zone', 'Dimensions', 'Component', 'Scroll Behaviour'],
    [1600, 1800, 2400, 3560],
    [
      ['Sidebar', '240px fixed left. Full viewport height', 'FgDashboardSidebar', 'Fixed — never scrolls'],
      ['Top bar', 'calc(100vw - 240px) x 64px. Fixed top, right of sidebar', 'FgDashTopBar', 'Fixed — never scrolls'],
      ['Content area', 'calc(100vw - 240px). Starts at 64px top', 'page.tsx per route', 'Scrolls independently'],
      ['Content inner', 'max-width 1040px. Padded 32px all sides', 'FgContainer variant="dashboard"', 'Part of scrolling content'],
      ['Mobile drawer', '80vw max. Slides from left', 'FgDrawer containing FgDashboardSidebar', 'Triggered by FgNav hamburger'],
    ],
  ),
  pageBreak(),
);

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 9 — DATABASE LAYER
// ═══════════════════════════════════════════════════════════════════════════
add(
  h1('9.  Database Layer  —  Prisma ORM + Supabase'),

  h2('9.1  Supabase Project Structure', C.navy),
  p('Each environment (development, staging, production) has its own Supabase project. Connection strings are stored as environment variables and consumed by Prisma\'s DATABASE_URL. Supabase\'s connection pooler (PgBouncer) is used for serverless Next.js functions — the DIRECT_URL bypasses the pooler for Prisma migrations.'),
  spacer(100),

  codeBlock('# .env.local (per app)'),
  codeBlock('DATABASE_URL="postgresql://postgres.[ref]:[password]@aws-0-eu-west-2.pooler.supabase.com:6543/postgres?pgbouncer=true"'),
  codeBlock('DIRECT_URL="postgresql://postgres.[ref]:[password]@aws-0-eu-west-2.pooler.supabase.com:5432/postgres"'),
  codeBlock('NEXT_PUBLIC_SUPABASE_URL="https://[ref].supabase.co"'),
  codeBlock('NEXT_PUBLIC_SUPABASE_ANON_KEY="[anon-key]"'),
  codeBlock('SUPABASE_SERVICE_ROLE_KEY="[service-role-key]"  # server-side only'),

  spacer(200),
  h2('9.2  Prisma Schema  —  Core Tables', C.navy),
  codeBlock('// prisma/schema.prisma'),
  codeBlock('generator client {'),
  codeBlock('  provider = "prisma-client-js"'),
  codeBlock('}'),
  codeBlock(''),
  codeBlock('datasource db {'),
  codeBlock('  provider  = "postgresql"'),
  codeBlock('  url       = env("DATABASE_URL")'),
  codeBlock('  directUrl = env("DIRECT_URL")'),
  codeBlock('}'),
  codeBlock(''),
  codeBlock('// ── MULTI-TENANCY ──'),
  codeBlock('model Tenant {'),
  codeBlock('  id         String   @id @default(cuid())'),
  codeBlock('  name       String'),
  codeBlock('  regNumber  String?  @unique'),
  codeBlock('  country    String   @default("NG")'),
  codeBlock('  plan       Plan     @default(FREE)'),
  codeBlock('  createdAt  DateTime @default(now())'),
  codeBlock('  members    Member[]'),
  codeBlock('  loans      Loan[]'),
  codeBlock('  users      User[]'),
  codeBlock('  auditLogs  AuditLog[]'),
  codeBlock('}'),
  codeBlock(''),
  codeBlock('model Member {'),
  codeBlock('  id           String     @id @default(cuid())'),
  codeBlock('  tenantId     String'),
  codeBlock('  tenant       Tenant     @relation(fields: [tenantId], references: [id])'),
  codeBlock('  memberCode   String     @unique'),
  codeBlock('  ninHash      String?    // AES-256 encrypted — never plaintext'),
  codeBlock('  kycStatus    KycStatus  @default(PENDING)'),
  codeBlock('  tier         Int        @default(1)'),
  codeBlock('  contributions Contribution[]'),
  codeBlock('  loans        Loan[]'),
  codeBlock('  createdAt    DateTime   @default(now())'),
  codeBlock('  @@index([tenantId])'),
  codeBlock('}'),
  codeBlock(''),
  codeBlock('model Contribution {'),
  codeBlock('  id        String   @id @default(cuid())'),
  codeBlock('  tenantId  String'),
  codeBlock('  memberId  String'),
  codeBlock('  member    Member   @relation(fields: [memberId], references: [id])'),
  codeBlock('  amount    Decimal  @db.Decimal(15,2)'),
  codeBlock('  currency  String   @default("NGN")'),
  codeBlock('  frequency String   // monthly | quarterly | annual'),
  codeBlock('  type      String   // savings | shares | levy'),
  codeBlock('  period    String   // "2026-01"'),
  codeBlock('  createdAt DateTime @default(now())'),
  codeBlock('  @@index([tenantId, memberId])'),
  codeBlock('}'),
  codeBlock(''),
  codeBlock('model Loan {'),
  codeBlock('  id         String     @id @default(cuid())'),
  codeBlock('  tenantId   String'),
  codeBlock('  memberId   String'),
  codeBlock('  member     Member     @relation(fields: [memberId], references: [id])'),
  codeBlock('  amount     Decimal    @db.Decimal(15,2)'),
  codeBlock('  rate       Decimal    @db.Decimal(5,2)  // annual %'),
  codeBlock('  termMonths Int'),
  codeBlock('  status     LoanStatus @default(PENDING)'),
  codeBlock('  approverId String?'),
  codeBlock('  repayments Repayment[]'),
  codeBlock('  createdAt  DateTime   @default(now())'),
  codeBlock('  @@index([tenantId, memberId])'),
  codeBlock('}'),
  codeBlock(''),
  codeBlock('model AuditLog {'),
  codeBlock('  id        String   @id @default(cuid())'),
  codeBlock('  tenantId  String'),
  codeBlock('  userId    String'),
  codeBlock('  action    String'),
  codeBlock('  table     String'),
  codeBlock('  rowId     String'),
  codeBlock('  oldData   Json?'),
  codeBlock('  newData   Json?'),
  codeBlock('  createdAt DateTime @default(now())'),
  codeBlock('}'),
  codeBlock(''),
  codeBlock('enum Plan        { FREE GROWTH ENTERPRISE }'),
  codeBlock('enum KycStatus   { PENDING VERIFIED REJECTED }'),
  codeBlock('enum LoanStatus  { PENDING APPROVED ACTIVE REPAID DEFAULTED REJECTED }'),

  spacer(200),
  h2('9.3  Supabase Row-Level Security (RLS)', C.navy),
  p('RLS policies are defined in Supabase\'s SQL editor and enforced at the database engine level. The tenant_id claim is extracted from the JWT set by Supabase Auth and used in every policy. No application-level tenant filtering is trusted alone.'),
  spacer(100),

  codeBlock('-- Enable RLS on all tenant-scoped tables'),
  codeBlock('ALTER TABLE "Member" ENABLE ROW LEVEL SECURITY;'),
  codeBlock('ALTER TABLE "Contribution" ENABLE ROW LEVEL SECURITY;'),
  codeBlock('ALTER TABLE "Loan" ENABLE ROW LEVEL SECURITY;'),
  codeBlock('ALTER TABLE "AuditLog" ENABLE ROW LEVEL SECURITY;'),
  codeBlock(''),
  codeBlock('-- Policy: Members can only see their own tenant\'s data'),
  codeBlock('CREATE POLICY "tenant_isolation_member" ON "Member"'),
  codeBlock('  FOR ALL USING ('),
  codeBlock('    "tenantId" = (auth.jwt() ->> \'tenant_id\')::text'),
  codeBlock('  );'),

  spacer(200),
  h2('9.4  Prisma Client Setup (Singleton Pattern)', C.blue),
  codeBlock('// packages/utils/src/prisma.ts'),
  codeBlock('import { PrismaClient } from "@prisma/client";'),
  codeBlock(''),
  codeBlock('const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };'),
  codeBlock(''),
  codeBlock('export const prisma ='),
  codeBlock('  globalForPrisma.prisma ||'),
  codeBlock('  new PrismaClient({ log: process.env.NODE_ENV === "development" ? ["query"] : [] });'),
  codeBlock(''),
  codeBlock('if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;'),
  pageBreak(),
);

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 10 — RESPONSIVE DESIGN
// ═══════════════════════════════════════════════════════════════════════════
add(
  h1('10.  Responsive Design System'),
  p('All products are designed desktop-first for marketing pages (product audiences are primarily desktop users) and mobile-first for the Finance dashboard (field access by cooperative members). The phone mockup hero on Finder is the primary mobile consideration for that product.'),
  spacer(120),

  componentTable(
    ['Component', 'Mobile (< 768px)', 'Tablet (768–1023px)', 'Desktop (≥ 1024px)'],
    [2000, 2400, 2200, 2760],
    [
      ['FgNav', 'Logo + Hamburger only. Nav links hidden. FgDrawer for mobile menu', 'Logo + 4 nav items + CTA', 'Logo + all nav items + CTA'],
      ['Hero H1', 'clamp(48px, 12vw, 72px)', 'clamp(64px, 10vw, 96px)', 'clamp(72px, 10vw, 130px)'],
      ['Hero layout', 'Stack: eyebrow / h1 / sub / btns / mockup', 'Stack or 1-col wide', '2-col grid (text left, visual right) or centered'],
      ['Feature grid', '1 column', '2 columns', '3–4 columns'],
      ['Pricing grid', '1 column (stacked)', '2 columns', '3 columns'],
      ['Finance Dashboard', 'FgDrawer sidebar. Single column content', '240px sidebar. Content adapts', '240px sidebar. Multi-col content'],
      ['Solution cards (3D)', '1 column', '1 column', '2x2 grid with dividers'],
      ['Specs strip (3D)', '2x2 wrap', '5-col flex', '5-col flex'],
    ],
  ),

  spacer(200),
  callout(
    'CRITICAL MOBILE BREAKPOINTS FROM HTML PROTOTYPES',
    'All four HTML prototypes hide FgNav links at 1024px (not 768px), switch to 20px horizontal padding, and collapse grids to 1 column. The Finance dashboard collapses the sidebar at 1024px, not 768px. Set Tailwind breakpoints accordingly: lg: applies at 1024px for nav collapse.',
    C.orange, C.orangeFill,
  ),
  pageBreak(),
);

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 11 — MOTION & ANIMATION
// ═══════════════════════════════════════════════════════════════════════════
add(
  h1('11.  Motion & Animation Specification'),
  p('All animations are implemented as CSS keyframes or Framer Motion variants. GPU-accelerated properties only: transform and opacity. No width/height/top/left animations.'),
  spacer(120),

  componentTable(
    ['Animation', 'Trigger', 'Duration', 'Properties', 'Products'],
    [2000, 1600, 1200, 2800, 1760],
    [
      ['Scan line (scanline)', 'Page load, loops', '4s linear infinite', 'top: -2px → 100% (CSS ::after)', 'Finder, 3D'],
      ['Phone glow (phoneGlow)', 'Page load, loops', '3s ease-in-out infinite', 'opacity 0.6→1, scale 1→1.1', 'Finder'],
      ['Float A (floatA)', 'Page load, loops', '4s ease-in-out infinite', 'translateY 0 → -10px → 0', 'Finder floating badges'],
      ['Float B (floatB)', 'Page load, loops', '5s ease-in-out infinite', 'translateY 0 → +8px → 0', 'Finder floating badges'],
      ['Eyebrow pulse', 'Page load, loops', '2s ease-in-out infinite', 'opacity 1→0.5, scale 1→0.8 (dot only)', 'All products'],
      ['Blink dot', 'Page load, loops', '1.5s infinite', 'opacity 1→0.2 (Finder/Finance); 1s (3D square)', 'All products'],
      ['Fade up (.fade-up)', 'IntersectionObserver', '0.65s ease', 'opacity 0→1, translateY 24px→0', 'Finance, 3D'],
      ['Button hover', 'mouseenter', '0.3s ease', 'translateY 0→-2px, box-shadow expand', 'All products (primary CTAs)'],
      ['Card hover', 'mouseenter', '0.3s ease', 'translateY 0→-4px (Pricing)', 'Finance pricing cards'],
      ['Nav scroll', 'window scroll > 10px', '0.3s ease', 'background-color: more opaque', 'All products (FgNav)'],
    ],
  ),

  spacer(200),
  callout(
    'PERFORMANCE CONSTRAINT — ANIMATION BUDGET',
    'Limit concurrent CSS animations to 3 per viewport. The scan line + eye brow pulse + phone glow = 3 maximum on Finder hero. Adding more risks compositor overload on mid-range Android devices. Finance and 3D landing pages use the fade-up IntersectionObserver pattern (no looping animations above the fold). Framer Motion variants use GPU-safe properties: opacity, transform, scale only.',
    C.electric, C.blueFill,
  ),
  pageBreak(),
);

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 12 — ACCESSIBILITY
// ═══════════════════════════════════════════════════════════════════════════
add(
  h1('12.  Accessibility Standards (WCAG 2.1 AA)'),

  componentTable(
    ['Category', 'Requirement', 'Implementation'],
    [2000, 3000, 4360],
    [
      ['Colour contrast', 'Minimum 4.5:1 for body text, 3:1 for large text and UI elements', 'All product themes verified. Muted text rgba(255,255,255,0.45) on dark bg = 3.2:1 — meets large text threshold'],
      ['Focus indicators', 'Visible focus ring on all interactive elements', 'HeroUI provides focus-visible rings using product primary colour. Never suppress outline without replacement'],
      ['Keyboard nav', 'Full keyboard navigability. Tab order logical. Escape closes modals and drawers', 'HeroUI Modal, Drawer, Popover, Select — all use Radix UI primitives with correct focus trap and Escape handling'],
      ['Screen readers', 'Meaningful aria-labels on icon-only buttons. Alt text on all images. Live regions for async data', 'FgButtonIcon requires aria-label prop. All FgTable data has aria-sort. FgToast uses aria-live="polite"'],
      ['Motion', 'prefers-reduced-motion: reduce all animations', '@media(prefers-reduced-motion: reduce) { .fg-animated { animation: none; transition: none } } — applied globally'],
      ['Forms', 'Label association. Error messages. Required field marking', 'HeroUI Input provides label prop and errorMessage prop. React Hook Form manages aria-describedby for errors'],
      ['Images', 'Alt text required. Decorative images use alt=""', 'Next.js Image component. FgPhoneCard decorative content uses aria-hidden="true"'],
      ['Language', 'html lang attribute correct per site', 'All layouts: lang="en". i18n future: lang per locale'],
    ],
  ),
  pageBreak(),
);

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 13 — FILE & FOLDER STRUCTURE
// ═══════════════════════════════════════════════════════════════════════════
add(
  h1('13.  File & Folder Structure'),

  h2('13.1  packages/ui  —  Shared Component Library', C.navy),
  componentTable(
    ['File Path', 'Exports'],
    [4000, 5360],
    [
      ['src/buttons/FgButton.tsx', 'FgButton, FgButtonGreen, FgButtonGold, FgButtonBlue, FgButtonOutline, FgButtonGhost, FgButtonIcon'],
      ['src/cards/FgCard.tsx', 'FgCard, FgGlassCard, FgStat, FgPricingCard, FgDashCard, FgPhoneCard'],
      ['src/nav/FgNav.tsx', 'FgNav (accepts product prop: "corporate" | "finder" | "finance" | "3d")'],
      ['src/nav/FgDashboardSidebar.tsx', 'FgDashboardSidebar (Finance only. Accepts role, tenantName)'],
      ['src/layout/FgSection.tsx', 'FgSection, FgContainer, FgGrid, FgHeroBackground, FgScanline, FgCorner'],
      ['src/forms/FgInput.tsx', 'FgInput, FgSelect, FgTextarea, FgCheckbox, FgSwitch, FgSlider, FgOTPInput'],
      ['src/badges/FgBadge.tsx', 'FgBadge, FgStatusBadge, FgEyebrow, FgTag, FgNotificationDot'],
      ['src/data/FgTable.tsx', 'FgTable, FgPagination'],
      ['src/data/FgTabs.tsx', 'FgTabs, FgTabItem'],
      ['src/data/FgAccordion.tsx', 'FgAccordion, FgAccordionItem'],
      ['src/feedback/FgModal.tsx', 'FgModal'],
      ['src/feedback/FgDrawer.tsx', 'FgDrawer'],
      ['src/feedback/FgToast.tsx', 'FgToast, useToast'],
      ['src/feedback/FgAlert.tsx', 'FgAlert (variants: info | warning | error | regulatory)'],
      ['src/index.ts', 'Re-exports everything — import { FgButton } from "@fg/ui"'],
    ],
  ),

  spacer(200),
  h2('13.2  packages/design-system — Tokens & Theme', C.navy),
  componentTable(
    ['File Path', 'Content'],
    [3600, 5760],
    [
      ['tokens.css', 'CSS custom properties for all design tokens — colours, spacing, radius, typography scale'],
      ['heroui/themes.ts', 'All 4 HeroUI theme objects: fg-corporate, fg-finder, fg-finance, fg-3d'],
      ['tailwind.config.ts', 'Base Tailwind config with heroui() plugin, content paths, custom colour extensions'],
      ['fonts.ts', 'next/font declarations: Bebas Neue, Syne, DM Sans, Plus Jakarta Sans, Fraunces, Rajdhani, Barlow'],
      ['animations.css', 'Global @keyframes: scanline, phoneGlow, floatA, floatB, pulse, blink, fadeUp'],
      ['index.ts', 'Re-exports themes, tokens (as JS object), tailwind config'],
    ],
  ),

  spacer(200),
  h2('13.3  apps/finance-web  —  Representative App Structure', C.navy),
  componentTable(
    ['Path', 'Description'],
    [4000, 5360],
    [
      ['app/layout.tsx', 'Root layout. HeroUI provider with fg-finance theme. Fraunces + DM Sans fonts'],
      ['app/page.tsx', 'Marketing landing page (SSG). Server component'],
      ['app/(marketing)/pricing/page.tsx', 'Pricing page. 3 FgPricingCard tiers. Server component'],
      ['app/(auth)/login/page.tsx', 'Login page. FgInput email/password. Supabase Auth. Client component'],
      ['app/(auth)/register/page.tsx', 'Cooperative registration. Multi-step form. Client component'],
      ['app/(dashboard)/layout.tsx', 'Dashboard shell. FgDashboardSidebar + FgDashTopBar. Requires auth via middleware'],
      ['app/(dashboard)/page.tsx', 'Dashboard home. Overview stats + charts + recent activity'],
      ['app/(dashboard)/members/page.tsx', 'Member directory. FgTable + pagination + add member modal'],
      ['app/(dashboard)/loans/page.tsx', 'Loan management. FgTabs (pending/active/closed). Loan officer workflow'],
      ['app/(dashboard)/reports/page.tsx', 'Reporting. Date range selector. PDF export. Audit log table'],
      ['lib/supabase/server.ts', 'createServerClient from @supabase/ssr. Used in server components'],
      ['lib/supabase/client.ts', 'createBrowserClient from @supabase/ssr. Used in client components'],
      ['middleware.ts', 'Supabase session refresh. Protected route redirect. Tenant ID extraction into request headers'],
    ],
  ),
  pageBreak(),
);

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 14 — CONVENTIONS
// ═══════════════════════════════════════════════════════════════════════════
add(
  h1('14.  Development Conventions & Standards'),

  h2('14.1  TypeScript Conventions', C.navy),
  bullet('Strict mode enabled in all tsconfig.json files. "strict": true, "noUncheckedIndexedAccess": true'),
  bullet('No any type. Use unknown for untyped external data, then narrow with Zod parse'),
  bullet('All component props interfaces exported from component files (interface FgButtonProps)'),
  bullet('Prisma-generated types are the source of truth for all database model types'),
  bullet('Shared interfaces in packages/types/src/ — imported as @fg/types in all apps'),

  spacer(120),
  h2('14.2  Component Conventions', C.blue),
  bullet('All HeroUI wrappers use the fg- prefix: FgButton, FgCard, FgModal'),
  bullet('components/ui/ — HeroUI-wrapped primitives. components/sections/ — page-level marketing sections'),
  bullet('Server components are default. Add "use client" only when state, effects, or browser APIs are required'),
  bullet('No inline styles. All visual properties expressed via Tailwind classes or HeroUI\'s className prop'),
  bullet('HeroUI className merging uses the tailwind-variants (tv()) pattern from HeroUI\'s docs'),

  spacer(120),
  h2('14.3  Naming Conventions', C.navy),
  componentTable(
    ['Entity', 'Convention', 'Example'],
    [2000, 2400, 4960],
    [
      ['React components', 'PascalCase', 'FgButton, FgDashboardSidebar, HeroSection'],
      ['Component files', 'PascalCase.tsx', 'FgButton.tsx, LoanTable.tsx'],
      ['Hooks', 'camelCase with use prefix', 'useAuth, useTenant, useLoanStatus'],
      ['API route handlers', 'route.ts inside folder', 'app/api/loans/route.ts'],
      ['Prisma models', 'PascalCase singular', 'Member, Loan, Contribution, AuditLog'],
      ['DB columns', 'camelCase in Prisma schema', 'tenantId, memberCode, ninHash'],
      ['CSS tokens', 'kebab-case with --fg- prefix', '--fg-navy, --fg-radius-md, --fg-space-6'],
      ['Tailwind classes', 'HeroUI semantic tokens', 'bg-content1, border-content3, text-foreground'],
      ['Environment vars', 'SCREAMING_SNAKE_CASE', 'DATABASE_URL, NEXT_PUBLIC_SUPABASE_URL'],
      ['Git branches', 'kebab-case with prefix', 'feat/finder-hero, fix/loan-approval-bug'],
    ],
  ),

  spacer(200),
  h2('14.4  Git & PR Conventions', C.navy),
  bullet('Conventional Commits: feat:, fix:, chore:, docs:, refactor:, test:, ci:'),
  bullet('Scope in brackets: feat(finance): add loan approval workflow'),
  bullet('PRs require: 1 approving review + all CI checks passing before merge'),
  bullet('Each product app has an independent deployment preview on Vercel per PR'),
  bullet('Main branch auto-deploys to production. Staging branch deploys to staging environments'),
  pageBreak(),
);

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 15 — MVP DELIVERY CHECKLIST
// ═══════════════════════════════════════════════════════════════════════════
add(
  h1('15.  MVP Component Delivery Checklist'),
  p('This checklist tracks the minimum viable set of components and pages required for the MVP launch. All items must be completed before a product proceeds to QA. Items are ordered by development priority.'),
  spacer(120),

  h2('Design System & Foundation (Sprint 1 — Weeks 1–2)', C.navy),
  componentTable(
    ['#', 'Deliverable', 'Owner', 'Status'],
    [400, 5400, 1800, 1760],
    [
      ['1', 'Turborepo + npm workspace scaffold with all app and package directories', 'Tech Lead', '☐ Open'],
      ['2', 'packages/design-system: tokens.css, all 4 HeroUI themes, tailwind.config.ts, fonts.ts', 'Frontend Lead', '☐ Open'],
      ['3', 'packages/ui: FgButton variants, FgCard variants, FgNav, FgSection, FgContainer', 'Frontend Lead', '☐ Open'],
      ['4', 'packages/types: all shared TypeScript interfaces for Finance, Finder, 3D', 'Tech Lead', '☐ Open'],
      ['5', 'Supabase projects created (dev, staging, prod). Prisma schema initialised. Migrations run', 'Backend Lead', '☐ Open'],
      ['6', 'GitHub Actions CI pipeline: lint + typecheck + build for all apps', 'DevOps', '☐ Open'],
      ['7', 'Vercel projects created for all 4 Next.js apps. Custom domains configured via Cloudflare', 'DevOps', '☐ Open'],
    ],
  ),

  spacer(160),
  h2('Corporate Site (Sprint 3 — Weeks 5–6)', C.blue),
  componentTable(
    ['#', 'Deliverable', 'Owner', 'Status'],
    [400, 5400, 1800, 1760],
    [
      ['8', 'Home page: Hero (Bebas Neue, navy gradient), 3 product cards, services, trust stats, CTA', 'Frontend Dev', '☐ Open'],
      ['9', 'About page: Leadership, mission, RC:1939172, history timeline', 'Frontend Dev', '☐ Open'],
      ['10', 'Products page: 3 product cards with subdomain routing', 'Frontend Dev', '☐ Open'],
      ['11', 'Contact page: FgInput form + Google Maps embed', 'Frontend Dev', '☐ Open'],
      ['12', 'SEO: sitemap.xml, robots.txt, Open Graph, JSON-LD Organisation schema', 'SEO Spec.', '☐ Open'],
      ['13', 'Core Web Vitals: LCP < 2.5s, Lighthouse score > 90 on all pages', 'Frontend Dev', '☐ Open'],
    ],
  ),

  spacer(160),
  h2('FeasibilityFinder (Sprint 4 — Weeks 7–8)', C.greenDk),
  componentTable(
    ['#', 'Deliverable', 'Owner', 'Status'],
    [400, 5400, 1800, 1760],
    [
      ['14', 'Hero: phone mockup (FgPhoneCard), floating badges (FgGlassCard x3), scan line animation', 'Frontend Dev', '☐ Open'],
      ['15', 'Problem section: 4x FgProblemCard (red). Solution section: 4x FgSolutionCard (green)', 'Frontend Dev', '☐ Open'],
      ['16', 'Features grid: 6x FgCard with icon, title, description', 'Frontend Dev', '☐ Open'],
      ['17', 'How It Works: 5-step timeline (FgEyebrow numbered, connector line, description)', 'Frontend Dev', '☐ Open'],
      ['18', 'Privacy page: NDPR statement, AES-256 disclosure, FgAlert regulatory consent gate', 'Frontend Dev', '☐ Open'],
      ['19', 'Enterprise demo form: FgModal with 7-field form, React Hook Form + Zod, Supabase insert', 'Frontend Dev', '☐ Open'],
      ['20', 'Download page: App Store + Play Store buttons (FgDownloadButton). UTM tracking.', 'Frontend Dev', '☐ Open'],
      ['21', 'FAQ: FgAccordion 10 items. Regulatory status, data safety, pricing', 'Frontend Dev', '☐ Open'],
    ],
  ),

  spacer(160),
  h2('FeasibilityFinance — Marketing + Dashboard (Sprints 5, 7, 8)', C.gold),
  componentTable(
    ['#', 'Deliverable', 'Owner', 'Status'],
    [400, 5400, 1800, 1760],
    [
      ['22', 'Landing page: Hero (Fraunces serif, gold gradient, dashboard preview card)', 'Frontend Dev', '☐ Open'],
      ['23', 'Modules section: FgTabs (6 modules). Module detail panel with features list', 'Frontend Dev', '☐ Open'],
      ['24', 'Pricing: 3x FgPricingCard (Free Trial, Growth, Enterprise). Featured card gold border', 'Frontend Dev', '☐ Open'],
      ['25', 'Supabase Auth: login, register cooperative, forgot password — all with FgInput', 'Frontend Dev', '☐ Open'],
      ['26', 'Dashboard layout: FgDashboardSidebar (role-aware) + FgDashTopBar + content area', 'Frontend Dev', '☐ Open'],
      ['27', 'Dashboard overview: 4x FgStat, chart (Recharts), recent contributions FgTable', 'Frontend Dev', '☐ Open'],
      ['28', 'Members module: FgTable + FgPagination + add member FgModal + FgStatusBadge KYC', 'Backend Dev', '☐ Open'],
      ['29', 'Contributions module: FgTable + date filter + summary stats + CSV export', 'Backend Dev', '☐ Open'],
      ['30', 'Loans module: FgTabs (pending/active/closed) + loan application FgModal + repayment FgProgressBar', 'Backend Dev', '☐ Open'],
      ['31', 'Reports module: date range + Recharts + PDF export (react-pdf) + audit log FgTable', 'Backend Dev', '☐ Open'],
      ['32', 'RLS policies deployed to Supabase. TC-001 (tenant isolation test) passing', 'Backend Dev', '☐ Open'],
    ],
  ),

  spacer(160),
  h2('Feasibility3D (Sprint 6 — Weeks 11–12)', C.electric),
  componentTable(
    ['#', 'Deliverable', 'Owner', 'Status'],
    [400, 5400, 1800, 1760],
    [
      ['33', 'Hero: Rajdhani display, blueprint grid, corner marks, scan line, specs strip', 'Frontend Dev', '☐ Open'],
      ['34', 'Solutions grid: 2x2 FgCard with number, icon, Rajdhani title, bullet points', 'Frontend Dev', '☐ Open'],
      ['35', 'Technology page: stack list (tech-stack-item pattern) + architecture visual (arch-mod pills)', 'Frontend Dev', '☐ Open'],
      ['36', 'Industries grid: 8x FgIndustryCard. Icon + Rajdhani name + Barlow description', 'Frontend Dev', '☐ Open'],
      ['37', 'Comparison table: FgTable styled with old/new columns, green/red icons', 'Frontend Dev', '☐ Open'],
      ['38', 'Licensing: 4x FgLicCard (Enterprise, Government, Academic, Add-on)', 'Frontend Dev', '☐ Open'],
      ['39', 'Demo request FgModal: 7-field form. Lead capture → Supabase insert → email notification', 'Backend Dev', '☐ Open'],
      ['40', 'Whitepaper gated download: FgModal email gate → Supabase insert → signed S3/Storage URL', 'Backend Dev', '☐ Open'],
    ],
  ),

  spacer(240),
  callout(
    'DESIGN GATE — MANDATORY BEFORE ANY SPRINT 3+ WORK',
    'No development sprint for any product begins until the corresponding Figma high-fidelity prototype has received explicit written approval from the CEO (Prof. Bunakiye R. Japheth) and the responsible Product Lead. This gate is defined in SDLC Phase 3. The component library and design system (items 1–7 above) can be built before Figma approval, but no product-specific page is coded until approval is in writing.',
    C.orange, C.orangeFill,
  ),

  spacer(320),
  divider(C.navy),
  new Paragraph({
    children: [new TextRun({ text: 'FEASIBILITY GIANT COMPANY LTD  ·  RC: 1939172', font: 'Calibri', size: 18, color: C.muted })],
    alignment: AlignmentType.CENTER,
    spacing: { before: 160, after: 60 },
  }),
  new Paragraph({
    children: [new TextRun({ text: 'Design System Documentation v1.0  ·  April 2026  ·  CONFIDENTIAL', font: 'Calibri', size: 18, color: C.muted })],
    alignment: AlignmentType.CENTER,
    spacing: { before: 60, after: 60 },
  }),
  new Paragraph({
    children: [new TextRun({ text: 'info@feasibilitygiants.com  ·  feasibilitygiants.com', font: 'Calibri', size: 18, color: C.electric })],
    alignment: AlignmentType.CENTER,
    spacing: { before: 60, after: 0 },
  }),
);

// ════════════════════════════════════════════════════════════════════════════
//  BUILD
// ════════════════════════════════════════════════════════════════════════════
const doc = new Document({
  numbering: {
    config: [{
      reference: 'bullets',
      levels: [{
        level: 0,
        format: LevelFormat.BULLET,
        text: '\u2022',
        alignment: AlignmentType.LEFT,
        style: { paragraph: { indent: { left: 540, hanging: 360 } } },
      }, {
        level: 1,
        format: LevelFormat.BULLET,
        text: '\u25CB',
        alignment: AlignmentType.LEFT,
        style: { paragraph: { indent: { left: 900, hanging: 360 } } },
      }],
    }],
  },
  styles: {
    default: {
      document: { run: { font: 'Calibri', size: 22, color: '2B2B2B' } },
    },
    paragraphStyles: [
      {
        id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { size: 44, bold: true, font: 'Calibri', color: C.navy },
        paragraph: { spacing: { before: 480, after: 200 }, outlineLevel: 0 },
      },
      {
        id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { size: 32, bold: true, font: 'Calibri', color: C.blue },
        paragraph: { spacing: { before: 360, after: 160 }, outlineLevel: 1 },
      },
      {
        id: 'Heading3', name: 'Heading 3', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { size: 26, bold: true, font: 'Calibri', color: C.navy },
        paragraph: { spacing: { before: 240, after: 120 }, outlineLevel: 2 },
      },
    ],
  },
  sections: [{
    properties: {
      page: {
        size: { width: 12240, height: 15840 },
        margin: { top: 1080, right: 1080, bottom: 1080, left: 1080 },
      },
    },
    headers: {
      default: new Header({
        children: [
          new Paragraph({
            children: [
              new TextRun({ text: 'FEASIBILITY GIANT CO.  ·  Design System Documentation  ·  v1.0  ·  CONFIDENTIAL', font: 'Calibri', size: 16, color: C.muted }),
            ],
            border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: C.border } },
            spacing: { after: 80 },
          }),
        ],
      }),
    },
    footers: {
      default: new Footer({
        children: [
          new Paragraph({
            children: [
              new TextRun({ text: 'feasibilitygiants.com  ·  info@feasibilitygiants.com', font: 'Calibri', size: 16, color: C.muted }),
              new TextRun({ text: '          Page ', font: 'Calibri', size: 16, color: C.muted }),
              new PageNumber(),
            ],
            border: { top: { style: BorderStyle.SINGLE, size: 4, color: C.border } },
            spacing: { before: 80 },
          }),
        ],
      }),
    },
    children,
  }],
});

Packer.toBuffer(doc).then(buf => {
  fs.writeFileSync('/home/claude/FeasibilityGiant_DesignSystem_v1.0.docx', buf);
  console.log('✅ Document written successfully.');
}).catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});

/**
 * Feasibility Giant Ecosystem Link Registry
 * Manages institutional routing across subdomains.
 */

export const APP_LINKS = {
  corporate: {
    name: "Corporate",
    href: process.env.NEXT_PUBLIC_URL_WEB || "https://feasibilitygiants.com",
    description: "Main corporate portal"
  },
  finder: {
    name: "FeasibilityFinder",
    href: process.env.NEXT_PUBLIC_URL_FINDER || "https://finder.feasibilitygiants.com",
    description: "Digital identity & NIN verification"
  },
  finance: {
    name: "FeasibilityFinance",
    href: process.env.NEXT_PUBLIC_URL_FINANCE || "https://finance.feasibilitygiants.com",
    description: "Cooperative management SaaS"
  },
  threed: {
    name: "Feasibility3D",
    href: process.env.NEXT_PUBLIC_URL_THREED || "https://3d.feasibilitygiants.com",
    description: "Engineering & Environmental Simulation"
  }
};

export const getAppLink = (key: keyof typeof APP_LINKS) => APP_LINKS[key].href;

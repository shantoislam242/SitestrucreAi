export enum SectionType {
  HERO = "Hero",
  FEATURES = "Features",
  ABOUT = "About",
  TESTIMONIALS = "Testimonials",
  PRICING = "Pricing",
  CTA = "CTA",
  SERVICES = "Services",
  CONTACT = "Contact",
  FAQ = "FAQ",
  FOOTER = "Footer"
}

export interface WebsiteSection {
  type: SectionType;
  title: string;
  content: string;
  keyPoints: string[];
  layoutSuggestion: string;
  visualCues: string;
}

export interface WebsiteStructure {
  businessName: string;
  tagline: string;
  sections: WebsiteSection[];
}

export interface AnalysisOptions {
  requestedSections?: string[];
  pdfText?: string;
}

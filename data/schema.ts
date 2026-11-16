/** Public configuration contract. IDs are stable references, independent of labels. */
export interface SiteConfig {
  journey: JourneyConfig;
  url: string;
  displayName: string;
  /** Legacy copy; the journey uses journey.heroLine. */
  headline?: string;
  positioning: string;
  portrait: string;
  resume?: string;
  socialImage: string;
  /** Retained for older configurations; Quick Profile makes the journey optional. */
  defaultView?: "recruiter" | "engineering";
  defaultTheme: "light" | "dark";
  motion: boolean;
  /** Legacy colors; use journey.palette for scene colors. */
  colors?: Record<"light" | "dark", { blue: string; red: string }>;
  /** Legacy sections; use journey.stops to reorder or hide scenes. */
  sections?: string[];
  assistant?: { enabled: boolean };
  github?: {
    enabled: boolean;
    /** Explicit owner/repository allowlist, also matched to configured project links. */
    repositories: string[];
    ttlHours: number;
  };
}

export interface JourneyConfig {
  homeIllustration?: string;
  heroLine: string;
  invitation: string;
  aboutLine: string;
  contactLine: string;
  character: Record<string, string>;
  palette: Record<"light" | "dark", Record<string, string>>;
  careerBuildings: string[];
  defaultProjectArt: string;
  /** Keyed by work[].id. Legacy project-name keys remain a renderer fallback. */
  projectArt: Record<string, string>;
  stops: {
    id: string;
    label: string;
    title: string;
    art: string;
    illustration?: string;
  }[];
  worlds: {
    id?: string;
    title: string;
    art: string;
    label: string;
    description: string;
    categories: string[];
    /** References builds[].id. Only these systems appear at this destination. */
    architectureIds?: string[];
  }[];
}

export interface CareerRecord {
  id?: string;
  kind?: "employment" | "independent";
  order?: number;
  current?: boolean;
  year: string;
  company: string;
  role: string;
  dates: string;
  where: string;
  bullets: string[];
  technologies: string[];
}

export interface ArchitectureRecord {
  id?: string;
  name: string;
  text: string;
  /** Ordered component labels and summaries. */
  diagram: string[][];
  /** Use flow only when the source explicitly documents the sequence. */
  diagramKind?: "flow" | "components";
  /** One source-backed explanation per diagram entry, in the same order. */
  nodeDetails?: string[];
  stack: string;
}

export interface ProjectRecord {
  id?: string;
  name: string;
  type: string;
  note: string;
  icon?: string;
  status?: string;
  /** Legacy repository URL; prefer repoUrl. */
  link?: string;
  repoUrl?: string;
  demoUrl?: string;
  /** References products[].id for a deeper product description. */
  productId?: string;
  architectureIds?: string[];
}

export interface ProductRecord {
  id?: string;
  name: string;
  kicker: string;
  blurb: string;
  bullets: string[];
  stack: string;
  link?: string;
  linkLabel?: string;
  mascot?: string;
  caption?: string;
}

export interface AchievementRecord {
  id?: string;
  value: string;
  number?: number;
  prefix?: string;
  suffix?: string;
  label: string;
  text: string;
  anchor?: string;
  caseStudy?: {
    context: string;
    decision: string;
    result: string;
    /** IDs of supporting career, architecture or project records. */
    sourceIds: string[];
    note?: string;
  };
}

export interface ProfileConfig {
  name: string;
  shortName: string;
  title: string;
  photo?: string;
  greeting: string;
  tagline: string;
  intro: string;
  contact: {
    email: string;
    phone?: string;
    location?: string;
    linkedin?: string;
    github?: string;
  };
  resume: { filename: string; embeddedAssetId?: string };
  about: string[];
  aboutLine: string;
  stats: { value: string; label: string }[];
  education: {
    school: string;
    degree: string;
    dates: string;
    location: string;
  }[];
  products: ProductRecord[];
  journey: CareerRecord[];
  builds: ArchitectureRecord[];
  prompts: { title: string; project: string; text: string }[];
  filters: string[];
  work: ProjectRecord[];
  skills: {
    category: string;
    items: string[];
    tools: { name: string; icon: string; detail: string }[];
  }[];
  achievements: AchievementRecord[];
  securityNote?: string;
  expertise?: string[];
}

export interface SiteConfig {
  journey: JourneyConfig;
  url: string;
  displayName: string;
  headline: string;
  positioning: string;
  portrait: string;
  resume: string;
  socialImage: string;
  defaultView: "recruiter" | "engineering";
  defaultTheme: "light" | "dark";
  motion: boolean;
  colors: Record<"light" | "dark", { blue: string; red: string }>;
  sections: string[];
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
  projectArt: Record<string, string>;
  stops: {
    id: string;
    label: string;
    title: string;
    art: string;
    illustration?: string;
  }[];
  worlds: {
    title: string;
    art: string;
    label: string;
    description: string;
    categories: string[];
  }[];
}

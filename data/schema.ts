export interface SiteConfig {
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

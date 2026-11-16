import profile from "./profile.json" with { type: "json" };
import site from "./site.json" with { type: "json" };
interface SiteShape {
  url: string;
  displayName: string;
  headline: string;
  positioning: string;
  portrait: string;
  resume: string;
  socialImage: string;
  defaultView: string;
  defaultTheme: string;
  motion: boolean;
  colors: Record<"light" | "dark", { blue: string; red: string }>;
  sections: string[];
}
interface ProfileShape {
  name: string;
  title: string;
  contact: { email: string; linkedin: string; github: string };
  journey: {
    company: string;
    role: string;
    dates: string;
    bullets: string[];
    technologies: string[];
  }[];
  achievements: {
    value: string;
    number: number;
    label: string;
    text: string;
    anchor: string;
  }[];
  builds: { name: string; text: string; diagram: string[][]; stack: string }[];
  work: { name: string; type: string; note: string; link?: string }[];
  skills: {
    category: string;
    items: string[];
    tools: { name: string; icon: string; detail: string }[];
  }[];
}
export const checkedSite: SiteShape = site;
export const checkedProfile: ProfileShape = profile;

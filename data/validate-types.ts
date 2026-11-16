import type {
  ArchitectureRecord,
  CareerRecord,
  ProfileConfig,
  SiteConfig,
} from "./schema.js";
import profile from "./profile.json" with { type: "json" };
import example from "./profile.example.json" with { type: "json" };
import site from "./site.json" with { type: "json" };
import exampleSite from "./site.example.json" with { type: "json" };

// JSON imports widen string literals. Runtime validation checks their allowed
// values; these assignments check the rest of each complete configuration shape.
type ParsedSite = Omit<SiteConfig, "defaultTheme" | "defaultView"> & {
  defaultTheme: string;
  defaultView?: string;
};
type ParsedProfile = Omit<ProfileConfig, "journey" | "builds"> & {
  journey: (Omit<CareerRecord, "kind"> & { kind?: string })[];
  builds: (Omit<ArchitectureRecord, "diagramKind"> & {
    diagramKind?: string;
  })[];
};
export const checkedSite: ParsedSite = site;
export const checkedProfile: ParsedProfile = profile;
export const checkedExample: ParsedProfile = example;

export const checkedExampleSite: ParsedSite = exampleSite;

import fs from "node:fs";
import { refreshGitHubMetadata } from "./github.mjs";

const profile = JSON.parse(
  fs.readFileSync(process.env.PROFILE_CONFIG || "data/profile.json", "utf8"),
);
const site = JSON.parse(
  fs.readFileSync(process.env.SITE_CONFIG || "data/site.json", "utf8"),
);
const { cache, results } = await refreshGitHubMetadata(profile, site, {
  token: process.env.GITHUB_TOKEN || "",
});
if (site.github?.enabled) {
  const target = "data/github-cache.json";
  fs.writeFileSync(`${target}.tmp`, `${JSON.stringify(cache, null, 2)}\n`);
  fs.renameSync(`${target}.tmp`, target);
  for (const result of results)
    console.log(`GitHub ${result.repository}: ${result.status}`);
} else {
  console.log("GitHub metadata disabled; no network requests made.");
}

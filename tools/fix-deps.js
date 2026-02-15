import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.join(__dirname, "..");

const PACKAGE_JSON_PATH = path.join(ROOT_DIR, "package.json");
const pkg = JSON.parse(fs.readFileSync(PACKAGE_JSON_PATH, "utf8"));

const getResolvedVersion = (depName, currentRange) => {
  try {
    if (currentRange.startsWith("file:")) {
      return null;
    }
    const rangeSplit = currentRange.split("@");
    const specificVersion = rangeSplit[rangeSplit.length - 1];

    const cmd = `npm view "${depName}@${specificVersion}" version --json`;
    const result = execSync(cmd, { stdio: "pipe" }).toString().trim();

    let version = JSON.parse(result);
    if (Array.isArray(version)) {
      version = version[version.length - 1];
    }

    return version || specificVersion;
  } catch (err) {
    console.error(err);
    console.warn(
      `⚠️  Could not fetch version for ${depName}. Keeping original.`,
    );
    return currentRange;
  }
};

["dependencies", "devDependencies", "peerDependencies"].forEach((type) => {
  if (!pkg[type]) return;

  console.log(`Processing ${type}...`);
  for (const [dep, version] of Object.entries(pkg[type])) {
    const resolved = getResolvedVersion(dep, version);
    if (!resolved) {
      continue;
    }
    pkg[type][dep] = `npm:${dep}@${resolved}`;
    if (pkg[type][dep] !== version) {
      console.info(`  ✓ ${dep}: ${version} -> ${pkg[type][dep]}`);
    }
  }
});

if (pkg.overrides) {
  console.log("Processing overrides...");
  for (const [caller, overrides] of Object.entries(pkg.overrides)) {
    for (const [subDep, value] of Object.entries(overrides)) {
      if (value.startsWith("file:")) {
        continue;
      }
      const topLevelDep =
        pkg.dependencies?.[subDep] || pkg.devDependencies?.[subDep];
      const resolved =
        (value.startsWith("$")
          ? getResolvedVersion(subDep, topLevelDep)
          : getResolvedVersion(subDep, value)) ||
        getResolvedVersion(subDep, "latest");

      if (!resolved) {
        delete pkg.overrides[caller][subDep];
        if (Object.keys(pkg.overrides[caller]).length === 0) {
          delete pkg.overrides[caller];
        }
      }

      if (resolved !== value) {
        pkg.overrides[caller][subDep] = resolved;
        console.log(`  ✓ ${caller} > ${subDep}: ${value} -> ${resolved}`);
      }
    }
  }
}

fs.writeFileSync(PACKAGE_JSON_PATH, JSON.stringify(pkg, null, 2) + "\n");
console.log('Done! Run "npm install" to apply changes.');

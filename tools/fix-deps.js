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

const processOverrideEntry = (parentKey, obj) => {
  for (const [key, value] of Object.entries(obj)) {
    if (value !== null && typeof value === "object" && !Array.isArray(value)) {
      processOverrideEntry(key, value);
      continue;
    }

    if (typeof value !== "string" || value.startsWith("file:")) {
      continue;
    }

    const topLevelDep = pkg.dependencies?.[key] || pkg.devDependencies?.[key];

    let resolved;
    if (value.startsWith("$")) {
      resolved = getResolvedVersion(key, topLevelDep);
    } else {
      resolved = getResolvedVersion(key, value);
    }

    if (!resolved) {
      resolved = getResolvedVersion(key, "latest");
    }

    if (resolved && resolved !== value) {
      obj[key] = resolved;
      console.log(
        `  ✓ Override [${parentKey} > ${key}]: ${value} -> ${resolved}`,
      );
    }
  }
};

if (pkg.overrides) {
  console.log("Processing overrides...");
  processOverrideEntry("root", pkg.overrides);
}

fs.writeFileSync(PACKAGE_JSON_PATH, JSON.stringify(pkg, null, 2) + "\n");
console.log('Done! Run "npm install" to apply changes.');

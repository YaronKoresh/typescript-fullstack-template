import process from "node:process";
import path from "node:path";
import fs, { promises as fsPromises } from "node:fs";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

dotenv.config();

const author = process.env.AUTHOR_NAME;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const env = function (key, defaultValue = "") {
  return process.env[key] || defaultValue;
};

const contactFormEnabled = ![
  env("EMAIL_SERVICE", ""),
  env("EMAIL_API_KEY", ""),
  env("EMAIL_FROM_ADDRESS", ""),
  env("EMAIL_TO_ADDRESS", ""),
].includes("");

const ROOT_DIR = path.join(__dirname, "..");
const DIST_DIR = path.join(ROOT_DIR, "dist");
const STATIC_DIR = path.join(ROOT_DIR, "public");
const TEMPLATES_DIR = path.join(ROOT_DIR, "templates");
const CLIENT_DIR = path.join(DIST_DIR, "client");

const loadCssMap = async () => {
  const mapPath = path.join(CLIENT_DIR, "css-map.json");
  try {
    const data = await fsPromises.readFile(mapPath, "utf8");
    return JSON.parse(data);
  } catch (err) {
    console.warn(
      "⚠️  CSS Map not found. Skipping class replacement. (Did you run 'npm run build:bundle' first?)",
    );
    return {};
  }
};

const replaceCssClasses = (htmlContent, cssMap) => {
  if (!cssMap || Object.keys(cssMap).length === 0) return htmlContent;

  return htmlContent.replace(
    /class=(["'])(.*?)\1/g,
    (match, quote, classNames) => {
      const updatedClasses = classNames
        .split(/\s+/)
        .map((cls) => {
          return cssMap[cls] || cls;
        })
        .join(" ");

      return `class=${quote}${updatedClasses}${quote}`;
    },
  );
};

const replaceScriptTagsClasses = (htmlContent, cssMap) => {
  if (!cssMap || Object.keys(cssMap).length === 0) return htmlContent;

  return htmlContent.replace(
    /<script\b[^>]*>([\s\S]*?)<\/script[^>]*>/gi,
    (match, scriptContent) => {
      const processedScript = scriptContent.replace(
        /(["'])([^"'\\]*(?:\\.[^"'\\]*)*)\1/g,
        (fullMatch, quote, innerString, offset) => {
          const codeBefore = scriptContent.slice(
            Math.max(0, offset - 20),
            offset,
          );
          if (/getElementById\s*\(\s*$/.test(codeBefore)) return fullMatch;

          if (innerString.trim().startsWith("#")) return fullMatch;

          const updatedString = innerString.replace(
            /([#.])?(\b[a-zA-Z0-9_-]+\b)/g,
            (m, prefix, name) => {
              if (prefix === "#") return m;

              const mapped = cssMap[name];
              if (prefix === ".") return mapped ? `.${mapped}` : m;
              return mapped ? mapped : m;
            },
          );

          return quote + updatedString + quote;
        },
      );

      const openTag = match.match(/^<script[^>]*>/i)[0];
      return openTag + processedScript + "</script>";
    },
  );
};

const translations = {};

const langs = [...Object.keys(translations)];

const embedTranslation = function (html, lang) {
  if (!translations[lang]) {
    lang = "en";
  }

  const getTranslation = (path) => {
    try {
      return (
        path
          .split(".")
          .reduce(
            (obj, key) => (obj && obj[key] ? obj[key] : null),
            translations[lang],
          ) || path
      );
    } catch (err) {
      return path;
    }
  };

  html = html.replace(/<[^>]+>/g, (tag) => {
    if (tag.includes("data-i18n-")) {
      const matches = [...tag.matchAll(/data-i18n-([a-z-]+)="([^"]+)"/g)];

      matches.forEach((match) => {
        const fullAttr = match[0];
        const attrName = match[1];
        const key = match[2];
        const translatedValue = getTranslation(key);

        tag = tag.replace(fullAttr, "");

        const targetAttrRegex = new RegExp(`${attrName}=["']([^"']*)["']`);
        if (targetAttrRegex.test(tag)) {
          tag = tag.replace(
            targetAttrRegex,
            `${attrName}="${translatedValue}"`,
          );
        } else {
          tag = tag.replace(/(\/?>)$/, ` ${attrName}="${translatedValue}"$1`);
        }
      });

      tag = tag.replace(/\s+/g, " ").replace(" >", ">");
    }
    return tag;
  });

  html = html.replace(
    /(<[a-z0-9-]+)([^>]*?)\bdata-i18n="([^"]+)"([^>]*?)>([\s\S]*?)(<\/[a-z0-9-]+>)/gi,
    (match, tagName, before, key, after, content, closeTag) => {
      const translatedValue = getTranslation(key);
      return `${tagName}${before}${after}>${translatedValue}${closeTag}`;
    },
  );

  return html;
};

const loadTemplate = function (templateName) {
  const templatePath = path.join(TEMPLATES_DIR, `${templateName}.html`);
  try {
    if (fs.existsSync(templatePath)) {
      const content = fs.readFileSync(templatePath, "utf8");
      return content;
    }
  } catch (err) {
    console.error(`Failed to load template ${templateName}:`, err.message);
  }
  return "";
};

const preloadTemplates = function () {
  const templates = ["head", "nav", "header", "footer", "script"];
  if (fs.existsSync(TEMPLATES_DIR)) {
    for (const template of templates) {
      loadTemplate(template);
    }
    console.log("📋 HTML templates pre-loaded");
  }
};

const processTemplatePartials = function (pageName) {
  let pagePath = path.join(STATIC_DIR, pageName);
  let processed = fs.readFileSync(pagePath, "utf8");

  const partials = ["head", "nav", "header", "footer", "script"];
  for (const partial of partials) {
    const template = loadTemplate(partial);
    if (template) {
      const regex = new RegExp(`\\{\\{TEMPLATE:${partial}\\}\\}`, "g");
      processed = processed.replace(regex, template);
    }
  }

  return processed;
};

const processHtmlTemplate = function (html) {
  const config = {
    site: {
      name: "Chat Engines",
      tagline: "AI-Powered Engines for Every Task",
    },
    author: {
      name: "Yaron Koresh",
      bio: "Full-Stack Developer & AI Enthusiast",
    },
    contact: {
      email: process.env.CONTACT_EMAIL,
      emailPrivacy: process.env.CONTACT_EMAIL_PRIVACY,
      emailLegal: process.env.CONTACT_EMAIL_LEGAL,
      location: process.env.CONTACT_LOCATION,
      responseTime: process.env.CONTACT_RESPONSE_TIME,
    },
    social: {
      github: process.env.SOCIAL_GITHUB,
      twitter: process.env.SOCIAL_TWITTER,
      linkedin: process.env.SOCIAL_LINKEDIN,
    },
    features: { contactForm: contactFormEnabled },
  };

  const socialPlatforms = [
    { key: "github", template: "SOCIAL_GITHUB" },
    { key: "twitter", template: "SOCIAL_TWITTER" },
    { key: "linkedin", template: "SOCIAL_LINKEDIN" },
  ];

  for (const platform of socialPlatforms) {
    if (!config.social[platform.key]) {
      const pattern = new RegExp(
        `<a href="\\{\\{${platform.template}\\}\\}"[^>]*class="social-icon"[^>]*>[\\s\\S]*?<\\/a>`,
        "g",
      );
      html = html.replace(pattern, "");
    }
  }

  const hasAnySocialLinks =
    config.social.github || config.social.twitter || config.social.linkedin;
  if (!hasAnySocialLinks) {
    html = html.replace(
      /<div class="social-links"[^>]*id="socialLinks"[^>]*>[\s\S]*?<\/div>\s*<\/div>/g,
      "",
    );
  }

  let processed = html
    .replace(/\{\{SITE_NAME\}\}/g, config.site.name)
    .replace(/\{\{SITE_TAGLINE\}\}/g, config.site.tagline)
    .replace(/\{\{AUTHOR_NAME\}\}/g, config.author.name)
    .replace(/\{\{AUTHOR_BIO\}\}/g, config.author.bio)
    .replace(/\{\{CONTACT_EMAIL\}\}/g, config.contact.email)
    .replace(/\{\{CONTACT_EMAIL_PRIVACY\}\}/g, config.contact.emailPrivacy)
    .replace(/\{\{CONTACT_EMAIL_LEGAL\}\}/g, config.contact.emailLegal)
    .replace(/\{\{CONTACT_LOCATION\}\}/g, config.contact.location)
    .replace(/\{\{CONTACT_RESPONSE_TIME\}\}/g, config.contact.responseTime)
    .replace(/\{\{SOCIAL_GITHUB\}\}/g, config.social.github)
    .replace(/\{\{SOCIAL_TWITTER\}\}/g, config.social.twitter)
    .replace(/\{\{SOCIAL_LINKEDIN\}\}/g, config.social.linkedin);

  if (!config.features.contactForm) {
    processed = processed.replace(
      /<div class="contact-form-container" id="contactFormContainer">[\s\S]*?<\/div>\s*<\/div>\s*<\/div>\s*<\/section>/g,
      "</div></section>",
    );
  }

  return processed;
};

const getDistCode = async function () {
  const filePath = path.join(CLIENT_DIR, "index.global.js");
  try {
    const code = await fsPromises.readFile(filePath, "utf8");
    return code;
  } catch (err) {
    console.error(`Failed to read ${filePath}:`, err.message);
    return "";
  }
};

const createDirectory = async function (directoryPath) {
  try {
    await fsPromises.mkdir(directoryPath, { recursive: true });
  } catch (error) {
    if (error.code !== "EEXIST") {
      console.error(`Error creating directory: ${error.message}`);
    }
  }
};

const processHtmlTemplateWithJs = async function (pageName, cssMap) {
  const processedPage = processTemplatePartials(pageName);
  const processedHtml = processHtmlTemplate(processedPage);
  const bundleJs = await getDistCode();
  const isHtml = pageName.endsWith(".html");

  let genericFilesApplied = false;
  for (const lang of langs) {
    await createDirectory(path.join(CLIENT_DIR, lang));

    const publicFilePath = path.join(STATIC_DIR, pageName);
    const clientLangFilePath = path.join(CLIENT_DIR, lang, pageName);
    const clientGenericFilePath = path.join(CLIENT_DIR, pageName);

    if (isHtml) {
      let processed = embedTranslation(processedHtml, lang);
      if (bundleJs) {
        const scriptTag = `\n<script>\n${bundleJs}\n</script>\n`;
        const lastScriptMatch = processed.match(
          /<script>[\s\S]*?<\/script>\s*<\/body>/,
        );
        if (lastScriptMatch) {
          processed = processed.replace(
            lastScriptMatch[0],
            scriptTag + lastScriptMatch[0],
          );
        } else {
          processed = processed.replace("</body>", scriptTag + "</body>");
        }
      }

      const navPages = {
        "index.html": "INDEX",
        "chats.html": "CHATS",
        "about.html": "ABOUT",
        "docs.html": "DOCS",
        "api-guide.html": "API_GUIDE",
        "pricing.html": "PRICING",
        "contact.html": "CONTACT",
      };

      for (const [file, key] of Object.entries(navPages)) {
        const placeholder = `{{ACTIVE_${key}}}`;
        const replacement = pageName === file ? " active" : "";
        processed = processed.replace(
          new RegExp(placeholder, "g"),
          replacement,
        );
      }

      const regex = new RegExp(`\\{\\{LANGUAGE\\}\\}`, "g");
      processed = processed.replace(regex, lang);

      processed = replaceCssClasses(processed, cssMap);
      processed = replaceScriptTagsClasses(processed, cssMap);

      await fsPromises.writeFile(clientLangFilePath, processed, {
        encoding: "utf8",
      });
    } else if (!genericFilesApplied) {
      genericFilesApplied = true;
      await fsPromises.copyFile(publicFilePath, clientGenericFilePath);
    }
  }
};

const directoryExistsSync = function (directoryPath) {
  if (fs.existsSync(directoryPath)) {
    console.log("Directory exists!");
    return true;
  } else {
    console.log("Directory not found.");
    return false;
  }
};

const listFilesSync = function (directoryPath) {
  try {
    const files = fs.readdirSync(directoryPath);
    return files;
  } catch (err) {
    console.error("Unable to scan directory:", err);
  }
};

const generateClient = async function () {
  const cssMap = await loadCssMap();

  const clientfiles = listFilesSync(CLIENT_DIR);
  const isClientPagesPopulated = clientfiles.some((f) =>
    f.match(/^.*\.html$/g),
  );

  if (!isClientPagesPopulated) {
    const publicFiles = listFilesSync(STATIC_DIR);

    const tasks = publicFiles.map(async (publicFile) => {
      await processHtmlTemplateWithJs(publicFile, cssMap);
    });

    await Promise.all(tasks);

    fs.rmSync(path.join(CLIENT_DIR, "index.global.js"), { force: true });
    fs.rmSync(path.join(CLIENT_DIR, "index.d.ts"), { force: true });
    fs.rmSync(path.join(CLIENT_DIR, "css-map.json"), { force: true });

    console.log(
      `✅ Client pages pre-processed: ${tasks.length} files handled.`,
    );
  }
};

await generateClient();

export { generateClient as default };

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
    /(<script[^>]*>)([\s\S]*?)(<\/script>)/gi,
    (match, openTag, scriptContent, closeTag) => {
      const processedScript = scriptContent.replace(
        /(["'])(.*?)\1/g,
        (fullMatch, quote, innerString, offset, fullScript) => {
          const codeBefore = fullScript.slice(0, offset);
          if (/getElementById\s*\(\s*$/.test(codeBefore)) {
            return fullMatch;
          }

          if (innerString.trim().startsWith("#")) {
            return fullMatch;
          }

          const updatedString = innerString.replace(
            /([#.])?(\b[a-zA-Z0-9_-]+\b)/g,
            (m, prefix, name) => {
              if (prefix === "#") {
                return m;
              }

              if (prefix === ".") {
                return cssMap[name] ? `.${cssMap[name]}` : m;
              }

              return cssMap[name] ? cssMap[name] : m;
            },
          );

          return quote + updatedString + quote;
        },
      );

      return openTag + processedScript + closeTag;
    },
  );
};

const translations = {
  en: {
    nav: {
      home: "Home",
      engines: "Engines",
      chats: "Chats",
      about: "About",
      documentation: "Documentation",
      apiGuide: "API Guide",
      pricing: "Pricing",
      contact: "Contact",
      allEngines: "All Engines",
      homeWithIcon: "🏠 Home",
      chatsWithIcon: "💬 Chats",
      aboutWithIcon: "ℹ️ About",
      documentationWithIcon: "📚 Documentation",
      apiGuideWithIcon: "🔌 API Guide",
      pricingWithIcon: "💰 Pricing",
      contactWithIcon: "✉️ Contact",
    },

    category: {
      pageTitle: "Category - Chat Engines",
      metaDescription: "Explore specialized engines in this category",
    },

    hero: {
      badge: "🚀 Professional Tools",
      title: "Transform Your Work with",
      titleHighlight: "Chat Engines",
      subtitle:
        "Professional tools for content creation, development, security analysis, and more. Powered by the latest chat engines.",
      exploreBtn: "Explore Engines",
      startChatBtn: "Start Chatting",
      docsBtn: "📚 Documentation",
      statsEngines: "Chat Engines",
      statsProviders: "Service Providers",
      statsPossibilities: "Possibilities",
    },

    home: {
      featuredTitle: "Featured Engines",
      featuredSubtitle: "Discover our most popular and powerful tools",
      categoriesTitle: "Browse by Category",
      categoriesSubtitle: "Explore engines organized by their purpose",
      whyTitle: "Why Choose Chat Engines?",
      feature1Title: "Use Your Own Keys",
      feature1Desc:
        "Bring your own API keys from any supported service provider. No middleman, no markup.",
      feature2Title: "Privacy First",
      feature2Desc:
        "Your data stays in your browser. We never store your conversations or keys.",
      feature3Title: "Instant Access",
      feature3Desc:
        "No signup required. Start using chat engines immediately with no learning curve.",
      feature4Title: "Multi-Language",
      feature4Desc:
        "Full support for English and Hebrew, with more languages coming soon.",
      viewAll: "View All",
      enginesCount: "{{count}} engines",
      howItWorksTitle: "How It Works",
      howItWorksSubtitle: "Get started with Chat Engines in three simple steps",
      step1Title: "Get Your Key",
      step1Desc:
        "Sign up with any of our supported service providers and generate your key. Takes less than 2 minutes.",
      step2Title: "Choose Your Engine",
      step2Desc:
        "Browse our extensive collection of specialized chat engines for writing, coding, design, analysis, and more.",
      step3Title: "Start Creating",
      step3Desc:
        "Enter your key, click Start, and begin interacting with your assistant immediately. No signup needed.",

      capabilitiesTitle: "Powerful Integration Capabilities",
      capabilitiesSubtitle:
        "Connect with multiple service providers through one unified interface",
      capability1Title: "Code Development",
      capability1Desc:
        "Generate, review, and refactor code with intelligent assistance across multiple programming languages.",
      capability2Title: "Creative Writing",
      capability2Desc:
        "Create compelling content, stories, marketing copy, and more with advanced content generation.",
      capability3Title: "Data Analysis",
      capability3Desc:
        "Transform raw data into actionable insights with intelligent analysis and visualization tools.",
      capability4Title: "Security Analysis",
      capability4Desc:
        "Identify vulnerabilities and strengthen your applications with automated security audits.",
      exploreEnginesBtn: "Explore All Engines",

      ctaTitle: "Ready to Get Started?",
      ctaSubtitle:
        "Choose from over 100 specialized engines and start your conversation today.",
      ctaStartBtn: "Start Your First Chat",
      ctaLearnBtn: "Learn More",
    },

    filters: {
      allProviders: "All Providers",
      defaultSort: "Default Order",
      sortAZ: "A → Z",
      sortZA: "Z → A",
      sortCategory: "By Category",
    },

    engineSelection: {
      title: "Select an Engine",
      searchPlaceholder: "Search engines...",
      noResults: "No engines found matching your search.",
      all: "All",
    },

    apiKeyManager: {
      title: "Manage Your API Keys",
      description:
        "Your API keys are stored securely in your browser. You can view, modify, or delete them at any time.",
      noKeys:
        "No API keys saved yet. Keys will be saved when you use an engine.",
      clearAll: "🗑️ Clear All Keys",
      copySuccess: "API key copied to clipboard!",
      copyFailed: "Failed to copy key",
      clearConfirm: "Are you sure you want to delete all saved API keys?",
    },

    chatHistory: {
      title: "Manage Your Chat History",
      description:
        "Your chat sessions are stored locally in your browser. You can resume, view, or delete them at any time.",
      noChats: "No saved chat sessions yet.",
      clearAll: "🗑️ Clear All Chats",
      resume: "Resume",
      deleteConfirm: "Are you sure you want to delete this chat session?",
      clearConfirm:
        "Are you sure you want to clear all chat history? This cannot be undone.",
    },

    config: {
      title: "Configure Engine",
      provider: "AI Provider",
      modelVersion: "Model Version",
      apiKey: "API Key",
      apiKeyPlaceholder: "Enter your API key",
      apiKeyNote: "Your API key is only used for this session and not stored.",
      externalApis: "🔌 External API Connections (Optional)",
      externalApisHelp:
        "Connect external services to enhance engine capabilities",
      startSession: "Start Session",
      cancel: "Cancel",
    },

    modal: {
      textModel: "Text Model (AI Provider)",
      imageModel: "Image Generation Model",
      videoModel: "Video Generation Model",
      audioModel: "Audio Generation Model",
      additionalServices: "Additional Services (Optional)",
      provider: "AI Provider",
      modelVersion: "Model Version",
      selectModel: "Select Model",
      apiKey: "API Key",
      apiKeyNote:
        "Your API key is stored locally in your browser for convenience.",
      required: "Required",
      optional: "Optional",
      watermarkFree: "✓ Watermark-free output with proper API access",
      webSearch: "Web Search",
      cloudStorage: "Cloud Storage",
      emailService: "Email Service",
      docGen: "Document Generation",
      cancel: "Cancel",
      startEngine: "Start Engine",
    },

    chat: {
      welcomeMessage:
        "Engine initialized! Select a menu option or type your input below to get started.",
      welcomeHint: "Select a menu option or type your message below",
      inputPlaceholder: "Type your message...",
      send: "Send",
      attach: "Attach file",
      attachFile: "Attach file",
      newTab: "New Tab",
      new: "New",
      newChat: "New Chat",
      closeTab: "Close tab",
      backToEngines: "← Back to Engines",
      reconfigure: "⚙️ Settings",
      settings: "Settings",
      toggleMenu: "Toggle menu",
      menuTitle: "Menu Options",
      clearHistory: "Clear History",
      export: "Export",
      chatFiles: "Chat Files",
      uploaded: "Uploaded",
      received: "Received",
      noFilesUploaded: "No files uploaded",
      noFilesReceived: "No files received",
      exportResponse: "Export Response",
      explainOptions: "Explain Options",
      randomSelection: "Random Selection",
      sidebarTip:
        "Tip: Type in the input box, then click a menu option to add context to your selection.",
      noActiveChats: "No active chats",
      inputTip: "Type here, then click a menu option to add context...",
      defaultEngineName: "Engine Name",
      exportTxt: "Download as Text",
      exportMd: "Download as Markdown",
      exportHtml: "Download as HTML",
      exportJson: "Download as JSON",
      exportPdf: "Download as PDF",
      exportDocx: "Download as Word",
      exportTxtBtn: "📄 TXT",
      exportMdBtn: "📝 MD",
      exportHtmlBtn: "🌐 HTML",
      exportJsonBtn: "📊 JSON",
      exportPdfBtn: "📑 PDF",
      exportDocxBtn: "📃 DOCX",
    },

    chats: {
      pageTitle: "Chats - Chat Engines",
      metaDescription:
        "Chat Engines - Professional AI Chat Interface for interactive conversations with multiple AI providers.",
      metaKeywords:
        "chat, AI, GPT, Claude, Gemini, conversation, chat interface",
      welcomeTitle: "Start a New Chat",
      welcomeSubtitle:
        "Select an engine below to begin your AI-powered conversation",
      recentChats: "Recent Chats",
      noRecentChats: "No recent chats yet",
      resumeChat: "Resume this chat",
      continueChat: "Continue Chat",
      historyManagerTitle: "Chat History",
      exportAll: "Export All",
      exportAllAria: "Export all chat conversations",
      clearAll: "Clear All",
      clearAllAria: "Delete all chat history permanently",
      noHistory:
        "No chat history yet. Start a conversation to see your history here.",
      messages: "messages",
    },

    apiKeyError: {
      title: "Invalid API Key",
      message:
        "Your API key was rejected by the service provider. It has been removed from your saved keys.",
      provider: "Provider:",
      enterNewKey: "Enter a valid API key:",
      keyPlaceholder: "Paste your API key here...",
      keyHint: "Get your API key from your provider's dashboard",
      retry: "Retry with New Key",
      enterKey: "Please enter an API key",
      unknownProvider: "Unable to determine provider",
      keySaved: "API key saved. Please try your action again.",
      getGeminiKey: "🔑 Get Gemini Key",
      getOpenaiKey: "🔑 Get OpenAI Key",
      getAnthropicKey: "🔑 Get Anthropic Key",
    },

    footer: {
      tagline: "Professional tools for every need.",
      product: "Product",
      company: "Company",
      legal: "Legal",
      aboutUs: "About Us",
      privacyPolicy: "Privacy Policy",
      termsOfService: "Terms of Service",
      copyright: `© {{year}} ${author}. All Rights Reserved.`,
    },

    privacy: {
      pageTitle: "Privacy Policy - Chat Engines",
      title: "Privacy Policy",
      section1Title: "1. Introduction and Scope",
      section1Text1:
        'Chat Engines ("we", "our", "us", or "the Platform") operates as a free, open-source web application that provides user interfaces for interacting with third-party service providers. This Privacy Policy governs the collection, use, disclosure, and protection of information when you access or use our platform.',
      section1Text2:
        'IMPORTANT NOTICE: Chat Engines operates on a "Bring Your Own Key" (BYOK) model. You provide your own keys from service providers. We do not process payments, store billing information, or have access to your keys beyond the duration of your browser session.',
      section2Title: "2. Service Model and Data Processing",
      section2Item1:
        "Chat Engines is provided free of charge. No registration, subscription, or payment is required to use the Platform.",
      section2Item2:
        "You are solely responsible for obtaining and managing your own keys from supported service providers.",
      section2Item3:
        "All costs associated with service provider usage are incurred directly between you and your chosen provider.",
      section2Item4:
        "We act solely as a technical interface and do not intermediate, monitor, or retain your communications with service providers.",
      section3Title: "3. Information Collection",
      section3_1Title: "3.1 Information You Provide Voluntarily",
      section3_1Item1:
        "Keys: Entered in your browser session only; transmitted directly to service providers; never stored on our servers.",
      section3_1Item2:
        "User Content: Messages, prompts, and files submitted are processed transiently and forwarded to your selected provider in real-time.",
      section3_1Item3:
        "Contact Information: If you contact us via the contact form, we may receive your name, email address, and message content.",
      section3_2Title: "3.2 Information Collected Automatically",
      section3_2Item1:
        "Local Storage: Theme preferences and chat history are stored exclusively in your browser's local storage and are not transmitted to our servers.",
      section3_2Item2:
        "Server Logs: Standard web server logs may record IP addresses, timestamps, and request metadata for security and diagnostic purposes.",
      section4Title: "4. Purpose and Legal Basis for Processing",
      section4Item1: "To provide and maintain the Platform functionality",
      section4Item2:
        "To facilitate communication between your browser and third-party service providers",
      section4Item3: "To respond to support inquiries and communications",
      section4Item4:
        "To detect, prevent, and address technical issues and security threats",
      section4Item5: "To comply with legal obligations where applicable",
      section5Title: "5. Data Retention and Storage",
      section5_1Title: "5.1 Data We Do NOT Retain",
      section5_1Item1:
        "API keys are never persisted beyond your active browser session",
      section5_1Item2:
        "Chat conversations and AI interactions are not logged or stored on our servers",
      section5_1Item3:
        "Uploaded files are processed in volatile memory and are not written to persistent storage",
      section5_2Title: "5.2 Client-Side Storage",
      section5_2Item1:
        "Conversation history may be stored in your browser's local storage for your convenience",
      section5_2Item2:
        "User interface preferences are stored locally in your browser",
      section5_2Item3:
        'You may clear all locally stored data at any time through your browser settings or the Platform\'s "Clear History" function',
      section5_3Title: "5.3 Security Measures",
      section5_3Text:
        "We implement industry-standard security measures including:",
      section5_3Item1:
        "TLS/HTTPS encryption for all data transmitted between your browser and our servers",
      section5_3Item2:
        "Security headers and protections against common web vulnerabilities (XSS, CSRF, etc.)",
      section5_3Item3: "Regular security assessments and updates",
      section6Title: "6. Third-Party Services and Data Transfers",
      section6Text:
        "When you use Chat Engines, your data is transmitted to and processed by your selected AI provider. Your use of these services is governed by their respective privacy policies:",
      section7Title: "7. Cookies and Tracking Technologies",
      section7Text:
        "Chat Engines does not use cookies or third-party tracking technologies. We use browser local storage solely for client-side functionality. No data from local storage is transmitted to our servers or shared with third parties.",
      section8Title: "8. Your Rights and Choices",
      section8Text:
        "Depending on your jurisdiction, you may have the following rights:",
      section8Item1:
        "Right to access: Request information about data we may hold about you",
      section8Item2:
        "Right to deletion: Request deletion of any personal data in our possession",
      section8Item3:
        "Right to withdraw: Discontinue use of the Platform at any time",
      section8Item4:
        "Right to data portability: Export your locally stored data through browser tools",
      section9Title: "9. Children's Privacy",
      section9Text:
        "The Platform is not intended for use by individuals under the age of 13 (or the applicable age of digital consent in your jurisdiction). If you believe a child has provided personal information, please contact the AI providers directly.",
      section10Title: "10. Policy Updates",
      section10Text:
        "This Privacy Policy may be revised periodically. Material changes will be reflected in an updated version of this policy posted on the Platform. Your continued use of the Platform following any changes constitutes acceptance of those changes.",
      section11Title: "11. Contact Information",
      section11Text:
        "For privacy-related inquiries, requests, or complaints, please contact us through:",
      visitOur: "Visit our",
      important: "Important:",
      subjectTo: "Subject to",
    },

    terms: {
      pageTitle: "Terms of Service - Chat Engines",
      title: "Terms of Service",
      section1Title: "1. Agreement to Terms",
      section1Text:
        'By accessing, browsing, or using Chat Engines ("the Platform" or "the Service"), you acknowledge that you have read, understood, and agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, you must immediately discontinue use of the Platform.',
      section2Title: "2. Service Description",
      section2Text:
        'Chat Engines is a free, web-based software platform that provides user interfaces ("engines") for interacting with third-party chat services provided by Google (Gemini), OpenAI (GPT), and Anthropic (Claude). The Platform operates on a "Bring Your Own Key" (BYOK) model, supporting service providers via API keys.',
      section3Title: "3. No-Cost Service Model",
      section3Item1:
        "The Platform is provided free of charge. No payment, subscription, or registration is required.",
      section3Item2:
        "You must obtain and provide your own valid API keys from supported AI providers to utilize the Platform's functionality.",
      section3Item3:
        "All charges for AI API usage are incurred directly between you and your chosen AI provider. We have no involvement in, and bear no responsibility for, any such charges.",
      section3Item4:
        "We make no representations or warranties regarding the pricing, availability, or terms of third-party AI services.",
      section4Title: "4. User Obligations and Responsibilities",
      section4_1Title: "4.1 API Key Management",
      section4_1Item1:
        "You are solely responsible for obtaining, securing, and managing your API keys",
      section4_1Item2:
        "You bear full responsibility for all usage and charges incurred through your API keys",
      section4_1Item3:
        "You must maintain the confidentiality of your API keys and not disclose them to unauthorized parties",
      section4_1Item4:
        "You must comply with all applicable terms of service of your chosen AI providers",
      section4_2Title: "4.2 Prohibited Conduct",
      section4_2Text: "You agree NOT to use the Platform for any purpose that:",
      section4_2Item1:
        "Violates any applicable local, national, or international law or regulation",
      section4_2Item2:
        "Generates, distributes, or facilitates illegal, harmful, threatening, abusive, defamatory, or otherwise objectionable content",
      section4_2Item3:
        "Infringes upon intellectual property rights, privacy rights, or other rights of any third party",
      section4_2Item4:
        "Constitutes harassment, discrimination, or harm toward any individual or group",
      section4_2Item5:
        "Attempts to circumvent, disable, or interfere with security features of the Platform",
      section4_2Item6:
        "Employs automated systems, bots, or scripts to access or overload the Platform",
      section4_2Item7:
        "Violates the acceptable use policies of any integrated AI provider",
      section4_2Item8:
        "Involves reverse engineering, decompilation, or extraction of source code",
      section4_2Item9:
        "Involves unauthorized copying, reproduction, or redistribution of the Platform",
      section5Title: "5. Intellectual Property Rights",
      section5_1Title: "5.1 Platform Ownership",
      section5_1Text:
        "The Platform, including all source code, algorithms, designs, graphics, user interfaces, and documentation, is the exclusive intellectual property of Yaron Koresh. All rights not expressly granted herein are reserved.",
      section5_2Title: "5.2 User Content",
      section5_2Text:
        "You retain all ownership rights to content you input into the Platform. By using the Platform, you grant us a limited, non-exclusive license to process your content solely as necessary to provide the Service.",
      section5_3Title: "5.3 AI-Generated Output",
      section5_3Text:
        "Ownership and usage rights for AI-generated content are governed by the terms of your chosen AI provider. You are responsible for reviewing and complying with those terms.",
      section5_4Title: "5.4 Restrictions",
      section5_4Text: "Without prior written authorization, you may NOT:",
      section5_4Item1:
        "Copy, reproduce, distribute, or create derivative works from the Platform",
      section5_4Item2:
        "Reverse engineer, decompile, disassemble, or attempt to derive the source code",
      section5_4Item3:
        "Modify, translate, adapt, or create derivative works based on the Platform",
      section5_4Item4:
        "Sell, license, sublicense, rent, lease, or transfer access to the Platform",
      section5_4Item5:
        "Remove, alter, or obscure any proprietary notices or attributions",
      section6Title: "6. Disclaimers and Warranties",
      section6_1Title: '6.1 "As Is" Provision',
      section6_1Text:
        'THE PLATFORM IS PROVIDED ON AN "AS IS" AND "AS AVAILABLE" BASIS WITHOUT WARRANTIES OF ANY KIND, WHETHER EXPRESS, IMPLIED, STATUTORY, OR OTHERWISE, INCLUDING BUT NOT LIMITED TO WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, TITLE, AND NON-INFRINGEMENT.',
      section6_2Title: "6.2 AI Output Disclaimer",
      section6_2Text:
        "AI-generated content may be inaccurate, incomplete, biased, or inappropriate. We have no control over AI outputs and make no representations regarding their accuracy, reliability, or suitability. You are solely responsible for reviewing and validating all AI-generated content before use.",
      section6_3Title: "6.3 Third-Party Services",
      section6_3Text:
        "We are not responsible for the availability, performance, accuracy, policies, or practices of third-party AI providers. Any disruption, modification, or termination of third-party services is beyond our control.",
      section7Title: "7. Limitation of Liability",
      section7Text:
        "TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, IN NO EVENT SHALL AI ENGINES, ITS CREATOR, AFFILIATES, OR LICENSORS BE LIABLE FOR:",
      section7Item1:
        "Any indirect, incidental, special, consequential, punitive, or exemplary damages",
      section7Item2:
        "Loss of profits, revenue, data, goodwill, or business opportunities",
      section7Item3:
        "Personal injury or property damage arising from your use of the Platform",
      section7Item4:
        "Any damages arising from third-party AI provider actions, policies, or service interruptions",
      section7Item5:
        "Any API charges or fees incurred through your use of third-party services",
      section7Item6:
        "Any damages exceeding the amount you paid to us (which is zero, as the Platform is free)",
      section8Title: "8. Indemnification",
      section8Text:
        "You agree to defend, indemnify, and hold harmless Chat Engines, its creator, and their respective officers, directors, employees, and agents from and against any and all claims, damages, obligations, losses, liabilities, costs, and expenses arising from:",
      section8Item1: "Your access to or use of the Platform",
      section8Item2: "Your violation of these Terms",
      section8Item3: "Your violation of any applicable law or regulation",
      section8Item4:
        "Your violation of any third-party rights, including intellectual property rights",
      section8Item5:
        "Any content you input, generate, or distribute through the Platform",
      section9Title: "9. Service Modifications and Termination",
      section9Text:
        "We reserve the right, at our sole discretion, to modify, suspend, or discontinue the Platform or any part thereof, temporarily or permanently, at any time and without prior notice. We shall not be liable to you or any third party for any such modification, suspension, or discontinuation.",
      section10Title: "10. Amendments to Terms",
      section10Text:
        "These Terms may be revised periodically. Material changes will be reflected in an updated version posted on the Platform. Your continued use of the Platform following any changes constitutes binding acceptance of those changes. It is your responsibility to review these Terms periodically.",
      section11Title: "11. Governing Law and Jurisdiction",
      section11Text:
        "These Terms shall be governed by and construed in accordance with the laws of the State of Israel, without giving effect to any principles of conflicts of law. Any dispute arising out of or relating to these Terms or the Platform shall be subject to the exclusive jurisdiction of the courts located in Israel.",
      section12Title: "12. Severability",
      section12Text:
        "If any provision of these Terms is held to be invalid, illegal, or unenforceable by a court of competent jurisdiction, such invalidity shall not affect the validity of the remaining provisions, which shall remain in full force and effect.",
      section13Title: "13. Entire Agreement",
      section13Text:
        "These Terms, together with our Privacy Policy, constitute the entire agreement between you and Chat Engines regarding your use of the Platform and supersede all prior or contemporaneous understandings, agreements, representations, and warranties.",
      section14Title: "14. Contact Information",
      section14Text:
        "For questions, concerns, or notices regarding these Terms, please contact us through:",
      visitOur: "Visit our",
    },

    common: {
      loading: "Loading...",
      error: "Error",
      success: "Success",
      close: "Close",
      save: "Save",
      delete: "Delete",
      copy: "Copy",
      toggleTheme: "Toggle theme",
      selectLanguage: "Select language",
      siteName: "Chat Engines",
      logoAlt: "Chat Engines Logo",
      pageTitle: "Chat Engines - Professional Tools Platform",
      metaDescription:
        "Chat Engines - A comprehensive platform of engines supporting diverse services for content creation, development, security analysis, and more.",
      metaKeywords:
        "chat engines, GPT, Claude, Gemini, content creation, code review, security, service providers",
      openMenu: "Open menu",
      closeMenu: "Close menu",
      readyToStart: "Ready to Get Started?",
      getStartedFree: "Get Started Free",
      exploreEngines: "Explore Engines",
      learnMore: "Learn More",
      viewAll: "View All",
      backToHome: "Back to Home",
    },

    providers: {
      gemini: "Google Gemini",
      openai: "OpenAI GPT",
      anthropic: "Anthropic Claude",
      mock: "Mock (Testing)",
    },

    categories: {
      audio: {
        name: "Audio",
        description: "Sound engineering, music, podcasts",
      },
      video: { name: "Video", description: "Video content and production" },
      communication: {
        name: "Communication",
        description: "Writing and messaging",
      },
      writing: {
        name: "Writing",
        description: "Content creation and copywriting",
      },
      business: {
        name: "Business",
        description: "Business documents and strategy",
      },
      creative: { name: "Creative", description: "Creative arts and branding" },
      development: { name: "Development", description: "Software development" },
      data: { name: "Data", description: "Data analysis and insights" },
      design: { name: "Design", description: "UI/UX and visual design" },
      health: { name: "Health", description: "Health and lifestyle" },
      security: {
        name: "Security",
        description: "Security analysis and vulnerability scanning",
      },
      education: {
        name: "Education",
        description: "Learning, courses, and skill development",
      },
      marketing: {
        name: "Marketing",
        description: "Marketing strategy and campaigns",
      },
      legal: { name: "Legal", description: "Legal documents and compliance" },
      finance: {
        name: "Finance",
        description: "Financial planning and analysis",
      },
    },

    engines: {
      "audio-mastering-engineer": {
        name: "Audio Mastering Engineer",
        description:
          "Guide users to achieve organic, industry-standard audio quality",
      },
      "music-composer": {
        name: "Music Composer",
        description: "Help musicians develop song structures and arrangements",
      },
      "podcast-producer": {
        name: "Podcast Producer",
        description: "Guide creators through podcast episode planning",
      },
      "voiceover-scriptwriter": {
        name: "Voiceover Scriptwriter",
        description: "Create natural voice-over scripts for various mediums",
      },

      "documentary-architect": {
        name: "Documentary Architect",
        description: "Help structure compelling documentary narratives",
      },
      "shortform-creator": {
        name: "Shortform Creator",
        description: "Create viral short-form video concepts",
      },
      "video-ad-scripter": {
        name: "Video Ad Scripter",
        description: "Generate dynamic video advertisement scripts",
      },
      "video-prompt-engineer": {
        name: "Video Prompt Engineer",
        description: "Create detailed video prompts for AI generation",
      },
      "video-scene-continuity": {
        name: "Video Scene Continuity",
        description: "Generate contextual scene descriptions",
      },
      "youtube-strategist": {
        name: "YouTube Strategist",
        description: "Develop viral video concepts and growth strategies",
      },

      "blog-post-strategist": {
        name: "Blog Post Strategist",
        description: "Create engaging blog posts for brand building",
      },
      "customer-service-response": {
        name: "Customer Service Response",
        description: "Transform text into professional responses",
      },
      "cv-architect": {
        name: "CV Architect",
        description: "Generate stunning HTML CVs through guided interview",
      },
      "legal-email-evidence-purifier": {
        name: "Legal Email Purifier",
        description: "Transform claims into court-admissible emails",
      },
      "prompt-engineer": {
        name: "Prompt Engineer",
        description: "Generate high-quality structured prompts",
      },
      "social-media-copywriter": {
        name: "Social Media Copywriter",
        description: "Create impactful social media posts",
      },
      "speech-writer": {
        name: "Speech Writer",
        description: "Craft powerful speeches and presentations",
      },
      "whatsapp-message-composer": {
        name: "WhatsApp Composer",
        description: "Engineer effective WhatsApp messages",
      },

      "newsletter-editor": {
        name: "Newsletter Editor",
        description: "Create engaging email newsletters",
      },
      "persuasive-copywriter": {
        name: "Persuasive Copywriter",
        description: "Create high-converting marketing copy",
      },
      "technical-writer": {
        name: "Technical Writer",
        description: "Create clear technical documentation",
      },

      "business-plan-builder": {
        name: "Business Plan Builder",
        description: "Create investor-ready business plans",
      },
      "contract-drafter": {
        name: "Contract Drafter",
        description: "Draft and review business contracts",
      },
      "meeting-minutes": {
        name: "Meeting Minutes",
        description: "Transform notes into structured minutes",
      },
      "pitch-deck-creator": {
        name: "Pitch Deck Creator",
        description: "Create compelling investor pitch decks",
      },
      "presentation-designer": {
        name: "Presentation Designer",
        description: "Create engaging presentations",
      },
      "project-manager": {
        name: "Project Manager",
        description: "Plan and track projects comprehensively",
      },

      "brand-namer": {
        name: "Brand Namer",
        description: "Generate creative brand names",
      },
      "image-prompt-engineer": {
        name: "Image Prompt Engineer",
        description: "Craft prompts for AI image generators",
      },
      "parody-creator": {
        name: "Parody Creator",
        description: "Engineer satirical masterpieces",
      },
      "song-writer": {
        name: "Song Writer",
        description: "Create emotionally powerful songs",
      },
      "story-writer": {
        name: "Story Writer",
        description: "Write books chapter by chapter",
      },

      "api-designer": {
        name: "API Designer",
        description: "Design developer-friendly APIs",
      },
      "bug-fix-surgeon": {
        name: "Bug Fix Surgeon",
        description: "Diagnose and fix bugs with precision",
      },
      "changelog-driven-developer": {
        name: "Changelog Developer",
        description: "Implement features from CHANGELOG.md",
      },
      "changelog-formatter": {
        name: "Changelog Formatter",
        description: "Standardize CHANGELOG.md files",
      },
      "code-explainer": {
        name: "Code Explainer",
        description: "Explain complex code in simple terms",
      },
      "code-reviewer": {
        name: "Code Reviewer",
        description: "Perform thorough code reviews",
      },
      "code-translator": {
        name: "Code Translator",
        description: "Convert code between languages",
      },
      "codebase-refactorer": {
        name: "Codebase Refactorer",
        description: "Improve code quality systematically",
      },
      "color-palette-generator": {
        name: "Color Palette Generator",
        description: "Generate UI/UX color palettes",
      },
      "database-designer": {
        name: "Database Designer",
        description: "Design efficient database schemas",
      },
      "dataset-generator": {
        name: "Dataset Generator",
        description: "Generate high-quality ML/AI datasets",
      },
      "git-assistant": {
        name: "Git Assistant",
        description: "Help with git operations",
      },
      "product-formulator": {
        name: "Product Formulator",
        description: "Generate product information",
      },
      "product-requirements": {
        name: "Product Requirements",
        description: "Create comprehensive PRDs",
      },
      "regex-engineer": {
        name: "Regex Engineer",
        description: "Create and optimize regular expressions",
      },
      "software-gap-analyzer": {
        name: "Software Gap Analyzer",
        description: "Engineer innovative software concepts",
      },
      "system-architect": {
        name: "System Architect",
        description: "Design scalable system architectures",
      },
      "technical-product-analyst": {
        name: "Technical Product Analyst",
        description: "Perform product analysis",
      },
      "test-generator": {
        name: "Test Generator",
        description: "Generate comprehensive test suites",
      },

      "data-analyst": {
        name: "Data Analyst",
        description: "Transform data into actionable insights",
      },
      "deep-researcher": {
        name: "Deep Researcher",
        description: "Conduct thorough research with citations",
      },

      "design-system-architect": {
        name: "Design System Architect",
        description: "Create comprehensive design systems",
      },
      "user-persona-creator": {
        name: "User Persona Creator",
        description: "Create research-backed user personas",
      },
      "ux-designer": {
        name: "UX Designer",
        description: "Create user-centered designs",
      },

      "fitness-planner": {
        name: "Fitness Planner",
        description: "Design personalized workout programs",
      },
      "lifestyle-recovery-planner": {
        name: "Lifestyle Recovery Planner",
        description: "Create health improvement plans",
      },
      "meal-planner": {
        name: "Meal Planner",
        description: "Create balanced meal plans",
      },

      "pentest-planner": {
        name: "Pentest Planner",
        description: "Plan penetration tests",
      },
      "security-hardening": {
        name: "Security Hardening",
        description: "Generate security hardening guides",
      },
      "threat-modeling": {
        name: "Threat Modeling",
        description: "Identify and prioritize security risks",
      },
      "vulnerability-scanner": {
        name: "Vulnerability Scanner",
        description: "Perform deep security analysis",
      },

      "course-builder": {
        name: "Course Builder",
        description: "Create educational content",
      },
      "interview-coach": {
        name: "Interview Coach",
        description: "Prepare for job interviews",
      },
      "language-tutor": {
        name: "Language Tutor",
        description: "Learn new languages",
      },

      "email-campaign-builder": {
        name: "Email Campaign Builder",
        description: "Create email campaigns",
      },
      "marketing-strategist": {
        name: "Marketing Strategist",
        description: "Develop marketing strategies",
      },
      "seo-optimizer": {
        name: "SEO Optimizer",
        description: "Optimize for search engines",
      },

      "legal-document-drafter": {
        name: "Legal Document Drafter",
        description: "Draft legal documents",
      },

      "budget-planner": {
        name: "Budget Planner",
        description: "Create budgets and manage expenses",
      },
    },

    about: {
      pageTitle: "About - Chat Engines",
      title: "About Chat Engines",
      subtitle: "Empowering creativity and productivity with chat engines",
      mission: "Our Mission",
      missionText:
        "We believe chat engines should be accessible to everyone. Chat Engines provides a unified platform to harness the power of multiple service providers through a single, intuitive interface.",
      missionText2:
        "Our platform brings together the most powerful chat engines from industry leaders like Google, OpenAI, and Anthropic, wrapped in intuitive, task-specific interfaces that anyone can use.",
      features: "Key Features",
      whatMakesUsDifferent: "What Makes Us Different",
      multiProvider: "Multi-Provider Support",
      multiProviderDesc: "Access GPT, Claude, and Gemini through one platform",
      specializedEngines: "Specialized Engines",
      specializedEnginesDesc: "Pre-configured prompts for specific tasks",
      secureByDesign: "Secure by Design",
      secureByDesignDesc: "Your API keys stay in your browser",
      freeToUse: "Free to Use",
      freeToUseDesc: "Pay only for your service provider usage",
      privacyFirst: "Privacy First",
      privacyFirstDesc:
        "Your API keys are never stored. All processing happens in real-time, and your data remains yours alone.",
      noSetupRequired: "No Setup Required",
      noSetupRequiredDesc:
        "Start using chat engines instantly. No installation, no configuration, no learning curve. Just bring your API key and go.",
      engineCount: "40+ Specialized Engines",
      engineCountDesc:
        "From code review to content creation, security analysis to data insights - we have purpose-built engines for every professional need.",
      creator: "The Creator",
      creatorName: "Yaron Koresh",
      creatorBio:
        "A programmer with extensive experience writing tools for developers in a variety of languages ​​and experience in developing integrations and designing user experiences, Chat Engines was created to bridge the gap between powerful artificial intelligence engines and practical everyday uses.",
      creatorQuote:
        "Technology should serve people. Chat Engines accelerates the production of impressive deliverables for complex or multi-step tasks, using distributed API communication to a variety of relevant service providers.",
      byTheNumbers: "By the Numbers",
      statEngines: "Chat Engines",
      statCategories: "Categories",
      statProviders: "Service Providers",
      statPossibilities: "Possibilities",
      readyToStart: "Ready to Get Started?",
      readyToStartText: "Experience the power of Chat Engines today.",
      exploreEngines: "Explore Engines",
    },

    pricingPage: {
      pageTitle: "Pricing - Chat Engines",
      title: "Simple, Transparent Pricing",
      subtitle: "Use your own API keys. Pay only for what you use.",
      free: "Free",
      freePlatform: "FREE PLATFORM",
      platformIsFree: "Chat Engines Platform is Free",
      platformIsFreeDesc:
        "You only pay for API usage directly to your chosen AI provider. No hidden fees, no subscriptions, no markups.",
      freeDesc:
        "Chat Engines is completely free to use. You only pay for what you use with your service provider.",
      apiProviderCosts: "API Provider Costs",
      apiProviderCostsSubtitle:
        "Estimated costs per 1M tokens (approximately 750,000 words)",
      howItWorks: "How It Works",
      step1: "Bring your own API keys",
      step2: "Use any service provider you prefer",
      step3: "Pay directly to your provider",
      neverCharge: "We never charge for using Chat Engines",
      getStarted: "Get Started",
      viewFullPricing: "View Full Pricing",
      mostCapable: "MOST CAPABLE",
      realWorldCostExamples: "Real-World Cost Examples",
      writeBlogPost: "Write a Blog Post",
      codeReview: "Code Review (500 lines)",
      securityScan: "Security Scan",
      dataAnalysis: "Data Analysis",
      pricingNote:
        "* Costs vary by provider and model. Estimates based on typical usage with mid-tier models.",
      whyThisPricingModel: "Why This Pricing Model?",
      traditionalSaaS: "Traditional SaaS",
      monthlySubscriptions: "Monthly subscriptions",
      usageLimits: "Usage limits",
      markupOnApiCosts: "Markup on API costs",
      vendorLockIn: "Vendor lock-in",
      noSubscriptions: "No subscriptions",
      unlimitedUsage: "Unlimited usage",
      directApiPricing: "Direct API pricing",
      switchProvidersAnytime: "Switch providers anytime",
      startUsingToday: "Start Using Chat Engines Today",
      noCreditCardRequired: "No credit card required. Just bring your API key.",
      freeFreeTierAvailable: "Free tier available",
      getStartedFree: "Get Started Free",
      googleGemini: "Google Gemini",
      openAI: "OpenAI",
      anthropicClaude: "Anthropic Claude",
      tokensCount: "tokens",
    },

    contactPage: {
      pageTitle: "Contact - Chat Engines",
      title: "Contact Us",
      subtitle: "Reach out to the developer",
      getInTouch: "Get In Touch",
      email: "Email",
      location: "Location",
      responseTime: "Response Time",
      sendMessage: "Send Message",
      yourName: "Your Name",
      yourEmail: "Your Email",
      subject: "Subject",
      message: "Message",
      send: "Send Message",
      sending: "Sending...",
      successMessage: "Your message has been sent successfully!",
      errorMessage: "Failed to send message. Please try again.",
      getInTouchText:
        "Have questions, feedback, or suggestions? Feel free to reach out directly to the solo developer.",
      responseTimeLabel: "Response Time",
      responseTimeText: "Within",
      locationLabel: "Location",
      followUs: "Follow Us",
      sendMessageTitle: "Send a Message",
      nameLabel: "Name",
      namePlaceholder: "Your name",
      emailLabel: "Email",
      emailPlaceholder: "your@email.com",
      subjectLabel: "Subject",
      selectTopic: "Select a topic",
      generalInquiry: "General Inquiry",
      technicalSupport: "Technical Support",
      feedbackOption: "Feedback",
      bugReport: "Bug Report",
      featureRequest: "Feature Request",
      businessInquiry: "Business Inquiry",
      messageLabel: "Message",
      messagePlaceholder: "How can we help you?",
      sendMessageBtn: "Send Message",
      errorOccurred: "An error occurred. Please try again.",
      tryAgainBtn: "Try Again",
      messageSentTitle: "Message Sent!",
      messageSentText:
        "Thank you for reaching out. We'll get back to you soon.",
      commonQuestions: "Common Questions",
      viewFaq: "View FAQ",
      pricingInfoLink: "Pricing Info",
    },

    docsPage: {
      pageTitle: "Documentation - Chat Engines",
      title: "Documentation",
      subtitle: "Everything you need to get started with Chat Engines",
      gettingStarted: "Getting Started",
      gettingStartedDesc: "Learn the basics of using Chat Engines",
      apiKeys: "Get Your API Key",
      apiKeysDesc: "Obtain an API key from your preferred AI provider",
      engines: "Engines",
      enginesDesc: "Learn about different engine categories",
      menuFeature: "Quick Actions Menu",
      menuFeatureDesc:
        "Each engine features a sidebar menu with pre-configured actions for common tasks. Click an option to select it, then optionally add additional context in the input field before sending.",
      selectEngine: "Select an Engine",
      selectEngineDesc:
        "Browse our specialized engines organized by category. Each engine is designed for a specific complex task like code review, content writing, security analysis, and more.",
      configureStart: "Configure & Start",
      configureStartDesc:
        'Choose your AI provider, select a model version, enter your API key, and click "Start Engine" to begin your session.',
      interact: "Interact",
      interactDesc:
        "Use the menu options and type custom messages. Attach files when needed for analysis.",
      featureGuide: "Feature Guide",
      multiTabSupport: "Multi-Tab Support",
      multiTabSupportDesc:
        "Run multiple engines simultaneously in separate tabs. Each tab maintains its own session, conversation history, and context. Switch between tabs to multitask efficiently.",
      fileAttachments: "File Attachments",
      fileAttachmentsDesc:
        "Attach files for analysis. Supported formats include:",
      images: "Images",
      imageFormats: "JPG, PNG, GIF, WebP",
      documents: "Documents",
      documentFormats: "PDF, TXT, MD, DOC, DOCX",
      code: "Code",
      codeFormats: "JS, TS, PY, Java, C, C++, Go, Rust, and more",
      data: "Data",
      dataFormats: "JSON, CSV, XML, YAML, Excel files",
      binary: "Binary",
      binaryFormats: "EXE, DLL, SO, WASM",
      quickActionsMenu: "Quick Actions Menu",
      quickActionsMenuDesc:
        "Each engine features a sidebar menu with pre-configured actions for common tasks. Simply click any option to execute it, or type in the input field first to add your own context.",
      sessionPersistence: "Session Persistence",
      sessionPersistenceDesc:
        "Your chat history is automatically saved in your browser. Return to continue previous conversations, or clear history when needed.",
      darkMode: "Dark Mode",
      darkModeDesc:
        "Toggle between light and dark themes using the theme button in the header. Your preference is saved for future visits.",
      engineCategories: "Engine Categories",
      aboutApiKeys: "About API Keys",
      securityPrivacy: "Security & Privacy",
      apiKeyNeverStored: "Your API key is never stored on our servers",
      keysOnlyForSession: "Keys are only used for the current session",
      apiCallsDirect:
        "All API calls are made directly from our server to the service providers",
      recommendRateLimits:
        "We recommend using API keys with appropriate rate limits",
      monitorUsage: "Monitor your API usage through your provider's dashboard",
      faq: "Frequently Asked Questions",
      faqProvider: "Which AI provider should I choose?",
      faqProviderAnswer:
        "Each provider has strengths. Gemini is cost-effective and fast. GPT-4 excels at complex reasoning. Claude is great for nuanced, safe responses. Try different providers to find what works best for your use case.",
      faqWhyOwnKey: "Why do I need my own API key?",
      faqWhyOwnKeyAnswer:
        "Using your own API key gives you full control over costs, usage limits, and data privacy. You pay only for what you use, directly to your chosen provider.",
      faqDataSecure: "Is my data secure?",
      faqDataSecureAnswer:
        "Yes. Your API key is never stored. Your conversations exist only during the session and in your browser's local storage. We don't have access to your data or API keys.",
      faqCommercial: "Can I use Chat Engines commercially?",
      faqCommercialAnswer:
        "Yes, but make sure you meet the terms of commercial use with the service providers for the engine you choose.",

      step1Text: "Obtain an API key from your preferred service provider",
      step2Title: "Select an Engine",
      step2Text:
        "Browse our specialized engines organized by category. Each engine is designed for a specific complex task like code review, content writing, security analysis, and more.",
      step3Title: "Configure & Start",
      step3Text:
        'Choose your service provider, enter your API key, and click "Start Engine" to begin your session.',
      step4Title: "Interact",
      step4Text:
        "Use the menu options and type custom messages. Attach files when needed for analysis.",

      featureGuideTitle: "Feature Guide",

      engineCategoriesTitle: "Engine Categories",
      audioCat: "Audio",
      audioDesc:
        "Audio mastering, music composition, podcast production, voiceover scripts",
      videoCat: "Video",
      videoDesc:
        "Documentary planning, short-form content, video ads, scene continuity",
      communicationCat: "Communication",
      communicationDesc:
        "Blog posts, customer service, CV creation, email composition",
      writingCat: "Writing",
      writingDesc: "Newsletters, persuasive copy, technical documentation",
      businessCat: "Business",
      businessDesc: "Contracts, meeting minutes, pitch decks",
      creativeCat: "Creative",
      creativeDesc: "Brand naming, parody creation, songwriting, storytelling",
      developmentCat: "Development",
      developmentDesc:
        "API design, bug fixing, code review, refactoring, testing",
      dataCat: "Data",
      dataDesc: "Data analysis, research synthesis, insights generation",
      designCat: "Design",
      designDesc: "Design systems, user personas, color palettes",
      healthCat: "Health",
      healthDesc: "Fitness planning, meal planning, lifestyle optimization",
      securityCat: "Security",
      securityDesc:
        "Vulnerability scanning, penetration testing, threat modeling",

      faqTitle: "Frequently Asked Questions",
    },

    apiGuidePage: {
      pageTitle: "API Guide - Chat Engines",
      metaDescription:
        "Chat Engines Service Providers Guide - Complete instructions for setting up service providers and integrations.",
      title: "Service Providers Guide",
      subtitle:
        "Complete instructions for configuring chat engines and external service providers to power your engines",
      supportedProviders: "Supported Providers",
      howToGetKey: "How to Get Your Key",
      geminiSteps:
        "Visit Google AI Studio, sign in with your Google account, and generate a key.",
      openaiSteps:
        "Visit OpenAI Platform, create an account, and generate a key in the Keys section.",
      anthropicSteps:
        "Visit Anthropic Console, create an account, and generate a key.",
      securityNote: "Security Note",
      securityNoteText:
        "Your keys are stored locally in your browser and are never sent to our servers. They are only used to communicate directly with your chosen provider.",

      securityTip1: "Never share API keys publicly",
      securityTip2: "Don't commit keys to git repositories",
      securityTip3: "Use environment variables in production",
      securityTip4: "Rotate keys periodically",
      costTip1: "Set spending limits in provider dashboards",
      costTip2: "Monitor usage regularly",
      costTip3: "Use free tiers for testing",
      costTip4: "Start with cheaper models",
      performanceTip1: "Use appropriate model for each task",
      performanceTip2: "Implement caching where possible",
      performanceTip3: "Handle rate limits gracefully",
      performanceTip4: "Use streaming for long responses",

      textEnginesTitle: "🤖 Text Chat Engines",
      textEnginesSubtitle:
        "Large language models for text generation, reasoning, and conversation",
      imageApisTitle: "🖼️ Image Generation APIs",
      imageApisSubtitle:
        "Create stunning images with AI-powered generation services",
      videoApisTitle: "🎬 Video Generation APIs",
      videoApisSubtitle: "Generate dynamic video content with cutting-edge AI",
      audioApisTitle: "🎵 Audio & Speech APIs",
      audioApisSubtitle: "Text-to-speech, speech-to-text, and audio generation",
      searchApisTitle: "🔍 Web Search APIs",
      searchApisSubtitle:
        "Search the web and retrieve information in real-time",
      storageApisTitle: "☁️ Cloud Storage APIs",
      storageApisSubtitle:
        "Store and retrieve files with cloud storage providers",
      emailApisTitle: "📧 Email Service APIs",
      emailApisSubtitle:
        "Send transactional and marketing emails programmatically",
      securityApisTitle: "🔐 Security & Threat Intelligence APIs",
      securityApisSubtitle:
        "Security scanning, threat intel, and vulnerability detection",
      documentApisTitle: "📄 Document Generation APIs",
      documentApisSubtitle: "Generate PDFs, documents, and other file formats",
      bestPracticesTitle: "🛡️ API Key Best Practices",

      navTextEngines: "Text Chat Engines",
      navImageGeneration: "Image Generation",
      navVideoGeneration: "Video Generation",
      navAudioMusic: "Audio & Music",
      navWebSearch: "Web Search",
      navCloudStorage: "Cloud Storage",
      navEmailServices: "Email Services",
      navSecurityThreat: "Security & Threat Intel",
      navDocumentGeneration: "Document Generation",

      availableModels: "Available Models",
      pricing: "Pricing",
      features: "Features",
      setup: "Setup",
      freeTierAvailable: "Free Tier Available",
      recommended: "Recommended",
      mostCapable: "Most Capable",
      tip: "Tip",

      securityCardTitle: "Security",
      costControlCardTitle: "Cost Control",
      performanceCardTitle: "Performance",

      readyToStart: "Ready to Get Started?",
      ctaSubtitle:
        "Set up your service providers and start using Chat Engines today.",
      launchChatEngines: "Launch Chat Engines",

      translationServices: "🌐 Translation Services",
      visionOcrServices: "👁️ Vision & OCR Services",
      dataAnalyticsServices: "📊 Data & Analytics Services",
      messagingServices: "📱 Messaging & Communication Services",
      authenticationServices: "🔐 Authentication Services",
      productivityServices: "📝 Productivity & Workspace Services",

      providers: {
        gemini: {
          title: "Google Gemini",
          freeTier: "Free Tier Available",
          recommended: "Recommended",
          availableModels: "Available Models",
          model1Name: "Gemini 2.0 Flash",
          model1Desc: "- Latest, fastest model with free tier",
          model2Name: "Gemini 1.5 Pro",
          model2Desc: "- Best for complex reasoning tasks",
          model3Name: "Gemini 1.5 Flash",
          model3Desc: "- Fast and cost-effective",
          model4Name: "Gemini 1.0 Pro",
          model4Desc: "- Stable, reliable performance",
          howToGetKey: "How to Get Your API Key",
          step1: "Visit",
          step2: "Sign in with your Google account",
          step3: 'Click "Get API Key" in the top navigation',
          step4: 'Click "Create API Key"',
          step5: "Select a Google Cloud project (or create one)",
          step6: "Copy your API key and paste it in Chat Engines",
          pricingTitle: "Pricing",
          tableModel: "Model",
          tableInput: "Input",
          tableOutput: "Output",
          price1Model: "Gemini 2.0 Flash",
          price1Input: "Free (with limits)",
          price1Output: "Free (with limits)",
          price2Model: "Gemini 1.5 Pro",
          price2Input: "$1.25/1M tokens",
          price2Output: "$5.00/1M tokens",
          price3Model: "Gemini 1.5 Flash",
          price3Input: "$0.075/1M tokens",
          price3Output: "$0.30/1M tokens",
          tipLabel: "💡 Tip:",
          tipText:
            "Start with Gemini 2.0 Flash - it's free for most use cases and offers excellent performance.",
        },
        openai: {
          title: "OpenAI GPT",
          badge: "Most Capable",
          availableModels: "Available Models",
          model1Name: "GPT-4 Turbo",
          model1Desc: "- Most capable, best for complex tasks",
          model2Name: "GPT-4o",
          model2Desc: "- Optimized GPT-4, faster responses",
          model3Name: "GPT-4o Mini",
          model3Desc: "- Cost-effective, great for most tasks",
          model4Name: "GPT-4",
          model4Desc: "- Original GPT-4, very capable",
          model5Name: "GPT-3.5 Turbo",
          model5Desc: "- Fast and affordable",
          howToGetKey: "How to Get Your API Key",
          step1: "Visit",
          step2: "Sign up or log in to your account",
          step3: "Navigate to",
          step3Link: "API Keys",
          step4: 'Click "Create new secret key"',
          step5: 'Give your key a name (e.g., "Chat Engines")',
          step6: "Copy the key immediately (it won't be shown again)",
          step7: "Add payment method in Billing settings",
          pricingTitle: "Pricing",
          tableModel: "Model",
          tableInput: "Input",
          tableOutput: "Output",
          price1Model: "GPT-4 Turbo",
          price1Input: "$10.00/1M tokens",
          price1Output: "$30.00/1M tokens",
          price2Model: "GPT-4o",
          price2Input: "$2.50/1M tokens",
          price2Output: "$10.00/1M tokens",
          price3Model: "GPT-4o Mini",
          price3Input: "$0.15/1M tokens",
          price3Output: "$0.60/1M tokens",
          price4Model: "GPT-3.5 Turbo",
          price4Input: "$0.50/1M tokens",
          price4Output: "$1.50/1M tokens",
          tipLabel: "💡 Tip:",
          tipText:
            "GPT-4o Mini offers the best balance of quality and cost for most use cases.",
        },
        anthropic: {
          title: "Anthropic Claude",
          badge: "Safest & Most Nuanced",
          availableModels: "Available Models",
          model1Name: "Claude Sonnet 4",
          model1Desc: "- Latest, excellent reasoning",
          model2Name: "Claude 3.5 Sonnet",
          model2Desc: "- Great balance of speed and capability",
          model3Name: "Claude 3 Opus",
          model3Desc: "- Most capable Claude model",
          model4Name: "Claude 3 Haiku",
          model4Desc: "- Fastest and most affordable",
          howToGetKey: "How to Get Your API Key",
          step1: "Visit",
          step2: "Sign up for an account (may require waitlist)",
          step3: "Complete account verification",
          step4: 'Go to "API Keys" in the dashboard',
          step5: 'Click "Create Key"',
          step6: "Copy your API key",
          step7: "Add credits to your account in Billing",
          pricingTitle: "Pricing",
          tableModel: "Model",
          tableInput: "Input",
          tableOutput: "Output",
          price1Model: "Claude Sonnet 4",
          price1Input: "$3.00/1M tokens",
          price1Output: "$15.00/1M tokens",
          price2Model: "Claude 3.5 Sonnet",
          price2Input: "$3.00/1M tokens",
          price2Output: "$15.00/1M tokens",
          price3Model: "Claude 3 Opus",
          price3Input: "$15.00/1M tokens",
          price3Output: "$75.00/1M tokens",
          price4Model: "Claude 3 Haiku",
          price4Input: "$0.25/1M tokens",
          price4Output: "$1.25/1M tokens",
          tipLabel: "💡 Tip:",
          tipText:
            "Claude excels at nuanced, thoughtful responses and is known for being the safest AI model.",
        },

        dalle: {
          title: "DALL-E (OpenAI)",
          badge: "Most Popular",
          description:
            "Generate, edit, and vary images using natural language prompts.",
          featuresTitle: "Features",
          feature1: "DALL-E 3: Highest quality, complex scenes",
          feature2: "DALL-E 2: Faster, more affordable",
          feature3: "Image editing and variations",
          feature4: "Multiple sizes and styles",
          setupTitle: "Setup",
          setup1: "Use the same API key as OpenAI GPT",
          setup2: "Visit",
          setup2Link: "OpenAI API Keys",
          setup3: "Ensure your account has credits",
          pricingTitle: "Pricing",
          pricing1: "DALL-E 3 (1024×1024): $0.040 per image",
          pricing2: "DALL-E 3 (1024×1792): $0.080 per image",
          pricing3: "DALL-E 2 (1024×1024): $0.020 per image",
        },
        stabilityAI: {
          title: "Stability AI",
          badge: "Open Source Models",
          description:
            "Stable Diffusion models for image generation with fine-grained control.",
          featuresTitle: "Features",
          feature1: "SDXL 1.0: High-resolution images",
          feature2: "Stable Diffusion 3: Latest model",
          feature3: "Image-to-image transformations",
          feature4: "Inpainting and outpainting",
          setupTitle: "Setup",
          setup1: "Visit",
          setup1Link: "Stability AI Platform",
          setup2: "Create an account",
          setup3: "Navigate to API Keys",
          setup4: "Generate a new API key",
          setup5: "Add credits to your account",
          pricingTitle: "Pricing",
          pricing1: "Credits-based system",
          pricing2: "~$0.01-0.05 per image depending on model",
          pricing3: "Free credits for new accounts",
        },
        midjourney: {
          title: "Midjourney API",
          badge: "Best Quality",
          description:
            "Access Midjourney's stunning image generation through third-party APIs.",
          featuresTitle: "Features",
          feature1: "Industry-leading image quality",
          feature2: "Artistic and photorealistic styles",
          feature3: "V6 model with improved coherence",
          setupTitle: "Setup Options",
          setup1Official: "Official:",
          setup1: "Subscribe at",
          setup1Link: "midjourney.com",
          setup2ApiAccess: "API Access:",
          setup2: "Use services like",
          setup2Link1: "ImagineAPI",
          setup2Or: "or",
          setup2Link2: "UseAPI",
          setup3: "Generate API key from your chosen provider",
          pricingTitle: "Pricing",
          pricing1: "Basic Plan: $10/month (200 images)",
          pricing2: "Standard Plan: $30/month (unlimited relaxed)",
          pricing3: "Pro Plan: $60/month (fast hours)",
        },
        googleImagen: {
          title: "Google Imagen",
          badge: "Google AI",
          description: "Google's text-to-image diffusion models via Vertex AI.",
          featuresTitle: "Features",
          feature1: "Imagen 3: Latest high-quality model",
          feature2: "Imagen 2: Fast and reliable",
          feature3: "Photorealistic and artistic styles",
          feature4: "Integrated with Google Cloud",
          setupTitle: "Setup",
          setup1: "Visit",
          setup1Link: "Google Vertex AI",
          setup2: "Enable Vertex AI API in Google Cloud Console",
          setup3: "Create service account credentials",
          setup4: "Download JSON key file",
          pricingTitle: "Pricing",
          pricing1: "Imagen 3: ~$0.04 per image",
          pricing2: "Imagen 2: ~$0.02 per image",
          pricing3: "Free credits available for new users",
        },

        veo: {
          title: "Google Veo",
          badge: "Recommended",
          description:
            "Google's state-of-the-art video generation model via Vertex AI.",
          feature1: "Veo 2: Latest high-quality video generation",
          feature2: "1080p resolution support",
          feature3: "Text-to-video and image-to-video",
          feature4: "Integrated with Google Cloud",
          setup1: "Visit",
          setup2: "Enable Vertex AI API in Google Cloud Console",
          setup3: "Request access to Veo models",
          setup4: "Create service account credentials",
          pricing1: "Pay-per-second pricing",
          pricing2: "Varies by video length and resolution",
          pricing3: "Free tier available for testing",
        },
        runway: {
          title: "Runway",
          badge: "Industry Leader",
          description: "Professional video generation with Gen-3 Alpha models.",
          feature1: "Gen-3 Alpha: Highest quality video generation",
          feature2: "Text-to-video and image-to-video",
          feature3: "Motion brush and camera controls",
          feature4: "Professional editing tools",
          setup1: "Visit",
          setup2: "Sign up for an account",
          setup3: "Navigate to API settings",
          setup4: "Generate API key",
          pricing1: "Credits-based system",
          pricing2: "Standard: $15/month (625 credits)",
          pricing3: "Pro: $35/month (2,250 credits)",
        },
        pika: {
          title: "Pika",
          badge: "Fast Generation",
          description:
            "Fast and creative video generation with unique effects.",
          feature1: "Pika 2.0: Latest model with improved quality",
          feature2: "Text-to-video and image-to-video",
          feature3: "Unique visual effects and modifications",
          feature4: "Quick generation times",
          setup1: "Visit",
          setup2: "Create an account",
          setup3: "Access API from developer settings",
          setup4: "Generate API credentials",
          pricing1: "Free tier: 250 credits/month",
          pricing2: "Basic: $10/month (700 credits)",
          pricing3: "Standard: $35/month (2,100 credits)",
        },
        sora: {
          title: "OpenAI Sora",
          badge: "Premium Quality",
          description: "OpenAI's revolutionary text-to-video model.",
          feature1: "Highly realistic video generation",
          feature2: "Complex scene understanding",
          feature3: "Up to 60 seconds of video",
          feature4: "Multiple aspect ratios",
          setup1: "Visit",
          setup2: "Sign up with OpenAI account",
          setup3: "Access available through ChatGPT Plus/Pro",
          setup4: "API access may require additional approval",
          pricing1: "Included with ChatGPT Plus ($20/month)",
          pricing2: "More generations with ChatGPT Pro ($200/month)",
          pricing3: "API pricing varies",
        },
        kling: {
          title: "Kling AI",
          badge: "High Quality",
          description:
            "Advanced video generation with exceptional motion coherence.",
          feature1: "Kling 1.6: Latest high-quality model",
          feature2: "Up to 10 seconds at 1080p",
          feature3: "Excellent motion consistency",
          feature4: "Text and image-to-video",
          setup1: "Visit",
          setup2: "Create an account",
          setup3: "Access API from developer portal",
          setup4: "Generate API key",
          pricing1: "Credits-based system",
          pricing2: "Free tier available",
          pricing3: "Pro plans for higher volume",
        },

        deepl: {
          title: "DeepL",
          badge: "Best Quality",
          description:
            "Industry-leading translation quality with neural machine translation.",
          featuresTitle: "Features",
          feature1: "Superior translation quality",
          feature2: "30+ languages supported",
          feature3: "Document translation",
          feature4: "Glossary support",
          setupTitle: "Setup",
          setup1: "Visit",
          setup2: "Create an account",
          setup3: "Get API key from account settings",
          pricingTitle: "Pricing",
          pricing1: "Free: 500,000 chars/month",
          pricing2: "Pro: €4.99 + €20/1M chars",
        },
        googleTranslate: {
          title: "Google Translate",
          badge: "130+ Languages",
          description:
            "Translate text between 130+ languages with Google Cloud.",
          featuresTitle: "Features",
          feature1: "130+ languages",
          feature2: "Auto language detection",
          feature3: "Batch translation",
          setupTitle: "Setup",
          setup1: "Visit",
          setup2: "Enable Cloud Translation API",
          setup3: "Create service account credentials",
          pricingTitle: "Pricing",
          pricing1: "Free: $10 credit for new users",
          pricing2: "$20 per million characters",
        },
        azureTranslator: {
          title: "Azure Translator",
          badge: "Free Tier",
          description: "Microsoft's neural machine translation service.",
          featuresTitle: "Features",
          feature1: "100+ languages",
          feature2: "Custom translator",
          feature3: "Document translation",
          setupTitle: "Setup",
          setup1: "Visit",
          setup2: "Create Azure account",
          setup3: "Create Translator resource",
          pricingTitle: "Pricing",
          pricing1: "Free: 2M chars/month",
          pricing2: "$10 per million chars",
        },

        googleVision: {
          title: "Google Vision",
          badge: "Image Analysis",
          description:
            "Powerful image analysis including OCR, object detection, and more.",
          featuresTitle: "Features",
          feature1: "Text extraction (OCR)",
          feature2: "Object and face detection",
          feature3: "Safe search detection",
          feature4: "Label detection",
          setupTitle: "Setup",
          setup1: "Visit",
          setup2: "Enable Vision API",
          setup3: "Create API credentials",
          pricingTitle: "Pricing",
          pricing1: "First 1,000 units/month free",
          pricing2: "$1.50 per 1,000 images",
        },
        azureVision: {
          title: "Azure Computer Vision",
          badge: "Free Tier",
          description: "Microsoft's computer vision and OCR capabilities.",
          featuresTitle: "Features",
          feature1: "OCR for printed and handwritten text",
          feature2: "Image analysis",
          feature3: "Spatial analysis",
          setupTitle: "Setup",
          setup1: "Visit",
          setup2: "Create Azure account",
          setup3: "Create Computer Vision resource",
          pricingTitle: "Pricing",
          pricing1: "Free: 5,000 transactions/month",
          pricing2: "$1.00 per 1,000 transactions",
        },
        ocrSpace: {
          title: "OCR.space",
          badge: "Free OCR",
          description: "Free and easy-to-use OCR service.",
          featuresTitle: "Features",
          feature1: "PDF and image OCR",
          feature2: "Multi-language support",
          feature3: "Simple REST API",
          setupTitle: "Setup",
          setup1: "Visit",
          setup2: "Get free API key",
          pricingTitle: "Pricing",
          pricing1: "Free: 25,000 requests/month",
          pricing2: "Pro: $15/month",
        },

        elevenlabs: {
          title: "ElevenLabs",
          badge: "Best Quality TTS",
          description: "Industry-leading text-to-speech and voice synthesis.",
          featuresTitle: "Features",
          feature1: "Ultra-realistic voice generation",
          feature2: "Voice cloning capabilities",
          feature3: "29+ languages supported",
          feature4: "Sound effects generation",
          setupTitle: "Setup",
          setup1: "Visit",
          setup2: "Create an account",
          setup3: "Go to Profile → API Key",
          setup4: "Copy your API key",
          pricingTitle: "Pricing",
          pricing1: "Free: 10,000 characters/month",
          pricing2: "Starter: $5/month (30K characters)",
          pricing3: "Creator: $22/month (100K characters)",
        },
        azureSpeech: {
          title: "Azure Speech",
          badge: "Enterprise",
          description: "Microsoft's neural text-to-speech with 400+ voices.",
          featuresTitle: "Features",
          feature1: "Neural TTS with natural intonation",
          feature2: "400+ voices in 140+ languages",
          feature3: "Custom voice creation",
          feature4: "SSML support for fine control",
          setupTitle: "Setup",
          setup1: "Visit",
          setup2: "Create Azure account",
          setup3: "Create Speech resource",
          setup4: "Get API key and region from resource",
          pricingTitle: "Pricing",
          pricing1: "Free: 500K characters/month",
          pricing2: "Neural: $16 per 1M characters",
        },
        googleTts: {
          title: "Google Cloud TTS",
          badge: "Many Languages",
          description:
            "Google's text-to-speech with 220+ voices in 40+ languages.",
          featuresTitle: "Features",
          feature1: "WaveNet and Neural2 voices",
          feature2: "Studio-quality output",
          feature3: "Custom voice training",
          feature4: "Multiple audio formats",
          setupTitle: "Setup",
          setup1: "Visit",
          setup2: "Enable the API in Google Cloud Console",
          setup3: "Create service account",
          setup4: "Download credentials JSON",
          pricingTitle: "Pricing",
          pricing1: "Free: 1M characters/month (Standard)",
          pricing2: "WaveNet: $16 per 1M characters",
          pricing3: "Neural2: $16 per 1M characters",
        },

        serper: {
          title: "Serper (Google Search)",
          badge: "Recommended",
          description: "Fast, affordable Google Search results API.",
          setupTitle: "Setup",
          setup1: "Visit",
          setup2: "Sign up for free account",
          setup3: "Get your API key from dashboard",
          setup4: "2,500 free searches included",
          pricingTitle: "Pricing",
          pricing1: "Free: 2,500 searches",
          pricing2: "Starter: $50/month (50K searches)",
        },
        tavily: {
          title: "Tavily AI Search",
          badge: "AI-Optimized",
          description: "Search API designed specifically for AI applications.",
          setupTitle: "Setup",
          setup1: "Visit",
          setup2: "Sign up for an account",
          setup3: "Access API key from dashboard",
          pricingTitle: "Pricing",
          pricing1: "Free: 1,000 searches/month",
          pricing2: "Pro: Contact for pricing",
        },
        bingSearch: {
          title: "Bing Search API",
          badge: "Microsoft",
          description: "Microsoft's Bing search results API.",
          setupTitle: "Setup",
          setup1: "Visit",
          setup2: "Sign up for Azure account",
          setup3: "Create a Bing Search resource",
          setup4: "Get API key from Azure Portal",
          pricingTitle: "Pricing",
          pricing1: "Free: 1,000 calls/month",
          pricing2: "S1: $7/1,000 calls",
        },

        wolframAlpha: {
          title: "Wolfram Alpha",
          badge: "Computational Knowledge",
          description:
            "Access computational knowledge and mathematical calculations.",
          featuresTitle: "Features",
          feature1: "Mathematical computations",
          feature2: "Data analysis and visualization",
          feature3: "Scientific calculations",
          feature4: "Knowledge queries",
          setupTitle: "Setup",
          setup1: "Visit",
          setup2: "Create a developer account",
          setup3: "Navigate to API access",
          setup4: "Generate your AppID",
          pricingTitle: "Pricing",
          pricing1: "Free: 2,000 queries/month",
          pricing2: "Paid plans available",
        },
        serpApi: {
          title: "SerpAPI",
          badge: "Search Data",
          description:
            "Get structured search results from Google and other search engines.",
          featuresTitle: "Features",
          feature1: "Google SERP data",
          feature2: "Multiple search engines",
          feature3: "Real-time results",
          feature4: "Location-based searches",
          setupTitle: "Setup",
          setup1: "Visit",
          setup2: "Create an account",
          setup3: "Get API key from dashboard",
          pricingTitle: "Pricing",
          pricing1: "Free: 100 searches/month",
          pricing2: "Developer: $75/month",
        },
        newsApi: {
          title: "News API",
          badge: "Free Tier",
          description: "Access news articles from sources worldwide.",
          featuresTitle: "Features",
          feature1: "Headlines from 80,000+ sources",
          feature2: "Search historical articles",
          feature3: "Filter by source, language, country",
          setupTitle: "Setup",
          setup1: "Visit",
          setup2: "Register for free",
          setup3: "Get API key",
          pricingTitle: "Pricing",
          pricing1: "Free: 100 requests/day (dev only)",
          pricing2: "Business: $449/month",
        },

        awsS3: {
          title: "AWS S3",
          badge: "Industry Standard",
          description:
            "Amazon's Simple Storage Service for reliable file storage.",
          setupTitle: "Setup",
          setup1: "Visit",
          setup2: "Create AWS account",
          setup3: "Go to IAM console",
          setup4: "Create a new IAM user",
          setup5: "Attach S3 permissions policy",
          setup6: "Generate Access Key ID and Secret Access Key",
          setup7: "Create an S3 bucket for your files",
          pricingTitle: "Pricing",
          pricing1: "Storage: $0.023/GB/month",
          pricing2: "PUT requests: $0.005/1,000",
          pricing3: "GET requests: $0.0004/1,000",
          pricing4: "Free tier: 5GB for 12 months",
        },
        googleCloudStorage: {
          title: "Google Cloud Storage",
          badge: "Easy Integration",
          description: "Google's cloud storage solution with global CDN.",
          setupTitle: "Setup",
          setup1: "Visit",
          setup2: "Create or select a project",
          setup3: "Enable Cloud Storage API",
          setup4: "Create a service account",
          setup5: "Download JSON key file",
          setup6: "Create a storage bucket",
          pricingTitle: "Pricing",
          pricing1: "Standard: $0.020/GB/month",
          pricing2: "Free tier: 5GB for Always Free",
        },
        azureBlob: {
          title: "Azure Blob Storage",
          badge: "Enterprise",
          description: "Microsoft Azure's blob storage for unstructured data.",
          setupTitle: "Setup",
          setup1: "Visit",
          setup2: "Create Azure account",
          setup3: "Create a Storage Account",
          setup4: "Get connection string from Access Keys",
          setup5: "Create a container for your files",
          pricingTitle: "Pricing",
          pricing1: "Hot tier: $0.018/GB/month",
          pricing2: "Free tier available with Azure account",
        },

        sendgrid: {
          title: "SendGrid",
          badge: "Recommended",
          description: "Reliable email delivery with excellent deliverability.",
          setupTitle: "Setup",
          setup1: "Visit",
          setup2: "Sign up for free account",
          setup3: "Verify your email domain",
          setup4: "Go to Settings → API Keys",
          setup5: "Create API key with Mail Send permissions",
          pricingTitle: "Pricing",
          pricing1: "Free: 100 emails/day forever",
          pricing2: "Essentials: $19.95/month (50K emails)",
        },
        mailgun: {
          title: "Mailgun",
          badge: "Developer Favorite",
          description: "Powerful email API for developers.",
          setupTitle: "Setup",
          setup1: "Visit",
          setup2: "Create account",
          setup3: "Verify your domain",
          setup4: "Get API key from dashboard",
          pricingTitle: "Pricing",
          pricing1: "Trial: 5,000 emails/month for 3 months",
          pricing2: "Foundation: $35/month (50K emails)",
        },
        awsSes: {
          title: "AWS SES",
          badge: "Most Affordable",
          description: "Amazon Simple Email Service - highly cost-effective.",
          setupTitle: "Setup",
          setup1: "Visit",
          setup2: "Create AWS account",
          setup3: "Verify your email/domain",
          setup4: "Request production access",
          setup5: "Create SMTP credentials or use API",
          pricingTitle: "Pricing",
          pricing1: "$0.10 per 1,000 emails",
          pricing2: "Free tier: 62,000 emails/month (from EC2)",
        },

        twilio: {
          title: "Twilio",
          badge: "Industry Leader",
          description:
            "Complete communications platform for SMS, voice, and WhatsApp.",
          featuresTitle: "Features",
          feature1: "SMS messaging worldwide",
          feature2: "Voice calls and IVR",
          feature3: "WhatsApp Business API",
          feature4: "Video capabilities",
          setupTitle: "Setup",
          setup1: "Visit",
          setup2: "Create free account",
          setup3: "Get Account SID and Auth Token",
          pricingTitle: "Pricing",
          pricing1: "Free trial with credits",
          pricing2: "SMS: ~$0.0079 per message",
        },
        messageBird: {
          title: "MessageBird",
          badge: "Omnichannel",
          description: "Omnichannel communication platform.",
          featuresTitle: "Features",
          feature1: "SMS, Voice, Chat",
          feature2: "WhatsApp, Telegram, Facebook",
          feature3: "Flow Builder automation",
          setupTitle: "Setup",
          setup1: "Visit",
          setup2: "Create account",
          setup3: "Get API key",
          pricingTitle: "Pricing",
          pricing1: "Pay-as-you-go",
          pricing2: "Free trial available",
        },
        vonage: {
          title: "Vonage",
          badge: "Enterprise",
          description: "Enterprise communications APIs.",
          featuresTitle: "Features",
          feature1: "SMS and MMS",
          feature2: "Voice and video",
          feature3: "Verify API for 2FA",
          setupTitle: "Setup",
          setup1: "Visit",
          setup2: "Create developer account",
          setup3: "Get API credentials",
          pricingTitle: "Pricing",
          pricing1: "Free credits for new users",
          pricing2: "Pay-as-you-go",
        },
        slack: {
          title: "Slack",
          badge: "Team Chat",
          description:
            "Integrate with Slack for team messaging and automation.",
          featuresTitle: "Features",
          feature1: "Send messages",
          feature2: "Create channels",
          feature3: "Bot interactions",
          feature4: "Workflow automation",
          setupTitle: "Setup",
          setup1: "Visit",
          setup2: "Create a Slack app",
          setup3: "Install to workspace",
          setup4: "Get OAuth token",
          pricingTitle: "Pricing",
          pricing1: "Free with Slack workspace",
        },

        shodan: {
          title: "Shodan",
          badge: "Best for Recon",
          description:
            "The search engine for Internet-connected devices and security intelligence.",
          featuresTitle: "Features",
          feature1: "Search for exposed devices and services",
          feature2: "Vulnerability detection",
          feature3: "Network exposure analysis",
          feature4: "Historical data and trends",
          setupTitle: "Setup",
          setup1: "Visit",
          setup2: "Create an account",
          setup3: "Go to Account → API Key",
          setup4: "Copy your API key",
          pricingTitle: "Pricing",
          pricing1: "Free: 100 queries/month",
          pricing2: "Membership: $49 (lifetime)",
          pricing3: "API plans from $59/month",
        },
        virusTotal: {
          title: "VirusTotal",
          badge: "Malware Analysis",
          description:
            "Analyze files and URLs for viruses, malware, and other threats.",
          featuresTitle: "Features",
          feature1: "File and URL scanning",
          feature2: "70+ antivirus engines",
          feature3: "Domain and IP reputation",
          feature4: "Threat intelligence reports",
          setupTitle: "Setup",
          setup1: "Visit",
          setup2: "Create an account",
          setup3: "Go to API Key in your profile",
          setup4: "Copy your API key",
          pricingTitle: "Pricing",
          pricing1: "Free: 500 requests/day",
          pricing2: "Premium: Contact for pricing",
        },
        hibp: {
          title: "Have I Been Pwned",
          badge: "Breach Detection",
          description:
            "Check if emails and passwords have been exposed in data breaches.",
          featuresTitle: "Features",
          feature1: "Email breach checking",
          feature2: "Password exposure API",
          feature3: "Domain search for organizations",
          feature4: "Breach notification service",
          setupTitle: "Setup",
          setup1: "Visit",
          setup2: "Subscribe to the API",
          setup3: "Receive your API key via email",
          pricingTitle: "Pricing",
          pricing1: "Password API: Free (no key needed)",
          pricing2: "Breach API: $3.50/month",
        },
        securityTrails: {
          title: "SecurityTrails",
          badge: "DNS Intelligence",
          description: "Comprehensive DNS and domain intelligence data.",
          featuresTitle: "Features",
          feature1: "Historical DNS records",
          feature2: "Domain and IP intelligence",
          feature3: "Subdomain enumeration",
          feature4: "WHOIS history",
          setupTitle: "Setup",
          setup1: "Visit",
          setup2: "Create an account",
          setup3: "Navigate to API section",
          setup4: "Generate API key",
          pricingTitle: "Pricing",
          pricing1: "Free: 50 queries/month",
          pricing2: "Starter: $99/month",
        },

        auth0: {
          title: "Auth0",
          badge: "Auth Leader",
          description: "Complete identity and authentication platform.",
          featuresTitle: "Features",
          feature1: "Universal Login",
          feature2: "Multi-factor authentication",
          feature3: "Social login integration",
          feature4: "Single Sign-On",
          setupTitle: "Setup",
          setup1: "Visit",
          setup2: "Create free account",
          setup3: "Create application",
          setup4: "Get client credentials",
          pricingTitle: "Pricing",
          pricing1: "Free: 7,000 users",
          pricing2: "Essential: $23/month",
        },

        docRaptor: {
          title: "DocRaptor",
          badge: "Recommended",
          description:
            "Professional PDF generation from HTML with Prince rendering.",
          featuresTitle: "Features",
          feature1: "PDF and Excel generation",
          feature2: "CSS Paged Media support",
          feature3: "Headers, footers, page numbers",
          feature4: "Watermarks and security",
          setupTitle: "Setup",
          setup1: "Visit",
          setup2: "Sign up for account",
          setup3: "Get API key from dashboard",
          pricingTitle: "Pricing",
          pricing1: "Test documents: Free (watermarked)",
          pricing2: "Starter: $15/month (125 docs)",
        },
        pdfShift: {
          title: "PDFShift",
          badge: "Simple API",
          description: "Convert HTML to PDF with a simple API.",
          setupTitle: "Setup",
          setup1: "Visit",
          setup2: "Create account",
          setup3: "Get API key",
          pricingTitle: "Pricing",
          pricing1: "Free: 50 conversions/month",
          pricing2: "Starter: $9/month (500 conversions)",
        },
        gotenberg: {
          title: "Gotenberg",
          badge: "Self-Hosted/Free",
          description: "Open-source document conversion API (self-hosted).",
          featuresTitle: "Features",
          feature1: "PDF from HTML, Markdown, Office docs",
          feature2: "Merge PDFs",
          feature3: "Self-hosted (free)",
          setupTitle: "Setup",
          setup1: "Visit",
          setup2: "Run with Docker",
          setup3: "Or use cloud hosting services",
          pricingTitle: "Pricing",
          pricing1: "Free (self-hosted)",
          pricing2: "Cloud services vary",
        },

        notion: {
          title: "Notion",
          badge: "Workspace",
          description:
            "Connect to Notion workspaces for notes, databases, and more.",
          featuresTitle: "Features",
          feature1: "Database CRUD operations",
          feature2: "Page creation and updates",
          feature3: "Search functionality",
          setupTitle: "Setup",
          setup1: "Visit",
          setup2: "Create integration",
          setup3: "Get internal integration token",
          pricingTitle: "Pricing",
          pricing1: "Free with Notion account",
        },
        googleWorkspace: {
          title: "Google Workspace",
          badge: "Docs, Sheets, Gmail",
          description: "Access Google Docs, Sheets, Drive, Gmail and more.",
          featuresTitle: "Features",
          feature1: "Google Docs creation/editing",
          feature2: "Sheets data manipulation",
          feature3: "Drive file management",
          feature4: "Gmail integration",
          setupTitle: "Setup",
          setup1: "Visit",
          setup2: "Enable APIs in Cloud Console",
          setup3: "Create OAuth credentials",
          pricingTitle: "Pricing",
          pricing1: "Free tier available",
          pricing2: "Varies by API usage",
        },
      },
    },

    serviceProviders: {
      additionalProviders: "🔌 Additional Service Providers",
      additionalProvidersDesc:
        "Detailed integrations to enhance your workflow - click to expand",
      features: "Features",
      setup: "Setup",
      pricing: "Pricing",

      wolframAlpha: "Wolfram Alpha",
      computationalBadge: "Computational Knowledge",
      wolframDesc:
        "Access computational knowledge and mathematical calculations.",
      wolframFeature1: "Mathematical computations",
      wolframFeature2: "Data analysis and visualization",
      wolframFeature3: "Scientific calculations",
      wolframFeature4: "Knowledge queries",
      wolframStep1: "Visit",
      wolframStep2: "Create a developer account",
      wolframStep3: "Navigate to API access",
      wolframStep4: "Generate your AppID",
      wolframPricing1: "Free: 2,000 queries/month",
      wolframPricing2: "Paid plans available",

      serpAPI: "SerpAPI",
      searchDataBadge: "Search Data",
      serpDesc:
        "Get structured search results from Google and other search engines.",
      serpFeature1: "Google SERP data",
      serpFeature2: "Multiple search engines",
      serpFeature3: "Real-time results",
      serpFeature4: "Location-based searches",
      serpStep1: "Visit",
      serpStep2: "Create an account",
      serpStep3: "Get API key from dashboard",
      serpPricing1: "Free: 100 searches/month",
      serpPricing2: "Developer: $75/month",

      newsAPI: "News API",
      freeTierBadge: "Free Tier",
      newsDesc: "Access news articles from sources worldwide.",
      newsFeature1: "Headlines from 80,000+ sources",
      newsFeature2: "Search historical articles",
      newsFeature3: "Filter by source, language, country",
      newsStep1: "Visit",
      newsStep2: "Register for free",
      newsStep3: "Get API key",
      newsPricing1: "Free: 100 requests/day (dev only)",
      newsPricing2: "Business: $449/month",

      deepL: "DeepL",
      bestQualityBadge: "Best Quality",
      deepLDesc:
        "Industry-leading translation quality with neural machine translation.",
      deepLFeature1: "Superior translation quality",
      deepLFeature2: "30+ languages supported",
      deepLFeature3: "Document translation",
      deepLFeature4: "Glossary support",
      deepLStep1: "Visit",
      deepLStep2: "Create an account",
      deepLStep3: "Get API key from account settings",
      deepLPricing1: "Free: 500,000 chars/month",
      deepLPricing2: "Pro: €4.99 + €20/1M chars",

      googleTranslate: "Google Translate",
      mostLanguagesBadge: "130+ Languages",
      googleTranslateDesc:
        "Translate text between 130+ languages with Google Cloud.",
      googleTranslateFeature1: "130+ languages",
      googleTranslateFeature2: "Auto language detection",
      googleTranslateFeature3: "Batch translation",
      googleTranslateStep1: "Visit",
      googleTranslateStep2: "Enable Cloud Translation API",
      googleTranslateStep3: "Create service account credentials",
      googleTranslatePricing1: "Free: $10 credit for new users",
      googleTranslatePricing2: "$20 per million characters",

      azureTranslator: "Azure Translator",
      azureTranslatorDesc: "Microsoft's neural machine translation service.",
      azureTranslatorFeature1: "100+ languages",
      azureTranslatorFeature2: "Custom translator",
      azureTranslatorFeature3: "Document translation",
      azureTranslatorStep1: "Visit",
      azureTranslatorStep2: "Create Azure account",
      azureTranslatorStep3: "Create Translator resource",
      azureTranslatorPricing1: "Free: 2M chars/month",
      azureTranslatorPricing2: "$10 per million chars",

      googleVision: "Google Vision",
      imageAnalysisBadge: "Image Analysis",
      googleVisionDesc:
        "Powerful image analysis including OCR, object detection, and more.",
      googleVisionFeature1: "Text extraction (OCR)",
      googleVisionFeature2: "Object and face detection",
      googleVisionFeature3: "Safe search detection",
      googleVisionFeature4: "Label detection",
      googleVisionStep1: "Visit",
      googleVisionStep2: "Enable Vision API",
      googleVisionStep3: "Create API credentials",
      googleVisionPricing1: "First 1,000 units/month free",
      googleVisionPricing2: "$1.50 per 1,000 images",

      azureVision: "Azure Computer Vision",
      azureVisionDesc: "Microsoft's computer vision and OCR capabilities.",
      azureVisionFeature1: "OCR for printed and handwritten text",
      azureVisionFeature2: "Image analysis",
      azureVisionFeature3: "Spatial analysis",
      azureVisionStep1: "Visit",
      azureVisionStep2: "Create Azure account",
      azureVisionStep3: "Create Computer Vision resource",
      azureVisionPricing1: "Free: 5,000 transactions/month",
      azureVisionPricing2: "$1.00 per 1,000 transactions",

      ocrSpace: "OCR.space",
      freeOCRBadge: "Free OCR",
      ocrSpaceDesc: "Free and easy-to-use OCR service.",
      ocrSpaceFeature1: "PDF and image OCR",
      ocrSpaceFeature2: "Multi-language support",
      ocrSpaceFeature3: "Simple REST API",
      ocrSpaceStep1: "Visit",
      ocrSpaceStep2: "Get free API key",
      ocrSpacePricing1: "Free: 25,000 requests/month",
      ocrSpacePricing2: "Pro: $15/month",

      twilio: "Twilio",
      industryLeaderBadge: "Industry Leader",
      twilioDesc:
        "Complete communications platform for SMS, voice, and WhatsApp.",
      twilioFeature1: "SMS messaging worldwide",
      twilioFeature2: "Voice calls and IVR",
      twilioFeature3: "WhatsApp Business API",
      twilioFeature4: "Video capabilities",
      twilioStep1: "Visit",
      twilioStep2: "Create free account",
      twilioStep3: "Get Account SID and Auth Token",
      twilioPricing1: "Free trial with credits",
      twilioPricing2: "SMS: ~$0.0079 per message",

      messageBird: "MessageBird",
      omnichannelBadge: "Omnichannel",
      messageBirdDesc: "Omnichannel communication platform.",
      messageBirdFeature1: "SMS, Voice, Chat",
      messageBirdFeature2: "WhatsApp, Telegram, Facebook",
      messageBirdFeature3: "Flow Builder automation",
      messageBirdStep1: "Visit",
      messageBirdStep2: "Create account",
      messageBirdStep3: "Get API key",
      messageBirdPricing1: "Pay-as-you-go",
      messageBirdPricing2: "Free trial available",

      vonage: "Vonage",
      enterpriseBadge: "Enterprise",
      vonageDesc: "Enterprise communications APIs.",
      vonageFeature1: "SMS and MMS",
      vonageFeature2: "Voice and video",
      vonageFeature3: "Verify API for 2FA",
      vonageStep1: "Visit",
      vonageStep2: "Create developer account",
      vonageStep3: "Get API credentials",
      vonagePricing1: "Free credits for new users",
      vonagePricing2: "Pay-as-you-go",

      auth0: "Auth0",
      authLeaderBadge: "Auth Leader",
      auth0Desc: "Complete identity and authentication platform.",
      auth0Feature1: "Universal Login",
      auth0Feature2: "Multi-factor authentication",
      auth0Feature3: "Social login integration",
      auth0Feature4: "Single Sign-On",
      auth0Step1: "Visit",
      auth0Step2: "Create free account",
      auth0Step3: "Create application",
      auth0Step4: "Get client credentials",
      auth0Pricing1: "Free: 7,000 users",
      auth0Pricing2: "Essential: $23/month",

      virusTotal: "VirusTotal",
      malwareScanBadge: "Malware Scan",
      virusTotalDesc:
        "Analyze files and URLs for malware using 70+ antivirus engines.",
      virusTotalFeature1: "File and URL scanning",
      virusTotalFeature2: "70+ antivirus engines",
      virusTotalFeature3: "Domain and IP intelligence",
      virusTotalStep1: "Visit",
      virusTotalStep2: "Create free account",
      virusTotalStep3: "Get API key from profile",
      virusTotalPricing1: "Free: 500 requests/day",
      virusTotalPricing2: "Premium: Contact sales",

      hibp: "Have I Been Pwned",
      breachDetectBadge: "Breach Detection",
      hibpDesc: "Check if accounts have been compromised in data breaches.",
      hibpFeature1: "Email breach check",
      hibpFeature2: "Password exposure check",
      hibpFeature3: "Domain search",
      hibpStep1: "Visit",
      hibpStep2: "Subscribe for API access",
      hibpPricing1: "Password API: Free",
      hibpPricing2: "Breach API: $3.50/month",

      notion: "Notion",
      workspaceBadge: "Workspace",
      notionDesc:
        "Connect to Notion workspaces for notes, databases, and more.",
      notionFeature1: "Database CRUD operations",
      notionFeature2: "Page creation and updates",
      notionFeature3: "Search functionality",
      notionStep1: "Visit",
      notionStep2: "Create integration",
      notionStep3: "Get internal integration token",
      notionPricing1: "Free with Notion account",

      slack: "Slack",
      teamChatBadge: "Team Chat",
      slackDesc: "Integrate with Slack for team messaging and automation.",
      slackFeature1: "Send messages",
      slackFeature2: "Create channels",
      slackFeature3: "Bot interactions",
      slackFeature4: "Workflow automation",
      slackStep1: "Visit",
      slackStep2: "Create a Slack app",
      slackStep3: "Install to workspace",
      slackStep4: "Get OAuth token",
      slackPricing1: "Free with Slack workspace",

      googleWorkspace: "Google Workspace",
      docsSheetsMailBadge: "Docs, Sheets, Gmail",
      googleWorkspaceDesc: "Access Google Docs, Sheets, Drive, Gmail and more.",
      googleWorkspaceFeature1: "Google Docs creation/editing",
      googleWorkspaceFeature2: "Sheets data manipulation",
      googleWorkspaceFeature3: "Drive file management",
      googleWorkspaceFeature4: "Gmail integration",
      googleWorkspaceStep1: "Visit",
      googleWorkspaceStep2: "Enable APIs in Cloud Console",
      googleWorkspaceStep3: "Create OAuth credentials",
      googleWorkspacePricing1: "Free tier available",
      googleWorkspacePricing2: "Varies by API usage",
    },
  },

  he: {
    nav: {
      home: "בית",
      engines: "מנועים",
      chats: "צ'אטים",
      about: "אודות",
      documentation: "מדריך",
      apiGuide: "ספקי שירות",
      pricing: "תמחור",
      contact: "צרו קשר",
      allEngines: "כל המנועים",
      homeWithIcon: "🏠 בית",
      chatsWithIcon: "💬 צ'אטים",
      aboutWithIcon: "ℹ️ אודות",
      documentationWithIcon: "📚 תיעוד",
      apiGuideWithIcon: "🔌 מדריך ספקים",
      pricingWithIcon: "💰 תמחור",
      contactWithIcon: "✉️ צור קשר",
    },

    category: {
      pageTitle: "קטגוריה - Chat Engines",
      metaDescription: "גלו מנועים מתמחים בקטגוריה זו",
    },

    hero: {
      badge: "🚀 כלים מקצועיים",
      title: "שדרגו את העבודה שלכם עם",
      titleHighlight: "Chat Engines",
      subtitle:
        "כלים מקצועיים ליצירת תוכן, פיתוח תוכנה, ניתוח אבטחה ועוד. מופעל באמצעות מנועי הבינה המלאכותית המתקדמים ביותר.",
      exploreBtn: "גלו את המנועים",
      startChatBtn: "התחילו לשוחח",
      docsBtn: "📚 תיעוד",
      statsEngines: "מנועי צ'אט",
      statsProviders: "ספקי שירות",
      statsPossibilities: "אפשרויות",
    },

    home: {
      featuredTitle: "מנועים מובילים",
      featuredSubtitle: "גלו את הכלים הפופולריים והחזקים ביותר שלנו",
      categoriesTitle: "עיינו לפי קטגוריה",
      categoriesSubtitle: "חקרו מנועים מאורגנים לפי ייעודם",
      whyTitle: "למה לבחור ב-Chat Engines?",
      feature1Title: "השתמשו במפתחות שלכם",
      feature1Desc:
        "הביאו את מפתחות ה-API שלכם מכל ספק שירות נתמך. ללא מתווך, ללא עמלות נוספות.",
      feature2Title: "שמירה על פרטיותכם",
      feature2Desc:
        "הנתונים שלכם נשארים בדפדפן. אנחנו לעולם לא שומרים את השיחות או המפתחות שלכם.",
      feature3Title: "גישה מיידית",
      feature3Desc:
        "ללא צורך בהרשמה. התחילו להשתמש במנועים מיד וללא עקומת למידה.",
      feature4Title: "תמיכה רב-לשונית",
      feature4Desc: "תמיכה מלאה באנגלית ובעברית, עם שפות נוספות בקרוב.",
      viewAll: "הצג הכל",
      enginesCount: "{{count}} מנועים",
      howItWorksTitle: "איך זה עובד",
      howItWorksSubtitle: "התחילו להשתמש ב-Chat Engines בשלושה צעדים פשוטים",
      step1Title: "השיגו מפתח",
      step1Desc:
        "הירשמו לאחד מספקי השירות הנתמכים וצרו מפתח. לוקח פחות משתי דקות.",
      step2Title: "בחרו מנוע",
      step2Desc:
        "עיינו באוסף המקיף שלנו של מנועים מתמחים לכתיבה, תכנות, עיצוב, ניתוח ועוד.",
      step3Title: "התחילו ליצור",
      step3Desc:
        "הזינו את המפתח, לחצו על התחל והתחילו לעבוד עם העוזר שלכם מיד. ללא צורך בהרשמה.",

      capabilitiesTitle: "יכולות אינטגרציה חזקות",
      capabilitiesSubtitle: "התחברו לספקי שירות מרובים דרך ממשק אחיד אחד",
      capability1Title: "פיתוח קוד",
      capability1Desc: "צרו, בדקו ושפרו קוד עם עזרה חכמה במגוון שפות תכנות.",
      capability2Title: "כתיבה יצירתית",
      capability2Desc:
        "צרו תוכן מרתק, סיפורים, טקסטים שיווקיים ועוד עם יצירת תוכן מתקדמת.",
      capability3Title: "ניתוח נתונים",
      capability3Desc:
        "הפכו נתונים גולמיים לתובנות מעשיות עם כלי ניתוח ויזואליזציה חכמים.",
      capability4Title: "ניתוח אבטחה",
      capability4Desc:
        "זהו פגיעויות וחזקו את האפליקציות שלכם עם בדיקות אבטחה אוטומטיות.",
      exploreEnginesBtn: "חקרו את כל המנועים",

      ctaTitle: "מוכנים להתחיל?",
      ctaSubtitle:
        "בחרו מתוך יותר מ-100 מנועים מתמחים והתחילו את השיחה שלכם היום.",
      ctaStartBtn: "התחילו את הצ'אט הראשון",
      ctaLearnBtn: "למידע נוסף",
    },

    filters: {
      allProviders: "כל הספקים",
      defaultSort: "סדר ברירת מחדל",
      sortAZ: "א ← ת",
      sortZA: "ת ← א",
      sortCategory: "לפי קטגוריה",
    },

    engineSelection: {
      title: "בחרו מנוע",
      searchPlaceholder: "חיפוש מנועים...",
      noResults: "לא נמצאו מנועים התואמים לחיפוש.",
      all: "הכל",
    },

    apiKeyManager: {
      title: "ניהול המפתחות שלכם",
      description:
        "המפתחות שלכם מאוחסנים באופן מאובטח בדפדפן. ניתן לצפות, לערוך או למחוק אותם בכל עת.",
      noKeys: "עדיין לא נשמרו מפתחות. המפתחות יישמרו עם השימוש הראשון במנוע.",
      clearAll: "🗑️ מחיקת כל המפתחות",
      copySuccess: "המפתח הועתק ללוח!",
      copyFailed: "העתקת המפתח נכשלה",
      clearConfirm: "האם אתם בטוחים שברצונכם למחוק את כל המפתחות השמורים?",
    },

    chatHistory: {
      title: "ניהול היסטוריית השיחות",
      description:
        "השיחות שלכם מאוחסנות מקומית בדפדפן. ניתן להמשיך, לצפות או למחוק אותן בכל עת.",
      noChats: "עדיין אין שיחות שמורות.",
      clearAll: "🗑️ מחיקת כל השיחות",
      resume: "המשך",
      deleteConfirm: "האם אתם בטוחים שברצונכם למחוק שיחה זו?",
      clearConfirm:
        "האם אתם בטוחים שברצונכם למחוק את כל היסטוריית השיחות? פעולה זו אינה ניתנת לביטול.",
    },

    config: {
      title: "הגדרת מנוע",
      provider: "ספק שירות",
      modelVersion: "גרסת מודל",
      apiKey: "מפתח API",
      apiKeyPlaceholder: "הזינו את מפתח ה-API",
      apiKeyNote: "מפתח ה-API משמש רק להפעלה הנוכחית ואינו נשמר בשרתים שלנו.",
      externalApis: "🔌 חיבורים חיצוניים (אופציונלי)",
      externalApisHelp: "חברו שירותים חיצוניים לשיפור יכולות המנוע",
      startSession: "התחלת הפעלה",
      cancel: "ביטול",
    },

    modal: {
      textModel: "מודל טקסט (ספק AI)",
      imageModel: "מודל יצירת תמונות",
      videoModel: "מודל יצירת וידאו",
      audioModel: "מודל יצירת אודיו",
      additionalServices: "שירותים נוספים (אופציונלי)",
      provider: "ספק AI",
      modelVersion: "גרסת מודל",
      selectModel: "בחר מודל",
      apiKey: "מפתח API",
      apiKeyNote: "מפתח ה-API שלך מאוחסן מקומית בדפדפן שלך לנוחיות.",
      required: "נדרש",
      optional: "אופציונלי",
      watermarkFree: "✓ פלט ללא סימן מים עם גישת API תקינה",
      webSearch: "חיפוש באינטרנט",
      cloudStorage: "אחסון ענן",
      emailService: "שירות דואר אלקטרוני",
      docGen: "יצירת מסמכים",
      cancel: "ביטול",
      startEngine: "הפעל מנוע",
    },

    chat: {
      welcomeMessage:
        "המנוע אותחל! בחר אפשרות מהתפריט או הקלד את הקלט שלך למטה כדי להתחיל.",
      welcomeHint: "בחר אפשרות מהתפריט או הקלד את ההודעה שלך למטה",
      inputPlaceholder: "הקלד את ההודעה שלך...",
      send: "שלח",
      attach: "צרף קובץ",
      attachFile: "צרף קובץ",
      newTab: "לשונית חדשה",
      new: "חדש",
      newChat: "צ'אט חדש",
      closeTab: "סגור לשונית",
      backToEngines: "← חזרה למנועים",
      reconfigure: "⚙️ הגדרות",
      settings: "הגדרות",
      toggleMenu: "החלף תפריט",
      menuTitle: "אפשרויות תפריט",
      clearHistory: "נקה היסטוריה",
      export: "ייצוא",
      chatFiles: "קבצי צ'אט",
      uploaded: "הועלו",
      received: "התקבלו",
      noFilesUploaded: "לא הועלו קבצים",
      noFilesReceived: "לא התקבלו קבצים",
      exportResponse: "ייצוא תגובה",
      explainOptions: "הסבר אפשרויות",
      randomSelection: "בחירה אקראית",
      sidebarTip:
        "טיפ: הקלד בתיבת הקלט, ואז לחץ על אפשרות בתפריט כדי להוסיף הקשר לבחירה שלך.",
      noActiveChats: "אין צ'אטים פעילים",
      inputTip: "הקלד כאן, ואז לחץ על אפשרות בתפריט כדי להוסיף הקשר...",
      defaultEngineName: "שם המנוע",
      exportTxt: "הורד כטקסט",
      exportMd: "הורד כ-Markdown",
      exportHtml: "הורד כ-HTML",
      exportJson: "הורד כ-JSON",
      exportPdf: "הורד כ-PDF",
      exportDocx: "הורד כ-Word",
      exportTxtBtn: "📄 TXT",
      exportMdBtn: "📝 MD",
      exportHtmlBtn: "🌐 HTML",
      exportJsonBtn: "📊 JSON",
      exportPdfBtn: "📑 PDF",
      exportDocxBtn: "📃 DOCX",
    },

    chats: {
      pageTitle: "צ'אטים - Chat Engines",
      metaDescription:
        "Chat Engines - ממשק צ'אט AI מקצועי לשיחות אינטראקטיביות עם ספקי AI מרובים.",
      metaKeywords: "צ'אט, AI, GPT, Claude, Gemini, שיחה, ממשק צ'אט",
      welcomeTitle: "התחל צ'אט חדש",
      welcomeSubtitle: "בחר מנוע למטה כדי להתחיל את השיחה עם הבינה המלאכותית",
      recentChats: "צ'אטים אחרונים",
      noRecentChats: "אין צ'אטים אחרונים עדיין",
      resumeChat: "המשך את הצ'אט הזה",
      continueChat: "המשך צ'אט",
      historyManagerTitle: "היסטוריית צ'אטים",
      exportAll: "ייצוא הכל",
      exportAllAria: "ייצוא כל השיחות",
      clearAll: "מחיקת הכל",
      clearAllAria: "מחיקת כל היסטוריית הצ'אטים לצמיתות",
      noHistory:
        "אין היסטוריית צ'אטים עדיין. התחילו שיחה כדי לראות את ההיסטוריה שלכם כאן.",
      messages: "הודעות",
    },

    apiKeyError: {
      title: "מפתח API לא תקין",
      message:
        "מפתח ה-API שלך נדחה על ידי ספק השירות. הוא הוסר מהמפתחות השמורים שלך.",
      provider: "ספק:",
      enterNewKey: "הזן מפתח API תקין:",
      keyPlaceholder: "הדבק את מפתח ה-API שלך כאן...",
      keyHint: "קבל את מפתח ה-API שלך מלוח הבקרה של הספק",
      retry: "נסה שוב עם מפתח חדש",
      enterKey: "נא להזין מפתח API",
      unknownProvider: "לא ניתן לקבוע את הספק",
      keySaved: "מפתח ה-API נשמר. נסה את הפעולה שלך שוב.",
      getGeminiKey: "🔑 קבל מפתח Gemini",
      getOpenaiKey: "🔑 קבל מפתח OpenAI",
      getAnthropicKey: "🔑 קבל מפתח Anthropic",
    },

    footer: {
      tagline: "כלים מקצועיים לכל צורך.",
      product: "מוצר",
      company: "חברה",
      legal: "משפטי",
      aboutUs: "אודותינו",
      privacyPolicy: "מדיניות פרטיות",
      termsOfService: "תנאי שימוש",
      copyright: `© {{year}} ${author}. כל הזכויות שמורות.`,
    },

    privacy: {
      pageTitle: "מדיניות פרטיות - Chat Engines",
      title: "מדיניות פרטיות",
      section1Title: "1. מבוא והיקף",
      section1Text1:
        'Chat Engines ("אנחנו", "שלנו", "אותנו", או "הפלטפורמה") פועלת כאפליקציית אינטרנט חינמית ופתוחה המספקת ממשקי משתמש לאינטראקציה עם שירותי צ\'אט של צד שלישי. מדיניות פרטיות זו מסדירה את איסוף, שימוש, גילוי והגנה על מידע כאשר אתה ניגש או משתמש בפלטפורמה שלנו.',
      section1Text2:
        'הודעה חשובה: Chat Engines פועלת במודל "הבא את המפתח שלך" (BYOK). אתה מספק מפתחות API משלך מספקי שירות. אנחנו לא מעבדים תשלומים, שומרים פרטי חיוב, או בעלי גישה למפתחות ה-API שלך מעבר לזמן גלישתך באתר.',
      section2Title: "2. מודל השירות ועיבוד נתונים",
      section2Item1:
        "Chat Engines מסופקת ללא תשלום. לא נדרשת הרשמה, מנוי או תשלום לשימוש בפלטפורמה.",
      section2Item2:
        "אתה אחראי באופן בלעדי להשגה וניהול מפתחות ה-API שלך מספקי AI נתמכים.",
      section2Item3:
        "כל העלויות הקשורות לשימוש ב-API של AI נגרמות ישירות בינך לבין ספק ה-AI שבחרת.",
      section2Item4:
        "אנחנו משמשים אך ורק כממשק טכני ולא מתווכים, מנטרים או שומרים את התקשורת שלך עם ספקי AI.",
      section3Title: "3. איסוף מידע",
      section3_1Title: "3.1 מידע שאתה מספק מרצון",
      section3_1Item1:
        "מפתחות API: מוזנים רק בפגישת הדפדפן שלך; מועברים ישירות לספקי AI; לעולם לא נשמרים בשרתים שלנו.",
      section3_1Item2:
        "תוכן משתמש: הודעות, פרומפטים וקבצים שנשלחים מעובדים באופן זמני ומועברים לספק ה-AI שבחרת בזמן אמת.",
      section3_1Item3:
        "פרטי קשר: אם תיצור איתנו קשר דרך טופס יצירת קשר, אנו עשויים לקבל את שמך, כתובת האימייל ותוכן ההודעה.",
      section3_2Title: "3.2 מידע שנאסף אוטומטית",
      section3_2Item1:
        "אחסון מקומי: העדפות נושא והיסטוריית צ'אט נשמרות אך ורק באחסון המקומי של הדפדפן שלך ואינן מועברות לשרתים שלנו.",
      section3_2Item2:
        "לוגים של שרת: לוגי שרת אינטרנט סטנדרטיים עשויים לתעד כתובות IP, חותמות זמן ומטא-נתונים של בקשות למטרות אבטחה ואבחון.",
      section4Title: "4. מטרות ובסיס משפטי לעיבוד",
      section4Item1: "לספק ולתחזק את פונקציונליות הפלטפורמה",
      section4Item2: "להקל על התקשורת בין הדפדפן שלך לספקי AI צד שלישי",
      section4Item3: "לענות לפניות תמיכה ותקשורת",
      section4Item4: "לזהות, למנוע ולטפל בבעיות טכניות ואיומי אבטחה",
      section4Item5: "לציית לחובות משפטיות כאשר הדבר רלוונטי",
      section5Title: "5. שמירת נתונים ואחסון",
      section5_1Title: "5.1 נתונים שאנחנו לא שומרים",
      section5_1Item1:
        "מפתחות API לעולם לא נשמרים מעבר לפגישת הדפדפן הפעילה שלך",
      section5_1Item2:
        "שיחות צ'אט ואינטראקציות AI אינן מתועדות או נשמרות בשרתים שלנו",
      section5_1Item3:
        "קבצים שהועלו מעובדים בזיכרון נדיף ואינם נכתבים לאחסון קבוע",
      section5_2Title: "5.2 אחסון בצד הלקוח",
      section5_2Item1:
        "היסטוריית שיחות עשויה להישמר באחסון המקומי של הדפדפן שלך לנוחיותך",
      section5_2Item2: "העדפות ממשק משתמש נשמרות באופן מקומי בדפדפן שלך",
      section5_2Item3:
        'אתה יכול לנקות את כל הנתונים המאוחסנים באופן מקומי בכל עת דרך הגדרות הדפדפן או פונקציית "נקה היסטוריה" של הפלטפורמה',
      section5_3Title: "5.3 אמצעי אבטחה",
      section5_3Text: "אנו מיישמים אמצעי אבטחה סטנדרטיים בתעשייה כולל:",
      section5_3Item1:
        "הצפנת TLS/HTTPS לכל הנתונים המועברים בין הדפדפן שלך לשרתים שלנו",
      section5_3Item2:
        "כותרות אבטחה והגנות מפני פגיעויות אינטרנט נפוצות (XSS, CSRF וכו')",
      section5_3Item3: "הערכות אבטחה ועדכונים שוטפים",
      section6Title: "6. שירותי צד שלישי והעברות נתונים",
      section6Text:
        "כאשר אתה משתמש ב-Chat Engines, הנתונים שלך מועברים ומעובדים על ידי ספק השירות שבחרת. השימוש שלך בשירותים אלה כפוף למדיניות הפרטיות שלהם:",
      section7Title: "7. עוגיות וטכנולוגיות מעקב",
      section7Text:
        "Chat Engines לא משתמש בעוגיות או טכנולוגיות מעקב של צד שלישי. אנו משתמשים באחסון מקומי בדפדפן אך ורק לפונקציונליות בצד הלקוח. שום נתונים מאחסון מקומי אינם מועברים לשרתים שלנו או משותפים עם צדדים שלישיים.",
      section8Title: "8. הזכויות והבחירות שלך",
      section8Text: "בהתאם לתחום השיפוט שלך, ייתכן שיש לך את הזכויות הבאות:",
      section8Item1: "זכות גישה: לבקש מידע על נתונים שעשויים להיות לנו עליך",
      section8Item2: "זכות מחיקה: לבקש מחיקה של כל נתון אישי ברשותנו",
      section8Item3: "זכות נסיגה: להפסיק להשתמש בפלטפורמה בכל עת",
      section8Item4:
        "זכות ניידות נתונים: לייצא את הנתונים המאוחסנים באופן מקומי דרך כלי הדפדפן",
      section9Title: "9. פרטיות ילדים",
      section9Text:
        "הפלטפורמה אינה מיועדת לשימוש על ידי אנשים מתחת לגיל 13 (או גיל ההסכמה הדיגיטלי החל בתחום השיפוט שלך). אם אתה מאמין שילד סיפק מידע אישי דרכינו, אנא צור קשר עם ספקי ה-AI עצמם.",
      section10Title: "10. עדכוני מדיניות",
      section10Text:
        "מדיניות פרטיות זו עשויה להיות מעודכנת מעת לעת. שינויים מהותיים ישתקפו בגרסה מעודכנת של מדיניות זו שתפורסם בפלטפורמה. המשך השימוש שלך בפלטפורמה לאחר שינויים מהווה קבלה של שינויים אלה.",
      section11Title: "11. פרטי קשר",
      section11Text:
        "לפניות, בקשות או תלונות הקשורות לפרטיות, אנא צור איתנו קשר דרך:",
      visitOur: "בקר ב",
      important: "חשוב:",
      subjectTo: "בכפוף ל",
    },

    terms: {
      pageTitle: "תנאי שימוש - Chat Engines",
      title: "תנאי שימוש",
      section1Title: "1. הסכמה לתנאים",
      section1Text:
        'על ידי גישה, גלישה או שימוש ב-Chat Engines ("הפלטפורמה" או "השירות"), אתה מאשר שקראת, הבנת ומסכים להיות כפוף לתנאי שימוש אלה ("התנאים"). אם אינך מסכים לתנאים אלה, עליך להפסיק מיד את השימוש בפלטפורמה.',
      section2Title: "2. תיאור השירות",
      section2Text:
        'Chat Engines היא פלטפורמת תוכנה מבוססת אינטרנט חינמית המספקת ממשקי משתמש ("מנועים") לאינטראקציה עם שירותי צ\'אט של צד שלישי המסופקים על ידי Google (Gemini), OpenAI (GPT) ו-Anthropic (Claude). הפלטפורמה פועלת במודל "הבא את המפתח שלך" (BYOK), ותומכת בספקי שירות באמצעות מפתחות API.',
      section3Title: "3. מודל שירות ללא עלות",
      section3Item1:
        "הפלטפורמה מסופקת ללא תשלום. לא נדרש תשלום, מנוי או הרשמה.",
      section3Item2:
        "עליך להשיג ולספק מפתחות API תקפים משלך מספקי AI נתמכים כדי לנצל את הפונקציונליות של הפלטפורמה.",
      section3Item3:
        "כל החיובים עבור שימוש ב-API של AI נגרמים ישירות בינך לבין ספק ה-AI שבחרת. אין לנו מעורבות ואיננו נושאים באחריות לחיובים כאלה.",
      section3Item4:
        "איננו עושים כל הצהרות או אחריות לגבי תמחור, זמינות או תנאי שירותי AI של צד שלישי.",
      section4Title: "4. התחייבויות ואחריות משתמש",
      section4_1Title: "4.1 ניהול מפתחות API",
      section4_1Item1:
        "אתה אחראי באופן בלעדי להשגה, אבטחה וניהול מפתחות ה-API שלך",
      section4_1Item2:
        "אתה נושא באחריות מלאה לכל השימוש והחיובים שנגרמו דרך מפתחות ה-API שלך",
      section4_1Item3:
        "עליך לשמור על סודיות מפתחות ה-API שלך ולא לחשוף אותם לצדדים לא מורשים",
      section4_1Item4: "עליך לציית לכל תנאי השימוש החלים של ספקי ה-AI שבחרת",
      section4_2Title: "4.2 התנהגות אסורה",
      section4_2Text: "אתה מסכים לא להשתמש בפלטפורמה לכל מטרה ש:",
      section4_2Item1: "מפרה כל חוק או תקנה מקומי, לאומי או בינלאומי החל",
      section4_2Item2:
        "יוצרת, מפיצה או מקלה על תוכן בלתי חוקי, מזיק, מאיים, פוגעני, משמיץ או מתועב בכל דרך אחרת",
      section4_2Item3:
        "פוגעת בזכויות קניין רוחני, זכויות פרטיות או זכויות אחרות של כל צד שלישי",
      section4_2Item4: "מהווה הטרדה, אפליה או פגיעה בכל אדם או קבוצה",
      section4_2Item5:
        "מנסה לעקוף, להשבית או להפריע לתכונות אבטחה של הפלטפורמה",
      section4_2Item6:
        "משתמשת במערכות אוטומטיות, בוטים או סקריפטים לגישה או העמסה על הפלטפורמה",
      section4_2Item7: "מפרה את מדיניות השימוש המקובל של כל ספק AI משולב",
      section4_2Item8: "כוללת הנדסה לאחור, דקומפילציה או חילוץ קוד מקור",
      section4_2Item9: "כוללת העתקה, שכפול או הפצה מחדש לא מורשית של הפלטפורמה",
      section5Title: "5. זכויות קניין רוחני",
      section5_1Title: "5.1 בעלות על הפלטפורמה",
      section5_1Text:
        "הפלטפורמה, כולל כל קוד המקור, אלגוריתמים, עיצובים, גרפיקה, ממשקי משתמש ותיעוד, הם קניין רוחני בלעדי של ירון כורש. כל הזכויות שלא ניתנו במפורש כאן שמורות.",
      section5_2Title: "5.2 תוכן משתמש",
      section5_2Text:
        "אתה שומר על כל זכויות הבעלות בתוכן שאתה מזין לפלטפורמה. על ידי שימוש בפלטפורמה, אתה מעניק לנו רישיון מוגבל ולא בלעדי לעבד את התוכן שלך אך ורק כנדרש לספק את השירות.",
      section5_3Title: "5.3 פלט שנוצר על ידי AI",
      section5_3Text:
        "בעלות וזכויות שימוש בתוכן שנוצר על ידי AI כפופות לתנאי ספק ה-AI שבחרת. אתה אחראי לעיין ולציית לתנאים אלה.",
      section5_4Title: "5.4 הגבלות",
      section5_4Text: "ללא הרשאה כתובה מראש, אסור לך:",
      section5_4Item1: "להעתיק, לשכפל, להפיץ או ליצור יצירות נגזרות מהפלטפורמה",
      section5_4Item2: "להנדס לאחור, לפרק, לפרק או לנסות להפיק את קוד המקור",
      section5_4Item3:
        "לשנות, לתרגם, להתאים או ליצור יצירות נגזרות המבוססות על הפלטפורמה",
      section5_4Item4:
        "למכור, לרישיון, לרישיון משנה, להשכיר, להחכיר או להעביר גישה לפלטפורמה",
      section5_4Item5: "להסיר, לשנות או להסתיר הודעות קנייניות או ייחוסים",
      section6Title: "6. הצהרות ואחריות",
      section6_1Title: '6.1 אספקה "כפי שהיא"',
      section6_1Text:
        'הפלטפורמה מסופקת על בסיס "כפי שהיא" ו"כפי שזמינה" ללא אחריות מכל סוג שהוא, בין אם מפורשת, משתמעת, חוקית או אחרת, כולל אך לא מוגבל לאחריות לסחירות, התאמה למטרה מסוימת, בעלות ואי-הפרה.',
      section6_2Title: "6.2 הצהרת פלט AI",
      section6_2Text:
        "תוכן שנוצר על ידי AI עשוי להיות לא מדויק, לא שלם, מוטה או לא הולם. אין לנו שליטה על פלטי AI ואיננו עושים כל הצהרות לגבי דיוקם, אמינותם או התאמתם. אתה אחראי באופן בלעדי לסקירה ואימות כל התוכן שנוצר על ידי AI לפני השימוש.",
      section6_3Title: "6.3 שירותי צד שלישי",
      section6_3Text:
        "איננו אחראים לזמינות, ביצועים, דיוק, מדיניות או פרקטיקות של ספקי AI צד שלישי. כל הפרעה, שינוי או סיום של שירותי צד שלישי הם מעבר לשליטתנו.",
      section7Title: "7. הגבלת אחריות",
      section7Text:
        "במידה המרבית המותרת על פי החוק החל, בשום מקרה CHAT ENGINES, היוצר שלה, שותפיה או מעניקי הרישיונות שלה לא יהיו אחראים ל:",
      section7Item1: "כל נזק עקיף, מקרי, מיוחד, תוצאתי, עונשי או הרתעתי",
      section7Item2:
        "אובדן רווחים, הכנסות, נתונים, מוניטין או הזדמנויות עסקיות",
      section7Item3: "פגיעה אישית או נזק לרכוש הנובעים מהשימוש שלך בפלטפורמה",
      section7Item4:
        "כל נזק הנובע מפעולות, מדיניות או הפרעות שירות של ספקי AI צד שלישי",
      section7Item5:
        "כל חיובים או עמלות API שנגרמו מהשימוש שלך בשירותי צד שלישי",
      section7Item6:
        "כל נזק העולה על הסכום ששילמת לנו (שהוא אפס, מכיוון שהפלטפורמה חינמית)",
      section8Title: "8. שיפוי",
      section8Text:
        "אתה מסכים להגן, לשפות ולהחזיק את Chat Engines, היוצר שלה והנושאים במשרה, דירקטורים, עובדים וסוכנים שלהם בטוחים מכל תביעות, נזקים, התחייבויות, הפסדים, חבויות, עלויות והוצאות הנובעות מ:",
      section8Item1: "גישתך או שימושך בפלטפורמה",
      section8Item2: "הפרה שלך של תנאים אלה",
      section8Item3: "הפרה שלך של כל חוק או תקנה החל",
      section8Item4: "הפרה שלך של כל זכויות צד שלישי, כולל זכויות קניין רוחני",
      section8Item5: "כל תוכן שאתה מזין, יוצר או מפיץ דרך הפלטפורמה",
      section9Title: "9. שינויים בשירות וסיום",
      section9Text:
        "אנו שומרים לעצמנו את הזכות, לפי שיקול דעתנו הבלעדי, לשנות, להשעות או להפסיק את הפלטפורמה או כל חלק ממנה, באופן זמני או קבוע, בכל עת וללא הודעה מוקדמת. לא נהיה אחראים כלפיך או כלפי צד שלישי עבור כל שינוי, השעיה או הפסקה כזו.",
      section10Title: "10. תיקונים לתנאים",
      section10Text:
        "תנאים אלה עשויים להיות מעודכנים מעת לעת. שינויים מהותיים ישתקפו בגרסה מעודכנת שתפורסם בפלטפורמה. המשך השימוש שלך בפלטפורמה לאחר שינויים מהווה קבלה מחייבת של שינויים אלה. באחריותך לעיין בתנאים אלה מעת לעת.",
      section11Title: "11. דין חל וסמכות שיפוט",
      section11Text:
        "תנאים אלה יפורשו ויחולו בהתאם לחוקי מדינת ישראל, מבלי להתייחס לעקרונות ברירת דין. כל מחלוקת הנובעת מתנאים אלה או הפלטפורמה או הקשורה אליהם תהיה כפופה לסמכות השיפוט הבלעדית של בתי המשפט הממוקמים בישראל.",
      section12Title: "12. הפרדה",
      section12Text:
        "אם הוראה כלשהי בתנאים אלה נמצאת בלתי תקפה, בלתי חוקית או בלתי ניתנת לאכיפה על ידי בית משפט בעל סמכות, חוסר תוקף זה לא ישפיע על תוקף יתר ההוראות, שיישארו בתוקף מלא.",
      section13Title: "13. הסכם שלם",
      section13Text:
        "תנאים אלה, יחד עם מדיניות הפרטיות שלנו, מהווים את ההסכם השלם בינך לבין Chat Engines לגבי השימוש שלך בפלטפורמה ומחליפים את כל ההבנות, ההסכמים, ההצהרות והאחריות הקודמים או המקבילים.",
      section14Title: "14. פרטי קשר",
      section14Text:
        "לשאלות, דאגות או הודעות בנוגע לתנאים אלה, אנא צור איתנו קשר דרך:",
      visitOur: "בקר ב",
    },

    common: {
      loading: "טוען...",
      error: "שגיאה",
      success: "הצלחה",
      close: "סגור",
      save: "שמור",
      delete: "מחק",
      copy: "העתק",
      toggleTheme: "החלף ערכת נושא",
      selectLanguage: "בחר שפה",
      siteName: "Chat Engines",
      logoAlt: "לוגו Chat Engines",
      pageTitle: "Chat Engines - פלטפורמת כלים מקצועיים",
      metaDescription:
        "Chat Engines - פלטפורמה מקיפה של מנועים התומכים בשירותים מגוונים ליצירת תוכן, פיתוח, ניתוח אבטחה ועוד.",
      metaKeywords:
        "מנועי צ'אט, GPT, Claude, Gemini, יצירת תוכן, בדיקת קוד, אבטחה, ספקי שירות",
      openMenu: "פתח תפריט",
      closeMenu: "סגור תפריט",
      readyToStart: "מוכן להתחיל?",
      getStartedFree: "התחל בחינם",
      exploreEngines: "גלה מנועים",
      learnMore: "למידע נוסף",
      viewAll: "הצג הכל",
      backToHome: "חזרה לדף הבית",
    },

    providers: {
      gemini: "Google Gemini",
      openai: "OpenAI GPT",
      anthropic: "Anthropic Claude",
      mock: "Mock (בדיקות)",
    },

    categories: {
      audio: { name: "אודיו", description: "הנדסת סאונד, מוזיקה, פודקאסטים" },
      video: { name: "וידאו", description: "תוכן וידאו והפקה" },
      communication: { name: "תקשורת", description: "כתיבה והודעות" },
      writing: { name: "כתיבה", description: "יצירת תוכן וקופירייטינג" },
      business: { name: "עסקים", description: "מסמכים עסקיים ואסטרטגיה" },
      creative: { name: "יצירתי", description: "אמנות יצירתית ומיתוג" },
      development: { name: "פיתוח", description: "פיתוח תוכנה" },
      data: { name: "נתונים", description: "ניתוח נתונים ותובנות" },
      design: { name: "עיצוב", description: "עיצוב UI/UX ויזואלי" },
      health: { name: "בריאות", description: "בריאות ואורח חיים" },
      security: { name: "אבטחה", description: "ניתוח אבטחה וסריקת פגיעויות" },
      education: {
        name: "חינוך",
        description: "למידה, קורסים ופיתוח מיומנויות",
      },
      marketing: { name: "שיווק", description: "אסטרטגיית שיווק וקמפיינים" },
      legal: { name: "משפטי", description: "מסמכים משפטיים ותאימות" },
      finance: { name: "פיננסים", description: "תכנון פיננסי וניתוח" },
    },

    engines: {
      "audio-mastering-engineer": {
        name: "מהנדס מאסטרינג",
        description: "השג איכות שמע מקצועית ואורגנית",
      },
      "music-composer": {
        name: "מלחין מוזיקה",
        description: "פתח מבני שירים ואקורדים",
      },
      "podcast-producer": {
        name: "מפיק פודקאסט",
        description: "תכנון פרקי פודקאסט מקצועיים",
      },
      "voiceover-scriptwriter": {
        name: "כותב קריינות",
        description: "תסריטי קריינות טבעיים למדיות שונות",
      },

      "documentary-architect": {
        name: "אדריכל דוקומנטרי",
        description: "בנה נרטיבים מרתקים לסרטים תיעודיים",
      },
      "shortform-creator": {
        name: "יוצר סרטונים קצרים",
        description: "צור קונספטים ויראליים לסרטונים קצרים",
      },
      "video-ad-scripter": {
        name: "כותב פרסומות וידאו",
        description: "תסריטים דינמיים לפרסומות",
      },
      "video-prompt-engineer": {
        name: "מהנדס פרומפטים לוידאו",
        description: "פרומפטים מפורטים ליצירת וידאו AI",
      },
      "video-scene-continuity": {
        name: "המשכיות סצנות",
        description: "תיאורי סצנות קונטקסטואליים",
      },
      "youtube-strategist": {
        name: "אסטרטג יוטיוב",
        description: "אסטרטגיות צמיחה וקונספטים ויראליים",
      },

      "blog-post-strategist": {
        name: "אסטרטג בלוג",
        description: "פוסטים מרתקים לבניית מותג",
      },
      "customer-service-response": {
        name: "תגובות שירות לקוחות",
        description: "תגובות מקצועיות וחמות",
      },
      "cv-architect": {
        name: "בונה קורות חיים",
        description: "קורות חיים HTML מרשימים",
      },
      "legal-email-evidence-purifier": {
        name: "מטהר אימיילים משפטיים",
        description: "אימיילים קבילים לבית משפט",
      },
      "prompt-engineer": {
        name: "מהנדס פרומפטים",
        description: "פרומפטים מובנים ואיכותיים",
      },
      "social-media-copywriter": {
        name: "קופירייטר רשתות חברתיות",
        description: "פוסטים משפיעים לרשתות",
      },
      "speech-writer": {
        name: "כותב נאומים",
        description: "נאומים ומצגות מעוררי השראה",
      },
      "whatsapp-message-composer": {
        name: "מחבר הודעות ווטסאפ",
        description: "הודעות אפקטיביות וברורות",
      },

      "newsletter-editor": {
        name: "עורך ניוזלטר",
        description: "ניוזלטרים מרתקים באימייל",
      },
      "persuasive-copywriter": {
        name: "קופירייטר שכנועי",
        description: "טקסטים שיווקיים ממירים",
      },
      "technical-writer": {
        name: "כותב טכני",
        description: "תיעוד טכני ברור ומקיף",
      },

      "business-plan-builder": {
        name: "בונה תוכניות עסקיות",
        description: "תוכניות עסקיות למשקיעים",
      },
      "contract-drafter": {
        name: "מנסח חוזים",
        description: "ניסוח וסקירת חוזים עסקיים",
      },
      "meeting-minutes": {
        name: "פרוטוקול ישיבות",
        description: "סיכום ישיבות מובנה",
      },
      "pitch-deck-creator": {
        name: "יוצר מצגות פיץ'",
        description: "מצגות משכנעות למשקיעים",
      },
      "presentation-designer": {
        name: "מעצב מצגות",
        description: "מצגות ויזואליות מרשימות",
      },
      "project-manager": {
        name: "מנהל פרויקטים",
        description: "תכנון ומעקב פרויקטים",
      },

      "brand-namer": {
        name: "ממציא שמות מותגים",
        description: "שמות מותגים יצירתיים וזכירים",
      },
      "image-prompt-engineer": {
        name: "מהנדס פרומפטים לתמונות",
        description: "פרומפטים ליצירת תמונות AI",
      },
      "parody-creator": {
        name: "יוצר פרודיות",
        description: "יצירות סאטיריות מצוינות",
      },
      "song-writer": {
        name: "כותב שירים",
        description: "שירים רגשיים ועוצמתיים",
      },
      "story-writer": {
        name: "כותב סיפורים",
        description: "כתיבת ספרים פרק אחר פרק",
      },

      "api-designer": {
        name: "מעצב API",
        description: "עיצוב ממשקי API ידידותיים",
      },
      "bug-fix-surgeon": {
        name: "מנתח באגים",
        description: "אבחון ותיקון באגים בדיוק",
      },
      "changelog-driven-developer": {
        name: "מפתח מונחה changelog",
        description: "פיתוח לפי CHANGELOG.md",
      },
      "changelog-formatter": {
        name: "מעצב changelog",
        description: "תקנון קבצי CHANGELOG.md",
      },
      "code-explainer": {
        name: "מסביר קוד",
        description: "הסברת קוד מורכב בפשטות",
      },
      "code-reviewer": { name: "סוקר קוד", description: "סקירות קוד מקיפות" },
      "code-translator": {
        name: "מתרגם קוד",
        description: "המרת קוד בין שפות",
      },
      "codebase-refactorer": {
        name: "ממבנה מחדש קוד",
        description: "שיפור איכות קוד שיטתי",
      },
      "color-palette-generator": {
        name: "מחולל פלטת צבעים",
        description: "פלטות צבעים לממשק משתמש",
      },
      "database-designer": {
        name: "מעצב מסדי נתונים",
        description: "עיצוב סכמות מסדי נתונים",
      },
      "dataset-generator": {
        name: "מחולל מערכי נתונים",
        description: "מערכי נתונים איכותיים ל-ML/AI",
      },
      "git-assistant": { name: "עוזר Git", description: "עזרה בפעולות Git" },
      "product-formulator": {
        name: "מנסח מוצרים",
        description: "מידע מוצר מקצועי",
      },
      "product-requirements": {
        name: "דרישות מוצר",
        description: "מסמכי דרישות מוצר מקיפים",
      },
      "regex-engineer": {
        name: "מהנדס Regex",
        description: "יצירה ואופטימיזציה של ביטויים רגולריים",
      },
      "software-gap-analyzer": {
        name: "מנתח פערי תוכנה",
        description: "קונספטים חדשניים לתוכנה",
      },
      "system-architect": {
        name: "אדריכל מערכות",
        description: "עיצוב ארכיטקטורות סקיילבליות",
      },
      "technical-product-analyst": {
        name: "אנליסט מוצר טכני",
        description: "ניתוח מוצרים טכני",
      },
      "test-generator": {
        name: "מחולל בדיקות",
        description: "סוויטות בדיקות מקיפות",
      },

      "data-analyst": {
        name: "אנליסט נתונים",
        description: "הפיכת נתונים לתובנות",
      },
      "deep-researcher": {
        name: "חוקר מעמיק",
        description: "מחקר מקיף עם ציטוטים",
      },

      "design-system-architect": {
        name: "אדריכל מערכות עיצוב",
        description: "מערכות עיצוב מקיפות",
      },
      "user-persona-creator": {
        name: "יוצר פרסונות משתמש",
        description: "פרסונות מבוססות מחקר",
      },
      "ux-designer": { name: "מעצב UX", description: "עיצובים ממוקדי משתמש" },

      "fitness-planner": {
        name: "מתכנן כושר",
        description: "תוכניות אימון מותאמות אישית",
      },
      "lifestyle-recovery-planner": {
        name: "מתכנן שיקום אורח חיים",
        description: "תוכניות שיפור בריאות",
      },
      "meal-planner": {
        name: "מתכנן ארוחות",
        description: "תפריטים מאוזנים ובריאים",
      },

      "pentest-planner": {
        name: "מתכנן בדיקות חדירה",
        description: "תכנון בדיקות אבטחה",
      },
      "security-hardening": {
        name: "הקשחת אבטחה",
        description: "מדריכי הקשחת אבטחה",
      },
      "threat-modeling": {
        name: "מידול איומים",
        description: "זיהוי ותעדוף סיכוני אבטחה",
      },
      "vulnerability-scanner": {
        name: "סורק פגיעויות",
        description: "ניתוח אבטחה מעמיק",
      },

      "course-builder": {
        name: "בונה קורסים",
        description: "יצירת תוכן חינוכי",
      },
      "interview-coach": {
        name: "מאמן ראיונות",
        description: "הכנה לראיונות עבודה",
      },
      "language-tutor": { name: "מורה שפות", description: "לימוד שפות חדשות" },

      "email-campaign-builder": {
        name: "בונה קמפייני אימייל",
        description: "קמפייני אימייל ממירים",
      },
      "marketing-strategist": {
        name: "אסטרטג שיווק",
        description: "אסטרטגיות שיווק מקיפות",
      },
      "seo-optimizer": {
        name: "מומחה SEO",
        description: "אופטימיזציה למנועי חיפוש",
      },

      "legal-document-drafter": {
        name: "מנסח מסמכים משפטיים",
        description: "ניסוח מסמכים משפטיים",
      },

      "budget-planner": {
        name: "מתכנן תקציב",
        description: "תכנון תקציב וניהול הוצאות",
      },
    },

    about: {
      pageTitle: "אודות - Chat Engines",
      title: "אודות Chat Engines",
      subtitle: "מעצימים יצירתיות ופרודוקטיביות באמצעות מנועי בינה מלאכותית",
      mission: "החזון שלנו",
      missionText:
        "אנו מאמינים שמנועי בינה מלאכותית צריכים להיות נגישים לכולם. Chat Engines מספקת פלטפורמה מאוחדת לניצול העוצמה של מגוון ספקי שירות דרך ממשק אחד ואינטואיטיבי.",
      missionText2:
        "הפלטפורמה שלנו מאגדת את מנועי הצ'אט החזקים ביותר ממובילי התעשייה כמו Google, OpenAI ו-Anthropic, עטופים בממשקים אינטואיטיביים וממוקדי משימה שכל אחד יכול להשתמש בהם.",
      features: "תכונות מרכזיות",
      whatMakesUsDifferent: "מה מייחד אותנו",
      multiProvider: "תמיכה במגוון ספקים",
      multiProviderDesc: "גישה ל-GPT, Claude ו-Gemini דרך פלטפורמה אחת",
      specializedEngines: "מנועים ייעודיים",
      specializedEnginesDesc: "הנחיות מותאמות מראש למשימות מגוונות",
      secureByDesign: "אבטחה מובנית",
      secureByDesignDesc: "מפתחות ה-API שלכם נשארים בדפדפן בלבד",
      freeToUse: "שימוש חינמי",
      freeToUseDesc: "משלמים רק עבור השימוש בספק השירות",
      privacyFirst: "שמירה על פרטיותכם",
      privacyFirstDesc:
        "מפתחות ה-API לעולם לא נשמרים בשרתים שלנו. כל העיבוד מתבצע בזמן אמת, והנתונים נשארים שלכם בלבד.",
      noSetupRequired: "ללא צורך בהתקנה",
      noSetupRequiredDesc:
        "התחילו להשתמש במנועים מיד. ללא התקנה, ללא הגדרות, ללא עקומת למידה. פשוט הביאו את מפתח ה-API והתחילו.",
      engineCount: "יותר מ-40 מנועים ייעודיים",
      engineCountDesc:
        "מסקירת קוד ועד יצירת תוכן, מניתוח אבטחה ועד תובנות נתונים - יש לנו מנועים מותאמים לכל צורך מקצועי.",
      creator: "היוצר",
      creatorName: "ירון כורש",
      creatorBio:
        "מתכנת עם ניסיון רב בכתיבת כלים למפתחים במגוון שפות וניסיון בפיתוח אינטגרציות ועיצוב חוויית משתמש, Chat Engines נוצר כדי לגשר על הפער בין מנועי בינה מלאכותית עוצמתיים לשימושים מעשיים יומיומיים.",
      creatorQuote:
        "טכנולוגיה צריכה לשרת אנשים. אתר Chat Engines מזרז קבלת תוצרים מרשימים למשימות מורכבות או רב-שלביות, בעזרת שימוש תקשורת API מפוצלת למגוון ספקי שירותים רלוונטיים.",
      byTheNumbers: "במספרים",
      statEngines: "מנועים",
      statCategories: "קטגוריות",
      statProviders: "ספקי שירות",
      statPossibilities: "אפשרויות",
      readyToStart: "מוכנים להתחיל?",
      readyToStartText: "התנסו בעוצמה של Chat Engines כבר היום.",
      exploreEngines: "גלו את המנועים",
    },

    pricingPage: {
      pageTitle: "תמחור - Chat Engines",
      title: "תמחור פשוט ושקוף",
      subtitle: "השתמשו במפתחות ה-API שלכם. שלמו רק על מה שאתם משתמשים.",
      free: "חינם",
      freePlatform: "פלטפורמה חינמית",
      platformIsFree: "פלטפורמת Chat Engines חינמית",
      platformIsFreeDesc:
        "אתה משלם רק על שימוש ב-API ישירות לספק ה-AI שבחרת. ללא עמלות נסתרות, ללא מנויים, ללא תוספות מחיר.",
      freeDesc:
        "Chat Engines הוא חינמי לחלוטין לשימוש. אתה משלם רק על מה שאתה משתמש עם ספק השירות שלך.",
      apiProviderCosts: "עלויות ספקי API",
      apiProviderCostsSubtitle:
        "עלויות משוערות ל-1 מיליון טוקנים (כ-750,000 מילים)",
      howItWorks: "איך זה עובד",
      step1: "הבא את מפתחות ה-API שלך",
      step2: "השתמש בכל ספק שירות שאתה מעדיף",
      step3: "שלם ישירות לספק שלך",
      neverCharge: "אנחנו לעולם לא גובים תשלום על השימוש ב-Chat Engines",
      getStarted: "התחל עכשיו",
      viewFullPricing: "צפה בתמחור מלא",
      mostCapable: "המסוגל ביותר",
      realWorldCostExamples: "דוגמאות עלות מהעולם האמיתי",
      writeBlogPost: "כתיבת פוסט בבלוג",
      codeReview: "סקירת קוד (500 שורות)",
      securityScan: "סריקת אבטחה",
      dataAnalysis: "ניתוח נתונים",
      pricingNote:
        "* העלויות משתנות לפי ספק ומודל. ההערכות מבוססות על שימוש טיפוסי עם מודלים בינוניים.",
      whyThisPricingModel: "למה מודל תמחור זה?",
      traditionalSaaS: "SaaS מסורתי",
      monthlySubscriptions: "מנויים חודשיים",
      usageLimits: "מגבלות שימוש",
      markupOnApiCosts: "תוספת מחיר על עלויות API",
      vendorLockIn: "נעילת ספק",
      noSubscriptions: "ללא מנויים",
      unlimitedUsage: "שימוש ללא הגבלה",
      directApiPricing: "תמחור API ישיר",
      switchProvidersAnytime: "החלף ספקים בכל עת",
      startUsingToday: "התחל להשתמש ב-Chat Engines היום",
      noCreditCardRequired:
        "אין צורך בכרטיס אשראי. פשוט הבא את מפתח ה-API שלך.",
      freeFreeTierAvailable: "רמה חינמית זמינה",
      getStartedFree: "התחל בחינם",
      googleGemini: "Google Gemini",
      openAI: "OpenAI",
      anthropicClaude: "Anthropic Claude",
      tokensCount: "טוקנים",
    },

    contactPage: {
      pageTitle: "צור קשר - Chat Engines",
      title: "צור קשר",
      subtitle: "פנה למפתח",
      getInTouch: "צור קשר",
      email: "אימייל",
      location: "מיקום",
      responseTime: "זמן תגובה",
      sendMessage: "שלח הודעה",
      yourName: "השם שלך",
      yourEmail: "האימייל שלך",
      subject: "נושא",
      message: "הודעה",
      send: "שלח הודעה",
      sending: "שולח...",
      successMessage: "ההודעה שלך נשלחה בהצלחה!",
      errorMessage: "שליחת ההודעה נכשלה. אנא נסה שוב.",
      getInTouchText: "יש לך שאלות, משוב או הצעות? אל תהסס לפנות ישירות למפתח.",
      responseTimeLabel: "זמן תגובה",
      responseTimeText: "תוך",
      locationLabel: "מיקום",
      followUs: "עקבו אחרינו",
      sendMessageTitle: "שלח הודעה",
      nameLabel: "שם",
      namePlaceholder: "השם שלך",
      emailLabel: "אימייל",
      emailPlaceholder: "your@email.com",
      subjectLabel: "נושא",
      selectTopic: "בחר נושא",
      generalInquiry: "פנייה כללית",
      technicalSupport: "תמיכה טכנית",
      feedbackOption: "משוב",
      bugReport: "דיווח על באג",
      featureRequest: "בקשת תכונה",
      businessInquiry: "פנייה עסקית",
      messageLabel: "הודעה",
      messagePlaceholder: "איך נוכל לעזור לך?",
      sendMessageBtn: "שלח הודעה",
      errorOccurred: "אירעה שגיאה. אנא נסה שוב.",
      tryAgainBtn: "נסה שוב",
      messageSentTitle: "ההודעה נשלחה!",
      messageSentText: "תודה שפנית אלינו. נחזור אליך בקרוב.",
      commonQuestions: "שאלות נפוצות",
      viewFaq: "צפה בשאלות נפוצות",
      pricingInfoLink: "מידע על תמחור",
    },

    docsPage: {
      pageTitle: "תיעוד - Chat Engines",
      title: "תיעוד",
      subtitle: "כל מה שאתה צריך כדי להתחיל עם Chat Engines",
      gettingStarted: "התחלה",
      gettingStartedDesc: "למד את הבסיס של שימוש ב-Chat Engines",
      apiKeys: "קבל את מפתח ה-API שלך",
      apiKeysDesc: "השג מפתח API מספק ה-AI המועדף עליך",
      engines: "מנועים",
      enginesDesc: "למד על קטגוריות מנועים שונות",
      menuFeature: "תפריט פעולות מהירות",
      menuFeatureDesc:
        "כל מנוע כולל תפריט צד עם פעולות מוגדרות מראש למשימות נפוצות. לחץ על אפשרות כדי לבחור אותה, ואז הוסף הקשר נוסף בשדה הקלט אם רצונך לפני השליחה.",
      selectEngine: "בחר מנוע",
      selectEngineDesc:
        "עיין במנועים המתמחים שלנו המאורגנים לפי קטגוריה. כל מנוע מיועד למשימה מורכבת ספציפית כמו סקירת קוד, כתיבת תוכן, ניתוח אבטחה ועוד.",
      configureStart: "הגדר והתחל",
      configureStartDesc:
        'בחר את ספק ה-AI שלך, בחר גרסת מודל, הזן את מפתח ה-API שלך ולחץ על "הפעל מנוע" כדי להתחיל את הפגישה שלך.',
      interact: "אינטראקציה",
      interactDesc:
        "השתמש באפשרויות התפריט והקלד הודעות מותאמות אישית. צרף קבצים כשצריך לניתוח.",
      featureGuide: "מדריך תכונות",
      multiTabSupport: "תמיכה במספר כרטיסיות",
      multiTabSupportDesc:
        "הפעל מספר מנועים בו-זמנית בכרטיסיות נפרדות. כל כרטיסייה שומרת על הפגישה, היסטוריית השיחה וההקשר שלה. החלף בין כרטיסיות לעבודה מרובת משימות יעילה.",
      fileAttachments: "צירוף קבצים",
      fileAttachmentsDesc: "צרף קבצים לניתוח. הפורמטים הנתמכים כוללים:",
      images: "תמונות",
      imageFormats: "JPG, PNG, GIF, WebP",
      documents: "מסמכים",
      documentFormats: "PDF, TXT, MD, DOC, DOCX",
      code: "קוד",
      codeFormats: "JS, TS, PY, Java, C, C++, Go, Rust ועוד",
      data: "נתונים",
      dataFormats: "JSON, CSV, XML, YAML, קבצי Excel",
      binary: "בינארי",
      binaryFormats: "EXE, DLL, SO, WASM",
      quickActionsMenu: "תפריט פעולות מהירות",
      quickActionsMenuDesc:
        "כל מנוע כולל תפריט צד עם פעולות מוגדרות מראש למשימות נפוצות. פשוט לחץ על כל אפשרות כדי להפעיל אותה, או הקלד בשדה הקלט תחילה כדי להוסיף הקשר משלך.",
      sessionPersistence: "שמירת פגישה",
      sessionPersistenceDesc:
        "היסטוריית הצ'אט שלך נשמרת אוטומטית בדפדפן. חזור להמשיך שיחות קודמות, או נקה היסטוריה כשצריך.",
      darkMode: "מצב כהה",
      darkModeDesc:
        "החלף בין ערכות נושא בהירה וכהה באמצעות כפתור הנושא בכותרת. העדפתך נשמרת לביקורים עתידיים.",
      engineCategories: "קטגוריות מנועים",
      aboutApiKeys: "אודות מפתחות API",
      securityPrivacy: "אבטחה ופרטיות",
      apiKeyNeverStored: "מפתח ה-API שלך לעולם לא נשמר בשרתים שלנו",
      keysOnlyForSession: "מפתחות משמשים רק לפגישה הנוכחית",
      apiCallsDirect: "כל קריאות ה-API מבוצעות ישירות מהשרת שלנו לספקי השירות",
      recommendRateLimits:
        "אנו ממליצים להשתמש במפתחות API עם מגבלות קצב מתאימות",
      monitorUsage: "עקוב אחר השימוש שלך ב-API דרך לוח המחוונים של הספק שלך",
      faq: "שאלות נפוצות",
      faqProvider: "איזה ספק AI עלי לבחור?",
      faqProviderAnswer:
        "לכל ספק יש יתרונות. Gemini חסכוני ומהיר. GPT-4 מצטיין בהסקה מורכבת. Claude מצוין לתגובות מורכבות ובטוחות. נסה ספקים שונים כדי למצוא מה עובד הכי טוב למקרה השימוש שלך.",
      faqWhyOwnKey: "למה אני צריך מפתח API משלי?",
      faqWhyOwnKeyAnswer:
        "שימוש במפתח API משלך נותן לך שליטה מלאה על עלויות, מגבלות שימוש ופרטיות נתונים. אתה משלם רק על מה שאתה משתמש, ישירות לספק שבחרת.",
      faqDataSecure: "האם הנתונים שלי מאובטחים?",
      faqDataSecureAnswer:
        "כן. מפתח ה-API שלך לעולם לא נשמר. השיחות שלך קיימות רק במהלך הפגישה ובאחסון המקומי של הדפדפן. אין לנו גישה לנתונים שלך או למפתחות ה-API שלך.",
      faqCommercial: "האם אני יכול להשתמש ב-Chat Engines מסחרית?",
      faqCommercialAnswer:
        "כן, אבל וודא שאתה עומד בתנאים לגבי שימוש מסחרי אצל ספקי השירות עבור המנוע שבחרת.",

      step1Text: "קבל מפתח API מספק השירות המועדף עליך",
      step2Title: "בחר מנוע",
      step2Text:
        "עיין במנועים המתמחים שלנו המאורגנים לפי קטגוריה. כל מנוע מתוכנן למשימה מורכבת ספציפית.",
      step3Title: "הגדר והתחל",
      step3Text:
        'בחר את ספק השירות שלך, הזן את מפתח ה-API שלך, ולחץ על "הפעל מנוע".',
      step4Title: "אינטראקציה",
      step4Text:
        "השתמש באפשרויות התפריט והקלד הודעות מותאמות אישית. צרף קבצים בעת הצורך לניתוח.",

      featureGuideTitle: "מדריך תכונות",

      engineCategoriesTitle: "קטגוריות מנועים",
      audioCat: "אודיו",
      audioDesc: "מאסטרינג אודיו, הלחנה, הפקת פודקאסטים, תסריטי קריינות",
      videoCat: "וידאו",
      videoDesc: "תכנון דוקומנטרי, תוכן קצר, פרסומות וידאו, המשכיות סצנות",
      communicationCat: "תקשורת",
      communicationDesc:
        "פוסטים בבלוג, שירות לקוחות, יצירת קורות חיים, כתיבת אימייל",
      writingCat: "כתיבה",
      writingDesc: "ניוזלטרים, קופי משכנע, תיעוד טכני",
      businessCat: "עסקים",
      businessDesc: "חוזים, פרוטוקולי ישיבות, מצגות למשקיעים",
      creativeCat: "יצירתי",
      creativeDesc: "מיתוג שמות, יצירת פרודיות, כתיבת שירים, סיפור",
      developmentCat: "פיתוח",
      developmentDesc: "עיצוב API, תיקון באגים, סקירת קוד, ריפקטורינג, בדיקות",
      dataCat: "נתונים",
      dataDesc: "ניתוח נתונים, סינתזת מחקר, הפקת תובנות",
      designCat: "עיצוב",
      designDesc: "מערכות עיצוב, פרסונות משתמש, פלטות צבעים",
      healthCat: "בריאות",
      healthDesc: "תכנון כושר, תכנון ארוחות, אופטימיזציה של אורח חיים",
      securityCat: "אבטחה",
      securityDesc: "סריקת פגיעויות, בדיקות חדירה, מודל איומים",

      faqTitle: "שאלות נפוצות",
    },

    apiGuidePage: {
      pageTitle: "מדריך ספקים - Chat Engines",
      metaDescription:
        "מדריך ספקי שירות של Chat Engines - הוראות מלאות להגדרת ספקי שירות ואינטגרציות.",
      title: "מדריך ספקי שירות",
      subtitle: "הוראות מלאות להגדרת מנועי צ'אט וספקי שירות חיצוניים",
      supportedProviders: "ספקים נתמכים",
      howToGetKey: "כיצד לקבל את המפתח שלך",
      geminiSteps:
        "בקר ב-Google AI Studio, היכנס עם חשבון ה-Google שלך, וצור מפתח.",
      openaiSteps: "בקר בפלטפורמת OpenAI, צור חשבון, וצור מפתח בקטע המפתחות.",
      anthropicSteps: "בקר במסוף Anthropic, צור חשבון, וצור מפתח.",
      securityNote: "הערת אבטחה",
      securityNoteText:
        "המפתחות שלך מאוחסנים מקומית בדפדפן שלך ולעולם לא נשלחים לשרתים שלנו. הם משמשים רק לתקשורת ישירה עם הספק שבחרת.",

      securityTip1: "לעולם אל תשתף מפתחות API בפומבי",
      securityTip2: "אל תשמור מפתחות בריפוזיטורי git",
      securityTip3: "השתמש במשתני סביבה בייצור",
      securityTip4: "החלף מפתחות באופן תקופתי",
      costTip1: "הגדר מגבלות הוצאות בלוחות הבקרה של הספקים",
      costTip2: "עקוב אחר השימוש באופן קבוע",
      costTip3: "השתמש בשכבות החינמיות לבדיקות",
      costTip4: "התחל עם מודלים זולים יותר",
      performanceTip1: "השתמש במודל המתאים לכל משימה",
      performanceTip2: "הפעל מטמון בכל מקום אפשרי",
      performanceTip3: "טפל במגבלות קצב בצורה חלקה",
      performanceTip4: "השתמש בסטרימינג לתגובות ארוכות",

      textEnginesTitle: "🤖 מנועי טקסט",
      textEnginesSubtitle: "מודלים גדולים ליצירת טקסט, הסקה ושיחה",
      imageApisTitle: "🖼️ יצירת תמונות",
      imageApisSubtitle: "צור תמונות מדהימות עם שירותי AI",
      videoApisTitle: "🎬 יצירת וידאו",
      videoApisSubtitle: "הפק תוכן וידאו דינמי עם בינה מלאכותית מתקדמת",
      audioApisTitle: "🎵 אודיו ודיבור",
      audioApisSubtitle: "טקסט לדיבור, דיבור לטקסט ויצירת אודיו",
      searchApisTitle: "🔍 חיפוש באינטרנט",
      searchApisSubtitle: "חפש באינטרנט ואחזר מידע בזמן אמת",
      storageApisTitle: "☁️ אחסון ענן",
      storageApisSubtitle: "אחסן ואחזר קבצים עם ספקי אחסון ענן",
      emailApisTitle: '📧 שירותי דוא"ל',
      emailApisSubtitle: 'שלח הודעות דוא"ל עסקיות ושיווקיות',
      securityApisTitle: "🔐 אבטחה ומודיעין איומים",
      securityApisSubtitle: "סריקת אבטחה, מודיעין איומים וזיהוי פגיעויות",
      documentApisTitle: "📄 יצירת מסמכים",
      documentApisSubtitle: "הפק קבצי PDF, מסמכים ופורמטים נוספים",
      bestPracticesTitle: "🛡️ שיטות עבודה מומלצות למפתחות API",

      navTextEngines: "מנועי טקסט",
      navImageGeneration: "יצירת תמונות",
      navVideoGeneration: "יצירת וידאו",
      navAudioMusic: "אודיו ומוזיקה",
      navWebSearch: "חיפוש באינטרנט",
      navCloudStorage: "אחסון ענן",
      navEmailServices: 'שירותי דוא"ל',
      navSecurityThreat: "אבטחה ומודיעין",
      navDocumentGeneration: "יצירת מסמכים",

      availableModels: "מודלים זמינים",
      pricing: "תמחור",
      features: "תכונות",
      setup: "הגדרה",
      freeTierAvailable: "שכבה חינמית זמינה",
      recommended: "מומלץ",
      mostCapable: "החזק ביותר",
      tip: "טיפ",

      securityCardTitle: "אבטחה",
      costControlCardTitle: "בקרת עלויות",
      performanceCardTitle: "ביצועים",

      readyToStart: "מוכנים להתחיל?",
      ctaSubtitle: "הגדר את ספקי השירות והתחל להשתמש ב-Chat Engines עוד היום.",
      launchChatEngines: "הפעל Chat Engines",

      translationServices: "🌐 שירותי תרגום",
      visionOcrServices: "👁️ שירותי ראייה ו-OCR",
      dataAnalyticsServices: "📊 שירותי נתונים וניתוח",
      messagingServices: "📱 שירותי הודעות ותקשורת",
      authenticationServices: "🔐 שירותי אימות",
      productivityServices: "📝 שירותי פרודוקטיביות",

      providers: {
        gemini: {
          title: "Google Gemini",
          freeTier: "שכבה חינמית זמינה",
          recommended: "מומלץ",
          availableModels: "מודלים זמינים",
          model1Name: "Gemini 2.0 Flash",
          model1Desc: "- העדכני והמהיר ביותר עם שכבה חינמית",
          model2Name: "Gemini 1.5 Pro",
          model2Desc: "- הטוב ביותר למשימות הסקה מורכבות",
          model3Name: "Gemini 1.5 Flash",
          model3Desc: "- מהיר וחסכוני",
          model4Name: "Gemini 1.0 Pro",
          model4Desc: "- יציב ואמין",
          howToGetKey: "כיצד לקבל את מפתח ה-API שלך",
          step1: "בקר ב-",
          step2: "היכנס עם חשבון Google שלך",
          step3: 'לחץ על "Get API Key" בניווט העליון',
          step4: 'לחץ על "Create API Key"',
          step5: "בחר פרויקט Google Cloud (או צור אחד)",
          step6: "העתק את מפתח ה-API והדבק אותו ב-Chat Engines",
          pricingTitle: "תמחור",
          tableModel: "מודל",
          tableInput: "קלט",
          tableOutput: "פלט",
          price1Model: "Gemini 2.0 Flash",
          price1Input: "חינם (עם הגבלות)",
          price1Output: "חינם (עם הגבלות)",
          price2Model: "Gemini 1.5 Pro",
          price2Input: "$1.25 למיליון טוקנים",
          price2Output: "$5.00 למיליון טוקנים",
          price3Model: "Gemini 1.5 Flash",
          price3Input: "$0.075 למיליון טוקנים",
          price3Output: "$0.30 למיליון טוקנים",
          tipLabel: "💡 טיפ:",
          tipText:
            "התחל עם Gemini 2.0 Flash - הוא חינמי לרוב השימושים ומציע ביצועים מצוינים.",
        },
        openai: {
          title: "OpenAI GPT",
          badge: "החזק ביותר",
          availableModels: "מודלים זמינים",
          model1Name: "GPT-4 Turbo",
          model1Desc: "- החזק ביותר, הטוב ביותר למשימות מורכבות",
          model2Name: "GPT-4o",
          model2Desc: "- GPT-4 מותאם, תגובות מהירות יותר",
          model3Name: "GPT-4o Mini",
          model3Desc: "- חסכוני, מצוין לרוב המשימות",
          model4Name: "GPT-4",
          model4Desc: "- GPT-4 המקורי, מאוד מסוגל",
          model5Name: "GPT-3.5 Turbo",
          model5Desc: "- מהיר ומשתלם",
          howToGetKey: "כיצד לקבל את מפתח ה-API שלך",
          step1: "בקר ב-",
          step2: "הירשם או התחבר לחשבון שלך",
          step3: "נווט אל",
          step3Link: "מפתחות API",
          step4: 'לחץ על "Create new secret key"',
          step5: 'תן למפתח שם (למשל, "Chat Engines")',
          step6: "העתק את המפתח מיד (הוא לא יוצג שוב)",
          step7: "הוסף אמצעי תשלום בהגדרות החיוב",
          pricingTitle: "תמחור",
          tableModel: "מודל",
          tableInput: "קלט",
          tableOutput: "פלט",
          price1Model: "GPT-4 Turbo",
          price1Input: "$10.00 למיליון טוקנים",
          price1Output: "$30.00 למיליון טוקנים",
          price2Model: "GPT-4o",
          price2Input: "$2.50 למיליון טוקנים",
          price2Output: "$10.00 למיליון טוקנים",
          price3Model: "GPT-4o Mini",
          price3Input: "$0.15 למיליון טוקנים",
          price3Output: "$0.60 למיליון טוקנים",
          price4Model: "GPT-3.5 Turbo",
          price4Input: "$0.50 למיליון טוקנים",
          price4Output: "$1.50 למיליון טוקנים",
          tipLabel: "💡 טיפ:",
          tipText:
            "GPT-4o Mini מציע את האיזון הטוב ביותר בין איכות ועלות לרוב השימושים.",
        },
        anthropic: {
          title: "Anthropic Claude",
          badge: "הבטוח והמדויק ביותר",
          availableModels: "מודלים זמינים",
          model1Name: "Claude Sonnet 4",
          model1Desc: "- העדכני ביותר, הסקה מצוינת",
          model2Name: "Claude 3.5 Sonnet",
          model2Desc: "- איזון מצוין בין מהירות ויכולת",
          model3Name: "Claude 3 Opus",
          model3Desc: "- מודל Claude החזק ביותר",
          model4Name: "Claude 3 Haiku",
          model4Desc: "- המהיר והמשתלם ביותר",
          howToGetKey: "כיצד לקבל את מפתח ה-API שלך",
          step1: "בקר ב-",
          step2: "הירשם לחשבון (עשוי לדרוש רשימת המתנה)",
          step3: "השלם את אימות החשבון",
          step4: 'עבור ל-"API Keys" בלוח הבקרה',
          step5: 'לחץ על "Create Key"',
          step6: "העתק את מפתח ה-API שלך",
          step7: "הוסף קרדיטים לחשבון שלך בחיוב",
          pricingTitle: "תמחור",
          tableModel: "מודל",
          tableInput: "קלט",
          tableOutput: "פלט",
          price1Model: "Claude Sonnet 4",
          price1Input: "$3.00 למיליון טוקנים",
          price1Output: "$15.00 למיליון טוקנים",
          price2Model: "Claude 3.5 Sonnet",
          price2Input: "$3.00 למיליון טוקנים",
          price2Output: "$15.00 למיליון טוקנים",
          price3Model: "Claude 3 Opus",
          price3Input: "$15.00 למיליון טוקנים",
          price3Output: "$75.00 למיליון טוקנים",
          price4Model: "Claude 3 Haiku",
          price4Input: "$0.25 למיליון טוקנים",
          price4Output: "$1.25 למיליון טוקנים",
          tipLabel: "💡 טיפ:",
          tipText:
            "Claude מצטיין בתגובות מדויקות ומחושבות וידוע כמודל ה-AI הבטוח ביותר.",
        },

        dalle: {
          title: "DALL-E (OpenAI)",
          badge: "הפופולרי ביותר",
          description:
            "יצירה, עריכה ווריאציות של תמונות באמצעות הנחיות בשפה טבעית.",
          featuresTitle: "תכונות",
          feature1: "DALL-E 3: איכות גבוהה, סצנות מורכבות",
          feature2: "DALL-E 2: מהיר יותר, משתלם יותר",
          feature3: "עריכת תמונות ווריאציות",
          feature4: "מגוון גדלים וסגנונות",
          setupTitle: "הגדרה",
          setup1: "השתמש באותו מפתח API של OpenAI GPT",
          setup2: "בקר ב-",
          setup2Link: "מפתחות API של OpenAI",
          setup3: "ודא שיש קרדיטים בחשבונך",
          pricingTitle: "תמחור",
          pricing1: "DALL-E 3 (1024×1024): $0.040 לתמונה",
          pricing2: "DALL-E 3 (1024×1792): $0.080 לתמונה",
          pricing3: "DALL-E 2 (1024×1024): $0.020 לתמונה",
        },
        stabilityAI: {
          title: "Stability AI",
          badge: "מודלים פתוחים",
          description:
            "מודלים של Stable Diffusion ליצירת תמונות עם שליטה מדויקת.",
          featuresTitle: "תכונות",
          feature1: "SDXL 1.0: תמונות ברזולוציה גבוהה",
          feature2: "Stable Diffusion 3: המודל העדכני",
          feature3: "המרת תמונה לתמונה",
          feature4: "Inpainting ו-Outpainting",
          setupTitle: "הגדרה",
          setup1: "בקר ב-",
          setup1Link: "פלטפורמת Stability AI",
          setup2: "צור חשבון",
          setup3: "נווט למפתחות API",
          setup4: "צור מפתח API חדש",
          setup5: "הוסף קרדיטים לחשבונך",
          pricingTitle: "תמחור",
          pricing1: "מערכת מבוססת קרדיטים",
          pricing2: "~$0.01-0.05 לתמונה בהתאם למודל",
          pricing3: "קרדיטים חינם למשתמשים חדשים",
        },
        midjourney: {
          title: "Midjourney API",
          badge: "האיכות הטובה ביותר",
          description:
            "גישה ליצירת התמונות המדהימה של Midjourney דרך APIs של צד שלישי.",
          featuresTitle: "תכונות",
          feature1: "איכות תמונה מובילה בתעשייה",
          feature2: "סגנונות אמנותיים ופוטוריאליסטיים",
          feature3: "מודל V6 עם קוהרנטיות משופרת",
          setupTitle: "אפשרויות הגדרה",
          setup1Official: "רשמי:",
          setup1: "הירשם ב-",
          setup1Link: "midjourney.com",
          setup2ApiAccess: "גישת API:",
          setup2: "השתמש בשירותים כמו",
          setup2Link1: "ImagineAPI",
          setup2Or: "או",
          setup2Link2: "UseAPI",
          setup3: "צור מפתח API מהספק שבחרת",
          pricingTitle: "תמחור",
          pricing1: "תוכנית Basic: $10/חודש (200 תמונות)",
          pricing2: "תוכנית Standard: $30/חודש (ללא הגבלה, איטי)",
          pricing3: "תוכנית Pro: $60/חודש (שעות מהירות)",
        },
        googleImagen: {
          title: "Google Imagen",
          badge: "Google AI",
          description:
            "מודלים של טקסט לתמונה מבוססי דיפוזיה מבית Google דרך Vertex AI.",
          featuresTitle: "תכונות",
          feature1: "Imagen 3: המודל העדכני באיכות גבוהה",
          feature2: "Imagen 2: מהיר ואמין",
          feature3: "סגנונות פוטוריאליסטיים ואמנותיים",
          feature4: "משולב עם Google Cloud",
          setupTitle: "הגדרה",
          setup1: "בקר ב-",
          setup1Link: "Google Vertex AI",
          setup2: "הפעל את Vertex AI API במסוף Google Cloud",
          setup3: "צור אישורי חשבון שירות",
          setup4: "הורד קובץ מפתח JSON",
          pricingTitle: "תמחור",
          pricing1: "Imagen 3: ~$0.04 לתמונה",
          pricing2: "Imagen 2: ~$0.02 לתמונה",
          pricing3: "קרדיטים חינם למשתמשים חדשים",
        },

        veo: {
          title: "Google Veo",
          badge: "מומלץ",
          description: "מודל יצירת וידאו מתקדם של Google דרך Vertex AI.",
          feature1: "Veo 2: יצירת וידאו באיכות גבוהה העדכנית ביותר",
          feature2: "תמיכה ברזולוציית 1080p",
          feature3: "טקסט לווידאו ותמונה לווידאו",
          feature4: "משולב עם Google Cloud",
          setup1: "בקר ב-",
          setup2: "הפעל Vertex AI API במסוף Google Cloud",
          setup3: "בקש גישה למודלי Veo",
          setup4: "צור אישורי חשבון שירות",
          pricing1: "תמחור לפי שנייה",
          pricing2: "משתנה לפי אורך הווידאו והרזולוציה",
          pricing3: "שכבה חינמית לבדיקות",
        },
        runway: {
          title: "Runway",
          badge: "מוביל בתעשייה",
          description: "יצירת וידאו מקצועית עם מודלי Gen-3 Alpha.",
          feature1: "Gen-3 Alpha: יצירת וידאו באיכות הגבוהה ביותר",
          feature2: "טקסט לווידאו ותמונה לווידאו",
          feature3: "מברשת תנועה ובקרות מצלמה",
          feature4: "כלי עריכה מקצועיים",
          setup1: "בקר ב-",
          setup2: "הירשם לחשבון",
          setup3: "נווט להגדרות ה-API",
          setup4: "צור מפתח API",
          pricing1: "מערכת מבוססת קרדיטים",
          pricing2: "Standard: $15/חודש (625 קרדיטים)",
          pricing3: "Pro: $35/חודש (2,250 קרדיטים)",
        },
        pika: {
          title: "Pika",
          badge: "יצירה מהירה",
          description: "יצירת וידאו מהירה ויצירתית עם אפקטים ייחודיים.",
          feature1: "Pika 2.0: המודל העדכני עם איכות משופרת",
          feature2: "טקסט לווידאו ותמונה לווידאו",
          feature3: "אפקטים חזותיים ושינויים ייחודיים",
          feature4: "זמני יצירה מהירים",
          setup1: "בקר ב-",
          setup2: "צור חשבון",
          setup3: "גש ל-API מהגדרות המפתח",
          setup4: "צור אישורי API",
          pricing1: "שכבה חינמית: 250 קרדיטים/חודש",
          pricing2: "Basic: $10/חודש (700 קרדיטים)",
          pricing3: "Standard: $35/חודש (2,100 קרדיטים)",
        },
        sora: {
          title: "OpenAI Sora",
          badge: "איכות פרימיום",
          description: "מודל טקסט לווידאו מהפכני של OpenAI.",
          feature1: "יצירת וידאו ריאליסטית במיוחד",
          feature2: "הבנת סצנות מורכבות",
          feature3: "עד 60 שניות של וידאו",
          feature4: "יחסי גובה-רוחב מרובים",
          setup1: "בקר ב-",
          setup2: "הירשם עם חשבון OpenAI",
          setup3: "גישה זמינה דרך ChatGPT Plus/Pro",
          setup4: "גישת API עשויה לדרוש אישור נוסף",
          pricing1: "כלול ב-ChatGPT Plus ($20/חודש)",
          pricing2: "יותר יצירות עם ChatGPT Pro ($200/חודש)",
          pricing3: "תמחור API משתנה",
        },
        kling: {
          title: "Kling AI",
          badge: "איכות גבוהה",
          description: "יצירת וידאו מתקדמת עם עקביות תנועה יוצאת דופן.",
          feature1: "Kling 1.6: המודל העדכני באיכות גבוהה",
          feature2: "עד 10 שניות ברזולוציית 1080p",
          feature3: "עקביות תנועה מצוינת",
          feature4: "טקסט ותמונה לווידאו",
          setup1: "בקר ב-",
          setup2: "צור חשבון",
          setup3: "גש ל-API מפורטל המפתחים",
          setup4: "צור מפתח API",
          pricing1: "מערכת מבוססת קרדיטים",
          pricing2: "שכבה חינמית זמינה",
          pricing3: "תוכניות Pro לנפח גבוה יותר",
        },

        deepl: {
          title: "DeepL",
          badge: "האיכות הטובה ביותר",
          description: "איכות תרגום מובילה בתעשייה עם תרגום מכונה עצבי.",
          featuresTitle: "תכונות",
          feature1: "איכות תרגום מעולה",
          feature2: "תמיכה ב-30+ שפות",
          feature3: "תרגום מסמכים",
          feature4: "תמיכה במילון מונחים",
          setupTitle: "הגדרה",
          setup1: "בקר ב-",
          setup2: "צור חשבון",
          setup3: "קבל מפתח API מהגדרות החשבון",
          pricingTitle: "תמחור",
          pricing1: "חינם: 500,000 תווים/חודש",
          pricing2: "Pro: €4.99 + €20/מיליון תווים",
        },
        googleTranslate: {
          title: "Google Translate",
          badge: "130+ שפות",
          description: "תרגם טקסט בין 130+ שפות עם Google Cloud.",
          featuresTitle: "תכונות",
          feature1: "130+ שפות",
          feature2: "זיהוי שפה אוטומטי",
          feature3: "תרגום אצוות",
          setupTitle: "הגדרה",
          setup1: "בקר ב-",
          setup2: "הפעל Cloud Translation API",
          setup3: "צור אישורי חשבון שירות",
          pricingTitle: "תמחור",
          pricing1: "חינם: $10 קרדיט למשתמשים חדשים",
          pricing2: "$20 למיליון תווים",
        },
        azureTranslator: {
          title: "Azure Translator",
          badge: "שכבה חינמית",
          description: "שירות תרגום מכונה עצבי של מיקרוסופט.",
          featuresTitle: "תכונות",
          feature1: "100+ שפות",
          feature2: "מתרגם מותאם אישית",
          feature3: "תרגום מסמכים",
          setupTitle: "הגדרה",
          setup1: "בקר ב-",
          setup2: "צור חשבון Azure",
          setup3: "צור משאב Translator",
          pricingTitle: "תמחור",
          pricing1: "חינם: 2 מיליון תווים/חודש",
          pricing2: "$10 למיליון תווים",
        },

        googleVision: {
          title: "Google Vision",
          badge: "ניתוח תמונות",
          description: "ניתוח תמונות עוצמתי כולל OCR, זיהוי אובייקטים ועוד.",
          featuresTitle: "תכונות",
          feature1: "חילוץ טקסט (OCR)",
          feature2: "זיהוי אובייקטים ופנים",
          feature3: "זיהוי תוכן בטוח",
          feature4: "זיהוי תוויות",
          setupTitle: "הגדרה",
          setup1: "בקר ב-",
          setup2: "הפעל Vision API",
          setup3: "צור אישורי API",
          pricingTitle: "תמחור",
          pricing1: "1,000 יחידות ראשונות/חודש חינם",
          pricing2: "$1.50 ל-1,000 תמונות",
        },
        azureVision: {
          title: "Azure Computer Vision",
          badge: "שכבה חינמית",
          description: "יכולות ראייה ממוחשבת ו-OCR של מיקרוסופט.",
          featuresTitle: "תכונות",
          feature1: "OCR לטקסט מודפס וכתב יד",
          feature2: "ניתוח תמונות",
          feature3: "ניתוח מרחבי",
          setupTitle: "הגדרה",
          setup1: "בקר ב-",
          setup2: "צור חשבון Azure",
          setup3: "צור משאב Computer Vision",
          pricingTitle: "תמחור",
          pricing1: "חינם: 5,000 עסקאות/חודש",
          pricing2: "$1.00 ל-1,000 עסקאות",
        },
        ocrSpace: {
          title: "OCR.space",
          badge: "OCR חינמי",
          description: "שירות OCR חינמי וקל לשימוש.",
          featuresTitle: "תכונות",
          feature1: "OCR ל-PDF ותמונות",
          feature2: "תמיכה במספר שפות",
          feature3: "API REST פשוט",
          setupTitle: "הגדרה",
          setup1: "בקר ב-",
          setup2: "קבל מפתח API חינמי",
          pricingTitle: "תמחור",
          pricing1: "חינם: 25,000 בקשות/חודש",
          pricing2: "Pro: $15/חודש",
        },

        elevenlabs: {
          title: "ElevenLabs",
          badge: "TTS באיכות הטובה ביותר",
          description: "טקסט לדיבור וסינתזת קול מובילים בתעשייה.",
          featuresTitle: "תכונות",
          feature1: "יצירת קול אולטרה-ריאליסטי",
          feature2: "יכולות שיבוט קול",
          feature3: "תמיכה ב-29+ שפות",
          feature4: "יצירת אפקטים קוליים",
          setupTitle: "הגדרה",
          setup1: "בקר ב-",
          setup2: "צור חשבון",
          setup3: "עבור לפרופיל → מפתח API",
          setup4: "העתק את מפתח ה-API שלך",
          pricingTitle: "תמחור",
          pricing1: "חינם: 10,000 תווים/חודש",
          pricing2: "Starter: $5/חודש (30K תווים)",
          pricing3: "Creator: $22/חודש (100K תווים)",
        },
        azureSpeech: {
          title: "Azure Speech",
          badge: "ארגוני",
          description: "טקסט לדיבור עצבי של מיקרוסופט עם 400+ קולות.",
          featuresTitle: "תכונות",
          feature1: "TTS עצבי עם אינטונציה טבעית",
          feature2: "400+ קולות ב-140+ שפות",
          feature3: "יצירת קול מותאם אישית",
          feature4: "תמיכה ב-SSML לשליטה עדינה",
          setupTitle: "הגדרה",
          setup1: "בקר ב-",
          setup2: "צור חשבון Azure",
          setup3: "צור משאב Speech",
          setup4: "קבל מפתח API ואזור מהמשאב",
          pricingTitle: "תמחור",
          pricing1: "חינם: 500K תווים/חודש",
          pricing2: "Neural: $16 למיליון תווים",
        },
        googleTts: {
          title: "Google Cloud TTS",
          badge: "שפות רבות",
          description: "טקסט לדיבור של Google עם 220+ קולות ב-40+ שפות.",
          featuresTitle: "תכונות",
          feature1: "קולות WaveNet ו-Neural2",
          feature2: "פלט באיכות סטודיו",
          feature3: "אימון קול מותאם אישית",
          feature4: "פורמטי אודיו מרובים",
          setupTitle: "הגדרה",
          setup1: "בקר ב-",
          setup2: "הפעל את ה-API ב-Google Cloud Console",
          setup3: "צור חשבון שירות",
          setup4: "הורד קובץ JSON של האישורים",
          pricingTitle: "תמחור",
          pricing1: "חינם: מיליון תווים/חודש (Standard)",
          pricing2: "WaveNet: $16 למיליון תווים",
          pricing3: "Neural2: $16 למיליון תווים",
        },

        serper: {
          title: "Serper (חיפוש Google)",
          badge: "מומלץ",
          description: "API מהיר ומשתלם לתוצאות חיפוש Google.",
          setupTitle: "הגדרה",
          setup1: "בקר ב-",
          setup2: "הירשם לחשבון חינמי",
          setup3: "קבל את מפתח ה-API מלוח הבקרה",
          setup4: "2,500 חיפושים חינם כלולים",
          pricingTitle: "תמחור",
          pricing1: "חינם: 2,500 חיפושים",
          pricing2: "Starter: $50/חודש (50K חיפושים)",
        },
        tavily: {
          title: "Tavily AI Search",
          badge: "מותאם ל-AI",
          description: "API חיפוש שתוכנן במיוחד ליישומי AI.",
          setupTitle: "הגדרה",
          setup1: "בקר ב-",
          setup2: "הירשם לחשבון",
          setup3: "קבל מפתח API מלוח הבקרה",
          pricingTitle: "תמחור",
          pricing1: "חינם: 1,000 חיפושים/חודש",
          pricing2: "Pro: צור קשר לתמחור",
        },
        bingSearch: {
          title: "Bing Search API",
          badge: "Microsoft",
          description: "API תוצאות חיפוש Bing של מיקרוסופט.",
          setupTitle: "הגדרה",
          setup1: "בקר ב-",
          setup2: "הירשם לחשבון Azure",
          setup3: "צור משאב Bing Search",
          setup4: "קבל מפתח API מ-Azure Portal",
          pricingTitle: "תמחור",
          pricing1: "חינם: 1,000 קריאות/חודש",
          pricing2: "S1: $7/1,000 קריאות",
        },

        wolframAlpha: {
          title: "Wolfram Alpha",
          badge: "ידע חישובי",
          description: "גישה לידע חישובי וחישובים מתמטיים.",
          featuresTitle: "תכונות",
          feature1: "חישובים מתמטיים",
          feature2: "ניתוח והמחשת נתונים",
          feature3: "חישובים מדעיים",
          feature4: "שאילתות ידע",
          setupTitle: "הגדרה",
          setup1: "בקר ב-",
          setup2: "צור חשבון מפתח",
          setup3: "נווט לגישת API",
          setup4: "צור AppID",
          pricingTitle: "תמחור",
          pricing1: "חינם: 2,000 שאילתות/חודש",
          pricing2: "תוכניות בתשלום זמינות",
        },
        serpApi: {
          title: "SerpAPI",
          badge: "נתוני חיפוש",
          description: "קבל תוצאות חיפוש מובנות מ-Google ומנועי חיפוש אחרים.",
          featuresTitle: "תכונות",
          feature1: "נתוני SERP של Google",
          feature2: "מנועי חיפוש מרובים",
          feature3: "תוצאות בזמן אמת",
          feature4: "חיפושים מבוססי מיקום",
          setupTitle: "הגדרה",
          setup1: "בקר ב-",
          setup2: "צור חשבון",
          setup3: "קבל מפתח API מלוח הבקרה",
          pricingTitle: "תמחור",
          pricing1: "חינם: 100 חיפושים/חודש",
          pricing2: "Developer: $75/חודש",
        },
        newsApi: {
          title: "News API",
          badge: "שכבה חינמית",
          description: "גישה למאמרי חדשות ממקורות ברחבי העולם.",
          featuresTitle: "תכונות",
          feature1: "כותרות מ-80,000+ מקורות",
          feature2: "חיפוש מאמרים היסטוריים",
          feature3: "סינון לפי מקור, שפה, מדינה",
          setupTitle: "הגדרה",
          setup1: "בקר ב-",
          setup2: "הירשם בחינם",
          setup3: "קבל מפתח API",
          pricingTitle: "תמחור",
          pricing1: "חינם: 100 בקשות/יום (פיתוח בלבד)",
          pricing2: "עסקי: $449/חודש",
        },

        awsS3: {
          title: "AWS S3",
          badge: "סטנדרט בתעשייה",
          description: "שירות האחסון הפשוט של אמזון לאחסון קבצים אמין.",
          setupTitle: "הגדרה",
          setup1: "בקר ב-",
          setup2: "צור חשבון AWS",
          setup3: "עבור למסוף IAM",
          setup4: "צור משתמש IAM חדש",
          setup5: "צרף מדיניות הרשאות S3",
          setup6: "צור Access Key ID ו-Secret Access Key",
          setup7: "צור דלי S3 לקבצים שלך",
          pricingTitle: "תמחור",
          pricing1: "אחסון: $0.023/GB/חודש",
          pricing2: "בקשות PUT: $0.005/1,000",
          pricing3: "בקשות GET: $0.0004/1,000",
          pricing4: "שכבה חינמית: 5GB ל-12 חודשים",
        },
        googleCloudStorage: {
          title: "Google Cloud Storage",
          badge: "אינטגרציה קלה",
          description: "פתרון אחסון הענן של Google עם CDN גלובלי.",
          setupTitle: "הגדרה",
          setup1: "בקר ב-",
          setup2: "צור או בחר פרויקט",
          setup3: "הפעל Cloud Storage API",
          setup4: "צור חשבון שירות",
          setup5: "הורד קובץ מפתח JSON",
          setup6: "צור דלי אחסון",
          pricingTitle: "תמחור",
          pricing1: "Standard: $0.020/GB/חודש",
          pricing2: "שכבה חינמית: 5GB לתמיד חינם",
        },
        azureBlob: {
          title: "Azure Blob Storage",
          badge: "ארגוני",
          description: "אחסון Blob של Microsoft Azure לנתונים לא מובנים.",
          setupTitle: "הגדרה",
          setup1: "בקר ב-",
          setup2: "צור חשבון Azure",
          setup3: "צור חשבון אחסון",
          setup4: "קבל מחרוזת חיבור ממפתחות הגישה",
          setup5: "צור מיכל לקבצים שלך",
          pricingTitle: "תמחור",
          pricing1: "שכבת Hot: $0.018/GB/חודש",
          pricing2: "שכבה חינמית זמינה עם חשבון Azure",
        },

        sendgrid: {
          title: "SendGrid",
          badge: "מומלץ",
          description: 'שליחת דוא"ל אמינה עם יכולת מסירה מצוינת.',
          setupTitle: "הגדרה",
          setup1: "בקר ב-",
          setup2: "הירשם לחשבון חינמי",
          setup3: "אמת את הדומיין שלך",
          setup4: "עבור להגדרות → מפתחות API",
          setup5: "צור מפתח API עם הרשאות שליחת דואר",
          pricingTitle: "תמחור",
          pricing1: "חינם: 100 הודעות/יום לתמיד",
          pricing2: "Essentials: $19.95/חודש (50K הודעות)",
        },
        mailgun: {
          title: "Mailgun",
          badge: "מועדף על מפתחים",
          description: 'API דוא"ל עוצמתי למפתחים.',
          setupTitle: "הגדרה",
          setup1: "בקר ב-",
          setup2: "צור חשבון",
          setup3: "אמת את הדומיין שלך",
          setup4: "קבל מפתח API מלוח הבקרה",
          pricingTitle: "תמחור",
          pricing1: "ניסיון: 5,000 הודעות/חודש ל-3 חודשים",
          pricing2: "Foundation: $35/חודש (50K הודעות)",
        },
        awsSes: {
          title: "AWS SES",
          badge: "הכי משתלם",
          description: "Amazon Simple Email Service - חסכוני מאוד.",
          setupTitle: "הגדרה",
          setup1: "בקר ב-",
          setup2: "צור חשבון AWS",
          setup3: 'אמת את הדוא"ל/דומיין שלך',
          setup4: "בקש גישה לייצור",
          setup5: "צור אישורי SMTP או השתמש ב-API",
          pricingTitle: "תמחור",
          pricing1: "$0.10 ל-1,000 הודעות",
          pricing2: "שכבה חינמית: 62,000 הודעות/חודש (מ-EC2)",
        },

        twilio: {
          title: "Twilio",
          badge: "מוביל בתעשייה",
          description: "פלטפורמת תקשורת מלאה ל-SMS, קול ו-WhatsApp.",
          featuresTitle: "תכונות",
          feature1: "הודעות SMS ברחבי העולם",
          feature2: "שיחות קוליות ו-IVR",
          feature3: "WhatsApp Business API",
          feature4: "יכולות וידאו",
          setupTitle: "הגדרה",
          setup1: "בקר ב-",
          setup2: "צור חשבון חינמי",
          setup3: "קבל Account SID ו-Auth Token",
          pricingTitle: "תמחור",
          pricing1: "ניסיון חינמי עם קרדיטים",
          pricing2: "SMS: ~$0.0079 להודעה",
        },
        messageBird: {
          title: "MessageBird",
          badge: "רב-ערוצי",
          description: "פלטפורמת תקשורת רב-ערוצית.",
          featuresTitle: "תכונות",
          feature1: "SMS, קול, צ'אט",
          feature2: "WhatsApp, Telegram, Facebook",
          feature3: "אוטומציית Flow Builder",
          setupTitle: "הגדרה",
          setup1: "בקר ב-",
          setup2: "צור חשבון",
          setup3: "קבל מפתח API",
          pricingTitle: "תמחור",
          pricing1: "שלם לפי שימוש",
          pricing2: "ניסיון חינמי זמין",
        },
        vonage: {
          title: "Vonage",
          badge: "ארגוני",
          description: "APIs לתקשורת ארגונית.",
          featuresTitle: "תכונות",
          feature1: "SMS ו-MMS",
          feature2: "קול ווידאו",
          feature3: "Verify API ל-2FA",
          setupTitle: "הגדרה",
          setup1: "בקר ב-",
          setup2: "צור חשבון מפתח",
          setup3: "קבל אישורי API",
          pricingTitle: "תמחור",
          pricing1: "קרדיטים חינם למשתמשים חדשים",
          pricing2: "שלם לפי שימוש",
        },
        slack: {
          title: "Slack",
          badge: "צ'אט צוותי",
          description: "שילוב עם Slack להודעות צוותיות ואוטומציה.",
          featuresTitle: "תכונות",
          feature1: "שליחת הודעות",
          feature2: "יצירת ערוצים",
          feature3: "אינטראקציות בוט",
          feature4: "אוטומציית זרימות עבודה",
          setupTitle: "הגדרה",
          setup1: "בקר ב-",
          setup2: "צור אפליקציית Slack",
          setup3: "התקן בסביבת העבודה",
          setup4: "קבל OAuth token",
          pricingTitle: "תמחור",
          pricing1: "חינם עם סביבת עבודה של Slack",
        },

        shodan: {
          title: "Shodan",
          badge: "הטוב ביותר לסריקה",
          description: "מנוע החיפוש למכשירים מחוברים לאינטרנט ומודיעין אבטחה.",
          featuresTitle: "תכונות",
          feature1: "חיפוש מכשירים ושירותים חשופים",
          feature2: "זיהוי פגיעויות",
          feature3: "ניתוח חשיפת רשת",
          feature4: "נתונים היסטוריים ומגמות",
          setupTitle: "הגדרה",
          setup1: "בקר ב-",
          setup2: "צור חשבון",
          setup3: "עבור לחשבון → מפתח API",
          setup4: "העתק את מפתח ה-API שלך",
          pricingTitle: "תמחור",
          pricing1: "חינם: 100 שאילתות/חודש",
          pricing2: "חברות: $49 (לכל החיים)",
          pricing3: "תוכניות API מ-$59/חודש",
        },
        virusTotal: {
          title: "VirusTotal",
          badge: "ניתוח נוזקות",
          description:
            "נתח קבצים וכתובות URL לאיתור וירוסים, נוזקות ואיומים אחרים.",
          featuresTitle: "תכונות",
          feature1: "סריקת קבצים וכתובות URL",
          feature2: "70+ מנועי אנטי-וירוס",
          feature3: "מוניטין דומיין ו-IP",
          feature4: "דוחות מודיעין איומים",
          setupTitle: "הגדרה",
          setup1: "בקר ב-",
          setup2: "צור חשבון",
          setup3: "עבור למפתח API בפרופיל שלך",
          setup4: "העתק את מפתח ה-API שלך",
          pricingTitle: "תמחור",
          pricing1: "חינם: 500 בקשות/יום",
          pricing2: "פרימיום: צור קשר לתמחור",
        },
        hibp: {
          title: "Have I Been Pwned",
          badge: "זיהוי דליפות",
          description: 'בדוק אם דוא"ל וסיסמאות נחשפו בדליפות נתונים.',
          featuresTitle: "תכונות",
          feature1: 'בדיקת דליפות דוא"ל',
          feature2: "API חשיפת סיסמאות",
          feature3: "חיפוש דומיין לארגונים",
          feature4: "שירות התראות דליפה",
          setupTitle: "הגדרה",
          setup1: "בקר ב-",
          setup2: "הירשם ל-API",
          setup3: 'קבל את מפתח ה-API בדוא"ל',
          pricingTitle: "תמחור",
          pricing1: "Password API: חינם (ללא צורך במפתח)",
          pricing2: "Breach API: $3.50/חודש",
        },
        securityTrails: {
          title: "SecurityTrails",
          badge: "מודיעין DNS",
          description: "נתוני מודיעין DNS ודומיין מקיפים.",
          featuresTitle: "תכונות",
          feature1: "רשומות DNS היסטוריות",
          feature2: "מודיעין דומיין ו-IP",
          feature3: "ספירת תת-דומיינים",
          feature4: "היסטוריית WHOIS",
          setupTitle: "הגדרה",
          setup1: "בקר ב-",
          setup2: "צור חשבון",
          setup3: "נווט לקטע API",
          setup4: "צור מפתח API",
          pricingTitle: "תמחור",
          pricing1: "חינם: 50 שאילתות/חודש",
          pricing2: "Starter: $99/חודש",
        },

        auth0: {
          title: "Auth0",
          badge: "מוביל באימות",
          description: "פלטפורמת זהות ואימות מלאה.",
          featuresTitle: "תכונות",
          feature1: "התחברות אוניברסלית",
          feature2: "אימות רב-גורמי",
          feature3: "שילוב התחברות חברתית",
          feature4: "Single Sign-On",
          setupTitle: "הגדרה",
          setup1: "בקר ב-",
          setup2: "צור חשבון חינמי",
          setup3: "צור אפליקציה",
          setup4: "קבל אישורי לקוח",
          pricingTitle: "תמחור",
          pricing1: "חינם: 7,000 משתמשים",
          pricing2: "Essential: $23/חודש",
        },

        docRaptor: {
          title: "DocRaptor",
          badge: "מומלץ",
          description: "יצירת PDF מקצועית מ-HTML עם רינדור Prince.",
          featuresTitle: "תכונות",
          feature1: "יצירת PDF ו-Excel",
          feature2: "תמיכה ב-CSS Paged Media",
          feature3: "כותרות עליונות, תחתונות, מספרי עמודים",
          feature4: "סימני מים ואבטחה",
          setupTitle: "הגדרה",
          setup1: "בקר ב-",
          setup2: "הירשם לחשבון",
          setup3: "קבל מפתח API מלוח הבקרה",
          pricingTitle: "תמחור",
          pricing1: "מסמכי בדיקה: חינם (עם סימן מים)",
          pricing2: "Starter: $15/חודש (125 מסמכים)",
        },
        pdfShift: {
          title: "PDFShift",
          badge: "API פשוט",
          description: "המר HTML ל-PDF עם API פשוט.",
          setupTitle: "הגדרה",
          setup1: "בקר ב-",
          setup2: "צור חשבון",
          setup3: "קבל מפתח API",
          pricingTitle: "תמחור",
          pricing1: "חינם: 50 המרות/חודש",
          pricing2: "Starter: $9/חודש (500 המרות)",
        },
        gotenberg: {
          title: "Gotenberg",
          badge: "Self-Hosted/חינם",
          description: "API המרת מסמכים בקוד פתוח (אירוח עצמי).",
          featuresTitle: "תכונות",
          feature1: "PDF מ-HTML, Markdown, מסמכי Office",
          feature2: "מיזוג קבצי PDF",
          feature3: "אירוח עצמי (חינם)",
          setupTitle: "הגדרה",
          setup1: "בקר ב-",
          setup2: "הפעל עם Docker",
          setup3: "או השתמש בשירותי אירוח ענן",
          pricingTitle: "תמחור",
          pricing1: "חינם (אירוח עצמי)",
          pricing2: "שירותי ענן משתנים",
        },

        notion: {
          title: "Notion",
          badge: "סביבת עבודה",
          description:
            "התחבר לסביבות עבודה של Notion להערות, מסדי נתונים ועוד.",
          featuresTitle: "תכונות",
          feature1: "פעולות CRUD במסד נתונים",
          feature2: "יצירה ועדכון עמודים",
          feature3: "פונקציונליות חיפוש",
          setupTitle: "הגדרה",
          setup1: "בקר ב-",
          setup2: "צור אינטגרציה",
          setup3: "קבל טוקן אינטגרציה פנימי",
          pricingTitle: "תמחור",
          pricing1: "חינם עם חשבון Notion",
        },
        googleWorkspace: {
          title: "Google Workspace",
          badge: "Docs, Sheets, Gmail",
          description: "גישה ל-Google Docs, Sheets, Drive, Gmail ועוד.",
          featuresTitle: "תכונות",
          feature1: "יצירה/עריכה של Google Docs",
          feature2: "מניפולציה של נתוני Sheets",
          feature3: "ניהול קבצי Drive",
          feature4: "שילוב Gmail",
          setupTitle: "הגדרה",
          setup1: "בקר ב-",
          setup2: "הפעל APIs ב-Cloud Console",
          setup3: "צור אישורי OAuth",
          pricingTitle: "תמחור",
          pricing1: "שכבה חינמית זמינה",
          pricing2: "משתנה לפי שימוש ב-API",
        },
      },
    },

    serviceProviders: {
      additionalProviders: "🔌 ספקי שירות נוספים",
      additionalProvidersDesc:
        "שילובים מפורטים לשיפור זרימת העבודה שלך - לחץ להרחבה",
      features: "תכונות",
      setup: "הגדרה",
      pricing: "תמחור",

      wolframAlpha: "Wolfram Alpha",
      computationalBadge: "ידע חישובי",
      wolframDesc: "גישה לידע חישובי וחישובים מתמטיים.",
      wolframFeature1: "חישובים מתמטיים",
      wolframFeature2: "ניתוח והמחשת נתונים",
      wolframFeature3: "חישובים מדעיים",
      wolframFeature4: "שאילתות ידע",
      wolframStep1: "בקר ב-",
      wolframStep2: "צור חשבון מפתח",
      wolframStep3: "נווט לגישת API",
      wolframStep4: "צור AppID",
      wolframPricing1: "חינם: 2,000 שאילתות/חודש",
      wolframPricing2: "תוכניות בתשלום זמינות",

      serpAPI: "SerpAPI",
      searchDataBadge: "נתוני חיפוש",
      serpDesc: "קבל תוצאות חיפוש מובנות מגוגל ומנועי חיפוש אחרים.",
      serpFeature1: "נתוני SERP של גוגל",
      serpFeature2: "מנועי חיפוש מרובים",
      serpFeature3: "תוצאות בזמן אמת",
      serpFeature4: "חיפושים מבוססי מיקום",
      serpStep1: "בקר ב-",
      serpStep2: "צור חשבון",
      serpStep3: "קבל מפתח API מלוח הבקרה",
      serpPricing1: "חינם: 100 חיפושים/חודש",
      serpPricing2: "מפתח: $75/חודש",

      newsAPI: "News API",
      freeTierBadge: "שכבה חינמית",
      newsDesc: "גישה למאמרי חדשות ממקורות ברחבי העולם.",
      newsFeature1: "כותרות מ-80,000+ מקורות",
      newsFeature2: "חיפוש מאמרים היסטוריים",
      newsFeature3: "סינון לפי מקור, שפה, מדינה",
      newsStep1: "בקר ב-",
      newsStep2: "הירשם בחינם",
      newsStep3: "קבל מפתח API",
      newsPricing1: "חינם: 100 בקשות/יום (פיתוח בלבד)",
      newsPricing2: "עסקי: $449/חודש",

      deepL: "DeepL",
      bestQualityBadge: "איכות מעולה",
      deepLDesc: "איכות תרגום מובילה בתעשייה עם תרגום מכונה עצבי.",
      deepLFeature1: "איכות תרגום מעולה",
      deepLFeature2: "30+ שפות נתמכות",
      deepLFeature3: "תרגום מסמכים",
      deepLFeature4: "תמיכה במילון מונחים",
      deepLStep1: "בקר ב-",
      deepLStep2: "צור חשבון",
      deepLStep3: "קבל מפתח API מהגדרות החשבון",
      deepLPricing1: "חינם: 500,000 תווים/חודש",
      deepLPricing2: "Pro: €4.99 + €20/1M תווים",

      googleTranslate: "Google Translate",
      mostLanguagesBadge: "130+ שפות",
      googleTranslateDesc: "תרגם טקסט בין 130+ שפות עם Google Cloud.",
      googleTranslateFeature1: "130+ שפות",
      googleTranslateFeature2: "זיהוי שפה אוטומטי",
      googleTranslateFeature3: "תרגום אצוות",
      googleTranslateStep1: "בקר ב-",
      googleTranslateStep2: "הפעל Cloud Translation API",
      googleTranslateStep3: "צור אישורי חשבון שירות",
      googleTranslatePricing1: "חינם: $10 זיכוי למשתמשים חדשים",
      googleTranslatePricing2: "$20 למיליון תווים",

      azureTranslator: "Azure Translator",
      azureTranslatorDesc: "שירות תרגום מכונה עצבי של מיקרוסופט.",
      azureTranslatorFeature1: "100+ שפות",
      azureTranslatorFeature2: "מתרגם מותאם אישית",
      azureTranslatorFeature3: "תרגום מסמכים",
      azureTranslatorStep1: "בקר ב-",
      azureTranslatorStep2: "צור חשבון Azure",
      azureTranslatorStep3: "צור משאב Translator",
      azureTranslatorPricing1: "חינם: 2M תווים/חודש",
      azureTranslatorPricing2: "$10 למיליון תווים",

      googleVision: "Google Vision",
      imageAnalysisBadge: "ניתוח תמונות",
      googleVisionDesc: "ניתוח תמונות חזק כולל OCR, זיהוי אובייקטים ועוד.",
      googleVisionFeature1: "חילוץ טקסט (OCR)",
      googleVisionFeature2: "זיהוי אובייקטים ופנים",
      googleVisionFeature3: "זיהוי חיפוש בטוח",
      googleVisionFeature4: "זיהוי תוויות",
      googleVisionStep1: "בקר ב-",
      googleVisionStep2: "הפעל Vision API",
      googleVisionStep3: "צור אישורי API",
      googleVisionPricing1: "1,000 יחידות ראשונות/חודש חינם",
      googleVisionPricing2: "$1.50 ל-1,000 תמונות",

      azureVision: "Azure Computer Vision",
      azureVisionDesc: "יכולות ראיית מחשב ו-OCR של מיקרוסופט.",
      azureVisionFeature1: "OCR לטקסט מודפס וכתב יד",
      azureVisionFeature2: "ניתוח תמונות",
      azureVisionFeature3: "ניתוח מרחבי",
      azureVisionStep1: "בקר ב-",
      azureVisionStep2: "צור חשבון Azure",
      azureVisionStep3: "צור משאב Computer Vision",
      azureVisionPricing1: "חינם: 5,000 עסקאות/חודש",
      azureVisionPricing2: "$1.00 ל-1,000 עסקאות",

      ocrSpace: "OCR.space",
      freeOCRBadge: "OCR חינמי",
      ocrSpaceDesc: "שירות OCR חינמי וקל לשימוש.",
      ocrSpaceFeature1: "OCR ל-PDF ותמונות",
      ocrSpaceFeature2: "תמיכה רב-שפתית",
      ocrSpaceFeature3: "REST API פשוט",
      ocrSpaceStep1: "בקר ב-",
      ocrSpaceStep2: "קבל מפתח API חינמי",
      ocrSpacePricing1: "חינם: 25,000 בקשות/חודש",
      ocrSpacePricing2: "Pro: $15/חודש",

      twilio: "Twilio",
      industryLeaderBadge: "מוביל בתעשייה",
      twilioDesc: "פלטפורמת תקשורת מלאה ל-SMS, קול ו-WhatsApp.",
      twilioFeature1: "הודעות SMS ברחבי העולם",
      twilioFeature2: "שיחות קוליות ו-IVR",
      twilioFeature3: "WhatsApp Business API",
      twilioFeature4: "יכולות וידאו",
      twilioStep1: "בקר ב-",
      twilioStep2: "צור חשבון חינמי",
      twilioStep3: "קבל Account SID ו-Auth Token",
      twilioPricing1: "ניסיון חינם עם זיכויים",
      twilioPricing2: "SMS: ~$0.0079 להודעה",

      messageBird: "MessageBird",
      omnichannelBadge: "רב-ערוצי",
      messageBirdDesc: "פלטפורמת תקשורת רב-ערוצית.",
      messageBirdFeature1: "SMS, קול, צ'אט",
      messageBirdFeature2: "WhatsApp, Telegram, Facebook",
      messageBirdFeature3: "אוטומציית Flow Builder",
      messageBirdStep1: "בקר ב-",
      messageBirdStep2: "צור חשבון",
      messageBirdStep3: "קבל מפתח API",
      messageBirdPricing1: "תשלום לפי שימוש",
      messageBirdPricing2: "ניסיון חינם זמין",

      vonage: "Vonage",
      enterpriseBadge: "ארגוני",
      vonageDesc: "ממשקי API לתקשורת ארגונית.",
      vonageFeature1: "SMS ו-MMS",
      vonageFeature2: "קול ווידאו",
      vonageFeature3: "Verify API ל-2FA",
      vonageStep1: "בקר ב-",
      vonageStep2: "צור חשבון מפתח",
      vonageStep3: "קבל אישורי API",
      vonagePricing1: "זיכויים חינם למשתמשים חדשים",
      vonagePricing2: "תשלום לפי שימוש",

      auth0: "Auth0",
      authLeaderBadge: "מוביל אימות",
      auth0Desc: "פלטפורמת זהות ואימות מלאה.",
      auth0Feature1: "התחברות אוניברסלית",
      auth0Feature2: "אימות רב-גורמי",
      auth0Feature3: "שילוב התחברות חברתית",
      auth0Feature4: "Single Sign-On",
      auth0Step1: "בקר ב-",
      auth0Step2: "צור חשבון חינמי",
      auth0Step3: "צור אפליקציה",
      auth0Step4: "קבל אישורי לקוח",
      auth0Pricing1: "חינם: 7,000 משתמשים",
      auth0Pricing2: "Essential: $23/חודש",

      virusTotal: "VirusTotal",
      malwareScanBadge: "סריקת תוכנות זדוניות",
      virusTotalDesc:
        "ניתוח קבצים וכתובות URL לתוכנות זדוניות באמצעות 70+ מנועי אנטי-וירוס.",
      virusTotalFeature1: "סריקת קבצים וכתובות URL",
      virusTotalFeature2: "70+ מנועי אנטי-וירוס",
      virusTotalFeature3: "מודיעין דומיין ו-IP",
      virusTotalStep1: "בקר ב-",
      virusTotalStep2: "צור חשבון חינמי",
      virusTotalStep3: "קבל מפתח API מהפרופיל",
      virusTotalPricing1: "חינם: 500 בקשות/יום",
      virusTotalPricing2: "פרימיום: צור קשר למכירות",

      hibp: "Have I Been Pwned",
      breachDetectBadge: "זיהוי פריצות",
      hibpDesc: "בדוק אם חשבונות נפגעו בפריצות נתונים.",
      hibpFeature1: "בדיקת פריצת אימייל",
      hibpFeature2: "בדיקת חשיפת סיסמה",
      hibpFeature3: "חיפוש דומיין",
      hibpStep1: "בקר ב-",
      hibpStep2: "הירשם לגישת API",
      hibpPricing1: "Password API: חינם",
      hibpPricing2: "Breach API: $3.50/חודש",

      notion: "Notion",
      workspaceBadge: "סביבת עבודה",
      notionDesc: "התחבר לסביבות עבודה של Notion להערות, מסדי נתונים ועוד.",
      notionFeature1: "פעולות CRUD למסד נתונים",
      notionFeature2: "יצירה ועדכון דפים",
      notionFeature3: "פונקציונליות חיפוש",
      notionStep1: "בקר ב-",
      notionStep2: "צור אינטגרציה",
      notionStep3: "קבל טוקן אינטגרציה פנימית",
      notionPricing1: "חינם עם חשבון Notion",

      slack: "Slack",
      teamChatBadge: "צ'אט צוות",
      slackDesc: "שלב עם Slack להודעות צוות ואוטומציה.",
      slackFeature1: "שלח הודעות",
      slackFeature2: "צור ערוצים",
      slackFeature3: "אינטראקציות בוט",
      slackFeature4: "אוטומציית זרימת עבודה",
      slackStep1: "בקר ב-",
      slackStep2: "צור אפליקציית Slack",
      slackStep3: "התקן בסביבת עבודה",
      slackStep4: "קבל טוקן OAuth",
      slackPricing1: "חינם עם סביבת עבודה של Slack",

      googleWorkspace: "Google Workspace",
      docsSheetsMailBadge: "Docs, Sheets, Gmail",
      googleWorkspaceDesc: "גישה ל-Google Docs, Sheets, Drive, Gmail ועוד.",
      googleWorkspaceFeature1: "יצירה/עריכה של Google Docs",
      googleWorkspaceFeature2: "מניפולציית נתוני Sheets",
      googleWorkspaceFeature3: "ניהול קבצי Drive",
      googleWorkspaceFeature4: "שילוב Gmail",
      googleWorkspaceStep1: "בקר ב-",
      googleWorkspaceStep2: "הפעל APIs ב-Cloud Console",
      googleWorkspaceStep3: "צור אישורי OAuth",
      googleWorkspacePricing1: "שכבה חינמית זמינה",
      googleWorkspacePricing2: "משתנה לפי שימוש ב-API",
    },
  },
};

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

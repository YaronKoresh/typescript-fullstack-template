import process from "node:process";

import dotenv from "dotenv";

dotenv.config();

const env = function (key, defaultValue: string = ""): string {
  return process.env[key] || defaultValue;
};

const _envBool = function (key, defaultValue: boolean = false): boolean {
  const val: string = process.env[key];
  if (val === undefined || val === "") return defaultValue;
  return val === "true" || val === "1";
};

const CURRENT_YEAR: number = new Date().getFullYear();

const siteConfig: {
  site: {
    name: any;
    tagline: any;
    description: any;
    keywords: any;
    year: number;
  };
  author: { name: any; bio: any };
  contact: {
    email: any;
    emailPrivacy: any;
    emailLegal: any;
    location: any;
    responseTime: any;
  };
  social: { github: any; twitter: any; linkedin: any };
  email: { service: any; apiKey: any; fromAddress: any; toAddress: any };
} = {
  site: {
    name: env("SITE_NAME", ""),
    tagline: env("SITE_TAGLINE", ""),
    description: env("SITE_DESCRIPTION", ""),
    keywords: env("SITE_KEYWORDS", ""),
    year: CURRENT_YEAR,
  },

  author: {
    name: env("AUTHOR_NAME", ""),
    bio: env("AUTHOR_BIO", ""),
  },

  contact: {
    email: env("CONTACT_EMAIL", ""),
    emailPrivacy: env("CONTACT_EMAIL_PRIVACY", ""),
    emailLegal: env("CONTACT_EMAIL_LEGAL", ""),
    location: env("CONTACT_LOCATION", ""),
    responseTime: env("CONTACT_RESPONSE_TIME", ""),
  },

  social: {
    github: env("SOCIAL_GITHUB", ""),
    twitter: env("SOCIAL_TWITTER", ""),
    linkedin: env("SOCIAL_LINKEDIN", ""),
  },

  email: {
    service: env("EMAIL_SERVICE", ""),
    apiKey: env("EMAIL_API_KEY", ""),
    fromAddress: env("EMAIL_FROM_ADDRESS", ""),
    toAddress: env("EMAIL_TO_ADDRESS", ""),
  },
};

const getCopyrightText = function (): string {
  return `© ${CURRENT_YEAR} ${siteConfig.author.name}. All Rights Reserved.`;
};

const getClientConfig = function () {
  return {
    site: siteConfig.site,
    author: {
      name: siteConfig.author.name,
      bio: siteConfig.author.bio,
    },
    contact: {
      email: siteConfig.contact.email,
      emailPrivacy: siteConfig.contact.emailPrivacy,
      emailLegal: siteConfig.contact.emailLegal,
      location: siteConfig.contact.location,
      responseTime: siteConfig.contact.responseTime,
    },
    social: siteConfig.social,
    copyright: getCopyrightText(),
  };
};

export { CURRENT_YEAR, getClientConfig, getCopyrightText, siteConfig };

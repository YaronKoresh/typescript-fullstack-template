import {
  STORAGE_KEY,
  HISTORY_KEY,
  MAX_MESSAGES_PER_TAB,
} from "./constants";
import * as styles from "./styles.module.css";
import { Example } from "./types";

const state: {
  sessionId: any;
  attachments: any[];
  sidebarVisible: boolean;
  sideNavVisible: boolean;
  theme: string;
  currentCategoryFilters: any[];
  tabs: any[];
  activeTabId: any;
  tabIdCounter: number;
  lastResponse: any;
} = {
  sessionId: null,
  attachments: [],
  sidebarVisible: true,
  sideNavVisible: false,
  theme: "light",
  tabs: [],
  activeTabId: null,
  tabIdCounter: 0,
  lastResponse: null,
};

const elements: {
  chatView: HTMLInputElement;
  configModal: HTMLInputElement;
  categoriesGrid: HTMLInputElement;
  searchInput: HTMLInputElement;
  modalTitle: HTMLInputElement;
  messagesArea: HTMLInputElement;
  menuOptions: HTMLInputElement;
  menuSidebar: HTMLInputElement;
  messageInput: HTMLInputElement;
  fileInput: HTMLInputElement;
  attachmentPreview: HTMLInputElement;
  loadingOverlay: HTMLInputElement;
  themeToggle: HTMLInputElement;
  tabsBar: HTMLInputElement;
  sideNav: HTMLInputElement;
  sideNavOverlay: HTMLInputElement;
  hamburgerBtn: HTMLInputElement;
  sideNavClose: HTMLInputElement;
  sideNavEngines: HTMLInputElement;
  additionalServicesBody: HTMLElement;
} = {
  chatView: document.getElementById("chatView") as HTMLInputElement,
  configModal: document.getElementById("configModal") as HTMLInputElement,
  categoriesGrid: document.getElementById("categoriesGrid") as HTMLInputElement,
  searchInput: document.getElementById("searchInput") as HTMLInputElement,
  modalTitle: document.getElementById("modalTitle") as HTMLInputElement,
  messagesArea: document.getElementById("messagesArea") as HTMLInputElement,
  menuOptions: document.getElementById("menuOptions") as HTMLInputElement,
  menuSidebar: document.getElementById("menuSidebar") as HTMLInputElement,
  messageInput: document.getElementById("messageInput") as HTMLInputElement,
  fileInput: document.getElementById("fileInput") as HTMLInputElement,
  attachmentPreview: document.getElementById(
    "attachmentPreview",
  ) as HTMLInputElement,
  loadingOverlay: document.getElementById("loadingOverlay") as HTMLInputElement,
  themeToggle: document.getElementById("themeToggle") as HTMLInputElement,
  tabsBar: document.getElementById("tabsBar") as HTMLInputElement,
  sideNav: document.getElementById("sideNav") as HTMLInputElement,
  sideNavOverlay: document.getElementById("sideNavOverlay") as HTMLInputElement,
  hamburgerBtn: document.getElementById("hamburgerBtn") as HTMLInputElement,
  sideNavClose: document.getElementById("sideNavClose") as HTMLInputElement,
  sideNavEngines: document.getElementById("sideNavEngines") as HTMLInputElement,
  additionalServicesBody: document.getElementById(
    "additionalServicesBody",
  ) as HTMLElement,
};

const getCurrentLanguage = function (): string {
  return window.location.href.split("/")[3];
};

const init = async function (): Promise<void> {
  hideLoading();

  window.addEventListener("languageChanged", (): void => {
  });
};

const downloadFile = (content, filename, mimeType): void => {
  const blob: Blob = new Blob([content], { type: mimeType });
  const url: string = URL.createObjectURL(blob);
  const a: HTMLAnchorElement = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

document.addEventListener("DOMContentLoaded", init);

if (typeof window !== "undefined") {
}
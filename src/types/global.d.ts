interface Crypto {
  readonly subtle: SubtleCrypto;
  getRandomValues<T extends ArrayBufferView | null>(array: T): T;
  randomUUID(): string;
}

interface SubtleCrypto {
  decrypt(
    algorithm:
      | AlgorithmIdentifier
      | RsaOaepParams
      | AesCtrParams
      | AesCbcParams
      | AesGcmParams,
    key: CryptoKey,
    data: BufferSource,
  ): Promise<ArrayBuffer>;

  deriveBits(
    algorithm:
      | AlgorithmIdentifier
      | EcdhKeyDeriveParams
      | HkdfParams
      | Pbkdf2Params,
    baseKey: CryptoKey,
    length: number,
  ): Promise<ArrayBuffer>;

  deriveKey(
    algorithm:
      | AlgorithmIdentifier
      | EcdhKeyDeriveParams
      | HkdfParams
      | Pbkdf2Params,
    baseKey: CryptoKey,
    derivedKeyType:
      | AlgorithmIdentifier
      | AesKeyGenParams
      | HmacKeyGenParams
      | Pbkdf2Params,
    extractable: boolean,
    keyUsages: string[],
  ): Promise<CryptoKey>;

  digest(
    algorithm: AlgorithmIdentifier,
    data: BufferSource,
  ): Promise<ArrayBuffer>;

  encrypt(
    algorithm:
      | AlgorithmIdentifier
      | RsaOaepParams
      | AesCtrParams
      | AesCbcParams
      | AesGcmParams,
    key: CryptoKey,
    data: BufferSource,
  ): Promise<ArrayBuffer>;

  exportKey(format: string, key: CryptoKey): Promise<JsonWebKey | ArrayBuffer>;

  generateKey(
    algorithm:
      | AlgorithmIdentifier
      | RsaHashedKeyGenParams
      | EcKeyGenParams
      | AesKeyGenParams
      | HmacKeyGenParams
      | Pbkdf2Params,
    extractable: boolean,
    keyUsages: string[],
  ): Promise<CryptoKey | CryptoKeyPair>;

  importKey(
    format: string,
    keyData: BufferSource | JsonWebKey,
    algorithm:
      | AlgorithmIdentifier
      | RsaHashedImportParams
      | EcKeyImportParams
      | HmacImportParams
      | AesKeyAlgorithm,
    extractable: boolean,
    keyUsages: string[],
  ): Promise<CryptoKey>;

  sign(
    algorithm: AlgorithmIdentifier | RsaPssParams | EcdsaParams,
    key: CryptoKey,
    data: BufferSource,
  ): Promise<ArrayBuffer>;

  unwrapKey(
    format: string,
    wrappedKey: BufferSource,
    unwrappingKey: CryptoKey,
    unwrapAlgorithm:
      | AlgorithmIdentifier
      | RsaOaepParams
      | AesCtrParams
      | AesCbcParams
      | AesGcmParams,
    unwrappedKeyAlgorithm:
      | AlgorithmIdentifier
      | RsaHashedImportParams
      | EcKeyImportParams
      | HmacImportParams
      | AesKeyAlgorithm,
    extractable: boolean,
    keyUsages: string[],
  ): Promise<CryptoKey>;

  verify(
    algorithm: AlgorithmIdentifier | RsaPssParams | EcdsaParams,
    key: CryptoKey,
    signature: BufferSource,
    data: BufferSource,
  ): Promise<boolean>;

  wrapKey(
    format: string,
    key: CryptoKey,
    wrappingKey: CryptoKey,
    wrapAlgorithm:
      | AlgorithmIdentifier
      | RsaOaepParams
      | AesCtrParams
      | AesCbcParams
      | AesGcmParams,
  ): Promise<ArrayBuffer>;
}

interface Window {
  scrollCategories: (direction: number) => void;
  startSession: () => void;
  clearAllApiKeys: () => void;
  toggleApiKeyManager: () => void;
  toggleSidebar: () => void;
  toggleChatFiles: () => void;
  showReconfigureModal: () => void;
  retryWithNewApiKey: () => void;
  selectCategoryChip: (element: HTMLElement, category: string) => void;
  copyApiKey: (key: string) => void;
  onModelProviderChange: (modelType: string) => void;
  deleteModalApiKey: (key: string) => void;
  updateMissingCapabilities: () => void;
  toggleMenuSection: (sectionId: string) => void;
  removeAttachment: (id: string) => void;
  toggleMenuOption: (optionNumber: number, optionText: string) => void;
  closeTab: (tabId: number, event: Event) => void;
  showEngineSelection: () => void;
  closeModal: () => void;
  applyFilters: () => void;
}

declare module "*.module.css" {
  const classes: { [key: string]: string };
  export = classes;
}

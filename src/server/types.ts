export class MyPlatformError extends Error {
  constructor(
    message: string,
    public readonly code: MyPlatformErrorCode,
  ) {
    super(message);
    this.name = "MyPlatformError";
  }
}

export enum MyPlatformErrorCode {
  UNSUPPORTED_FILE_TYPE = "UNSUPPORTED_FILE_TYPE",
  INVALID_INPUT = "INVALID_INPUT",
  NOT_IMPLEMENTED = "NOT_IMPLEMENTED",
}

type TranslationDetails = {
  displayName: string;
  description: string;
};

type Translations = Record<string, TranslationDetails>;

export type TagConfig = {
  icon: string;
  translations: Translations;
};

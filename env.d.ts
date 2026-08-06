/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly SITE_URL: string;
  readonly ADSENSE_CLIENT: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

import type { BrowserContext } from "@playwright/test";

/** Pre-seed the blockora-session cookie so tests start authenticated. */
export async function seedSession(
  context: BrowserContext,
  baseURL: string
): Promise<void> {
  await context.addCookies([
    {
      name: "blockora-session",
      value: "1",
      url: baseURL,
    },
  ]);
}

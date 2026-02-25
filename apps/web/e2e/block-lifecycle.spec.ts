import { test, expect } from "@playwright/test";
import { seedSession } from "./helpers";

test.describe("Block Lifecycle", () => {
  test.beforeEach(async ({ page, baseURL, context }) => {
    await seedSession(context, baseURL!);
    await page.goto("/");
    await expect(
      page.getByRole("heading", { name: "Your Blocks" })
    ).toBeVisible();
  });

  test("creates a new block and it appears at the top of the active grid", async ({
    page,
  }) => {
    await page.getByRole("button", { name: "Create Block" }).click();

    await page.getByRole("dialog").getByLabel("Title").fill("E2E Test Block");
    await page
      .getByRole("dialog")
      .getByLabel("Content")
      .fill("Playwright created this block");
    await page
      .getByRole("dialog")
      .getByRole("button", { name: "Create Block" })
      .click();

    await expect(
      page.locator("article").filter({ hasText: "E2E Test Block" })
    ).toBeVisible();
  });

  test("archives a block — it moves from active to the archived list", async ({
    page,
  }) => {
    // Create a block to archive
    await page.getByRole("button", { name: "Create Block" }).click();
    await page.getByRole("dialog").getByLabel("Title").fill("E2E Archive Test");
    await page
      .getByRole("dialog")
      .getByLabel("Content")
      .fill("Block to be archived");
    await page
      .getByRole("dialog")
      .getByRole("button", { name: "Create Block" })
      .click();

    // Open the block detail sheet
    await page
      .locator("article")
      .filter({ hasText: "E2E Archive Test" })
      .click();

    // Archive it
    await page.getByRole("button", { name: "Archive", exact: true }).click();

    // Block should be gone from the active grid
    await expect(
      page.locator("article").filter({ hasText: "E2E Archive Test" })
    ).not.toBeVisible();

    // Switch to Archived tab and verify it's there
    await page.getByRole("button", { name: /Archived/ }).click();
    await expect(
      page.locator("article").filter({ hasText: "E2E Archive Test" })
    ).toBeVisible();
  });

  test("restores an archived block back to the active list", async ({
    page,
  }) => {
    // Create and archive a block
    await page.getByRole("button", { name: "Create Block" }).click();
    await page
      .getByRole("dialog")
      .getByLabel("Title")
      .fill("E2E Restore Test");
    await page
      .getByRole("dialog")
      .getByLabel("Content")
      .fill("Block to be restored");
    await page
      .getByRole("dialog")
      .getByRole("button", { name: "Create Block" })
      .click();

    await page
      .locator("article")
      .filter({ hasText: "E2E Restore Test" })
      .click();
    await page.getByRole("button", { name: "Archive", exact: true }).click();

    // Switch to Archived tab and restore
    await page.getByRole("button", { name: /Archived/ }).click();
    await page
      .locator("article")
      .filter({ hasText: "E2E Restore Test" })
      .click();
    await page.getByRole("button", { name: "Restore" }).click();

    // Switch back to Active and verify block is there
    await page.getByRole("button", { name: /Active/ }).click();
    await expect(
      page.locator("article").filter({ hasText: "E2E Restore Test" })
    ).toBeVisible();
  });
});

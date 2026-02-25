import { test, expect } from "@playwright/test";
import { seedSession } from "./helpers";

test.describe("Profile Page", () => {
  test.beforeEach(async ({ page, baseURL, context }) => {
    await seedSession(context, baseURL!);
    await page.goto("/profile");
    await expect(
      page.getByRole("heading", { name: "Profile Settings" })
    ).toBeVisible();
  });

  test("loads with pre-filled name and email", async ({ page }) => {
    await expect(page.getByLabel("Name")).toHaveValue("Demo User");
    await expect(page.getByLabel("Email")).toHaveValue(
      "skaylet2007@gmail.com"
    );
  });

  test("shows success notification after saving", async ({ page }) => {
    await page.getByLabel("Name").fill("Updated Name");
    await page.getByRole("button", { name: "Save Changes" }).click();

    await expect(page.getByText("Profile updated successfully.")).toBeVisible();
  });

  test("reverts field to original value after cancel", async ({ page }) => {
    await page.getByLabel("Name").fill("Temporary Name");
    await page.getByRole("button", { name: "Cancel" }).click();

    await expect(page.getByLabel("Name")).toHaveValue("Demo User");
  });
});

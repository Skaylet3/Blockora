import { test, expect } from "@playwright/test";
import { seedSession } from "./helpers";

const mockProfile = {
  userId: "test-user-id",
  email: "test@example.com",
  displayName: "Demo User",
};

test.describe("Profile Page", () => {
  test.beforeEach(async ({ page, baseURL, context }) => {
    // Mock API calls — ProfileForm fetches /auth/me client-side (JWT is in
    // localStorage, not available to seedSession which only sets the SSR cookie).
    await page.route("**/auth/me", (route) =>
      route.fulfill({ json: mockProfile })
    );
    await page.route("**/users/me", (route) =>
      route.fulfill({
        json: { ...mockProfile, displayName: "Updated Name" },
      })
    );

    await seedSession(context, baseURL!);
    await page.goto("/profile");
    await expect(
      page.getByRole("heading", { name: "Profile Settings" })
    ).toBeVisible();
  });

  test("loads with pre-filled name and email", async ({ page }) => {
    await expect(page.getByLabel("Name")).toHaveValue("Demo User");
    await expect(page.getByLabel("Email")).toHaveValue("test@example.com");
  });

  test("shows success notification after saving", async ({ page }) => {
    await page.getByLabel("Name").fill("Updated Name");
    await page.getByRole("button", { name: "Save Changes" }).click();

    await expect(page.getByText("Profile saved.")).toBeVisible();
  });

  test("reverts field to original value after cancel", async ({ page }) => {
    await page.getByLabel("Name").fill("Temporary Name");
    await page.getByRole("button", { name: "Cancel" }).click();

    await expect(page.getByLabel("Name")).toHaveValue("Demo User");
  });
});

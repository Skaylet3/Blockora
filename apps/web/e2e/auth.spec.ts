import { test, expect } from "@playwright/test";
import { seedSession } from "./helpers";

test.describe("Authentication Flow", () => {
  test.beforeEach(async ({ context }) => {
    // Always start unauthenticated — clear any cookie from previous tests
    await context.clearCookies();
  });

  test("redirects unauthenticated visitor from / to /login", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(page).toHaveURL("/login");
  });

  test("signs in with any credentials and lands on the dashboard", async ({
    page,
  }) => {
    await page.goto("/login");
    await page.getByLabel("Email").fill("demo@example.com");
    await page.getByLabel("Password").fill("password");
    await page.getByRole("button", { name: "Sign in" }).click();

    await expect(page).toHaveURL("/");
    await expect(
      page.getByRole("heading", { name: "Your Blocks" })
    ).toBeVisible();
  });

  test("signs out and dashboard becomes inaccessible", async ({
    page,
    baseURL,
  }) => {
    await seedSession(page.context(), baseURL!);
    await page.goto("/");

    // Verify we're authenticated
    await expect(
      page.getByRole("heading", { name: "Your Blocks" })
    ).toBeVisible();

    // Sign out
    await page.getByRole("button", { name: "Sign out" }).click();
    await expect(page).toHaveURL("/login");

    // Dashboard no longer accessible
    await page.goto("/");
    await expect(page).toHaveURL("/login");
  });
});

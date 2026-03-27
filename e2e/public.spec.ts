import { expect, test } from "@playwright/test";

test("homepage renders the public story", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByText("Track five scores. Back a cause.")).toBeVisible();
  await expect(page.getByRole("link", { name: /join now/i })).toBeVisible();
});

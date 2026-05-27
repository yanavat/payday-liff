import { expect, test } from "@playwright/test";

test("employee activation, request PIN confirmation, HR login, and logout", async ({
  page,
}) => {
  await page.goto("/en");

  await page.getByRole("button", { name: "First-time Activation" }).click();
  await page.getByLabel("Phone number").fill("0812345678");
  await page.getByLabel("Invitation code").fill("123456");
  await page.getByLabel("New PIN", { exact: true }).fill("123456");
  await page.getByLabel("Confirm new PIN", { exact: true }).fill("123456");
  await page.getByRole("button", { name: "Activate account" }).click();

  await expect(page.getByText("Available Balance")).toBeVisible();
  await page.goto("/en/request");
  await page.getByRole("button", { name: "Next →" }).click();
  await expect(page.getByText("Summary")).toBeVisible();
  await page.getByRole("button", { name: "Confirm" }).click();
  await page.getByLabel("Transaction PIN").fill("123456");
  await page.getByRole("button", { name: "Confirm with PIN" }).click();
  await expect(page.getByText("Request Submitted!")).toBeVisible();

  await page.goto("/en/hr/login");
  await page.getByLabel("Password").fill("demo1234");
  const hrLoginResponse = page.waitForResponse("**/api/auth/hr/login");
  await page.getByRole("button", { name: "Sign In" }).click();
  await expect((await hrLoginResponse).status()).toBe(200);
  await expect(page).toHaveURL(/\/hr\/dashboard/);

  await page.getByRole("button", { name: "Settings" }).click();
  await page.getByRole("menuitem", { name: "Log out" }).click();
  await expect(page).toHaveURL(/\/hr\/login/);
});

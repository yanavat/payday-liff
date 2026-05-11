import { describe, expect, it } from "vitest";

import { loadLocaleMessages } from "@/lib/i18n/load-locale-messages";

describe("LocaleLayout message loading", () => {
  it("loads English messages for the English locale route", async () => {
    const messages = await loadLocaleMessages("en");

    expect(messages.home.heroTitle).toBe("Available Balance");
    expect(messages.home.heroTitle).not.toBe("วงเงินที่เบิกได้");
  });

  it("loads Myanmar messages for the Myanmar locale route", async () => {
    const messages = await loadLocaleMessages("my");

    expect(messages.nav.profile).toBe("ပရိုဖိုင်");
  });
});

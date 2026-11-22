import { afterEach, describe, expect, it } from "vitest";
import { availableLocales, i18n, t } from ".";
import en from "./locales/en.json";
import ptBR from "./locales/pt-BR.json";

const sources = import.meta.glob<string>(["../**/*.tsx", "../**/*.ts", "!../**/*.test.ts", "!../**/*.test.tsx"], {
  query: "?raw",
  import: "default",
  eager: true,
});

const PLURAL_SUFFIXES = ["zero", "one", "two", "few", "many", "other"];

function hasMessage(key: string) {
  return hasCatalogMessage(en, key);
}

function hasCatalogMessage(catalog: unknown, key: string) {
  const path = key.split(".");
  const leaf = path.pop() as string;
  let node: unknown = catalog;
  for (const segment of path) {
    if (!node || typeof node !== "object") return false;
    node = (node as Record<string, unknown>)[segment];
  }
  if (!node || typeof node !== "object") return false;
  const messages = node as Record<string, unknown>;
  if (typeof messages[leaf] === "string") return true;
  return PLURAL_SUFFIXES.some((suffix) => typeof messages[`${leaf}_${suffix}`] === "string");
}

describe("translation keys", () => {
  afterEach(async () => {
    await i18n.changeLanguage("en");
  });

  it("defines every literal t() key in the English catalog", () => {
    const missing: string[] = [];
    for (const [file, source] of Object.entries(sources)) {
      for (const match of source.matchAll(/\bt\(\s*"([A-Za-z0-9_.-]+)"/g)) {
        if (!hasMessage(match[1])) missing.push(`${file}: ${match[1]}`);
      }
    }
    expect(missing).toEqual([]);
  });

  it("defines every literal navigation t() key in the Brazilian Portuguese catalog", () => {
    const missing: string[] = [];
    for (const [file, source] of Object.entries(sources)) {
      for (const match of source.matchAll(/\bt\(\s*"(nav\.[A-Za-z0-9_.-]+)"/g)) {
        if (!hasCatalogMessage(ptBR, match[1])) missing.push(`${file}: ${match[1]}`);
      }
    }
    expect(missing).toEqual([]);
  });

  it("offers Brazilian Portuguese after the navigation translation batch", () => {
    expect(availableLocales).toContain("pt-BR");
  });

  it("renders navigation and account menu copy in Brazilian Portuguese", async () => {
    await i18n.changeLanguage("pt-BR");
    expect(t("nav.tasks")).toBe("Tarefas");
    expect(t("nav.section.collapse", { label: "Tarefas" })).toBe("Recolher Tarefas");
    expect(t("nav.account.signOut")).toBe("Sair");
    expect(t("nav.organizationMenu.title")).toBe("Empresas");
  });
});

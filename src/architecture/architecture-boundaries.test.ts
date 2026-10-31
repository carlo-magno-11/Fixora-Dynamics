/// <reference types="vite/client" />

import { describe, expect, it } from "vitest";

const moduleSources = import.meta.glob("/src/modules/**/*.{ts,tsx}", {
  eager: true,
  query: "?raw",
  import: "default",
}) as Record<string, string>;

function normalizedImportPath(sourcePath: string, specifier: string): string | null {
  if (!specifier.startsWith(".")) return null;

  const segments = sourcePath.replace(/^\//, "").split("/").slice(0, -1);
  for (const segment of specifier.split("/")) {
    if (segment === "." || segment === "") continue;
    if (segment === "..") {
      segments.pop();
    } else {
      segments.push(segment);
    }
  }

  return segments.join("/");
}

describe("architecture boundaries", () => {
  it("keeps module dependencies flowing inward and prevents UI/infrastructure leaks", () => {
    const violations: string[] = [];

    for (const [absolutePath, source] of Object.entries(moduleSources)) {
      if (/\.test\.tsx?$/.test(absolutePath)) continue;

      const sourcePath = absolutePath.replace(/^\//, "");
      const segments = sourcePath.split("/");
      if (segments[0] !== "src" || segments[1] !== "modules" || segments.length < 4) continue;

      const sourceModule = segments[2];
      const sourceLayer = segments[3];
      if (!["domain", "application", "infrastructure", "ui"].includes(sourceLayer)) continue;

      const specifiers = new Set<string>();
      for (const match of source.matchAll(/\bfrom\s*["']([^"']+)["']/g)) {
        specifiers.add(match[1]);
      }
      for (const match of source.matchAll(/\bimport\s*["']([^"']+)["']/g)) {
        specifiers.add(match[1]);
      }
      for (const match of source.matchAll(/\bimport\s*\(\s*["']([^"']+)["']\s*\)/g)) {
        specifiers.add(match[1]);
      }

      if (
        ["domain", "application"].includes(sourceLayer) &&
        /\b(window|document|localStorage|sessionStorage|fetch|XMLHttpRequest)\b/.test(source)
      ) {
        violations.push(`${sourcePath} uses a browser or network global outside infrastructure/UI`);
      }

      if (sourceLayer === "domain" && /\bcrypto\b/.test(source)) {
        violations.push(`${sourcePath} uses a global cryptography API instead of an injected port`);
      }

      for (const specifier of specifiers) {
        const targetPath = normalizedImportPath(sourcePath, specifier);
        const targetSegments = targetPath?.split("/") ?? [];
        const targetModule = targetSegments[0] === "src" && targetSegments[1] === "modules"
          ? targetSegments[2]
          : null;
        const targetLayer = targetModule ? targetSegments[3] : null;

        if (
          ["domain", "application"].includes(sourceLayer) &&
          /^(react|react-dom|@supabase\/)/.test(specifier)
        ) {
          violations.push(`${sourcePath} imports runtime/UI dependency ${specifier}`);
        }

        if (sourceLayer === "domain" && targetLayer && ["application", "infrastructure", "ui"].includes(targetLayer)) {
          violations.push(`${sourcePath} depends outward on ${targetPath}`);
        }

        if (
          ["domain", "application"].includes(sourceLayer) &&
          targetPath?.startsWith("src/shared/infrastructure/")
        ) {
          violations.push(`${sourcePath} depends on shared infrastructure ${targetPath}`);
        }

        if (sourceLayer === "application" && targetLayer && ["infrastructure", "ui"].includes(targetLayer)) {
          violations.push(`${sourcePath} bypasses a port and depends on ${targetPath}`);
        }

        if (sourceLayer === "infrastructure" && targetLayer === "ui") {
          violations.push(`${sourcePath} imports presentation code from ${targetPath}`);
        }

        if (sourceLayer === "ui" && targetLayer === "infrastructure") {
          violations.push(`${sourcePath} bypasses application contracts and imports ${targetPath}`);
        }

        if (
          sourceModule !== targetModule &&
          targetModule !== null &&
          ["ui", "infrastructure"].includes(targetLayer ?? "")
        ) {
          violations.push(`${sourcePath} imports another module's private layer ${targetPath}`);
        }

        if (targetPath?.startsWith("src/app/")) {
          violations.push(`${sourcePath} imports the application composition layer ${targetPath}`);
        }
      }
    }

    expect(violations, violations.join("\n")).toEqual([]);
  });
});

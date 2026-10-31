import { readdirSync, readFileSync } from "node:fs";
import { dirname, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const sourceRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");

function collectSourceFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) return collectSourceFiles(path);
    if (entry.isFile() && /\.tsx?$/.test(entry.name) && !/\.test\.tsx?$/.test(entry.name)) {
      return [path];
    }
    return [];
  });
}

function readImportSpecifiers(source: string): string[] {
  const specifiers = new Set<string>();
  const patterns = [
    /\bfrom\s*["']([^"']+)["']/g,
    /\bimport\s*["']([^"']+)["']/g,
    /\bimport\s*\(\s*["']([^"']+)["']\s*\)/g,
  ];

  for (const pattern of patterns) {
    for (const match of source.matchAll(pattern)) {
      specifiers.add(match[1]);
    }
  }

  return [...specifiers];
}

function normalizedSourcePath(path: string): string {
  return relative(sourceRoot, path).split(sep).join("/");
}

function normalizedTargetPath(sourceFile: string, specifier: string): string | null {
  if (!specifier.startsWith(".")) return null;
  return normalizedSourcePath(resolve(dirname(sourceFile), specifier));
}

describe("architecture boundaries", () => {
  it("keeps module dependencies flowing inward and prevents UI/infrastructure leaks", () => {
    const violations: string[] = [];

    for (const file of collectSourceFiles(sourceRoot)) {
      const sourcePath = normalizedSourcePath(file);
      const segments = sourcePath.split("/");
      if (segments[0] !== "modules" || segments.length < 3) continue;

      const sourceModule = segments[1];
      const sourceLayer = segments[2];
      if (!["domain", "application", "infrastructure", "ui"].includes(sourceLayer)) continue;

      const source = readFileSync(file, "utf8");
      for (const specifier of readImportSpecifiers(source)) {
        const targetPath = normalizedTargetPath(file, specifier);
        const targetSegments = targetPath?.split("/") ?? [];
        const targetModule = targetSegments[0] === "modules" ? targetSegments[1] : null;
        const targetLayer = targetModule ? targetSegments[2] : null;

        if (
          ["domain", "application"].includes(sourceLayer) &&
          /^(react|react-dom|@supabase\/)/.test(specifier)
        ) {
          violations.push(`${sourcePath} imports runtime/UI dependency ${specifier}`);
        }

        if (sourceLayer === "domain" && targetLayer && ["application", "infrastructure", "ui"].includes(targetLayer)) {
          violations.push(`${sourcePath} depends outward on ${targetPath}`);
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

        if (targetPath && targetSegments[0] === "app") {
          violations.push(`${sourcePath} imports the application composition layer ${targetPath}`);
        }
      }
    }

    expect(violations, violations.join("\n")).toEqual([]);
  });
});

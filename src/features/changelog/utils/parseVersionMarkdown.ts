import type { VersionData, VersionRelease } from "../types";

/**
 * Parse version.md file into structured data
 */
export function parseVersionMarkdown(markdown: string): VersionData {
  const lines = markdown.split("\n");
  let current = "0.0.0";
  let releaseDate = "";
  const changelog: VersionRelease[] = [];

  // Parse frontmatter
  let inFrontmatter = false;
  let contentStartIndex = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line === "---") {
      if (!inFrontmatter) {
        inFrontmatter = true;
      } else {
        contentStartIndex = i + 1;
        break;
      }
    } else if (inFrontmatter) {
      const match = line.match(/^(\w+):\s*"?([^"]+)"?$/);
      if (match) {
        if (match[1] === "current") current = match[2];
        if (match[1] === "releaseDate") releaseDate = match[2];
      }
    }
  }

  // Parse changelog sections
  let currentRelease: VersionRelease | null = null;
  let currentType: "feature" | "improvement" | "fix" = "feature";

  for (let i = contentStartIndex; i < lines.length; i++) {
    const line = lines[i];

    // Version header: ## 1.0.0 (2025-12-01)
    const versionMatch = line.match(/^##\s+(\d+\.\d+\.\d+)\s*\((\d{4}-\d{2}-\d{2})\)/);
    if (versionMatch) {
      if (currentRelease) {
        changelog.push(currentRelease);
      }
      currentRelease = {
        version: versionMatch[1],
        date: versionMatch[2],
        highlights: [],
      };
      continue;
    }

    // Type header: ### New, ### Improved, ### Fixed
    const typeMatch = line.match(/^###\s+(New|Improved|Fixed)/i);
    if (typeMatch) {
      const typeMap: Record<string, "feature" | "improvement" | "fix"> = {
        new: "feature",
        improved: "improvement",
        fixed: "fix",
      };
      currentType = typeMap[typeMatch[1].toLowerCase()] || "feature";
      continue;
    }

    // List item: - Some text
    const itemMatch = line.match(/^-\s+(.+)$/);
    if (itemMatch && currentRelease) {
      currentRelease.highlights.push({
        type: currentType,
        text: itemMatch[1],
      });
    }
  }

  if (currentRelease) {
    changelog.push(currentRelease);
  }

  return { current, releaseDate, changelog };
}

/**
 * Get statistics from version data
 */
export function getVersionStats(data: VersionData) {
  const totalVersions = data.changelog.length;
  let totalFeatures = 0;
  let totalImprovements = 0;
  let totalFixes = 0;

  data.changelog.forEach(release => {
    release.highlights.forEach(h => {
      if (h.type === "feature") totalFeatures++;
      else if (h.type === "improvement") totalImprovements++;
      else if (h.type === "fix") totalFixes++;
    });
  });

  return {
    totalVersions,
    totalFeatures,
    totalImprovements,
    totalFixes,
    totalChanges: totalFeatures + totalImprovements + totalFixes,
  };
}

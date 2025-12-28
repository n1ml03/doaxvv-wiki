export interface VersionHighlight {
  type: "feature";
  text: string;
  description?: string;
}

export interface VersionRelease {
  version: string;
  date: string;
  title?: string;
  summary?: string;
  highlights: VersionHighlight[];
}

export interface VersionData {
  current: string;
  releaseDate: string;
  changelog: VersionRelease[];
}

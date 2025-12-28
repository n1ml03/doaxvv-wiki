import { useState } from "react";
import { Input } from "@/shared/components/ui/input";
import { Search } from "lucide-react";
import { useTranslation } from "@/shared/hooks/useTranslation";
import type { VersionRelease } from "../types";
import VersionCard from "./VersionCard";

interface VersionTimelineProps {
  releases: VersionRelease[];
}

const VersionTimeline = ({ releases }: VersionTimelineProps) => {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");

  // Filter releases based on search query
  const filteredReleases = releases.filter(release => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    
    // Search in version number
    if (release.version.includes(query)) return true;
    
    // Search in highlights
    return release.highlights.some(h => 
      h.text.toLowerCase().includes(query)
    );
  });

  // Only show releases with features
  const displayReleases = filteredReleases.filter(release => 
    release.highlights.some(h => h.type === "feature")
  );

  return (
    <div className="space-y-6">
      {/* Search Control */}
      <div className="relative w-full">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={t("changelog.searchPlaceholder")}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Timeline */}
      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border hidden md:block" />
        
        {/* Version cards */}
        <div className="space-y-6">
          {displayReleases.length > 0 ? (
            displayReleases.map((release, idx) => (
              <div key={release.version} className="relative md:pl-12">
                {/* Timeline dot */}
                <div className="absolute left-2.5 top-6 h-3 w-3 rounded-full bg-primary border-2 border-background hidden md:block" />
                <VersionCard 
                  release={release} 
                  isLatest={idx === 0}
                />
              </div>
            ))
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              {t("changelog.noResults")}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VersionTimeline;

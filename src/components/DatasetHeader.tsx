import { Heart, UserPlus, Download, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function DatasetHeader() {
  return (
    <header className="bg-card border-b border-border">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div>
              <h1 className="text-2xl font-semibold text-foreground">
                <span className="text-muted-foreground">Datasets:</span>{" "}
                <span className="text-primary">{"{{organization}}"}</span>
                <span className="text-foreground"> / </span>
                <span className="text-primary">{"{{dataset_name}}"}</span>
              </h1>
              <div className="flex items-center space-x-2 mt-2">
                <Badge variant="secondary" className="text-xs">
                  {"{{modality_1}}"}
                </Badge>
                <Badge variant="secondary" className="text-xs">
                  {"{{modality_2}}"}
                </Badge>
                <Badge variant="secondary" className="text-xs">
                  {"{{num_rows}}"} rows
                </Badge>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <Button variant="outline" size="sm" className="gap-2">
              <Heart className="h-4 w-4" />
              Like
              <Badge variant="secondary" className="ml-1">{"{{likes_count}}"}</Badge>
            </Button>
            <Button variant="outline" size="sm" className="gap-2">
              <UserPlus className="h-4 w-4" />
              Follow
              <Badge variant="secondary" className="ml-1">{"{{followers_count}}"}</Badge>
            </Button>
            <Button variant="outline" size="sm" className="gap-2">
              <Download className="h-4 w-4" />
              Download
            </Button>
            <Button variant="outline" size="sm" className="gap-2">
              <ExternalLink className="h-4 w-4" />
              Dataset card
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
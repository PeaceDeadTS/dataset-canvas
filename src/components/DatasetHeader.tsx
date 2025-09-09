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
                <span className="text-primary">yandex</span>
                <span className="text-foreground"> / </span>
                <span className="text-primary">alchemist</span>
              </h1>
              <div className="flex items-center space-x-2 mt-2">
                <Badge variant="secondary" className="text-xs">
                  Computer Vision
                </Badge>
                <Badge variant="secondary" className="text-xs">
                  Image-to-Text
                </Badge>
                <Badge variant="secondary" className="text-xs">
                  3.35k rows
                </Badge>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <Button variant="outline" size="sm" className="gap-2">
              <Heart className="h-4 w-4" />
              Like
              <Badge variant="secondary" className="ml-1">45</Badge>
            </Button>
            <Button variant="outline" size="sm" className="gap-2">
              <UserPlus className="h-4 w-4" />
              Follow
              <Badge variant="secondary" className="ml-1">586</Badge>
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
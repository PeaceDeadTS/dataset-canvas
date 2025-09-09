import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, ExternalLink, BarChart3, Users } from "lucide-react";

export function DatasetSidebar() {
  return (
    <aside className="w-80 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Dataset Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Rows:</span>
              <div className="font-medium">{"{{num_rows}}"}</div>
            </div>
            <div>
              <span className="text-muted-foreground">Size:</span>
              <div className="font-medium">{"{{file_size}}"}</div>
            </div>
            <div>
              <span className="text-muted-foreground">Format:</span>
              <div className="font-medium">{"{{format}}"}</div>
            </div>
            <div>
              <span className="text-muted-foreground">License:</span>
              <div className="font-medium">{"{{license}}"}</div>
            </div>
          </div>
          
          <div className="pt-2">
            <Button className="w-full gap-2">
              <Download className="h-4 w-4" />
              Use this dataset
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Statistics
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Avg. prompt length:</span>
              <span className="font-medium">{"{{avg_prompt_length}}"} chars</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Image resolution:</span>
              <span className="font-medium">{"{{image_resolution}}"}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Data splits:</span>
              <span className="font-medium">{"{{data_splits}}"}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="h-5 w-5" />
            Models using this dataset
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Fine-tuned models</span>
              <Badge variant="secondary">{"{{models_count}}"}</Badge>
            </div>
            <Button variant="outline" size="sm" className="w-full gap-2">
              <ExternalLink className="h-4 w-4" />
              View all models
            </Button>
          </div>
        </CardContent>
      </Card>
    </aside>
  );
}
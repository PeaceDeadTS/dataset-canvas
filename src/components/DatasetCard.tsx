import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Download, FileText, Image, BarChart3 } from "lucide-react";

export function DatasetCard() {
  return (
    <div className="space-y-6">
      {/* Dataset overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Dataset Overview
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-muted/50 rounded-lg border-l-4 border-muted-foreground/20">
            <p className="text-muted-foreground text-sm leading-relaxed">
              {"{{dataset_description}}"}
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{"{{num_rows}}"}</div>
              <div className="text-sm text-muted-foreground">Total Samples</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{"{{file_size}}"}</div>
              <div className="text-sm text-muted-foreground">Dataset Size</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{"{{image_resolution}}"}</div>
              <div className="text-sm text-muted-foreground">Image Resolution</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{"{{avg_prompt_length}}"}</div>
              <div className="text-sm text-muted-foreground">Avg. Prompt Length</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data distribution placeholder */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Data Distribution
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>{"{{category_1}}"}</span>
                <span>{"{{percentage_1}}"}%</span>
              </div>
              <Progress value={45} className="h-2" />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>{"{{category_2}}"}</span>
                <span>{"{{percentage_2}}"}%</span>
              </div>
              <Progress value={25} className="h-2" />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>{"{{category_3}}"}</span>
                <span>{"{{percentage_3}}"}%</span>
              </div>
              <Progress value={20} className="h-2" />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>{"{{category_4}}"}</span>
                <span>{"{{percentage_4}}"}%</span>
              </div>
              <Progress value={10} className="h-2" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Download options placeholder */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Download Dataset
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3">
            <div className="flex items-center justify-between p-3 border border-border rounded-lg">
              <div className="flex items-center gap-3">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <div>
                  <div className="font-medium">{"{{file_name}}"}.parquet</div>
                  <div className="text-sm text-muted-foreground">{"{{file_size}}"}</div>
                </div>
              </div>
              <Button variant="outline" size="sm">
                Download
              </Button>
            </div>
            
            <div className="flex items-center justify-between p-3 border border-border rounded-lg">
              <div className="flex items-center gap-3">
                <Image className="h-4 w-4 text-muted-foreground" />
                <div>
                  <div className="font-medium">Images (ZIP)</div>
                  <div className="text-sm text-muted-foreground">{"{{images_size}}"}</div>
                </div>
              </div>
              <Button variant="outline" size="sm">
                Download
              </Button>
            </div>
          </div>
          
          <div className="pt-2">
            <Button className="w-full">
              Download entire dataset
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* License and citation placeholder */}
      <Card>
        <CardHeader>
          <CardTitle>License & Citation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Badge variant="secondary" className="mb-2">{"{{license}}"}</Badge>
            <div className="p-3 bg-muted/50 rounded text-sm text-muted-foreground">
              {"{{license_description}}"}
            </div>
          </div>
          
          <div className="bg-muted p-4 rounded-lg">
            <code className="text-sm text-muted-foreground">
              @dataset{"{"}{"{{citation_key}}"},<br />
              &nbsp;&nbsp;title={"{"}{"{{dataset_title}}"}{"}"},<br />
              &nbsp;&nbsp;author={"{"}{"{{author}}"}{"}"},<br />
              &nbsp;&nbsp;year={"{"}{"{{year}}"}{"}"},<br />
              &nbsp;&nbsp;url={"{"}{"{{dataset_url}}"}{"}"}{"}"}<br />
            </code>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
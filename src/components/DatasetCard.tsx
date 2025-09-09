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
          <p className="text-foreground leading-relaxed">
            The Alchemist dataset is a curated collection of high-quality image-text pairs designed for training 
            and evaluating computer vision models. This dataset contains realistic photos paired with detailed 
            descriptive prompts, making it ideal for image-to-text and text-to-image applications.
          </p>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">3,354</div>
              <div className="text-sm text-muted-foreground">Total Samples</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">4.2 GB</div>
              <div className="text-sm text-muted-foreground">Dataset Size</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">512×512</div>
              <div className="text-sm text-muted-foreground">Image Resolution</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">47</div>
              <div className="text-sm text-muted-foreground">Avg. Prompt Length</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data distribution */}
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
                <span>Portrait images</span>
                <span>45%</span>
              </div>
              <Progress value={45} className="h-2" />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Landscape scenes</span>
                <span>25%</span>
              </div>
              <Progress value={25} className="h-2" />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Object photography</span>
                <span>20%</span>
              </div>
              <Progress value={20} className="h-2" />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Architecture</span>
                <span>10%</span>
              </div>
              <Progress value={10} className="h-2" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Download options */}
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
                  <div className="font-medium">train-00000-of-00001.parquet</div>
                  <div className="text-sm text-muted-foreground">4.2 GB</div>
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
                  <div className="text-sm text-muted-foreground">3.8 GB</div>
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

      {/* License and citation */}
      <Card>
        <CardHeader>
          <CardTitle>License & Citation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Badge variant="secondary" className="mb-2">Apache 2.0</Badge>
            <p className="text-sm text-muted-foreground">
              This dataset is released under the Apache 2.0 license. You are free to use, modify, 
              and distribute this dataset for both commercial and non-commercial purposes.
            </p>
          </div>
          
          <div className="bg-muted p-4 rounded-lg">
            <code className="text-sm">
              @dataset{"{"}yandex_alchemist_2024,<br />
              &nbsp;&nbsp;title={"{"}Alchemist: A Curated Image-Text Dataset{"}"},<br />
              &nbsp;&nbsp;author={"{"}Yandex Research Team{"}"},<br />
              &nbsp;&nbsp;year={"{"}2024{"}"},<br />
              &nbsp;&nbsp;url={"{"}https://huggingface.co/datasets/yandex/alchemist{"}"}{"}"}<br />
            </code>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
import { useState } from "react";
import { ExternalLink, Copy, Eye, Image } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface DataRow {
  id: number;
  img_key: string;
  url: string;
  prompt: string;
  thumbnail: string;
}

interface DataTableProps {
  data: DataRow[];
}

export function DataTable({ data }: DataTableProps) {
  const [expandedPrompts, setExpandedPrompts] = useState<Set<number>>(new Set());

  const togglePrompt = (id: number) => {
    const newExpanded = new Set(expandedPrompts);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedPrompts(newExpanded);
  };

  const truncateText = (text: string, maxLength: number = 80) => {
    if (text === "{{prompt_text}}") {
      return "{{prompt_text}}...";
    }
    return text.length > maxLength ? text.slice(0, maxLength) + "..." : text;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <TooltipProvider>
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-table-header border-b border-border">
              <tr>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground w-16">
                  #
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground w-80">
                  img_key
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground w-40">
                  url
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground w-20">
                  image
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                  prompt
                </th>
              </tr>
            </thead>
            <tbody>
              {data.map((row, index) => (
                <tr
                  key={row.id}
                  className={`border-b border-border hover:bg-table-hover transition-colors ${
                    index % 2 === 0 ? "bg-table-row-even" : "bg-table-row-odd"
                  }`}
                >
                  {/* Row number */}
                  <td className="py-3 px-4 text-sm text-muted-foreground">
                    {"{{row_number}}"}
                  </td>
                  
                  {/* Image key */}
                  <td className="py-3 px-4">
                    <div className="flex items-center space-x-2">
                      <code className="text-xs bg-muted px-2 py-1 rounded font-mono">
                        {"{{img_key}}"}
                      </code>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(row.img_key)}
                            className="h-6 w-6 p-0"
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Copy image key</TooltipContent>
                      </Tooltip>
                    </div>
                  </td>
                  
                  {/* URL */}
                  <td className="py-3 px-4">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-muted-foreground truncate max-w-32">
                        {"{{url}}"}
                      </span>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                          >
                            <ExternalLink className="h-3 w-3" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Open in new tab</TooltipContent>
                      </Tooltip>
                    </div>
                  </td>
                  
                  {/* Thumbnail placeholder */}
                  <td className="py-3 px-4">
                    <div className="relative group">
                      <div className="w-12 h-12 bg-muted border border-border rounded flex items-center justify-center">
                        <Image className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded flex items-center justify-center">
                        <Eye className="h-4 w-4 text-white" />
                      </div>
                    </div>
                  </td>
                  
                  {/* Prompt placeholder */}
                  <td className="py-3 px-4">
                    <div className="space-y-2">
                      <p className="text-sm text-foreground leading-relaxed">
                        {expandedPrompts.has(row.id) ? "{{prompt_text}}" : "{{prompt_text}}..."}
                      </p>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => togglePrompt(row.id)}
                        className="h-6 text-xs text-primary hover:text-primary-hover"
                      >
                        {expandedPrompts.has(row.id) ? "Show less" : "Show more"}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </TooltipProvider>
  );
}
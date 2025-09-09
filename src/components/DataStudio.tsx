import { useState } from "react";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "./DataTable";

// Mock data structure
const generateMockData = () => {
  const mockEntries = [
    {
      id: 1468,
      img_key: "d2f333683efdea33acc15f41c2024e05",
      url: "https://i.pinimg.com/736x/f1/43a/46c/f143a46ce6c.jpg",
      prompt: "a realistic photo of a sad old man with a beard and a turban",
      thumbnail: "/api/placeholder/64/64"
    },
    {
      id: 2738,
      img_key: "ccd217a3140c09c1fec13e4412c05ef",
      url: "https://i.imgur.com/GnBTZw.webp",
      prompt: "a woman with blonde hair, wearing a light pink lace dress, she has a flower crown, she is wearing a pearl necklace, she has a delicate face, she has a soft and gentle look, she...",
      thumbnail: "/api/placeholder/64/64"
    },
    {
      id: 178,
      img_key: "4b99182f8407826667780fcf51dc5685",
      url: "https://pinterest.com/pin/480196110734552117/",
      prompt: "interior of restaurant in Dubai, luxury, elegant, modern, arabic style, warm lighting, realistic",
      thumbnail: "/api/placeholder/64/64"
    },
    {
      id: 2689,
      img_key: "ef7a9c29bdcc1ccf2514a0218653560e",
      url: "https://i.imgur.com/3T3mdN.webp",
      prompt: "A photo of a beautiful blonde girl, with long hair, wearing a white shirt, with a helmet, in the middle of a street, with some dirt and blood on her face and shirt, looking at th...",
      thumbnail: "/api/placeholder/64/64"
    },
    {
      id: 2118,
      img_key: "a8d99dcfe899482e8c8a5fd47334dec2",
      url: "https://i.pinimg.com/564x/57/38e/4a9979.jpg",
      prompt: "red maple leaves on the ground, in the style of kodak ektachrome, hasselblad, 8k, detailed",
      thumbnail: "/api/placeholder/64/64"
    }
  ];
  
  return Array.from({ length: 100 }, (_, i) => ({
    ...mockEntries[i % mockEntries.length],
    id: mockEntries[i % mockEntries.length].id + i * 1000
  }));
};

export function DataStudio() {
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [selectedSplit, setSelectedSplit] = useState("train");
  
  const allData = generateMockData();
  const filteredData = allData.filter(item => 
    item.prompt.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.img_key.includes(searchQuery)
  );
  
  const totalPages = Math.ceil(filteredData.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const currentData = filteredData.slice(startIndex, startIndex + rowsPerPage);

  return (
    <div className="space-y-6">
      {/* Split selector and search */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-muted-foreground">Split:</span>
            <Select value={selectedSplit} onValueChange={setSelectedSplit}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="train">train</SelectItem>
                <SelectItem value="validation">validation</SelectItem>
                <SelectItem value="test">test</SelectItem>
              </SelectContent>
            </Select>
            <Badge variant="secondary">3.35k rows</Badge>
          </div>
        </div>
        
        <div className="relative w-80">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search this dataset"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Data table */}
      <DataTable data={currentData} />

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="text-sm text-muted-foreground">Rows per page:</span>
          <Select value={rowsPerPage.toString()} onValueChange={(value) => setRowsPerPage(Number(value))}>
            <SelectTrigger className="w-20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="25">25</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex items-center space-x-2">
          <span className="text-sm text-muted-foreground">
            Showing {startIndex + 1}-{Math.min(startIndex + rowsPerPage, filteredData.length)} of {filteredData.length} results
          </span>
          
          <div className="flex items-center space-x-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const pageNum = i + 1;
              return (
                <Button
                  key={pageNum}
                  variant={currentPage === pageNum ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCurrentPage(pageNum)}
                  className="w-8"
                >
                  {pageNum}
                </Button>
              );
            })}
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
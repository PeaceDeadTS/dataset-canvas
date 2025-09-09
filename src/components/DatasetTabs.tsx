import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DataStudio } from "./DataStudio";
import { DatasetCard } from "./DatasetCard";

export function DatasetTabs() {
  return (
    <Tabs defaultValue="data-studio" className="flex-1">
      <TabsList className="grid w-full grid-cols-2 max-w-md">
        <TabsTrigger value="dataset-card">Dataset card</TabsTrigger>
        <TabsTrigger value="data-studio">Data Studio</TabsTrigger>
      </TabsList>
      
      <TabsContent value="dataset-card" className="mt-6">
        <DatasetCard />
      </TabsContent>
      
      <TabsContent value="data-studio" className="mt-6">
        <DataStudio />
      </TabsContent>
    </Tabs>
  );
}
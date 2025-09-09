import { DatasetHeader } from "@/components/DatasetHeader";
import { DatasetSidebar } from "@/components/DatasetSidebar";
import { DatasetTabs } from "@/components/DatasetTabs";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <DatasetHeader />
      
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex gap-8">
          <DatasetTabs />
          <DatasetSidebar />
        </div>
      </div>
    </div>
  );
};

export default Index;
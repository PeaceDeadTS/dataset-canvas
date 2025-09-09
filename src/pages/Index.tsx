import { useEffect, useState } from 'react';
import axios from 'axios';
import { DatasetHeader } from "@/components/DatasetHeader";
import { DatasetListItem } from "@/components/DatasetListItem";
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { CreateDatasetDialog } from '@/components/CreateDatasetDialog';
import { Dataset } from "@/types";

const API_URL = '/api';

const Index = () => {
    const { user } = useAuth();
    const [datasets, setDatasets] = useState<Dataset[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const handleDatasetCreated = (newDataset: Dataset) => {
        setDatasets(prevDatasets => [newDataset, ...prevDatasets]);
    };

    useEffect(() => {
        const fetchDatasets = async () => {
            try {
                const token = localStorage.getItem('token');
                const headers = token ? { Authorization: `Bearer ${token}` } : {};
                const response = await axios.get(`${API_URL}/datasets`, { headers });
                setDatasets(response.data);
            } catch (err) {
                setError('Failed to fetch datasets.');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchDatasets();
    }, []);

    return (
        <div className="min-h-screen bg-background">
            <DatasetHeader />
            
            <main className="max-w-7xl mx-auto px-6 py-8">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-3xl font-bold">Public Datasets</h1>
                    {user && (user.role === 'Administrator' || user.role === 'Developer') && (
                       <CreateDatasetDialog onDatasetCreated={handleDatasetCreated} />
                    )}
                </div>
                
                {loading && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {Array.from({ length: 6 }).map((_, i) => (
                           <div key={i} className="flex flex-col space-y-3">
                              <Skeleton className="h-[125px] w-full rounded-xl" />
                              <div className="space-y-2">
                                <Skeleton className="h-4 w-[250px]" />
                                <Skeleton className="h-4 w-[200px]" />
                              </div>
                            </div>
                        ))}
                    </div>
                )}
                
                {error && <p className="text-red-500">{error}</p>}

                {!loading && !error && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {datasets.length > 0 ? (
                            datasets.map(dataset => (
                                <DatasetListItem key={dataset.id} dataset={dataset} />
                            ))
                        ) : (
                            <p>No datasets found.</p>
                        )}
                    </div>
                )}
            </main>
        </div>
    );
};

export default Index;
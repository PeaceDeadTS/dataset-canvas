import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";

// Define the types based on our backend entities
interface User {
    id: string;
    username: string;
}

export interface Dataset {
    id: string;
    name: string;
    description?: string;
    isPublic: boolean;
    user: User;
    createdAt: string;
    imageCount?: number;
}

interface DatasetListItemProps {
    dataset: Dataset;
}

export function DatasetListItem({ dataset }: DatasetListItemProps) {
    const creationDate = new Date(dataset.createdAt).toLocaleDateString();

    return (
        <Link to={`/datasets/${dataset.id}`} className="block">
            <Card className="hover:shadow-lg transition-shadow">
                <CardHeader>
                    <CardTitle className="text-lg">{dataset.name}</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground line-clamp-2">{dataset.description || 'No description available.'}</p>
                </CardContent>
                <CardFooter className="flex justify-between text-xs text-muted-foreground">
                    <span>by {dataset.user.username}</span>
                    <span>{new Date(dataset.createdAt).toLocaleDateString()}</span>
                    <span>{dataset.imageCount || 0} items</span>
                </CardFooter>
            </Card>
        </Link>
    );
}

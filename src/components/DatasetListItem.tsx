import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";

// Define the types based on our backend entities
interface DatasetOwner {
    id: string;
    username: string;
}

interface Dataset {
    id: string;
    name: string;
    description?: string;
    isPublic: boolean;
    owner: DatasetOwner;
    createdAt: string;
}

interface DatasetListItemProps {
    dataset: Dataset;
}

export function DatasetListItem({ dataset }: DatasetListItemProps) {
    const creationDate = new Date(dataset.createdAt).toLocaleDateString();

    return (
        <Card>
            <CardHeader>
                <CardTitle>
                    <Link to={`/datasets/${dataset.id}`} className="hover:underline">
                        {dataset.name}
                    </Link>
                </CardTitle>
                <CardDescription>
                    by {dataset.owner.username} on {creationDate}
                </CardDescription>
            </CardHeader>
            <CardContent>
                <p className="line-clamp-2 text-sm text-muted-foreground">
                    {dataset.description || "No description available."}
                </p>
            </CardContent>
            <CardFooter className="flex justify-between">
                <div>
                    {!dataset.isPublic && <Badge variant="secondary">Private</Badge>}
                </div>
                {/* We can add other badges or info here later */}
            </CardFooter>
        </Card>
    );
}

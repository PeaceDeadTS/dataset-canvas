import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { Dataset } from "@/types";
import { useTranslation } from 'react-i18next';

interface DatasetListItemProps {
    dataset: Dataset;
}

export function DatasetListItem({ dataset }: DatasetListItemProps) {
    const { t, i18n } = useTranslation();
    const locale = i18n.language === 'ru' ? 'ru-RU' : 'en-US';
    const creationDate = new Date(dataset.createdAt).toLocaleDateString(locale);

    return (
        <Link to={`/datasets/${dataset.id}`} className="block">
            <Card className="hover:shadow-lg transition-shadow">
                <CardHeader>
                    <CardTitle className="text-lg">{dataset.name}</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground line-clamp-2">{dataset.description || t('pages:datasets.no_description')}</p>
                </CardContent>
                <CardFooter className="flex justify-between text-xs text-muted-foreground">
                    <span>by {dataset.user?.username || t('common:user')}</span>
                    <span>{new Date(dataset.createdAt).toLocaleDateString(locale)}</span>
                    <span>{dataset.imageCount} {t('common:items')}</span>
                </CardFooter>
            </Card>
        </Link>
    );
}

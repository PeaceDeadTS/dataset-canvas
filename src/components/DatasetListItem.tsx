import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { Dataset } from "@/types";
import { useTranslation } from 'react-i18next';
import { extractMarkdownImages, extractFirstParagraph } from '@/lib/utils';
import { useImageDimensions } from '@/hooks/use-image-dimensions';
import { useMemo } from 'react';

interface DatasetListItemProps {
    dataset: Dataset;
}

export function DatasetListItem({ dataset }: DatasetListItemProps) {
    const { t, i18n } = useTranslation();
    const locale = i18n.language === 'ru' ? 'ru-RU' : 'en-US';
    const creationDate = new Date(dataset.createdAt).toLocaleDateString(locale);

    // Извлекаем первое изображение из Markdown
    const firstImage = useMemo(() => {
        if (!dataset.descriptionMarkdown) return null;
        const images = extractMarkdownImages(dataset.descriptionMarkdown);
        return images.length > 0 ? images[0].url : null;
    }, [dataset.descriptionMarkdown]);

    // Проверяем размеры изображения
    const { isValid: isImageValid, loaded: imageLoaded } = useImageDimensions(firstImage, 300);

    // Извлекаем первый абзац текста
    const firstParagraph = useMemo(() => {
        if (dataset.descriptionMarkdown) {
            return extractFirstParagraph(dataset.descriptionMarkdown, 150);
        }
        return dataset.description || t('pages:datasets.no_description');
    }, [dataset.descriptionMarkdown, dataset.description, t]);

    // Показываем изображение, если оно валидно (ширина > 300px)
    const showImage = firstImage && imageLoaded && isImageValid;

    return (
        <Link to={`/datasets/${dataset.id}`} className="block">
            <Card className="hover:shadow-lg transition-shadow overflow-hidden">
                {showImage && (
                    <div className="w-full h-48 overflow-hidden bg-muted">
                        <img 
                            src={firstImage} 
                            alt={dataset.name}
                            className="w-full h-full object-cover"
                        />
                    </div>
                )}
                <CardHeader>
                    <CardTitle className="text-lg">{dataset.name}</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                        {firstParagraph}
                    </p>
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

export interface User {
    id: string;
    username: string;
    email: string; // This was missing and caused the crash
    role: 'Administrator' | 'Developer' | 'User';
    permissions?: string[];
}

export interface Permission {
    id: string;
    name: string;
    displayName: string;
    description?: string;
}

export interface CaptionHistoryEntry {
    id: string;
    oldCaption: string;
    newCaption: string;
    createdAt: string;
    user: {
        id: string;
        username: string;
    } | null;
}

export interface DatasetImage {
    id: number;
    img_key: string;
    row_number: number;
    filename: string;
    url: string;
    width: number;
    height: number;
    prompt: string;
}

export interface DatasetFile {
    id: number;
    filename: string;
    originalName: string;
    mimeType: string;
    size: number;
    description?: string;
    createdAt: string;
    updatedAt: string;
}

export interface Dataset {
    id: string;
    name: string;
    description?: string;
    isPublic: boolean;
    user?: User; // Сделали опциональным для безопасности
    createdAt: string;
    imageCount: number;

    // Properties for the detailed dataset view
    modalities?: string[];
    rowCount?: number;
    likesCount?: number;
    followersCount?: number;
    
    // Для страницы конкретного датасета с пагинацией изображений
    images?: {
        data: DatasetImage[];
        total: number;
        page: number;
        limit: number;
    };
}

export interface ResolutionStat {
    resolution: string;
    count: number;
    percentage: number;
}

export interface DivisibilityCheck {
    allDivisibleBy64: boolean;
    divisibleCount: number;
    totalCount: number;
}

export interface DatasetStatistics {
    totalSamples: number;
    resolutionStats: ResolutionStat[];
    avgPromptLength: number;
    divisibilityCheck: DivisibilityCheck;
}
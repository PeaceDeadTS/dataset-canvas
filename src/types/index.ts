export interface User {
    id: string;
    username: string;
    email: string; // This was missing and caused the crash
    role: 'Administrator' | 'Developer' | 'User';
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
        data: any[];
        total: number;
        page: number;
        limit: number;
    };
}

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
    user: User;
    createdAt: string;
    imageCount?: number;

    // Properties for the detailed dataset view
    modalities?: string[];
    rowCount?: number;
    likesCount?: number;
    followersCount?: number;
}

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

// User Edit types for caption editing history
export interface UserEdit {
    id: string;
    oldCaption: string;
    newCaption: string;
    createdAt: string;
    image: {
        id: number;
        img_key: string;
        url: string;
    };
    dataset: {
        id: string;
        name: string;
    };
    user: {
        id: string;
        username: string;
    } | null;
}

// Recent Change types (extended UserEdit with dataset owner info)
export interface RecentChange {
    id: string;
    oldCaption: string;
    newCaption: string;
    createdAt: string;
    image: {
        id: number;
        img_key: string;
        url: string;
    };
    dataset: {
        id: string;
        name: string;
        owner: {
            id: string;
            username: string;
        } | null;
    };
    user: {
        id: string;
        username: string;
    } | null;
}

// Pagination response type
export interface PaginatedResponse<T> {
    edits: T[];
    pagination: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
}

// Discussion types
export interface Discussion {
    id: number;
    title: string;
    datasetId: string;
    dataset?: Dataset;
    authorId: string;
    author?: User;
    posts?: DiscussionPost[];
    isLocked: boolean;
    isPinned: boolean;
    createdAt: string;
    updatedAt: string;
    postCount?: number;
    lastPostAt?: string;
    lastPostAuthor?: User;
}

export interface DiscussionPost {
    id: number;
    discussionId: number;
    discussion?: Discussion;
    authorId: string;
    author?: User;
    content: string;
    replyToId: number | null;
    replyTo?: DiscussionPost | null;
    isDeleted: boolean;
    deletedAt: string | null;
    deletedById: string | null;
    deletedBy?: User | null;
    createdAt: string;
    updatedAt: string;
    editCount?: number;
}

export interface DiscussionEditHistory {
    id: number;
    postId: number;
    post?: DiscussionPost;
    editorId: string;
    editor?: User;
    oldContent: string;
    newContent: string;
    editedAt: string;
}

// Unified change types for Recent Changes and User Edits
export interface UnifiedChange {
    type: 'caption_edit' | 'discussion_created' | 'discussion_post' | 'post_edit';
    id: string;
    timestamp: string;
    user?: { id: number; username: string } | null;
    dataset?: { id: number; name: string; owner?: { id: number; username: string } | null };
    data: any;
}

export interface UnifiedChangesResponse {
    changes: UnifiedChange[];
    pagination: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
}
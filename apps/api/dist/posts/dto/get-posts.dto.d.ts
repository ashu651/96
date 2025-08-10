export declare class GetPostsDto {
    page?: number;
    limit?: number;
    userId?: string;
    search?: string;
    isPrivate?: boolean;
    hasMedia?: boolean;
    sortBy?: 'createdAt' | 'likes' | 'comments';
    sortOrder?: 'asc' | 'desc';
}

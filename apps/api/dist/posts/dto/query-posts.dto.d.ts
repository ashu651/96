export declare enum PostSortBy {
    CREATED_AT = "createdAt",
    UPDATED_AT = "updatedAt",
    LIKES_COUNT = "likesCount",
    COMMENTS_COUNT = "commentsCount",
    SHARES_COUNT = "sharesCount"
}
export declare enum PostSortOrder {
    ASC = "asc",
    DESC = "desc"
}
export declare class QueryPostsDto {
    page?: number;
    limit?: number;
    search?: string;
    userId?: string;
    username?: string;
    hashtag?: string;
    location?: string;
    sortBy?: PostSortBy;
    sortOrder?: PostSortOrder;
    hasMedia?: boolean;
    dateFrom?: string;
    dateTo?: string;
}

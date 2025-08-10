export declare enum MediaType {
    IMAGE = "image",
    VIDEO = "video",
    AUDIO = "audio",
    DOCUMENT = "document"
}
export declare enum MediaCategory {
    PROFILE = "profile",
    POST = "post",
    STORY = "story",
    MESSAGE = "message",
    OTHER = "other"
}
export declare class UploadMediaDto {
    type: MediaType;
    category: MediaCategory;
    title?: string;
    description?: string;
    tags?: string[];
    location?: string;
    isPublic?: boolean;
    postId?: string;
    storyId?: string;
}

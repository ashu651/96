import { MediaService } from './media.service';
export declare class MediaController {
    private readonly mediaService;
    constructor(mediaService: MediaService);
    uploadMedia(userId: string, file: Express.Multer.File, type?: 'avatar' | 'post' | 'story'): Promise<{
        id: string;
        publicId: string;
        url: string;
        type: string;
        format: string;
        mimeType: string;
        size: number;
        width: number | null;
        height: number | null;
        duration: number | null;
        thumbnail: string | null;
        filename: string | null;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        createdAt: Date;
        uploadedBy: string;
    }>;
    getMedia(mediaId: string, userId?: string): Promise<{
        user: {
            id: string;
            username: string;
        };
    } & {
        id: string;
        publicId: string;
        url: string;
        type: string;
        format: string;
        mimeType: string;
        size: number;
        width: number | null;
        height: number | null;
        duration: number | null;
        thumbnail: string | null;
        filename: string | null;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        createdAt: Date;
        uploadedBy: string;
    }>;
    deleteMedia(mediaId: string, userId: string): Promise<{
        message: string;
    }>;
    getUserMedia(targetUserId: string, type?: string, page?: number, limit?: number): Promise<{
        media: {
            id: string;
            publicId: string;
            url: string;
            type: string;
            format: string;
            mimeType: string;
            size: number;
            width: number | null;
            height: number | null;
            duration: number | null;
            thumbnail: string | null;
            filename: string | null;
            metadata: import("@prisma/client/runtime/library").JsonValue | null;
            createdAt: Date;
            uploadedBy: string;
        }[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            pages: number;
        };
    }>;
    getMyMediaStats(userId: string): Promise<{
        byType: Record<string, number>;
        totalSize: number;
    }>;
    getMyMedia(userId: string, type?: string, page?: number, limit?: number): Promise<{
        media: {
            id: string;
            publicId: string;
            url: string;
            type: string;
            format: string;
            mimeType: string;
            size: number;
            width: number | null;
            height: number | null;
            duration: number | null;
            thumbnail: string | null;
            filename: string | null;
            metadata: import("@prisma/client/runtime/library").JsonValue | null;
            createdAt: Date;
            uploadedBy: string;
        }[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            pages: number;
        };
    }>;
}

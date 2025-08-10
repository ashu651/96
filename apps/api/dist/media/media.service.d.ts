import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '../config/config.service';
export declare class MediaService {
    private prisma;
    private configService;
    constructor(prisma: PrismaService, configService: ConfigService);
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
    getMediaById(mediaId: string, userId?: string): Promise<{
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
    getUserMedia(userId: string, type?: string, page?: number, limit?: number): Promise<{
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
    private isValidFileType;
    private uploadToCloudStorage;
    private deleteFromCloudStorage;
    getMediaStats(userId: string): Promise<{
        byType: Record<string, number>;
        totalSize: number;
    }>;
}

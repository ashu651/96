import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { Request } from 'express';
declare const JwtRefreshStrategy_base: new (...args: any[]) => any;
export declare class JwtRefreshStrategy extends JwtRefreshStrategy_base {
    private configService;
    private prisma;
    constructor(configService: ConfigService, prisma: PrismaService);
    validate(req: Request, payload: any): Promise<{
        id: string;
        username: string;
        email: string;
        sessionId: string;
    }>;
}
export {};

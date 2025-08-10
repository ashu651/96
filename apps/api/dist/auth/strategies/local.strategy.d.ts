import { PrismaService } from '../../prisma/prisma.service';
declare const LocalStrategy_base: new (...args: any[]) => any;
export declare class LocalStrategy extends LocalStrategy_base {
    private prisma;
    constructor(prisma: PrismaService);
    validate(email: string, password: string): Promise<any>;
}
export {};

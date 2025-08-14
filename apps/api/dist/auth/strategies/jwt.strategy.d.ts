import { ConfigService } from '../../config/config.service';
import { UsersService } from '../../users/users.service';
declare const JwtStrategy_base: new (...args: any[]) => any;
export declare class JwtStrategy extends JwtStrategy_base {
    private configService;
    private usersService;
    constructor(configService: ConfigService, usersService: UsersService);
    validate(payload: any): Promise<{
        id: string;
        username: string;
        email: string;
        isEmailVerified: boolean;
    }>;
}
export {};

import { Response as ExpressResponse } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshDto } from './dto/refresh.dto';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    register(registerDto: RegisterDto): Promise<{
        message: string;
        user: {
            id: string;
            createdAt: Date;
            username: string;
            email: string;
            firstName: string;
            lastName: string;
        };
    }>;
    login(loginDto: LoginDto, response: ExpressResponse): Promise<{
        user: {
            id: string;
            avatar: string;
            username: string;
            email: string;
            bio: string;
            isEmailVerified: boolean;
            isActive: boolean;
        };
        accessToken: string;
        expiresIn: string;
    }>;
    refresh(refreshDto: RefreshDto, response: ExpressResponse): Promise<{
        accessToken: string;
        expiresIn: string;
    }>;
    logout(userId: string, response: ExpressResponse): Promise<{
        message: string;
    }>;
    verifyEmail(token: string): Promise<{
        message: string;
    }>;
    forgotPassword(email: string): Promise<{
        message: string;
    }>;
    resetPassword(token: string, newPassword: string): Promise<{
        message: string;
    }>;
    getCurrentUser(user: any): Promise<{
        user: any;
    }>;
}

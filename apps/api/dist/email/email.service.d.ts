import { ConfigService } from '../config/config.service';
export interface EmailData {
    to: string;
    subject: string;
    text?: string;
    html?: string;
    from?: string;
}
export declare class EmailService {
    private configService;
    private readonly logger;
    constructor(configService: ConfigService);
    sendEmail(emailData: EmailData): Promise<void>;
    sendWelcomeEmail(email: string, username: string): Promise<void>;
    sendPasswordResetEmail(email: string, resetToken: string): Promise<void>;
    sendEmailVerification(email: string, verificationToken: string): Promise<void>;
    sendSecurityAlert(email: string, username: string, activity: string): Promise<void>;
    sendAccountDeletionConfirmation(email: string, username: string): Promise<void>;
}

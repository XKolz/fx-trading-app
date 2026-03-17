import { User } from './user.entity';
export declare class Otp {
    id: string;
    user: User;
    userId: string;
    code: string;
    expiresAt: Date;
    used: boolean;
    createdAt: Date;
}

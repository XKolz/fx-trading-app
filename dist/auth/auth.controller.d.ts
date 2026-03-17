import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { LoginDto } from './dto/login.dto';
export declare class AuthController {
    private authService;
    constructor(authService: AuthService);
    register(dto: RegisterDto): Promise<{
        message: string;
        userId: string;
    }>;
    verifyOtp(dto: VerifyOtpDto): Promise<{
        message: string;
        accessToken: string;
    }>;
    login(dto: LoginDto): Promise<{
        accessToken: string;
        user: {
            id: string;
            email: string;
            role: import("../common/enums/role.enum").Role;
        };
    }>;
    resendOtp(email: string): Promise<{
        message: string;
    }>;
}

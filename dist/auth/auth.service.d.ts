import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { MailService } from '../mail/mail.service';
import { RegisterDto } from './dto/register.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { LoginDto } from './dto/login.dto';
import { WalletService } from '../wallet/wallet.service';
export declare class AuthService {
    private usersService;
    private jwtService;
    private mailService;
    private walletService;
    constructor(usersService: UsersService, jwtService: JwtService, mailService: MailService, walletService: WalletService);
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
    private generateToken;
}

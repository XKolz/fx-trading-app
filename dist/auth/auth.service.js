"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const bcrypt = require("bcrypt");
const users_service_1 = require("../users/users.service");
const mail_service_1 = require("../mail/mail.service");
const wallet_service_1 = require("../wallet/wallet.service");
let AuthService = class AuthService {
    constructor(usersService, jwtService, mailService, walletService) {
        this.usersService = usersService;
        this.jwtService = jwtService;
        this.mailService = mailService;
        this.walletService = walletService;
    }
    async register(dto) {
        const user = await this.usersService.create(dto.email, dto.password);
        await this.walletService.createWallet(user.id);
        const otp = await this.usersService.createOtp(user.id);
        await this.mailService.sendOtp(user.email, otp);
        return {
            message: 'Registration successful. Please check your email for the OTP.',
            userId: user.id,
        };
    }
    async verifyOtp(dto) {
        const user = await this.usersService.findByEmail(dto.email);
        if (!user) {
            throw new common_1.BadRequestException('User not found');
        }
        if (user.isVerified) {
            throw new common_1.BadRequestException('Account already verified');
        }
        const valid = await this.usersService.verifyOtp(user.id, dto.otp);
        if (!valid) {
            throw new common_1.BadRequestException('Invalid or expired OTP');
        }
        const token = this.generateToken(user.id, user.email);
        return {
            message: 'Email verified successfully',
            accessToken: token,
        };
    }
    async login(dto) {
        const user = await this.usersService.findByEmail(dto.email);
        if (!user) {
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        const passwordValid = await bcrypt.compare(dto.password, user.password);
        if (!passwordValid) {
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        if (!user.isVerified) {
            throw new common_1.UnauthorizedException('Please verify your email first');
        }
        const token = this.generateToken(user.id, user.email);
        return {
            accessToken: token,
            user: {
                id: user.id,
                email: user.email,
                role: user.role,
            },
        };
    }
    async resendOtp(email) {
        const user = await this.usersService.findByEmail(email);
        if (!user) {
            throw new common_1.BadRequestException('User not found');
        }
        if (user.isVerified) {
            throw new common_1.BadRequestException('Account already verified');
        }
        const otp = await this.usersService.createOtp(user.id);
        await this.mailService.sendOtp(user.email, otp);
        return { message: 'OTP resent successfully' };
    }
    generateToken(userId, email) {
        return this.jwtService.sign({ sub: userId, email });
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [users_service_1.UsersService,
        jwt_1.JwtService,
        mail_service_1.MailService,
        wallet_service_1.WalletService])
], AuthService);
//# sourceMappingURL=auth.service.js.map
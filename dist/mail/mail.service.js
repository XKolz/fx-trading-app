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
var MailService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MailService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const nodemailer = require("nodemailer");
let MailService = MailService_1 = class MailService {
    constructor(configService) {
        this.configService = configService;
        this.logger = new common_1.Logger(MailService_1.name);
        this.transporter = nodemailer.createTransport({
            host: this.configService.get('mail.host'),
            port: this.configService.get('mail.port'),
            secure: false,
            auth: {
                user: this.configService.get('mail.user'),
                pass: this.configService.get('mail.password'),
            },
        });
    }
    async sendOtp(email, otp) {
        const from = this.configService.get('mail.from');
        try {
            await this.transporter.sendMail({
                from,
                to: email,
                subject: 'Your FX Trading App Verification Code',
                html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Email Verification</h2>
            <p>Your verification code is:</p>
            <h1 style="font-size: 40px; letter-spacing: 10px; color: #4F46E5;">${otp}</h1>
            <p>This code expires in <strong>10 minutes</strong>.</p>
            <p>If you did not request this, please ignore this email.</p>
          </div>
        `,
            });
            this.logger.log(`OTP sent to ${email}`);
        }
        catch (error) {
            this.logger.error(`Failed to send OTP to ${email}: ${error.message}`);
        }
    }
};
exports.MailService = MailService;
exports.MailService = MailService = MailService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], MailService);
//# sourceMappingURL=mail.service.js.map
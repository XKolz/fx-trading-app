import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './user.entity';
import { Otp } from './otp.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Otp)
    private otpRepository: Repository<Otp>,
  ) {}

  async create(email: string, password: string): Promise<User> {
    const existing = await this.userRepository.findOne({ where: { email } });
    if (existing) {
      throw new ConflictException('Email already registered');
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = this.userRepository.create({ email, password: hashedPassword });
    return this.userRepository.save(user);
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { email } });
  }

  async findById(id: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { id } });
  }

  async createOtp(userId: string): Promise<string> {
    // Invalidate old unused OTPs
    await this.otpRepository.update(
      { userId, used: false },
      { used: true },
    );

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    const otp = this.otpRepository.create({ userId, code, expiresAt });
    await this.otpRepository.save(otp);
    return code;
  }

  async verifyOtp(userId: string, code: string): Promise<boolean> {
    const otp = await this.otpRepository.findOne({
      where: { userId, code, used: false },
    });

    if (!otp) return false;
    if (new Date() > otp.expiresAt) return false;

    await this.otpRepository.update(otp.id, { used: true });
    await this.userRepository.update(userId, { isVerified: true });
    return true;
  }

  async markVerified(userId: string): Promise<void> {
    await this.userRepository.update(userId, { isVerified: true });
  }
}

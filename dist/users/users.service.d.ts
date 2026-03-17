import { Repository } from 'typeorm';
import { User } from './user.entity';
import { Otp } from './otp.entity';
export declare class UsersService {
    private userRepository;
    private otpRepository;
    constructor(userRepository: Repository<User>, otpRepository: Repository<Otp>);
    create(email: string, password: string): Promise<User>;
    findByEmail(email: string): Promise<User | null>;
    findById(id: string): Promise<User | null>;
    createOtp(userId: string): Promise<string>;
    verifyOtp(userId: string, code: string): Promise<boolean>;
    markVerified(userId: string): Promise<void>;
}

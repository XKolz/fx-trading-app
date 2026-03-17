import { Role } from '../common/enums/role.enum';
export declare class User {
    id: string;
    email: string;
    password: string;
    isVerified: boolean;
    role: Role;
    createdAt: Date;
    updatedAt: Date;
}

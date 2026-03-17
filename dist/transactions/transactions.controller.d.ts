import { TransactionsService } from './transactions.service';
import { User } from '../users/user.entity';
export declare class TransactionsController {
    private transactionsService;
    constructor(transactionsService: TransactionsService);
    findAll(user: User, page: number, limit: number): Promise<{
        data: import("./transaction.entity").Transaction[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    findOne(user: User, id: string): Promise<import("./transaction.entity").Transaction>;
}

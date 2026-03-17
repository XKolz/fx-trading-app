import { Repository } from 'typeorm';
import { Transaction } from './transaction.entity';
export declare class TransactionsService {
    private transactionRepository;
    constructor(transactionRepository: Repository<Transaction>);
    findByUser(userId: string, page?: number, limit?: number): Promise<{
        data: Transaction[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    findOne(id: string, userId: string): Promise<Transaction>;
}

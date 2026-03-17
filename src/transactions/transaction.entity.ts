import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from '../users/user.entity';
import { Currency } from '../common/enums/currency.enum';
import { TransactionType, TransactionStatus } from '../common/enums/transaction-type.enum';

@Entity('transactions')
export class Transaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  userId: string;

  @Column({ type: 'enum', enum: TransactionType })
  type: TransactionType;

  @Column({ type: 'enum', enum: Currency, nullable: true })
  fromCurrency: Currency;

  @Column({ type: 'enum', enum: Currency })
  toCurrency: Currency;

  @Column({ type: 'decimal', precision: 20, scale: 8, nullable: true })
  fromAmount: string;

  @Column({ type: 'decimal', precision: 20, scale: 8 })
  toAmount: string;

  @Column({ type: 'decimal', precision: 20, scale: 10, nullable: true })
  rate: string;

  @Column({ type: 'enum', enum: TransactionStatus, default: TransactionStatus.COMPLETED })
  status: TransactionStatus;

  @Index({ unique: true })
  @Column({ nullable: true })
  reference: string;

  @Column({ nullable: true })
  description: string;

  @CreateDateColumn()
  createdAt: Date;
}

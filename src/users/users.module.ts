import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './user.entity';
import { Otp } from './otp.entity';
import { UsersService } from './users.service';

@Module({
  imports: [TypeOrmModule.forFeature([User, Otp])],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}

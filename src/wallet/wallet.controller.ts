import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
} from '@nestjs/swagger';
import { WalletService } from './wallet.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { VerifiedGuard } from '../auth/guards/verified.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../users/user.entity';
import { FundWalletDto } from './dto/fund-wallet.dto';
import { ConvertDto } from './dto/convert.dto';
import { TradeDto } from './dto/trade.dto';

@ApiTags('wallet')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, VerifiedGuard)
@Controller('wallet')
export class WalletController {
  constructor(private walletService: WalletService) {}

  @Get()
  @ApiOperation({ summary: 'Get user wallet balances by currency' })
  @ApiResponse({ status: 200, description: 'Wallet with all currency balances' })
  getWallet(@CurrentUser() user: User) {
    return this.walletService.getWallet(user.id);
  }

  @Post('fund')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Fund wallet in NGN or other currencies' })
  @ApiResponse({ status: 200, description: 'Wallet funded, transaction returned' })
  fundWallet(@CurrentUser() user: User, @Body() dto: FundWalletDto) {
    return this.walletService.fundWallet(user.id, dto);
  }

  @Post('convert')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Convert between currencies using real-time FX rates' })
  @ApiResponse({ status: 200, description: 'Conversion successful, transaction returned' })
  @ApiResponse({ status: 400, description: 'Insufficient balance or invalid currencies' })
  convert(@CurrentUser() user: User, @Body() dto: ConvertDto) {
    return this.walletService.convert(user.id, dto);
  }

  @Post('trade')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Trade Naira (NGN) against other currencies and vice versa' })
  @ApiResponse({ status: 200, description: 'Trade successful, transaction returned' })
  @ApiResponse({ status: 400, description: 'Insufficient balance or trade must involve NGN' })
  trade(@CurrentUser() user: User, @Body() dto: TradeDto) {
    return this.walletService.trade(user.id, dto);
  }
}

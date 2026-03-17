import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
  ApiResponse,
} from '@nestjs/swagger';
import { FxService } from './fx.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { VerifiedGuard } from '../auth/guards/verified.guard';
import { Currency } from '../common/enums/currency.enum';

@ApiTags('fx')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, VerifiedGuard)
@Controller('fx')
export class FxController {
  constructor(private fxService: FxService) {}

  @Get('rates')
  @ApiOperation({ summary: 'Get current FX rates for supported currency pairs' })
  @ApiQuery({ name: 'base', enum: Currency, required: false })
  @ApiResponse({ status: 200, description: 'Current FX rates' })
  getRates(@Query('base') base?: Currency) {
    if (base) {
      return this.fxService.getRates(base);
    }
    return this.fxService.getAllRates();
  }
}

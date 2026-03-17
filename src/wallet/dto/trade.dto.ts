import { IsEnum, IsNumber, IsPositive } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Currency } from '../../common/enums/currency.enum';

export class TradeDto {
  @ApiProperty({
    enum: Currency,
    example: Currency.NGN,
    description: 'Base currency (must be NGN or target must be NGN)',
  })
  @IsEnum(Currency)
  fromCurrency: Currency;

  @ApiProperty({
    enum: Currency,
    example: Currency.USD,
    description: 'Quote currency (must be NGN or source must be NGN)',
  })
  @IsEnum(Currency)
  toCurrency: Currency;

  @ApiProperty({ example: 1000, description: 'Amount of fromCurrency to trade' })
  @IsNumber()
  @IsPositive()
  amount: number;
}

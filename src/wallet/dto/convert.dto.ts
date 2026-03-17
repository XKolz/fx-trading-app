import { IsEnum, IsNumber, IsPositive } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Currency } from '../../common/enums/currency.enum';

export class ConvertDto {
  @ApiProperty({ enum: Currency, example: Currency.NGN, description: 'Source currency' })
  @IsEnum(Currency)
  fromCurrency: Currency;

  @ApiProperty({ enum: Currency, example: Currency.USD, description: 'Target currency' })
  @IsEnum(Currency)
  toCurrency: Currency;

  @ApiProperty({ example: 1000, description: 'Amount of fromCurrency to convert' })
  @IsNumber()
  @IsPositive()
  amount: number;
}

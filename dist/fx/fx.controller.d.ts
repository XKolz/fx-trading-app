import { FxService } from './fx.service';
import { Currency } from '../common/enums/currency.enum';
export declare class FxController {
    private fxService;
    constructor(fxService: FxService);
    getRates(base?: Currency): Promise<Record<string, number>> | Promise<{
        base: string;
        rates: Record<string, number>;
        cached: boolean;
    }>;
}

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SUPPORTED_CURRENCIES = exports.Currency = void 0;
var Currency;
(function (Currency) {
    Currency["NGN"] = "NGN";
    Currency["USD"] = "USD";
    Currency["EUR"] = "EUR";
    Currency["GBP"] = "GBP";
    Currency["JPY"] = "JPY";
    Currency["CAD"] = "CAD";
    Currency["AUD"] = "AUD";
    Currency["CHF"] = "CHF";
})(Currency || (exports.Currency = Currency = {}));
exports.SUPPORTED_CURRENCIES = Object.values(Currency);
//# sourceMappingURL=currency.enum.js.map
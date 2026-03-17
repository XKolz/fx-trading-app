import { CanActivate, ExecutionContext } from '@nestjs/common';
export declare class VerifiedGuard implements CanActivate {
    canActivate(context: ExecutionContext): boolean;
}

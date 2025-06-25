import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerStorage, ThrottlerModuleOptions } from '@nestjs/throttler';


@Injectable()
export class RateLimitGuard extends ThrottlerGuard {
    constructor(
    protected readonly options: ThrottlerModuleOptions,
    protected readonly storage: ThrottlerStorage,
    protected readonly reflector: Reflector,
  ) {
    super(options, storage, reflector);
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // Different limits for different user types
    if (user?.role === 'CORPORATE_ADMIN') {
      // Higher limits for admins
      return true;
    }

    return super.canActivate(context);
  }
}
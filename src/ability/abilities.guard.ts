import { ForbiddenError } from '@casl/ability';
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
} from '@nestjs/common';

import { Reflector } from '@nestjs/core';
import { AbilityFactory } from './ability.factory/ability.factory';
import { CHECK_ABILITY, RequireRules } from './abilities.decorator';
import { currentUser } from '../user/current-user';

@Injectable()
export class AbilitiesGuards implements CanActivate {
  constructor(
    private reflector: Reflector,
    private caslAbilityFactory: AbilityFactory,
  ) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const rules =
      this.reflector.get<RequireRules[]>(CHECK_ABILITY, context.getHandler()) ||
      [];
    const user = currentUser;
    const ability = this.caslAbilityFactory.defineAbility(user);
    try {
      rules.forEach((rule) =>
        ForbiddenError.from(ability).throwUnlessCan(rule.action, rule.subject),
      );

      return true;
    } catch (error) {
      if (error instanceof ForbiddenError) {
        throw new ForbiddenException(error.message);
      }
    }
  }
}

import { SetMetadata } from '@nestjs/common';
import { Action, Subjects } from './ability.factory/ability.factory';
import { User } from 'src/user/entities/user.entity';

export interface RequireRules {
  action: Action;
  subject: Subjects;
}

export const CHECK_ABILITY = 'check_ability';

export const CheckAbilities = (...requirements: RequireRules[]) =>
  SetMetadata(CHECK_ABILITY, requirements);

export class ReadUserAbility implements RequireRules {
  action = Action.Read;
  subject = User;
}

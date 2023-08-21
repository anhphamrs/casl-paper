import { Injectable } from '@nestjs/common';
import {
  AbilityBuilder,
  AbilityClass,
  ExtractSubjectType,
  InferSubjects,
  PureAbility,
} from '@casl/ability';
import { User } from 'src/user/entities/user.entity';

export enum Action {
  Manage = 'manage', // wildcard for any action
  Create = 'create',
  Read = 'read',
  Update = 'update',
  Delete = 'delete',
}

export type Subjects = InferSubjects<typeof User> | 'all';

export type AppAbility = PureAbility<[Action, Subjects]>;

@Injectable()
export class AbilityFactory {
  defineAbility(user: User) {
    const { can, cannot, build } = new AbilityBuilder(
      PureAbility as AbilityClass<AppAbility>,
    );

    if (user.isAdmin) {
      can(Action.Manage, 'all');
      cannot(Action.Manage, User, { orgId: { $ne: user.orgId } }).because(
        'You can only manage users in your own organization',
      );
    } else {
      can(Action.Read, 'all');
      cannot(Action.Create, User).because(
        'you special message: only admins!!!',
      );
      cannot(Action.Delete, User).because('you just can');
    }

    return build({
      detectSubjectType: (item) =>
        item.constructor as ExtractSubjectType<Subjects>,
    });
  }
}

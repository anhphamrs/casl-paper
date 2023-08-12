import { Controller, Delete, Get, Post, Patch } from '@nestjs/common';
import { UserService } from './user.service';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}
  @Post('create')
  createUser() {
    return this.userService.createUser();
  }

  @Get('read')
  readUser() {
    return this.userService.readUser();
  }

  @Patch('update')
  updateUser() {
    return this.userService.updateUser();
  }

  @Delete('deleteUser')
  deleteUser() {
    return this.userService.deleteUser();
  }
}

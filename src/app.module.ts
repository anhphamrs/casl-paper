import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PaperModule } from './paper/paper.module';
import { ControllerModule } from './service/controller/controller.module';
import { UserModule } from './user/user.module';

@Module({
  imports: [PaperModule, ControllerModule, UserModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

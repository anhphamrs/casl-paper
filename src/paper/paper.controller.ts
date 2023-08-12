import { Controller, Delete, Get, Patch, Post } from '@nestjs/common';
import { PaperService } from './paper.service';

@Controller('paper')
export class PaperController {
  constructor(private readonly paperService: PaperService) {}

  @Post('writter')
  writterPaper() {
    return this.paperService.writterPaper();
  }

  @Get('read')
  readPaper() {
    return this.paperService.readPaper();
  }

  @Patch('update')
  updatePaper() {
    return this.paperService.updatePaper();
  }

  @Delete('deletePaper')
  deletePaper() {
    return this.paperService.deletePaper();
  }
}

import { Controller, Get, Post, Put, Delete, Body, Param } from '@nestjs/common';
import { UpdateAccessDto } from './dto/update-access.dto';
import { AccessService } from './access.service';
import { CreateAccessDto } from './dto/create-access.dto';

@Controller('accesses')
export class AccessController {
  constructor(private readonly accessService: AccessService) {}

  @Post()
  create(@Body() body: CreateAccessDto) {
    return this.accessService.create(body);
  }

  @Get()
  findAll() {
    return this.accessService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.accessService.findById(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() body: UpdateAccessDto) {
    return this.accessService.updateOne(id, body);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.accessService.deleteOne(id);
  }
}

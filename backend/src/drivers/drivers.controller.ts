import { Controller, Get, Post, Body, Param, Delete, UseGuards, ValidationPipe, ParseUUIDPipe } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { DriversService } from './drivers.service';
import { CreateDriverDto } from './dto/create-driver.dto';

@Controller('drivers')
@UseGuards(AuthGuard('jwt'))
export class DriversController {
  constructor(private readonly driversService: DriversService) {}

  @Post()
  create(@Body(ValidationPipe) createDriverDto: CreateDriverDto) {
    return this.driversService.create(createDriverDto);
  }

  @Get()
  findAll() {
    return this.driversService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.driversService.findOne(id);
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.driversService.remove(id);
  }
}

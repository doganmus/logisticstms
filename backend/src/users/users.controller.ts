import { Body, Controller, Get, Param, Patch } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UsersService } from './users.service';

@ApiTags('Users')
@Controller({ path: 'users', version: '1' })
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @ApiOperation({ summary: 'Kullanicilari listeler' })
  @ApiResponse({ status: 200, description: 'Kullanici listesi doner' })
  findAll() {
    return this.usersService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Belirli bir kullaniciyi getirir' })
  @ApiParam({ name: 'id', type: 'string', description: 'Kullanici kimligi' })
  @ApiResponse({ status: 200, description: 'Kullanici bulundu' })
  @ApiResponse({ status: 404, description: 'Kullanici bulunamadi' })
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Kullanici bilgilerini gunceller' })
  @ApiParam({ name: 'id', type: 'string', description: 'Kullanici kimligi' })
  @ApiBody({ required: false, schema: { type: 'object', additionalProperties: true } })
  @ApiResponse({ status: 200, description: 'Kullanici guncellendi' })
  @ApiResponse({ status: 404, description: 'Kullanici bulunamadi' })
  update(@Param('id') id: string, @Body() updateDto: any) {
    return this.usersService.update(id, updateDto);
  }
}


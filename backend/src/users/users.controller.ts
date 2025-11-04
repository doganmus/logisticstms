import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';
import { UsersService } from './users.service';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../public-entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@ApiTags('Users')
@ApiBearerAuth('access-token')
@UseGuards(AuthGuard('jwt'))
@Controller({ path: 'users', version: '1' })
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Tenant kapsamindaki tum kullanicilari listeler' })
  @ApiResponse({ status: 200, description: 'Kullanici listesi doner' })
  findAll(@Req() req: Request) {
    return this.usersService.findAll(req.user?.tenantUuid as string);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Belirli bir kullaniciyi getirir' })
  @ApiParam({ name: 'id', type: 'string', description: 'Kullanici kimligi' })
  @ApiResponse({ status: 200, description: 'Kullanici bulundu' })
  @ApiResponse({ status: 404, description: 'Kullanici bulunamadi' })
  findOne(@Param('id', ParseUUIDPipe) id: string, @Req() req: Request) {
    const role = req.user?.role as string | undefined;
    const requesterId = req.user?.userId as string | undefined;
    if (role !== UserRole.ADMIN && requesterId !== id) {
      throw new ForbiddenException('You do not have access to this user');
    }
    return this.usersService.findOne(id, req.user?.tenantUuid as string);
  }

  @Post()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Yeni kullanici olusturur' })
  @ApiResponse({ status: 201, description: 'Kullanici olusturuldu' })
  create(@Body() createUserDto: CreateUserDto, @Req() req: Request) {
    return this.usersService.create(createUserDto, req.user?.tenantUuid as string);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.OPERATOR)
  @ApiOperation({ summary: 'Kullanici bilgilerini gunceller' })
  @ApiParam({ name: 'id', type: 'string', description: 'Kullanici kimligi' })
  @ApiResponse({ status: 200, description: 'Kullanici guncellendi' })
  @ApiResponse({ status: 404, description: 'Kullanici bulunamadi' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDto: UpdateUserDto,
    @Req() req: Request,
  ) {
    return this.usersService.update(
      id,
      updateDto,
      {
        id: req.user?.userId as string,
        role: req.user?.role as UserRole,
      },
      req.user?.tenantUuid as string,
    );
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Belirli bir kullaniciyi siler' })
  @ApiParam({ name: 'id', type: 'string', description: 'Kullanici kimligi' })
  @ApiResponse({ status: 204, description: 'Kullanici silindi' })
  @ApiResponse({ status: 404, description: 'Kullanici bulunamadi' })
  @HttpCode(204)
  remove(@Param('id', ParseUUIDPipe) id: string, @Req() req: Request) {
    return this.usersService.remove(
      id,
      req.user?.tenantUuid as string,
      req.user?.userId as string,
    );
  }

  @Post(':id/resend-verification')
  @Roles(UserRole.ADMIN, UserRole.OPERATOR)
  @ApiOperation({ summary: 'Kullanici icin dogrulama mailini yeniden gonderir' })
  @ApiParam({ name: 'id', type: 'string', description: 'Kullanici kimligi' })
  @ApiResponse({ status: 202, description: 'Dogrulama maili gonderildi' })
  @HttpCode(202)
  async resendVerification(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: Request,
  ) {
    await this.usersService.resendVerification(
      id,
      {
        id: req.user?.userId as string,
        role: req.user?.role as UserRole,
      },
      req.user?.tenantUuid as string,
    );
    return { status: 'ok' };
  }
}


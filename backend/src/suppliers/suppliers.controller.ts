import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { SuppliersService } from './suppliers.service';
import { CreateSupplierDto } from './dto/create-supplier.dto';

@ApiTags('Suppliers')
@Controller({ path: 'suppliers', version: '1' })
export class SuppliersController {
  constructor(private readonly suppliersService: SuppliersService) {}

  @Post()
  @ApiOperation({ summary: 'Yeni tedarikci kaydi olusturur' })
  @ApiResponse({ status: 201, description: 'Tedarikci basariyla olusturuldu' })
  @ApiResponse({ status: 400, description: 'Gecersiz tedarikci verisi' })
  create(@Body() createSupplierDto: CreateSupplierDto) {
    return this.suppliersService.create(createSupplierDto);
  }

  @Get()
  @ApiOperation({ summary: 'Tum tedarikcileri listeler' })
  @ApiResponse({ status: 200, description: 'Tedarikci listesi doner' })
  findAll() {
    return this.suppliersService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Belirli bir tedarikciyi getirir' })
  @ApiParam({ name: 'id', type: 'string', description: 'Tedarikci kimligi' })
  @ApiResponse({ status: 200, description: 'Tedarikci bulundu' })
  @ApiResponse({ status: 404, description: 'Tedarikci bulunamadi' })
  findOne(@Param('id') id: string) {
    return this.suppliersService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Tedarikci bilgisini gunceller' })
  @ApiParam({ name: 'id', type: 'string', description: 'Tedarikci kimligi' })
  @ApiResponse({ status: 200, description: 'Tedarikci guncellendi' })
  @ApiResponse({ status: 404, description: 'Tedarikci bulunamadi' })
  update(@Param('id') id: string, @Body() updateSupplierDto: any) {
    return this.suppliersService.update(id, updateSupplierDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Tedarikciyi siler' })
  @ApiParam({ name: 'id', type: 'string', description: 'Tedarikci kimligi' })
  @ApiResponse({ status: 204, description: 'Tedarikci silindi' })
  @ApiResponse({ status: 404, description: 'Tedarikci bulunamadi' })
  remove(@Param('id') id: string) {
    return this.suppliersService.remove(id);
  }
}

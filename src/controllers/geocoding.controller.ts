/*
https://docs.nestjs.com/controllers#controllers
*/

import { Controller, Get, Param } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import { GeocodingService } from 'src/services/geocoder.service';

@Controller('geocoding')
@ApiExcludeController()
export class GeocodingController {
  constructor(private geoService: GeocodingService) {}

  @Get(':address')
  private async getCoordsFromAddress(
    @Param('address') address: string,
  ): Promise<[number, number]> {
    return await this.geoService.getCoordsFromAddress(address);
  }
}

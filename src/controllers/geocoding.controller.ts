/*
https://docs.nestjs.com/controllers#controllers
*/

import { Controller, Get, Param } from '@nestjs/common';
import { GeocodingService } from 'src/services/geocoder.service';

@Controller('geocoding')
export class GeocodingController {
  constructor(private geoService: GeocodingService) {}

  @Get(':address')
  public async getCoordsFromAddress(
    @Param('address') address: string,
  ): Promise<[number, number]> {
    return await this.geoService.getCoordsFromAddress(address);
  }
}

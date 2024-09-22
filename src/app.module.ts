import { GeocodingController } from './controllers/geocoding.controller';
import { MatchesController } from './controllers/matches.controller';
import { CalendarService } from './services/calendar.service';
import { MatchesService } from './services/matches.service';
import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { GeocodingService } from './services/geocoder.service';
import { SentryModule } from '@sentry/nestjs/setup';
import { SentryGlobalFilter } from '@sentry/nestjs/setup';
import { APP_FILTER } from '@nestjs/core';

@Module({
  imports: [HttpModule, ConfigModule.forRoot(), SentryModule.forRoot()],
  controllers: [GeocodingController, MatchesController],
  providers: [
    GeocodingService,
    CalendarService,
    MatchesService,
    {
      provide: APP_FILTER,
      useClass: SentryGlobalFilter,
    },
  ],
})
export class AppModule {}

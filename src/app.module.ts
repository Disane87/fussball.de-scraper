import { MatchesController } from './controllers/matches.controller';
import { CalendarService } from './services/calendar.service';
import { MatchesService } from './services/matches.service';
import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [HttpModule, ConfigModule.forRoot()],
  controllers: [MatchesController],
  providers: [CalendarService, MatchesService],
})
export class AppModule {}

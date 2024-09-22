/*
https://docs.nestjs.com/controllers#controllers
*/

import { Controller, Get, Header, Param } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiTags } from '@nestjs/swagger';
import { createEvents } from 'ics';
import { Config, Match } from 'src/interfaces';
import { CalendarService } from 'src/services/calendar.service';
import { MatchesService } from 'src/services/matches.service';

@Controller('matches')
@ApiTags('matches')
export class MatchesController {
  constructor(
    private readonly matchesService: MatchesService,
    private readonly calendarService: CalendarService,
    private configService: ConfigService,
  ) {}

  @Get(':team.json')
  async getMatchesJson(
    @Param('team') teamId: string = this.configService.get<string>('TEAM_ID'),
  ): Promise<Match[]> {
    return await this.matchesService.matchesForTeam(teamId, true);
  }

  @Get(':team.ics')
  @Header('Content-Type', 'text/calendar')
  async getMatchesIcal(
    @Param('team') teamId: string = this.configService.get<string>('TEAM_ID'),
  ): Promise<string> {
    const config: Config = {
      spieldauer: { hours: 2, minutes: 0 },
      vorlaufzeit: { hours: 1, minutes: 0 },
      spielfreiAnzeigen: true,
    };

    const matches = await this.getMatchesJson(teamId);
    const iCalMatches = this.calendarService.createIcalEvents(matches, config);

    const ical = createEvents(iCalMatches, {
      calName: 'Fußball.de Matches ⚽',
    });
    if (!ical.value && ical.error) {
      console.error(ical.error);
      throw new Error(ical.error.message);
    }

    return ical.value;
  }
}

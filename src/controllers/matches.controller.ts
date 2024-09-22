/*
https://docs.nestjs.com/controllers#controllers
*/

import { Controller, Get, Header, Param } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createEvents } from 'ics';
import { Config, Match } from 'src/interfaces';
import { CalendarService } from 'src/services/calendar.service';
import { MatchesService } from 'src/services/matches.service';

@Controller('matches')
export class MatchesController {
  constructor(
    private readonly matchesService: MatchesService,
    private readonly calendarService: CalendarService,

    private configService: ConfigService,
  ) {}

  @Get(':team.json')
  async getMatchesJson(
    @Param('team') teamId = this.configService.get<string>('TEAM_ID'),
  ): Promise<Match[]> {
    return await this.matchesService.matchesForTeam(teamId, true);
  }

  @Get(':team.ics')
  @Header('Content-Type', 'text/calendar')
  async getMatchesIcal(
    @Param('team') teamId = this.configService.get<string>('TEAM_ID'),
  ): Promise<string> {
    const matches = await this.getMatchesJson(teamId);

    const config: Config = {
      spieldauer: { hours: 2, minutes: 0 },
      vorlaufzeit: { hours: 1, minutes: 0 },
      spielfreiAnzeigen: true,
    };
    const iCalEvents = this.calendarService.createIcalEvents(matches, config);

    const ical = createEvents(iCalEvents);
    const icsString = ical.value;

    if (!icsString && ical.error) {
      console.error(ical.error);
      throw new Error(ical.error.message);
    }

    return icsString;
  }
}

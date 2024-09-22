import { Injectable } from '@nestjs/common';
import { Match } from '../interfaces';
import * as cheerio from 'cheerio';
import { AxiosResponse } from 'axios';
import { HttpService } from '@nestjs/axios';
import { DateTime } from 'luxon';
import { GeocodingService } from './geocoder.service';

@Injectable()
export class MatchesService {
  private readonly baseUrl =
    'https://www.fussball.de/ajax.team.matchplan/-/mode/PAGE/team-id/';

  constructor(
    private readonly httpService: HttpService,

    private readonly geoCoderService: GeocodingService,
  ) {}

  // Fetch matches from the URL
  async getMatchesForTeams(teamId: string): Promise<string | null> {
    const url = `${this.baseUrl}${teamId}`;
    try {
      const response: AxiosResponse = await this.httpService
        .get(url)
        .toPromise();
      return response?.data || null;
    } catch (error) {
      console.error('Error fetching data:', error);
      return null;
    }
  }

  // Fetch and parse matches for a specific team
  async matchesForTeam(
    teamId: string,
    showSpielfrei: boolean,
  ): Promise<Match[]> {
    const html = await this.getMatchesForTeams(teamId);
    if (!html) {
      return [];
    }

    const matches = await this.parseMatches(html, showSpielfrei);

    return Promise.all(
      matches.map(async (match) => {
        console.log('Fetching location for:', match.location);
        const locationCoords = await this.geoCoderService.getCoordsFromAddress(
          match.location,
        );
        return {
          ...match,
          locationCoords,
        };
      }),
    );
  }

  // Parse the HTML to extract match information
  private async parseMatches(
    html: string,
    showSpielfrei: boolean,
  ): Promise<Match[]> {
    const $ = cheerio.load(html);
    return $('div.club-matchplan-table tbody tr')
      .toArray()
      .reduce<Match[]>((matches, element, index, elements) => {
        if (index % 3 === 0) {
          const shortDateText = $(elements[index + 1])
            .find('td.column-date')
            .text()
            .trim();
          const homeTeam = $(elements[index + 2])
            .find('td.column-club')
            .first()
            .text()
            .trim();
          const awayTeam = $(elements[index + 2])
            .find('td.column-club')
            .last()
            .text()
            .trim();

          const spielfrei = awayTeam.toLowerCase() === 'spielfrei';
          const dateMatch = shortDateText.match(/(\d{2}\.\d{2}\.\d{2})/);
          const timeMatch = shortDateText.match(/(\d{2}:\d{2})/);

          // Set time to "00:00" if not available
          const time = timeMatch ? timeMatch[1] : '00:00';

          if (dateMatch && (!spielfrei || showSpielfrei)) {
            // Parse date and time in Europe/Berlin timezone
            const dateTime = DateTime.fromFormat(
              `${dateMatch[1]} ${time}`,
              'dd.MM.yy HH:mm',
              { zone: 'Europe/Berlin' },
            );

            // Store the ISO date with timezone
            matches.push({
              date: dateTime.toISO(), // ISO string with time and timezone
              homeTeam: spielfrei ? 'spielfrei' : homeTeam,
              awayTeam: spielfrei ? 'spielfrei' : awayTeam,
              spielfrei,
              location: homeTeam,
            });
          }
        }
        return matches;
      }, []);
  }
}

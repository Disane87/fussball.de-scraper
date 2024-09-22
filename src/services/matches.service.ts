import { Injectable } from '@nestjs/common';
import { Match } from '../interfaces';
import * as cheerio from 'cheerio';
import { AxiosResponse } from 'axios';
import { HttpService } from '@nestjs/axios';

@Injectable()
export class MatchesService {
  private readonly baseUrl =
    'https://www.fussball.de/ajax.team.matchplan/-/mode/PAGE/team-id/';

  constructor(private readonly httpService: HttpService) {}

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
    return this.parseMatches(html, showSpielfrei);
  }

  // Parse the HTML to extract match information
  private parseMatches(html: string, showSpielfrei: boolean): Match[] {
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

          // Set time to null if not available
          const time = timeMatch ? timeMatch[1] : null;

          if (dateMatch && (!spielfrei || showSpielfrei)) {
            matches.push({
              date: dateMatch[1],
              time, // Time can be null
              homeTeam: spielfrei ? 'spielfrei' : homeTeam,
              awayTeam: spielfrei ? 'spielfrei' : awayTeam,
              spielfrei,
            });
          }
        }
        return matches;
      }, []);
  }
}

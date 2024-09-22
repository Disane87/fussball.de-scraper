/*
https://docs.nestjs.com/providers#services
*/

import { Injectable } from '@nestjs/common';
import { createEvents, EventAttributes } from 'ics';
import fs from 'fs';
import { Config, Match } from 'src/interfaces';

@Injectable()
export class CalendarService {
  createIcalEvents(matches: Match[], config: Config): EventAttributes[] {
    return matches
      .filter((match) => !match.spielfrei) // Spielfreie Matches herausfiltern
      .map((match) => {
        const [day, month, year] = match.date.split('.');

        // Wenn die Zeit vorhanden ist, teile sie in Stunde und Minute auf, ansonsten setze Standardwerte
        const [hour, minute] = match.time
          ? match.time.split(':')
          : ['00', '00']; // Standardzeit, falls keine Uhrzeit vorhanden ist

        // Korrigiertes eventStart, das genau 5 Elemente enthält (year, month, day, hour, minute)
        const eventStart: [number, number, number, number, number] = [
          parseInt(`20${year}`),
          parseInt(month),
          parseInt(day),
          parseInt(hour) - config.vorlaufzeit.hours,
          parseInt(minute) - config.vorlaufzeit.minutes,
        ];

        const title = `${match.homeTeam} vs ${match.awayTeam}`;
        const description = `Fußballspiel: ${match.homeTeam} vs. ${match.awayTeam}`;

        return {
          start: eventStart,
          duration: config.spieldauer,
          title,
          description,
          status: 'CONFIRMED',
        };
      });
  }

  // Funktion, um die iCal-Datei zu erstellen
  saveIcalToFile(events: EventAttributes[], filename: string): void {
    createEvents(events, (error, value) => {
      if (error) {
        console.error('Error creating events:', error);
        return;
      }
      fs.writeFileSync(filename, value!);
      console.log(`iCal file created: ${filename}`);
    });
  }
}

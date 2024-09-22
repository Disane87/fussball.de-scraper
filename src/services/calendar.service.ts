/*
https://docs.nestjs.com/providers#services
*/

import { Injectable } from '@nestjs/common';
import { createEvents, EventAttributes } from 'ics';
import fs from 'fs';
import { Config, Match } from 'src/interfaces';
import { DateTime } from 'luxon';

@Injectable()
export class CalendarService {
  createIcalEvents(matches: Match[], config: Config): EventAttributes[] {
    return matches
      .filter((match) => !match.spielfrei) // Spielfreie Matches herausfiltern
      .map((match) => {
        // ISO-Datum verarbeiten und die Zeit basierend auf der Zeitzone "Europe/Berlin" anpassen
        const matchDateTime = DateTime.fromISO(match.date, {
          zone: 'Europe/Berlin',
        });

        // Die Vorlaufzeit abziehen
        const eventStart = matchDateTime
          .minus({
            hours: config.vorlaufzeit.hours,
            minutes: config.vorlaufzeit.minutes,
          })
          .toJSDate(); // Konvertiere zu einem JavaScript Date-Objekt, wenn erforderlich

        const title = `${match.homeTeam} vs ${match.awayTeam}`;
        const description = `Fußballspiel: ${match.homeTeam} vs. ${match.awayTeam}`;

        return {
          start: eventStart, // Event-Startzeit als Date-Objekt
          duration: config.spieldauer, // Dauer des Events basierend auf der Konfiguration
          title,
          description,
          status: 'CONFIRMED',
          busyStatus: 'BUSY',
        } as EventAttributes;
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

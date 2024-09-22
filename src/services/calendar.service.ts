/*
https://docs.nestjs.com/providers#services
*/

import { Injectable } from '@nestjs/common';
import { DurationObject, EventAttributes } from 'ics';
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
        const eventStart = matchDateTime.minus({
          hours: config.vorlaufzeit.hours,
          minutes: config.vorlaufzeit.minutes,
        });

        // iCal erwartet das Datum als Array [Jahr, Monat, Tag, Stunde, Minute]
        const eventStartArray: [number, number, number, number, number] = [
          eventStart.year,
          eventStart.month,
          eventStart.day,
          eventStart.hour,
          eventStart.minute,
        ];

        // console.log('Event Start Array:', eventStartArray);

        const title = `${match.homeTeam} vs. ${match.awayTeam}`;
        const description = `Fußballspiel: ${match.homeTeam} vs. ${match.awayTeam}`;

        // Gesamtdauer berechnen (Spieldauer + Vorlaufzeit)
        const totalDuration: DurationObject = {
          hours: config.spieldauer.hours + config.vorlaufzeit.hours,
          minutes: config.spieldauer.minutes + config.vorlaufzeit.minutes,
        };

        console.log('Title:', title);
        console.log('Total Duration:', totalDuration);

        const [lat, lon] = match.locationCoords;

        return {
          start: eventStartArray, // Event-Startzeit als Date-Objekt
          duration: totalDuration, // Dauer des Events basierend auf der Konfiguration
          title,
          description,
          status: 'CONFIRMED',
          busyStatus: 'BUSY',
          organizer: {
            name: match.homeTeam,
          },
          geo: {
            lat,
            lon,
          },
          location: match.homeTeam,
          calName: 'Fußballspiele ⚽',
          categories: ['Fußballspiel'],
          startInputType: 'local', // Zeitzone explizit festlegen
          startOutputType: 'local', // Zeitzone explizit festlegen
        } as EventAttributes;
      });
  }
}

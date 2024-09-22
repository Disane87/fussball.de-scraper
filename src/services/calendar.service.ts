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

        const title = `${match.homeTeam} vs. ${match.awayTeam}`;
        const description = `Fußballspiel: ${match.homeTeam} vs. ${match.awayTeam}`;

        // Gesamtdauer berechnen (Spieldauer + Vorlaufzeit)
        const totalDuration: DurationObject = {
          hours: config.spieldauer.hours + config.vorlaufzeit.hours,
          minutes: config.spieldauer.minutes + config.vorlaufzeit.minutes,
        };

        // Überprüfung, ob locationCoords gesetzt sind
        const geo = match.locationCoords
          ? { lat: match.locationCoords[0], lon: match.locationCoords[1] }
          : undefined; // Falls keine Koordinaten vorhanden sind, wird "geo" undefined

        // Dynamische Werte für X-APPLE Felder erstellen
        // const appleStructuredLocation = `X-APPLE-STRUCTURED-LOCATION;VALUE=URI;X-ADDRESS="${match.location}";X-TITLE="${match.homeTeam}":geo:${match.locationCoords ? match.locationCoords.join(',') : '0,0'}`;

        // const appleTravelStart = `X-APPLE-TRAVEL-START;ROUTING=CAR;VALUE=URI;X-ADDRESS="Rennstraße 33\n41751 Viersen\nDeutschland";X-TITLE="Rennstraße 33":geo:51.248564,6.336578`;

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
          ...(geo && { geo }), // Nur hinzufügen, wenn Geo-Koordinaten verfügbar sind
          location: `${match.homeTeam}\n${match.location}`, // Standort im Format "Teamname\nAdresse"
          calName: 'Fußballspiele ⚽',
          categories: ['Fußballspiel'],
          startInputType: 'local', // Zeitzone explizit festlegen
          startOutputType: 'local', // Zeitzone explizit festlegen
          // extra: `${appleStructuredLocation}\n${appleTravelStart}`, // X-APPLE Felder hinzufügen
        } as EventAttributes;
      });
  }
}

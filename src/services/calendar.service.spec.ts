import { Test, TestingModule } from '@nestjs/testing';
import { CalendarService } from './calendar.service';
import { Match, Config } from 'src/interfaces';
import { DateTime } from 'luxon';
import { DurationObject, EventAttributes } from 'ics';

describe('CalendarService', () => {
  let service: CalendarService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CalendarService],
    }).compile();

    service = module.get<CalendarService>(CalendarService);
  });

  describe('createIcalEvents', () => {
    it('should filter out spielfrei matches', () => {
      const mockMatches: Match[] = [
        {
          date: new Date(),
          homeTeam: 'Team A',
          awayTeam: 'Team B',
          spielfrei: false,
          location: 'Stadium 1',
          locationCoords: [51.1657, 10.4515],
        },
        {
          date: new Date(),
          homeTeam: 'Team C',
          awayTeam: 'Team D',
          spielfrei: true, // This match should be filtered out
        },
      ];

      const mockConfig: Config = {
        spieldauer: { hours: 2, minutes: 0 },
        vorlaufzeit: { hours: 1, minutes: 0 },
        spielfreiAnzeigen: true,
      };

      const result = service.createIcalEvents(mockMatches, mockConfig);
      expect(result.length).toBe(1); // Only 1 match should be included
      expect(result[0].title).toBe('Team A vs. Team B');
    });

    it('should calculate event start time with vorlaufzeit', () => {
      const mockDate = DateTime.local(2023, 9, 22, 18, 0).toISO(); // 22nd September 2023, 18:00
      const mockMatches: Match[] = [
        {
          date: mockDate,
          homeTeam: 'Team A',
          awayTeam: 'Team B',
          spielfrei: false,
          location: 'Stadium 1',
          locationCoords: [51.1657, 10.4515],
        },
      ];

      const mockConfig: Config = {
        spieldauer: { hours: 2, minutes: 0 },
        vorlaufzeit: { hours: 1, minutes: 0 },
        spielfreiAnzeigen: true,
      };

      const result = service.createIcalEvents(mockMatches, mockConfig);

      const expectedStartArray = [2023, 9, 22, 17, 0]; // Vorlaufzeit of 1 hour before 18:00
      expect(result[0].start).toEqual(expectedStartArray);
    });

    it('should calculate the correct duration for the event', () => {
      const mockDate = DateTime.local(2023, 9, 22, 18, 0).toISO(); // 22nd September 2023, 18:00
      const mockMatches: Match[] = [
        {
          date: mockDate,
          homeTeam: 'Team A',
          awayTeam: 'Team B',
          spielfrei: false,
          location: 'Stadium 1',
          locationCoords: [51.1657, 10.4515],
        },
      ];

      const mockConfig: Config = {
        spieldauer: { hours: 2, minutes: 0 }, // Game lasts 2 hours 30 minutes
        vorlaufzeit: { hours: 1, minutes: 0 }, // 30 minutes preparation time
        spielfreiAnzeigen: true,
      };

      const result = service.createIcalEvents(mockMatches, mockConfig);

      const expectedDuration = { hours: 3, minutes: 0 }; // 2:30 + 0:30 = 3 hours
      const testCase = (
        result[0] as EventAttributes & { duration: DurationObject }
      ).duration as DurationObject;

      expect(testCase).toEqual(expectedDuration);
    });

    it('should include location and geo coordinates if available', () => {
      const mockDate = DateTime.local(2023, 9, 22, 18, 0).toISO(); // 22nd September 2023, 18:00D
      const mockMatches: Match[] = [
        {
          date: mockDate,
          homeTeam: 'Team A',
          awayTeam: 'Team B',
          spielfrei: false,
          location: 'Stadium 1',
          locationCoords: [51.1657, 10.4515], // Latitude and Longitude of Germany
        },
      ];

      const mockConfig: Config = {
        spieldauer: { hours: 2, minutes: 0 },
        vorlaufzeit: { hours: 1, minutes: 0 },
        spielfreiAnzeigen: true,
      };

      const result = service.createIcalEvents(mockMatches, mockConfig);

      expect(result[0].location).toBe('Team A\nStadium 1');
      expect(result[0].geo).toEqual({ lat: 51.1657, lon: 10.4515 });
    });

    it('should not include geo if locationCoords is not available', () => {
      const mockDate = DateTime.local(2023, 9, 22, 18, 0).toISO(); // 22nd September 2023, 18:00
      const mockMatches: Match[] = [
        {
          date: mockDate,
          homeTeam: 'Team A',
          awayTeam: 'Team B',
          spielfrei: false,
          location: 'Stadium 1',
        },
      ];

      const mockConfig: Config = {
        spieldauer: { hours: 2, minutes: 0 },
        vorlaufzeit: { hours: 1, minutes: 0 },
        spielfreiAnzeigen: true,
      };

      const result = service.createIcalEvents(mockMatches, mockConfig);

      expect(result[0].geo).toBeUndefined();
    });
  });
});

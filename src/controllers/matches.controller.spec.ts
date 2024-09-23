import { Test, TestingModule } from '@nestjs/testing';
import { MatchesController } from './matches.controller';
import { MatchesService } from 'src/services/matches.service';
import { ConfigService } from '@nestjs/config';
import { Match } from 'src/interfaces';
import { createEvents } from 'ics';
import { CalendarService } from 'src/services/calendar.service';

jest.mock('ics'); // Mocking the 'ics' module

describe('MatchesController', () => {
  let controller: MatchesController;
  let matchesService: MatchesService;
  let calendarService: CalendarService;
  let configService: ConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MatchesController],
      providers: [
        {
          provide: MatchesService,
          useValue: {
            matchesForTeam: jest.fn(),
          },
        },
        {
          provide: CalendarService,
          useValue: {
            createIcalEvents: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue('default-team-id'),
          },
        },
      ],
    }).compile();

    controller = module.get<MatchesController>(MatchesController);
    matchesService = module.get<MatchesService>(MatchesService);
    calendarService = module.get<CalendarService>(CalendarService);
    configService = module.get<ConfigService>(ConfigService);
  });

  describe('getMatchesJson', () => {
    it('should return matches for a given team', async () => {
      const mockMatches: Match[] = [
        {
          date: new Date('2023-09-22'),
          homeTeam: 'Team A',
          awayTeam: 'Team B',
          spielfrei: false,
          location: 'Stadium 1',
          locationCoords: [51.1657, 10.4515],
        },
        {
          date: new Date('2023-09-29'),
          homeTeam: 'Team C',
          awayTeam: 'Team D',
          spielfrei: true,
        },
      ]; // Mock match data

      (matchesService.matchesForTeam as jest.Mock).mockResolvedValue(
        mockMatches,
      );

      const result = await controller.getMatchesJson('team-id');

      expect(matchesService.matchesForTeam).toHaveBeenCalledWith(
        'team-id',
        true,
      );
      expect(result).toEqual(mockMatches);
    });

    it('should use default team id if none is provided', async () => {
      const mockMatches: Match[] = [
        {
          date: new Date('2023-09-22'),
          homeTeam: 'Team A',
          awayTeam: 'Team B',
          spielfrei: false,
          location: 'Stadium 1',
          locationCoords: [51.1657, 10.4515],
        },
      ]; // Mock match data

      (matchesService.matchesForTeam as jest.Mock).mockResolvedValue(
        mockMatches,
      );

      const result = await controller.getMatchesJson();

      expect(matchesService.matchesForTeam).toHaveBeenCalledWith(
        'default-team-id',
        true,
      );
      expect(result).toEqual(mockMatches);
    });
  });

  describe('getMatchesIcal', () => {
    it('should return a valid iCal string', async () => {
      const mockMatches: Match[] = [
        {
          date: new Date('2023-09-22'),
          homeTeam: 'Team A',
          awayTeam: 'Team B',
          spielfrei: false,
          location: 'Stadium 1',
          locationCoords: [51.1657, 10.4515],
        },
      ]; // Mock match data
      const mockIcalEvents = [
        {
          start: [2023, 9, 22, 18, 0],
          title: 'Team A vs Team B',
          location: 'Stadium 1',
          description: 'Football match between Team A and Team B',
        },
      ]; // Mock iCal event data
      const mockIcal = { value: 'mock-ical-data', error: null };

      (matchesService.matchesForTeam as jest.Mock).mockResolvedValue(
        mockMatches,
      );
      (calendarService.createIcalEvents as jest.Mock).mockReturnValue(
        mockIcalEvents,
      );
      (createEvents as jest.Mock).mockImplementation(
        (events, options) => mockIcal,
      );

      const result = await controller.getMatchesIcal('team-id');

      expect(matchesService.matchesForTeam).toHaveBeenCalledWith(
        'team-id',
        true,
      );
      expect(calendarService.createIcalEvents).toHaveBeenCalledWith(
        mockMatches,
        expect.any(Object),
      );
      expect(result).toBe('mock-ical-data');
    });

    it('should throw an error if ical generation fails', async () => {
      const mockMatches: Match[] = [
        {
          date: new Date('2023-09-22'),
          homeTeam: 'Team A',
          awayTeam: 'Team B',
          spielfrei: false,
          location: 'Stadium 1',
          locationCoords: [51.1657, 10.4515],
        },
      ]; // Mock match data
      const mockIcalEvents = [
        {
          start: [2023, 9, 22, 18, 0],
          title: 'Team A vs Team B',
          location: 'Stadium 1',
          description: 'Football match between Team A and Team B',
        },
      ]; // Mock iCal event data
      const mockIcal = {
        value: null,
        error: { message: 'Failed to generate iCal' },
      };

      (matchesService.matchesForTeam as jest.Mock).mockResolvedValue(
        mockMatches,
      );
      (calendarService.createIcalEvents as jest.Mock).mockReturnValue(
        mockIcalEvents,
      );
      (createEvents as jest.Mock).mockImplementation(() => mockIcal);

      await expect(controller.getMatchesIcal('team-id')).rejects.toThrow(
        'Failed to generate iCal',
      );

      expect(matchesService.matchesForTeam).toHaveBeenCalledWith(
        'team-id',
        true,
      );
      expect(calendarService.createIcalEvents).toHaveBeenCalledWith(
        mockMatches,
        expect.any(Object),
      );
    });
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { GeocodingController } from './geocoding.controller';
import { GeocodingService } from 'src/services/geocoder.service';

describe('GeocodingController', () => {
  let controller: GeocodingController;
  let geocodingService: GeocodingService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GeocodingController],
      providers: [
        {
          provide: GeocodingService,
          useValue: {
            getCoordsFromAddress: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<GeocodingController>(GeocodingController);
    geocodingService = module.get<GeocodingService>(GeocodingService);
  });

  describe('getCoordsFromAddress', () => {
    it('should return coordinates for the given address', async () => {
      const mockCoords: [number, number] = [51.1657, 10.4515]; // Mock coordinates for Germany
      const address = 'Berlin';

      // Mocking the service method
      (geocodingService.getCoordsFromAddress as jest.Mock).mockResolvedValue(
        mockCoords,
      );

      const result = await controller['getCoordsFromAddress'](address);

      expect(geocodingService.getCoordsFromAddress).toHaveBeenCalledWith(
        address,
      );
      expect(result).toEqual(mockCoords);
    });
  });
});

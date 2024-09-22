import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { lastValueFrom } from 'rxjs';
import * as NodeGeocoder from 'node-geocoder';

@Injectable()
export class GeocodingService {
  constructor(private readonly httpService: HttpService) {}

  public async getCoordsFromAddress(
    address: string,
  ): Promise<[number, number] | null> {
    const options = {
      provider: 'openstreetmap',
      formatter: null, // 'gpx', 'string', ...
      email: 'your-email@domain.com', // Email for Nominatim's contact information
      osmServer: 'https://nominatim.openstreetmap.org', // Nominatim default server
      fetch: async (url: string, options: any) => {
        const headers = {
          'user-agent': 'YourAppName <your-email@domain.com>',
          Referer: 'https://yourdomain.com', // Optional, use your website if available
          ...options.headers, // Merge additional headers if present
        };

        // Use HttpService to fetch the URL and ensure the response is treated as text
        const response = await lastValueFrom(
          this.httpService.get(url, {
            headers,
            responseType: 'text', // Ensure the response is returned as plain text
          }),
        );

        if (response.status !== 200) {
          console.error('Error fetching data:', response.statusText);
          return { text: () => null }; // Return an empty response
        }

        return { text: () => response.data }; // Return the raw text response
      },
    };

    const geocoder = NodeGeocoder(options);
    const res = await geocoder.geocode(address);

    if (res.length === 0) {
      console.error('No Coordinates found for:', address);
      return null; // Return an empty response
    }

    return res.map((r) => [r.latitude, r.longitude])[0];
  }
}

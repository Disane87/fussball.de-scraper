import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { lastValueFrom } from 'rxjs';
import node_geocoder from 'node-geocoder';
import { RequestInfo, RequestInit, Response } from 'node-fetch'; // node-fetch direkt importieren
import { author } from '../../package.json';

@Injectable()
export class GeocodingService {
  constructor(private readonly httpService: HttpService) {}

  public async getCoordsFromAddress(
    address: string,
  ): Promise<[number, number] | null> {
    const options: node_geocoder.Options = {
      provider: 'openstreetmap',
      formatter: null, // 'gpx', 'string', etc.
      email: author, // Email for Nominatim's contact information
      osmServer: 'https://nominatim.openstreetmap.org', // Nominatim default server
      fetch: async (
        url: RequestInfo, // Typ bleibt jetzt konsistent
        init?: RequestInit,
      ): Promise<Response> => {
        // Ensure the URL is treated as a string
        const requestUrl = url instanceof URL ? url.toString() : url;

        const headers = {
          'user-agent': author,
          Referer: process.env.VERCEL_URL || 'http://localhost:3000',
          ...(init?.headers || {}), // Merge with any existing headers
        };

        // Use HttpService to fetch the URL and ensure the response is treated as text
        const response = await lastValueFrom(
          this.httpService.get(requestUrl.toString(), {
            headers,
            responseType: 'text', // Ensure the response is returned as plain text
          }),
        );

        // Map the response to a fetch-like Response object
        return {
          ok: response.status === 200,
          status: response.status,
          statusText: response.statusText,
          url: requestUrl,
          text: async () => response.data, // Must be async to match the Response interface
        } as Response; // Ensure the return type matches Response
      },
    };

    const geocoder = node_geocoder(options);
    const res = await geocoder.geocode(address);

    if (res.length === 0) {
      console.error('No Coordinates found for:', address);
      return null; // Return an empty response
    }

    return res.length > 0 ? [res[0].latitude, res[0].longitude] : null;
  }
}

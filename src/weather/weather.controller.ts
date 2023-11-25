import { Controller, Get, Query } from '@nestjs/common';
import { WeatherService } from './weather.service';

@Controller('weather')
export class WeatherController {
  constructor(private readonly weatherService: WeatherService) {}

  @Get()
  async getWeatherData(@Query('nx') nx: string, @Query('ny') ny: string) {
    const data = await this.weatherService.getWeatherData(nx, ny);
    return data;
  }
}

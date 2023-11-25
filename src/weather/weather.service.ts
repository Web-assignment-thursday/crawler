import { Injectable } from '@nestjs/common';
import axios from 'axios';
import * as cheerio from 'cheerio';

@Injectable()
export class WeatherService {
  async getWeatherData() {
    const url =
      'http://www.weather.go.kr/weather/forecast/mid-term-rss3.jsp?stnId=109';
    const response = await axios.get(url);
    const $ = cheerio.load(response.data);

    const wData: Array<any> = [];

    $('location').each((_, locElement) => {
      const city = $(locElement).find('city').text();

      $(locElement)
        .find('data')
        .each((_, dataElement) => {
          wData.push({
            도시: city,
            날짜: $(dataElement).find('tmef').text(),
            날씨: $(dataElement).find('wf').text(),
            최저: $(dataElement).find('tmn').text(),
            최고: $(dataElement).find('tmx').text(),
          });
        });
    });

    return wData;
  }
}

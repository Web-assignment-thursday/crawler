import { HttpService } from '@nestjs/axios';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { lastValueFrom } from 'rxjs';
import * as moment from 'moment';
import * as xml2js from 'xml2js'; // Add this line

@Injectable()
export class WeatherService {
  constructor(private httpService: HttpService) {}

  async getWeatherData(nx: string, ny: string) {
    const keys =
      'S0qf+UB531+t1UKeTsetlCgcznr8Uhnhht8IpVqzVU2IR8eQwydy+dB31jactAOyiWYZQtQGRKB/OLQcKx10Ug==';
    const url =
      'http://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getUltraSrtFcst';
    const params = {
      serviceKey: keys,
      pageNo: '1',
      numOfRows: '1000',
      dataType: 'XML',
      base_date: moment().format('YYYYMMDD'),
      base_time: '0600',
      nx: nx,
      ny: ny,
    };

    const response$ = this.httpService.get(url, { params });
    const response = await lastValueFrom(response$);

    if (response.status !== 200) {
      throw new HttpException(
        'Failed to get weather data',
        HttpStatus.BAD_REQUEST,
      );
    }

    const xmlData = response.data;
    let dictData: any = {};

    try {
      dictData = await xml2js.parseStringPromise(xmlData, {
        explicitArray: false,
      });
    } catch (err) {
      throw new HttpException(
        'Failed to parse XML data',
        HttpStatus.BAD_REQUEST,
      );
    }

    let itemData = dictData.response.body.items.item;

    if (!itemData) {
      throw new HttpException(
        'No weather data available',
        HttpStatus.BAD_REQUEST,
      );
    }

    // array로 변환
    if (!Array.isArray(itemData)) {
      itemData = [itemData];
    }

    // 값 가져오기
    const weatherData = {};
    for (const item of itemData) {
      const fcstDate = item['fcstDate'];
      const fcstTime = item['fcstTime'];
      const key = `${fcstDate}-${fcstTime}`;

      if (!(key in weatherData)) {
        weatherData[key] = {};
      }

      // 기온
      if (item['category'] === 'T1H') {
        weatherData[key]['기온'] = item['fcstValue'] + ' C';
      }
      // 습도
      if (item['category'] === 'REH') {
        weatherData[key]['습도'] = item['fcstValue'] + ' %';
      }
      // 하늘상태: 맑음(1) 구름많은(3) 흐림(4)
      if (item['category'] === 'SKY') {
        let skyStatus = '';
        switch (item['fcstValue']) {
          case '1':
            skyStatus = '맑음';
            break;
          case '3':
            skyStatus = '구름많음';
            break;
          case '4':
            skyStatus = '흐림';
            break;
        }
        weatherData[key]['하늘상태'] = skyStatus;
      }
      // 강수형태: 없음(0), 비(1), 비/눈(2), 눈(3), 소나기(4)
      if (item['category'] === 'PTY') {
        let ptyStatus = '';
        switch (item['fcstValue']) {
          case '0':
            ptyStatus = '없음';
            break;
          case '1':
            ptyStatus = '비';
            break;
          case '2':
            ptyStatus = '비/눈';
            break;
          case '3':
            ptyStatus = '눈';
            break;
          case '4':
            ptyStatus = '소나기';
            break;
        }
        weatherData[key]['강수형태'] = ptyStatus;
      }
      // 강수량
      if (item['category'] === 'RN1') {
        let rainfall = item['fcstValue'];
        if (rainfall === '강수없음') {
          rainfall = '0';
        }
        weatherData[key]['강수량'] = rainfall + ' mm';
      }
    }

    return weatherData;
  }
}

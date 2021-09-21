import { Phone } from './Phone';
import { get as config } from 'config';
import querystring from 'querystring';
import axios from 'axios';

const api_id: string = config('sms.api_id');
const debug: string = config('sms.debug');

export class Sms {
  public async send(to: Phone, msg: string): Promise<void> {
    // небольшой кулдаун
    await new Promise(resolve => setTimeout(resolve, 1000));

    if (debug) {
      console.log(`[SMS] ${to} ${msg}`);
      return;
    }

    const query = querystring.stringify({ api_id, to, msg, json: 1 });
    await axios.get(`https://sms.ru/sms/send?${query}`);
  }
}

export default new Sms;

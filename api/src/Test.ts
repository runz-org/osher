import sqlite from './sqlite/Client';
import { Model as Product } from './product/Model';
import { Model as SberModel, RegisterOptions } from './sber/Model';
import http from 'http';
import sber from './sber/Client';
import sms from './Sms';
import {Phone} from './Phone';

export class Test {
  public async start(): Promise<void> {
    //this.uploadForm();
    //await this.listProducts();
    //await this.listTransactions();
    //await this.newTransaction(1000);
    //const code = '1234'
    //sms.send('79164462243' as Phone, `osher.club, код для входа ${code}`);
  }

  public async payment(): Promise<void> {
    await sber.register({
      amount: 100,
      orderNumber: '1',
      returnUrl: 'https://osher.club'
    });
  }

  public async uploadForm(): Promise<void> {
    const action='http://localhost:7000/img';
    const html =
    '<html><head></head><body>' +
      `<form method="POST" enctype="multipart/form-data" action="${action}">` +
        '<input type="file" name="image"><br />' +
        '<input type="submit">' +
      '</form>' +
    '</body></html>';

    http.createServer((req: any, res: any) => {
      res.writeHead(200, { Connection: 'close' });
      res.end(html);
    }).listen(8000, () => {
      console.log('Listening for requests, port 8000');
    });
  }

  public async listProducts(): Promise<void> {
    await sqlite(async db => {
      const model = new Product(db);
      const rows = await model.findAll();

      for (const row of rows) {
        console.log(row);
      }
    }, {readonly: true});
  }

  public async newTransaction(amount: number, options: RegisterOptions = {}): Promise<void> {
    await sqlite(async db => {
      const model = new SberModel(db);
      const result = await model.register(amount, options);
      console.log(result);
    });
  }

  public async listTransactions(): Promise<void> {
    await sqlite(async db => {
      const model = new SberModel(db);
      const rows = await model.findAll();

      for (const row of rows) {
        console.log(row);
      }
    }, {readonly: true});
  }
}

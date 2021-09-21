/*
 * API к Сберу - полностью соответствует документации на
 * https://securepayments.sberbank.ru/wiki/doku.php/integration:api:rest:start
 *
 * Использование:
 *    import sber from '/path/to/sber';
 *    sber.register(...
 */

import { createHmac } from 'crypto';
import fs from 'fs/promises';
import { get as config } from 'config';
import moment from 'moment';
import axios from 'axios';
import querystring from 'querystring';
import { Is, InferEntry } from '../Is';

export class SberError extends Error {
  constructor (
    public readonly message: string,
    public readonly code: string,
  ) {
    super(message);
  }
}

export const isSberError = (x: unknown): x is SberError => x instanceof SberError;

export enum Operation {
  approved = 'approved',
  deposited = 'deposited',
  reversed = 'reversed',
  refunded = 'refunded',
  declinedByTimeout = 'declinedByTimeout',
}

export enum Feature {
  default = '',
  auto_payment = 'AUTO_PAYMENT',
  verify = 'VERIFY',
  force_tds = 'FORCE_TDS',
  force_ssl = 'FORCE_SSL',
  force_full_tds = 'FORCE_FULL_TDS',
}

export const isCardAuthInfo = new Is({
  maskedPan: Is.string,
  expiration: Is.string,
  cardholderName: Is.string,
  approvalCode: Is.string,
  pan: Is.string,
} as const)

export const isSecureAuthInfo = new Is({
  eci: Is.number,
  cavv: Is.string,
  xid: Is.string,
} as const)

export const isBindingInfo = new Is({
  clientId: Is.string,
  bindingId: Is.string,
  authDateTime: Is.string,
  authRefNum: Is.string,
  terminalId: Is.string,
} as const);

export const isPaymentAmountInfo = new Is({
  approvedAmount: Is.number,
  depositedAmount: Is.number,
  refundedAmount: Is.number,
  paymentState: Is.string,
  feeAmount: Is.number,
} as const);

export const isBankInfo = new Is({
  bankName: Is.string,
  bankCountryCode: Is.string,
  bankCountryName: Is.string,
} as const);

export const isSberCallbackData = new Is({
  mdOrder: Is.string,
  orderNumber: Is.string,
  checksum: Is.string,
  operation: Is.enum(Operation),
  status: Is.boolean,
} as const);

export type CallbackData = InferEntry<typeof isSberCallbackData>

export interface OrderStatus {
  amount: number,
  orderNumber: string,
  currency: number,
  orderDescription: string,
  orderStatus: number,
  actionCode: number,
  actionCodeDescription: string,
  date: Date,
  ip: string,
  attributes: {name: string, value: string}[],
  merchantOrderParams: {name: string, value: string}[],
  terminalId: string,
  cardAuthInfo: InferEntry<typeof isCardAuthInfo>,
  secureAuthInfo: InferEntry<typeof isSecureAuthInfo>,
  bindingInfo?: InferEntry<typeof isBindingInfo>,
  paymentAmountInfo: InferEntry<typeof isPaymentAmountInfo>,
  bankInfo: InferEntry<typeof isBankInfo>,
}

export class Client {
  protected baseUrl: string;
  protected userName: string;
  protected password: string;
  protected secret: string;
  protected language: string;
  protected log_file: string;

  public constructor(config: {
    baseUrl?: string
    userName: string,
    password: string,
    secret: string,
    language?: string,
    log_file?: string,
  }) {
    this.baseUrl = config.baseUrl || 'https://3dsec.sberbank.ru';
    this.userName = config.userName;
    this.password = config.password;
    this.secret = config.secret;
    this.language = config.language || 'ru';
    this.log_file = config.log_file || '/dev/null';
  }

  private async do(path: string, request: Record<string, any>): Promise<any> {
    Object.keys(request).forEach(key => request[key] === undefined && delete request[key])

    try {
      const result = await axios.post(`${this.baseUrl}/payment/${path}.do`, querystring.stringify({
        userName: this.userName,
        password: this.password,
        ...request,
      }), {
        headers: { 
          "Content-Type": "application/x-www-form-urlencoded",
        },
      });
      const data = result.data;
      const {
        errorCode = 'unknown',
        errorMessage,
        ...response
      } = (Is.object(data) ? data : {
        errorMessage: Is.string(data) ? data : 'unknown',
      }) as {
        errorCode?: string,
        errorMessage?: string,
      };

      if ('0' !== errorCode && errorMessage) {
        throw new SberError(errorMessage, `SERVICE_${errorCode}`);
      }

      console.info('Sber request', null, { path, request/*, response*/ });

      return response;

    } catch (error) {
      if (!isSberError(error)) {
        const { message, response } = error;
        const code = undefined === response ? 'SYSTEM' : `HTTP_${response.status}`;
        error = new SberError(message, code);
      }

      console.error('Sber error', null, {
         path,
         request,
         error: {code: error.code, message: error.message},
      });
      throw error;
    }
  }

  // Регистрация заказа (если preAuth=true - с предавторизацией)
  public async register(options: {
    amount: number,
    orderNumber: string,
    returnUrl: string, 

    failUrl?: string,
    clientId?: string,
    bindingId?: string,
    preAuth?: boolean,
    features?: Feature,

    currency?: number,
    description?: string,
    jsonParams?: string,
    pageView?: string,
    merchantLogin?: string,

    sessionTimeoutSecs?: number,
    expirationDate?: Date,

    dynamicCallbackUrl?: string,

  }): Promise<{
    formUrl: string,
    orderId: string,
  }> {
    const {preAuth, expirationDate, amount, features, ...request} = options;

    return this.do('rest/register' + (preAuth ? 'PreAuth' : ''), {
      ...request,
      amount: Math.round(options.amount * 100),
      features: Feature.default === features ? undefined : features,
      expirationDate: expirationDate ? moment(expirationDate).format('YYYY-MM-DDTHH:mm:ss') : undefined,
      language: this.language,
    });
  }

  // Завершение оплаты заказа
  public async deposit(orderId: string, amount: number): Promise<void> {
    await this.do('rest/deposit', {
      orderId,
      amount: Math.round(amount * 100),
    });
  }

  // Отмена оплаты заказа
  public async reverse(orderId: string): Promise<void> {
    await this.do('rest/reverse', {
      orderId,
      language: this.language,
    });
  }

  // Возврат средств оплаты заказа
  public async refund(orderId: string, amount: number): Promise<void> {
    await this.do('rest/refund', {
      orderId,
      amount: Math.round(amount * 100),
      language: this.language,
    });
  }

  // Запрос проведения оплаты по связкам
  public async paymentOrderBinding(options: {
    mdOrder: string,
    bindingId: string,
    ip: string,
    cvc?: string,
    email?: string,
  }): Promise<{
    redirect: string,
    info: string,
    error: string,
    acsUrl: string,
    paReq: string,
    termUrl: string,
  }> {
    return this.do('rest/paymentOrderBinding', {
      ...options,
      language: this.language,
    });
  }

  // Получение статуса заказа
  public async getOrderStatus(orderId: string): Promise<OrderStatus> {
    const status = await this.do('rest/getOrderStatusExtended', {
      orderId,
      language: this.language,
    });

    return {
      ...status,
      amount: status.amount / 100,
      date: (new Date()).setTime(status.date),
    }
  }

  // Получение статуса заказа по внутреннему номеру
  public async getOrderStatusByNumber(orderNumber: string): Promise<OrderStatus> {
    const status = await this.do('rest/getOrderStatusExtended', {
      orderNumber,
      language: this.language,
    });

    return {
      ...status,
      amount: status.amount / 100,
      date: (new Date()).setTime(status.date),
    }
  }

  // Активация связки
  public async bindCard(bindingId: string): Promise<void> {
    await this.do('rest/bindCard', {bindingId});
  }

  // Деактивация связки
  public async unBindCard(bindingId: string): Promise<void> {
    await this.do('rest/unBindCard', {bindingId});
  }

  // Изменение срока действия связки
  public async extendBinding(bindingId: string, newExpiry: string): Promise<void> {
    await this.do('rest/extendBinding', {
      bindingId,
      newExpiry,
      language: this.language,
    });
  }

  // Получение списка всех связок клиента
  public async getBindingsByClient(clientId: string): Promise<{
    maskedPan: string,
    bindingId: string,
    expiryDate: string,
  }[]> {
    return this.do('rest/getBindings', {clientId});
  }

  // Получение списка связок по номеру карты
  public async getBindingsByCard(maskedPan: string): Promise<{
    clientId: string,
    bindingId: string,
    expiryDate: string,
  }[]> {
    return this.do('rest/getBindingsByCardOrId', {pan: maskedPan});
  }

  // Получение списка связок по известному идентификатору связки
  public async getBindingsById(bindingId: string): Promise<{
    clientId: string,
    maskedPan: string,
    expiryDate: string,
  }[]> {
    return this.do('rest/getBindingsByCardOrId', {bindingId});
  }

  public isValidChecksum(data: CallbackData): boolean {
    const {checksum, status, ...payload} = <any>data;
    payload.status = status ? 1 : 0;

    return Object.keys(payload).sort().reduce(
      (hmac, key) => hmac.update(`${key};${payload[key]};`),
      createHmac('sha256', this.secret)
    ).digest('hex').toUpperCase() === checksum;
  }

  public async log(data: CallbackData): Promise<void> {
    await fs.appendFile(this.log_file, JSON.stringify(data) + "\n");
  }
}

export default new Client(config('sber'));

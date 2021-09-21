import api from './api';

export enum Status {
  wait_approve = 'wait_approve', // Ожидает подтверждения (после создания)
  approved = 'approved', // Создан
  wait_deposit = 'wait_deposit', // Ожидает завершения оплаты
  deposited = 'deposited', // Оплачен
  wait_reverse = 'wait_reverse', // Ожидает отмены
  reversed = 'reversed', // Отменен
  wait_refund = 'wait_refund', // Ожидает возврата средств
  refunded = 'refunded', // Средства возвращены
  declined = 'declined', // Отклонён
}

export interface Entry {
  id: number,
  register_mts: number,
  amount: number,
  status: Status,
  maskedPan: string,
  expiration: string,
  cardholderName: string,
}

export class Module {
  public async findAll(): Promise<Entry[]> {
    const result = await api.pushOne('transaction.findAll', {});
    return result.map((item: {id: number, entry: any}) => ({
      id: item.id,
      register_mts: item.entry.register_mts,
      amount: item.entry.amount,
      status: item.entry.status,
      maskedPan: item.entry.cardAuthInfo.maskedPan,
      expiration: item.entry.cardAuthInfo.expiration,
      cardholderName: item.entry.cardAuthInfo.cardholderName,
    }))
  }
}

export default new Module;

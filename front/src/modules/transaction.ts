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
  mdOrder: string,
  amount: number,
  status: Status,
}

export class Module {
  public register(amount: number): Promise<string> {
    return api.pushOne('transaction.register', { amount });
  }

  public async getByMdOrder(mdOrder: string): Promise<Entry | null> {
    const item = await api.pushOne('transaction.getByMdOrder', { mdOrder });

    return null === item ? null : {
      mdOrder,
      amount: item.entry.amount,
      status: item.entry.status,
    }
  }

  public watchStatus(mdOrder: string, on: (status: Status) => void) {
    const event = 'transaction.statusChange';
    api.setQuery(event, { mdOrder }, result => on(result.status));
    return () => api.removeQuery(event);
  }
}

export default new Module;

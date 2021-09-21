export interface Item {
  label: string,
  icon: string,
  to?: string,
  items?: Item[],
  command?: CallableFunction,
  separator?: boolean,
  class?: string,
  target?: string,
  badge?: string,
  url?: string,
  style?: string,
  disabled?: boolean,
  visible?: boolean | CallableFunction,
}

export class Module {
  public tree(): Item[] {
    return [{
      label: 'Главная',
      icon: 'pi pi-fw pi-home',
      to: '/',
    }, {
      label: 'Категории',
      icon: 'pi pi-fw pi-sitemap',
      to: '/categories',
    }, {
      label: 'Мероприятия',
      icon: 'pi pi-fw pi-list',
      to: '/products',
    }, {
      label: 'Билеты',
      icon: 'pi pi-fw pi-ticket',
      to: '/tickets',
    }, {
      label: 'Платежи',
      icon: 'pi pi-fw pi-credit-card',
      to: '/transactions',
    }, {
      label: 'Пользователи',
      icon: 'pi pi-fw pi-users',
      to: '/users',
    }, {
      label: 'Сессии',
      icon: 'pi pi-fw pi-desktop',
      to: '/sessions',
    }];
  }
}

export default new Module;

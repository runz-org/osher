import slugify from "slugify";

export class Module {
  public currency(value: number): string {
    return value.toLocaleString('ru-RU', {style: 'currency', currency: 'RUB'});
  };

  public date(value: number): string {
    return (new Date(value)).toLocaleString('ru-RU', {
      year: 'numeric', month: 'numeric', day: 'numeric',
      hour: 'numeric', minute: 'numeric', second: 'numeric',
    });
  };

  // one - И.п. ед.ч.
  // two - Р.п. ед.ч.
  // five - Р.п мн.ч.
  public pieces(number: number, one: string, two: string, five: string): string {
    if (1 != Math.floor(number % 100 / 10)) {
      switch (number % 10) {
        case 1:
          return one;
        case 2:
        case 3:
        case 4:
          return two;
      }
    }

    return five;
  }

  public toSlug(text: string): string {
    return slugify(text, {
      replacement: '-',
      lower: true,
      strict: true,
      locale: 'ru',
    });
  }
}

export default new Module;

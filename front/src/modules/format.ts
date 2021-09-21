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

  public imageUrl(filename: string, width: number, height: number): string {
    const root = import.meta.env.VITE_IMG_URL;

    if (typeof root !== 'string') {
      throw new Error(`VITE_IMG_URL is undefined`);
    }

    const dir = filename.substring(0, 2) + '/' + filename.substring(2, 4);
    return `${root}/${width}/${height}/${dir}/${filename}`;
  }
}

export default new Module;

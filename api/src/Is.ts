export class Is<Entry extends object> {

  public static readonly string =
    (x: unknown): x is string => typeof x === 'string'

  public static readonly number =
    (x: unknown): x is number => typeof x === 'number'

  public static readonly boolean =
    (x: unknown): x is boolean => typeof x === 'boolean'

  public static readonly unknown =
    (x: unknown): x is unknown => true

  public static readonly object =
    (x: unknown): x is object => typeof x === 'object' && null !== x

  public static readonly enum = <T>(e: T) =>
    (x: unknown): x is T[keyof T] =>
      (Is.string(x) || Is.number(x)) && Object.values(e).includes(x)

  public readonly keys: (keyof Entry)[];

  constructor(
    public readonly value: {[K in keyof Entry]: (x: unknown) => x is Entry[K]},
  ) {
    this.keys = Object.keys(value) as (keyof Entry)[];
    this.key = this.key.bind(this);
    this.partial = this.partial.bind(this);
    this.entry = this.entry.bind(this);
  }

  public readonly key = (x: unknown): x is keyof Entry =>
    Is.string(x) && this.keys.includes(x as keyof Entry);

  public readonly partial = (x: unknown): x is Partial<Entry> =>
    Is.object(x) && !Object.entries(x).find(
      ([key, value]) => !this.key(key) || !this.value[key](value)
    );

  public readonly entry = (x: unknown): x is Entry =>
    this.partial(x) && !this.keys.find(key => undefined === x[key]);
}

export type InferEntry<T> = T extends Is<infer Entry> ? Entry : never;

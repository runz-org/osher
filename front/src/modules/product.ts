import api from './api';

export enum Status {
  hidden = 'hidden',
  upcomming = 'upcomming',
  done = 'done',
}

export type Images = string[];
export type GeoLocation = [number, number];

export interface Entry {
  slug: string,
  start_time: string,
  title: string,
  status: Status,
  description: string,
  content: string,
  price: number,
  category: string,
  location: string,
  images: Images,
  geoloc: GeoLocation,
}

export class Module {
  public async findAll(): Promise<{id: number, entry: Entry}[]> {
    //await new Promise(resolve => setTimeout(resolve, 3000));
    const results = await api.pushMany([{
      method: 'product.categories',
      params: {},
    }, {
      method: 'product.findAll',
      params: {},
    }]);

    const cats: Record<string, string> = {};

    for (const {title, slug} of results[0].result) {
      cats[slug] = title;
    }

    return results[1].result.map(({id, entry}: {id: number, entry: Entry}) => ({
      id,
      entry: undefined === cats[entry.category] ? entry : {...entry, category: cats[entry.category]}
    }));
  }

  public async getBySlug(slug: string): Promise<{id: number, entry: Entry} | null> {
    const result = await api.pushOne('product.getBySlug', { slug });

    if (null === result) {
      return null;
    }

    if (undefined !== result.category) {
      const catResult = await api.pushOne('product.getCategoryBySlug', { slug: result.category });

      if (null !== catResult) {
        result.category = catResult.title;
      }
    }

    return result;
  }
}

export default new Module;

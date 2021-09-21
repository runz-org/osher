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

export interface Category {
  slug: string,
  title: string,
}

export interface NewEntry {
  category: string,
  slug: string,
  start_time: string,
  title: string,
}

export class Module {
  public findAll(): Promise<{id: number, entry: Entry}[]> {
    return api.pushOne('product.findAll', {});
  }

  public getById(id: number): Promise<Entry | null> {
    return api.pushOne('product.getById', { id });
  }

  public insertOne(entry: NewEntry): Promise<{ id: number }> {
    return api.pushOne('product.insertOne', { entry });
  }

  public updateById(id: number, entry: Partial<Entry>): Promise<{ changes: number }> {
    return api.pushOne('product.updateById', { id, entry });
  }

  public deleteById(id: number): Promise<{ changes: number }> {
    return api.pushOne('product.deleteById', { id });
  }

  public categories(): Promise<Category[]> {
    return api.pushOne('product.categories', {});
  }

  public async insertCategory(category: Category): Promise<void> {
    await api.pushOne('product.insertCategory', { category });
  }

  public async updateCategory(slug: string, category: Category): Promise<void> {
    await api.pushOne('product.updateCategory', { slug, category });
  }

  public async deleteCategory(slug: string): Promise<void> {
    await api.pushOne('product.deleteCategory', { slug });
  }
}

export default new Module;

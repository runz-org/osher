import sqlite from '../sqlite/Client';
import { Session } from '../sqlite/Session';
import { Is } from '../Is';
import { AbstractService, Context } from '../AbstractService';
import { is, Model, Entry } from './Model';
import { isCategory, CategoryModel, Category } from './Category';
import { Files } from '../img/Files';
import { Role } from '../user/Model';

export class Service extends AbstractService {
  // Полный список
  public findAll(): Promise<{
    id: number,
    entry: Entry,
  }[]> {
    return this.model(model => model.findAll(), { readonly: true });
  }

  // Получить по uri
  public getBySlug({ slug }: { slug: string }): Promise<{
    id: number,
    entry: Entry,
  } | null> {
    return this.model(model => model.getBySlug(slug), { readonly: true });
  }

  // Получить по id
  public getById({ id }: { id: number }): Promise<Entry | null> {
    return this.model(model => model.getById(id), { readonly: true });
  }

  // Добавить
  public async insertOne({ entry } : { entry: Partial<Entry> }): Promise<{
    id: number,
  }> {
    return { id: await this.model(model => model.insertOne(entry)) };
  }

  // Изменить
  public updateById({ id, entry }: { id: number, entry: Partial<Entry> }): Promise<{
    changes: number,
  }> {
    return this.model(async model => {
      const oldEntry = await model.getById(id);
      const changes = null === oldEntry ? 0 : await model.updateById(id, entry);
      const unusedImages = null === oldEntry ? [] : await model.unusedImages(oldEntry.images.filter(
        filename => undefined !== entry.images && !entry.images.includes(filename)
      ));
      await (new Files).bulkRemove(unusedImages);
      return { changes };
    });
  }

  // Удалить
  public deleteById({ id }: { id: number }): Promise<{
    changes: number,
  }> {
    return this.model(async model => {
      const oldEntry = await model.getById(id);
      const changes = null === oldEntry ? 0 : await model.deleteById(id);
      const unusedImages = null === oldEntry ? [] : await model.unusedImages(oldEntry.images);
      await (new Files).bulkRemove(unusedImages);
      return { changes };
    });
  }

  // Полный список категорий
  public categories(): Promise<Category[]> {
    return this.categoryModel(async model => {
      const result = await model.findAll();
      return result.map(item => item.entry);
    }, { readonly: true });
  }

  // Получить категорию по uri
  public getCategoryBySlug({ slug }: { slug: string}): Promise<Category | null> {
    return this.categoryModel(model => model.getBySlug(slug), { readonly: true });
  }

  // Добавить категорию
  public async insertCategory({ category } : { category: Partial<Category> }): Promise<{ id: number }> {
    return { id: await this.categoryModel(model => model.insertOne(category)) };
  }

  // Изменить категорию
  public updateCategory({ slug, category }: { slug: string, category: Partial<Category> }): Promise<{ changes: number }> {
    return this.categoryModel(async model => {
      const changes =  await model.updateBySlug(slug, category);
      return { changes };
    });
  }

  // Удалить категорию
  public deleteCategory({ slug }: { slug: string }): Promise<{ changes: number }> {
    return this.categoryModel(async model => {
      const changes = await model.deleteBySlug(slug);
      return { changes };
    });
  }

  protected model<P>(
    callback: (model: Model, session?: Session) => Promise<P>,
    options: {readonly?: boolean} = {},
  ): Promise<P> {
    if (options.readonly) {
      return sqlite(db => callback(new Model(db)), { readonly: true, shared: true });
    } else {
      return sqlite(db => db.transaction(session => callback(new Model(db), session)));
    }
  }

  protected categoryModel<P>(
    callback: (model: CategoryModel, session?: Session) => Promise<P>,
    options: {readonly?: boolean} = {},
  ): Promise<P> {
    if (options.readonly) {
      return sqlite(db => callback(new CategoryModel(db)), { readonly: true, shared: true });
    } else {
      return sqlite(db => db.transaction(session => callback(new CategoryModel(db), session)));
    }
  }
}

const slug = Is.string;
const id = Is.number;
const entry = (x: unknown): x is Partial<Entry> => is.partial(x);
const category = (x: unknown): x is Partial<Category> => isCategory.partial(x);

const admin = ({ user }: Context) => user?.role === Role.admin;
const guest = () => true;

export const api = (new Service).defineApi({
  findAll: [{}, guest],
  getBySlug: [{ slug }, guest],
  getById: [{ id }, admin],
  insertOne: [{ entry }, admin],
  updateById: [{ id, entry }, admin],
  deleteById: [{ id }, admin],
  categories: [{}, guest],
  getCategoryBySlug: [{ slug }, guest],
  insertCategory: [{ category }, admin],
  updateCategory: [{ slug, category }, admin],
  deleteCategory: [{ slug }, admin],
})
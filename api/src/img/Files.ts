import { createReadStream, promises as fs } from 'fs';
import { dirname } from 'path';
import { Resizer } from './Resizer';
import crypto from 'crypto';
import mime from 'mime-types';

export class Files {
  protected allowedTypes = ['image/jpeg', 'image/png'];

  protected md5(filename: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const hash = crypto.createHash('md5');
      hash.once('readable', () => resolve(hash.read().toString('hex')));
      createReadStream(filename).on('error', reject).pipe(hash);
    });
  }

  protected dir(filename: string): string {
    return filename.substring(0, 2) + '/' + filename.substring(2, 4) + '/' + filename;
  }

  protected originalPath(filename: string): string {
    return `${__dirname}/../../storage/img/${this.dir(filename)}`;
  }

  public async exists(filename: string): Promise<boolean> {
    try {
      const stat = await fs.stat(this.originalPath(filename));

      if (stat.isFile()) {
        return true;
      }
    } catch (error) {
      if ('ENOENT' !== error.code) {
        throw error;
      }
    }

    return false;
  }

  public async put(src: string): Promise<string> {
    const type = mime.lookup(src);

    if (false === type || !this.allowedTypes.includes(type)) {
      throw new Error(`Allowed types: [${this.allowedTypes.join(', ')}], type given: ${type}`);
    }

    const hash = await this.md5(src);
    const ext = mime.extension(type);
    const filename = `${hash}.${ext}`;
    const exists = await this.exists(filename);

    if (!exists) {
      const dest = this.originalPath(filename);
      await fs.mkdir(dirname(dest), { recursive: true });
      await fs.copyFile(src, dest);
    }

    return filename;
  }

  public async remove(filename: string): Promise<boolean> {
    let dest = this.originalPath(filename);

    try {
      await fs.unlink(dest);

    } catch (error) {
      if ('ENOENT' === error.code) {
        return false;
      }

      throw error;
    }

    for (let level = 0; level < 3; level++) {
      dest = dirname(dest);
      const hasFiles = await fs.readdir(dest);

      if (hasFiles.length > 0) {
        break;
      }

      await fs.rmdir(dest);
    }

    return true;
  }

  public async bulkRemove(filenames: string[]): Promise<void> {
    await Promise.all(filenames.map(filename => this.remove(filename)));
  }

  public async toBuffer(filename: string): Promise<Buffer> {
    return fs.readFile(this.originalPath(filename));
  }

  public async resize(filename: string, width: number, height: number): Promise<Buffer> {
    const dest = `${__dirname}/../../img/${width}/${height}/${this.dir(filename)}`;

    try {
      return await fs.readFile(dest);

    } catch (error) {
      if ('ENOENT' !== error.code) {
        throw error;
      }

      const original = await this.toBuffer(filename);
      const image = await (new Resizer).resize(original, width, height);

      await fs.mkdir(dirname(dest), { recursive: true });
      await fs.writeFile(dest, image);

      return image;
    }
  }

  public parseUri(uri: string): {
    filename: string,
    width: number,
    height: number,
    type: string,
  } | null {
    const match = new RegExp(
      '\/(?<width>[0-9]{2,4})' +
      '\/(?<height>[0-9]{2,4})' +
      '\/(?<dir1>[0-9a-f]{2})' +
      '\/(?<dir2>[0-9a-f]{2})' +
      '\/(?<hash>[0-9a-f]{32})\.(?<ext>jpeg|png)'
    ).exec(uri);

    if (null !== match && undefined !== match.groups) {
      const filename = `${match.groups.hash}.${match.groups.ext}`;
      const width = parseInt(match.groups.width);
      const height = parseInt(match.groups.height);

      if (width > 0 && height > 0 && `/${width}/${height}/${this.dir(filename)}` === uri) {
        return { filename, width, height, type: mime.lookup(filename) || '' };
      }
    }

    return null;
  }
}

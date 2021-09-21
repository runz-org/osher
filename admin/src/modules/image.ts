import axios from 'axios'
import api from './api';

export class Module {
  protected get root(): string {
    const result = import.meta.env.VITE_IMG_URL;

    if (typeof result !== 'string') {
      throw new Error(`VITE_IMG_URL is undefined`);
    }

    return result;
  }

  public async upload(file: any): Promise<string> {
    const data = new FormData;
    data.append('image', file);
    const headers = { ...api.headers, 'Content-Type': 'multipart/form-data' };
    const result = await axios.post(this.root, data, { headers });
    return result.data.result;
  }

  public url(filename: string, width: number, height: number): string {
    const dir = filename.substring(0, 2) + '/' + filename.substring(2, 4);
    return `${this.root}/${width}/${height}/${dir}/${filename}`;
  }
}

export default new Module;

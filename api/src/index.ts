import { Http } from './Http';
import { Test } from './Test';
import { Files as ImgFiles } from './img/Files';
import { DbUpdate } from './DbUpdate';
import commander from 'commander';

commander
  .command('http')
  .action(() => (new Http).start())

commander
  .command('img:put <src>')
  .action(async (src: string) => {
    const filename = await (new ImgFiles).put(src);
    console.log(filename);
  })

commander
  .command('img:rm <filename>')
  .action(async (filename: string) => {
    await (new ImgFiles).remove(filename);
  })

commander
  .command('db:update')
  .action(() => (new DbUpdate).schema())

commander
  .command('test')
  .action(() => (new Test).start())

commander.parse(process.argv);

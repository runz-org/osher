import sharp from 'sharp';

export class Resizer {
  public async resize(original: Buffer, width: number, height: number): Promise<Buffer> {
    sharp.cache({
      memory: 50,
      files: 20,
      items: 100,
    });
    sharp.concurrency(0);
    sharp.simd(true);

    const transformer = sharp(original);

    transformer.resize(width, height, {
      withoutEnlargement: true,
      fit: sharp.fit.inside
    });

    return transformer.toBuffer();
  }
}

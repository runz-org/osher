import { randomBytes } from 'crypto';

export enum Mode {
  deferred = 'DEFERRED',
  immediate = 'IMMEDIATE',
  savepoint = 'SAVEPOINT',
}

export class Session {
  protected name: string | null = null;

  constructor(
    public readonly mode: Mode,
    public readonly parent: Session | null = null,
  ) {
    if (Mode.savepoint === this.mode) {
      this.name = '';
      const chars = 'abcdefghijklmnopqrstuvwxyz';
      const bytes = randomBytes(16);

      for (const byte of bytes) {
        this.name += chars.charAt(byte % chars.length);
      }
    }
  }

  public get begin() {
    return this.name ? `SAVEPOINT ${this.name}` : `BEGIN ${this.mode}`;
  }

  public get commit() {
    return this.name ? `RELEASE ${this.name}` : 'COMMIT';
  }

  public get rollback() {
    return this.name ? `ROLLBACK TO ${this.name}` : 'ROLLBACK';
  }
}

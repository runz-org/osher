import { Is } from './Is';

export type Phone = '70000000000';
export const isPhone = (x: unknown): x is Phone => Is.string(x) && /^7\d{10}$/.test(x);

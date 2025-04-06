import type { Faker } from '@faker-js/faker';

export interface IFakerModel {
  load(locale?: string): Promise<Faker>;
}

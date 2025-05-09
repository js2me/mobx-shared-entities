import type { Faker } from '@faker-js/faker';

export class FakerLoader {
  async load(locale: string = 'ru'): Promise<Faker> {
    const module = await import(`@faker-js/faker/locale/${locale}`);
    return module.faker;
  }
}

export const createFakerLoader = () => new FakerLoader();

/**
 * @deprecated use {FakerLoader}
 */
export const FakerModel = FakerLoader;

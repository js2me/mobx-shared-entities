import { IFakerModel } from './model.types.js';

export class FakerModel implements IFakerModel {
  async load(locale: string = 'ru') {
    const module = await import(`@faker-js/faker/locale/${locale}`);
    return module.faker;
  }
}

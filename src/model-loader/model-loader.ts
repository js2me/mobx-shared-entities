import { LinkedAbortController } from 'linked-abort-controller';
import { observable, runInAction } from 'mobx';
import { AnyObject, Maybe } from 'yummies/utils/types';

import { ModelLoadedState } from './model-loader.types.js';

const cacheAccessSymbol = Symbol('[lazy-models]');

export class ModelLoader {
  private abortController: LinkedAbortController;

  constructor(abortSignal?: AbortSignal) {
    this.abortController = new LinkedAbortController(abortSignal);
  }

  protected getStorage(context: AnyObject): Map<any, ModelLoadedState> {
    if (!context[cacheAccessSymbol]) {
      Object.defineProperty(context, cacheAccessSymbol, {
        configurable: false,
        enumerable: false,
        writable: false,
        value: observable.map<any, ModelLoadedState>(),
      });

      this.abortController.signal.addEventListener('abort', () => {
        if (context[cacheAccessSymbol]) {
          context[cacheAccessSymbol].clear();
        }
      });
    }

    return context[cacheAccessSymbol];
  }

  connect<
    TContext extends AnyObject,
    TProperty extends keyof TContext,
    TModel,
  >({
    context,
    property,
    fn,
  }: {
    context: TContext;
    property: TProperty;
    fn: () => Promise<TModel>;
  }): Maybe<TModel> {
    const storage = this.getStorage(context);

    runInAction(() => {
      storage.set(property, {
        property,
        fn,
      });
    });

    fn().then((data) => {
      if (this.abortController.signal.aborted) {
        return;
      }

      runInAction(() => {
        storage.set(property, {
          property,
          fn,
          data,
        });

        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        context[property] = data;
      });
    });

    return null;
  }

  isLoading<TContext extends AnyObject, TProperty extends keyof TContext>(
    context: TContext,
    property: TProperty,
  ): boolean {
    const storage = this.getStorage(context);
    return storage.get(property)?.data == null;
  }
}

import { LinkedAbortController } from 'linked-abort-controller';
import { computed, makeObservable, observable, runInAction } from 'mobx';
import { AnyObject, Maybe } from 'yummies/utils/types';

import { ModelLoadedState, ModelLoaderOptions } from './model-loader.types.js';

const storageAccessSymbol = Symbol('[lazy-models]');

export class ModelLoader<TContext extends AnyObject> {
  private abortController: LinkedAbortController;

  private context: TContext;

  constructor(private options: ModelLoaderOptions<TContext>) {
    this.abortController = new LinkedAbortController(options.abortSignal);
    this.context = options.context;

    computed.struct(this, 'hasLoadingModels');

    makeObservable(this);
  }

  protected get storage(): Map<any, ModelLoadedState> {
    if (!this.context[storageAccessSymbol]) {
      Object.defineProperty(this.context, storageAccessSymbol, {
        configurable: false,
        enumerable: false,
        writable: false,
        value: observable.map<any, ModelLoadedState>(),
      });

      this.abortController.signal.addEventListener('abort', () => {
        if (this.context[storageAccessSymbol]) {
          this.context[storageAccessSymbol].clear();
        }
      });
    }

    return this.context[storageAccessSymbol];
  }

  connect<TProperty extends keyof TContext, TModel>({
    property,
    fn,
  }: {
    property: TProperty;
    fn: () => Promise<TModel>;
  }): Maybe<TModel> {
    runInAction(() => {
      this.storage.set(property, {
        property,
        fn,
      });
    });

    fn()
      .then((data) => {
        if (this.abortController.signal.aborted) {
          return;
        }

        runInAction(() => {
          this.storage.set(property, {
            property,
            fn,
            data,
          });

          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          context[property] = data;
        });
      })
      .catch((error) => this.handleLoadModelFailed(error));

    return null;
  }

  protected handleLoadModelFailed(e: any) {
    this.options.onLoadFailed?.(e);
  }

  get hasLoadingModels() {
    return [...this.storage.values()].some((it) => it.data == null);
  }

  isLoading<TProperty extends keyof TContext>(property: TProperty): boolean {
    return this.storage.get(property)?.data == null;
  }
}

export const createModelLoader = /*#__PURE__*/ <TContext extends AnyObject>(
  options: ModelLoaderOptions<TContext>,
) => new ModelLoader(options);

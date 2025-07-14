import { LinkedAbortController } from 'linked-abort-controller';
import { action, computed, makeObservable, observable } from 'mobx';
import { AnyObject } from 'yummies/utils/types';

import { ModelLoadedState, ModelLoaderOptions } from './model-loader.types.js';

const storageAccessSymbol = Symbol('[lazy-models]');

export class ModelLoader<TContext extends AnyObject> {
  private abortController: LinkedAbortController;

  private context: TContext;

  constructor(private options: ModelLoaderOptions<TContext>) {
    this.abortController = new LinkedAbortController(options.abortSignal);
    this.context = options.context;

    computed.struct(this, 'hasLoadingModels');
    computed.struct(this, 'hasErroredModels');

    action(this, 'load');
    action(this, 'handleLoadModelSucceed');
    action(this, 'handleLoadModelFailed');

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
          delete this.context[storageAccessSymbol];
        }
      });
    }

    return this.context[storageAccessSymbol];
  }

  /**
   * Loads a model and stores it in the context.
   * The model is loaded by calling the provided function.
   */
  load<TModel>(key: keyof any, fn: () => Promise<TModel>) {
    this.storage.set(key, {
      key,
      fn,
    });

    fn()
      .then((data) => this.handleLoadModelSucceed(data, fn, key))
      .catch((error) => this.handleLoadModelFailed(error, fn, key));

    return null;
  }

  /**
   * Connects a model loader to a property of the context.
   * This method will automatically load the model when the property is accessed.
   */
  connect<TProperty extends keyof TContext, TModel>({
    property,
    fn,
  }: {
    property: TProperty;
    fn: () => Promise<TModel>;
  }): TModel | null {
    return this.load(property, fn);
  }

  protected handleLoadModelSucceed(
    data: any,
    fn: () => Promise<any>,
    property: any,
  ) {
    if (this.abortController.signal.aborted) {
      return;
    }

    this.storage.set(property, {
      key: property,
      fn,
      data,
    });

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    context[property] = data;

    this.options.onLoadSucceed?.(data, property);
  }

  protected handleLoadModelFailed(
    error: any,
    fn: () => Promise<any>,
    property: any,
  ) {
    if (this.abortController.signal.aborted) {
      return;
    }

    this.storage.set(property, {
      key: property,
      fn,
      error,
    });

    this.options.onLoadFailed?.(error, property);
  }

  get hasErroredModels() {
    return [...this.storage.values()].some((it) => it.error != null);
  }

  get hasLoadingModels() {
    return [...this.storage.values()].some((it) => it.data == null);
  }

  /**
   * Returns the loaded model instance for the given property.
   */
  get<TProperty extends keyof TContext>(
    property: TProperty,
  ): TContext[TProperty] | null;
  /**
   * Returns the loaded model instance for the given property.
   */
  get<TInstance>(property: string): TInstance | null;

  /**
   * Returns the loaded model instance for the given property.
   */
  get<TProperty extends keyof TContext>(
    property: TProperty,
  ): TContext[TProperty] | null {
    return this.storage.get(property)?.data ?? null;
  }

  /**
   * Returns the model load error for the given property if it exists, otherwise returns null.
   */
  getError<TProperty extends keyof TContext>(property: TProperty): Error | null;
  /**
   * Returns the model load error for the given property if it exists, otherwise returns null.
   */
  getError(key: string): Error | null;

  /**
   * Returns the model load error for the given property if it exists, otherwise returns null.
   */
  getError<TProperty extends keyof TContext>(key: TProperty): Error | null {
    return this.storage.get(key)?.error ?? null;
  }

  /**
   * Checks if the model for the given property is currently loading.
   */
  isLoading<TProperty extends keyof TContext>(property: TProperty): boolean;
  /**
   * Checks if the model for the given property is currently loading.
   */
  isLoading(key: string): boolean;

  /**
   * Checks if the model for the given property is currently loading.
   */
  isLoading<TProperty extends keyof TContext>(key: TProperty): boolean {
    return this.storage.get(key)?.data == null;
  }
}

export const createModelLoader = <TContext extends AnyObject>(
  options: ModelLoaderOptions<TContext>,
) => new ModelLoader(options);

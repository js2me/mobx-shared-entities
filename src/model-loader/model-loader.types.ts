import { AnyObject } from 'yummies/utils/types';

export interface ModelLoadedState {
  property: any;
  data?: any;
  fn: () => Promise<any>;
}

export interface ModelLoaderOptions<TContext extends AnyObject> {
  /**
   * This is instance of your class where
   * will be stored loaded modules cache
   */
  context: TContext;
  abortSignal?: AbortSignal;
  onLoadFailed?: (e: any) => void;
}

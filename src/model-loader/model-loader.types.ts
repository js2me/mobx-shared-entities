import { AnyObject } from 'yummies/utils/types';

export interface ModelLoadedState {
  key: any;
  data?: any;
  error?: any;
  fn: () => Promise<any>;
}

export interface ModelLoaderOptions<TContext extends AnyObject> {
  /**
   * This is instance of your class where
   * will be stored loaded modules cache
   */
  context: TContext;
  abortSignal?: AbortSignal;
  onLoadFailed?: (error: any, property: any) => void;
  onLoadSucceed?: (data: any, property: any) => void;
}

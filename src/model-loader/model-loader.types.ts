export interface ModelLoadedState {
  property: any;
  data?: any;
  fn: () => Promise<any>;
}

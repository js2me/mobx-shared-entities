import { Disposer } from 'mobx-disposer-util';

export interface ReadOnlyPaginationData {
  totalPages: number;
}

export interface InputPaginationData {
  page: number;
  pageSize: number;
}

export interface PaginationData
  extends ReadOnlyPaginationData,
    InputPaginationData {}

export interface MobxPaginatorConfig extends Partial<PaginationData> {
  disposer?: Disposer;
}

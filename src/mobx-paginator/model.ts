import { Disposer, Disposable, IDisposer } from 'disposer-util';
import {
  action,
  computed,
  makeObservable,
  observable,
  reaction,
  runInAction,
} from 'mobx';

import {
  InputPaginationData,
  PaginationData,
  MobxPaginatorConfig,
  PaginationOffsetData,
} from './model.types';

export class MobxPaginator implements Disposable {
  private disposer: IDisposer;

  private page: number;

  private pageSize: number;

  pageSizes: number[];

  private pagesCount: number;

  constructor({
    page,
    pageSize,
    pagesCount,
    pageSizes,
    disposer,
  }: MobxPaginatorConfig) {
    this.disposer = disposer ?? new Disposer();
    this.page = page ?? 1;
    this.pageSize = pageSize ?? 10;
    this.pagesCount = pagesCount ?? 1;
    this.pageSizes = pageSizes;

    makeObservable<this, 'page' | 'pageSize' | 'pagesCount'>(this, {
      page: observable.ref,
      pageSize: observable.ref,
      pageSizes: observable.ref,
      pagesCount: observable.ref,
      inputData: computed,
      data: computed,
      toPreviousPage: action.bound,
      toNextPage: action.bound,
      toPage: action.bound,
      setPageSize: action.bound,
      setPagesCount: action.bound,
      setPageSizes: action.bound,
      reset: action.bound,
    });
  }

  get inputData(): InputPaginationData {
    return {
      page: this.page,
      pageSize: this.pageSize,
    };
  }

  get data(): PaginationData {
    return {
      ...this.inputData,
      pagesCount: this.pagesCount,
    };
  }

  toPreviousPage() {
    this.toPage(this.page - 1);
  }

  toNextPage() {
    this.toPage(this.page + 1);
  }

  toPage(page: number) {
    this.page = Math.max(1, Math.min(page, this.pagesCount));
  }

  setPageSize(pageSize: number) {
    this.pageSize = pageSize;
    this.reset();
  }

  setPagesCount(pagesCount: number) {
    this.pagesCount = pagesCount;
  }

  setPageSizes(pageSizes: number[]) {
    this.pageSizes = pageSizes;
  }

  reset() {
    this.toPage(1);
  }

  syncWith(getParamsFn: () => Partial<PaginationData>) {
    this.disposer.add(
      reaction(
        getParamsFn,
        ({ pageSize, page, pagesCount: totalPages }) => {
          runInAction(() => {
            this.pageSize = pageSize ?? this.pageSize;
            this.page = page ?? this.page;
            this.pagesCount = totalPages ?? this.pagesCount;
          });
        },
        {
          fireImmediately: true,
        },
      ),
    );
  }

  createFromOffsetData({
    offset,
    limit,
    count,
  }: PaginationOffsetData): PaginationData {
    const page = Math.floor(offset / limit) + 1;
    const pagesCount = Math.ceil(count / limit);
    const pageSize = limit;

    return {
      pagesCount,
      page,
      pageSize,
    };
  }

  createOffsetData({
    pageSize,
    pagesCount,
    page,
  }: PaginationData): PaginationOffsetData {
    return {
      limit: pageSize,
      count: pagesCount * pageSize,
      offset: (page - 1) * pageSize,
    };
  }

  toOffsetData(): PaginationOffsetData {
    return this.createOffsetData(this.data);
  }

  dispose(): void {
    this.disposer.dispose();
  }
}

import { action, computed, observable, reaction, runInAction } from 'mobx';
import { Disposer, Disposable } from 'mobx-disposer-util';

import {
  InputPaginationData,
  PaginationData,
  MobxPaginatorConfig,
  PaginationOffsetData,
} from './model.types';

export class MobxPaginator implements Disposable {
  private disposer: Disposer;

  @observable
  private accessor page: number;

  @observable
  private accessor pageSize: number;

  @observable
  private accessor pagesCount: number;

  constructor({
    page,
    pageSize,
    pagesCount: totalPages,
    disposer,
  }: MobxPaginatorConfig = {}) {
    this.disposer = disposer ?? new Disposer();
    this.page = page ?? 1;
    this.pageSize = pageSize ?? 10;
    this.pagesCount = totalPages ?? 1;
  }

  @computed
  get inputData(): InputPaginationData {
    return {
      page: this.page,
      pageSize: this.pageSize,
    };
  }

  @computed
  get data(): PaginationData {
    return {
      ...this.inputData,
      pagesCount: this.pagesCount,
    };
  }

  @action.bound
  toPreviousPage() {
    this.toPage(this.page - 1);
  }

  @action.bound
  toNextPage() {
    this.toPage(this.page + 1);
  }

  @action.bound
  toPage(page: number) {
    this.page = Math.max(1, Math.min(page, this.pagesCount));
  }

  @action.bound
  setPageSize(pageSize: number) {
    this.pageSize = pageSize;
    this.reset();
  }

  @action.bound
  setTotalPages(totalPages: number) {
    this.pagesCount = totalPages;
  }

  @action.bound
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

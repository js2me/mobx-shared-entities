import { action, computed, observable, reaction, runInAction } from 'mobx';
import { Disposer, Disposable } from 'mobx-disposer-util';

import {
  InputPaginationData,
  PaginationData,
  MobxPaginationModelParams,
} from './model.types';

export class MobxPaginatorModel implements Disposable {
  private disposer: Disposer;

  @observable
  private accessor page: number;

  @observable
  private accessor pageSize: number;

  @observable
  private accessor totalPages: number;

  constructor({
    page,
    pageSize,
    totalPages,
    disposer,
  }: MobxPaginationModelParams = {}) {
    this.disposer = disposer ?? new Disposer();
    this.page = page ?? 1;
    this.pageSize = pageSize ?? 10;
    this.totalPages = totalPages ?? 1;
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
      totalPages: this.totalPages,
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
    this.page = Math.max(1, Math.min(page, this.totalPages));
  }

  @action.bound
  setPageSize(pageSize: number) {
    this.pageSize = pageSize;
    this.reset();
  }

  @action.bound
  setTotalPages(totalPages: number) {
    this.totalPages = totalPages;
  }

  @action.bound
  reset() {
    this.toPage(1);
  }

  syncWith(getParamsFn: () => Partial<PaginationData>) {
    this.disposer.add(
      reaction(
        getParamsFn,
        ({ pageSize, page, totalPages }) => {
          runInAction(() => {
            this.pageSize = pageSize ?? this.pageSize;
            this.page = page ?? this.page;
            this.totalPages = totalPages ?? this.totalPages;
          });
        },
        {
          fireImmediately: true,
        },
      ),
    );
  }

  dispose(): void {
    this.disposer.dispose();
  }
}

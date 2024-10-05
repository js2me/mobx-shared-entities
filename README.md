[![npm](https://img.shields.io/npm/v/mobx-shared-entities)](https://www.npmjs.com/package/mobx-shared-entities) 
[![license](https://img.shields.io/npm/l/mobx-shared-entities)](https://github.com/js2me/mobx-shared-entities/blob/master/LICENSE)  

# mobx-shared-entities  

# [Paginator](src/paginator/model.ts)  

Model which helps to use pagination with tables  

## usage  
```ts
import { Paginator } from 'mobx-shared-entities/paginator';

class SomeModel {
  paginator = new Paginator({
    disposer: this.disposer,
  });
}

someModel.paginator.toNextPage()
someModel.paginator.toPreviousPage()

someModel.paginator.inputData;
```

# [Socket](src/socket/model.ts)  

Model which helps to create ws connection with sending\receiving data from ws  

## usage  
```ts
import { Socket } from 'mobx-shared-entities/socket';

class SomeModel {
  socket = new Socket({
    url: 'ws//localhost:8081',
    reconnect: { enabled: true },
  });
}

someModel.socket.open();

reaction(
  () => someModel.socker.message,
  (message) => {
    console.info('message', message);
  },
);
```

# [Stepper](src/stepper/model.ts)  

Model which helps to create step mechanism  

## usage  
```ts
import { Stepper } from 'mobx-shared-entities/stepper';

class SomeModel {
  stepper = new Stepper({
    steps: [1, 2, 3],
  });
}

someModel.stepper.nextStep()
someModel.stepper.isLastStep;

someModel.stepper.activeStep;
```

# [Ticker](src/ticker/model.ts)  

Model with counter and start timer  

## usage  
```ts
import { Ticker } from 'mobx-shared-entities/ticker';

class SomeModel {
  ticker = new Ticker({
    ticksPer: 1_000,
  });
}

someModel.ticker.start();

reaction(
  () => someModel.ticker.ticks,
  (ticks) => {
    console.info('ticks', ticks);
  },
);
```

# [TabManager](src/tab-manager/model.ts)  

Shared code for UI tabs  

## usage  
```ts
import { TabManager } from 'mobx-shared-entities/tab-manager';

class SomeModel {
  tabs = new TabManager({
    tabs: [
      { id: '1' },
      { id: '2' },
    ]
  });
}

someModel.tabs.setActiveTab('1');

reaction(
  () => someModel.tabs.activeTabData,
  (activeTabData) => {
    console.info('activeTabData', activeTabData);
  },
);
```
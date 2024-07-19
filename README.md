[![npm](https://img.shields.io/npm/v/mobx-shared-entities)](https://www.npmjs.com/package/mobx-shared-entities) 
[![license](https://img.shields.io/npm/l/mobx-shared-entities)](https://github.com/js2me/mobx-shared-entities/blob/master/LICENSE)  


> [!WARNING]  
> It's fine if you use this library from NPM package with a **static versioning** in case you
> want it for some pet-project or to test it's capabilities.
>
> But for production use it's **strongly recommended** to create a fork, because I do not write
> Changelogs and may break / add some functionality without notice.  

# mobx-shared-entities  

# [MobxPaginator](src/mobx-paginator/model.ts)  

Model which helps to use pagination with tables  

## usage  
```ts
import { MobxPaginator } from 'mobx-shared-entities/mobx-paginator';

class SomeModel {
  paginator = new MobxPaginator({
    disposer: this.disposer,
  });
}

someModel.paginator.toNextPage()
someModel.paginator.toPreviousPage()

someModel.paginator.inputData;
```

# [MobxSocket](src/mobx-socket/model.ts)  

Model which helps to create ws connection with sending\receiving data from ws  

## usage  
```ts
import { MobxSocket } from 'mobx-shared-entities/mobx-socket';

class SomeModel {
  socket = new MobxSocket({
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

# [MobxStepper](src/mobx-stepper/model.ts)  

Model which helps to create step mechanism  

## usage  
```ts
import { MobxStepper } from 'mobx-shared-entities/mobx-stepper';

class SomeModel {
  stepper = new MobxStepper({
    steps: [1, 2, 3],
  });
}

someModel.stepper.nextStep()
someModel.stepper.isLastStep;

someModel.stepper.activeStep;
```

# [MobxTicker](src/mobx-ticker/model.ts)  

Model with counter and start timer  

## usage  
```ts
import { MobxTicker } from 'mobx-shared-entities/mobx-ticker';

class SomeModel {
  ticker = new MobxTicker({
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
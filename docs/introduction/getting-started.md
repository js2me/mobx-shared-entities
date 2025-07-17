---
title: Getting started
---

# Getting started

## Installation

::: code-group

```bash [npm]
npm install {packageJson.name}
```

```bash [yarn]
yarn add {packageJson.name}
```

```bash [pnpm]
pnpm add {packageJson.name}
```

:::


## Usage   

```ts
import {
  TabManager,
  Time,
} from "mobx-swiss-knife";

const tabs = new TabManager({
  tabs: [
    { id: 'foo', label: 'Foo' },
    { id: 'bar', label: 'Bar' },
  ],
  fallbackTab: 'foo',
});

const time = new Time({
  updatePer: 1 * 1000,
})

console.log('time', time.value);
```
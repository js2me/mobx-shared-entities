/* eslint-disable @typescript-eslint/no-unused-vars */
import { execSync } from 'child_process';
import fs from 'fs';

//#region утилиты
const $ = (cmd) => execSync(cmd, { stdio: 'inherit' });
const scanDir = (dir) => fs.readdirSync(dir);
const readFile = (file) => fs.readFileSync(file);
const writeFile = (file, content) => fs.writeFileSync(file, content);
//#endregion

$(`cp -r LICENSE dist`);

const exportsConfig = {
  './package.json': './package.json',
};

scanDir('src').forEach((entityName) => {
  exportsConfig[`./${entityName}`] = {
    import: `./${entityName}/index.js`,
    types: `./${entityName}/index.d.ts`,
  };
});

writeFile(
  'dist/package.json',
  JSON.stringify(
    {
      ...JSON.parse(readFile('package.json')),
      exports: exportsConfig,
    },
    null,
    2,
  ),
);

// execSync(`mkdir -p typings`, { stdio: 'inherit' });
// execSync(`cp src/lib/types.ts typings/index.d.ts`, { stdio: 'inherit' });
// execSync(`sed -i 's/^export type/type/' typings/index.d.ts`, { stdio: 'inherit' });

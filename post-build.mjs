import {
  postBuildScript,
  publishScript,
} from 'js2me-exports-post-build-script';

postBuildScript({
  buildDir: 'dist',
  rootDir: '.',
  srcDirName: 'src',
  filesToCopy: ['LICENSE', 'README.md'],
  updateVersion: process.env.PUBLISH_VERSION,
  onPackageVersionChanged: (nextVersion, currentVersion) => {
    if (process.env.PUBLISH) {
      publishScript({
        nextVersion,
        currVersion: currentVersion,
        publishCommand: 'pnpm publish',
        commitAllCurrentChanges: true,
        createTag: true,
        githubRepoLink: 'https://github.com/js2me/mobx-shared-entities',
        cleanupCommand: 'pnpm clean',
      });
    }
  },
});

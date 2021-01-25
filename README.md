# snowpack-plugin-window-modules

`snowpack-plugin-window-modules` is a [snowpack](https://www.snowpack.dev/) plugin that can auto inject code to any module so they can be accessed on the `window.modules` object

This is useful for debugging purpose where you can easily inspect a module state or functionalities.

## Configuration

Default :

```js
// snowpack.config.js
module.exports = {
  plugins: [
    'snowpack-plugin-window-modules',
  ],
}
```

This will transform module code so they add themselves to the `window.modules` object
They will add themselves on a field like `window.modules[import.meta.url]`. 
If there is no conflict, they will also be accessible based on the last part of their url, the name of the module.

You can configure the plugin to only perform that transformation on certain modules via the filter options:

```js
// snowpack.config.js
module.exports = {
  plugins: [
    ['snowpack-plugin-window-modules', {filter: function(transformOptions) => return true}]
  ],
}
```

the argument passed to the filter options is the same as snowpack arguments passed to the plugin's transform function:
```ts
export interface PluginTransformOptions {
    id: string;
    fileExt: string;
    contents: string | Buffer;
    isDev: boolean;
    isHmrEnabled: boolean;
}
```


The plugin comes with a builtin filter that let you define glob pattern to include or to exclude :


```js
// snowpack.config.js
const {filterFiles} = require('snowpack-plugin-window-modules');
module.exports = {
  plugins: [
    ['snowpack-plugin-window-modules', {filter: filterFiles({includes: ['src/stores/*'], excludes: []})}]
  ],
};
```


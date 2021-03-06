import type {PluginTransformOptions, PluginTransformResult, SnowpackConfig, SnowpackPlugin} from 'snowpack';
import path from 'path';
import fs from 'fs-extra';
import minimatch from 'minimatch';

type Filter = (transformOptions: PluginTransformOptions) => boolean;

type WindowModulePluginOptions = {
  filter?: Filter;
  devOnly?: boolean;
  writeToFolder?: string
}

export function filterFiles({includes, excludes}: {
  includes?: string[];
  excludes?: string[]
}): Filter {
  const cwd = process.cwd();
  return ({id}) => {
    const relPath = path.relative(cwd, id);
    if (excludes) {
      for (const exclude of excludes) {
        if (minimatch(relPath, exclude)) {
          return false;
        }
      }
    }
    if (includes) {
      for (const include of includes) {
        if (minimatch(relPath, include)) {
          return true;
        }
      }
    }
    return !includes;
  }
}

export default function (snowpackConfig: SnowpackConfig, options: WindowModulePluginOptions): SnowpackPlugin {
  return {
    name: 'snowpack-plugin-window-modules',
    async transform(transformOptions: PluginTransformOptions): Promise<PluginTransformResult | string | null | undefined | void> {
      // if (!transformOptions.isHmrEnabled) { // seems to be always false
      //   console.log('no transform');
      //   return;
      // }
      if (!transformOptions.isDev && (options.devOnly === undefined || options.devOnly)) {
        return;
      }
      let {id, contents} = transformOptions;
      if (id.endsWith('.js')) {
        if (options.filter) {
          if (!options.filter(transformOptions)) {
            return;
          }
        }
        if (typeof contents !== 'string') {
          contents = contents.toString();
        }
          if ((options as any).debug) {
            console.log(`injecting HMR code in ${id}`);
          }
          const newContent = contents + `
(async () => {
  const module = await import(import.meta.url);

  let url = import.meta.url;
  const queryParam = url.indexOf('?');
  if (queryParam > 0) {
    url = url.slice(0, queryParam);
  }

  let name = url;
  let splits = name.split('/');
  if (splits.length > 1) {
    const lastPart = splits[splits.length - 1];
    if (lastPart === 'index.js' || lastPart === 'index') {
      name = splits[splits.length - 2];
    } else {
      name = splits[splits.length - 1];
    }
  }
  const lastDot = name.lastIndexOf('.');
  if (lastDot > 0) {
    name = name.slice(0, lastDot);
  }

  window.modules = window.modules || {};
  window.originalModules = window.originalModules || {};

  if (!window.originalModules[url]) {
    if (window.originalModules[name] === undefined) {
      window.originalModules[name] = module;
    } else {
      window.originalModules[name] = null;
    }
    window.originalModules[url] = module;
  }  
  
  if (window.modules[name] === undefined) {
    window.modules[name] = module;
  } else if(!window.modules[url]) {
    window.modules[name] = null;
  }
  window.modules[url] = module;
})();
`;
        if (options.writeToFolder) {
          const relpath = path.relative(snowpackConfig.root, id);
          const filepath = path.join(options.writeToFolder, relpath);
          fs.ensureDirSync(path.dirname(filepath));
          fs.writeFileSync(filepath, newContent);
        }
        return newContent;
      }      
    },
  };
};

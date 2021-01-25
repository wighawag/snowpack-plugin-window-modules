"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.filterFiles = void 0;
const path_1 = __importDefault(require("path"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const minimatch_1 = __importDefault(require("minimatch"));
function filterFiles({ includes, excludes }) {
    const cwd = process.cwd();
    return ({ id }) => {
        const relPath = path_1.default.relative(cwd, id);
        if (excludes) {
            for (const exclude of excludes) {
                if (minimatch_1.default(relPath, exclude)) {
                    return false;
                }
            }
        }
        if (includes) {
            for (const include of includes) {
                if (minimatch_1.default(relPath, include)) {
                    return true;
                }
            }
        }
        return !includes;
    };
}
exports.filterFiles = filterFiles;
function default_1(snowpackConfig, options) {
    return {
        name: 'snowpack-plugin-window-modules',
        async transform(transformOptions) {
            // if (!transformOptions.isHmrEnabled) { // seems to be always false
            //   console.log('no transform');
            //   return;
            // }
            if (!transformOptions.isDev && (options.devOnly === undefined || options.devOnly)) {
                return;
            }
            let { id, contents } = transformOptions;
            if (id.endsWith('.js')) {
                if (options.filter) {
                    if (!options.filter(transformOptions)) {
                        return;
                    }
                }
                if (typeof contents !== 'string') {
                    contents = contents.toString();
                }
                if (options.debug) {
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
                    const relpath = path_1.default.relative(snowpackConfig.root, id);
                    const filepath = path_1.default.join(options.writeToFolder, relpath);
                    fs_extra_1.default.ensureDirSync(path_1.default.dirname(filepath));
                    fs_extra_1.default.writeFileSync(filepath, newContent);
                }
                return newContent;
            }
        },
    };
}
exports.default = default_1;
;

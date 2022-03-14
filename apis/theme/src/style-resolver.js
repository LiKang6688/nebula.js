import extend from 'extend';
import generateScales from './theme-scale-generator';

/**
 * Creates the follwing array of paths
 * object.barChart - legend.title - fontSize
 * object - legend.title - fontSize
 * legend.title - fontSize
 * object.barChart - legend - fontSize
 * object - legend - fontSize
 * legend - fontSize
 * object.barChart - fontSize
 * object - fontSize
 * fontSize
 * @ignore
 */
function constructPaths(pathSteps, baseSteps, exactMatch) {
  const ret = [];
  let localBaseSteps;
  let baseLength;
  if (pathSteps) {
    if (!exactMatch) {
      let pathLength = pathSteps.length;
      while (pathLength >= 0) {
        localBaseSteps = baseSteps.slice();
        baseLength = localBaseSteps.length;
        while (baseLength >= 0) {
          ret.push(localBaseSteps.concat(pathSteps));
          localBaseSteps.pop();
          baseLength--;
        }
        pathSteps.pop();
        pathLength--;
      }
    } else {
      ret.push(baseSteps.concat(pathSteps));
    }
  } else if (!exactMatch) {
    localBaseSteps = baseSteps.slice();
    baseLength = localBaseSteps.length;
    while (baseLength >= 0) {
      ret.push(localBaseSteps.concat());
      localBaseSteps.pop();
      baseLength--;
    }
  } else {
    ret.push(baseSteps);
  }
  return ret;
}

function getObject(root, steps) {
  let obj = root;
  for (let i = 0; i < steps.length; i++) {
    if (obj[steps[i]]) {
      obj = obj[steps[i]];
    } else {
      return null;
    }
  }
  return obj;
}

function searchPathArray(pathArray, attribute, theme, exactMatch) {
  if (exactMatch) {
    const target = getObject(theme, pathArray[0]);
    if (target !== null) return getObject(target, attribute.split('.'));
  } else {
    for (let i = 0; i < pathArray.length; i++) {
      const target = getObject(theme, pathArray[i]);
      if (target !== null && target[attribute]) return target[attribute];
    }
  }
  return undefined;
}

function searchValue(path, attribute, baseSteps, component) {
  const exactMatch = attribute.split('.').length > 0;
  let pathArray;
  if (path === '') {
    pathArray = constructPaths(null, baseSteps, exactMatch);
  } else {
    const steps = path.split('.');
    pathArray = constructPaths(steps, baseSteps, exactMatch);
  }
  return searchPathArray(pathArray, attribute, component, exactMatch);
}

export default function styleResolver(basePath, themeJSON) {
  const basePathSteps = basePath.split('.');

  const api = {
    /**
     *
     * Get the value of a style attribute, starting in the given base path + path
     * Ex: Base path: "object.barChart", Path: "legend.title", Attribute: "fontSize"
     * Will search in, and fall back to:
     * object.barChart - legend.title - fontSize
     * object - legend.title - fontSize
     * legend.title - fontSize
     * object.barChart - legend - fontSize
     * object - legend - fontSize
     * legend - fontSize
     * object.barChart - fontSize
     * object - fontSize
     * fontSize
     * @ignore
     *
     * @param {string} component string of properties seperated by dots to search in
     * @param {string} attribute to return
     * @returns {any} value of the resolved path, undefined if not found
     */
    getStyle(component, attribute) {
      // TODO - object overrides
      // TODO - feature flag on font-family?
      // TODO - caching
      const baseSteps = basePathSteps.concat();
      const result = searchValue(component, attribute, baseSteps, themeJSON);

      // TODO - support functions
      return result;
    },
  };

  return api;
}

/**
 * Iterate the object tree and resolve variables and functions.
 * @ignore
 * @param {Object} - objTree
 * @param {Object} - variables
 */
function resolveVariables(objTree, variables) {
  Object.keys(objTree).forEach((key) => {
    if (typeof objTree[key] === 'object' && objTree[key] !== null) {
      resolveVariables(objTree[key], variables);
    } else if (typeof objTree[key] === 'string' && objTree[key].charAt(0) === '@') {
      // Resolve variables
      objTree[key] = variables[objTree[key]]; // eslint-disable-line no-param-reassign
    }
  });
}

styleResolver.resolveRawTheme = (raw) => {
  // TODO - validate format
  const c = extend(true, {}, raw);
  resolveVariables(c, c._variables); // eslint-disable-line

  // generate class-pyramid
  if (c.scales) {
    generateScales(c.scales, c.dataColors && c.dataColors.nullColor);
  }

  return c;
};

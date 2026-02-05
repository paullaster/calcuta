import appConfig from "./app.ts";

const configs = {
  app: appConfig,
} as Record<string, any>;

export function config(conf: string) {
  const confArray = conf.split(".");
  let configContext = null;
  while (confArray.length) {
    const node = confArray.shift();
    if (node) {
      if (configContext) {
        configContext = configContext[node];
      } else {
        configContext = configs[node];
      }
    }
  }
  return configContext;
}

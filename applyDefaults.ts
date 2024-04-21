import clone from "clone"

export default function applyDefaults(
  defaults: Record<string, any>,
  options: Record<string, any>
) {
  const returnObject = clone(options) || {}

  for (const key in defaults) {
    if (
      defaults.hasOwnProperty(key) &&
      typeof returnObject[key] === "undefined"
    ) {
      returnObject[key] = defaults[key]
    }
  }

  return returnObject
}

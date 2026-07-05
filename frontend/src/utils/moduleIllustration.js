import { MODULE_ILLUSTRATIONS } from '../components/illustrations/ModuleIllustrations'

export function moduleIllustration(seed) {
  let hash = 0
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0
  return MODULE_ILLUSTRATIONS[hash % MODULE_ILLUSTRATIONS.length]
}

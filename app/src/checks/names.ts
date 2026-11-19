/* Compares names with care. Spelling variants, a different name order, an initial or a single legal name
   come back as "close", never as an error, and a person decides what they mean.
   Name order is only ever judged against the record on file: guessing which names "come first" from the name itself
   would be guessing someone's background. */

export type NameComparison = { result: 'same' | 'close' | 'different' | 'missing'; why?: string; orderDiffers: boolean }

type Token = { key: string; text: string }
type Kind = 'exact' | 'variant' | 'similar' | 'initial'
type Pair = { shortIndex: number; longIndex: number; kind: Kind }

/** Spelling variants that string similarity alone would miss. */
const VARIANT_GROUPS = [
  ['aamina', 'amina', 'ameena'],
  ['mohamed', 'mohammed', 'muhammad', 'mohammad', 'mohamad', 'muhamed'],
  ['ahmed', 'ahmad'],
  ['hussein', 'husein', 'hussain'],
  ['fatima', 'fatimah', 'fatuma'],
  ['yusuf', 'yousef', 'youssef', 'yusef'],
  ['catherine', 'katherine', 'kathryn', 'katharine'],
  ['john', 'jon'],
  ['sara', 'sarah'],
  ['steven', 'stephen'],
  ['philip', 'phillip'],
  ['ann', 'anne'],
  ['marc', 'mark'],
  ['teresa', 'theresa'],
  ['geoffrey', 'jeffrey'],
]
const VARIANT_GROUP = new Map(VARIANT_GROUPS.flatMap((group, i) => group.map((name) => [name, i] as const)))

/** How alike two spellings must be to count as close. High on purpose: "Jan" and "Jen" are different people. */
const SIMILAR_AT = 0.9
const KIND_ORDER: Kind[] = ['exact', 'variant', 'similar', 'initial']

const fold = (s: string) => s.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().replace(/['’.]/g, '')

/** Splits a name into parts. "Last, First" is read as First Last. */
export function nameTokens(raw: string): Token[] {
  const [before, ...after] = raw.split(',')
  const ordered = after.length ? `${after.join(' ')} ${before}` : raw
  return ordered
    .split(/[\s-]+/)
    .map((text) => ({ text: text.replace(/\./g, ''), key: fold(text) }))
    .filter((t) => t.key)
}

export const isSingleName = (raw: string) => {
  const tokens = nameTokens(raw)
  return tokens.length === 1 && tokens[0].key.length > 1
}

/** Jaro-Winkler similarity from 0 to 1. It suits names because it rewards a shared start. */
export function jaroWinkler(a: string, b: string) {
  if (a === b) return 1
  const reach = Math.max(0, Math.floor(Math.max(a.length, b.length) / 2) - 1)
  const aHit: boolean[] = []
  const bHit: boolean[] = []
  let matches = 0
  for (let i = 0; i < a.length; i++) {
    const end = Math.min(b.length - 1, i + reach)
    for (let j = Math.max(0, i - reach); j <= end; j++) {
      if (!bHit[j] && a[i] === b[j]) {
        aHit[i] = bHit[j] = true
        matches++
        break
      }
    }
  }
  if (!matches) return 0
  let outOfPlace = 0
  let k = 0
  for (let i = 0; i < a.length; i++) {
    if (!aHit[i]) continue
    while (!bHit[k]) k++
    if (a[i] !== b[k]) outOfPlace++
    k++
  }
  const jaro = (matches / a.length + matches / b.length + (matches - outOfPlace / 2) / matches) / 3
  let prefix = 0
  while (prefix < 4 && prefix < Math.min(a.length, b.length) && a[prefix] === b[prefix]) prefix++
  return jaro + prefix * 0.1 * (1 - jaro)
}

function matchKind(a: string, b: string): Kind | null {
  if (a === b) return 'exact'
  if (a.length === 1 || b.length === 1) return a[0] === b[0] ? 'initial' : null
  const group = VARIANT_GROUP.get(a)
  if (group !== undefined && group === VARIANT_GROUP.get(b)) return 'variant'
  return Math.min(a.length, b.length) >= 4 && jaroWinkler(a, b) >= SIMILAR_AT ? 'similar' : null
}

/** Pairs each part of the shorter name with a part of the longer one, best kind of match first. */
function align(short: Token[], long: Token[]) {
  const pairs: Pair[] = []
  const usedLong = new Set<number>()
  const usedShort = new Set<number>()
  for (const kind of KIND_ORDER) {
    short.forEach((token, shortIndex) => {
      if (usedShort.has(shortIndex)) return
      const longIndex = long.findIndex((other, i) => !usedLong.has(i) && matchKind(token.key, other.key) === kind)
      if (longIndex < 0) return
      usedShort.add(shortIndex)
      usedLong.add(longIndex)
      pairs.push({ shortIndex, longIndex, kind })
    })
  }
  return pairs.toSorted((p, q) => p.shortIndex - q.shortIndex)
}

export function compareNames(a: string, b: string): NameComparison {
  const [x, y] = [nameTokens(a), nameTokens(b)]
  if (!x.length || !y.length) return { result: 'missing', orderDiffers: false }
  const [short, long] = x.length <= y.length ? [x, y] : [y, x]
  const pairs = align(short, long)
  if (pairs.length < short.length || pairs.every((p) => p.kind === 'initial')) return { result: 'different', orderDiffers: false }

  const orderDiffers = pairs.some((p, i) => i > 0 && p.longIndex < pairs[i - 1].longIndex)
  const extraParts = long.length > short.length
  if (!orderDiffers && !extraParts && pairs.every((p) => p.kind === 'exact')) return { result: 'same', orderDiffers: false }

  const spelled = (p: Pair) => `${short[p.shortIndex].text} / ${long[p.longIndex].text}`
  const reasons = [
    ...pairs.filter((p) => p.kind === 'variant').map((p) => `common spelling variant (${spelled(p)})`),
    ...pairs.filter((p) => p.kind === 'similar').map((p) => `close spelling (${spelled(p)})`),
    ...pairs.filter((p) => p.kind === 'initial').map((p) => `initial matches (${spelled(p)})`),
    ...(orderDiffers ? ['same names in a different order'] : []),
    ...(extraParts ? [short.length === 1 ? 'one record has a single name' : 'an added name'] : []),
  ]
  const why = reasons.join(' plus ')
  return { result: 'close', why: why[0].toUpperCase() + why.slice(1), orderDiffers }
}

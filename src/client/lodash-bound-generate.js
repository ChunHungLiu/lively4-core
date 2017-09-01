const functionNames = `
  add
  after
  ary
  assign
  assignIn
  assignInWith
  assignWith
  at
  attempt
  before
  bind
  bindAll
  bindKey
  camelCase
  capitalize
  castArray
  ceil
  chain
  chunk
  clamp
  clone
  cloneDeep
  cloneDeepWith
  cloneWith
  compact
  concat
  cond
  conforms
  conformsTo
  constant
  countBy
  create
  curry
  curryRight
  debounce
  deburr
  defaults
  defaultsDeep
  defaultTo
  defer
  delay
  difference
  differenceBy
  differenceWith
  divide
  drop
  dropRight
  dropRightWhile
  dropWhile
  each
  eachRight
  endsWith
  entries
  entriesIn
  eq
  escape
  escapeRegExp
  every
  extend
  extendWith
  fill
  filter
  find
  findIndex
  findKey
  findLast
  findLastIndex
  findLastKey
  first
  flatMap
  flatMapDeep
  flatMapDepth
  flatten
  flattenDeep
  flattenDepth
  flip
  floor
  flow
  flowRight
  forEach
  forEachRight
  forIn
  forInRight
  forOwn
  forOwnRight
  fromPairs
  functions
  functionsIn
  get
  groupBy
  gt
  gte
  has
  hasIn
  head
  identity
  includes
  indexOf
  initial
  inRange
  intersection
  intersectionBy
  intersectionWith
  invert
  invertBy
  invoke
  invokeMap
  isArguments
  isArray
  isArrayBuffer
  isArrayLike
  isArrayLikeObject
  isBoolean
  isBuffer
  isDate
  isElement
  isEmpty
  isEqual
  isEqualWith
  isError
  isFinite
  isFunction
  isInteger
  isLength
  isMap
  isMatch
  isMatchWith
  isNaN
  isNative
  isNil
  isNull
  isNumber
  isObject
  isObjectLike
  isPlainObject
  isRegExp
  isSafeInteger
  isSet
  isString
  isSymbol
  isTypedArray
  isUndefined
  isWeakMap
  isWeakSet
  iteratee
  join
  kebabCase
  keyBy
  keys
  keysIn
  last
  lastIndexOf
  lowerCase
  lowerFirst
  lt
  lte
  map
  mapKeys
  mapValues
  matches
  matchesProperty
  max
  maxBy
  mean
  meanBy
  memoize
  merge
  mergeWith
  method
  methodOf
  min
  minBy
  mixin
  multiply
  negate
  noop
  now
  nth
  nthArg
  omit
  omitBy
  once
  orderBy
  over
  overArgs
  overEvery
  overSome
  pad
  padEnd
  padStart
  parseInt
  partial
  partialRight
  partition
  pick
  pickBy
  property
  propertyOf
  pull
  pullAll
  pullAllBy
  pullAllWith
  pullAt
  random
  range
  rangeRight
  rearg
  reduce
  reduceRight
  reject
  remove
  repeat
  replace
  rest
  result
  reverse
  round
  sample
  sampleSize
  set
  setWith
  shuffle
  size
  slice
  snakeCase
  some
  sortBy
  sortedIndex
  sortedIndexBy
  sortedIndexOf
  sortedLastIndex
  sortedLastIndexBy
  sortedLastIndexOf
  sortedUniq
  sortedUniqBy
  split
  spread
  startCase
  startsWith
  stubArray
  stubFalse
  stubObject
  stubString
  stubTrue
  subtract
  sum
  sumBy
  tail
  take
  takeRight
  takeRightWhile
  takeWhile
  tap
  template
  throttle
  thru
  times
  toArray
  toFinite
  toInteger
  toLength
  toLower
  toNumber
  toPairs
  toPairsIn
  toPath
  toPlainObject
  toSafeInteger
  toString
  toUpper
  transform
  trim
  trimEnd
  trimStart
  truncate
  unary
  unescape
  union
  unionBy
  unionWith
  uniq
  uniqBy
  uniqueId
  uniqWith
  unset
  unzip
  unzipWith
  update
  updateWith
  upperCase
  upperFirst
  values
  valuesIn
  without
  words
  wrap
  xor
  xorBy
  xorWith
  zip
  zipObject
  zipObjectDeep
  zipWith
`.trim().split(/\s+/);

export default function generate() {
  let lodashImportPath = 'src/external/lodash/lodash.js';
  let lodashBoundPath = lively4url + "/src/client/lodash-bound.js"
  
  function toSnippet(functionName) {
    return `import { ${functionName} as _${functionName} } from "${lodashImportPath}";
export function ${functionName}() {
  return _${functionName}.apply(undefined, [this].concat(Array.prototype.slice.apply(arguments)));
};`}

  lively.files.saveFile(lodashBoundPath, functionNames
    .map(toSnippet)
    .join('\n\n')
  );
}
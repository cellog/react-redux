import { createContext } from 'react'
import connect from '../connect/connect'

export function arrayIndexMapper(index) {
  return 1 << index%30
}

export function arrayMapper(length) {
  const ret = []
  for (let i = 0; i < length; i++) {
    ret.push(arrayIndexMapper(i))
  }
  return ret
}

export function objectMapper(indices) {
  return indices.reduce((map, item, i) => {
    if (item.reduce instanceof Function) {
      const struct = map[item[0]] || {}
      let pointer = struct
      for (let idx = 1; idx < item.length; idx++) {
        pointer[item[idx]] = pointer[item[idx]] || {}
        if (idx === item.length - 1) {
          pointer[item[idx]] = arrayIndexMapper(i)
        }
        pointer = pointer[item[idx]]
      }
      return {
        ...map,
        [item[0]]: struct
      }
    }
    return {
      ...map,
      item: arrayIndexMapper(i)
    }
  }, {})
}

export function objectKeysToArray(object) {
  return Object.keys(object).reduce((indices, key) => {
    if (object !== null && typeof object[key] === 'object' && Object.keys(object[key]).length) {
      return [ ...indices, ...objectKeysToArray(object[key]).map(
        nested => [key, ...(nested.reduce instanceof Function ? nested : [nested]) ]
      )]
    }
    return [ ...indices, key ]
  }, [])
}

export function objectKeyValue(map, key, throws = false, i = 0) {
  if (key.reduce instanceof Function) {
    if (undefined === map[key[i]]) {
      if (throws) {
        console.log(map, key, i, key[i])
        throw new Error(`Invalid key, map value does not exist: ${key[i]}`)
      }
      return undefined
    }
    if (i === key.length - 1) return map[key[i]]
    console.log(map, map[key[i]])
    return objectKeyValue(map[key[i]], key, throws, i + 1)
  }
  if (throws) {
    if (map[key] === undefined) {
      throw new Error(`Invalid key, map value does not exist: ${key}`)
    }
  }
  return map[key]
}

export function arrayKeyValue(map, key, throws = false) {
  if (key > map.length) {
    if (throws) {
      throw new Error(`Array key out of bounds: ${key}`)
    }
    return 0
  }
  return map[key]
}

const mapobservedBitMapper = map => (prev, next) => {
  const prevState = prev.state
  const nextState = next.state

  return map.reduce((bits, index) => {
    if (map.getValue(prevState, index) !== map.getValue(nextState, index)) {
      return map.getValue(map, index, true)
    }
  }, 0)
}

export function makeArrayMapper(length) {
  const _map = arrayMapper(length)
  const map = {
    reduce: _map.reduce.bind(_map),
    getValue(array, index, throws) {
      return arrayKeyValue(array, key, throws)
    },
    getBits(index) {
      return _map[index]
    },
    connect(mSP, mDP, mP, opts = {}) {
      return connect(mSP, mDP, mP, { ...opts, consumer: _context.Consumer })
    },
    context() {
      return _context
    }
  }
  const _context = createContext(null, mapobservedBitMapper(map))
  return map
}

export function makeObjectMapper(legend) {
  const _indices = objectKeysToArray(legend)
  const _map = objectMapper(_indices)
  function getValue(obj, index, throws) {
    const value = objectKeyValue(obj, index, throws)
    if (typeof value === 'number') return value
    if (throws) {
      throw new Error(`map did not map to an index, mapped to: ${JSON.stringify(value)} with index ${_indices[index]}`)
    }
  }
  const map = {
    reduce: _indices.reduce.bind(_indices),
    getValue: getValue,
    getBits(index) {
      return getValue(_map, index, true)
    },
    connect(mSP, mDP, mP, opts = {}) {
      return connect(mSP, mDP, mP, { ...opts, consumer: _context.Consumer })
    },
    context() {
      return _context
    }
  }
  const _context = createContext(null, mapobservedBitMapper(map))
  return map
}

export default function makeMapperContext(map) {
  return createContext(null, observedBitsMapper(map))
}

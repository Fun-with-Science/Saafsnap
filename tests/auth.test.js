import { describe, expect, it } from 'vitest'
import { sha256Hex, hashPassword, newId } from '../src/lib/auth'

describe('offline-mode password hashing', () => {
  it('implements SHA-256 correctly', () => {
    expect(sha256Hex('abc')).toBe('ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad')
    expect(sha256Hex('')).toBe('e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855')
  })

  it('salts passwords so equal passwords give different hashes', () => {
    expect(hashPassword('secret', 's1')).toBe(hashPassword('secret', 's1'))
    expect(hashPassword('secret', 's1')).not.toBe(hashPassword('secret', 's2'))
  })

  it('creates unique ids', () => {
    const ids = new Set(Array.from({ length: 200 }, () => newId('r_')))
    expect(ids.size).toBe(200)
  })
})

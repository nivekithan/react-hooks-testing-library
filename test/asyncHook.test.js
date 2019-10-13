import { useState, useRef, useEffect } from 'react'
import { renderHook } from 'src'

describe('async hook tests', () => {
  const useSequence = (...values) => {
    const [first, ...otherValues] = values
    const [value, setValue] = useState(first)
    const index = useRef(0)

    useEffect(() => {
      const interval = setInterval(() => {
        setValue(otherValues[index.current])
        index.current++
      }, 50)
      return () => {
        clearInterval(interval)
      }
    }, [...values])

    return value
  }

  test('should wait for next update', async () => {
    const { result, waitForNextUpdate } = renderHook(() => useSequence('first', 'second'))

    expect(result.current).toBe('first')

    await waitForNextUpdate()

    expect(result.current).toBe('second')
  })

  test('should wait for multiple updates', async () => {
    const { result, waitForNextUpdate } = renderHook(() => useSequence('first', 'second', 'third'))

    expect(result.current).toBe('first')

    await waitForNextUpdate()

    expect(result.current).toBe('second')

    await waitForNextUpdate()

    expect(result.current).toBe('third')
  })

  test('should resolve all when updating', async () => {
    const { result, waitForNextUpdate } = renderHook(() => useSequence('first', 'second'))

    expect(result.current).toBe('first')

    await Promise.all([waitForNextUpdate(), waitForNextUpdate(), waitForNextUpdate()])

    expect(result.current).toBe('second')
  })

  test('should reject if timeout exceeded when waiting for next update', async () => {
    const { result, waitForNextUpdate } = renderHook(() => useSequence('first', 'second'))

    expect(result.current).toBe('first')

    await expect(waitForNextUpdate({ timeout: 10 })).rejects.toThrow(
      Error('Timed out in waitForNextUpdate after 10ms.')
    )
  })
})

import React, { Suspense } from 'react'
import { act, create } from 'react-test-renderer'
import asyncUtils from './asyncUtils'

function TestHook({ callback, hookProps, onError, children }) {
  try {
    children(callback(hookProps))
  } catch (err) {
    if (err.then) {
      throw err
    } else {
      onError(err)
    }
  }
  return null
}

function Fallback() {
  return null
}

function resultContainer() {
  let value = null
  let error = null
  const resolvers = []

  const result = {
    get current() {
      if (error) {
        throw error
      }
      return value
    },
    get error() {
      return error
    }
  }

  const updateResult = (val, err) => {
    value = val
    error = err
    resolvers.splice(0, resolvers.length).forEach((resolve) => resolve())
  }

  return {
    result,
    addResolver: (resolver) => {
      resolvers.push(resolver)
    },
    setValue: (val) => updateResult(val),
    setError: (err) => updateResult(undefined, err)
  }
}

function renderHook(callback, { initialProps, wrapper } = {}) {
  const { result, setValue, setError, addResolver } = resultContainer()
  const hookProps = { current: initialProps }

  const wrapUiIfNeeded = (innerElement) =>
    wrapper ? React.createElement(wrapper, null, innerElement) : innerElement

  const toRender = () =>
    wrapUiIfNeeded(
      <Suspense fallback={<Fallback />}>
        <TestHook callback={callback} hookProps={hookProps.current} onError={setError}>
          {setValue}
        </TestHook>
      </Suspense>
    )

  let testRenderer
  act(() => {
    testRenderer = create(toRender())
  })
  const { unmount, update } = testRenderer

  return {
    result,
    rerender: (newProps = hookProps.current) => {
      hookProps.current = newProps
      act(() => {
        update(toRender())
      })
    },
    unmount: () => {
      act(() => {
        unmount()
      })
    },
    ...asyncUtils(addResolver)
  }
}

export { renderHook, act }

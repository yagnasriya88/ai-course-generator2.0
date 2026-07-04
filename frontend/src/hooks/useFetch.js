import { useCallback, useEffect, useState } from 'react'

/** deps controls when it refetches (e.g. [lessonId]) — mirrors useEffect's dep array. */
function useFetch(fetcher, deps) {
  const [data, setData] = useState(null)
  const [status, setStatus] = useState('loading') // loading | success | error
  const [error, setError] = useState(null)

  const load = useCallback(() => {
    setStatus('loading')
    setError(null)
    fetcher()
      .then((result) => {
        setData(result)
        setStatus('success')
      })
      .catch((err) => {
        setError(err.message)
        setStatus('error')
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  useEffect(() => {
    load()
  }, [load])

  return { data, status, error, reload: load, setData }
}

export default useFetch

import { useCallback, useEffect, useState } from 'react'
import {
  onInstallationChange,
  readInstallation,
  type InstallationProfile,
} from './model'

export function useInstallation() {
  const [installation, setInstallation] =
    useState<InstallationProfile | null>(null)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    try {
      setInstallation((await readInstallation()) ?? null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
    return onInstallationChange(() => void refresh())
  }, [refresh])

  return { installation, loading, refresh }
}

import { useState, useCallback } from 'react'
import { getProfile, setProfile, getProgress, addXP } from '../utils/storage'

export function useProfile() {
  const [profile, setProfileState] = useState(() => getProfile())
  const [progress, setProgressState] = useState(() => getProgress())

  const refresh = useCallback(() => {
    setProfileState(getProfile())
    setProgressState(getProgress())
  }, [])

  const earnXP = useCallback((amount) => {
    const updated = addXP(amount)
    setProfileState(updated)
    return updated
  }, [])

  const updateProfile = useCallback((updates) => {
    const p = { ...getProfile(), ...updates }
    setProfile(p)
    setProfileState(p)
  }, [])

  return { profile, progress, refresh, earnXP, updateProfile }
}

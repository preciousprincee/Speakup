import React, { useState, useCallback } from 'react'
import { Layout } from './components/layout/Layout'
import { Onboarding } from './components/layout/Onboarding'
import { Dashboard } from './components/dashboard/Dashboard'
import { Coach } from './components/coach/Coach'
import { Jargon } from './components/jargon/Jargon'
import { Interview } from './components/interview/Interview'
import { Settings } from './components/settings/Settings'
import { useTheme } from './hooks/useTheme'
import { useProfile } from './hooks/useProfile'
import { getApiKey } from './utils/storage'

export default function App() {
  const { theme, toggle } = useTheme()
  const { profile, progress, refresh, earnXP } = useProfile()
  const [tab, setTab] = useState('dashboard')

  const hasApiKey = Boolean(getApiKey())
  const [onboarded, setOnboarded] = useState(hasApiKey)

  const handleXP = useCallback((amount) => {
    earnXP(amount)
  }, [earnXP])

  const handleTabChange = useCallback((t) => {
    setTab(t)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  const handleOnboardingComplete = () => {
    refresh()
    setOnboarded(true)
  }

  if (!onboarded) {
    return <Onboarding onComplete={handleOnboardingComplete} />
  }

  return (
    <Layout
      activeTab={tab}
      onTabChange={handleTabChange}
      theme={theme}
      onToggleTheme={toggle}
      profile={profile}
    >
      {tab === 'dashboard' && (
        <Dashboard profile={profile} progress={progress} onTabChange={handleTabChange} />
      )}
      {tab === 'coach' && (
        <Coach onXP={handleXP} />
      )}
      {tab === 'jargon' && (
        <Jargon onXP={handleXP} />
      )}
      {tab === 'interview' && (
        <Interview onXP={handleXP} />
      )}
      {tab === 'settings' && (
        <Settings onProfileUpdate={refresh} />
      )}
    </Layout>
  )
}

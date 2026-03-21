import { useState, useCallback } from 'react'
import SessionForm from './components/SessionForm'
import SessionResult from './components/SessionResult'
import SessionHistory from './components/SessionHistory'

const STORAGE_KEY = 'badminton-sessions'

function loadSessions() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveSessions(sessions) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions))
}

export default function App() {
  const [sessions, setSessions] = useState(loadSessions)
  const [currentSession, setCurrentSession] = useState(null)
  const [viewingSession, setViewingSession] = useState(null)

  const handleSaveSession = useCallback((session) => {
    setSessions((prev) => {
      const next = [session, ...prev]
      saveSessions(next)
      return next
    })
    setCurrentSession(null)
    setViewingSession(session)
  }, [])

  const handleDeleteSession = useCallback((id) => {
    setSessions((prev) => {
      const next = prev.filter((s) => s.id !== id)
      saveSessions(next)
      return next
    })
    if (viewingSession?.id === id) {
      setViewingSession(null)
    }
  }, [viewingSession])

  const handleNewSession = useCallback(() => {
    setCurrentSession({ id: crypto.randomUUID(), date: '', entries: [] })
    setViewingSession(null)
  }, [])

  const handleBack = useCallback(() => {
    setCurrentSession(null)
    setViewingSession(null)
  }, [])

  return (
    <div className="app">
      <header className="app-header">
        <h1>🏸 Tính tiền cầu lông</h1>
        <p>Chia tiền sân, cầu, trà đá, cơm</p>
      </header>

      {currentSession ? (
        <SessionForm
          session={currentSession}
          onSave={handleSaveSession}
          onCancel={handleBack}
        />
      ) : viewingSession ? (
        <SessionResult
          session={viewingSession}
          onBack={handleBack}
        />
      ) : (
        <SessionHistory
          sessions={sessions}
          onNewSession={handleNewSession}
          onView={setViewingSession}
          onDelete={handleDeleteSession}
        />
      )}
    </div>
  )
}

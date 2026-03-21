import { useState, useCallback, useRef } from 'react'
import SessionForm from './components/SessionForm'
import SessionResult from './components/SessionResult'
import SessionHistory from './components/SessionHistory'
import Stats from './components/Stats'

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
  const [activeTab, setActiveTab] = useState('history')
  const importRef = useRef(null)

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

  const handleExport = useCallback(() => {
    const data = JSON.stringify(sessions, null, 2)
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `badminton-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
  }, [sessions])

  const handleImport = useCallback((e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const imported = JSON.parse(ev.target.result)
        if (!Array.isArray(imported)) return alert('File không hợp lệ')
        setSessions((prev) => {
          const existingIds = new Set(prev.map((s) => s.id))
          const merged = [...imported.filter((s) => !existingIds.has(s.id)), ...prev]
          saveSessions(merged)
          return merged
        })
        alert(`Đã import ${imported.length} phiên`)
      } catch {
        alert('Không đọc được file JSON')
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }, [])

  const inModal = currentSession || viewingSession

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
        <>
          <div className="tab-bar">
            <button
              className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`}
              onClick={() => setActiveTab('history')}
            >
              📋 Lịch sử
            </button>
            <button
              className={`tab-btn ${activeTab === 'stats' ? 'active' : ''}`}
              onClick={() => setActiveTab('stats')}
            >
              📊 Thống kê
            </button>
            <div className="tab-actions">
              <button className="btn btn-outline btn-sm" onClick={handleExport} title="Xuất JSON">
                ⬇ Export
              </button>
              <button className="btn btn-outline btn-sm" onClick={() => importRef.current.click()} title="Nhập JSON">
                ⬆ Import
              </button>
              <input ref={importRef} type="file" accept=".json" style={{ display: 'none' }} onChange={handleImport} />
            </div>
          </div>

          {activeTab === 'history' ? (
            <SessionHistory
              sessions={sessions}
              onNewSession={handleNewSession}
              onView={setViewingSession}
              onDelete={handleDeleteSession}
            />
          ) : (
            <Stats sessions={sessions} />
          )}
        </>
      )}
    </div>
  )
}

import { useState, useCallback, useRef, useEffect } from 'react'
import SessionForm from './components/SessionForm'
import SessionResult from './components/SessionResult'
import SessionHistory from './components/SessionHistory'
import Stats from './components/Stats'
import * as mongoApi from './services/mongoApi'

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
  const [dbStatus, setDbStatus] = useState(mongoApi.isConfigured ? 'loading' : 'offline')
  const importRef = useRef(null)

  // Tải dữ liệu từ MongoDB khi app khởi động
  useEffect(() => {
    if (!mongoApi.isConfigured) return
    setDbStatus('loading')
    mongoApi.getAllSessions()
      .then((docs) => {
        // Nếu DB còn trống nhưng localStorage có data → migrate lên DB
        if (docs.length === 0) {
          const local = loadSessions()
          if (local.length > 0) {
            mongoApi.importSessions(local).catch(console.error)
            setDbStatus('ready')
            return
          }
        }
        setSessions(docs)
        saveSessions(docs) // giữ localStorage làm cache offline
        setDbStatus('ready')
      })
      .catch((err) => {
        console.error('MongoDB load error:', err)
        setDbStatus('error')
      })
  }, [])

  const handleSaveSession = useCallback((session) => {
    setSessions((prev) => {
      const next = [session, ...prev]
      saveSessions(next)
      return next
    })
    setCurrentSession(null)
    setViewingSession(session)
    if (mongoApi.isConfigured) {
      mongoApi.insertSession(session).catch(console.error)
    }
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
    if (mongoApi.isConfigured) {
      mongoApi.removeSession(id).catch(console.error)
    }
  }, [viewingSession])

  const handleUpdateSession = useCallback((updatedSession) => {
    setSessions((prev) => {
      const next = prev.map((s) => (s.id === updatedSession.id ? updatedSession : s))
      saveSessions(next)
      return next
    })

    setViewingSession((prev) => (prev?.id === updatedSession.id ? updatedSession : prev))

    if (mongoApi.isConfigured) {
      mongoApi.updateSession(updatedSession).catch(console.error)
    }
  }, [])

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
          const newOnes = imported.filter((s) => !existingIds.has(s.id))
          const merged = [...newOnes, ...prev]
          saveSessions(merged)
          if (mongoApi.isConfigured && newOnes.length) {
            mongoApi.importSessions(newOnes).catch(console.error)
          }
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

  return (
    <div className="app">
      {!viewingSession && (
        <header className="app-header">
          <h1>🏸 Tính tiền cầu lông</h1>
          <p>Chia tiền sân, cầu, trà đá, cơm</p>
          {dbStatus === 'loading' && <span className="db-badge db-loading">⏳ Đang kết nối DB…</span>}
          {dbStatus === 'ready'   && <span className="db-badge db-ready">🟢 MongoDB</span>}
          {dbStatus === 'error'   && <span className="db-badge db-error">🔴 Lỗi kết nối DB</span>}
        </header>
      )}

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
          onUpdateSession={handleUpdateSession}
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

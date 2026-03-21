import { useState, useCallback } from 'react'
import { PLAYERS, COMBOS, EXPENSE_TYPES, DEFAULT_PAYER, formatMoney, calculateTotals, getEntryLabel } from '../constants'

function PeoplePicker({ selected, onToggle }) {
  const allSelected = PLAYERS.every((p) => selected.includes(p))

  const isComboActive = (combo) =>
    combo.members.every((m) => selected.includes(m)) &&
    selected.every((s) => combo.members.includes(s))

  const handleCombo = (combo) => {
    onToggle(isComboActive(combo) ? [] : [...combo.members])
  }

  return (
    <div>
      <div className="select-actions">
        {COMBOS.map((combo) => (
          <button
            key={combo.label}
            type="button"
            className={`btn btn-sm ${isComboActive(combo) ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => handleCombo(combo)}
          >
            {combo.emoji} {combo.label}
          </button>
        ))}
        <button
          type="button"
          className="btn btn-outline btn-sm"
          onClick={() => {
            const next = allSelected ? [] : [...PLAYERS]
            onToggle(next)
          }}
        >
          {allSelected ? 'Bỏ tất cả' : 'Tất cả'}
        </button>
        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', alignSelf: 'center' }}>
          {selected.length} người
        </span>
      </div>
      <div className="people-picker">
        {PLAYERS.map((name) => (
          <button
            key={name}
            type="button"
            className={`people-chip ${selected.includes(name) ? 'selected' : ''}`}
            onClick={() => {
              const next = selected.includes(name)
                ? selected.filter((n) => n !== name)
                : [...selected, name]
              onToggle(next)
            }}
          >
            {name}
          </button>
        ))}
      </div>
    </div>
  )
}

function EntryForm({ onAdd, lastPeople, lastPayer }) {
  const [type, setType] = useState('san')
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')
  const [people, setPeople] = useState(lastPeople)
  const [payer, setPayer] = useState(lastPayer)

  const handleSubmit = (e) => {
    e.preventDefault()
    const numAmount = Number(amount)
    if (numAmount <= 0 || people.length === 0) return

    onAdd({
      id: crypto.randomUUID(),
      type,
      amount: numAmount,
      note: note.trim(),
      payer,
      people: [...people],
    })

    setAmount('')
    setNote('')
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="form-row">
        <div className="form-group" style={{ flex: '0 0 auto', minWidth: '150px' }}>
          <label>Loại chi phí</label>
          <select value={type} onChange={(e) => setType(e.target.value)}>
            {EXPENSE_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.emoji} {t.label}
              </option>
            ))}
          </select>
        </div>
        <div className="form-group" style={{ flex: '0 0 auto', minWidth: '140px' }}>
          <label>Số tiền (nghìn đồng)</label>
          <input
            type="number"
            min="1"
            step="1"
            placeholder="VD: 240"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </div>
        <div className="form-group" style={{ flex: '1 1 auto', minWidth: '140px' }}>
          <label>Ghi chú (tuỳ chọn)</label>
          <input
            type="text"
            placeholder="VD: thêm 1 tiếng"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </div>
      </div>

      <div className="form-row">
        <div className="form-group" style={{ flex: '0 0 auto', minWidth: '150px' }}>
          <label>Người trả</label>
          <select value={payer} onChange={(e) => setPayer(e.target.value)}>
            {PLAYERS.map((name) => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>
        </div>
      </div>

      <div style={{ marginBottom: '12px' }}>
        <label style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '4px', display: 'block' }}>
          Người tham gia
        </label>
        <PeoplePicker selected={people} onToggle={setPeople} />
      </div>

      <button
        type="submit"
        className="btn btn-primary"
        disabled={!amount || Number(amount) <= 0 || people.length === 0}
      >
        ➕ Thêm khoản chi
        {amount && people.length > 0 && (
          <span style={{ opacity: 0.8, fontSize: '0.8rem' }}>
            ({formatMoney(Math.round(Number(amount) * 1000 / people.length))}/người)
          </span>
        )}
      </button>
    </form>
  )
}

export default function SessionForm({ session, onSave, onCancel }) {
  const [date, setDate] = useState(session.date || new Date().toISOString().split('T')[0])
  const [entries, setEntries] = useState(session.entries || [])
  const [lastPeople, setLastPeople] = useState([])
  const [lastPayer, setLastPayer] = useState(DEFAULT_PAYER)

  const handleAddEntry = useCallback((entry) => {
    setLastPeople(entry.people)
    setLastPayer(entry.payer)
    setEntries((prev) => [...prev, entry])
  }, [])

  const handleRemoveEntry = useCallback((id) => {
    setEntries((prev) => prev.filter((e) => e.id !== id))
  }, [])

  const handleSave = () => {
    if (entries.length === 0) return
    onSave({
      ...session,
      date,
      entries,
      createdAt: new Date().toISOString(),
    })
  }

  const totals = calculateTotals(entries)
  const grandTotal = Object.values(totals).reduce((s, v) => s + v, 0)

  return (
    <div>
      <div className="card">
        <div className="card-title">📅 Phiên đánh cầu</div>
        <div className="form-group">
          <label>Ngày đánh</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>
      </div>

      <div className="card">
        <div className="card-title">💰 Thêm khoản chi</div>
        <EntryForm key={entries.length} onAdd={handleAddEntry} lastPeople={lastPeople} lastPayer={lastPayer} />
      </div>

      {entries.length > 0 && (
        <div className="card">
          <div className="card-title">
            📋 Danh sách chi phí ({entries.length} khoản)
          </div>
          <div className="table-wrap">
            <table className="result-table">
              <thead>
                <tr>
                  <th>Khoản</th>
                  <th>Người trả</th>
                  <th>Số tiền</th>
                  <th>Người chơi</th>
                  <th>/người</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry) => {
                  const perPerson = entry.amount / entry.people.length
                  return (
                    <tr key={entry.id}>
                      <td>
                        <span className={`type-badge ${entry.type}`}>
                          {getEntryLabel(entry)}
                        </span>
                      </td>
                      <td style={{ whiteSpace: 'nowrap' }}>{entry.payer}</td>
                      <td style={{ whiteSpace: 'nowrap', fontWeight: 600 }}>
                        {formatMoney(entry.amount * 1000)}
                      </td>
                      <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        {entry.people.join(', ')}
                      </td>
                      <td style={{ whiteSpace: 'nowrap', color: 'var(--success)', fontWeight: 500, fontSize: '0.8rem' }}>
                        {formatMoney(Math.round(perPerson * 1000))}
                      </td>
                      <td>
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => handleRemoveEntry(entry.id)}
                        >
                          ✕
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {entries.length > 0 && (
        <div className="card">
          <div className="card-title">📊 Tạm tính</div>
          <table className="result-table">
            <thead>
              <tr>
                <th>Người chơi</th>
                <th>Số tiền</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(totals)
                .sort((a, b) => b[1] - a[1])
                .map(([name, amount]) => (
                  <tr key={name}>
                    <td>{name}</td>
                    <td>{formatMoney(Math.round(amount * 1000))}</td>
                  </tr>
                ))}
              <tr className="result-total">
                <td>Tổng cộng</td>
                <td>{formatMoney(Math.round(grandTotal * 1000))}</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      <div className="actions-bar" style={{ marginTop: '8px' }}>
        <button className="btn btn-outline" onClick={onCancel}>
          ← Quay lại
        </button>
        <button
          className="btn btn-success"
          onClick={handleSave}
          disabled={entries.length === 0}
        >
          ✅ Lưu phiên đánh
        </button>
      </div>
    </div>
  )
}

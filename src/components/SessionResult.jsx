import { useState } from 'react'
import { PLAYERS, EXPENSE_TYPES, formatMoney, calculateTotals, getEntryLabel } from '../constants'

export default function SessionResult({ session, onBack }) {
  const totals = calculateTotals(session.entries)
  const grandTotal = Object.values(totals).reduce((s, v) => s + v, 0)
  const participants = Object.keys(totals)
  const [transferTo, setTransferTo] = useState('')

  const formattedDate = new Date(session.date).toLocaleDateString('vi-VN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return (
    <div>
      <div className="card">
        <div className="card-title">📅 {formattedDate}</div>

        <div className="table-wrap">
          <table className="result-table" style={{ marginBottom: 0 }}>
            <thead>
              <tr>
                <th>Khoản</th>
                <th>Người trả</th>
                <th>Số tiền</th>
                <th>Người chơi</th>
                <th>/người</th>
              </tr>
            </thead>
            <tbody>
              {session.entries.map((entry) => {
                const perPerson = entry.amount / entry.people.length
                return (
                  <tr key={entry.id}>
                    <td>
                      <span className={`type-badge ${entry.type}`}>
                        {getEntryLabel(entry)}
                      </span>
                    </td>
                    <td style={{ whiteSpace: 'nowrap' }}>{entry.payer || 'Trí'}</td>
                    <td style={{ whiteSpace: 'nowrap', fontWeight: 600 }}>
                      {formatMoney(entry.amount * 1000)}
                    </td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      {entry.people.join(', ')}
                    </td>
                    <td style={{ whiteSpace: 'nowrap', color: 'var(--success)', fontWeight: 500, fontSize: '0.8rem' }}>
                      {formatMoney(Math.round(perPerson * 1000))}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card">
        <div className="card-title">💵 Kết quả chia tiền</div>

        <div style={{ marginBottom: '12px' }}>
          <label style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '4px', display: 'block' }}>
            Chuyển tiền cho ai?
          </label>
          <div className="people-picker">
            {participants.map((name) => (
              <button
                key={name}
                type="button"
                className={`people-chip ${transferTo === name ? 'selected' : ''}`}
                onClick={() => setTransferTo(transferTo === name ? '' : name)}
              >
                {name}
              </button>
            ))}
          </div>
        </div>

        <table className="result-table">
          <thead>
            <tr>
              <th>Người chơi</th>
              <th>Phải trả</th>
              {transferTo && <th>Chuyển cho {transferTo}</th>}
            </tr>
          </thead>
          <tbody>
            {Object.entries(totals)
              .sort((a, b) => b[1] - a[1])
              .map(([name, amount]) => {
                const paid = session.entries
                  .filter((e) => (e.payer || 'Trí') === name)
                  .reduce((sum, e) => sum + e.amount, 0)
                const owe = amount - paid
                const transferAmount = transferTo
                  ? (name === transferTo ? null : owe)
                  : null

                return (
                  <tr key={name} className={name === transferTo ? 'transfer-target-row' : ''}>
                    <td>{name} {paid > 0 ? <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>(đã trả {formatMoney(Math.round(paid * 1000))})</span> : ''}</td>
                    <td>{formatMoney(Math.round(amount * 1000))}</td>
                    {transferTo && (
                      <td>
                        {name === transferTo ? (
                          <span style={{ color: 'var(--text-secondary)' }}>—</span>
                        ) : owe > 0 ? (
                          <span style={{ color: 'var(--danger)', fontWeight: 600 }}>
                            {formatMoney(Math.round(owe * 1000))}
                          </span>
                        ) : owe < 0 ? (
                          <span style={{ color: 'var(--success)', fontWeight: 600 }}>
                            Được nhận {formatMoney(Math.round(Math.abs(owe) * 1000))}
                          </span>
                        ) : (
                          <span style={{ color: 'var(--success)' }}>✓ Đã hòa</span>
                        )}
                      </td>
                    )}
                  </tr>
                )
              })}
            <tr className="result-total">
              <td>Tổng cộng</td>
              <td>{formatMoney(Math.round(grandTotal * 1000))}</td>
              {transferTo && <td></td>}
            </tr>
          </tbody>
        </table>
      </div>

      <div className="actions-bar" style={{ marginTop: '8px' }}>
        <button className="btn btn-outline" onClick={onBack}>
          ← Quay lại
        </button>
      </div>
    </div>
  )
}

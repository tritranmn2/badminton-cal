export const PLAYERS = ['Trí', 'Tỷ', 'Khánh', 'Bin', 'Tèo', 'Khoa', 'Thành', 'Bình', 'Quân', 'Long']

export const COMBOS = [
  { label: 'T3', emoji: '🟢', members: ['Trí', 'Tỷ', 'Khánh', 'Bin', 'Tèo', 'Khoa'] },
  { label: 'T7', emoji: '🔵', members: ['Trí', 'Tỷ', 'Khánh', 'Bin', 'Tèo', 'Quân', 'Long'] },
]

export const EXPENSE_TYPES = [
  { value: 'san', label: 'Tiền sân', emoji: '🏟️' },
  { value: 'cau', label: 'Tiền cầu', emoji: '🏸' },
  { value: 'tra-da', label: 'Tiền trà đá', emoji: '🧊' },
  { value: 'com', label: 'Tiền cơm', emoji: '🍚' },
]

export function formatMoney(amount) {
  return new Intl.NumberFormat('vi-VN').format(amount) + 'đ'
}

export const DEFAULT_PAYER = 'Trí'

export function getEntryLabel(entry) {
  const typeInfo = EXPENSE_TYPES.find((t) => t.value === entry.type)
  const label = typeInfo ? `${typeInfo.emoji} ${typeInfo.label}` : entry.type
  return entry.note ? `${label} - ${entry.note}` : label
}

export function calculateTotals(entries) {
  const totals = {}

  for (const entry of entries) {
    if (entry.people.length === 0 || entry.amount <= 0) continue
    const perPerson = entry.amount / entry.people.length
    for (const person of entry.people) {
      totals[person] = (totals[person] || 0) + perPerson
    }
  }

  return totals
}

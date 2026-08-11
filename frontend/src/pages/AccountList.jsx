/**
 * Account List Page
 *
 * Lists all existing accounts with their total investment value.
 * Allows adding new accounts and selecting an account to drill down.
 */

import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { formatNumber } from '../utils/formatters'

function AccountList() {
  const [accounts, setAccounts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showAddModal, setShowAddModal] = useState(false)

  // Form state
  const [newAccount, setNewAccount] = useState({
    number: '',
    holding_institution: '',
    type: 'Bank',
    tax_status: 'Taxable'
  })

  // Fetch accounts on mount
  useEffect(() => {
    fetchAccounts()
  }, [])

  async function fetchAccounts() {
    try {
      setLoading(true)
      const response = await fetch('/api/accounts')
      if (!response.ok) {
        throw new Error('Failed to fetch accounts')
      }
      const data = await response.json()
      setAccounts(data || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleAddAccount(e) {
    e.preventDefault()
    try {
      const response = await fetch('/api/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newAccount)
      })
      if (!response.ok) {
        throw new Error('Failed to create account')
      }
      setShowAddModal(false)
      setNewAccount({ number: '', holding_institution: '', type: 'Bank', tax_status: 'Taxable' })
      fetchAccounts()
    } catch (err) {
      setError(err.message)
    }
  }

  async function handleRemoveAccount(accountId) {
    if (!confirm('Are you sure you want to remove this account?')) return

    try {
      const response = await fetch(`/api/accounts/${accountId}`, {
        method: 'DELETE'
      })
      if (!response.ok) {
        throw new Error('Failed to remove account')
      }
      fetchAccounts()
    } catch (err) {
      setError(err.message)
    }
  }

  if (loading) {
    return <div className="loading">Loading accounts...</div>
  }

  return (
    <div className="account-list-page">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h1 className="page-title" style={{ marginBottom: 0 }}>Accounts</h1>
        <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
          + Add Account
        </button>
      </div>

      {error && (
        <div className="card" style={{ backgroundColor: '#fee2e2', border: '1px solid #ef4444' }}>
          <p style={{ color: '#991b1b' }}>Error: {error}</p>
        </div>
      )}

      {accounts.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <p>No accounts found. Create your first account to get started.</p>
            <button className="btn btn-primary" onClick={() => setShowAddModal(true)} style={{ marginTop: '1rem' }}>
              + Add Account
            </button>
          </div>
        </div>
      ) : (
        <div className="accounts-grid">
          {accounts.map((account) => (
            <Link
              key={account._id}
              to={`/accounts/${account._id}`}
              className="account-item"
            >
              <div className="account-info">
                <div className="account-number">{account.number}</div>
                <div className="account-institution">{account.holding_institution}</div>
                <div className="account-badges">
                  <span className={`badge badge-${account.type.toLowerCase()}`}>
                    {account.type}
                  </span>
                  <span className={`badge badge-${account.tax_status.toLowerCase()}`}>
                    {account.tax_status}
                  </span>
                  <span className={`badge ${account.active ? 'badge-active' : 'badge-inactive'}`}>
                    {account.active ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
              <div className="account-book-value">
                ${formatNumber(account.total_book_value)}
              </div>
              <div className="account-value">
                {/* Value */}
              </div>
              <button
                className="btn btn-danger"
                onClick={(e) => {
                  e.preventDefault()
                  handleRemoveAccount(account._id)
                }}
                style={{ marginLeft: '1rem' }}
              >
                Remove
              </button>
            </Link>
          ))}
        </div>
      )}

      {/* Add Account Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Add New Account</h2>
              <button className="modal-close" onClick={() => setShowAddModal(false)}>&times;</button>
            </div>

            <form onSubmit={handleAddAccount}>
              <div className="form-group">
                <label className="form-label">Account Number</label>
                <input
                  type="text"
                  className="form-input"
                  value={newAccount.number}
                  onChange={(e) => setNewAccount({ ...newAccount, number: e.target.value })}
                  placeholder="e.g., 12345-678"
                  maxLength={20}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Holding Institution</label>
                <input
                  type="text"
                  className="form-input"
                  value={newAccount.holding_institution}
                  onChange={(e) => setNewAccount({ ...newAccount, holding_institution: e.target.value })}
                  placeholder="e.g., RBC, TD Bank"
                  maxLength={20}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Type</label>
                <select
                  className="form-select"
                  value={newAccount.type}
                  onChange={(e) => setNewAccount({ ...newAccount, type: e.target.value })}
                >
                  <option value="Bank">Bank</option>
                  <option value="Brokerage">Brokerage</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Tax Status</label>
                <select
                  className="form-select"
                  value={newAccount.tax_status}
                  onChange={(e) => setNewAccount({ ...newAccount, tax_status: e.target.value })}
                >
                  <option value="Taxable">Taxable</option>
                  <option value="RRSP">RRSP</option>
                  <option value="RESP">RESP</option>
                  <option value="TFSA">TFSA</option>
                </select>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Create Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default AccountList
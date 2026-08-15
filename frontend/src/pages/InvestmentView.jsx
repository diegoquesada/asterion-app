/**
 * Investment View Page
 *
 * Displays all transactions recorded for an investment within a specific account.
 * Allows adding new purchase or sale transactions.
 */

import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { formatNumber } from '../utils/formatters'

function InvestmentView() {
  const { accountId, investmentId } = useParams()
  const [investment, setInvestment] = useState(null)
  const [account, setAccount] = useState(null)
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)

  // Form state for new transaction
  const [newTransaction, setNewTransaction] = useState({
    date: new Date().toISOString().split('T')[0],
    type: 'Purchase',
    units: 0,
    unit_price: 0
  })

  // Form state for editing investment
  const [editInvestment, setEditInvestment] = useState({
    symbol: '',
    asset_class: 'Stock',
    unit_balance: 0,
    avg_cost: 0
  })

  // Fetch investment and transactions on mount
  useEffect(() => {
    fetchData()
  }, [accountId, investmentId])

  async function fetchData() {
    try {
      setLoading(true)

      // Fetch account details
      const accountsRes = await fetch('/api/accounts')
      const accounts = await accountsRes.json()
      const foundAccount = accounts.find(a => a._id === accountId)
      setAccount(foundAccount)

      // Fetch investment details
      const investmentsRes = await fetch(`/api/accounts/${accountId}/investments`)
      const investments = await investmentsRes.json()
      const foundInvestment = investments.find(i => i._id === investmentId)
      setInvestment(foundInvestment)

      // Fetch transactions for this investment
      const transactionsRes = await fetch(`/api/investments/${investmentId}/transactions`)
      const transactionsData = await transactionsRes.json()
      setTransactions(transactionsData || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleAddTransaction(e) {
    e.preventDefault()
    try {
      const response = await fetch(`/api/investments/${investmentId}/transactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newTransaction,
          date: newTransaction.date
        })
      })
      if (!response.ok) {
        throw new Error('Failed to create transaction')
      }
      setShowAddModal(false)
      setNewTransaction({
        date: new Date().toISOString().split('T')[0],
        type: 'Purchase',
        units: 0,
        unit_price: 0
      })
      // Refresh investment and transaction data
      fetchData()
    } catch (err) {
      setError(err.message)
    }
  }

  async function handleUpdateInvestment(e) {
    e.preventDefault()
    try {
      const response = await fetch(`/api/investments/${investmentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editInvestment)
      })
      if (!response.ok) {
        throw new Error('Failed to update investment')
      }
      setShowEditModal(false)
      fetchData()
    } catch (err) {
      setError(err.message)
    }
  }

  function openEditModal() {
    setEditInvestment({
      symbol: investment.symbol,
      asset_class: investment.asset_class,
      investment_vehicle: investment.investment_vehicle,
      unit_balance: investment.unit_balance,
      avg_cost: investment.avg_cost
    })
    setShowEditModal(true)
  }

  // Sort transactions by date (newest first)
  const sortedTransactions = [...transactions].sort((a, b) => {
    return new Date(b.date) - new Date(a.date)
  })

  // Calculate totals
  const totalPurchases = transactions
    .filter(t => t.type === 'Purchase')
    .reduce((sum, t) => sum + t.transaction_cost, 0)

  const totalSales = transactions
    .filter(t => t.type === 'Sale')
    .reduce((sum, t) => sum + t.transaction_cost, 0)

  if (loading) {
    return <div className="loading">Loading investment...</div>
  }

  if (!investment) {
    return <div className="error">Investment not found</div>
  }

  const currentValue = investment.unit_balance * investment.avg_cost

  return (
    <div className="investment-view-page">
      {/* Breadcrumb */}
      <div className="breadcrumb">
        <Link to="/">Overview</Link>
        <span className="breadcrumb-separator">&gt;</span>
        <Link to="/accounts">Accounts</Link>
        <span className="breadcrumb-separator">&gt;</span>
        <Link to={`/accounts/${accountId}`}>{account?.number || accountId}</Link>
        <span className="breadcrumb-separator">&gt;</span>
        <span className="breadcrumb-current">{investment.symbol}</span>
      </div>

      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h1 className="page-title" style={{ marginBottom: '0.25rem' }}>
            Investment: {investment.symbol}
          </h1>
          <div className="account-badges">
            <span className="badge" style={{ backgroundColor: '#e0e7ff', color: '#3730a3' }}>
              {investment.asset_class}
            </span>
            <span className="badge" style={{ backgroundColor: '#fef3c7', color: '#78350f' }}>
              {investment.investment_vehicle}
            </span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn btn-secondary" onClick={openEditModal}>
            Edit Investment
          </button>
          <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
            + Add Transaction
          </button>
        </div>
      </div>

      {error && (
        <div className="card" style={{ backgroundColor: '#fee2e2', border: '1px solid #ef4444' }}>
          <p style={{ color: '#991b1b' }}>Error: {error}</p>
        </div>
      )}

      {/* Investment Summary */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Current Position</h2>
        </div>
        <div className="grid-3">
          <div>
            <div style={{ color: '#64748b', fontSize: '0.875rem', marginBottom: '0.25rem' }}>Quantity</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 600 }}>{investment.unit_balance?.toFixed(4) || '0.0000'}</div>
          </div>
          <div>
            <div style={{ color: '#64748b', fontSize: '0.875rem', marginBottom: '0.25rem' }}>Average cost</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 600 }}>${formatNumber(investment.avg_cost)}</div>
          </div>
          <div>
            <div style={{ color: '#64748b', fontSize: '0.875rem', marginBottom: '0.25rem' }}>Book value</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 600, color: '#10b981' }}>${formatNumber(currentValue)}</div>
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Transactions</h2>
        </div>

        {transactions.length === 0 ? (
          <div className="empty-state">
            <p>No transactions recorded for this investment.</p>
            <button className="btn btn-primary" onClick={() => setShowAddModal(true)} style={{ marginTop: '1rem' }}>
              + Add Transaction
            </button>
          </div>
        ) : (
          <>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Type</th>
                    <th>Units</th>
                    <th>Unit Price</th>
                    <th>Total Cost</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedTransactions.map((trans) => (
                    <tr key={trans._id}>
                      <td>{new Date(trans.date).toLocaleDateString()}</td>
                      <td>
                        <span className={`transaction-type ${trans.type.toLowerCase()}`}>
                          {trans.type}
                        </span>
                      </td>
                      <td>{trans.units?.toFixed(4) || '0.0000'}</td>
                      <td>${formatNumber(trans.unit_price)}</td>
                      <td style={{ fontWeight: 600, color: trans.type === 'Purchase' ? '#10b981' : '#ef4444' }}>
                        {trans.type === 'Purchase' ? '+' : '-'}${formatNumber(trans.transaction_cost)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="total-row">
              <div>
                <span style={{ color: '#64748b' }}>Total Purchases: </span>
                <span style={{ color: '#10b981' }}>${formatNumber(totalPurchases)}</span>
              </div>
              <div>
                <span style={{ color: '#64748b' }}>Total Sales: </span>
                <span style={{ color: '#ef4444' }}>${formatNumber(totalSales)}</span>
              </div>
              <div>
                <span style={{ color: '#64748b' }}>Net: </span>
                <span style={{ color: totalSales > totalPurchases ? '#ef4444' : '#10b981' }}>
                  ${formatNumber(totalPurchases - totalSales)}
                </span>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Add Transaction Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Add Transaction</h2>
              <button className="modal-close" onClick={() => setShowAddModal(false)}>&times;</button>
            </div>

            <form onSubmit={handleAddTransaction}>
              <div className="form-group">
                <label className="form-label">Date</label>
                <input
                  type="date"
                  className="form-input"
                  value={newTransaction.date}
                  onChange={(e) => setNewTransaction({ ...newTransaction, date: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Type</label>
                <select
                  className="form-select"
                  value={newTransaction.type}
                  onChange={(e) => setNewTransaction({ ...newTransaction, type: e.target.value })}
                >
                  <option value="Purchase">Purchase</option>
                  <option value="Sale">Sale</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Number of Units</label>
                <input
                  type="number"
                  step="0.0001"
                  className="form-input"
                  value={newTransaction.units}
                  onChange={(e) => setNewTransaction({ ...newTransaction, units: parseFloat(e.target.value) || 0 })}
                  min="0"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Unit Price</label>
                <input
                  type="number"
                  step="0.01"
                  className="form-input"
                  value={newTransaction.unit_price}
                  onChange={(e) => setNewTransaction({ ...newTransaction, unit_price: parseFloat(e.target.value) || 0 })}
                  min="0"
                  required
                />
              </div>

              <div className="form-group" style={{ padding: '0.75rem', backgroundColor: '#f8fafc', borderRadius: '6px' }}>
                <div style={{ color: '#64748b', fontSize: '0.875rem' }}>Transaction Cost</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 600 }}>
                  ${formatNumber(newTransaction.units * newTransaction.unit_price)}
                </div>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Add Transaction
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Investment Modal */}
      {showEditModal && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Edit Investment</h2>
              <button className="modal-close" onClick={() => setShowEditModal(false)}>&times;</button>
            </div>

            <form onSubmit={handleUpdateInvestment}>
              <div className="form-group">
                <label className="form-label">Symbol</label>
                <input
                  type="text"
                  className="form-input"
                  value={editInvestment.symbol}
                  onChange={(e) => setEditInvestment({ ...editInvestment, symbol: e.target.value.toUpperCase() })}
                  maxLength={10}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Asset Class</label>
                <select
                  className="form-select"
                  value={editInvestment.asset_class}
                  onChange={(e) => setEditInvestment({ ...editInvestment, asset_class: e.target.value })}
                >
                  <option value="Equity">Equity</option>
                  <option value="Fixed Income">Fixed Income</option>
                  <option value="Alternative">Alternative</option>
                  <option value="Mixed">Mixed</option>
                  <option value="Cash">Cash</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Investment Vehicle</label>
                <select
                  className="form-select"
                  value={editInvestment.investment_vehicle}
                  onChange={(e) => setEditInvestment({ ...editInvestment, investment_vehicle: e.target.value })}
                >
                  <option value="Stock">Stock</option>
                  <option value="Mutual fund">Mutual fund</option>
                  <option value="ETF">ETF</option>
                  <option value="Bond">Bond</option>
                  <option value="GIC">GIC</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Unit Balance</label>
                <input
                  type="number"
                  step="0.0001"
                  className="form-input"
                  value={editInvestment.unit_balance}
                  onChange={(e) => setEditInvestment({ ...editInvestment, unit_balance: parseFloat(e.target.value) || 0 })}
                  min="0"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Average Cost per Unit</label>
                <input
                  type="number"
                  step="0.01"
                  className="form-input"
                  value={editInvestment.avg_cost}
                  onChange={(e) => setEditInvestment({ ...editInvestment, avg_cost: parseFloat(e.target.value) || 0 })}
                  min="0"
                  required
                />
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowEditModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default InvestmentView

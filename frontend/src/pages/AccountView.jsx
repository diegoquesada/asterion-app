/**
 * Account View Page
 *
 * Displays all investments within a given account as a table.
 * Shows a pie chart of investments by asset class.
 * Allows drilling down into individual investments.
 */

import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { formatNumber } from '../utils/formatters'

const COLORS = ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16']

function AccountView() {
  const { accountId } = useParams()
  const [account, setAccount] = useState(null)
  const [investments, setInvestments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showAddModal, setShowAddModal] = useState(false)

  // Form state for new investment
  const [newInvestment, setNewInvestment] = useState({
    symbol: '',
    asset_class: 'Stock',
    unit_balance: 0,
    avg_cost: 0
  })

  // Fetch account and investments on mount
  useEffect(() => {
    fetchData()
  }, [accountId])

  async function fetchData() {
    try {
      setLoading(true)

      // Fetch account details
      const accountsRes = await fetch('/api/accounts')
      const accounts = await accountsRes.json()
      const foundAccount = accounts.find(a => a._id === accountId)
      setAccount(foundAccount)

      // Fetch investments for this account
      const investmentsRes = await fetch(`/api/accounts/${accountId}/investments`)
      const investmentsData = await investmentsRes.json()
      setInvestments(investmentsData || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleAddInvestment(e) {
    e.preventDefault()
    try {
      const response = await fetch(`/api/accounts/${accountId}/investments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newInvestment)
      })
      if (!response.ok) {
        throw new Error('Failed to create investment')
      }
      setShowAddModal(false)
      setNewInvestment({ symbol: '', asset_class: 'Stock', unit_balance: 0, avg_cost: 0 })
      fetchData()
    } catch (err) {
      setError(err.message)
    }
  }

  async function handleRemoveInvestment(investmentId) {
    if (!confirm('Are you sure you want to remove this investment? Transactions will be kept.')) return

    try {
      const response = await fetch(`/api/investments/${investmentId}`, {
        method: 'DELETE'
      })
      if (!response.ok) {
        throw new Error('Failed to remove investment')
      }
      fetchData()
    } catch (err) {
      setError(err.message)
    }
  }

  async function handleProduceSnapshot() {
    try {
      const response = await fetch(`/api/accounts/${accountId}/snapshot`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })
      if (!response.ok) {
        throw new Error('Failed to produce snapshot')
      }
      alert('Snapshot created successfully!')
    } catch (err) {
      setError(err.message)
    }
  }

  // Calculate chart data
  // The API calls asset_class what is actually investment vehicles - will be fixed later.
  const investmentVehicleTotals = {}
  investments.forEach(inv => {
    const value = inv.unit_balance * inv.avg_cost
    investmentVehicleTotals[inv.asset_class] = (investmentVehicleTotals[inv.asset_class] || 0) + value
  })

  const chartData = Object.entries(investmentVehicleTotals).map(([name, value]) => ({
    name,
    value: parseFloat(value.toFixed(2))
  }))

  const totalValue = investments.reduce((sum, inv) => sum + (inv.unit_balance * inv.avg_cost), 0)

  if (loading) {
    return <div className="loading">Loading account...</div>
  }

  if (!account) {
    return <div className="error">Account not found</div>
  }

  return (
    <div className="account-view-page">
      {/* Breadcrumb */}
      <div className="breadcrumb">
        <Link to="/">Overview</Link>
        <span className="breadcrumb-separator">&gt;</span>
        <Link to="/accounts">Accounts</Link>
        <span className="breadcrumb-separator">&gt;</span>
        <span className="breadcrumb-current">{account.number}</span>
      </div>

      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h1 className="page-title" style={{ marginBottom: '0.25rem' }}>Account: {account.number}</h1>
          <div className="account-badges">
            <span className={`badge badge-${account.type.toLowerCase()}`}>{account.type}</span>
            <span className={`badge badge-${account.tax_status.toLowerCase()}`}>{account.tax_status}</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn btn-secondary" onClick={handleProduceSnapshot}>
            Take Snapshot
          </button>
          <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
            + Add Investment
          </button>
        </div>
      </div>

      {error && (
        <div className="card" style={{ backgroundColor: '#fee2e2', border: '1px solid #ef4444' }}>
          <p style={{ color: '#991b1b' }}>Error: {error}</p>
        </div>
      )}

      <div className="grid-2">
        {/* Investments Table */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Investments</h2>
          </div>

          {investments.length === 0 ? (
            <div className="empty-state">
              <p>No investments found in this account.</p>
              <button className="btn btn-primary" onClick={() => setShowAddModal(true)} style={{ marginTop: '1rem' }}>
                + Add Investment
              </button>
            </div>
          ) : (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Symbol</th>
                    <th>Asset Class</th>
                    <th>Units</th>
                    <th>Avg Cost</th>
                    <th>Book Value</th>
                    <th>Market Value</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {investments.map((inv) => (
                    <tr key={inv._id}>
                      <td>
                        <Link
                          to={`/accounts/${accountId}/investments/${inv._id}`}
                          style={{ fontWeight: 600, color: '#2563eb' }}
                        >
                          {inv.symbol}
                        </Link>
                      </td>
                      <td>{inv.asset_class}</td>
                      <td>{inv.unit_balance?.toFixed(4) || '0.0000'}</td>
                      <td>${formatNumber(inv.avg_cost)}</td>
                      <td style={{ fontWeight: 600, color: '#10b981' }}>
                        ${formatNumber(inv.unit_balance * inv.avg_cost)}
                      </td>
                      <td></td>
                      <td>
                        <button
                          className="btn btn-danger"
                          onClick={() => handleRemoveInvestment(inv._id)}
                          style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr style={{ backgroundColor: '#f8fafc', fontWeight: 600 }}>
                    <td colSpan={4}>Total</td>
                    <td style={{ color: '#10b981' }}>${formatNumber(totalValue)}</td>
                    <td></td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>

        {/* Investment vehicles chart */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Investment Vehicles</h2>
          </div>

          {chartData.length === 0 ? (
            <div className="empty-state">
              <p>No investments to display.</p>
            </div>
          ) : (
            <div className="chart-container">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `$${value.toFixed(2)}`} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* Add Investment Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Add New Investment</h2>
              <button className="modal-close" onClick={() => setShowAddModal(false)}>&times;</button>
            </div>

            <form onSubmit={handleAddInvestment}>
              <div className="form-group">
                <label className="form-label">Symbol</label>
                <input
                  type="text"
                  className="form-input"
                  value={newInvestment.symbol}
                  onChange={(e) => setNewInvestment({ ...newInvestment, symbol: e.target.value.toUpperCase() })}
                  placeholder="e.g., AAPL, VGRO"
                  maxLength={10}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Asset Class</label>
                <select
                  className="form-select"
                  value={newInvestment.asset_class}
                  onChange={(e) => setNewInvestment({ ...newInvestment, asset_class: e.target.value })}
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
                  value={newInvestment.unit_balance}
                  onChange={(e) => setNewInvestment({ ...newInvestment, unit_balance: parseFloat(e.target.value) || 0 })}
                  min="0"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Average Cost per Unit</label>
                <input
                  type="number"
                  step="0.01"
                  className="form-input"
                  value={newInvestment.avg_cost}
                  onChange={(e) => setNewInvestment({ ...newInvestment, avg_cost: parseFloat(e.target.value) || 0 })}
                  min="0"
                />
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Add Investment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default AccountView

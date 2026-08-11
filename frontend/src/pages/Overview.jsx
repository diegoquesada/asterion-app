/**
 * Overview Page
 *
 * Displays overall asset allocation combining all accounts.
 * Shows:
 * - A table of all accounts with their totals on the left
 * - A pie chart of asset allocation by asset class on the right
 */

import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { formatNumber } from '../utils/formatters'

// Color palette for asset classes
const COLORS = ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16']

function Overview() {
  const [accounts, setAccounts] = useState([])
  const [assetAllocation, setAssetAllocation] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Fetch overview data on component mount
  useEffect(() => {
    fetchOverview()
  }, [])

  async function fetchOverview() {
    try {
      setLoading(true)
      const response = await fetch('/api/overview')
      if (!response.ok) {
        throw new Error('Failed to fetch overview data')
      }
      const data = await response.json()
      setAccounts(data.accounts || [])
      setAssetAllocation(data.asset_allocation || {})
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Convert asset allocation object to chart data format
  const chartData = Object.entries(assetAllocation).map(([name, value]) => ({
    name,
    value: parseFloat(value.toFixed(2))
  }))

  // Calculate total value across all accounts
  const totalValue = 0
  const totalBookValue = accounts.reduce((sum, acc) => sum + (acc.total_book_value || 0), 0)

  if (loading) {
    return <div className="loading">Loading overview...</div>
  }

  if (error) {
    return <div className="error">Error: {error}</div>
  }

  return (
    <div className="overview-page">
      <h1 className="page-title">Overview</h1>

      <div className="overview-container">
        {/* Accounts Table */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Accounts</h2>
            <Link to="/accounts" className="btn btn-secondary">View All</Link>
          </div>

          {accounts.length === 0 ? (
            <div className="empty-state">
              <p>No accounts found. Create an account to get started.</p>
              <Link to="/accounts" className="btn btn-primary" style={{ marginTop: '1rem' }}>
                Go to Accounts
              </Link>
            </div>
          ) : (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Account</th>
                    <th>Institution</th>
                    <th>Type</th>
                    <th>Tax Status</th>
                    <th>Book Value</th>
                    <th>Market Value</th>
                  </tr>
                </thead>
                <tbody>
                  {accounts.map((account) => (
                    <tr key={account._id}>
                      <td>
                        <Link to={`/accounts/${account._id}`} style={{ fontWeight: 600, color: '#2563eb' }}>
                          {account.number}
                        </Link>
                      </td>
                      <td>{account.holding_institution}</td>
                      <td>
                        <span className={`badge badge-${account.type.toLowerCase()}`}>
                          {account.type}
                        </span>
                      </td>
                      <td>
                        <span className={`badge badge-${account.tax_status.toLowerCase()}`}>
                          {account.tax_status}
                        </span>
                      </td>
                      <td style={{ fontWeight: 600, color: '#10b981' }}>
                        ${formatNumber(account.total_book_value)}
                      </td>
                      <td></td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr style={{ backgroundColor: '#f8fafc', fontWeight: 600 }}>
                    <td colSpan={4}>Total</td>
                    <td style={{ color: '#10b981' }}>${formatNumber(totalBookValue)}</td>
                    <td style={{ color: '#10b981' }}></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>

        {/* Asset Allocation Chart */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Asset Allocation</h2>
          </div>

          {chartData.length === 0 ? (
            <div className="empty-state">
              <p>No investments found. Add investments to see asset allocation.</p>
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
                  <Tooltip formatter={(value) => `$${formatNumber(value)}`} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Overview
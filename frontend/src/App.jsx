/**
 * AsterionApp - Main Application Component
 *
 * This is the root component that sets up routing for the investment tracker.
 * The app has the following main views:
 * - Overview: Asset allocation across all accounts
 * - AccountList: List of all accounts with totals
 * - AccountView: Investments within a specific account
 * - InvestmentView: Transactions for a specific investment
 */

import { BrowserRouter, Routes, Route, Link, Navigate } from 'react-router-dom'
import Overview from './pages/Overview'
import AccountList from './pages/AccountList'
import AccountView from './pages/AccountView'
import InvestmentView from './pages/InvestmentView'
import Footer from './components/Footer'

function App() {
  return (
    <BrowserRouter>
      <div className="app">
        <nav className="navbar">
          <div className="nav-brand">
            <h1>AsterionApp</h1>
            <span className="nav-subtitle">Investment Tracker</span>
          </div>
          <div className="nav-links">
            <Link to="/">Overview</Link>
            <Link to="/accounts">Accounts</Link>
          </div>
        </nav>
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Overview />} />
            <Route path="/accounts" element={<AccountList />} />
            <Route path="/accounts/:accountId" element={<AccountView />} />
            <Route path="/accounts/:accountId/investments/:investmentId" element={<InvestmentView />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </BrowserRouter>
  )
}

export default App
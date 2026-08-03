import React from 'react';
import { APP_VERSION } from '../version';

function Footer() {
  return (
    <footer className="app-footer">
      <div className="footer-content">
        <span>© {new Date().getFullYear()} AsterionApp</span>
        <span className="version-tag">v{APP_VERSION}</span>
      </div>
    </footer>
  );
}

export default Footer;

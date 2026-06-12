import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const ICON = (p) => `<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${p}</svg>`;

const dash = '<rect x="3" y="3" width="7" height="9"/><rect x="14" y="3" width="7" height="5"/><rect x="14" y="12" width="7" height="9"/><rect x="3" y="16" width="7" height="5"/>';
const apps = '<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>';
const user = '<circle cx="12" cy="8" r="4"/><path d="M4 21v-1a6 6 0 0 1 12 0v1"/>';
const layout = '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18M3 9h6"/>';
const doc = '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/>';
const lock = '<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>';
const caretSvg = '<svg class="caret" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><polyline points="9 6 15 12 9 18"/></svg>';

function Svg({ path }) {
  return <svg className="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" dangerouslySetInnerHTML={{ __html: path }} />;
}

const MENU = [
  { sec: 'Main Menu' },
  { label: 'Dashboard', icon: dash, open: true, sub: [
    ['Admin Dashboard', '/'],
    ['Employee Dashboard', '/employee-dashboard'],
    ['Deals Dashboard', '/deals-dashboard'],
    ['Leads Dashboard', '/leads-dashboard'],
  ]},
  { label: 'CRM', icon: apps, sub: [
    ['Leads', '/crm/leads'],
    ['Customers', '/crm/customers'],
    ['Deals', '/crm/deals'],
    ['Quotations', '/crm/quotations'],
    ['Enquiries', '/crm/enquiries'],
  ]},
  { label: 'Sales', icon: apps, sub: [
    ['Dashboard', '/sales/dashboard'],
    ['Products', '/sales/products'],
    ['Orders', '/sales/orders'],
    ['Invoices', '/sales/invoices'],
    ['Payments', '/sales/payments'],
  ]},
  { label: 'Purchase', icon: apps, sub: [
    ['Dashboard', '/purchase/dashboard'],
    ['Vendors', '/purchase/vendors'],
    ['Requests', '/purchase/requests'],
    ['Orders', '/purchase/orders'],
    ['Bills', '/purchase/bills'],
  ]},
  { label: 'HRMS', icon: user, sub: [
    ['Employees', '/hrms/employees'],
    ['Attendance', '/hrms/attendance'],
    ['Leaves', '/hrms/leaves'],
    ['Payroll', '/hrms/payroll'],
    ['Reimbursements', '/hrms/reimbursements'],
    ['Recruitment', '/hrms/recruitment'],
    ['Assets', '/hrms/assets'],
  ]},
  { sec: 'Admin' },
  { label: 'Users', icon: user, sub: [
    ['All Users', '/admin/users'],
    ['Roles', '/admin/roles'],
    ['Settings', '/admin/settings'],
  ]},
];

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [openMenus, setOpenMenus] = useState(() => {
    const init = {};
    MENU.forEach(m => {
      if (m.sub) {
        init[m.label] = m.open || m.sub.some(s => location.pathname.startsWith(s[1].replace(/\/\d+$/, '')));
      }
    });
    return init;
  });

  const toggle = (label) => setOpenMenus(p => ({ ...p, [label]: !p[label] }));

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    if (path.endsWith('/dashboard')) return location.pathname === path || location.pathname === path.replace('/dashboard', '');
    return location.pathname.startsWith(path);
  };

  return (
    <aside className="sidebar">
      <div className="sidebar__logo" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
        <span className="dot">◎</span>
        <b>Smart<span style={{ color: 'var(--primary)' }}>HR</span></b>
      </div>
      <nav className="sidebar__nav">
        {MENU.map((m) => {
          if (m.sec) return <div key={m.sec} className="nav-section">{m.sec}</div>;
          if (m.sub) {
            const isOpen = openMenus[m.label];
            return (
              <div key={m.label}>
                <div className={`nav-item ${isOpen ? 'open' : ''} ${m.sub.some(s => isActive(s[1])) ? 'active' : ''}`}
                  onClick={() => toggle(m.label)}>
                  <Svg path={m.icon} />
                  <span>{m.label}</span>
                  <span dangerouslySetInnerHTML={{ __html: caretSvg }} />
                </div>
                <div className={`nav-sub ${isOpen ? 'show' : ''}`}>
                  {m.sub.map(([label, path]) => (
                    <button key={path} className={`nav-sub-link ${isActive(path) ? 'active' : ''}`}
                      onClick={() => navigate(path)}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            );
          }
          return (
            <div key={m.label} className={`nav-item nav-link ${isActive(m.path) ? 'active' : ''}`} onClick={() => navigate(m.path)}>
              <Svg path={m.icon} /><span>{m.label}</span>
            </div>
          );
        })}
      </nav>
    </aside>
  );
}

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

export default function Topbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [notifCount, setNotifCount] = useState(0);
  const [searchVal, setSearchVal] = useState('');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [clock, setClock] = useState('');

  useEffect(() => {
    const t = setInterval(() => setClock(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })), 1000);
    api.get('/notifications?per_page=1').then(r => setNotifCount(r.data.total || r.data.data?.length || 0)).catch(() => {});
    setClock(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    return () => clearInterval(t);
  }, []);

  const handleSearchKey = (e) => {
    if (e.key === 'Enter' && searchVal.trim()) {
      navigate(`/hrms/employees?search=${encodeURIComponent(searchVal.trim())}`);
      setSearchVal('');
    }
  };

  const fullInitials = user?.name ? user.name.split(' ').map(s => s[0]).join('').slice(0, 2).toUpperCase() : 'AD';

  return (
    <header className="topbar">
      <div className="search">
        <svg viewBox="0 0 24 24" width="16" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7"/><path d="m21 21-4-4"/></svg>
        <input placeholder="Search employees, orders..." value={searchVal} onChange={e => setSearchVal(e.target.value)} onKeyDown={handleSearchKey} />
        <kbd>CTRL + /</kbd>
      </div>

      <div className="topbar__icons">
        <div className="tb-ico" title="Fullscreen" onClick={() => document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen()}>⛶</div>
        <div className="tb-ico" title="Apps">▦</div>
        <div className="tb-ico" title={clock}>🗓</div>
        <div className="tb-ico" title="Messages" onClick={() => navigate('/crm/enquiries')} style={{ cursor: 'pointer' }}>
          {notifCount > 0 && <span className="badge-top"></span>}✉
        </div>
        <div className="tb-ico" title={`${notifCount} notifications`} style={{ cursor: 'pointer' }}>
          {notifCount > 0 && <span className="badge-top" style={{ background: 'var(--red)' }}>{notifCount > 9 ? '9+' : notifCount}</span>}🔔
        </div>
        <div style={{ position: 'relative' }}>
          <div className="avatar" style={{ cursor: 'pointer', background: 'var(--primary)', color: '#fff', display: 'grid', placeItems: 'center', fontSize: 12, fontWeight: 700, width: 32, height: 32, borderRadius: '50%' }}
            onClick={() => setShowUserMenu(!showUserMenu)} title={user?.name || 'Admin'}>
            {fullInitials}
          </div>
          {showUserMenu && <div style={{ position: 'absolute', right: 0, top: 'calc(100% + 8px)', background: '#fff', border: '1px solid var(--line)', borderRadius: 10, padding: 8, minWidth: 180, boxShadow: '0 4px 20px rgba(0,0,0,.08)', zIndex: 100 }}>
            <div style={{ padding: '8px 12px', borderBottom: '1px solid var(--line)', marginBottom: 4 }}>
              <div style={{ fontWeight: 600, fontSize: 13 }}>{user?.name || 'Admin'}</div>
              <div className="muted" style={{ fontSize: 11 }}>{user?.email || 'admin@example.com'}</div>
            </div>
            <div style={{ fontSize: 12.5, padding: '6px 12px', cursor: 'pointer', borderRadius: 6 }} onClick={() => { navigate('/admin/settings'); setShowUserMenu(false); }}
              onMouseEnter={e => e.target.style.background = '#F4F6FA'} onMouseLeave={e => e.target.style.background = 'transparent'}>
              ⚙ Settings
            </div>
            <div style={{ fontSize: 12.5, padding: '6px 12px', cursor: 'pointer', borderRadius: 6, color: 'var(--red)' }}
              onClick={() => { logout(); setShowUserMenu(false); }}
              onMouseEnter={e => e.target.style.background = '#FFF0F0'} onMouseLeave={e => e.target.style.background = 'transparent'}>
              🚪 Sign Out
            </div>
          </div>}
        </div>
      </div>
    </header>
  );
}

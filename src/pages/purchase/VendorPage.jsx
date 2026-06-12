import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

export default function VendorPage() {
  const navigate = useNavigate();
  const [vendors, setVendors] = useState([]);
  const [orders, setOrders] = useState([]);
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [formData, setFormData] = useState({ name: '', company: '', email: '', phone: '', address: '', city: '', state: '', country: 'India', pincode: '', gst_no: '', website: '', status: 'active', rating: '3' });
  const [msg, setMsg] = useState('');

  const showMsg = (t, type) => { setMsg(type === 'error' ? 'Error' : t); setTimeout(() => setMsg(''), 3000); };

  useEffect(() => { fetchVendors(); fetchAllOrders(); fetchAllBills(); }, [page]);

  const fetchVendors = async () => {
    setLoading(true);
    try {
      const res = await api.get('/vendors', { params: { per_page: 20, page } });
      setVendors(res.data.data || []);
      setLastPage(res.data.last_page || 1);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const fetchAllOrders = async () => {
    try { const res = await api.get('/purchase-orders', { params: { per_page: 500 } }); setOrders(res.data.data || []); } catch (e) {}
  };

  const fetchAllBills = async () => {
    try { const res = await api.get('/vendor-bills', { params: { per_page: 500 } }); setBills(res.data.data || []); } catch (e) {}
  };

  const handleSearch = () => {
    if (!search.trim()) { fetchVendors(); return; }
    setLoading(true);
    api.get('/vendors', { params: { per_page: 20, search } }).then(res => {
      setVendors(res.data.data || []); setLastPage(res.data.last_page || 1); setLoading(false);
    }).catch(() => setLoading(false));
  };

  const openCreate = () => {
    setEditing(null);
    setFormData({ name: '', company: '', email: '', phone: '', address: '', city: '', state: '', country: 'India', pincode: '', gst_no: '', website: '', status: 'active', rating: '3' });
    setShowForm(true);
  };

  const openEdit = (v) => {
    setEditing(v);
    setFormData({ name: v.name, company: v.company || '', email: v.email || '', phone: v.phone || '', address: v.address || '', city: v.city || '', state: v.state || '', country: v.country || 'India', pincode: v.pincode || '', gst_no: v.gst_no || '', website: v.website || '', status: v.status || 'active', rating: v.rating || '3' });
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) { await api.put(`/vendors/${editing.id}`, formData); }
      else { await api.post('/vendors', formData); }
      setShowForm(false);
      showMsg(editing ? 'Updated' : 'Added');
      fetchVendors();
    } catch (e) { showMsg('Error', 'error'); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this vendor?')) return;
    try { await api.delete(`/vendors/${id}`); showMsg('Deleted'); fetchVendors(); } catch (e) { showMsg('Error', 'error'); }
  };

  const getVendorOrders = (vendorId) => orders.filter(o => o.vendor_id === vendorId);
  const getVendorBills = (vendorId) => bills.filter(b => b.vendor_id === vendorId);
  const getVendorTotal = (vendorId) => getVendorOrders(vendorId).reduce((s, o) => s + Number(o.grand_total), 0);

  return (
    <div className="page">
      {msg && <div style={{ position: 'fixed', top: 80, right: 24, zIndex: 9999, background: msg === 'Error' ? 'var(--red)' : 'var(--green)', color: '#fff', padding: '10px 20px', borderRadius: 8, fontSize: 13, fontWeight: 600 }}>{msg}</div>}

      <div className="page-head">
        <div><h1>Vendors</h1><div className="breadcrumb"><span>Purchase</span><span>/</span><span className="c">Vendors</span></div></div>
        <div className="head-actions">
          <div className="search" style={{ width: 180, marginRight: 8 }}>
            <input type="text" placeholder="Search vendors..." value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSearch()} />
          </div>
          <button className="btn btn-sm" onClick={() => fetchVendors()}>⟳ Refresh</button>
          <button className="btn-primary btn btn-sm" onClick={openCreate}>+ Add Vendor</button>
        </div>
      </div>

      {loading ? (
        <div className="grid" style={{ gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
          {Array.from({ length: 6 }).map((_, i) => <div key={i} className="card" style={{ padding: 16 }}><div className="muted">Loading...</div></div>)}
        </div>
      ) : vendors.length === 0 ? (
        <div className="card muted text-c" style={{ padding: 40 }}>No vendors found</div>
      ) : (
        <div className="grid" style={{ gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
          {vendors.map(vendor => {
            const vOrders = getVendorOrders(vendor.id);
            const vBills = getVendorBills(vendor.id);
            const totalSpend = getVendorTotal(vendor.id);
            return (
              <div key={vendor.id} className="card" style={{ padding: 16, cursor: 'pointer', border: '1px solid var(--line)', transition: 'all .15s' }}
                onClick={() => setSelectedVendor(vendor)}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--primary)'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--line)'}>
                <div className="flex between">
                  <div className="flex items-center gap-8">
                    <span style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--primary)', color: '#fff', fontWeight: 700, fontSize: 16, display: 'grid', placeItems: 'center' }}>
                      {vendor.name?.charAt(0)}
                    </span>
                    <div><b style={{ fontSize: 13 }}>{vendor.name}</b>{vendor.company && <div className="muted" style={{ fontSize: 11 }}>{vendor.company}</div>}</div>
                  </div>
                  <span className={`tag ${vendor.status === 'active' ? 'green' : 'red'}`} style={{ fontSize: 10 }}>{vendor.status}</span>
                </div>
                <div style={{ marginTop: 8 }}>
                  {vendor.rating && <span style={{ color: '#F59E0B', fontSize: 12 }}>{'★'.repeat(Number(vendor.rating))}{'☆'.repeat(5 - Number(vendor.rating))}</span>}
                </div>
                <div className="grid mt-8" style={{ gridTemplateColumns: 'repeat(3,1fr)', gap: 6 }}>
                  <div style={{ background: '#F4F6FA', borderRadius: 6, padding: '6px 8px', textAlign: 'center' }}>
                    <div className="muted" style={{ fontSize: 10 }}>Orders</div>
                    <b style={{ fontSize: 14 }}>{vOrders.length}</b>
                  </div>
                  <div style={{ background: '#F4F6FA', borderRadius: 6, padding: '6px 8px', textAlign: 'center' }}>
                    <div className="muted" style={{ fontSize: 10 }}>Bills</div>
                    <b style={{ fontSize: 14 }}>{vBills.length}</b>
                  </div>
                  <div style={{ background: '#F4F6FA', borderRadius: 6, padding: '6px 8px', textAlign: 'center' }}>
                    <div className="muted" style={{ fontSize: 10 }}>Spend</div>
                    <b style={{ fontSize: 14, color: 'var(--primary)' }}>₹{totalSpend.toLocaleString()}</b>
                  </div>
                </div>
                <div className="flex" style={{ gap: 4, marginTop: 8 }}>
                  <button className="btn btn-xs" onClick={(e) => { e.stopPropagation(); openEdit(vendor); }}>✏ Edit</button>
                  <button className="btn btn-xs" onClick={(e) => { e.stopPropagation(); handleDelete(vendor.id); }} style={{ color: 'var(--red)' }}>🗑 Delete</button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="flex between" style={{ marginTop: 16, fontSize: 12 }}>
        <span className="muted">Page {page} of {lastPage}</span>
        <div className="flex gap-8">
          <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="btn btn-xs">‹ Prev</button>
          <span style={{ fontWeight: 600, fontSize: 12 }}>{page} / {lastPage}</span>
          <button disabled={page >= lastPage} onClick={() => setPage(p => p + 1)} className="btn btn-xs">Next ›</button>
        </div>
      </div>

      {selectedVendor && <div className="modal-overlay" onClick={() => setSelectedVendor(null)}>
        <div className="card" style={{ maxWidth: 640, margin: '5vh auto', padding: 24, maxHeight: '85vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
          <div className="flex between">
            <div className="flex items-center gap-8">
              <span style={{ width: 44, height: 44, borderRadius: 10, background: 'var(--primary)', color: '#fff', fontWeight: 700, fontSize: 18, display: 'grid', placeItems: 'center' }}>
                {selectedVendor.name?.charAt(0)}
              </span>
              <div><h3>{selectedVendor.name}</h3>{selectedVendor.company && <div className="muted" style={{ fontSize: 12 }}>{selectedVendor.company}</div>}</div>
            </div>
            <span className="muted" style={{ cursor: 'pointer', fontSize: 18 }} onClick={() => setSelectedVendor(null)}>✕</span>
          </div>
          <div className="grid mt-16" style={{ gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
            {selectedVendor.email && <InfoBlock label="✉ Email" value={selectedVendor.email} />}
            {selectedVendor.phone && <InfoBlock label="📞 Phone" value={selectedVendor.phone} />}
            {selectedVendor.city && <InfoBlock label="📍 Location" value={`${selectedVendor.city}, ${selectedVendor.state}`} />}
            {selectedVendor.gst_no && <InfoBlock label="🔖 GST" value={selectedVendor.gst_no} />}
            {selectedVendor.website && <InfoBlock label="🌐 Website" value={selectedVendor.website} />}
          </div>

          {(() => {
            const vOrders = getVendorOrders(selectedVendor.id);
            if (!vOrders.length) return null;
            return (<div style={{ marginTop: 16 }}>
              <h4 style={{ fontWeight: 600, fontSize: 14, marginBottom: 8 }}>📦 Purchase Orders ({vOrders.length})</h4>
              {vOrders.slice(0, 5).map(po => (
                <div key={po.id} className="flex between" style={{ background: '#F4F6FA', borderRadius: 8, padding: '8px 12px', marginBottom: 6 }}>
                  <div><b style={{ fontSize: 12.5 }}>{po.po_number}</b><div className="muted" style={{ fontSize: 11 }}>{new Date(po.order_date).toLocaleDateString('en-IN')}</div></div>
                  <div className="flex items-center gap-8">
                    <b style={{ fontSize: 13 }}>₹{Number(po.grand_total).toLocaleString()}</b>
                    <span className={`tag ${po.status === 'received' ? 'green' : po.status === 'cancelled' ? 'red' : po.status === 'approved' ? 'blue' : 'amber'}`} style={{ fontSize: 10 }}>{po.status}</span>
                  </div>
                </div>
              ))}
            </div>);
          })()}

          {(() => {
            const vBills = getVendorBills(selectedVendor.id);
            if (!vBills.length) return null;
            return (<div style={{ marginTop: 16 }}>
              <h4 style={{ fontWeight: 600, fontSize: 14, marginBottom: 8 }}>📄 Bills ({vBills.length})</h4>
              {vBills.slice(0, 5).map(bill => (
                <div key={bill.id} className="flex between" style={{ background: '#F4F6FA', borderRadius: 8, padding: '8px 12px', marginBottom: 6 }}>
                  <div><b style={{ fontSize: 12.5 }}>{bill.bill_number}</b><div className="muted" style={{ fontSize: 11 }}>{new Date(bill.bill_date).toLocaleDateString('en-IN')}</div></div>
                  <div className="flex items-center gap-8">
                    <b style={{ fontSize: 13 }}>₹{Number(bill.total_amount).toLocaleString()}</b>
                    <span className={`tag ${bill.status === 'paid' ? 'green' : bill.status === 'partial' ? 'amber' : 'red'}`} style={{ fontSize: 10 }}>{bill.status}</span>
                  </div>
                </div>
              ))}
            </div>);
          })()}
        </div>
      </div>}

      {showForm && <div className="modal-overlay" onClick={() => setShowForm(false)}>
        <div className="card" style={{ maxWidth: 560, margin: '5vh auto', padding: 24 }} onClick={e => e.stopPropagation()}>
          <div className="flex between"><h3>{editing ? 'Edit Vendor' : 'Add Vendor'}</h3><span className="muted" style={{ cursor: 'pointer', fontSize: 18 }} onClick={() => setShowForm(false)}>✕</span></div>
          <form onSubmit={handleSubmit}>
            <div className="grid mt-16" style={{ gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div style={{ gridColumn: '1 / -1' }}><label style={{ fontSize: 12.5, fontWeight: 600, display: 'block', marginBottom: 6 }}>Vendor Name *</label><input required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} style={{ width: '100%', padding: '9px 12px', border: '1px solid var(--line)', borderRadius: 8, fontSize: 13, background: '#F5F6FA' }} /></div>
              <div><label style={{ fontSize: 12.5, fontWeight: 600, display: 'block', marginBottom: 6 }}>Company</label><input value={formData.company} onChange={e => setFormData({ ...formData, company: e.target.value })} style={{ width: '100%', padding: '9px 12px', border: '1px solid var(--line)', borderRadius: 8, fontSize: 13, background: '#F5F6FA' }} /></div>
              <div><label style={{ fontSize: 12.5, fontWeight: 600, display: 'block', marginBottom: 6 }}>Email</label><input type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} style={{ width: '100%', padding: '9px 12px', border: '1px solid var(--line)', borderRadius: 8, fontSize: 13, background: '#F5F6FA' }} /></div>
              <div><label style={{ fontSize: 12.5, fontWeight: 600, display: 'block', marginBottom: 6 }}>Phone</label><input value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} style={{ width: '100%', padding: '9px 12px', border: '1px solid var(--line)', borderRadius: 8, fontSize: 13, background: '#F5F6FA' }} /></div>
              <div><label style={{ fontSize: 12.5, fontWeight: 600, display: 'block', marginBottom: 6 }}>GST No</label><input value={formData.gst_no} onChange={e => setFormData({ ...formData, gst_no: e.target.value })} style={{ width: '100%', padding: '9px 12px', border: '1px solid var(--line)', borderRadius: 8, fontSize: 13, background: '#F5F6FA' }} /></div>
              <div><label style={{ fontSize: 12.5, fontWeight: 600, display: 'block', marginBottom: 6 }}>City</label><input value={formData.city} onChange={e => setFormData({ ...formData, city: e.target.value })} style={{ width: '100%', padding: '9px 12px', border: '1px solid var(--line)', borderRadius: 8, fontSize: 13, background: '#F5F6FA' }} /></div>
              <div><label style={{ fontSize: 12.5, fontWeight: 600, display: 'block', marginBottom: 6 }}>State</label><input value={formData.state} onChange={e => setFormData({ ...formData, state: e.target.value })} style={{ width: '100%', padding: '9px 12px', border: '1px solid var(--line)', borderRadius: 8, fontSize: 13, background: '#F5F6FA' }} /></div>
              <div><label style={{ fontSize: 12.5, fontWeight: 600, display: 'block', marginBottom: 6 }}>Country</label><input value={formData.country} onChange={e => setFormData({ ...formData, country: e.target.value })} style={{ width: '100%', padding: '9px 12px', border: '1px solid var(--line)', borderRadius: 8, fontSize: 13, background: '#F5F6FA' }} /></div>
              <div><label style={{ fontSize: 12.5, fontWeight: 600, display: 'block', marginBottom: 6 }}>Pincode</label><input value={formData.pincode} onChange={e => setFormData({ ...formData, pincode: e.target.value })} style={{ width: '100%', padding: '9px 12px', border: '1px solid var(--line)', borderRadius: 8, fontSize: 13, background: '#F5F6FA' }} /></div>
              <div><label style={{ fontSize: 12.5, fontWeight: 600, display: 'block', marginBottom: 6 }}>Website</label><input value={formData.website} onChange={e => setFormData({ ...formData, website: e.target.value })} style={{ width: '100%', padding: '9px 12px', border: '1px solid var(--line)', borderRadius: 8, fontSize: 13, background: '#F5F6FA' }} /></div>
              <div><label style={{ fontSize: 12.5, fontWeight: 600, display: 'block', marginBottom: 6 }}>Status</label>
                <select value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })} style={{ width: '100%', padding: '9px 12px', border: '1px solid var(--line)', borderRadius: 8, fontSize: 13, background: '#F5F6FA' }}>
                  <option value="active">Active</option><option value="inactive">Inactive</option>
                </select>
              </div>
              <div><label style={{ fontSize: 12.5, fontWeight: 600, display: 'block', marginBottom: 6 }}>Rating</label>
                <select value={formData.rating} onChange={e => setFormData({ ...formData, rating: e.target.value })} style={{ width: '100%', padding: '9px 12px', border: '1px solid var(--line)', borderRadius: 8, fontSize: 13, background: '#F5F6FA' }}>
                  {[1, 2, 3, 4, 5].map(r => <option key={r} value={r}>{'★'.repeat(r)}{'☆'.repeat(5 - r)}</option>)}
                </select>
              </div>
              <div style={{ gridColumn: '1 / -1' }}><label style={{ fontSize: 12.5, fontWeight: 600, display: 'block', marginBottom: 6 }}>Address</label><textarea rows={2} value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} style={{ width: '100%', padding: '9px 12px', border: '1px solid var(--line)', borderRadius: 8, fontSize: 13, background: '#F5F6FA', resize: 'vertical' }} /></div>
            </div>
            <div className="flex gap-8" style={{ marginTop: 20, justifyContent: 'flex-end' }}>
              <button type="button" className="btn btn-sm" onClick={() => setShowForm(false)}>Cancel</button>
              <button type="submit" className="btn-primary btn btn-sm">{editing ? 'Update' : 'Create'} Vendor</button>
            </div>
          </form>
        </div>
      </div>}
    </div>
  );
}

function InfoBlock({ label, value }) {
  return (
    <div style={{ background: '#F4F6FA', borderRadius: 8, padding: '8px 10px' }}>
      <div className="muted" style={{ fontSize: 10.5 }}>{label}</div>
      <div style={{ fontSize: 12.5, fontWeight: 600, marginTop: 1 }}>{value}</div>
    </div>
  );
}

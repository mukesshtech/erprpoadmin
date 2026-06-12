import { useState, useEffect } from 'react';
import api from '../../services/api';

const STATUSES = ['all', 'paid', 'partial', 'pending', 'overdue', 'cancelled'];

export default function VendorBillPage() {
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [selectedBill, setSelectedBill] = useState(null);
  const [paymentModal, setPaymentModal] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [msg, setMsg] = useState('');

  const showMsg = (t, type) => { setMsg(type === 'error' ? 'Error' : t); setTimeout(() => setMsg(''), 3000); };

  useEffect(() => { fetchBills(); }, [page, statusFilter]);

  const fetchBills = async () => {
    setLoading(true);
    try {
      const params = { per_page: 15, page };
      if (statusFilter !== 'all') params.filters = JSON.stringify({ status: statusFilter });
      const res = await api.get('/vendor-bills', { params });
      setBills(res.data.data || []);
      setLastPage(res.data.last_page || 1);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const handleSearch = () => {
    if (!search.trim()) { fetchBills(); return; }
    setLoading(true);
    api.get('/vendor-bills', { params: { per_page: 15, search } }).then(res => {
      setBills(res.data.data || []); setLastPage(res.data.last_page || 1); setLoading(false);
    }).catch(() => setLoading(false));
  };

  const handleMarkPaid = async () => {
    if (!paymentAmount || Number(paymentAmount) <= 0) return;
    setActionLoading(true);
    try {
      await api.post(`/vendor-bills/${paymentModal.id}/mark-paid`, { amount: Number(paymentAmount) });
      setPaymentModal(null);
      setPaymentAmount('');
      showMsg('Payment recorded');
      fetchBills();
    } catch (e) { showMsg('Error', 'error'); }
    setActionLoading(false);
  };

  const totalAmount = bills.reduce((s, b) => s + Number(b.total_amount), 0);
  const totalPaid = bills.filter(b => b.status === 'paid').reduce((s, b) => s + Number(b.total_amount), 0);
  const totalDue = bills.reduce((s, b) => s + Number(b.due_amount || b.total_amount - b.paid_amount || 0), 0);

  return (
    <div className="page">
      {msg && <div style={{ position: 'fixed', top: 80, right: 24, zIndex: 9999, background: msg === 'Error' ? 'var(--red)' : 'var(--green)', color: '#fff', padding: '10px 20px', borderRadius: 8, fontSize: 13, fontWeight: 600 }}>{msg}</div>}

      <div className="page-head">
        <div><h1>Vendor Bills</h1><div className="breadcrumb"><span>Purchase</span><span>/</span><span className="c">Bills</span></div></div>
        <div className="head-actions">
          <button className="btn btn-sm" onClick={() => fetchBills()}>⟳ Refresh</button>
        </div>
      </div>

      <div className="grid" style={{ gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 16 }}>
        <div className="stat"><span className="muted" style={{ fontSize: 12 }}>Total Bills</span><b style={{ fontSize: 22 }}>{bills.length}</b></div>
        <div className="stat"><span className="muted" style={{ fontSize: 12 }}>Total Amount</span><b style={{ fontSize: 22 }}>₹{totalAmount.toLocaleString()}</b></div>
        <div className="stat"><span className="muted" style={{ fontSize: 12 }}>Paid</span><b style={{ fontSize: 22 }}>₹{totalPaid.toLocaleString()}</b></div>
        <div className="stat"><span className="muted" style={{ fontSize: 12 }}>Outstanding</span><b style={{ fontSize: 22 }}>₹{totalDue.toLocaleString()}</b></div>
      </div>

      <div className="card">
        <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--line)', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div className="search" style={{ width: 200 }}>
            <input type="text" placeholder="Search bills..." value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSearch()} />
          </div>
          <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }} style={{ padding: '7px 10px', border: '1px solid var(--line)', borderRadius: 8, fontSize: 12.5, background: '#F5F6FA' }}>
            {STATUSES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
          </select>
        </div>

        <table className="tbl">
          <thead><tr><th>Bill #</th><th>Vendor</th><th>PO #</th><th>Date</th><th>Due Date</th><th style={{ textAlign: 'right' }}>Amount</th><th style={{ textAlign: 'right' }}>Paid</th><th style={{ textAlign: 'right' }}>Due</th><th style={{ textAlign: 'center' }}>Status</th><th style={{ textAlign: 'center' }}>Actions</th></tr></thead>
          <tbody>
            {loading ? Array.from({ length: 5 }).map((_, i) => (
              <tr key={i}>{Array.from({ length: 10 }).map((_, j) => <td key={j} className="muted text-c" style={{ padding: 12 }}>...</td>)}</tr>
            )) : bills.length === 0 ? (
              <tr><td colSpan="10" className="muted text-c" style={{ padding: 32 }}>No vendor bills found</td></tr>
            ) : bills.map(bill => (
              <tr key={bill.id}>
                <td style={{ fontWeight: 600, color: 'var(--ink)' }}>{bill.bill_number}</td>
                <td>
                  <div className="flex items-center gap-8">
                    <span style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--primary)', color: '#fff', fontSize: 11, fontWeight: 700, display: 'grid', placeItems: 'center' }}>
                      {bill.vendor?.name?.charAt(0) || '?'}
                    </span>
                    {bill.vendor?.name || 'N/A'}
                  </div>
                </td>
                <td className="muted" style={{ fontSize: 11.5, fontFamily: 'monospace' }}>{bill.purchase_order?.po_number || 'N/A'}</td>
                <td style={{ fontSize: 12.5 }}>{new Date(bill.bill_date).toLocaleDateString('en-IN')}</td>
                <td style={{ fontSize: 12.5 }}>{new Date(bill.due_date).toLocaleDateString('en-IN')}</td>
                <td style={{ textAlign: 'right', fontWeight: 600 }}>₹{Number(bill.total_amount).toLocaleString()}</td>
                <td style={{ textAlign: 'right', color: 'var(--green)', fontWeight: 600 }}>₹{Number(bill.paid_amount || 0).toLocaleString()}</td>
                <td style={{ textAlign: 'right' }}><span style={{ fontWeight: 600, color: bill.status === 'overdue' ? 'var(--red)' : '#D97706' }}>₹{Number(bill.due_amount || 0).toLocaleString()}</span></td>
                <td style={{ textAlign: 'center' }}>
                  <span className={`tag ${bill.status === 'paid' ? 'green' : bill.status === 'overdue' ? 'red' : bill.status === 'partial' ? 'amber' : ''}`}>{bill.status}</span>
                </td>
                <td style={{ textAlign: 'center' }}>
                  <div className="flex" style={{ gap: 4, justifyContent: 'center' }}>
                    <span className="muted" style={{ cursor: 'pointer' }} onClick={() => setSelectedBill(bill)}>👁</span>
                    {bill.status !== 'paid' && (
                      <span style={{ cursor: 'pointer', color: 'var(--green)', fontWeight: 600, fontSize: 12 }} onClick={() => { setPaymentModal(bill); setPaymentAmount(bill.due_amount || ''); }}>💰 Pay</span>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="flex between" style={{ padding: '12px 16px', borderTop: '1px solid var(--line)', background: '#FAFBFD', fontSize: 12 }}>
          <span className="muted">Page {page} of {lastPage}</span>
          <div className="flex gap-8">
            <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="btn btn-xs">‹ Prev</button>
            <span style={{ fontWeight: 600, fontSize: 12, color: 'var(--ink)' }}>{page} / {lastPage}</span>
            <button disabled={page >= lastPage} onClick={() => setPage(p => p + 1)} className="btn btn-xs">Next ›</button>
          </div>
        </div>
      </div>

      {selectedBill && <div className="modal-overlay" onClick={() => setSelectedBill(null)}>
        <div className="card" style={{ maxWidth: 560, margin: '5vh auto', padding: 24 }} onClick={e => e.stopPropagation()}>
          <div className="flex between"><h3>{selectedBill.bill_number}</h3><span className="muted" style={{ cursor: 'pointer', fontSize: 18 }} onClick={() => setSelectedBill(null)}>✕</span></div>
          <div className="grid mt-16" style={{ gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div style={{ background: '#F4F6FA', borderRadius: 8, padding: 12 }}>
              <div className="muted" style={{ fontSize: 10.5, textTransform: 'uppercase', letterSpacing: .5 }}>Vendor</div>
              <div style={{ fontWeight: 600, fontSize: 13 }}>{selectedBill.vendor?.name || 'N/A'}</div>
              {selectedBill.vendor?.company && <div className="muted" style={{ fontSize: 12 }}>{selectedBill.vendor.company}</div>}
            </div>
            <div style={{ background: '#F4F6FA', borderRadius: 8, padding: 12 }}>
              <div className="muted" style={{ fontSize: 10.5, textTransform: 'uppercase', letterSpacing: .5 }}>Purchase Order</div>
              <div style={{ fontWeight: 600, fontSize: 13 }}>{selectedBill.purchase_order?.po_number || 'N/A'}</div>
            </div>
            <div style={{ background: '#F4F6FA', borderRadius: 8, padding: 12 }}>
              <div className="muted" style={{ fontSize: 10.5, textTransform: 'uppercase', letterSpacing: .5 }}>Bill Date</div>
              <div style={{ fontWeight: 600, fontSize: 13 }}>{new Date(selectedBill.bill_date).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
            </div>
            <div style={{ background: '#F4F6FA', borderRadius: 8, padding: 12 }}>
              <div className="muted" style={{ fontSize: 10.5, textTransform: 'uppercase', letterSpacing: .5 }}>Due Date</div>
              <div style={{ fontWeight: 600, fontSize: 13, color: new Date(selectedBill.due_date) < new Date() && selectedBill.status !== 'paid' ? 'var(--red)' : 'var(--ink)' }}>
                {new Date(selectedBill.due_date).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}
              </div>
            </div>
          </div>
          <div style={{ marginTop: 16 }}>
            <div className="flex between" style={{ padding: '8px 0', fontSize: 14, borderBottom: '1px solid var(--line)' }}><b>Total Amount</b><b>₹{Number(selectedBill.total_amount).toLocaleString()}</b></div>
            <div className="flex between" style={{ padding: '6px 0', fontSize: 13 }}><span className="muted">Paid</span><b style={{ color: 'var(--green)' }}>₹{Number(selectedBill.paid_amount || 0).toLocaleString()}</b></div>
            <div className="flex between" style={{ padding: '6px 0', fontSize: 13 }}><span className="muted">Due</span><b style={{ color: selectedBill.status !== 'paid' ? '#D97706' : 'var(--green)' }}>₹{Number(selectedBill.due_amount || 0).toLocaleString()}</b></div>
          </div>
          {selectedBill.payments?.length > 0 && <div style={{ marginTop: 16 }}>
            <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 8 }}>Payment History</div>
            {selectedBill.payments.map(p => (
              <div key={p.id} style={{ background: '#F0FDF4', borderRadius: 8, padding: '8px 12px', marginBottom: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div><b style={{ fontSize: 13 }}>₹{Number(p.amount).toLocaleString()}</b><div className="muted" style={{ fontSize: 11 }}>{p.payment_method} {p.reference_number && `| Ref: ${p.reference_number}`}</div></div>
                <span className="muted" style={{ fontSize: 11.5 }}>{new Date(p.payment_date).toLocaleDateString('en-IN')}</span>
              </div>
            ))}
          </div>}
          {selectedBill.notes && <div style={{ background: '#F4F6FA', borderRadius: 8, padding: 12, marginTop: 12, fontSize: 13 }}><span className="muted">Notes: </span>{selectedBill.notes}</div>}
        </div>
      </div>}

      {paymentModal && <div className="modal-overlay" onClick={() => setPaymentModal(null)}>
        <div className="card" style={{ maxWidth: 400, margin: '20vh auto', padding: 24 }} onClick={e => e.stopPropagation()}>
          <div className="flex between"><h3>Record Payment</h3><span className="muted" style={{ cursor: 'pointer', fontSize: 18 }} onClick={() => setPaymentModal(null)}>✕</span></div>
          <p className="muted" style={{ fontSize: 12.5, margin: '8px 0 16px' }}>{paymentModal.bill_number} — Due: ₹{Number(paymentModal.due_amount || 0).toLocaleString()}</p>
          <label style={{ fontSize: 12.5, fontWeight: 600, display: 'block', marginBottom: 6 }}>Payment Amount</label>
          <input type="number" value={paymentAmount} onChange={e => setPaymentAmount(e.target.value)} placeholder="Enter amount" min="0" step="0.01" max={paymentModal.due_amount}
            style={{ width: '100%', padding: '9px 12px', border: '1px solid var(--line)', borderRadius: 8, fontSize: 13, background: '#F5F6FA', marginBottom: 16 }} />
          <div className="flex gap-8" style={{ justifyContent: 'flex-end' }}>
            <button className="btn btn-sm" onClick={() => setPaymentModal(null)}>Cancel</button>
            <button className="btn-primary btn btn-sm" onClick={handleMarkPaid} disabled={actionLoading || !paymentAmount || Number(paymentAmount) <= 0}>
              {actionLoading ? <span className="spinner" /> : '✓ Record Payment'}
            </button>
          </div>
        </div>
      </div>}
    </div>
  );
}

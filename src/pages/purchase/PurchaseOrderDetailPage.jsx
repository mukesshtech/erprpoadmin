import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';

export default function PurchaseOrderDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [po, setPO] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [msg, setMsg] = useState('');

  const showMsg = (t, type) => { setMsg(type === 'error' ? 'Error' : t); setTimeout(() => setMsg(''), 3000); };

  useEffect(() => { fetchPO(); }, [id]);
  const fetchPO = async () => {
    try {
      const res = await api.get(`/purchase-orders/${id}`);
      setPO(res.data);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const handleAction = async (action) => {
    if (!confirm(`Are you sure you want to ${action} this purchase order?`)) return;
    setActionLoading(true);
    try {
      const res = await api.post(`/purchase-orders/${id}/${action}`);
      setPO(res.data);
      showMsg(`${action} successful`);
    } catch (e) { showMsg('Error', 'error'); }
    setActionLoading(false);
  };

  if (loading) return <div className="page"><div className="text-c" style={{ padding: '60px 0' }}><div className="spinner" /></div></div>;
  if (!po) return <div className="page"><div className="muted text-c" style={{ padding: '60px 0' }}>Purchase order not found</div></div>;

  return (
    <div className="page">
      {msg && <div style={{ position: 'fixed', top: 80, right: 24, zIndex: 9999, background: msg === 'Error' ? 'var(--red)' : 'var(--green)', color: '#fff', padding: '10px 20px', borderRadius: 8, fontSize: 13, fontWeight: 600 }}>{msg}</div>}

      <div className="page-head">
        <div>
          <span className="muted" style={{ cursor: 'pointer', fontSize: 13 }} onClick={() => navigate('/purchase/orders')}>← Back to POs</span>
          <h1 style={{ marginTop: 4 }}>{po.po_number}</h1>
          <div className="breadcrumb"><span>Purchase</span><span>/</span><span className="c">Orders</span></div>
        </div>
        <div className="head-actions">
          <span className={`tag ${po.status === 'received' ? 'green' : po.status === 'cancelled' ? 'red' : po.status === 'approved' ? 'blue' : 'amber'}`} style={{ fontSize: 11, marginRight: 8 }}>{po.status?.toUpperCase()}</span>
          {po.status === 'pending' && <button className="btn-primary btn btn-sm" onClick={() => handleAction('approve')} disabled={actionLoading}>{actionLoading ? <span className="spinner" /> : '✓ Approve'}</button>}
          {po.status === 'approved' && <button className="btn-primary btn btn-sm" onClick={() => handleAction('receive')} disabled={actionLoading}>{actionLoading ? <span className="spinner" /> : '📦 Receive'}</button>}
          {(po.status === 'pending' || po.status === 'approved') && <button className="btn btn-sm" onClick={() => handleAction('cancel')} disabled={actionLoading} style={{ color: 'var(--red)' }}>{actionLoading ? <span className="spinner" /> : '✕ Cancel'}</button>}
        </div>
      </div>

      <div className="grid" style={{ gridTemplateColumns: '2fr 1fr', gap: 16 }}>
        <div>
          <div className="card">
            <div className="card__head"><h3>PO Information</h3></div>
            <div className="card__body">
              <div className="grid" style={{ gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>
                <InfoItem label="📅 Order Date" value={new Date(po.order_date).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })} />
                <InfoItem label="📅 Expected Delivery" value={po.expected_delivery ? new Date(po.expected_delivery).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' }) : 'Not set'} />
                <InfoItem label="💰 Grand Total" value={`₹${Number(po.grand_total).toLocaleString()}`} />
                <InfoItem label="📝 Notes" value={po.notes || 'No notes'} />
              </div>
            </div>
          </div>

          <div className="card mt-16">
            <div className="card__head"><h3>Order Items</h3></div>
            <table className="tbl">
              <thead><tr><th>#</th><th>Product</th><th style={{ textAlign: 'right' }}>Rate</th><th style={{ textAlign: 'right' }}>Qty</th><th style={{ textAlign: 'right' }}>Amount</th></tr></thead>
              <tbody>
                {po.items?.map((item, i) => (
                  <tr key={item.id}>
                    <td className="muted">{i + 1}</td>
                    <td><b>{item.product?.name || 'N/A'}</b><span className="muted block" style={{ fontSize: 11 }}>SKU: {item.product?.sku}</span></td>
                    <td style={{ textAlign: 'right' }}>₹{Number(item.rate).toLocaleString()}</td>
                    <td style={{ textAlign: 'right' }}>{item.quantity}</td>
                    <td style={{ textAlign: 'right', fontWeight: 600 }}>₹{Number(item.amount).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr><td colSpan="4" style={{ textAlign: 'right', padding: '8px 12px', fontWeight: 600 }}>Subtotal</td><td style={{ textAlign: 'right', padding: '8px 12px', fontWeight: 600 }}>₹{Number(po.subtotal).toLocaleString()}</td></tr>
                {Number(po.discount) > 0 && <tr><td colSpan="4" style={{ textAlign: 'right', padding: '8px 12px' }}>Discount</td><td style={{ textAlign: 'right', padding: '8px 12px', color: 'var(--red)' }}>-₹{Number(po.discount).toLocaleString()}</td></tr>}
                {Number(po.tax) > 0 && <tr><td colSpan="4" style={{ textAlign: 'right', padding: '8px 12px' }}>Tax</td><td style={{ textAlign: 'right', padding: '8px 12px' }}>₹{Number(po.tax).toLocaleString()}</td></tr>}
                <tr><td colSpan="4" style={{ textAlign: 'right', padding: '10px 12px', fontWeight: 700, fontSize: 14 }}>Grand Total</td><td style={{ textAlign: 'right', padding: '10px 12px', fontWeight: 700, fontSize: 14 }}>₹{Number(po.grand_total).toLocaleString()}</td></tr>
              </tfoot>
            </table>
          </div>

          {po.goodsReceived?.length > 0 && (
            <div className="card mt-16">
              <div className="card__head"><h3>📦 Goods Received</h3></div>
              <div className="card__body">
                {po.goodsReceived.map(gr => (
                  <div key={gr.id} style={{ background: '#F0FDF4', borderRadius: 8, padding: 12, marginBottom: 8 }}>
                    <div className="flex between" style={{ marginBottom: 6 }}>
                      <b style={{ fontSize: 13 }}>{gr.gr_number}</b>
                      <span className="muted" style={{ fontSize: 12 }}>{new Date(gr.received_date).toLocaleDateString('en-IN')}</span>
                    </div>
                    {gr.items?.map(item => (
                      <div key={item.id} className="flex between" style={{ fontSize: 12.5 }}>
                        <span>{item.product?.name || 'N/A'}</span>
                        <span className="muted">Qty: {item.quantity_received}/{item.quantity_ordered}</span>
                      </div>
                    ))}
                    {gr.notes && <div className="muted" style={{ fontSize: 11, marginTop: 4 }}>{gr.notes}</div>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div>
          <div className="card">
            <div className="card__head"><h3>Vendor</h3></div>
            <div className="card__body">
              {po.vendor ? (
                <div>
                  <div className="flex items-center gap-8">
                    <span style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--primary)', color: '#fff', fontWeight: 700, fontSize: 14, display: 'grid', placeItems: 'center' }}>
                      {po.vendor.name?.charAt(0)}
                    </span>
                    <div><b style={{ fontSize: 13 }}>{po.vendor.name}</b><div className="muted" style={{ fontSize: 11 }}>{po.vendor.company || 'Individual'}</div></div>
                  </div>
                  <div style={{ marginTop: 12, fontSize: 12.5, lineHeight: 1.8 }}>
                    {po.vendor.email && <div>✉ {po.vendor.email}</div>}
                    {po.vendor.phone && <div>📞 {po.vendor.phone}</div>}
                    {po.vendor.city && <div>📍 {po.vendor.city}, {po.vendor.state}</div>}
                    {po.vendor.gst_no && <div>🔖 GST: {po.vendor.gst_no}</div>}
                  </div>
                </div>
              ) : <p className="muted">No vendor info</p>}
            </div>
          </div>

          <div className="card mt-16">
            <div className="card__head"><h3>Timeline</h3></div>
            <div className="card__body">
              <TimelineItem label="📝 PO Created" time={po.created_at} active />
              {po.status === 'approved' && <TimelineItem label="✓ Approved" time={po.updated_at} active />}
              {po.status === 'received' && <TimelineItem label="📦 Goods Received" time={po.updated_at} active />}
              {po.status !== 'cancelled' && po.status !== 'received' && (
                <TimelineItem label={po.status === 'pending' ? '⏳ Awaiting Approval' : '⏳ Awaiting Delivery'} time={null} active={false} />
              )}
              {po.status === 'cancelled' && <TimelineItem label="✕ Cancelled" time={po.updated_at} alert />}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoItem({ label, value }) {
  return (
    <div style={{ background: '#F4F6FA', borderRadius: 8, padding: 10 }}>
      <div className="muted" style={{ fontSize: 11 }}>{label}</div>
      <div style={{ fontWeight: 600, fontSize: 13, marginTop: 2 }}>{value}</div>
    </div>
  );
}

function TimelineItem({ label, time, active, alert }) {
  return (
    <div className="flex items-center gap-8" style={{ marginBottom: 8 }}>
      <span style={{
        width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
        background: alert ? 'var(--red)' : active ? 'var(--green)' : '#D1D5DB'
      }} />
      <div>
        <div style={{ fontSize: 13, fontWeight: 500, color: alert ? 'var(--red)' : active ? 'var(--ink)' : '#9CA3AF' }}>{label}</div>
        {time && <div className="muted" style={{ fontSize: 11 }}>{new Date(time).toLocaleString('en-IN')}</div>}
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';

export default function SalesOrderDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [msg, setMsg] = useState('');

  const showMsg = (t, type) => { setMsg(type === 'error' ? 'Error' : t); setTimeout(() => setMsg(''), 3000); };

  useEffect(() => { fetchOrder(); }, [id]);
  const fetchOrder = async () => {
    try {
      const res = await api.get(`/sales-orders/${id}`);
      setOrder(res.data);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const handleAction = async (action) => {
    if (!confirm(`Are you sure you want to ${action} this order?`)) return;
    setActionLoading(true);
    try {
      const res = await api.post(`/sales-orders/${id}/${action}`);
      setOrder(res.data);
      showMsg(`${action} successful`);
    } catch (e) { showMsg('Error', 'error'); }
    setActionLoading(false);
  };

  if (loading) return <div className="page"><div className="text-c" style={{ padding: '60px 0' }}><div className="spinner" /></div></div>;
  if (!order) return <div className="page"><div className="muted text-c" style={{ padding: '60px 0' }}>Order not found</div></div>;

  return (
    <div className="page">
      {msg && <div style={{ position: 'fixed', top: 80, right: 24, zIndex: 9999, background: msg === 'Error' ? 'var(--red)' : 'var(--green)', color: '#fff', padding: '10px 20px', borderRadius: 8, fontSize: 13, fontWeight: 600 }}>{msg}</div>}

      <div className="page-head">
        <div>
          <span className="muted" style={{ cursor: 'pointer', fontSize: 13 }} onClick={() => navigate('/sales/orders')}>← Back to Orders</span>
          <h1 style={{ marginTop: 4 }}>{order.order_number}</h1>
          <div className="breadcrumb"><span>Sales</span><span>/</span><span className="c">Orders</span></div>
        </div>
        <div className="head-actions">
          <span className={`tag ${order.status === 'delivered' ? 'green' : order.status === 'cancelled' ? 'red' : order.status === 'shipped' ? 'blue' : 'amber'}`} style={{ fontSize: 11, marginRight: 8 }}>{order.status?.toUpperCase()}</span>
          {order.status === 'pending' && <button className="btn-primary btn btn-sm" onClick={() => handleAction('approve')} disabled={actionLoading}>{actionLoading ? <span className="spinner" /> : '✓ Approve'}</button>}
          {order.status === 'approved' && <button className="btn-primary btn btn-sm" onClick={() => handleAction('ship')} disabled={actionLoading}>{actionLoading ? <span className="spinner" /> : '🚚 Ship'}</button>}
          {order.status === 'shipped' && <button className="btn-primary btn btn-sm" onClick={() => handleAction('deliver')} disabled={actionLoading}>{actionLoading ? <span className="spinner" /> : '✓ Deliver'}</button>}
          {(order.status === 'pending' || order.status === 'approved') && <button className="btn btn-sm" onClick={() => handleAction('cancel')} disabled={actionLoading} style={{ color: 'var(--red)' }}>{actionLoading ? <span className="spinner" /> : '✕ Cancel'}</button>}
        </div>
      </div>

      <div className="grid" style={{ gridTemplateColumns: '2fr 1fr', gap: 16 }}>
        <div>
          <div className="card">
            <div className="card__head"><h3>Order Information</h3></div>
            <div className="card__body">
              <div className="grid" style={{ gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>
                <InfoItem label="📅 Order Date" value={new Date(order.order_date).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })} />
                <InfoItem label="# Delivery Status" value={order.delivery_status || 'Not set'} />
                <InfoItem label="💰 Grand Total" value={`₹${Number(order.grand_total).toLocaleString()}`} />
                <InfoItem label="📝 Notes" value={order.notes || 'No notes'} />
              </div>
            </div>
          </div>

          <div className="card mt-16">
            <div className="card__head"><h3>Order Items</h3></div>
            <table className="tbl">
              <thead><tr><th>#</th><th>Product</th><th style={{ textAlign: 'right' }}>Rate</th><th style={{ textAlign: 'right' }}>Qty</th><th style={{ textAlign: 'right' }}>Amount</th></tr></thead>
              <tbody>
                {order.items?.map((item, i) => (
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
                <tr><td colSpan="4" style={{ textAlign: 'right', padding: '8px 12px', fontWeight: 600 }}>Subtotal</td><td style={{ textAlign: 'right', padding: '8px 12px', fontWeight: 600 }}>₹{Number(order.subtotal).toLocaleString()}</td></tr>
                {Number(order.discount) > 0 && <tr><td colSpan="4" style={{ textAlign: 'right', padding: '8px 12px' }}>Discount</td><td style={{ textAlign: 'right', padding: '8px 12px', color: 'var(--red)' }}>-₹{Number(order.discount).toLocaleString()}</td></tr>}
                {Number(order.tax) > 0 && <tr><td colSpan="4" style={{ textAlign: 'right', padding: '8px 12px' }}>Tax</td><td style={{ textAlign: 'right', padding: '8px 12px' }}>₹{Number(order.tax).toLocaleString()}</td></tr>}
                <tr><td colSpan="4" style={{ textAlign: 'right', padding: '10px 12px', fontWeight: 700, fontSize: 14 }}>Grand Total</td><td style={{ textAlign: 'right', padding: '10px 12px', fontWeight: 700, fontSize: 14 }}>₹{Number(order.grand_total).toLocaleString()}</td></tr>
              </tfoot>
            </table>
          </div>
        </div>

        <div>
          <div className="card">
            <div className="card__head"><h3>Customer</h3></div>
            <div className="card__body">
              {order.customer ? (
                <div>
                  <div className="flex items-center gap-8">
                    <span style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--primary)', color: '#fff', fontWeight: 700, fontSize: 14, display: 'grid', placeItems: 'center' }}>
                      {order.customer.name?.charAt(0)}
                    </span>
                    <div><b style={{ fontSize: 13 }}>{order.customer.name}</b><div className="muted" style={{ fontSize: 11 }}>{order.customer.company || 'Individual'}</div></div>
                  </div>
                  <div style={{ marginTop: 12, fontSize: 12.5, lineHeight: 1.8 }}>
                    {order.customer.email && <div>✉ {order.customer.email}</div>}
                    {order.customer.phone && <div>📞 {order.customer.phone}</div>}
                    {order.customer.city && <div>📍 {order.customer.city}, {order.customer.state}</div>}
                  </div>
                </div>
              ) : <p className="muted">No customer info</p>}
            </div>
          </div>

          <div className="card mt-16">
            <div className="card__head"><h3>Linked Invoices</h3></div>
            <div className="card__body">
              {order.invoices?.length > 0 ? order.invoices.map(inv => (
                <div key={inv.id} className="flex between" style={{ background: '#F4F6FA', borderRadius: 8, padding: '8px 12px', marginBottom: 6 }}>
                  <div><b style={{ fontSize: 12.5 }}>{inv.invoice_number}</b><div className="muted" style={{ fontSize: 11 }}>₹{Number(inv.grand_total).toLocaleString()}</div></div>
                  <span className={`tag ${inv.status === 'paid' ? 'green' : inv.status === 'partial' ? 'amber' : 'red'}`} style={{ fontSize: 10 }}>{inv.status}</span>
                </div>
              )) : <p className="muted">No invoices linked</p>}
            </div>
          </div>

          <div className="card mt-16">
            <div className="card__head"><h3>Timeline</h3></div>
            <div className="card__body">
              <TimelineItem label="📝 Order Created" time={order.created_at} active />
              {order.status === 'approved' && <TimelineItem label="✓ Approved" time={order.updated_at} active />}
              {order.delivery_status === 'shipped' && <TimelineItem label="🚚 Shipped" time={order.updated_at} active />}
              {order.delivery_status === 'delivered' && <TimelineItem label="✓ Delivered" time={order.updated_at} active />}
              {order.status !== 'cancelled' && order.delivery_status !== 'delivered' && (
                <TimelineItem label={order.status === 'pending' ? '⏳ Awaiting Approval' : '⏳ In Progress'} time={null} active={false} />
              )}
              {order.status === 'cancelled' && <TimelineItem label="✕ Cancelled" time={order.updated_at} alert />}
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

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';


export default function SalesDashboardPage() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchData(); }, []);
  const fetchData = async () => {
    try {
      const [dash, ordersRes, invRes, prodRes] = await Promise.all([
        api.get('/dashboard/sales'),
        api.get('/sales-orders?per_page=100'),
        api.get('/invoices?per_page=100'),
        api.get('/products?per_page=100'),
      ]);
      setData({ dashboard: dash.data, orders: ordersRes.data.data || [], invoices: invRes.data.data || [], products: prodRes.data.data || [] });
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  if (loading) return <div className="page"><div className="text-c" style={{ padding: '60px 0' }}><div className="spinner" style={{ width: 32, height: 32 }} /></div></div>;
  if (!data) return <div className="page"><div className="text-c muted" style={{ padding: '60px 0', fontSize: 14 }}>Failed to load data <button className="btn btn-sm" onClick={fetchData}>Retry</button></div></div>;

  const { dashboard: d, orders, invoices, products } = data;
  const pendingOrders = orders.filter(o => o.status === 'pending');
  const pendingInvoices = invoices.filter(i => i.status !== 'paid');
  const lowStockItems = products.filter(p => p.stock_quantity <= p.min_stock_level);

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>Sales Dashboard</h1>
          <div className="breadcrumb"><span>Dashboard</span><span>/</span><span className="c">Sales Dashboard</span></div>
        </div>
        <div className="head-actions">
          <button className="btn btn-sm" onClick={fetchData}>⟳ Refresh</button>
          <button className="btn-primary btn btn-sm" onClick={() => navigate('/sales/products')}>+ Add Product</button>
        </div>
      </div>

      <div className="grid" style={{ gridTemplateColumns: 'repeat(4,1fr)' }}>
        <div className="card stat" onClick={() => navigate('/sales/orders')} style={{ cursor: 'pointer' }}>
          <div className="ic" style={{ background: 'var(--purple)' }}>💰</div>
          <div><div className="v">${Number(d.total_revenue || 0).toLocaleString()}</div><div className="l">Total Revenue</div><div className="delta up">▲ Collected: ${Number(d.total_collected || 0).toLocaleString()}</div></div>
        </div>
        <div className="card stat" onClick={() => navigate('/sales/orders')} style={{ cursor: 'pointer' }}>
          <div className="ic" style={{ background: 'var(--blue)' }}>📦</div>
          <div><div className="v">{d.total_orders || 0}</div><div className="l">Total Orders</div><div className="delta down">▼ {pendingOrders.length} pending</div></div>
        </div>
        <div className="card stat" onClick={() => navigate('/sales/invoices')} style={{ cursor: 'pointer' }}>
          <div className="ic" style={{ background: 'var(--primary)' }}>🧾</div>
          <div><div className="v">{d.total_invoices || 0}</div><div className="l">Total Invoices</div><div className="delta up">▲ {pendingInvoices.length} unpaid</div></div>
        </div>
        <div className="card stat" onClick={() => navigate('/crm/customers')} style={{ cursor: 'pointer' }}>
          <div className="ic" style={{ background: 'var(--green)' }}>👥</div>
          <div><div className="v">{d.total_customers || 0}</div><div className="l">Customers</div><div className="delta up">▲ Active accounts</div></div>
        </div>
      </div>

      <div className="grid mt-16" style={{ gridTemplateColumns: '1.6fr 1fr' }}>
        <div className="card">
          <div className="card__head"><h3>Recent Sales Orders</h3><span className="pill" style={{ cursor: 'pointer' }} onClick={() => navigate('/sales/orders')}>View All →</span></div>
          <div className="card__body" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {(d.recent_orders || []).length > 0 ? d.recent_orders.map(order => (
              <div key={order.id} className="flex items-center gap-12" style={{ background: '#F8F9FC', borderRadius: 8, padding: '10px 14px', cursor: 'pointer' }} onClick={() => navigate(`/sales/orders/${order.id}`)}>
                <span className={`tag ${order.status === 'delivered' ? 'green' : order.status === 'shipped' ? 'blue' : order.status === 'cancelled' ? 'red' : 'amber'}`} style={{ textTransform: 'uppercase', fontSize: 10, letterSpacing: .5 }}>{order.status?.charAt(0) || 'P'}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--ink)' }}>{order.order_number || `SO-${order.id}`}</div>
                  <div className="muted" style={{ fontSize: 11.5 }}>{order.customer?.name || 'N/A'}</div>
                </div>
                <div className="text-c"><div className="muted" style={{ fontSize: 11 }}>Amount</div><b style={{ fontSize: 13 }}>${Number(order.grand_total).toLocaleString()}</b></div>
                <span className={`tag ${order.status === 'delivered' ? 'green' : order.status === 'shipped' ? 'blue' : order.status === 'approved' ? 'amber' : 'red'}`}>{order.status}</span>
              </div>
            )) : <div className="muted text-c" style={{ padding: 20 }}>No orders yet</div>}
          </div>
        </div>
        <div className="card">
          <div className="card__head"><h3>Revenue Status</h3><span className="pill">{new Date().getFullYear()}</span></div>
          <div className="card__body">
            {(() => {
              const paid = invoices.filter(i => i.status === 'paid').reduce((s, i) => s + Number(i.grand_total), 0);
              const pending = invoices.filter(i => i.status === 'pending' || i.status === 'partial').reduce((s, i) => s + Number(i.due_amount), 0);
              const overdue = invoices.filter(i => i.status === 'overdue').reduce((s, i) => s + Number(i.due_amount), 0);
              const total = d.total_revenue || paid + pending + overdue || 1;
              const items = [
                { label: 'Paid', value: paid, color: '#03C95A' },
                { label: 'Pending', value: pending, color: '#FFB300' },
                { label: 'Overdue', value: overdue, color: '#E70D0D' },
              ];
              return items.map(item => (
                <div key={item.label} style={{ marginBottom: 14 }}>
                  <div className="flex between" style={{ fontSize: 12.5, marginBottom: 5 }}>
                    <span className="muted">{item.label}</span>
                    <b>${item.value.toLocaleString()}</b>
                  </div>
                  <div style={{ width: '100%', background: '#EEF1F6', borderRadius: 6, height: 8, overflow: 'hidden' }}>
                    <div style={{ width: `${(item.value / total) * 100}%`, background: item.color, height: '100%', borderRadius: 6, transition: 'width .5s' }} />
                  </div>
                </div>
              ));
            })()}
            <div style={{ borderTop: '1px solid var(--line)', paddingTop: 12, marginTop: 4 }}>
              <div className="flex between" style={{ fontSize: 13 }}><span className="muted">Collected</span><b style={{ color: 'var(--green)' }}>${Number(d.total_collected || 0).toLocaleString()}</b></div>
              <div className="flex between mt-8" style={{ fontSize: 13 }}><span className="muted">Pending</span><b style={{ color: 'var(--red)' }}>${Number(d.pending_amount || 0).toLocaleString()}</b></div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid mt-16" style={{ gridTemplateColumns: '1fr 1fr' }}>
        <div className="card">
          <div className="card__head"><h3>⚠ Low Stock Alert</h3><span className="pill">{lowStockItems.length} items</span></div>
          <div className="card__body" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {lowStockItems.length > 0 ? lowStockItems.slice(0, 8).map(product => (
              <div key={product.id} className="flex items-center gap-12" style={{ background: '#FFF0F0', borderRadius: 8, padding: '8px 12px' }}>
                <span style={{ width: 28, height: 28, borderRadius: 6, background: 'var(--red-soft)', display: 'grid', placeItems: 'center', color: 'var(--red)', fontSize: 14 }}>📦</span>
                <div style={{ flex: 1 }}><div style={{ fontWeight: 600, fontSize: 12.5 }}>{product.name}</div><div className="muted" style={{ fontSize: 11 }}>SKU: {product.sku || 'N/A'}</div></div>
                <div className="text-c"><div className="muted" style={{ fontSize: 10 }}>Stock</div><b style={{ color: product.stock_quantity === 0 ? 'var(--red)' : 'var(--amber)' }}>{product.stock_quantity}</b></div>
                <span className="muted" style={{ fontSize: 11 }}>min: {product.min_stock_level}</span>
              </div>
            )) : <div className="muted text-c" style={{ padding: 20 }}>✅ All products well-stocked</div>}
          </div>
        </div>
        <div className="card">
          <div className="card__head"><h3>Recent Invoices</h3><span className="pill" style={{ cursor: 'pointer' }} onClick={() => navigate('/sales/invoices')}>View All →</span></div>
          <div className="card__body" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {(d.recent_invoices || []).length > 0 ? d.recent_invoices.map(inv => (
              <div key={inv.id} className="flex items-center gap-12" style={{ background: '#F8F9FC', borderRadius: 8, padding: '10px 14px', cursor: 'pointer' }} onClick={() => navigate('/sales/invoices')}>
                <span style={{ width: 32, height: 32, borderRadius: 8, background: '#F4F6FA', display: 'grid', placeItems: 'center' }}>🧾</span>
                <div style={{ flex: 1 }}><div style={{ fontWeight: 600, fontSize: 13, color: 'var(--ink)' }}>{inv.invoice_number}</div><div className="muted" style={{ fontSize: 11.5 }}>{inv.customer?.name || 'N/A'}</div></div>
                <div className="text-c"><div className="muted" style={{ fontSize: 11 }}>Amount</div><b style={{ fontSize: 13 }}>${Number(inv.grand_total).toLocaleString()}</b></div>
                <span className={`tag ${inv.status === 'paid' ? 'green' : inv.status === 'partial' ? 'amber' : 'red'}`}>{inv.status}</span>
              </div>
            )) : <div className="muted text-c" style={{ padding: 20 }}>No invoices yet</div>}
          </div>
        </div>
      </div>

      <div className="grid mt-16" style={{ gridTemplateColumns: 'repeat(3,1fr)' }}>
        <div className="card stat" style={{ background: '#FFFBEB', border: '1px solid #FDE68A' }}>
          <div className="ic" style={{ background: '#FFB300', color: '#fff' }}>⏳</div>
          <div><div className="l">Pending Orders</div><div className="v">{pendingOrders.length}</div><div className="delta down">▼ Awaiting approval</div></div>
        </div>
        <div className="card stat" style={{ background: '#EFF6FF', border: '1px solid #BFDBFE' }}>
          <div className="ic" style={{ background: '#3B7DDD', color: '#fff' }}>🚚</div>
          <div><div className="l">Shipped Orders</div><div className="v">{orders.filter(o => o.delivery_status === 'shipped').length}</div><div className="delta up">▲ In transit</div></div>
        </div>
        <div className="card stat" style={{ background: '#F0FDF4', border: '1px solid #BBF7D0' }}>
          <div className="ic" style={{ background: '#03C95A', color: '#fff' }}>✓</div>
          <div><div className="l">Delivered Orders</div><div className="v">{orders.filter(o => o.delivery_status === 'delivered').length}</div><div className="delta up">▲ Completed</div></div>
        </div>
      </div>
    </div>
  );
}

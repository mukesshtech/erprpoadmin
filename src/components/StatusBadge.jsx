export default function StatusBadge({ status }) {
  if (!status) return null;
  const key = String(status).toLowerCase().replace(/\s+/g, '_');
  const greenItems = ['active', 'paid', 'delivered', 'won', 'approved', 'present', 'hired', 'confirmed', 'received', 'completed'];
  const amberItems = ['pending', 'draft', 'sent', 'partial', 'in_progress', 'in_transit', 'interviewed', 'probation'];
  const redItems = ['cancelled', 'lost', 'rejected', 'absent', 'unpaid', 'overdue'];
  const blueItems = ['open', 'new', 'qualified', 'contacted', 'shortlisted', 'available', 'shipped'];
  const cls = greenItems.includes(key) ? 'green' : amberItems.includes(key) ? 'amber' : redItems.includes(key) ? 'red' : blueItems.includes(key) ? 'blue' : '';
  const label = String(status).replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  return <span className={`tag ${cls}`}>{label}</span>;
}

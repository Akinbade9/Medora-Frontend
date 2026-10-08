import { Badge, Button } from '../components/ui';
export function PrescriptionStatus({ status }) {
  return (
    <Badge
      tone={
        status === 'CANCELLED'
          ? 'danger'
          : status === 'EXPIRED'
            ? 'warning'
            : status === 'VIEWED'
              ? 'success'
              : 'info'
      }
    >
      {status}
    </Badge>
  );
}
export function Pager({ data, onPage }) {
  return (
    <nav className="doctor-pager" aria-label="Pagination">
      <Button
        variant="secondary"
        disabled={data.page <= 1}
        onClick={() => onPage(data.page - 1)}
      >
        Previous
      </Button>
      <span>
        Page {data.page} of {Math.max(1, Math.ceil(data.total / data.limit))}
      </span>
      <Button
        variant="secondary"
        disabled={data.page * data.limit >= data.total}
        onClick={() => onPage(data.page + 1)}
      >
        Next
      </Button>
    </nav>
  );
}
export const displayDate = (value) =>
  value ? new Date(value).toLocaleString() : 'Not set';
export function Heading({ title, description }) {
  return (
    <header className="doctor-heading">
      <p className="eyebrow">Doctor workspace</p>
      <h1>{title}</h1>
      {description && <p>{description}</p>}
    </header>
  );
}

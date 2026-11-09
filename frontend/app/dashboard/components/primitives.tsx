import Link from 'next/link';
import { type ButtonHTMLAttributes, type CSSProperties, type ReactNode } from 'react';
import { theme } from '../../styles/theme';

type SurfaceCardProps = {
  children: ReactNode;
  padding?: CSSProperties['padding'];
  radius?: CSSProperties['borderRadius'];
  style?: CSSProperties;
};

export function SurfaceCard({ children, padding = 20, radius = theme.spacing.borderRadius, style }: SurfaceCardProps) {
  return (
    <div
      style={{
        background: theme.colors.card,
        border: `1px solid ${theme.colors.border}`,
        borderRadius: radius,
        boxShadow: theme.shadows.soft,
        padding,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

type MetricCardProps = {
  label: string;
  value: string | number;
  note?: string;
  style?: CSSProperties;
};

export function MetricCard({ label, value, note, style }: MetricCardProps) {
  return (
    <SurfaceCard style={style}>
      <p
        style={{
          margin: 0,
          color: theme.colors.textMuted,
          fontSize: 12,
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          fontWeight: 700,
        }}
      >
        {label}
      </p>
      <p
        style={{
          margin: '10px 0 0',
          fontSize: 30,
          color: theme.colors.textPrimary,
          fontWeight: 700,
        }}
      >
        {value}
      </p>
      {note ? (
        <p
          style={{
            margin: '10px 0 0',
            color: theme.colors.textMuted,
            fontSize: 13,
          }}
        >
          {note}
        </p>
      ) : null}
    </SurfaceCard>
  );
}

type ActionLink = {
  href: string;
  label: string;
};

type ActionLinkListProps = {
  items: ActionLink[];
  withArrow?: boolean;
};

export function ActionLinkList({ items, withArrow = false }: ActionLinkListProps) {
  return (
    <div style={{ display: 'grid', gap: 10, marginTop: 12 }}>
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: withArrow ? 'space-between' : 'flex-start',
            textDecoration: 'none',
            padding: '10px 12px',
            borderRadius: 12,
            background: theme.colors.infoSoft,
            border: `1px solid ${theme.colors.border}`,
            color: theme.colors.primary,
            fontWeight: 700,
          }}
        >
          <span>{item.label}</span>
          {withArrow ? <span aria-hidden="true">→</span> : null}
        </Link>
      ))}
    </div>
  );
}

type StatusPillProps = {
  label: string;
  tone?: 'default' | 'success' | 'warning' | 'error';
};

export function StatusPill({ label, tone = 'default' }: StatusPillProps) {
  const toneStyles: Record<NonNullable<StatusPillProps['tone']>, CSSProperties> = {
    default: {
      background: theme.colors.infoSoft,
      color: theme.colors.primary,
    },
    success: {
      background: theme.colors.successSoft,
      color: '#166534',
    },
    warning: {
      background: theme.colors.warningSoft,
      color: '#92400e',
    },
    error: {
      background: theme.colors.errorSoft,
      color: '#991b1b',
    },
  };

  return (
    <span
      style={{
        display: 'inline-block',
        padding: '8px 12px',
        borderRadius: theme.spacing.borderRadiusPill,
        fontWeight: 700,
        fontSize: 12,
        ...toneStyles[tone],
      }}
    >
      {label}
    </span>
  );
}

type ActionButtonProps = {
  label: string;
  tone?: 'primary' | 'success' | 'neutral';
} & ButtonHTMLAttributes<HTMLButtonElement>;

export function ActionButton({ label, tone = 'primary', style, ...props }: ActionButtonProps) {
  const toneStyles: Record<NonNullable<ActionButtonProps['tone']>, CSSProperties> = {
    primary: {
      background: theme.colors.primary,
      color: theme.colors.white,
    },
    success: {
      background: theme.colors.success,
      color: theme.colors.white,
    },
    neutral: {
      background: theme.colors.infoSoft,
      color: theme.colors.primary,
      border: `1px solid ${theme.colors.border}`,
    },
  };

  return (
    <button
      type="button"
      {...props}
      style={{
        borderRadius: 14,
        border: 'none',
        fontWeight: 700,
        padding: '10px 18px',
        cursor: props.disabled ? 'not-allowed' : 'pointer',
        opacity: props.disabled ? 0.65 : 1,
        ...toneStyles[tone],
        ...style,
      }}
    >
      {label}
    </button>
  );
}

type DetailListItem = {
  label: string;
  value: ReactNode;
};

type DetailListProps = {
  items: DetailListItem[];
  labelColumnWidth?: CSSProperties['gridTemplateColumns'];
};

export function DetailList({ items, labelColumnWidth = '150px 1fr' }: DetailListProps) {
  return (
    <div style={{ display: 'grid', gap: 12 }}>
      {items.map((item) => (
        <div
          key={item.label}
          style={{
            display: 'grid',
            gridTemplateColumns: labelColumnWidth,
            gap: 12,
          }}
        >
          <span
            style={{
              color: theme.colors.textMuted,
              fontSize: 14,
              fontWeight: 700,
            }}
          >
            {item.label}
          </span>
          <span
            style={{
              color: theme.colors.textPrimary,
              fontSize: 15,
              lineHeight: 1.6,
            }}
          >
            {item.value}
          </span>
        </div>
      ))}
    </div>
  );
}

import { DeviceCategory } from '../device-registry';

export function DeviceSymbol({
  category,
  className = 'w-14 h-12',
}: {
  category: DeviceCategory;
  className?: string;
}) {
  const common = {
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };

  if (category === 'router') {
    return (
      <svg viewBox="0 0 64 48" className={className} aria-hidden="true">
        <ellipse cx="32" cy="24" rx="23" ry="14" {...common} />
        <path d="M18 24h28M23 17l-5 7 5 7M41 17l5 7-5 7M32 12v24M26 17l6-5 6 5M26 31l6 5 6-5" {...common} />
      </svg>
    );
  }

  if (category === 'switch') {
    return (
      <svg viewBox="0 0 64 48" className={className} aria-hidden="true">
        <rect x="8" y="13" width="48" height="22" rx="3" {...common} />
        <path d="M15 20h10m-4-4 4 4-4 4M49 28H39m4-4-4 4 4 4M29 20h10m-4-4 4 4-4 4" {...common} />
      </svg>
    );
  }

  if (category === 'access-point') {
    return (
      <svg viewBox="0 0 64 48" className={className} aria-hidden="true">
        <circle cx="32" cy="31" r="4" {...common} />
        <path d="M23 25a12 12 0 0 1 18 0M17 19a20 20 0 0 1 30 0M32 35v7" {...common} />
      </svg>
    );
  }

  if (category === 'desktop' || category === 'laptop' || category === 'generic-endpoint') {
    return (
      <svg viewBox="0 0 64 48" className={className} aria-hidden="true">
        <rect x="10" y="8" width="44" height="28" rx="2" {...common} />
        <path d="M26 42h12M32 36v6" {...common} />
      </svg>
    );
  }

  if (category === 'server' || category === 'nas' || category === 'nvr') {
    return (
      <svg viewBox="0 0 64 48" className={className} aria-hidden="true">
        <rect x="18" y="5" width="28" height="38" rx="2" {...common} />
        <path d="M23 14h18M23 24h18M23 34h18" {...common} />
        <circle cx="39" cy="10" r="1.5" fill="currentColor" />
        <circle cx="39" cy="20" r="1.5" fill="currentColor" />
        <circle cx="39" cy="30" r="1.5" fill="currentColor" />
      </svg>
    );
  }

  if (category === 'printer') {
    return (
      <svg viewBox="0 0 64 48" className={className} aria-hidden="true">
        <path d="M20 16V6h24v10M18 35h28v8H18z" {...common} />
        <rect x="10" y="16" width="44" height="20" rx="4" {...common} />
        <path d="M22 28h20" {...common} />
      </svg>
    );
  }

  if (category === 'camera') {
    return (
      <svg viewBox="0 0 64 48" className={className} aria-hidden="true">
        <path d="M12 19h32v17H12zM44 23l10-6v21l-10-6M20 36l-5 7M35 36l5 7" {...common} />
        <circle cx="28" cy="27.5" r="5" {...common} />
      </svg>
    );
  }

  if (category === 'internet') {
    return (
      <svg viewBox="0 0 64 48" className={className} aria-hidden="true">
        <path d="M18 36h31a9 9 0 0 0 1-18 15 15 0 0 0-28-4 11 11 0 0 0-4 22z" {...common} />
      </svg>
    );
  }

  if (category === 'firewall') {
    return (
      <svg viewBox="0 0 64 48" className={className} aria-hidden="true">
        <path d="M9 9h46v30H9zM9 19h46M9 29h46M20 9v10M43 9v10M31 19v10M20 29v10M43 29v10" {...common} />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 64 48" className={className} aria-hidden="true">
      <rect x="12" y="9" width="40" height="30" rx="4" {...common} />
    </svg>
  );
}

export default function ActivityIcon({
  kind,
  size = 26,
}: {
  kind: string;
  size?: number;
}) {
  const type = kind.toLowerCase();
  const shape = /gym|strength/.test(type) ? (
    <>
      <path d="M6 12h12M3 9v6m3-8v10m12-10v10m3-8v6" />
    </>
  ) : /video/.test(type) ? (
    <>
      <rect x="3" y="5" width="18" height="14" rx="3" />
      <path d="m10 9 5 3-5 3Z" />
    </>
  ) : /fitness|conditioning|test/.test(type) ? (
    <>
      <circle cx="12" cy="14" r="7" />
      <path d="M10 2h4m-2 0v5m5 1 2-2m-7 8 3-3" />
    </>
  ) : /match/.test(type) ? (
    <>
      <path d="M8 3h8v6a4 4 0 0 1-8 0ZM8 5H4v2a4 4 0 0 0 4 4m8-6h4v2a4 4 0 0 1-4 4m-4 2v5m-4 3h8m-6-3h4v3" />
    </>
  ) : /recovery/.test(type) ? (
    <>
      <path d="M20 4C10 3 4 7 4 13a7 7 0 0 0 7 7c6 0 10-6 9-16Z M4 20 15 9m-5 5v-4m0 4h4" />
    </>
  ) : /practice|training/.test(type) ? (
    <>
      <path d="m8 4-5 16h18L16 4Zm-2 6h12M5 15h14M10 4h4" />
    </>
  ) : (
    <path d="M3 12h4l3-7 4 14 3-7h4" />
  );
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {shape}
    </svg>
  );
}

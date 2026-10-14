// 24px stroke icons, 1.8 stroke, drawn to match the Figma foundations.
const P = {
  pin: <><path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z" /><circle cx="12" cy="9.5" r="2.5" /></>,
  comment: <path d="M20 12a8 8 0 0 1-11.6 7.1L4 20l1-4.2A8 8 0 1 1 20 12z" />,
  layers: <><path d="m12 3 9 5-9 5-9-5 9-5z" /><path d="m3 13 9 5 9-5" /></>,
  list: <><path d="M9 6h11M9 12h11M9 18h11" /><circle cx="4.5" cy="6" r="1" /><circle cx="4.5" cy="12" r="1" /><circle cx="4.5" cy="18" r="1" /></>,
  eye: <><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z" /><circle cx="12" cy="12" r="3" /></>,
  lock: <><rect x="4.5" y="10.5" width="15" height="10" rx="2.5" /><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3" /></>,
  shield: <path d="M12 3 4.5 6v5.5c0 4.6 3.2 8.4 7.5 9.5 4.3-1.1 7.5-4.9 7.5-9.5V6L12 3z" />,
  bus: <><rect x="5" y="3.5" width="14" height="14" rx="3" /><path d="M5 11h14M8.5 21v-3.5M15.5 21v-3.5" /><circle cx="8.5" cy="14.3" r=".6" /><circle cx="15.5" cy="14.3" r=".6" /></>,
  bike: <><circle cx="6" cy="16" r="3.5" /><circle cx="18" cy="16" r="3.5" /><path d="M6 16l4-8h5l3 8M10 8 8.5 5.5H7M12.5 16 15 8" /></>,
  walk: <><circle cx="13" cy="4.5" r="1.8" /><path d="m10 21 2-6 3 3v3M8 12l2-4.5 3 1 2.5 3.5H18M12 15l-1.8-6.5" /></>,
  access: <><circle cx="12" cy="4.5" r="1.8" /><path d="M12 8v6h5l2 5M9.5 11a6 6 0 1 0 7.5 7" /></>,
  tree: <><path d="M12 21v-6" /><path d="M7.5 15a4.5 4.5 0 0 1-.9-8.9A5 5 0 0 1 16 5.4 4.5 4.5 0 0 1 16.5 15h-9z" /></>,
  truck: <><path d="M3 6.5h11v9H3zM14 9.5h4l3 3v3h-7" /><circle cx="7" cy="17.5" r="1.8" /><circle cx="17" cy="17.5" r="1.8" /></>,
  bell: <><path d="M6 16V11a6 6 0 1 1 12 0v5l1.5 2h-15L6 16z" /><path d="M10 20.5a2 2 0 0 0 4 0" /></>,
  doc: <><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5z" /><path d="M14 3v5h5M9 13h6M9 17h6" /></>,
  a11y: <><circle cx="12" cy="12" r="9" /><circle cx="12" cy="7.5" r="1.2" /><path d="M7.5 10 12 11l4.5-1M12 11v3l-2 4M12 14l2 4" /></>,
  globe: <><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" /></>,
  search: <><circle cx="11" cy="11" r="6.5" /><path d="m20 20-4.2-4.2" /></>,
  arrowRight: <path d="M5 12h14M13 6l6 6-6 6" />,
  arrowLeft: <path d="M19 12H5M11 18l-6-6 6-6" />,
  chevronRight: <path d="m9 6 6 6-6 6" />,
  chevronDown: <path d="m6 9 6 6 6-6" />,
  close: <path d="M6 6l12 12M18 6 6 18" />,
  plus: <path d="M12 5v14M5 12h14" />,
  minus: <path d="M5 12h14" />,
  check: <path d="m5 12.5 4.5 4.5L19 7" />,
  info: <><circle cx="12" cy="12" r="9" /><path d="M12 11v5.5M12 7.6v.1" /></>,
  alert: <><path d="M10.3 4.2 2.6 18a2 2 0 0 0 1.7 3h15.4a2 2 0 0 0 1.7-3L13.7 4.2a2 2 0 0 0-3.4 0z" /><path d="M12 9.5v4.5M12 17.2v.1" /></>,
  compass: <><circle cx="12" cy="12" r="9" /><path d="m15.5 8.5-2 5-5 2 2-5 5-2z" /></>,
  north: <path d="M12 3 6 20l6-4 6 4-6-17z" />,
  locate: <><circle cx="12" cy="12" r="3.5" /><path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3" /><circle cx="12" cy="12" r="7.5" /></>,
  reset: <><path d="M4 12a8 8 0 1 0 2.4-5.7" /><path d="M4 4v4.5h4.5" /></>,
  swap: <path d="M7 4 3 8l4 4M3 8h14M17 20l4-4-4-4M21 16H7" />,
  text: <path d="M5 6V4.5h14V6M12 4.5v15M9 19.5h6" />,
  share: <><path d="M12 15V3.5M7.5 8 12 3.5 16.5 8" /><path d="M5 12.5v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6" /></>,
  cube: <><path d="m12 2.8 8 4.6v9.2l-8 4.6-8-4.6V7.4l8-4.6z" /><path d="m4 7.4 8 4.6 8-4.6M12 12v9.2" /></>,
  satellite: <><path d="m13 7 4 4M7.5 8.5l3-3 3 3-3 3zM13.5 14.5l3-3 3 3-3 3zM10.5 11.5l3 3" /><path d="M4 20a6 6 0 0 0 6-6" /></>,
  map: <><path d="m9 4-5.5 2v14L9 18l6 2 5.5-2V4L15 6 9 4z" /><path d="M9 4v14M15 6v14" /></>,
  street: <><path d="M6 21 10 3M18 21 14 3M12 6v2M12 11v2M12 16v2" /></>,
  rotate: <><path d="M20 11a8 8 0 1 0-2.3 5.7" /><path d="M20 4v7h-7" /></>,
  tilt: <><path d="M4 18h16M6.5 18 12 6l5.5 12" /></>,
  expand: <path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" />,
  filter: <path d="M4 5h16l-6 7.5V19l-4 1.5v-8L4 5z" />,
  clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  calendar: <><rect x="3.5" y="5" width="17" height="15.5" rx="2.5" /><path d="M3.5 10h17M8 3v4M16 3v4" /></>,
  users: <><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20a6.5 6.5 0 0 1 13 0M16 4.6a3.5 3.5 0 0 1 0 6.8M18 14a6.5 6.5 0 0 1 3.5 6" /></>,
  history: <><path d="M3.5 12a8.5 8.5 0 1 0 2.5-6" /><path d="M3.5 4v4.5H8M12 7.5V12l3 2" /></>,
  edit: <><path d="M4 20h4L19 9l-4-4L4 16v4z" /><path d="m13.5 6.5 4 4" /></>,
  scale: <><path d="M12 3v18M5 21h14M4 7h16M7 7l-3 7a3 3 0 0 0 6 0L7 7zM17 7l-3 7a3 3 0 0 0 6 0l-3-7z" /></>,
  sparkle: <path d="M12 3.5 13.8 10 20.5 12l-6.7 2L12 20.5 10.2 14 3.5 12l6.7-2L12 3.5z" />,
  grid: <><rect x="4" y="4" width="7" height="7" rx="1.5" /><rect x="13" y="4" width="7" height="7" rx="1.5" /><rect x="4" y="13" width="7" height="7" rx="1.5" /><rect x="13" y="13" width="7" height="7" rx="1.5" /></>,
  inbox: <><path d="M3.5 13.5 6 5h12l2.5 8.5V19a1.5 1.5 0 0 1-1.5 1.5H5A1.5 1.5 0 0 1 3.5 19v-5.5z" /><path d="M3.5 13.5H8l1.5 2.5h5l1.5-2.5h4.5" /></>,
  flag: <><path d="M5 21V4M5 4h11l-2 4 2 4H5" /></>,
  send: <path d="M21 3 10.5 13.5M21 3l-6.5 18-4-7.5-7.5-4L21 3z" />,
  wifiOff: <><path d="M3 3l18 18M8.5 16.5a5 5 0 0 1 7 0M5 13a10 10 0 0 1 5-2.7M14.5 10.4A10 10 0 0 1 19 13M2 9.5a15 15 0 0 1 4.3-2.8M11 6a15 15 0 0 1 11 3.5" /><circle cx="12" cy="20" r=".8" /></>,
  key: <><circle cx="8" cy="15" r="4.5" /><path d="m11.2 11.8 9-9M17 6l3 3M14.5 8.5l2 2" /></>,
  external: <><path d="M14 4h6v6M20 4l-9 9" /><path d="M18 14v5a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 4 19V7.5A1.5 1.5 0 0 1 5.5 6H10" /></>,
  more: <><circle cx="5.5" cy="12" r="1.2" /><circle cx="12" cy="12" r="1.2" /><circle cx="18.5" cy="12" r="1.2" /></>,
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  sun: <><circle cx="12" cy="12" r="4" /><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4" /></>,
  ruler: <><path d="M3 16.5 16.5 3 21 7.5 7.5 21 3 16.5z" /><path d="m7 12.5 2 2M10 9.5l2 2M13 6.5l2 2" /></>,
};

export default function Icon({ name, size, className, title, ...rest }) {
  const path = P[name];
  if (!path) return null;
  return (
    <svg
      viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.8"
      strokeLinecap="round" strokeLinejoin="round" className={className}
      aria-hidden={title ? undefined : true} role={title ? "img" : undefined} {...rest}
    >
      {title && <title>{title}</title>}
      {path}
    </svg>
  );
}

// Remounts on every navigation, so the main content fades in per route.
export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="animate-route flex flex-1 flex-col">{children}</div>;
}

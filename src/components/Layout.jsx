import { GlobalHeader } from './GlobalHeader';

export function Layout({ children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      <GlobalHeader />
      <div className="zc-layout-scroll" style={{ flex: 1, overflow: 'auto', position: 'relative' }}>
        {children}
      </div>
    </div>
  );
}

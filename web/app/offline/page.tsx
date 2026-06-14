export const metadata = { title: "Offline — Lumen" };

export default function OfflinePage() {
  return (
    <div className="view" style={{ maxWidth: 600 }}>
      <div className="card glass" style={{ textAlign: "center" }}>
        <h2>You&apos;re offline</h2>
        <p className="muted" style={{ marginTop: 8 }}>
          Lumen can&apos;t reach the network right now. Screens you&apos;ve already opened still work;
          reconnect to refresh balances and prices.
        </p>
      </div>
    </div>
  );
}

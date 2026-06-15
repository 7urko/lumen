import Link from "next/link";

export default function NotFound() {
  return (
    <div className="view" style={{ textAlign: "center", paddingTop: 70 }}>
      <div className="balance" style={{ fontSize: 64 }}>404</div>
      <p className="muted" style={{ marginBottom: 18 }}>Lost in the chain — that page doesn&apos;t exist.</p>
      <Link href="/" className="btn btn-primary" style={{ display: "inline-flex" }}>Back to wallet</Link>
    </div>
  );
}

import type { Token } from "@lumen/core";

/** Gradient coin avatar with the token's symbol. */
export function Coin({ token, size = 40 }: { token: Token; size?: number }) {
  return (
    <div
      className="coin"
      style={{
        width: size,
        height: size,
        backgroundImage: `linear-gradient(135deg, ${token.grad[0]}, ${token.grad[1]})`,
      }}
    >
      {token.sym.slice(0, 3)}
    </div>
  );
}

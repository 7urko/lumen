/**
 * Self-built passkey (WebAuthn) layer — browser-native, no third party.
 *
 * v0: the passkey is the *unlock gate* (proves the user is present, via the
 * platform authenticator — Windows Hello / Touch ID). The next hardening step is
 * to use the WebAuthn PRF extension to derive an encryption key that wraps the
 * account key at rest, and ultimately to verify the passkey signature on-chain
 * inside an ERC-4337 smart account (so the passkey *is* the account).
 */

function b64url(buf: ArrayBuffer): string {
  let s = "";
  for (const b of new Uint8Array(buf)) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function challenge(): BufferSource {
  const a = new Uint8Array(new ArrayBuffer(32));
  crypto.getRandomValues(a);
  return a;
}

export function passkeySupported(): boolean {
  return typeof window !== "undefined" && typeof window.PublicKeyCredential !== "undefined";
}

/** Register a real platform passkey; returns its credential id (base64url). */
export async function registerPasskey(label: string): Promise<string> {
  const cred = (await navigator.credentials.create({
    publicKey: {
      challenge: challenge(),
      rp: { name: "Lumen Wallet" },
      user: { id: challenge(), name: label, displayName: label },
      pubKeyCredParams: [
        { type: "public-key", alg: -7 },   // ES256 (P-256)
        { type: "public-key", alg: -257 }, // RS256
      ],
      authenticatorSelection: { userVerification: "preferred", residentKey: "preferred" },
      timeout: 60000,
    },
  })) as PublicKeyCredential | null;
  if (!cred) throw new Error("Passkey registration was cancelled");
  return b64url(cred.rawId);
}

/** Prompt the platform authenticator to verify the user. */
export async function verifyPasskey(): Promise<boolean> {
  try {
    const assertion = await navigator.credentials.get({
      publicKey: { challenge: challenge(), userVerification: "preferred", timeout: 60000 },
    });
    return !!assertion;
  } catch {
    return false;
  }
}

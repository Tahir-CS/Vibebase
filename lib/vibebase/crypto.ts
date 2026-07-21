import { createHash, randomUUID } from "node:crypto";

export function createToken(projectId: string) {
  const tokenId = `tok_${randomUUID().slice(0, 8)}`;
  const rawToken = `vb_${projectId}_${randomUUID().replace(/-/g, "")}`;
  return {
    id: tokenId,
    rawToken,
    tokenHash: hashToken(rawToken),
    prefix: "vb_"
  };
}

export function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

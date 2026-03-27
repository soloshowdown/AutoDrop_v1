import { NextResponse } from "next/server";
import crypto from "node:crypto";

function randomInt(min: number, max: number) {
  return Math.ceil((min + (max - min)) * Math.random());
}

function makeRandomIv() {
  const chars = "0123456789abcdefghijklmnopqrstuvwxyz";
  const out: string[] = [];
  for (let i = 0; i < 16; i += 1) {
    out.push(chars[Math.floor(Math.random() * chars.length)]);
  }
  return out.join("");
}

function getAlgorithm(key: string) {
  const length = Buffer.from(key).length;
  if (length === 16) return "aes-128-cbc";
  if (length === 24) return "aes-192-cbc";
  if (length === 32) return "aes-256-cbc";
  throw new Error(`Invalid ZEGO secret length: ${length}`);
}

function generateToken04(
  appId: number,
  userId: string,
  secret: string,
  effectiveTimeInSeconds: number,
  payload = ""
) {
  const createTime = Math.floor(Date.now() / 1000);
  const tokenInfo = {
    app_id: appId,
    user_id: userId,
    nonce: randomInt(-2147483648, 2147483647),
    ctime: createTime,
    expire: createTime + effectiveTimeInSeconds,
    payload,
  };

  const plainText = JSON.stringify(tokenInfo);
  const iv = makeRandomIv();
  const cipher = crypto.createCipheriv(getAlgorithm(secret), secret, iv);
  cipher.setAutoPadding(true);
  const encrypted = Buffer.concat([cipher.update(plainText), cipher.final()]);

  const b1 = new Uint8Array(8);
  const b2 = new Uint8Array(2);
  const b3 = new Uint8Array(2);

  new DataView(b1.buffer).setBigInt64(0, BigInt(tokenInfo.expire), false);
  new DataView(b2.buffer).setUint16(0, iv.length, false);
  new DataView(b3.buffer).setUint16(0, encrypted.byteLength, false);

  const result = Buffer.concat([
    Buffer.from(b1),
    Buffer.from(b2),
    Buffer.from(iv),
    Buffer.from(b3),
    Buffer.from(encrypted),
  ]);

  return `04${result.toString("base64")}`;
}

export async function POST(req: Request) {
  try {
    const appIdRaw = process.env.ZEGO_APP_ID;
    const serverSecret = process.env.ZEGO_SERVER_SECRET;

    if (!appIdRaw || !serverSecret) {
      return NextResponse.json(
        { error: "ZEGO_APP_ID or ZEGO_SERVER_SECRET is missing" },
        { status: 500 }
      );
    }

    const { roomId, userId, userName } = (await req.json()) as {
      roomId?: string;
      userId?: string;
      userName?: string;
    };

    if (!roomId || !userId || !userName) {
      return NextResponse.json(
        { error: "roomId, userId and userName are required" },
        { status: 400 }
      );
    }

    const appId = Number(appIdRaw);
    const token = generateToken04(
      appId,
      userId,
      serverSecret,
      60 * 60 * 2,
      ""
    );

    return NextResponse.json({ appId, token });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to generate token";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

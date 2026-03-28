export const runtime = 'nodejs';
import { NextRequest, NextResponse } from "next/server";
import * as crypto from "crypto";

const IYZICO_API_KEY = process.env.IYZICO_API_KEY || "";
const IYZICO_SECRET_KEY = process.env.IYZICO_SECRET_KEY || "";
const IYZICO_BASE_URL = process.env.IYZICO_BASE_URL || "https://sandbox-api.iyzipay.com";

function generateAuthString(body: string): string {
  const randomKey = Math.random().toString(36).substring(2);
  const dataToEncrypt = IYZICO_API_KEY + randomKey + IYZICO_SECRET_KEY + body;
  const hash = crypto.createHash("sha1").update(dataToEncrypt).digest("base64");
  const authString = `apiKey:${IYZICO_API_KEY}&randomKey:${randomKey}&signature:${hash}`;
  return "IYZWSv2 " + Buffer.from(authString).toString("base64");
}

export async function POST(req: NextRequest) {
  const { token } = await req.json();

  const requestBody = { locale: "tr", token };
  const bodyStr = JSON.stringify(requestBody);

  try {
    const response = await fetch(`${IYZICO_BASE_URL}/payment/iyzipos/checkoutform/auth/ecom/detail`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": generateAuthString(bodyStr),
        "x-iyzi-rnd": Math.random().toString(36).substring(2),
      },
      body: bodyStr,
    });

    const data = await response.json();
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 300 });
  }
}
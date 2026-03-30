export const runtime = 'nodejs';
import { NextRequest, NextResponse } from "next/server";
import * as crypto from "crypto";

const IYZICO_API_KEY = process.env.IYZICO_API_KEY || "";
const IYZICO_SECRET_KEY = process.env.IYZICO_SECRET_KEY || "";
const IYZICO_BASE_URL = process.env.IYZICO_BASE_URL || "https://api.iyzipay.com";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://evemama.net";

const ENDPOINT = "/payment/iyzipos/checkoutform/auth/ecom/detail";

function generateRandomString(): string {
  return process.hrtime()[0] + Math.random().toString(8).slice(2);
}

function generateAuth(randomString: string, uri: string, body: any): string {
  const signature = crypto
    .createHmac("sha256", IYZICO_SECRET_KEY)
    .update(randomString + uri + JSON.stringify(body))
    .digest("hex");

  const authParams = [
    `apiKey:${IYZICO_API_KEY}`,
    `randomKey:${randomString}`,
    `signature:${signature}`,
  ].join("&");

  return "IYZWSv2 " + Buffer.from(authParams).toString("base64");
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const token = formData.get("token") as string;

    if (!token) {
      return NextResponse.redirect(`${SITE_URL}/odeme/sonuc?durum=basarisiz`, { status: 303 });
    }

    const randomString = generateRandomString();
    const requestBody = { locale: "tr", token };
    const authHeader = generateAuth(randomString, ENDPOINT, requestBody);

    const response = await fetch(`${IYZICO_BASE_URL}${ENDPOINT}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": authHeader,
        "x-iyzi-rnd": randomString,
        "x-iyzi-client-version": "iyzipay-node-2.0.65",
      },
      body: JSON.stringify(requestBody),
    });

    const data = await response.json();
    console.log("Sonuç yanıt:", JSON.stringify(data));

    if (data.status === "success" && data.paymentStatus === "SUCCESS") {
      return NextResponse.redirect(`${SITE_URL}/odeme/sonuc?durum=basarili`, { status: 303 });
    } else {
      return NextResponse.redirect(`${SITE_URL}/odeme/sonuc?durum=basarisiz`, { status: 303 });
    }
  } catch (err: any) {
    console.log("Hata:", err.message);
    return NextResponse.redirect(`${SITE_URL}/odeme/sonuc?durum=basarisiz`, { status: 303 });
  }
}
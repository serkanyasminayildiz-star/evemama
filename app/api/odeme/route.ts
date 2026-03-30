export const runtime = 'nodejs';
import { NextRequest, NextResponse } from "next/server";
import * as crypto from "crypto";

const IYZICO_API_KEY = process.env.IYZICO_API_KEY || "";
const IYZICO_SECRET_KEY = process.env.IYZICO_SECRET_KEY || "";
const IYZICO_BASE_URL = process.env.IYZICO_BASE_URL || "https://api.iyzipay.com";

const ENDPOINT = "/payment/iyzipos/checkoutform/initialize/auth/ecom";

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
  const body = await req.json();
  const { items, buyer, totalPrice } = body;

  const conversationId = Date.now().toString();
  const randomString = generateRandomString();

  // Basket items toplamını hesapla
  const basketItems = items.map((item: any) => ({
    id: item.id.toString(),
    name: item.name,
    category1: "Evcil Hayvan",
    itemType: "PHYSICAL",
    price: (item.price * item.quantity).toFixed(2),
  }));

  // İyzico price = basket items toplamı olmalı (kargo hariç)
  const basketTotal = items.reduce((sum: number, item: any) => 
    sum + (item.price * item.quantity), 0
  );
  
  const priceStr = basketTotal.toFixed(2);
  const paidPriceStr = totalPrice.toFixed(2); // kargo dahil toplam

  const requestBody = {
    locale: "tr",
    conversationId,
    price: priceStr,
    paidPrice: paidPriceStr,
    currency: "TRY",
    basketId: "B" + conversationId,
    paymentGroup: "PRODUCT",
    callbackUrl: `${process.env.NEXT_PUBLIC_SITE_URL || "https://evemama.net"}/odeme/sonuc`,
    enabledInstallments: [1, 2, 3, 6, 9, 12],
    buyer: {
      id: buyer.id || "1",
      name: buyer.name,
      surname: buyer.surname,
      email: buyer.email,
      identityNumber: "74300864791",
      registrationAddress: buyer.address,
      city: buyer.city,
      country: "Turkey",
      ip: "85.34.78.112",
    },
    shippingAddress: {
      contactName: buyer.name + " " + buyer.surname,
      city: buyer.city,
      country: "Turkey",
      address: buyer.address,
    },
    billingAddress: {
      contactName: buyer.name + " " + buyer.surname,
      city: buyer.city,
      country: "Turkey",
      address: buyer.address,
    },
    basketItems,
  };

  const authHeader = generateAuth(randomString, ENDPOINT, requestBody);

  try {
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
    console.log("İyzico yanıt:", JSON.stringify(data));
    return NextResponse.json(data);
  } catch (err: any) {
    console.log("Hata:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
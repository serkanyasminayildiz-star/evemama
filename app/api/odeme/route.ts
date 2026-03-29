export const runtime = 'nodejs';
import { NextRequest, NextResponse } from "next/server";
import * as crypto from "crypto";

const IYZICO_API_KEY = process.env.IYZICO_API_KEY || "";
const IYZICO_SECRET_KEY = process.env.IYZICO_SECRET_KEY || "";
const IYZICO_BASE_URL = process.env.IYZICO_BASE_URL || "https://api.iyzipay.com";

function generateAuthString(randomKey: string, body: string): string {
  const dataToEncrypt = IYZICO_API_KEY + randomKey + IYZICO_SECRET_KEY + body;
  const hash = crypto.createHmac("sha256", IYZICO_SECRET_KEY)
    .update(dataToEncrypt)
    .digest("hex");
  const authString = `apiKey:${IYZICO_API_KEY}&randomKey:${randomKey}&signature:${hash}`;
  return "IYZWSv2 " + Buffer.from(authString).toString("base64");
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { items, buyer, totalPrice } = body;

  const randomKey = Math.random().toString(36).substring(2) + Date.now().toString(36);
  const conversationId = Date.now().toString();

  const requestBody = {
    locale: "tr",
    conversationId,
    price: totalPrice.toFixed(2),
    paidPrice: totalPrice.toFixed(2),
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
    basketItems: items.map((item: any) => ({
      id: item.id.toString(),
      name: item.name,
      category1: "Evcil Hayvan",
      itemType: "PHYSICAL",
      price: (item.price * item.quantity).toFixed(2),
    })),
  };

  const bodyStr = JSON.stringify(requestBody);

  try {
    const response = await fetch(`${IYZICO_BASE_URL}/payment/iyzipos/checkoutform/initialize/auth/ecom`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": generateAuthString(randomKey, bodyStr),
        "x-iyzi-rnd": randomKey,
      },
      body: bodyStr,
    });

    const data = await response.json();
    console.log("İyzico yanıt:", JSON.stringify(data));
    
    if (data.status === "failure") {
      return NextResponse.json({ error: data.errorMessage, errorCode: data.errorCode }, { status: 400 });
    }
    
    return NextResponse.json(data);
  } catch (err: any) {
    console.log("Hata:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
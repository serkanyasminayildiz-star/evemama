export const runtime = 'nodejs';
import { NextRequest, NextResponse } from "next/server";
import * as crypto from "crypto";

const IYZICO_API_KEY = process.env.IYZICO_API_KEY || "";
const IYZICO_SECRET_KEY = process.env.IYZICO_SECRET_KEY || "";
const IYZICO_BASE_URL = process.env.IYZICO_BASE_URL || "https://api.iyzipay.com";

function generatePKIString(params: any): string {
  function serialize(obj: any): string {
    if (obj === null || obj === undefined) return '';
    if (typeof obj !== 'object') return String(obj);
    if (Array.isArray(obj)) {
      return obj.map(item => {
        if (typeof item === 'object') {
          return '[' + Object.entries(item).map(([k, v]) => `${k}=${serialize(v)}`).join(', ') + ']';
        }
        return String(item);
      }).join(', ');
    }
    return Object.entries(obj).map(([k, v]) => {
      if (Array.isArray(v)) {
        return `${k}=[${v.map(item => {
          if (typeof item === 'object') {
            return '[' + Object.entries(item).map(([ik, iv]) => `${ik}=${serialize(iv)}`).join(', ') + ']';
          }
          return String(item);
        }).join(', ')}]`;
      }
      if (typeof v === 'object' && v !== null) {
        return Object.entries(v).map(([ik, iv]) => `${ik}=${serialize(iv)}`).join(', ');
      }
      return `${k}=${serialize(v)}`;
    }).join(', ');
  }
  return '[' + serialize(obj) + ']';
}

function generateAuthString(randomKey: string, pkiString: string): string {
  const dataToHash = IYZICO_SECRET_KEY + randomKey + pkiString;
  const hash = crypto.createHash("sha1").update(dataToHash, "utf8").digest("base64");
  const authContent = `apiKey:${IYZICO_API_KEY}&randomKey:${randomKey}&signature:${hash}`;
  return "IYZWSv2 " + Buffer.from(authContent, "utf8").toString("base64");
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { items, buyer, totalPrice } = body;

  const randomKey = Math.random().toString(36).substring(2);
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

  const pkiString = generatePKIString(requestBody);
  const authString = generateAuthString(randomKey, pkiString);

  console.log("PKI:", pkiString);
  console.log("Auth:", authString);

  try {
    const response = await fetch(`${IYZICO_BASE_URL}/payment/iyzipos/checkoutform/initialize/auth/ecom`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": authString,
        "x-iyzi-rnd": randomKey,
        "x-iyzi-client-version": "iyzipay-node-2.0.48",
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
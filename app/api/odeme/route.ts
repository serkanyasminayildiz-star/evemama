export const runtime = 'nodejs';
import { NextRequest, NextResponse } from "next/server";
const Iyzipay = require("iyzipay");

const iyzipay = new Iyzipay({
  apiKey: process.env.IYZICO_API_KEY,
  secretKey: process.env.IYZICO_SECRET_KEY,
  uri: process.env.IYZICO_BASE_URL,
});

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { items, buyer, totalPrice } = body;

  const request = {
    locale: "tr",
    conversationId: Date.now().toString(),
    price: totalPrice.toFixed(2),
    paidPrice: totalPrice.toFixed(2),
    currency: "TRY",
    basketId: "B" + Date.now(),
    paymentGroup: "PRODUCT",
    callbackUrl: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/odeme/sonuc`,
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

  return new Promise((resolve) => {
    iyzipay.checkoutFormInitialize.create(request, (err: any, result: any) => {
      if (err) {
        resolve(NextResponse.json({ error: err.message }, { status: 500 }));
      } else {
        resolve(NextResponse.json(result));
      }
    });
  });
}
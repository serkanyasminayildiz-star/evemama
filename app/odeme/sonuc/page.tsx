import { NextRequest, NextResponse } from "next/server";
const Iyzipay = require("iyzipay");

const iyzipay = new Iyzipay({
  apiKey: process.env.IYZICO_API_KEY,
  secretKey: process.env.IYZICO_SECRET_KEY,
  uri: process.env.IYZICO_BASE_URL,
});

export async function POST(req: NextRequest) {
  const { token } = await req.json();

  return new Promise((resolve) => {
    iyzipay.checkoutForm.retrieve({ locale: "tr", token }, (err: any, result: any) => {
      if (err) {
        resolve(NextResponse.json({ error: err.message }, { status: 500 }));
      } else {
        resolve(NextResponse.json(result));
      }
    });
  });
}
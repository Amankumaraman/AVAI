import type { VercelRequest, VercelResponse } from '@vercel/node';
import Razorpay from 'razorpay';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ detail: 'Method Not Allowed' });
  }

  try {
    const key_id = process.env.RAZORPAY_KEY_ID || process.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_TNA6Lv7QbmAMn8';
    const key_secret = process.env.RAZORPAY_KEY_SECRET || 'Aucrh0nc30Uzr3oC06oxi4PL';

    const { amount = 50000, currency = 'INR', receipt } = req.body || {};

    if (Number(amount) < 100) {
      return res.status(400).json({ detail: 'Amount must be at least 100 paise (₹1 INR).' });
    }

    const instance = new Razorpay({
      key_id,
      key_secret,
    });

    const order = await instance.orders.create({
      amount: Number(amount),
      currency: currency.toUpperCase(),
      receipt: receipt || `rcpt_${Date.now()}`,
      payment_capture: 1,
    });

    return res.status(200).json({
      status: 'success',
      order_id: order.id,
      amount: order.amount,
      currency: order.currency,
      key_id,
    });
  } catch (error: any) {
    console.error('Razorpay order creation error:', error);
    return res.status(500).json({ detail: error.message || 'Failed to create payment order.' });
  }
}

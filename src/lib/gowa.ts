const GOWA_URL = process.env.GOWA_URL || 'https://gowa.leadflow.id';
const GOWA_USER = process.env.GOWA_USER || '';
const GOWA_PASS = process.env.GOWA_PASS || '';

export async function sendWhatsAppMessage(phone: string, message: string) {
  const auth = Buffer.from(`${GOWA_USER}:${GOWA_PASS}`).toString('base64');

  const res = await fetch(`${GOWA_URL}/send/message`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      phone: `${phone}@s.whatsapp.net`,
      message,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Gowa API error ${res.status}: ${text}`);
  }

  return res.json();
}

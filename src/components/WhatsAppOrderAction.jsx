import { useState } from 'react';
import { Copy, MessageCircle } from 'lucide-react';
import { whatsappURL, WHATSAPP } from '../utils/shop';
export default function WhatsAppOrderAction({ message }) {
  const [copied, setCopied] = useState(false),
    [manual, setManual] = useState(false);
  const url = whatsappURL(message);
  async function copy() {
    try {
      await navigator.clipboard.writeText(message);
      setCopied(true);
    } catch {
      setManual(true);
    }
  }
  if (url.length <= 7500)
    return (
      <a className="button" href={url} target="_blank" rel="noopener noreferrer">
        <MessageCircle size={18} />
        Order via WhatsApp
      </a>
    );
  return (
    <div className="long-order">
      <p>
        Your request is longer than a reliable click-to-chat link. Copy it, open WhatsApp and paste
        it into the chat.
      </p>
      <button className="button secondary" onClick={copy}>
        <Copy size={18} />
        {copied ? 'Request copied' : 'Copy my request'}
      </button>
      {manual && (
        <label>
          Copy this request
          <textarea readOnly rows={6} value={message} onFocus={(e) => e.target.select()} />
        </label>
      )}
      <a
        className="button"
        href={`https://wa.me/${WHATSAPP}`}
        target="_blank"
        rel="noopener noreferrer"
      >
        <MessageCircle size={18} />
        Open WhatsApp
      </a>
    </div>
  );
}

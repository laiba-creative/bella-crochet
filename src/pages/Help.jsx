import { WhatsAppLink } from '../components/Layout';
export function Help() {
  return (
    <div className="container prose">
      <span className="eyebrow">A little help</span>
      <h1>Let’s make it easy.</h1>
      <h2>How do I order?</h2>
      <p>
        Choose your pieces, colours and sizes. Add them to your bag and select Order via WhatsApp.
        Check the prepared message and send it. We’ll confirm availability, the final quote,
        delivery and payment in chat.
      </p>
      <h2>Can I request a custom piece?</h2>
      <p>
        Yes. Choose a custom colour or size and describe your idea in the note. Requests are subject
        to materials, making time and an agreed quote.
      </p>
      <h2>How long does it take?</h2>
      <p>
        Making and delivery times depend on the piece, quantity and destination. Please confirm your
        deadline with us before placing an order.
      </p>
      <h2 id="care">How should I care for my piece?</h2>
      <p>
        Different materials, attachments and decorations need different care. Message us for the
        correct instructions for your item before washing it.
      </p>
      <h2>What about changes or returns?</h2>
      <p>
        Please ask us to confirm cancellation, return and damaged-item arrangements before you pay,
        particularly for custom pieces.
      </p>
      <WhatsAppLink>Ask us a question</WhatsAppLink>
    </div>
  );
}
export function Privacy() {
  return (
    <div className="container prose">
      <span className="eyebrow">Your privacy</span>
      <h1>A little clarity.</h1>
      <h2>Browsing and your bag</h2>
      <p>
        You can browse without an account. Product IDs, quantities, sizes and colours in your bag
        are saved in your browser so you can return to them. Clear your bag to remove these saved
        choices. Notes are kept only in the current tab’s memory and reset on refresh.
      </p>
      <h2>Ordering on WhatsApp</h2>
      <p>
        Selecting Order via WhatsApp opens a prepared message containing your selected pieces and
        any note you entered. You choose whether to send it. This handoff shares the message with
        WhatsApp and the business number +92 331 4544497 under WhatsApp’s own terms and privacy
        policy. Do not include card numbers, passwords or identity documents in the note.
      </p>
      <h2>Business records</h2>
      <p>
        After confirming your order, the owner may record your name, contact number, ordered items,
        agreed amount and fulfilment notes in a private business dashboard. Support queries may also
        be recorded to help resolve them. No public order lookup or customer directory is available.
      </p>
      <h2>Services and access</h2>
      <p>
        Vercel hosts the website. When the live catalogue is connected, Supabase supplies product
        data, product image storage and private administrative services. These services process
        technical requests, including network information, needed to operate the website. No
        analytics trackers or AI services are integrated.
      </p>
      <h2>Retention and requests</h2>
      <p>
        The intended retention schedule is to delete completed or cancelled order records 180 days
        after their last update and closed support records after 90 days, unless a legitimate
        business or legal requirement needs a longer period. The owner must run the retention action
        regularly. WhatsApp conversations have separate retention settings. Contact us to ask about
        your data, corrections or deletion.
      </p>
      <WhatsAppLink>Contact us about privacy</WhatsAppLink>
    </div>
  );
}

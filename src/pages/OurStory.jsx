import { Heart, Flower2, Gift } from 'lucide-react';
import { WhatsAppLink } from '../components/Layout';
export default function OurStory() {
  return (
    <>
      <section className="story-intro container">
        <div>
          <span className="eyebrow">Our Story</span>
          <h1>
            A little yarn.
            <br />
            <em>A lot of heart.</em>
          </h1>
          <p>
            Bella Crochet brings together handmade flowers, playful keepsakes and accessories for
            everyday moments.
          </p>
        </div>
        <img src="/images/yarn.webp" alt="Colourful yarn and tools behind the little details" />
      </section>
      <section className="story-details">
        <div className="container story-details-inner">
          <div>
            <h2>
              Small details,
              <br />
              made with care.
            </h2>
            <p>
              Each piece begins with yarn and takes shape through careful stitching. From expressive
              little faces to delicate flower petals, the details give every design its character.
            </p>
          </div>
          <img src="/images/products/sunflower.webp" alt="Handmade potted sunflower" />
          <img
            src="/images/products/pearl-charm.webp"
            alt="Crochet flowers and pearl-style beads"
          />
        </div>
      </section>
      <section className="story-values container">
        <h2>Something to keep. Something to give.</h2>
        <div>
          {[
            [
              Flower2,
              'Flowers for your space',
              'Handmade blooms for your desk, shelf or favourite corner.',
            ],
            [Heart, 'Little companions', 'Playful pieces to carry along or keep close.'],
            [
              Gift,
              'Thoughtful gifts',
              'Something personal for a birthday, a celebration or just because.',
            ],
          ].map(([Icon, title, body]) => (
            <article key={title}>
              <span>
                <Icon size={27} />
              </span>
              <h3>{title}</h3>
              <p>{body}</p>
            </article>
          ))}
        </div>
      </section>
      <section className="custom-strip">
        <h2>Make it a little more you.</h2>
        <p>Have a colour or idea in mind? Message us to discuss a custom request.</p>
        <WhatsAppLink>Chat with us on WhatsApp</WhatsAppLink>
      </section>
    </>
  );
}

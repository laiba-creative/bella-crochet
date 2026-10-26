import { useRef, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Heart, Flower2, MessageCircle, Pause, Play } from 'lucide-react';
import ProductCard from '../components/ProductCard';
import { useShop } from '../context/ShopContext';
export default function Home() {
  const { products, loading, error, refresh } = useShop();
  const video = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [videoError, setVideoError] = useState(false);
  useEffect(() => {
    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches)
      video.current
        ?.play()
        .then(() => setPlaying(true))
        .catch(() => {});
  }, []);
  function toggle() {
    if (!video.current) return;
    if (playing) {
      video.current.pause();
      setPlaying(false);
    } else {
      video.current
        .play()
        .then(() => setPlaying(true))
        .catch(() => setVideoError(true));
    }
  }
  return (
    <>
      <section className="hero">
        <div className="hero-media">
          <video
            ref={video}
            muted
            loop
            playsInline
            preload="metadata"
            poster="/images/products/owls.webp"
            onError={() => setVideoError(true)}
            aria-label="A gentle close-up of handmade owl pouches"
          >
            <source src="/videos/hero-placeholder.mp4" type="video/mp4" />
          </video>
          <div className="hero-fade" />
          {!videoError && (
            <button
              className="video-control icon-button"
              onClick={toggle}
              aria-label={playing ? 'Pause hero video' : 'Play hero video'}
            >
              {playing ? <Pause size={16} /> : <Play size={16} />}
            </button>
          )}
        </div>
        <div className="hero-copy container">
          <div>
            <span className="eyebrow">Handmade with love</span>
            <h1>
              Little handmade things.
              <br />
              <em>Big happy feelings.</em>
            </h1>
          </div>
          <div className="hero-description">
            <p>Crochet flowers, keepsakes and accessories, made to brighten your everyday.</p>
            <Link className="button" to="/products">
              Explore Collection <ArrowRight size={18} />
            </Link>
          </div>
        </div>
        <div className="benefits container">
          <span>
            <Heart />
            Handmade with care
          </span>
          <span>
            <Flower2 />
            Custom requests welcome
          </span>
          <span>
            <MessageCircle />
            Order on WhatsApp
          </span>
        </div>
      </section>
      <section className="featured">
        <div className="container">
          <div className="section-title">
            <h2>Find your little favourite</h2>
            <span className="small-tab">Little keepsakes</span>
          </div>
          {loading ? (
            <p role="status">Gathering your little favourites…</p>
          ) : error ? (
            <div className="error-box">
              {error}
              <button onClick={refresh}>Try again</button>
            </div>
          ) : (
            <div className="product-grid featured-grid">
              {products
                .filter((p) => p.featured)
                .slice(0, 3)
                .map((p, i) => (
                  <ProductCard key={p.id} product={p} index={i} />
                ))}
            </div>
          )}
          <div className="section-bottom">
            <p>
              Explore our collection of crochet flowers, keepsakes and accessories. Find something
              for your space, your everyday or someone special.
            </p>
            <Link to="/products" className="button">
              Explore Collection <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>
      <section className="story-teaser">
        <div className="container">
          <span className="eyebrow">Our Story</span>
          <h2>A little yarn. A lot of heart.</h2>
          <p>
            From a smiling keychain to a flower for your desk, Bella Crochet brings a little
            handmade warmth to everyday moments. Explore the pieces and the care behind them.
          </p>
          <Link to="/our-story" className="text-link">
            Read Our Story <ArrowRight size={18} />
          </Link>
        </div>
        <div className="yarn-banner">
          <img src="/images/yarn.webp" alt="Colourful yarn and crochet hooks" loading="lazy" />
        </div>
      </section>
      <section id="how-to-order" className="how-to">
        <div className="container">
          <h2>Made for your someone</h2>
          <div className="steps">
            {[
              ['Choose your favourite', 'Explore the collection and open a piece you love.'],
              ['Make it yours', 'Choose your colours and size, or tell us about a custom request.'],
              [
                'Chat to order',
                'Send your selection on WhatsApp to confirm availability, delivery and payment.',
              ],
            ].map(([title, body], i) => (
              <div className="step" key={title}>
                <span>{i + 1}</span>
                <div>
                  <h3>{title}</h3>
                  <p>{body}</p>
                </div>
              </div>
            ))}
          </div>
          <small>Your order is confirmed in chat.</small>
        </div>
      </section>
    </>
  );
}

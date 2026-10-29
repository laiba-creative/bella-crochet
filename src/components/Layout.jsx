import { useState, useEffect, useRef } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  ShoppingBag,
  Menu,
  X,
  ChevronDown,
  ArrowRight,
  MessageCircle,
  Instagram,
  Heart,
  Flower2,
} from 'lucide-react';
import { useShop } from '../context/ShopContext';
import { whatsappURL } from '../utils/shop';
const chat = whatsappURL('Hi Bella Crochet! I would like to know more about your handmade pieces.');
export function WhatsAppLink({ children = 'Chat with us', className = 'button', message }) {
  return (
    <a
      className={className}
      href={message ? whatsappURL(message) : chat}
      target="_blank"
      rel="noopener noreferrer"
    >
      <MessageCircle size={18} />
      {children}
    </a>
  );
}
export function Header() {
  const { categories, count } = useShop();
  const [open, setOpen] = useState(false),
    [mobile, setMobile] = useState(false);
  const drop = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();
  useEffect(() => {
    setOpen(false);
    setMobile(false);
  }, [location.pathname, location.search]);
  useEffect(() => {
    function close(e) {
      if (!drop.current?.contains(e.target)) setOpen(false);
    }
    document.addEventListener('pointerdown', close);
    return () => document.removeEventListener('pointerdown', close);
  }, []);
  return (
    <>
      <div className="announcement">
        Free delivery on orders of Rs 2,000 or more <Heart size={13} />
      </div>
      <header className="site-header">
        <div className="nav-inner">
          <Link to="/" className="brand" aria-label="Bella Crochet home">
            <img src="/images/logo.svg" alt="Bella Crochet" />
          </Link>
          <button
            className="icon-button mobile-menu"
            aria-label={mobile ? 'Close menu' : 'Open menu'}
            aria-expanded={mobile}
            onClick={() => setMobile(!mobile)}
          >
            {mobile ? <X /> : <Menu />}
          </button>
          <nav
            aria-label="Main navigation"
            className={mobile ? 'nav-links mobile-open' : 'nav-links'}
          >
            <NavLink to="/">Home</NavLink>
            <div
              className="collection-nav"
              ref={drop}
              onMouseEnter={() => setOpen(true)}
              onMouseLeave={() => setOpen(false)}
              onBlur={(e) => {
                if (!e.currentTarget.contains(e.relatedTarget)) setOpen(false);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  setOpen(false);
                  drop.current?.querySelector('button')?.focus();
                }
              }}
            >
              <button
                className={open ? 'nav-button active' : 'nav-button'}
                onClick={() => setOpen(!open)}
                aria-expanded={open}
                aria-controls="collection-menu"
              >
                Collection <ChevronDown size={13} />
              </button>
              {open && (
                <div id="collection-menu" className="collection-menu">
                  <small>Find your next little favourite.</small>
                  {categories.map((c) => (
                    <Link key={c.id} to={`/products?category=${encodeURIComponent(c.id)}`}>
                      {c.name}
                      <ArrowRight size={13} />
                    </Link>
                  ))}
                  <Link to="/products" className="view-all">
                    View all pieces <ArrowRight size={14} />
                  </Link>
                </div>
              )}
            </div>
            <NavLink to="/products">All Products</NavLink>
            <NavLink to="/our-story">Our Story</NavLink>
          </nav>
          <div className="nav-actions">
            <button
              className="icon-button cart-link"
              aria-label={`Open cart, ${count} items`}
              onClick={() => navigate('/cart')}
            >
              <ShoppingBag size={23} />
              {count > 0 && <span>{count}</span>}
            </button>
            <WhatsAppLink className="chat-button" />
          </div>
        </div>
      </header>
    </>
  );
}
export function Footer() {
  const instagram =
    import.meta.env.VITE_INSTAGRAM_URL || 'https://www.instagram.com/bella_crochetofficial';
  let insta = '';
  try {
    const u = new URL(instagram);
    if (u.protocol === 'https:' && ['instagram.com', 'www.instagram.com'].includes(u.hostname))
      insta = u.href;
  } catch {
    /* link not supplied */
  }
  return (
    <footer className="footer">
      <div className="footer-main container">
        <div className="footer-brand">
          <Link to="/">
            <img src="/images/logo.svg" alt="Bella Crochet" />
          </Link>
          <p>
            Little handmade things.
            <br />A little more joy.
          </p>
        </div>
        <div>
          <h3>Explore</h3>
          <Link to="/">Home</Link>
          <Link to="/products">All Products</Link>
          <Link to="/our-story">Our Story</Link>
        </div>
        <div>
          <h3>Need a hand?</h3>
          <Link to="/#how-to-order">How to order</Link>
          <Link to="/help#care">Product care</Link>
          <WhatsAppLink className="footer-link">Custom requests</WhatsAppLink>
          <Link to="/privacy">Privacy</Link>
        </div>
        <div>
          <h3>Say hello</h3>
          <WhatsAppLink className="footer-link">WhatsApp</WhatsAppLink>
          {insta ? (
            <a href={insta} target="_blank" rel="noopener noreferrer">
              <Instagram size={17} />
              Instagram
            </a>
          ) : (
            <span className="muted">Instagram · coming soon</span>
          )}
        </div>
      </div>
      <div className="footer-bottom container">
        <small>© {new Date().getFullYear()} Bella Crochet</small>
        <small>
          Designed by{' '}
          <a
            className="designer-credit"
            href="https://laibafayazportfolio.vercel.app/"
            target="_blank"
            rel="noopener noreferrer"
          >
            Laiba Fayaz<span role="tooltip">Want to meet the designer behind Bella Crochet?</span>
          </a>
        </small>
      </div>
    </footer>
  );
}
export function ScrollManager() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (hash) {
      const id = setTimeout(
        () => document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: 'smooth' }),
        120,
      );
      return () => clearTimeout(id);
    }
    window.scrollTo(0, 0);
  }, [pathname, hash]);
  return null;
}
export function Layout({ children }) {
  const { notice } = useShop();
  return (
    <>
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <Header />
      <main id="main">{children}</main>
      <Footer />
      <div className={notice ? 'toast visible' : 'toast'} role="status" aria-live="polite">
        {notice}
      </div>
    </>
  );
}

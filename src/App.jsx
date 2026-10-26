import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { useEffect, lazy, Suspense } from 'react';
import { Layout, ScrollManager } from './components/Layout';
import Home from './pages/Home';
import Products from './pages/Products';
import ProductDetails from './pages/ProductDetails';
import Cart from './pages/Cart';
import OurStory from './pages/OurStory';
import { Help, Privacy } from './pages/Help';
const Admin = lazy(() => import('./pages/Admin'));
export default function App() {
  const location = useLocation();
  const admin = location.pathname.startsWith('/admin');
  useEffect(() => {
    document.title = admin
      ? 'Bella Crochet — Private administration'
      : `Bella Crochet — ${location.pathname === '/our-story' ? 'Our Story' : location.pathname === '/products' ? 'The Collection' : location.pathname === '/cart' ? 'Your Bag' : 'Handmade little joys'}`;
  }, [location.pathname, admin]);
  const routes = (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/products" element={<Products />} />
      <Route path="/products/:slug" element={<ProductDetails />} />
      <Route path="/cart" element={<Cart />} />
      <Route path="/our-story" element={<OurStory />} />
      <Route path="/help" element={<Help />} />
      <Route path="/privacy" element={<Privacy />} />
      <Route path="/admin/*" element={<Admin />} />
      <Route
        path="*"
        element={
          <div className="container empty-state">
            <h1>This little page wandered off.</h1>
            <Link to="/">Back to Home</Link>
          </div>
        }
      />
    </Routes>
  );
  return (
    <>
      <ScrollManager />
      <Suspense
        fallback={
          <div className="container empty-state" role="status">
            Loading workspace…
          </div>
        }
      >
        {admin ? routes : <Layout>{routes}</Layout>}
      </Suspense>
    </>
  );
}

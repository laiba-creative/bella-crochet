import { useEffect, useState, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  LockKeyhole,
  LogOut,
  Package,
  Tags,
  ClipboardList,
  MessageCircle,
  Settings,
  ShieldCheck,
  Plus,
  Pencil,
  Trash2,
  X,
  LayoutDashboard,
  RefreshCw,
  Eye,
  ImagePlus,
} from 'lucide-react';

import { supabase, configured, safeImage } from '../services/supabase';
import {
  listAdmin,
  saveAdmin,
  deleteAdmin,
  uploadProductImage,
} from '../services/admin';
import { money, COLOURS } from '../utils/shop';
import { useShop } from '../context/ShopContext';
import '../styles/admin.css';

const tabs = [
  ['overview', 'Overview', LayoutDashboard],
  ['products', 'Products', Package],
  ['categories', 'Categories', Tags],
  ['orders', 'Orders', ClipboardList],
  ['support_requests', 'Customer support', MessageCircle],
  ['settings', 'Settings', Settings],
  ['audit_events', 'Access & activity', ShieldCheck],
];

const blankProduct = {
  name: '',
  id: '',
  slug: '',
  category_id: 'keychains',
  price: 0,
  size_prices: {},
  description: '',
  images: [],
  colours: COLOURS,
  sizes: ['Standard'],
  custom_size: false,
  custom_colour: true,
  stock_mode: 'made_to_order',
  stock_quantity: 0,
  active: false,
  featured: false,
  sort_order: 10,
  making_time: 'Message us for the current making time.',
  care: 'Please ask us for care instructions for this piece before washing.',
  details: 'Please confirm dimensions and materials before ordering.',
};

const slugify = (value) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 75);

export default function Admin() {
  const [phase, setPhase] = useState(
    configured ? 'checking' : 'unconfigured',
  );
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [tab, setTab] = useState('overview');
  const [identity, setIdentity] = useState('');

  const started = useRef(0);
  const lastActive = useRef(Date.now());
  const userId = useRef(null);

  const signout = useCallback(async () => {
    setPhase('login');
    setTab('overview');
    setIdentity('');
    setPassword('');
    userId.current = null;

    try {
      await supabase?.auth.signOut();
    } catch {
      // Private interface has already been cleared.
    }
  }, []);

  const inspect = useCallback(async () => {
    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        setPhase('login');
        return;
      }

      const { data: member, error: memberError } =
        await supabase.rpc('is_admin_member');

      if (memberError || !member) {
        await supabase.auth.signOut();
        setPhase('login');
        setError('This account does not have administrative access.');
        return;
      }

      if (userId.current !== user.id) {
        started.current = Date.now();
        lastActive.current = Date.now();
        userId.current = user.id;
      }

      setIdentity(user.email || 'Authorised administrator');

      const { data: allowed, error: accessError } =
        await supabase.rpc('is_admin');

      if (accessError || !allowed) {
        throw accessError || new Error('Not allowed');
      }

      setPhase('ready');
    } catch (err) {
    console.error('Admin access verification failed:', err);

    setError(
      err?.message ||
        'Unable to verify access. Check the database setup and sign in again.',
    );

    setPhase('login');
  }
}, []);

  useEffect(() => {
    if (!configured) return;

    inspect();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        setPhase('login');
        setIdentity('');
      } else if (event === 'TOKEN_REFRESHED') {
        setTimeout(() => inspect(), 0);
      }
    });

    return () => subscription.unsubscribe();
  }, [inspect]);

  useEffect(() => {
    if (phase !== 'ready') return;

    const touch = () => {
      lastActive.current = Date.now();
    };

    const events = ['pointerdown', 'keydown', 'touchstart'];

    events.forEach((event) =>
      window.addEventListener(event, touch, { passive: true }),
    );

    const interval = setInterval(() => {
      const idleExpired =
        Date.now() - lastActive.current > 15 * 60 * 1000;

      const sessionExpired =
        Date.now() - started.current > 8 * 60 * 60 * 1000;

      if (idleExpired || sessionExpired) {
        setError('Your admin session expired. Please sign in again.');
        signout();
      }
    }, 10000);

    return () => {
      clearInterval(interval);

      events.forEach((event) =>
        window.removeEventListener(event, touch),
      );
    };
  }, [phase, signout]);

  useEffect(() => {
    if (phase !== 'ready') return;

    const visible = () => {
      if (document.visibilityState === 'visible') inspect();
    };

    document.addEventListener('visibilitychange', visible);

    const interval = setInterval(inspect, 60000);

    return () => {
      document.removeEventListener('visibilitychange', visible);
      clearInterval(interval);
    };
  }, [phase, inspect]);

  async function login(event) {
    event.preventDefault();
    setBusy(true);
    setError('');

    try {
      const { error: loginError } =
        await supabase.auth.signInWithPassword({
          email,
          password,
        });

      setPassword('');

      if (loginError) throw loginError;

      await inspect();
    } catch {
      setError(
        'Sign-in failed. Check your credentials or try again later.',
      );
    } finally {
      setBusy(false);
    }
  }

  if (phase !== 'ready') {
    return (
      <main className="admin-login">
        <Link to="/" className="admin-home">
          ← Back to storefront
        </Link>

        <div className="login-panel">
          <img src="/images/logo.svg" alt="Bella Crochet" />

          <span className="eyebrow">
            <LockKeyhole size={14} />
            Private administration
          </span>

          {phase === 'unconfigured' ? (
            <>
              <h1>Connect your workspace.</h1>

              <p>
                The storefront preview is available. To enable the
                private dashboard, follow README.md and connect your
                Supabase project. There is no demo admin password.
              </p>

              <Link to="/" className="button">
                View storefront
              </Link>
            </>
          ) : phase === 'checking' ? (
            <p role="status">Verifying access…</p>
          ) : (
            <>
              <h1>Welcome back.</h1>

              <p>Sign in with your owner-approved admin account.</p>

              <form onSubmit={login}>
                <label>
                  Email
                  <input
                    type="email"
                    autoComplete="username"
                    required
                    value={email}
                    onChange={(event) =>
                      setEmail(event.target.value)
                    }
                  />
                </label>

                <label>
                  Password
                  <input
                    type="password"
                    autoComplete="current-password"
                    minLength={12}
                    maxLength={128}
                    required
                    value={password}
                    onChange={(event) =>
                      setPassword(event.target.value)
                    }
                  />
                </label>

                <button className="button" disabled={busy}>
                  {busy ? 'Signing in…' : 'Sign in'}
                </button>
              </form>

              <small>
                Account recovery is handled by the project owner.
              </small>
            </>
          )}

          {error && (
            <p role="alert" className="form-error">
              {error}
            </p>
          )}
        </div>
      </main>
    );
  }

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <Link to="/">
          <img src="/images/logo.svg" alt="Bella Crochet" />
        </Link>

        <span className="admin-label">PRIVATE WORKSPACE</span>

        <nav>
          {tabs.map(([id, label, Icon]) => (
            <button
              key={id}
              className={tab === id ? 'active' : ''}
              onClick={() => setTab(id)}
            >
              <Icon size={18} />
              {label}
            </button>
          ))}
        </nav>

        <Link className="store-link" to="/">
          <Eye size={17} />
          View storefront
        </Link>

        <button className="signout" onClick={signout}>
          <LogOut size={17} />
          Sign out
        </button>
      </aside>

      <div className="admin-body">
        <header className="admin-top">
          <div>
            <small>Bella Crochet / Workspace</small>
            <h1>{tabs.find((item) => item[0] === tab)?.[1]}</h1>
          </div>
        </header>

        <div className="admin-content">
          {error && <p className="form-error">{error}</p>}

          <AdminContent
            key={tab}
            tab={tab}
            identity={identity}
            signout={signout}
          />
        </div>
      </div>
    </div>
  );
}

function AdminContent({ tab, identity, signout }) {
  const [records, setRecords] = useState([]);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [stats, setStats] = useState(null);
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);
  const [filter, setFilter] = useState('');
  const [orderPrefix, setOrderPrefix] = useState('BC');

  const { refresh } = useShop();

  const load = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      if (tab === 'overview') {
        const [productRows, orderRows, supportRows] =
          await Promise.all([
            listAdmin('products'),
            listAdmin('orders'),
            listAdmin('support_requests'),
          ]);

        setStats({
          products: productRows.length,
          orders: orderRows.filter(
            (row) =>
              !['completed', 'cancelled'].includes(row.status),
          ).length,
          support: supportRows.filter(
            (row) => row.status !== 'closed',
          ).length,
        });

        setRecords(orderRows.slice(0, 6));
      } else {
        const table =
          tab === 'settings' ? 'admin_settings' : tab;

        const [
          rows,
          productRows,
          categoryRows,
          preferences,
        ] = await Promise.all([
          listAdmin(table),

          tab === 'orders'
            ? listAdmin('products')
            : Promise.resolve([]),

          tab === 'products'
            ? listAdmin('categories')
            : Promise.resolve([]),

          tab === 'orders'
            ? listAdmin('admin_settings')
            : Promise.resolve([]),
        ]);

        setRecords(rows);
        setProducts(productRows);
        setCategories(categoryRows);

        if (preferences[0]?.order_prefix) {
          setOrderPrefix(preferences[0].order_prefix);
        }
      }
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setLoading(false);
    }
  }, [tab]);

  useEffect(() => {
    load();
  }, [load]);

  async function save(record, id) {
    setBusy(true);
    setError('');

    try {
      await saveAdmin(
        tab === 'settings' ? 'admin_settings' : tab,
        record,
        id,
      );

      setEditing(null);
      setStatus('Saved successfully.');

      await load();

      if (['products', 'categories'].includes(tab)) {
        refresh();
      }
    } catch (saveError) {
      setError(saveError.message);
    } finally {
      setBusy(false);
    }
  }

  async function remove(row) {
    const resource =
      tab === 'orders'
        ? 'order'
        : tab === 'support_requests'
          ? 'support record'
          : 'record';

    if (
      !window.confirm(
        `Permanently delete this ${resource}? This cannot be undone.`,
      )
    ) {
      return;
    }

    setBusy(true);

    try {
      await deleteAdmin(tab, row.id);
      setStatus('Record deleted.');

      await load();

      if (['products', 'categories'].includes(tab)) {
        refresh();
      }
    } catch (deleteError) {
      setError(deleteError.message);
    } finally {
      setBusy(false);
    }
  }

  function start() {
    if (tab === 'products') {
      setEditing({
        record: {
          ...blankProduct,
          category_id: categories[0]?.id || 'keychains',
        },
        isNew: true,
      });
    }

    if (tab === 'categories') {
      setEditing({
        record: {
          id: '',
          slug: '',
          name: '',
          active: true,
          sort_order: 0,
        },
        isNew: true,
      });
    }

    if (tab === 'orders') {
      setEditing({
        record: {
          reference: `${orderPrefix}-${Date.now()
            .toString()
            .slice(-8)}`,
          customer_name: '',
          customer_phone: '',
          items: [],
          total: 0,
          status: 'confirmed',
          notes: '',
        },
        isNew: true,
      });
    }

    if (tab === 'support_requests') {
      setEditing({
        record: {
          subject: '',
          contact: '',
          notes: '',
          status: 'open',
        },
        isNew: true,
      });
    }
  }

  async function purge() {
    if (
      !window.confirm(
        'Delete completed/cancelled orders unchanged for 180 days and closed support records unchanged for 90 days? Confirm no business or legal retention requirement applies.',
      )
    ) {
      return;
    }

    setBusy(true);
    setError('');

    try {
      const orderCut = new Date(
        Date.now() - 180 * 86400000,
      ).toISOString();

      const supportCut = new Date(
        Date.now() - 90 * 86400000,
      ).toISOString();

      const orderResult = await supabase
        .from('orders')
        .delete()
        .in('status', ['completed', 'cancelled'])
        .lt('updated_at', orderCut)
        .select('id');

      if (orderResult.error) throw orderResult.error;

      const supportResult = await supabase
        .from('support_requests')
        .delete()
        .eq('status', 'closed')
        .lt('updated_at', supportCut)
        .select('id');

      if (supportResult.error) throw supportResult.error;

      setStatus(
        `Removed ${orderResult.data.length} old orders and ${supportResult.data.length} closed support records.`,
      );
    } catch {
      setError(
        'Retention action failed. Check your session before retrying.',
      );
    } finally {
      setBusy(false);
    }
  }

  const filtered = records.filter((row) =>
    String(
      row.name ||
        row.reference ||
        row.subject ||
        row.event ||
        '',
    )
      .toLowerCase()
      .includes(filter.toLowerCase()),
  );

  return (
    <>
      <div className="admin-toolbar">
        <p>
          {tab === 'overview'
            ? 'A little overview of your handmade business.'
            : tab === 'orders'
              ? 'Record confirmed WhatsApp orders here. Sending a cart does not create an order.'
              : tab === 'support_requests'
                ? 'Private notes for customer enquiries received through WhatsApp.'
                : tab === 'settings'
                  ? 'Business preferences and maintenance. Access policies are managed by the project owner.'
                  : tab === 'audit_events'
                    ? 'Activity metadata only. No customer messages or order contents are copied into this log.'
                    : 'Keep your collection up to date.'}
        </p>

        <button
          className="admin-icon"
          onClick={load}
          aria-label="Refresh records"
        >
          <RefreshCw size={18} />
        </button>
      </div>

      {status && (
        <p className="success" role="status">
          {status}
        </p>
      )}

      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}

      {loading ? (
        <p role="status">Loading private records…</p>
      ) : (
        <>
          {tab === 'overview' ? (
            <>
              <div className="stat-grid">
                {[
                  [Package, 'Listed pieces', stats?.products],
                  [ClipboardList, 'Active orders', stats?.orders],
                  [MessageCircle, 'Open enquiries', stats?.support],
                ].map(([Icon, name, value]) => (
                  <article key={name}>
                    <Icon />
                    <span>{name}</span>
                    <strong>{value}</strong>
                  </article>
                ))}
              </div>

              <h2>Recent orders</h2>

              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Reference</th>
                      <th>Status</th>
                      <th>Agreed amount</th>
                    </tr>
                  </thead>

                  <tbody>
                    {records.map((row) => (
                      <tr key={row.id}>
                        <td>{row.reference}</td>

                        <td>
                          <span className="badge">
                            {row.status}
                          </span>
                        </td>

                        <td>{money(row.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {!records.length && (
                  <p className="table-empty">
                    No orders recorded yet. Add a confirmed order
                    from the Orders tab.
                  </p>
                )}
              </div>
            </>
          ) : tab === 'settings' ? (
            <>
              <BusinessSettings
                record={records[0]}
                onSave={(record) => save(record, 1)}
                busy={busy}
              />

              <section className="admin-panel">
                <h2>Access and privacy</h2>

                <p>
                  Signed in as {identity}. Administrator
                  membership is enforced by database policies.
                </p>

                <p>
                  Admin sessions are kept in memory. The interface
                  signs out after 15 minutes of inactivity or 8
                  hours. The Supabase project’s token expiry and
                  rate limits must also be configured as described
                  in SECURITY.md.
                </p>

                <button
                  className="button secondary"
                  onClick={signout}
                >
                  End this session
                </button>
              </section>

              <section className="admin-panel">
                <h2>Retention maintenance</h2>

                <p>
                  Review and delete old records monthly:
                  completed/cancelled orders after 180 days and
                  closed support notes after 90 days without an
                  update. WhatsApp conversations are managed
                  separately.
                </p>

                <button
                  className="button secondary"
                  onClick={purge}
                  disabled={busy}
                >
                  Review & remove old records
                </button>
              </section>
            </>
          ) : (
            <>
              {tab !== 'audit_events' && (
                <div className="admin-list-actions">
                  <label className="admin-search">
                    Find a record
                    <input
                      type="search"
                      placeholder="Type a name or reference"
                      maxLength={100}
                      value={filter}
                      onChange={(event) =>
                        setFilter(event.target.value)
                      }
                    />
                  </label>

                  <button className="button" onClick={start}>
                    <Plus size={17} />

                    {tab === 'products'
                      ? 'Add product'
                      : tab === 'categories'
                        ? 'Add category'
                        : tab === 'orders'
                          ? 'Add order'
                          : 'Add enquiry'}
                  </button>
                </div>
              )}

              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      {tab === 'products' ? (
                        <>
                          <th>Piece</th>
                          <th>Price</th>
                          <th>Visibility</th>
                        </>
                      ) : tab === 'categories' ? (
                        <>
                          <th>Category</th>
                          <th>Identifier</th>
                          <th>Visibility</th>
                        </>
                      ) : tab === 'orders' ? (
                        <>
                          <th>Reference / Customer</th>
                          <th>Status</th>
                          <th>Agreed amount</th>
                        </>
                      ) : tab === 'support_requests' ? (
                        <>
                          <th>Subject</th>
                          <th>Status</th>
                          <th>Updated</th>
                        </>
                      ) : (
                        <>
                          <th>Action</th>
                          <th>Resource</th>
                          <th>Date</th>
                        </>
                      )}

                      {tab !== 'audit_events' && (
                        <th>Actions</th>
                      )}
                    </tr>
                  </thead>

                  <tbody>
                    {filtered.map((row) => (
                      <tr key={row.id}>
                        {tab === 'products' ? (
                          <>
                            <td>
                              <div className="admin-product-cell">
                                <img
                                  src={safeImage(row.images?.[0])}
                                  alt=""
                                />
                                {row.name}
                              </div>
                            </td>

                            <td>{money(row.price)}</td>

                            <td>
                              <span className="badge">
                                {row.active
                                  ? 'Published'
                                  : 'Hidden'}
                              </span>
                            </td>
                          </>
                        ) : tab === 'categories' ? (
                          <>
                            <td>{row.name}</td>
                            <td>{row.id}</td>
                            <td>
                              {row.active
                                ? 'Published'
                                : 'Hidden'}
                            </td>
                          </>
                        ) : tab === 'orders' ? (
                          <>
                            <td>
                              {row.reference}
                              <small>{row.customer_name}</small>
                            </td>

                            <td>
                              <span className="badge">
                                {row.status}
                              </span>
                            </td>

                            <td>{money(row.total)}</td>
                          </>
                        ) : tab === 'support_requests' ? (
                          <>
                            <td>{row.subject}</td>
                            <td>{row.status}</td>
                            <td>
                              {new Date(
                                row.updated_at,
                              ).toLocaleDateString()}
                            </td>
                          </>
                        ) : (
                          <>
                            <td>{row.event}</td>

                            <td>
                              {row.resource}
                              <small>{row.record_id}</small>
                            </td>

                            <td>
                              {new Date(
                                row.created_at,
                              ).toLocaleString()}
                            </td>
                          </>
                        )}

                        {tab !== 'audit_events' && (
                          <td>
                            <div className="table-actions">
                              <button
                                className="admin-icon"
                                aria-label={`Edit ${
                                  row.name ||
                                  row.reference ||
                                  row.subject
                                }`}
                                onClick={() =>
                                  setEditing({
                                    record: row,
                                    isNew: false,
                                  })
                                }
                              >
                                <Pencil size={16} />
                              </button>

                              <button
                                disabled={busy}
                                className="admin-icon danger"
                                aria-label={`Delete ${
                                  row.name ||
                                  row.reference ||
                                  row.subject
                                }`}
                                onClick={() => remove(row)}
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>

                {!filtered.length && (
                  <p className="table-empty">
                    No records to show.
                  </p>
                )}
              </div>

              <small className="muted">
                Showing up to 500 records. No customer data is
                exported or sent to analytics.
              </small>
            </>
          )}
        </>
      )}

      {editing && (
        <div className="modal-backdrop">
          <section
            className="admin-modal"
            role="dialog"
            aria-modal="true"
            aria-label={
              editing.isNew ? 'Add record' : 'Edit record'
            }
          >
            <button
              className="modal-close admin-icon"
              aria-label="Close editor"
              onClick={() => setEditing(null)}
              disabled={busy}
            >
              <X />
            </button>

            {error && (
              <p className="form-error" role="alert">
                {error}
              </p>
            )}

            <RecordEditor
              tab={tab}
              record={editing.record}
              isNew={editing.isNew}
              categories={categories}
              products={products}
              busy={busy}
              onSave={save}
              onCancel={() => setEditing(null)}
            />
          </section>
        </div>
      )}
    </>
  );
}

function BusinessSettings({ record, onSave, busy }) {
  const [form, setForm] = useState(
    record || {
      business_name: 'Bella Crochet',
      order_prefix: 'BC',
      fulfilment_note: '',
    },
  );

  return (
    <form
      className="admin-panel admin-form"
      onSubmit={(event) => {
        event.preventDefault();

        onSave({
          business_name: form.business_name,
          order_prefix: form.order_prefix,
          fulfilment_note: form.fulfilment_note,
        });
      }}
    >
      <h2>Business preferences</h2>

      <label>
        Business name
        <input
          required
          maxLength={100}
          value={form.business_name}
          onChange={(event) =>
            setForm({
              ...form,
              business_name: event.target.value,
            })
          }
        />
      </label>

      <label>
        Order reference prefix
        <input
          required
          pattern="[A-Z0-9-]{1,12}"
          maxLength={12}
          value={form.order_prefix}
          onChange={(event) =>
            setForm({
              ...form,
              order_prefix: event.target.value.toUpperCase(),
            })
          }
        />
      </label>

      <label>
        Internal fulfilment reminder
        <textarea
          maxLength={500}
          value={form.fulfilment_note}
          onChange={(event) =>
            setForm({
              ...form,
              fulfilment_note: event.target.value,
            })
          }
        />
      </label>

      <small>
        Public WhatsApp and Instagram are configured in the
        source/environment. The prefix and reminder are internal
        preferences for staff.
      </small>

      <button className="button" disabled={busy}>
        Save preferences
      </button>
    </form>
  );
}

function RecordEditor({
  tab,
  record,
  isNew,
  categories,
  products,
  busy,
  onSave,
  onCancel,
}) {
  const [f, setF] = useState(structuredClone(record));
  const [uploading, setUploading] = useState(false);
  const [err, setErr] = useState('');

  const root = useRef(null);
  const initialFocus = useRef(null);

  useEffect(() => {
    initialFocus.current = document.activeElement;

    root.current
      ?.querySelector('input,select,textarea,button')
      ?.focus();

    function key(event) {
      if (event.key === 'Escape' && !busy) {
        onCancel();
        return;
      }

      if (event.key === 'Tab') {
        const elements = Array.from(
          document
            .querySelector('.admin-modal')
            ?.querySelectorAll(
              'button:not(:disabled),input:not(:disabled),select,textarea,a[href]',
            ) || [],
        );

        const first = elements[0];
        const last = elements.at(-1);

        if (
          event.shiftKey &&
          document.activeElement === first
        ) {
          event.preventDefault();
          last?.focus();
        } else if (
          !event.shiftKey &&
          document.activeElement === last
        ) {
          event.preventDefault();
          first?.focus();
        }
      }
    }

    document.addEventListener('keydown', key);

    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', key);
      document.body.style.overflow = oldOverflow;
      initialFocus.current?.focus();
    };
  }, [busy, onCancel]);

  const set = (key, value) =>
    setF((previous) => ({
      ...previous,
      [key]: value,
    }));

  const field = (
    label,
    key,
    {
      type = 'text',
      max = 120,
      required = true,
    } = {},
  ) => (
    <label>
      {label}
      <input
        type={type}
        required={required}
        maxLength={type === 'text' ? max : undefined}
        min={type === 'number' ? 0 : undefined}
        step={type === 'number' ? '0.01' : undefined}
        value={f[key] ?? ''}
        onChange={(event) =>
          set(
            key,
            type === 'number'
              ? Number(event.target.value)
              : event.target.value,
          )
        }
      />
    </label>
  );

  async function upload(event) {
    setErr('');

    const files = Array.from(event.target.files || []);

    if (f.images.length + files.length > 8) {
      setErr('A product can have up to 8 photographs.');
      return;
    }

    setUploading(true);

    try {
      for (const file of files) {
        const url = await uploadProductImage(file);

        setF((previous) => ({
          ...previous,
          images: [...previous.images, url],
        }));
      }
    } catch (uploadError) {
      setErr(uploadError.message);
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  }

  function submit(event) {
    event.preventDefault();
    setErr('');

    let data;

    if (tab === 'products') {
      if (!f.images.length) {
        setErr('Add at least one photograph.');
        return;
      }

      data = Object.fromEntries(
        Object.keys(blankProduct).map((key) => [
          key,
          f[key],
        ]),
      );

      data.custom_size = false;

      data.sizes = f.sizes.includes('Standard')
        ? ['Standard']
        : ['Small', 'Medium', 'Large'];

      if (!data.custom_colour) {
        data.colours = data.colours.filter(
          (colour) => colour !== 'Custom colour',
        );
      } else if (
        !data.colours.includes('Custom colour')
      ) {
        data.colours = [
          ...data.colours,
          'Custom colour',
        ];
      }

      if (!data.colours.length || !data.sizes.length) {
        setErr('At least one colour and size are required.');
        return;
      }

      const sizePrices = {};

      for (const sizeName of data.sizes) {
        const value =
          sizeName === 'Standard'
            ? f.price
            : f.size_prices?.[sizeName];

        if (
          value === '' ||
          value === null ||
          value === undefined
        ) {
          setErr(`Enter a price for ${sizeName}.`);
          return;
        }

        const amount = Number(value);

        if (
          !Number.isFinite(amount) ||
          amount < 0 ||
          amount > 1000000 ||
          Math.abs(
            amount * 100 - Math.round(amount * 100),
          ) > 0.000001
        ) {
          setErr(
            `${sizeName} needs a price between 0 and 1,000,000 PKR with at most two decimal places.`,
          );
          return;
        }

        sizePrices[sizeName] = amount;
      }

      data.size_prices = sizePrices;

      data.price = data.sizes.includes('Standard')
        ? sizePrices.Standard
        : Math.min(...Object.values(sizePrices));
    } else if (tab === 'categories') {
      data = {
        id: f.id,
        slug: f.slug,
        name: f.name,
        active: f.active,
        sort_order: Number(f.sort_order),
      };
    } else if (tab === 'orders') {
      if (!f.items.length) {
        setErr('Add at least one item.');
        return;
      }

      data = {
        reference: f.reference,
        customer_name: f.customer_name,
        customer_phone: f.customer_phone,
        items: f.items,
        total: Number(f.total),
        status: f.status,
        notes: f.notes,
      };
    } else {
      data = {
        subject: f.subject,
        contact: f.contact,
        notes: f.notes,
        status: f.status,
      };
    }

    onSave(data, isNew ? null : record.id);
  }

  return (
    <form
      ref={root}
      className="admin-form"
      onSubmit={submit}
    >
      <span className="eyebrow">
        {isNew ? 'New' : 'Edit'}{' '}
        {tab === 'support_requests'
          ? 'enquiry'
          : tab.replace('_', ' ')}
      </span>

      <h2>
        {tab === 'products'
          ? 'Give a piece its place.'
          : tab === 'categories'
            ? 'Organise your collection.'
            : tab === 'orders'
              ? 'A confirmed order.'
              : 'A little customer care.'}
      </h2>

      {tab === 'products' ? (
        <>
          {field('Product name', 'name')}

          <div className="form-row">
            <label>
              Unique product ID
              <input
                required
                pattern="[a-z0-9][a-z0-9-]{0,79}"
                maxLength={80}
                disabled={!isNew}
                value={f.id}
                onChange={(event) => {
                  const value = slugify(event.target.value);
                  set('id', value);
                  set('slug', value);
                }}
                placeholder="e.g. lavender-flower"
              />
            </label>

            <label>
              URL slug
              <input
                required
                pattern="[a-z0-9][a-z0-9-]{0,79}"
                value={f.slug}
                maxLength={80}
                onChange={(event) =>
                  set('slug', slugify(event.target.value))
                }
              />
            </label>
          </div>

          <div className="form-row">
            <label>
              Category
              <select
                value={f.category_id}
                onChange={(event) =>
                  set('category_id', event.target.value)
                }
              >
                {categories.map((category) => (
                  <option
                    value={category.id}
                    key={category.id}
                  >
                    {category.name}
                    {category.active ? '' : ' (hidden)'}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label>
            Description
            <textarea
              required
              maxLength={3000}
              rows={3}
              value={f.description}
              onChange={(event) =>
                set('description', event.target.value)
              }
            />
          </label>

          <fieldset>
            <legend>Product photographs</legend>

            <small>
              Only public product photos. No customer images,
              payment screenshots or private documents.
            </small>

            <div className="upload-preview">
              {f.images.map((src, index) => (
                <div key={src}>
                  <img
                    src={safeImage(src)}
                    alt={`Product photograph ${index + 1}`}
                  />

                  <button
                    type="button"
                    aria-label={`Remove photograph ${index + 1}`}
                    onClick={() =>
                      set(
                        'images',
                        f.images.filter(
                          (_, itemIndex) =>
                            index !== itemIndex,
                        ),
                      )
                    }
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>

            <label className="upload-label">
              <ImagePlus size={18} />

              {uploading
                ? 'Processing photograph…'
                : 'Upload photos (JPG, PNG, WebP · up to 5 MB each)'}

              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                disabled={uploading}
                onChange={upload}
              />
            </label>

            <small>
              Photos are resized and re-encoded before upload
              to remove embedded metadata. Uploaded product
              photos are public.
            </small>
          </fieldset>

          <label>
            Colours, separated with commas
            <input
              value={f.colours.join(', ')}
              maxLength={1500}
              onChange={(event) =>
                set(
                  'colours',
                  event.target.value
                    .split(',')
                    .map((value) => value.trimStart()),
                )
              }
              onBlur={() =>
                set(
                  'colours',
                  f.colours
                    .map((value) => value.trim())
                    .filter(Boolean),
                )
              }
            />
          </label>

          <label>
            Pricing type
            <select
              value={
                f.sizes.includes('Standard')
                  ? 'fixed'
                  : 'sizes'
              }
              onChange={(event) => {
                set(
                  'sizes',
                  event.target.value === 'fixed'
                    ? ['Standard']
                    : ['Small', 'Medium', 'Large'],
                );

                set('custom_size', false);
              }}
            >
              <option value="fixed">
                One fixed price — no size options
              </option>

              <option value="sizes">
                Separate prices — Small, Medium, Large
              </option>
            </select>
          </label>

          {f.sizes.includes('Standard') ? (
            <label>
              Fixed price — PKR
              <input
                type="number"
                min="0"
                max="1000000"
                step="0.01"
                required
                value={f.price ?? ''}
                onChange={(event) =>
                  set(
                    'price',
                    event.target.value === ''
                      ? ''
                      : Number(event.target.value),
                  )
                }
              />
            </label>
          ) : (
            <section aria-label="Prices by size">
              <h3>Prices by size</h3>

              <p>
                Enter a price in PKR for each size. The
                lowest is the starting price.
              </p>

              <div className="form-row">
                {['Small', 'Medium', 'Large'].map(
                  (sizeName) => (
                    <label key={sizeName}>
                      {sizeName} price — PKR

                      <input
                        type="number"
                        min="0"
                        max="1000000"
                        step="0.01"
                        required
                        value={
                          f.size_prices?.[sizeName] ?? ''
                        }
                        onChange={(event) =>
                          set('size_prices', {
                            ...(f.size_prices || {}),
                            [sizeName]:
                              event.target.value === ''
                                ? ''
                                : Number(event.target.value),
                          })
                        }
                      />
                    </label>
                  ),
                )}
              </div>
            </section>
          )}

          <div className="check-row">
            <label>
              <input
                type="checkbox"
                checked={f.custom_colour}
                onChange={(event) =>
                  set('custom_colour', event.target.checked)
                }
              />
              Allow custom colour
            </label>
          </div>

          <div className="form-row">
            <label>
              Stock type
              <select
                value={f.stock_mode}
                onChange={(event) =>
                  set('stock_mode', event.target.value)
                }
              >
                <option value="made_to_order">
                  Made to order
                </option>

                <option value="ready_stock">
                  Ready stock
                </option>
              </select>
            </label>

            {f.stock_mode === 'ready_stock' &&
              field(
                'Available stock',
                'stock_quantity',
                { type: 'number' },
              )}
          </div>

          {field('Making time', 'making_time', {
            max: 300,
          })}

          <label>
            Product details
            <textarea
              maxLength={1500}
              value={f.details}
              onChange={(event) =>
                set('details', event.target.value)
              }
            />
          </label>

          <label>
            Care instructions
            <textarea
              maxLength={1000}
              value={f.care}
              onChange={(event) =>
                set('care', event.target.value)
              }
            />
          </label>

          <div className="check-row">
            <label>
              <input
                type="checkbox"
                checked={f.active}
                onChange={(event) =>
                  set('active', event.target.checked)
                }
              />
              Published
            </label>

            <label>
              <input
                type="checkbox"
                checked={f.featured}
                onChange={(event) =>
                  set('featured', event.target.checked)
                }
              />
              Featured on Home
            </label>
          </div>

          {field('Display order', 'sort_order', {
            type: 'number',
          })}
        </>
      ) : tab === 'categories' ? (
        <>
          {field('Category name', 'name', {
            max: 80,
          })}

          <label>
            Category ID
            <input
              required
              disabled={!isNew}
              pattern="[a-z0-9][a-z0-9-]{0,79}"
              maxLength={80}
              value={f.id}
              onChange={(event) => {
                const value = slugify(event.target.value);
                set('id', value);
                set('slug', value);
              }}
            />
          </label>

          {field('Slug', 'slug', {
            max: 80,
          })}

          {field('Display order', 'sort_order', {
            type: 'number',
          })}

          <label className="checkbox">
            <input
              type="checkbox"
              checked={f.active}
              onChange={(event) =>
                set('active', event.target.checked)
              }
            />
            Published (hiding this category also hides its
            products)
          </label>
        </>
      ) : tab === 'orders' ? (
        <>
          <p className="muted">
            Record only what is needed to fulfil a confirmed
            order. Do not store card details, passwords or
            identity documents.
          </p>

          {field('Order reference', 'reference', {
            max: 80,
          })}

          {field('Customer name', 'customer_name')}

          {field(
            'Contact number (optional)',
            'customer_phone',
            {
              max: 25,
              required: false,
            },
          )}

          <label>
            Status
            <select
              value={f.status}
              onChange={(event) =>
                set('status', event.target.value)
              }
            >
              {[
                'confirmed',
                'making',
                'ready',
                'dispatched',
                'completed',
                'cancelled',
              ].map((status) => (
                <option key={status}>{status}</option>
              ))}
            </select>
          </label>

          <fieldset>
            <legend>Ordered pieces</legend>

            <select
              value=""
              onChange={(event) => {
                const product = products.find(
                  (item) => item.id === event.target.value,
                );

                if (product) {
                  set('items', [
                    ...f.items,
                    {
                      product_id: product.id,
                      name: product.name,
                      quantity: 1,
                      unit_price: product.price,
                      selection: '',
                    },
                  ]);

                  set(
                    'total',
                    Number(f.total) + Number(product.price),
                  );
                }
              }}
            >
              <option value="">Add a product…</option>

              {products.map((product) => (
                <option
                  key={product.id}
                  value={product.id}
                >
                  {product.name}
                </option>
              ))}
            </select>

            {f.items.map((item, index) => (
              <div
                className="order-edit-item"
                key={index}
              >
                <strong>{item.name}</strong>

                <div className="form-row">
                  <label>
                    Quantity
                    <input
                      type="number"
                      required
                      min="1"
                      max="999"
                      value={item.quantity}
                      onChange={(event) =>
                        set(
                          'items',
                          f.items.map((row, rowIndex) =>
                            rowIndex === index
                              ? {
                                  ...row,
                                  quantity: Number(
                                    event.target.value,
                                  ),
                                }
                              : row,
                          ),
                        )
                      }
                    />
                  </label>

                  <label>
                    Agreed unit price
                    <input
                      type="number"
                      required
                      min="0"
                      max="1000000"
                      step="0.01"
                      value={item.unit_price}
                      onChange={(event) =>
                        set(
                          'items',
                          f.items.map((row, rowIndex) =>
                            rowIndex === index
                              ? {
                                  ...row,
                                  unit_price: Number(
                                    event.target.value,
                                  ),
                                }
                              : row,
                          ),
                        )
                      }
                    />
                  </label>
                </div>

                <label>
                  Colour / size / custom detail
                  <input
                    maxLength={500}
                    value={item.selection}
                    onChange={(event) =>
                      set(
                        'items',
                        f.items.map((row, rowIndex) =>
                          rowIndex === index
                            ? {
                                ...row,
                                selection:
                                  event.target.value,
                              }
                            : row,
                        ),
                      )
                    }
                  />
                </label>

                <button
                  className="text-link"
                  type="button"
                  onClick={() =>
                    set(
                      'items',
                      f.items.filter(
                        (_, rowIndex) =>
                          rowIndex !== index,
                      ),
                    )
                  }
                >
                  Remove piece
                </button>
              </div>
            ))}
          </fieldset>

          {field(
            'Final agreed total in PKR (including delivery if agreed)',
            'total',
            {
              type: 'number',
            },
          )}

          <button
            className="text-link"
            type="button"
            onClick={() =>
              set(
                'total',
                f.items.reduce(
                  (sum, item) =>
                    sum + item.quantity * item.unit_price,
                  0,
                ),
              )
            }
          >
            Recalculate from items
          </button>

          <label>
            Fulfilment notes
            <textarea
              maxLength={2000}
              value={f.notes}
              onChange={(event) =>
                set('notes', event.target.value)
              }
              placeholder="Record only necessary agreed delivery or making details."
            />
          </label>
        </>
      ) : (
        <>
          {field('Subject', 'subject', {
            max: 160,
          })}

          {field('Contact (optional)', 'contact', {
            max: 160,
            required: false,
          })}

          <label>
            Status
            <select
              value={f.status}
              onChange={(event) =>
                set('status', event.target.value)
              }
            >
              {['open', 'waiting', 'closed'].map(
                (status) => (
                  <option key={status}>{status}</option>
                ),
              )}
            </select>
          </label>

          <label>
            Private support notes
            <textarea
              maxLength={3000}
              rows={5}
              value={f.notes}
              onChange={(event) =>
                set('notes', event.target.value)
              }
              placeholder="Summarise the issue and follow-up. Do not paste full conversations or payment information."
            />
          </label>
        </>
      )}

      {err && (
        <p className="form-error" role="alert">
          {err}
        </p>
      )}

      <div className="editor-actions">
        <button
          className="button secondary"
          type="button"
          disabled={busy || uploading}
          onClick={onCancel}
        >
          Cancel
        </button>

        <button
          className="button"
          disabled={busy || uploading}
        >
          {busy ? 'Saving…' : 'Save changes'}
        </button>
      </div>
    </form>
  );
}
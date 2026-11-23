import { useEffect, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";

import { API_BASE_URL, apiFetch } from "../api";
import { useAuth } from "../authContext";
import SettingsMenu from "../components/SettingsMenu";

function useDeliveryRequest(path) {
  const { token } = useAuth();
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState(null);

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      let data;
      let status;
      try {
        const response = await apiFetch(path, { signal: controller.signal, cache: "no-store" }, token);
        status = response.status;
        if (response.ok) data = await response.json();
      } catch {
        status = 0;
      }
      if (!controller.signal.aborted) setResult({ path, token, attempt, status, data });
    }
    load();
    return () => controller.abort();
  }, [path, token, attempt]);

  // When the URL, account or retry changes, hide earlier results immediately.
  const isCurrent = result?.path === path && result.token === token && result.attempt === attempt;
  return { result: isCurrent ? result : null, retry: () => setAttempt((value) => value + 1) };
}

function deliveriesPath(page) {
  return page > 1 ? `/deliveries?page=${page}` : "/deliveries";
}

function useDeliveriesPageNumber() {
  const [searchParams] = useSearchParams();
  const page = Number(searchParams.get("page"));
  return Number.isSafeInteger(page) && page > 0 ? page : 1;
}

function DeliveriesLayout({ children }) {
  return (
    <div className="plush-shell min-h-screen pb-12">
      <div className="auth-orb auth-orb--blue" aria-hidden="true" />
      <div className="auth-orb auth-orb--pink" aria-hidden="true" />
      <div className="auth-orb auth-orb--violet" aria-hidden="true" />
      <header className="plush-nav mx-auto mt-4 flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-5">
        <Link to="/home">
          <img src="/senderplus-logo.png" alt="Sender+ home" className="h-8 w-auto" />
        </Link>
        <nav className="flex items-center gap-2 text-sm sm:gap-3" aria-label="Main navigation">
          <Link to="/home" className="plush-nav-link">Home</Link>
          <Link to="/track" className="plush-nav-link">Track</Link>
          <SettingsMenu />
        </nav>
      </header>
      <main className="mx-auto mt-4 w-full max-w-6xl px-4 sm:px-5">
        <section className="plush-card space-y-5 p-6 md:p-8">
          {children}
        </section>
      </main>
    </div>
  );
}

function DeliveryError({ message, retry }) {
  return (
    <div className="space-y-2">
      <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm text-rose-700">{message}</p>
      {retry && <button type="button" onClick={retry} className="plush-nav-link text-sm">Retry</button>}
    </div>
  );
}

function DeliveryDate({ timestamp }) {
  return <time dateTime={timestamp}>{new Date(timestamp).toLocaleString()}</time>;
}

export function MyDeliveriesPage() {
  const page = useDeliveriesPageNumber();
  const { result, retry } = useDeliveryRequest(`/deliveries?page=${page}`);
  const list = Array.isArray(result?.data?.results) ? result.data : null;

  return (
    <DeliveriesLayout>
      <div>
        <h1 className="text-3xl font-bold text-slate-900 md:text-4xl">My deliveries</h1>
        <p className="mt-2 text-sm text-slate-600">
          Deliveries booked from this account appear here. Older or guest bookings may be missing. You can check their status with a tracking code.
        </p>
      </div>

      {!result && <p role="status" className="text-sm text-slate-600">Loading deliveries…</p>}
      {result && !list && (
        <>
          <DeliveryError message="Could not load your deliveries. Please try again." retry={retry} />
          {page > 1 && <Link to="/deliveries" className="plush-nav-link text-sm">Back to first page</Link>}
        </>
      )}
      {list?.results.length === 0 && (
        <div className="space-y-2 text-sm">
          <p className="text-slate-600">You don’t have any deliveries yet.</p>
          <Link to="/submit" className="plush-nav-link">Send a package</Link>
        </div>
      )}
      {list?.results.length > 0 && (
        <ul className="divide-y divide-slate-200/80">
          {list.results.map((delivery) => (
            <li key={delivery.tracking_id} className="py-4">
              <Link
                className="block rounded-xl px-3 py-2 hover:bg-sky-50 focus-visible:outline focus-visible:outline-sky-500"
                to={{
                  pathname: `/deliveries/${encodeURIComponent(delivery.tracking_id)}`,
                  search: page > 1 ? `?page=${page}` : "",
                }}
              >
                <h2 className="font-semibold text-slate-900">{delivery.package_name}</h2>
                <p className="break-all font-mono text-xs text-slate-600">{delivery.tracking_id}</p>
                <p className="mt-1 text-sm text-slate-700">{delivery.status_display || delivery.status}</p>
                <p className="mt-1 text-xs text-slate-600">Booked <DeliveryDate timestamp={delivery.created_at} /></p>
              </Link>
            </li>
          ))}
        </ul>
      )}
      {(list?.previous || list?.next) && (
        <nav className="flex flex-wrap items-center gap-3 text-sm" aria-label="Delivery pages">
          {list.previous && <Link to={deliveriesPath(page - 1)} className="plush-nav-link">Previous</Link>}
          <span className="text-slate-600" aria-current="page">Page {page}</span>
          {list.next && <Link to={deliveriesPath(page + 1)} className="plush-nav-link">Next</Link>}
        </nav>
      )}
    </DeliveriesLayout>
  );
}

function DeliveryFields({ title, fields }) {
  return (
    <section className="plush-fieldset">
      <h2 className="mb-3 font-semibold text-slate-900">{title}</h2>
      <dl className="space-y-2">
        {fields.filter(([, value]) => value != null && value !== "").map(([label, value]) => (
          <div key={label}>
            <dt className="plush-label">{label}</dt>
            <dd className="break-words text-sm text-slate-700">{value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

export function DeliveryDetailPage() {
  const { trackingId } = useParams();
  const page = useDeliveriesPageNumber();
  const { result, retry } = useDeliveryRequest(`/deliveries/${encodeURIComponent(trackingId)}`);
  const delivery = result?.data?.tracking_id === trackingId ? result.data : null;
  const photoUrl = delivery?.photo_url;

  return (
    <DeliveriesLayout>
      <Link to={deliveriesPath(page)} className="plush-nav-link inline-block text-sm">Back to My deliveries</Link>
      <h1 className="text-3xl font-bold text-slate-900 md:text-4xl">{delivery?.package_name || "Delivery details"}</h1>

      {!result && <p role="status" className="text-sm text-slate-600">Loading delivery details…</p>}
      {result?.status === 404 && <DeliveryError message="Delivery not found." />}
      {result && result.status !== 404 && !delivery && (
        <DeliveryError message="Could not load the delivery details. Please try again." retry={retry} />
      )}
      {delivery && (
        <>
          <div className="space-y-1 border-b border-slate-200/80 pb-4 text-sm text-slate-700">
            <p>Tracking ID <span className="break-all font-mono font-semibold">{delivery.tracking_id}</span></p>
            <p className="font-semibold">{delivery.status_display || delivery.status}</p>
            <p>Booked <DeliveryDate timestamp={delivery.created_at} /></p>
            <p>Last updated <DeliveryDate timestamp={delivery.updated_at} /></p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <DeliveryFields title="Sender" fields={[
              ["Name", delivery.sender_name],
              ["Phone", delivery.sender_phone],
              ["Email", delivery.sender_email],
              ["Address", delivery.sender_address],
            ]} />
            <DeliveryFields title="Recipient" fields={[
              ["Name", delivery.recipient_name],
              ["Phone", delivery.recipient_phone],
              ["Email", delivery.recipient_email],
              ["Address", delivery.recipient_address],
            ]} />
          </div>
          <DeliveryFields title="Package details" fields={[
            ["Type", delivery.package_type],
            ["Weight", `${delivery.weight} kg`],
            ["Estimated value", delivery.value],
            ["Description", delivery.description],
          ]} />
          {photoUrl && (
            <img
              src={/^https?:\/\//i.test(photoUrl) ? photoUrl : `${API_BASE_URL}${photoUrl}`}
              alt="Uploaded package"
              referrerPolicy="no-referrer"
              className="max-h-64 w-full max-w-md rounded-2xl border border-slate-200 object-cover"
            />
          )}
        </>
      )}
    </DeliveriesLayout>
  );
}

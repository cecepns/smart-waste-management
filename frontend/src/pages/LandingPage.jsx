import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Leaf, LogIn, Recycle, RotateCcw, X, Zap, UserPlus } from "lucide-react";
import { CircleMarker, MapContainer, Popup, TileLayer } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { api, apiBase } from "../api/client";
import heroImage from "../assets/landing-hero.png";
import logo from "../assets/logo.png";

const principles = [
  {
    key: "reduce",
    title: "Reduce (Kurangi)",
    desc: "Kurangi penggunaan barang berpotensi menjadi sampah dengan langkah sederhana setiap hari.",
    detail:
      "Mulai dari membawa tas belanja sendiri, memakai botol minum isi ulang, menghindari produk sekali pakai, dan memilih kemasan besar/refill. Prinsip ini menekan timbulan sampah dari sumbernya.",
    Icon: Zap,
  },
  {
    key: "reuse",
    title: "Reuse (Gunakan Kembali)",
    desc: "Gunakan kembali barang yang masih layak pakai agar umur manfaatnya lebih panjang.",
    detail:
      "Contohnya menggunakan wadah bekas sebagai tempat penyimpanan, memanfaatkan ulang botol kaca, atau mendonasikan barang yang masih layak. Reuse menurunkan kebutuhan barang baru dan mengurangi sampah.",
    Icon: RotateCcw,
  },
  {
    key: "recycle",
    title: "Recycle (Daur Ulang)",
    desc: "Pilah sampah berdasarkan jenisnya agar bisa diolah kembali menjadi produk baru.",
    detail:
      "Pisahkan organik, anorganik, dan residu. Sampah organik bisa dijadikan kompos, sedangkan plastik/kertas/logam dapat disalurkan ke bank sampah atau mitra daur ulang. Ini membantu menciptakan ekonomi sirkular di lingkungan.",
    Icon: Recycle,
  },
];

const PALOPO_CENTER = [-2.9925, 120.1969];
const mapStatusColors = {
  Bersih: "#22c55e",
  Sedang: "#eab308",
  Penuh: "#ef4444",
};

/** Halaman depan publik: ajakan masuk atau daftar */
export function LandingPage() {
  const [activePrinciple, setActivePrinciple] = useState(null);
  const [mapReports, setMapReports] = useState([]);
  const selectedPrinciple = principles.find((item) => item.key === activePrinciple) || null;
  const mapMarkers = useMemo(
    () =>
      mapReports
        .map((row) => ({
          ...row,
          lat: Number(row.latitude),
          lng: Number(row.longitude),
          fill: mapStatusColors[row.status] || "#64748b",
        }))
        .filter((row) => Number.isFinite(row.lat) && Number.isFinite(row.lng)),
    [mapReports]
  );

  useEffect(() => {
    api
      .get("/public/reports-map")
      .then((res) => setMapReports(res.data.data || []))
      .catch(() => setMapReports([]));
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <header className="border-b border-slate-200/80 bg-white/90 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 md:px-6">
          <img src={logo} alt="Smart Waste Management" className="h-14 md:h-16 w-auto object-contain object-left md:h-11" />
          <div className="flex shrink-0 items-center gap-2">
            <Link
              to="/login"
              className="rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 md:px-4"
            >
              Masuk
            </Link>
            <Link
              to="/register"
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 md:px-4"
            >
              <UserPlus size={18} />
              Daftar
            </Link>
          </div>
        </div>
      </header>

      <main className="relative flex flex-1 flex-col overflow-hidden">
        <div className="pointer-events-none absolute inset-0" />
        <div className="relative mx-auto flex w-full max-w-6xl flex-1 flex-col justify-center px-4 py-12 md:px-6 md:py-16">
          <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2 lg:gap-12">
            <div className="order-2 min-w-0 lg:order-1">
              <div className="inline-flex w-fit items-center gap-2 rounded-full bg-emerald-100/90 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-800 ring-1 ring-emerald-200/80">
                <Leaf size={14} className="shrink-0" />
                Pengelolaan sampah cerdas
              </div>
              <h1 className="mt-5 max-w-2xl text-3xl font-bold leading-tight tracking-tight text-slate-900 md:text-4xl lg:text-[2.75rem]">
                Wujudkan Lingkungan Bersih dengan Prinsip 3R
              </h1>
              <p className="mt-4 max-w-xl text-base leading-relaxed text-slate-600 md:text-lg">
                Laporkan, Kurangi, Gunakan Kembali, dan Daur Ulang Sampah di Sekitarmu. Satu tindakan kecil, dampak besar bagi bumi
                kita.
              </p>

              <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center">
                <Link
                  to="/login"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-6 py-3.5 text-base font-semibold text-white shadow-lg shadow-slate-900/15 transition hover:bg-slate-800"
                >
                  <LogIn size={20} />
                  Laporkan sekarang
                </Link>
                <Link
                  to="/register"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-emerald-600 bg-white px-6 py-3.5 text-base font-semibold text-emerald-700 transition hover:bg-emerald-50"
                >
                  Buat akun warga
                  <ArrowRight size={20} />
                </Link>
              </div>

              <p className="mt-10 text-sm text-slate-500">
                Belum punya akses? Daftar sebagai warga untuk mulai melapor. Akun admin dibuat oleh pengelola sistem.
              </p>
            </div>

            <div className="order-1 flex justify-center lg:order-2 lg:justify-end">
              <div className="relative w-full max-w-md lg:max-w-none">
                <img
                  src={heroImage}
                  alt="Ilustrasi masyarakat membersihkan lingkungan dan mendaur ulang sampah"
                  className="mx-auto h-auto w-full max-h-[min(68vh,560px)] object-contain object-bottom drop-shadow-md select-none"
                  decoding="async"
                />
              </div>
            </div>
          </div>
        </div>

        <section className="relative mx-auto w-full max-w-6xl px-4 pb-10 md:px-6 md:pb-14">
          <div className="rounded-3xl border border-slate-200 bg-white/90 p-4 shadow-sm backdrop-blur-sm md:p-6">
            <div className="mb-4">
              <h2 className="text-center text-2xl font-bold text-emerald-800 md:text-3xl">Peta Seluruh Laporan</h2>
              <p className="mt-2 text-center text-sm text-slate-500 md:text-base">
                Pantau sebaran laporan warga secara real-time di sekitar Kota Palopo.
              </p>
            </div>
            <MapContainer
              center={PALOPO_CENTER}
              zoom={12}
              scrollWheelZoom
              style={{ height: "420px", width: "100%", borderRadius: "16px", zIndex: 0 }}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {mapMarkers.map((item) => (
                <CircleMarker
                  key={item.id}
                  center={[item.lat, item.lng]}
                  radius={10}
                  pathOptions={{
                    color: "#fff",
                    weight: 2,
                    fillColor: item.fill,
                    fillOpacity: 0.9,
                  }}
                >
                  <Popup>
                    <div className="max-w-[220px] text-sm">
                      <p className="font-semibold">{item.location_name}</p>
                      <p>Status titik: {item.status}</p>
                      <p>Status laporan: {item.report_status}</p>
                      {item.photo_url && (
                        <a
                          href={`${apiBase}${item.photo_url}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-2 block overflow-hidden rounded ring-1 ring-slate-200 transition hover:opacity-90"
                        >
                          <img
                            src={`${apiBase}${item.photo_url}`}
                            alt={item.location_name}
                            className="h-24 w-full object-cover"
                          />
                        </a>
                      )}
                    </div>
                  </Popup>
                </CircleMarker>
              ))}
            </MapContainer>
          </div>
        </section>

        <section className="relative mx-auto w-full max-w-6xl px-4 pb-14 md:px-6 md:pb-20">
          <div className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm backdrop-blur-sm md:p-8">
            <h2 className="text-center text-2xl font-bold text-emerald-800 md:text-4xl">Kenali Prinsip 3R</h2>
            <p className="mt-2 text-center text-sm text-slate-500 md:text-base">Langkah kecil yang mengubah masa depan bumi.</p>

            <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-3 md:gap-5">
              {principles.map(({ key, title, desc, Icon }) => (
                <article key={key} className="rounded-2xl border border-slate-100 bg-slate-50/60 p-5 ring-1 ring-slate-100">
                  <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                    <Icon size={22} />
                  </div>
                  <h3 className="mt-4 text-lg font-semibold text-emerald-800">{title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">{desc}</p>
                  <button
                    type="button"
                    className="mt-5 rounded-lg border border-emerald-300 px-4 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-50"
                    onClick={() => setActivePrinciple(key)}
                  >
                    Baca selengkapnya
                  </button>
                </article>
              ))}
            </div>
          </div>
        </section>
      </main>

      {selectedPrinciple && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-900/50 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-xl ring-1 ring-slate-200 md:p-6">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
                  <selectedPrinciple.Icon size={20} />
                </div>
                <h3 className="text-lg font-semibold text-slate-900">{selectedPrinciple.title}</h3>
              </div>
              <button
                type="button"
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
                onClick={() => setActivePrinciple(null)}
                aria-label="Tutup detail"
              >
                <X size={18} />
              </button>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-slate-600 md:text-base">{selectedPrinciple.detail}</p>
            <div className="mt-6 flex justify-end">
              <button
                type="button"
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
                onClick={() => setActivePrinciple(null)}
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      <footer className="border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-500">
        Kota Palopo — Smart Waste Management. Copyright: Ihwan Arifuddin (PKA 2026)
      </footer>
    </div>
  );
}

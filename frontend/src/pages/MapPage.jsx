import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import dayjs from "dayjs";
import "dayjs/locale/id";
import { CircleMarker, MapContainer, Popup, TileLayer } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { Leaf, CloudSun } from "lucide-react";
import { api, apiBase } from "../api/client";

dayjs.locale("id");

/** Warna titik sesuai status (tanpa Google Maps / tanpa API key berbayar) */
const statusColors = {
  Bersih: "#22c55e",
  Sedang: "#eab308",
  Penuh: "#ef4444",
};

const DEFAULT_CENTER = [-2.9925, 120.1969];

export function MapPage({ compact = false, token }) {
  const [locations, setLocations] = useState([]);
  const [weather, setWeather] = useState("—");
  const [clock, setClock] = useState(() => dayjs().format("dddd, DD MMMM YYYY · HH:mm"));

  useEffect(() => {
    const tick = () => setClock(dayjs().format("dddd, DD MMMM YYYY · HH:mm"));
    const id = setInterval(tick, 60000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    axios
      .get("https://api.open-meteo.com/v1/forecast?latitude=-2.99&longitude=120.19&current=temperature_2m,weather_code")
      .then((res) => setWeather(`${res.data.current.temperature_2m}°C`))
      .catch(() => setWeather("Tidak tersedia"));
  }, []);

  useEffect(() => {
    if (!token) return;
    api
      .get("/locations?page=1&perPage=10")
      .then((res) => setLocations(res.data.data))
      .catch(() => setLocations([]));
  }, [token]);

  const mapHeight = compact ? 360 : 520;

  const markers = useMemo(
    () =>
      locations.map((item) => ({
        ...item,
        lat: Number(item.latitude),
        lng: Number(item.longitude),
        fill: statusColors[item.status] || "#64748b",
      })),
    [locations]
  );

  if (!token) return <div className="rounded-xl bg-white p-6 text-sm">Silakan login untuk melihat peta.</div>;

  return (
    <div className="space-y-4">
      <section
        className={`overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-600 via-emerald-500 to-teal-600 p-5 text-white shadow-md ring-1 ring-emerald-400/40 ${compact ? "py-4" : ""}`}
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex min-w-0 gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
              <Leaf className="text-white" size={22} strokeWidth={2} />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-emerald-100">Kebersihan & lingkungan</p>
              <p className="mt-1 text-lg font-bold leading-snug md:text-xl">{clock}</p>
              <p className="mt-2 max-w-xl text-sm text-emerald-50/95">
                Pantau titik sampah dan dukung kota lebih bersih bersama warga.
              </p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2 rounded-xl bg-white/15 px-4 py-3 text-sm backdrop-blur-sm md:text-base">
            <CloudSun className="shrink-0 text-emerald-50" size={22} />
            <div>
              <p className="text-[10px] font-medium uppercase tracking-wide text-emerald-100/90">Cuaca hari ini</p>
              <p className="font-semibold">{weather}</p>
            </div>
          </div>
        </div>
      </section>

      <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
        <h2 className="mb-3 text-lg font-semibold text-slate-800">Peta Titik Pemantauan</h2>
        <MapContainer
          center={DEFAULT_CENTER}
          zoom={12}
          style={{ height: mapHeight, width: "100%", borderRadius: "12px", zIndex: 0 }}
          scrollWheelZoom
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {markers.map((item) => (
            <CircleMarker
              key={item.id}
              center={[item.lat, item.lng]}
              radius={11}
              pathOptions={{
                color: "#fff",
                weight: 2,
                fillColor: item.fill,
                fillOpacity: 0.9,
              }}
            >
              <Popup>
                <div className="max-w-[220px] text-sm">
                  <p className="font-semibold">{item.name}</p>
                  <p>Status: {item.status}</p>
                  <p>Update: {dayjs(item.last_updated).format("DD/MM/YYYY HH:mm")}</p>
                  {item.photo_url && (
                    <a
                      href={`${apiBase}${item.photo_url}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 block overflow-hidden rounded ring-1 ring-slate-200 transition hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-emerald-500"
                      title="Buka gambar di tab baru"
                    >
                      <img
                        src={`${apiBase}${item.photo_url}`}
                        alt={item.name}
                        className="h-20 w-full object-cover"
                      />
                    </a>
                  )}
                </div>
              </Popup>
            </CircleMarker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
}

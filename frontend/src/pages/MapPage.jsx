import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import dayjs from "dayjs";
import "dayjs/locale/id";
import { CircleMarker, MapContainer, Popup, TileLayer, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { Leaf, CloudSun, Maximize2, Minimize2, Check, ShieldAlert, Truck, Sparkles } from "lucide-react";
import { api, apiBase } from "../api/client";
import toast from "react-hot-toast";

dayjs.locale("id");

// Optimized marker radius to prevent huge markers when zoomed out
const getMarkerRadius = (zoom) => {
  if (zoom >= 18) return 11;
  if (zoom >= 16) return 9;
  if (zoom >= 14) return 7;
  if (zoom >= 12) return 5;
  if (zoom >= 10) return 3.5;
  return 2.5; // very sharp small dots when zoomed out
};

function MapZoomTracker({ onChange }) {
  useMapEvents({
    zoomend: (e) => {
      onChange(e.target.getZoom());
    },
  });
  return null;
}

const DEFAULT_CENTER = [-2.9925, 120.1969];

export function MapPage({ compact = false, token, me }) {
  const [locations, setLocations] = useState([]);
  const [weather, setWeather] = useState("—");
  const [clock, setClock] = useState(() => dayjs().format("dddd, DD MMMM YYYY · HH:mm"));
  const [zoom, setZoom] = useState(12);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);

  const fetchLocations = () => {
    if (!token) return;
    api
      .get("/locations?all=true")
      .then((res) => setLocations(res.data.data))
      .catch(() => setLocations([]));
  };

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
    fetchLocations();
  }, [token]);

  // Handle status update directly from the map popup
  const handleUpdateStatus = async (locationId, newStatus) => {
    if (updatingId) return;
    setUpdatingId(locationId);
    const loadingId = toast.loading(`Mengubah status ke ${newStatus}...`);
    try {
      await api.patch(`/locations/${locationId}/status`, { status: newStatus });
      toast.success(`Status berhasil diubah ke ${newStatus}`, { id: loadingId });
      fetchLocations();
    } catch (err) {
      toast.error(err.response?.data?.message || "Gagal memperbarui status", { id: loadingId });
    } finally {
      setUpdatingId(null);
    }
  };

  const getMarkerStyle = (item) => {
    // Fill color corresponds to the current status
    let fillColor = "#64748b"; // gray default
    if (item.status === "Bersih") fillColor = "#22c55e"; // Green
    else if (item.status === "Laporan Masuk") fillColor = "#eab308"; // Yellow
    else if (item.status === "Penuh") fillColor = "#ef4444"; // Red
    else if (item.status === "Sedang Ditangani") fillColor = "#3b82f6"; // Blue

    // Border color/weight corresponds to the Facility Type
    let color = "#ffffff";
    let weight = 2;
    let dashArray = null;

    if (item.type === "TPS") {
      color = "#8b5cf6"; // Purple outline
      weight = 3.5;
    } else if (item.type === "TPA") {
      color = "#1e293b"; // Slate black outline
      weight = 3.5;
    } else if (item.type === "TPS3R") {
      color = "#06b6d4"; // Cyan outline
      weight = 3.5;
      dashArray = "3, 3";
    }

    return {
      fillColor,
      color,
      weight,
      dashArray,
      fillOpacity: 0.9,
    };
  };

  const markers = useMemo(
    () =>
      locations.map((item) => ({
        ...item,
        lat: Number(item.latitude),
        lng: Number(item.longitude),
        style: getMarkerStyle(item),
      })),
    [locations]
  );

  if (!token) return <div className="rounded-xl bg-white p-6 text-sm">Silakan login untuk melihat peta.</div>;

  const mapHeight = isFullscreen ? "100%" : compact ? 360 : 520;

  const mapContent = (
    <div className={`relative ${isFullscreen ? "h-full w-full flex flex-col bg-white" : ""}`}>
      {/* Map Header inside Fullscreen Mode */}
      {isFullscreen && (
        <div className="flex shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4 py-3 shadow-sm z-[1000]">
          <div className="flex items-center gap-2">
            <Leaf className="text-emerald-600" size={20} />
            <span className="font-bold text-slate-800 text-sm md:text-base">Peta Interaktif Sompah Palopo</span>
          </div>
          <button
            onClick={() => setIsFullscreen(false)}
            className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200"
          >
            <Minimize2 size={14} /> Tutup Layar Penuh
          </button>
        </div>
      )}

      {/* Map Legend (Overlay Card) */}
      <div className={`absolute bottom-6 left-6 z-[1000] max-w-xs rounded-2xl bg-white/95 p-4 shadow-lg ring-1 ring-slate-200 backdrop-blur-md text-xs space-y-3 transition-opacity ${isFullscreen ? "opacity-100" : "opacity-90 hover:opacity-100"}`}>
        <div className="font-bold text-slate-800 text-[13px] border-b pb-1.5 flex items-center gap-1.5">
          <Sparkles size={14} className="text-teal-600 animate-pulse" />
          <span>Keterangan Peta</span>
        </div>
        
        {/* Status Indicators */}
        <div className="space-y-1.5">
          <p className="font-semibold text-slate-500 uppercase tracking-wider text-[9px]">Status Kebersihan (Warna Titik)</p>
          <div className="grid grid-cols-2 gap-x-2 gap-y-1">
            <div className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-full bg-[#22c55e] border border-white" />
              <span>Bersih</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-full bg-[#eab308] border border-white" />
              <span>Laporan Masuk</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-full bg-[#ef4444] border border-white" />
              <span>Penuh / Kritis</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-full bg-[#3b82f6] border border-white" />
              <span>Sedang Ditangani</span>
            </div>
          </div>
        </div>

        {/* Location Type Indicators */}
        <div className="space-y-1.5 pt-1.5 border-t">
          <p className="font-semibold text-slate-500 uppercase tracking-wider text-[9px]">Jenis Lokasi (Garis Lingkar)</p>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="h-3.5 w-3.5 rounded-full border-[3px] border-slate-300 bg-white" />
              <span>Titik Sampah (Warga)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-3.5 w-3.5 rounded-full border-[3px] border-violet-500 bg-white" />
              <span>TPS (Sementara)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-3.5 w-3.5 rounded-full border-[3px] border-slate-800 bg-white" />
              <span>TPA (Akhir)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-3.5 w-3.5 rounded-full border-[3px] border-cyan-500 border-dashed bg-white" />
              <span>TPS3R (Daur Ulang)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Fullscreen Trigger Button inside Map */}
      {!isFullscreen && (
        <button
          onClick={() => setIsFullscreen(true)}
          className="absolute top-4 right-4 z-[1000] inline-flex items-center justify-center rounded-lg bg-white p-2 text-slate-700 shadow hover:bg-slate-50 ring-1 ring-slate-200"
          title="Tampilkan Layar Penuh"
        >
          <Maximize2 size={18} />
        </button>
      )}

      {/* Leaflet Map */}
      <div className="flex-1 min-h-0 relative z-0">
        <MapContainer
          center={DEFAULT_CENTER}
          zoom={12}
          style={{ height: mapHeight, width: "100%", borderRadius: isFullscreen ? "0px" : "12px" }}
          scrollWheelZoom
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapZoomTracker onChange={setZoom} />
          {markers.map((item) => (
            <CircleMarker
              key={item.id}
              center={[item.lat, item.lng]}
              radius={getMarkerRadius(zoom)}
              pathOptions={{
                color: item.style.color,
                weight: item.style.weight,
                dashArray: item.style.dashArray,
                fillColor: item.style.fillColor,
                fillOpacity: item.style.fillOpacity,
              }}
            >
              <Popup>
                <div className="max-w-[240px] text-xs space-y-2">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{item.type || "Titik Sampah"}</span>
                    <p className="font-bold text-slate-900 text-sm mt-0.5">{item.name}</p>
                  </div>
                  
                  <div className="flex flex-wrap gap-1">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                      item.status === "Bersih"
                        ? "bg-emerald-100 text-emerald-800"
                        : item.status === "Laporan Masuk"
                        ? "bg-amber-100 text-amber-900"
                        : item.status === "Penuh"
                        ? "bg-rose-100 text-rose-800"
                        : "bg-blue-100 text-blue-800"
                    }`}>
                      Status: {item.status}
                    </span>
                  </div>

                  <p className="text-[10px] text-slate-500">Update: {dayjs(item.last_updated).format("DD/MM/YYYY HH:mm")}</p>
                  {item.notes && <p className="text-slate-600 bg-slate-50 p-1.5 rounded border border-slate-100 italic">"{item.notes}"</p>}
                  
                  {item.photo_url && (
                    <a
                      href={`${apiBase}${item.photo_url}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 block overflow-hidden rounded border hover:opacity-95 transition"
                      title="Buka gambar di tab baru"
                    >
                      <img
                        src={`${apiBase}${item.photo_url}`}
                        alt={item.name}
                        className="h-24 w-full object-cover"
                      />
                    </a>
                  )}

                  {/* Role-based fast validation tools */}
                  {me && me.role !== "warga" && (
                    <div className="pt-2 border-t mt-2 space-y-1.5">
                      <p className="font-semibold text-slate-500 text-[10px]">Aksi Cepat Status:</p>
                      <div className="flex flex-wrap gap-1">
                        {/* Pengawas & Admin actions */}
                        {(me.role === "pengawas" || me.role === "admin") && (
                          <>
                            {item.status !== "Penuh" && (
                              <button
                                onClick={() => handleUpdateStatus(item.id, "Penuh")}
                                disabled={updatingId === item.id}
                                className="flex items-center gap-1 rounded bg-rose-600 px-2 py-1 text-[10px] font-semibold text-white hover:bg-rose-700 disabled:opacity-50"
                              >
                                <ShieldAlert size={10} /> Valid/Penuh
                              </button>
                            )}
                            {item.status !== "Bersih" && (
                              <button
                                onClick={() => handleUpdateStatus(item.id, "Bersih")}
                                disabled={updatingId === item.id}
                                className="flex items-center gap-1 rounded bg-emerald-600 px-2 py-1 text-[10px] font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                              >
                                <Check size={10} /> Bersih / Selesai
                              </button>
                            )}
                          </>
                        )}

                        {/* Armada & Admin actions */}
                        {(me.role === "armada" || me.role === "admin") && (
                          <>
                            {item.status !== "Sedang Ditangani" && item.status !== "Bersih" && (
                              <button
                                onClick={() => handleUpdateStatus(item.id, "Sedang Ditangani")}
                                disabled={updatingId === item.id}
                                className="flex items-center gap-1 rounded bg-blue-600 px-2 py-1 text-[10px] font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                              >
                                <Truck size={10} /> Tangani
                              </button>
                            )}
                            {item.status === "Sedang Ditangani" && (
                              <button
                                onClick={() => handleUpdateStatus(item.id, "Bersih")}
                                disabled={updatingId === item.id}
                                className="flex items-center gap-1 rounded bg-emerald-600 px-2 py-1 text-[10px] font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                              >
                                <Check size={10} /> Selesai
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </Popup>
            </CircleMarker>
          ))}
        </MapContainer>
      </div>
    </div>
  );

  // If in fullscreen, render in absolute fixed container
  if (isFullscreen) {
    return (
      <div className="fixed inset-0 z-[9999] h-screen w-screen bg-slate-900">
        {mapContent}
      </div>
    );
  }

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
              <p className="mt-2 max-w-xl text-sm text-emerald-50/95 font-medium">
                Pantau sebaran titik sampah di wilayah Palopo. Dukung kota bersih bebas timbunan sampah.
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
        <h2 className="mb-3 text-lg font-semibold text-slate-800">Peta Titik Pemantauan Sompah</h2>
        {mapContent}
      </div>
    </div>
  );
}

import { useEffect, useMemo, useRef, useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import { ArrowRight, Leaf, LogIn, Recycle, RotateCcw, X, Zap, UserPlus, ShieldAlert, CheckCircle2, AlertTriangle, HelpCircle, MapPin } from "lucide-react";
import { CircleMarker, MapContainer, Popup, TileLayer, useMap, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import Select from "react-select";
import { api, apiBase } from "../api/client";
import heroImage from "../assets/hero-image.jpeg";
import logo from "../assets/logo.png";
import dayjs from "dayjs";
import toast from "react-hot-toast";

const principles = [
  {
    key: "reduce",
    title: "Reduce (Kurangi)",
    desc: "Kurangi penggunaan barang berpotensi menjadi sampah dengan langkah sederhana setiap hari.",
    detail:
      "Mulai dari membawa tas belanja sendiri, memakai botol minum isi ulang, menghindari produk sekali pakai, dan memilih kemasan besar/refill. Prinsip ini menekan timbulan sampah dari sumbernya.",
    Icon: Zap,
    color: "from-amber-400 to-orange-500",
  },
  {
    key: "reuse",
    title: "Reuse (Gunakan Kembali)",
    desc: "Gunakan kembali barang yang masih layak pakai agar umur manfaatnya lebih panjang.",
    detail:
      "Contohnya menggunakan wadah bekas sebagai tempat penyimpanan, memanfaatkan ulang botol kaca, atau mendonasikan barang yang masih layak. Reuse menurunkan kebutuhan barang baru dan mengurangi sampah.",
    Icon: RotateCcw,
    color: "from-blue-400 to-indigo-600",
  },
  {
    key: "recycle",
    title: "Recycle (Daur Ulang)",
    desc: "Pilah sampah berdasarkan jenisnya agar bisa diolah kembali menjadi produk baru.",
    detail:
      "Pisahkan organik, anorganik, dan residu. Sampah organik bisa dijadikan kompos, sedangkan plastik/kertas/logam dapat disalurkan ke bank sampah atau mitra daur ulang. Ini membantu menciptakan ekonomi sirkular di lingkungan.",
    Icon: Recycle,
    color: "from-emerald-400 to-teal-600",
  },
];

const PALOPO_CENTER = [-2.9925, 120.1969];

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

function MapController({ targetMarker }) {
  const map = useMap();

  useEffect(() => {
    if (targetMarker && targetMarker.lat && targetMarker.lng && targetMarker.isValidCoord) {
      map.flyTo([targetMarker.lat, targetMarker.lng], 17, {
        animate: true,
        duration: 1.2,
      });
    }
  }, [targetMarker, map]);

  return null;
}

// Helper to distribute markers with identical coordinates in a small circle around the center point
const getProcessedMarkers = (rawLocations, getMarkerStyle) => {
  const coordGroups = {};

  return rawLocations
    .filter((loc) => loc.latitude != null && loc.longitude != null)
    .map((item) => {
      const rawLat = Number(item.latitude);
      const rawLng = Number(item.longitude);

      const isValidCoord = Math.abs(rawLat) > 0.001 && Math.abs(rawLng) > 0.001;

      if (!isValidCoord) {
        return {
          ...item,
          lat: rawLat,
          lng: rawLng,
          rawLat,
          rawLng,
          isValidCoord: false,
          style: getMarkerStyle(item),
        };
      }

      const key = `${rawLat.toFixed(5)},${rawLng.toFixed(5)}`;
      if (!coordGroups[key]) {
        coordGroups[key] = 0;
      }
      const indexInGroup = coordGroups[key];
      coordGroups[key] += 1;

      let finalLat = rawLat;
      let finalLng = rawLng;

      if (indexInGroup > 0) {
        // Distribute overlapping markers in small spiral ring (~12-20 meters)
        const ring = Math.floor(indexInGroup / 6) + 1;
        const angle = (indexInGroup % 6) * ((2 * Math.PI) / 6) + ring * 0.4;
        const radius = 0.00012 * ring; // ~13m per ring

        finalLat = rawLat + radius * Math.cos(angle);
        finalLng = rawLng + (radius * Math.sin(angle)) / Math.cos((rawLat * Math.PI) / 180);
      }

      return {
        ...item,
        lat: finalLat,
        lng: finalLng,
        rawLat,
        rawLng,
        isValidCoord: true,
        style: getMarkerStyle(item),
      };
    });
};

const customSelectStyles = {
  control: (base, state) => ({
    ...base,
    borderRadius: "0.75rem",
    borderColor: state.isFocused ? "#0d9488" : "#cbd5e1",
    boxShadow: state.isFocused ? "0 0 0 2px rgba(13, 148, 136, 0.2)" : "none",
    "&:hover": {
      borderColor: "#0d9488",
    },
    padding: "2px 4px",
    fontSize: "0.875rem",
    backgroundColor: "#ffffff",
  }),
  option: (base, state) => ({
    ...base,
    backgroundColor: state.isSelected ? "#0d9488" : state.isFocused ? "#f0fdfa" : "white",
    color: state.isSelected ? "white" : "#1e293b",
    cursor: "pointer",
    fontSize: "0.875rem",
    padding: "8px 12px",
  }),
  menu: (base) => ({
    ...base,
    borderRadius: "0.75rem",
    overflow: "hidden",
    boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
    zIndex: 9999,
  }),
};

export function LandingPage() {
  const [activePrinciple, setActivePrinciple] = useState(null);
  const [locations, setLocations] = useState([]);
  const [zoom, setZoom] = useState(12);
  const [wasteLogs, setWasteLogs] = useState([]);
  const [selectedOption, setSelectedOption] = useState(null);
  const markerRefs = useRef({});
  const selectedPrinciple = principles.find((item) => item.key === activePrinciple) || null;

  useEffect(() => {
    api
      .get("/public/reports-map")
      .then((res) => setLocations(res.data.data || []))
      .catch(() => setLocations([]));

    api
      .get("/public/waste-logs")
      .then((res) => setWasteLogs(res.data || []))
      .catch(() => setWasteLogs([]));
  }, []);

  const getMarkerStyle = (item) => {
    let fillColor = "#64748b"; // fallback
    if (item.status === "Bersih") fillColor = "#22c55e"; // Hijau
    else if (item.status === "Laporan Masuk") fillColor = "#eab308"; // Kuning
    else if (item.status === "Penuh") fillColor = "#ef4444"; // Merah
    else if (item.status === "Sedang Ditangani") fillColor = "#3b82f6"; // Biru

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

    return { fillColor, color, weight, dashArray, fillOpacity: 0.9 };
  };

  const markers = useMemo(
    () => getProcessedMarkers(locations, getMarkerStyle),
    [locations]
  );

  const selectOptions = useMemo(() => {
    return markers.map((item, index) => ({
      value: item.id,
      orderIndex: index + 1,
      label: `${index + 1}. ${item.location_name || item.name || "Titik Sampah"} (${item.status})`,
      item,
    }));
  }, [markers]);

  const targetMarker = useMemo(() => {
    if (!selectedOption) return null;
    return markers.find((m) => m.id === selectedOption.value) || null;
  }, [selectedOption, markers]);

  const handleSelectLocation = (option) => {
    setSelectedOption(option);
    if (option && option.item) {
      const marker = markers.find((m) => m.id === option.item.id);
      if (marker && marker.isValidCoord) {
        setTimeout(() => {
          if (markerRefs.current[marker.id]) {
            markerRefs.current[marker.id].openPopup();
          }
        }, 300);
      } else {
        toast.error("Titik koordinat tidak valid (0, 0)");
      }
    }
  };

  const formatOptionLabel = ({ item, orderIndex }, { context }) => {
    let statusBadgeColor = "bg-slate-100 text-slate-700";
    if (item.status === "Bersih") statusBadgeColor = "bg-emerald-100 text-emerald-800";
    else if (item.status === "Laporan Masuk") statusBadgeColor = "bg-amber-100 text-amber-900";
    else if (item.status === "Penuh") statusBadgeColor = "bg-rose-100 text-rose-800";
    else if (item.status === "Sedang Ditangani") statusBadgeColor = "bg-blue-100 text-blue-800";

    const name = item.location_name || item.name || "Titik Sampah";

    if (context === "value") {
      return (
        <div className="flex items-center gap-2 text-xs md:text-sm">
          <span className="font-bold text-slate-800">{orderIndex}. {name}</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${statusBadgeColor}`}>
            {item.status}
          </span>
        </div>
      );
    }

    return (
      <div className="flex items-center justify-between gap-2 py-0.5">
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-slate-900 truncate">
              {orderIndex}. {name}
            </span>
            <span className="text-[10px] text-slate-400 font-mono">
              ({item.type || "Titik Sampah"})
            </span>
          </div>
          <span className="text-[11px] text-slate-500 truncate">
            Koordinat: {Number(item.latitude).toFixed(4)}, {Number(item.longitude).toFixed(4)}
          </span>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${statusBadgeColor}`}>
            {item.status}
          </span>
        </div>
      </div>
    );
  };

  // Dynamic statistics calculation
  const stats = useMemo(() => {
    const total = locations.filter(loc => loc.type === "Titik Sampah").length;
    const resolved = locations.filter(loc => loc.type === "Titik Sampah" && loc.status === "Bersih").length;
    const pending = locations.filter(loc => loc.type === "Titik Sampah" && (loc.status === "Laporan Masuk" || loc.status === "Penuh" || loc.status === "Sedang Ditangani")).length;
    
    // Facility counts
    const tps = locations.filter(loc => loc.type === "TPS").length;
    const tpa = locations.filter(loc => loc.type === "TPA").length;
    const tps3r = locations.filter(loc => loc.type === "TPS3R").length;

    return { total, resolved, pending, tps, tpa, tps3r };
  }, [locations]);

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-800 antialiased font-sans">
      {/* Premium Header */}
      <header className="sticky top-0 z-[1001] border-b border-slate-100 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 md:px-6">
          <RouterLink to="/" className="flex items-center gap-2">
            <img src={logo} alt="SOMPAH PALOPO" className="h-12 md:h-14 w-auto object-contain object-left" />
          </RouterLink>
          <div className="flex shrink-0 items-center gap-3">
            <RouterLink
              to="/login"
              className="rounded-xl px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition"
            >
              Masuk
            </RouterLink>
            <RouterLink
              to="/register"
              className="inline-flex items-center gap-1.5 rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-bold text-white shadow-md shadow-teal-600/10 hover:bg-teal-700 transition transform active:scale-95"
            >
              <UserPlus size={16} />
              Daftar
            </RouterLink>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="relative flex flex-1 flex-col overflow-hidden">
        <div className="relative mx-auto flex w-full max-w-7xl flex-1 flex-col justify-center px-4 py-12 md:px-6 md:py-20">
          <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-12">
            {/* Left Content */}
            <div className="order-2 min-w-0 lg:order-1 lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full bg-teal-50 px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider text-teal-800 ring-1 ring-teal-100/90">
                <Leaf size={14} className="text-teal-600 animate-spin-slow" />
                <span>Pengelolaan Sampah Palopo Cerdas</span>
              </div>
              
              <h1 className="text-4xl font-extrabold leading-tight tracking-tight text-slate-900 md:text-5xl lg:text-6xl bg-gradient-to-r from-teal-800 to-emerald-700 bg-clip-text text-transparent">
                Wujudkan Lingkungan Bersih & Terkendali
              </h1>
              
              <p className="max-w-2xl text-base leading-relaxed text-slate-600 md:text-lg">
                Sompah Palopo menghubungkan Warga, Pengawas Lingkungan, dan Petugas Kebersihan secara real-time untuk memantau, melaporkan, dan mengangkut tumpukan sampah secara presisi.
              </p>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center pt-2">
                <RouterLink
                  to="/login"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-955 bg-teal-600 px-6 py-3.5 text-base font-bold text-white shadow-lg shadow-teal-600/20 hover:bg-teal-700 transition transform hover:-translate-y-0.5"
                >
                  <LogIn size={18} />
                  Laporkan Tumpukan Sampah
                </RouterLink>
                <RouterLink
                  to="/register"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-6 py-3.5 text-base font-semibold text-slate-700 shadow-sm hover:bg-slate-50 hover:text-slate-900 transition"
                >
                  Registrasi Akun Warga
                  <ArrowRight size={18} />
                </RouterLink>
              </div>

              <div className="pt-4 grid grid-cols-3 gap-4 border-t border-slate-200/80">
                <div>
                  <p className="text-2xl font-black text-teal-700">{stats.total}</p>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Total Titik Sampah</p>
                </div>
                <div>
                  <p className="text-2xl font-black text-emerald-600">{stats.resolved}</p>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Terselesaikan</p>
                </div>
                <div>
                  <p className="text-2xl font-black text-purple-600">{stats.tps + stats.tpa + stats.tps3r}</p>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Fasilitas Kebersihan</p>
                </div>
              </div>
            </div>

            {/* Right Illustration */}
            <div className="order-1 flex justify-center lg:order-2 lg:col-span-5">
              <div className="relative w-full max-w-sm lg:max-w-none">
                <div className="absolute -inset-4 rounded-3xl bg-gradient-to-tr from-teal-100 to-emerald-100 opacity-70 blur-2xl" />
                <img
                  src={heroImage}
                  alt="Ilustrasi Sompah Palopo"
                  className="relative mx-auto h-auto w-full max-h-[460px] object-contain drop-shadow-xl hover:scale-[1.02] transition duration-300"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Map Section */}
        <section className="relative mx-auto w-full max-w-7xl px-4 pb-12 md:px-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-xl shadow-slate-100 md:p-6 space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-extrabold text-slate-900 md:text-2xl flex items-center gap-2">
                  <MapPin className="text-teal-600" size={24} />
                  Peta Sebaran Laporan Palopo
                </h2>
                <p className="text-sm text-slate-500 mt-1">
                  Pantau {markers.length} titik laporan penimbunan sampah serta lokasi fasilitas (TPS, TPA, TPS3R) secara real-time.
                </p>
              </div>

              {/* Quick map stats legend */}
              <div className="flex flex-wrap gap-2 text-xs">
                <span className="inline-flex items-center gap-1.5 rounded-lg border border-purple-200 bg-purple-50 px-2.5 py-1 font-semibold text-purple-800">
                  TPS: {stats.tps}
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-lg border border-cyan-200 bg-cyan-50 px-2.5 py-1 font-semibold text-cyan-800">
                  TPS3R: {stats.tps3r}
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-slate-100 px-2.5 py-1 font-semibold text-slate-800">
                  TPA: {stats.tpa}
                </span>
              </div>
            </div>

            {/* Quick Search Dropdown Bar */}
            <div className="w-full">
              <Select
                value={selectedOption}
                onChange={handleSelectLocation}
                options={selectOptions}
                formatOptionLabel={formatOptionLabel}
                styles={customSelectStyles}
                placeholder="🔍 Cari titik / nama jalan / status lokasi..."
                isClearable
                isSearchable
                noOptionsMessage={() => "Titik lokasi tidak ditemukan"}
              />
            </div>

            <div className="relative overflow-hidden rounded-2xl border border-slate-100 z-0">
              {/* Map Legend (Overlay Card) */}
              <div className="absolute bottom-6 left-6 z-[1000] max-w-[200px] rounded-xl bg-white/95 p-3 shadow-md border border-slate-100 backdrop-blur-sm text-[10px] space-y-2">
                <p className="font-bold text-slate-800 border-b pb-1">Tipe Titik Peta</p>
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-[#ef4444]" />
                    <span>Titik Kritis (Penuh)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-[#eab308]" />
                    <span>Laporan Masuk (Kuning)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-[#3b82f6]" />
                    <span>Sedang Ditangani</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-[#22c55e]" />
                    <span>Bersih (Hijau)</span>
                  </div>
                </div>
              </div>

              <MapContainer
                center={PALOPO_CENTER}
                zoom={12}
                scrollWheelZoom
                style={{ height: "420px", width: "100%" }}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <MapZoomTracker onChange={setZoom} />
                <MapController targetMarker={targetMarker} />
                {markers.map((item) => (
                  <CircleMarker
                    key={item.id}
                    ref={(el) => {
                      if (el) markerRefs.current[item.id] = el;
                    }}
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
                      <div className="max-w-[200px] text-xs space-y-1.5">
                        <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">{item.type || "Titik Sampah"}</span>
                        <p className="font-bold text-slate-900">{item.location_name || item.name}</p>
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-[9px] font-semibold ${
                          item.status === "Bersih"
                            ? "bg-emerald-100 text-emerald-800"
                            : item.status === "Laporan Masuk"
                            ? "bg-amber-100 text-amber-900"
                            : item.status === "Penuh"
                            ? "bg-rose-100 text-rose-800"
                            : "bg-blue-100 text-blue-800"
                        }`}>
                          Kondisi: {item.status}
                        </span>
                        {item.photo_url && (
                          <a
                            href={`${apiBase}${item.photo_url}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-1 block overflow-hidden rounded border"
                          >
                            <img
                              src={`${apiBase}${item.photo_url}`}
                              alt={item.location_name}
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
        </section>

        {/* Daily Waste Generation Chart */}
        <section className="relative mx-auto w-full max-w-7xl px-4 pb-12 md:px-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-100 md:p-8">
            <div className="mb-6">
              <h2 className="text-xl font-extrabold text-slate-900 md:text-2xl">Grafik Timbulan Sampah Harian</h2>
              <p className="text-sm text-slate-500 mt-1">
                Visualisasi timbulan volume sampah harian di Kota Palopo yang dicatat oleh Dinas Lingkungan Hidup.
              </p>
            </div>
            
            {/* SVG Chart Implementation */}
            {(() => {
              if (wasteLogs.length === 0) {
                return (
                  <div className="flex h-48 items-center justify-center text-sm text-slate-400 font-medium bg-slate-50/50 rounded-2xl border border-dashed">
                    Belum ada data timbulan sampah untuk ditampilkan.
                  </div>
                );
              }

              const width = 800;
              const height = 300;
              const paddingLeft = 60;
              const paddingRight = 30;
              const paddingTop = 20;
              const paddingBottom = 40;

              const chartWidth = width - paddingLeft - paddingRight;
              const chartHeight = height - paddingTop - paddingBottom;

              const amounts = wasteLogs.map((d) => Number(d.amount_kg));
              const maxAmount = Math.max(...amounts, 10);
              const minAmount = 0;

              const points = wasteLogs.map((d, index) => {
                const x = paddingLeft + (index / Math.max(wasteLogs.length - 1, 1)) * chartWidth;
                const y = paddingTop + chartHeight - ((Number(d.amount_kg) - minAmount) / (maxAmount - minAmount)) * chartHeight;
                return { x, y, data: d };
              });

              let linePath = "";
              if (points.length > 0) {
                linePath = `M ${points[0].x} ${points[0].y} ` + points.slice(1).map((p) => `L ${p.x} ${p.y}`).join(" ");
              }

              let areaPath = "";
              if (points.length > 0) {
                areaPath = `${linePath} L ${points[points.length - 1].x} ${paddingTop + chartHeight} L ${points[0].x} ${paddingTop + chartHeight} Z`;
              }

              const yTicks = 4;
              const yTicksValues = Array.from({ length: yTicks + 1 }, (_, i) => minAmount + (maxAmount - minAmount) * (i / yTicks));

              return (
                <div className="w-full overflow-x-auto">
                  <svg viewBox={`0 0 ${width} ${height}`} className="w-full min-w-[600px] h-auto overflow-visible select-none">
                    <defs>
                      <linearGradient id="chart-gradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#0d9488" stopOpacity="0.25" />
                        <stop offset="100%" stopColor="#0d9488" stopOpacity="0.00" />
                      </linearGradient>
                    </defs>

                    {/* Grid lines */}
                    {yTicksValues.map((val, i) => {
                      const y = paddingTop + chartHeight - ((val - minAmount) / (maxAmount - minAmount)) * chartHeight;
                      return (
                        <g key={i}>
                          <line
                            x1={paddingLeft}
                            y1={y}
                            x2={width - paddingRight}
                            y2={y}
                            stroke="#f1f5f9"
                            strokeWidth="1.5"
                            strokeDasharray="4 4"
                          />
                          <text
                            x={paddingLeft - 10}
                            y={y + 4}
                            textAnchor="end"
                            className="text-[10px] font-bold text-slate-400 font-sans"
                          >
                            {Math.round(val).toLocaleString("id-ID")} kg
                          </text>
                        </g>
                      );
                    })}

                    {/* X axis labels (Dates) */}
                    {points.map((p, i) => {
                      const step = Math.ceil(wasteLogs.length / 7) || 1;
                      if (i % step !== 0 && i !== wasteLogs.length - 1) return null;

                      const dateStr = dayjs(p.data.log_date).format("DD MMM");
                      return (
                        <text
                          key={i}
                          x={p.x}
                          y={height - paddingBottom + 20}
                          textAnchor="middle"
                          className="text-[10px] font-bold text-slate-400 font-sans"
                        >
                          {dateStr}
                        </text>
                      );
                    })}

                    {/* Area under the line */}
                    {areaPath && <path d={areaPath} fill="url(#chart-gradient)" />}

                    {/* Line chart */}
                    {linePath && (
                      <path
                        d={linePath}
                        fill="none"
                        stroke="#0d9488"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="drop-shadow-[0_2px_4px_rgba(13,148,136,0.3)]"
                      />
                    )}

                    {/* Circular Points */}
                    {points.map((p, i) => (
                      <g key={i} className="group cursor-pointer">
                        <circle
                          cx={p.x}
                          cy={p.y}
                          r="4"
                          fill="#ffffff"
                          stroke="#0d9488"
                          strokeWidth="2.5"
                          className="transition duration-200 hover:r-6 hover:stroke-emerald-500"
                        />
                        <title>
                          {dayjs(p.data.log_date).format("dddd, DD MMMM YYYY")}: {Number(p.data.amount_kg).toLocaleString("id-ID")} kg
                        </title>
                      </g>
                    ))}
                  </svg>
                </div>
              );
            })()}
          </div>
        </section>

        {/* 3R Principles */}
        <section className="relative mx-auto w-full max-w-7xl px-4 pb-16 md:px-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-100 md:p-8">
            <h2 className="text-center text-2xl font-extrabold text-teal-800 md:text-3xl lg:text-4xl">Dukung Program 3R</h2>
            <p className="mt-2 text-center text-sm text-slate-500 md:text-base">Mulai perubahan kecil demi menjaga kelestarian bumi.</p>

            <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-3">
              {principles.map(({ key, title, desc, Icon, color }) => (
                <article key={key} className="rounded-2xl border border-slate-100 bg-slate-50/50 p-6 ring-1 ring-slate-100 flex flex-col justify-between hover:shadow-md transition">
                  <div>
                    <div className={`inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-tr ${color} text-white`}>
                      <Icon size={24} />
                    </div>
                    <h3 className="mt-4 text-lg font-bold text-slate-800">{title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-slate-600">{desc}</p>
                  </div>
                  <button
                    type="button"
                    className="mt-6 w-full rounded-xl border border-slate-200 bg-white py-2.5 text-sm font-bold text-teal-700 hover:bg-teal-50 hover:border-teal-300 transition"
                    onClick={() => setActivePrinciple(key)}
                  >
                    Baca Detail Panduan
                  </button>
                </article>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* Principle Modal */}
      {selectedPrinciple && (
        <div className="fixed inset-0 z-[1002] flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl ring-1 ring-slate-200">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr ${selectedPrinciple.color} text-white`}>
                  <selectedPrinciple.Icon size={20} />
                </div>
                <h3 className="text-lg font-bold text-slate-900">{selectedPrinciple.title}</h3>
              </div>
              <button
                type="button"
                className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 transition"
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
                className="rounded-xl bg-teal-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-teal-700 transition"
                onClick={() => setActivePrinciple(null)}
              >
                Selesai Membaca
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-8 text-center text-xs text-slate-500">
        <div className="mx-auto max-w-7xl px-4 md:px-6 space-y-2">
          <p className="font-semibold text-slate-600">Kota Palopo — Dinas Lingkungan Hidup</p>
          <p>SOMPAH PALOPO. Copyright &copy; {new Date().getFullYear()} · Ihwan Arifuddin (PKA 2026)</p>
        </div>
      </footer>
    </div>
  );
}

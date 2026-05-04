import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { Camera, Images, Send, X } from "lucide-react";
import { api } from "../api/client";
import { apiErr } from "../utils/errors";

/**
 * Urutan penting: di laptop biasanya tidak ada GPS. Mode akurat sering memicu kode 2
 * (POSITION_UNAVAILABLE). Kita utamakan perkiraan jaringan/Wi‑Fi + cache, baru GPS.
 */
/** Timeout per percobaan (ms). Kode 3 = browser belum dapat fix dalam batas ini — sering di indoor / GPS cold start / jaringan lambat. */
const GET_ATTEMPTS = [
  { enableHighAccuracy: false, maximumAge: 600000, timeout: 45000 },
  { enableHighAccuracy: false, maximumAge: 60000, timeout: 60000 },
  { enableHighAccuracy: true, maximumAge: 0, timeout: 45000 },
];

const INITIAL_REPORT_FORM = { locationId: "", locationName: "", status: "Bersih", notes: "", latitude: "", longitude: "" };

function readPosition(options) {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(Object.assign(new Error("Geolocation API tidak tersedia"), { code: 0 }));
      return;
    }
    navigator.geolocation.getCurrentPosition(resolve, reject, options);
  });
}

/** Beberapa browser mengisi koordinat lebih baik lewat watch (fix pertama). */
function readFirstFixViaWatch(maxMs) {
  return new Promise((resolve, reject) => {
    let settled = false;
    let watchId = null;
    let timer = null;
    const clear = () => {
      if (watchId != null) navigator.geolocation.clearWatch(watchId);
      if (timer != null) clearTimeout(timer);
    };
    watchId = navigator.geolocation.watchPosition(
      (pos) => {
        if (settled) return;
        settled = true;
        clear();
        resolve(pos);
      },
      (err) => {
        if (err?.code === 1) {
          if (settled) return;
          settled = true;
          clear();
          reject(err);
        }
      },
      { enableHighAccuracy: false, maximumAge: 300000 }
    );
    timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      clear();
      reject(Object.assign(new Error("Watch timeout"), { code: 3 }));
    }, maxMs);
  });
}

function geolocationErrorMessage(err) {
  const code = err?.code;
  if (code === 1) {
    return "Akses lokasi ditolak atau diblokir. Klik ikon gembok/info di bar alamat → izin Lokasi → \"Izinkan\", lalu coba lagi.";
  }
  if (code === 2) {
    return (
      "Browser tidak mendapat posisi (bukan berarti GPS mati). Di PC/laptop sering terjadi karena tidak ada chip GPS — yang dipakai perkiraan Wi‑Fi/OS. " +
      "Pastikan Layanan Lokasi aktif di pengaturan Windows/macOS, Wi‑Fi menyala, lalu coba lagi atau isi koordinat manual."
    );
  }
  if (code === 3) {
    return (
      "Muncul karena waktu tunggu habis (kode 3 = timeout): perangkat belum mengirim koordinat dalam batas waktu. " +
      "Penyebab umum: di dalam ruangan/sinyal lemah, GPS cold start, atau perkiraan Wi‑Fi/OS lambat. " +
      "Coba ke area terbuka, tunggu beberapa detik lalu klik lagi, atau isi latitude/longitude manual."
    );
  }
  return err?.message || "Tidak bisa mengambil lokasi. Pastikan situs dibuka lewat HTTPS atau localhost.";
}

export function ReportPage() {
  const [form, setForm] = useState(() => ({ ...INITIAL_REPORT_FORM }));
  const [preview, setPreview] = useState("");
  const [photoFile, setPhotoFile] = useState(null);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const galleryInputRef = useRef(null);
  const previewUrlRef = useRef("");
  const videoRef = useRef(null);
  const cameraStreamRef = useRef(null);

  const applyPhoto = (file) => {
    setPhotoFile(file ?? null);
    setPreview((prevUrl) => {
      if (prevUrl) URL.revokeObjectURL(prevUrl);
      const next = file ? URL.createObjectURL(file) : "";
      previewUrlRef.current = next;
      return next;
    });
  };

  const resetReportForm = () => {
    setForm({ ...INITIAL_REPORT_FORM });
    setPhotoFile(null);
    setPreview((prevUrl) => {
      if (prevUrl) URL.revokeObjectURL(prevUrl);
      previewUrlRef.current = "";
      return "";
    });
    if (galleryInputRef.current) galleryInputRef.current.value = "";
  };

  useEffect(() => {
    return () => {
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    };
  }, []);

  const onPhotoInputChange = (e) => {
    const file = e.target.files?.[0];
    applyPhoto(file);
    e.target.value = "";
  };

  const closeCamera = () => {
    cameraStreamRef.current?.getTracks().forEach((t) => t.stop());
    cameraStreamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraOpen(false);
  };

  const openCamera = async () => {
    if (!window.isSecureContext) {
      toast.error("Kamera memerlukan HTTPS atau localhost.");
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia) {
      toast.error("Browser tidak mendukung akses kamera. Gunakan Galeri.");
      return;
    }
    const loadingId = toast.loading("Membuka kamera…");
    try {
      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" } },
          audio: false,
        });
      } catch {
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      }
      cameraStreamRef.current = stream;
      setCameraOpen(true);
    } catch {
      toast.error("Tidak bisa membuka kamera. Izinkan akses kamera di browser atau pakai Galeri.");
    } finally {
      toast.dismiss(loadingId);
    }
  };

  useEffect(() => {
    if (!cameraOpen) return;
    const v = videoRef.current;
    const s = cameraStreamRef.current;
    if (v && s) {
      v.srcObject = s;
      v.play().catch(() => {});
    }
    return () => {
      if (v) v.srcObject = null;
    };
  }, [cameraOpen]);

  useEffect(() => {
    return () => {
      cameraStreamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const captureFromCamera = () => {
    const video = videoRef.current;
    if (!video || video.readyState < 2) {
      toast.error("Tunggu kamera siap, lalu coba lagi.");
      return;
    }
    const w = video.videoWidth;
    const h = video.videoHeight;
    if (!w || !h) {
      toast.error("Video belum siap.");
      return;
    }
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, w, h);
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          toast.error("Gagal menyimpan foto.");
          return;
        }
        const file = new File([blob], `laporan-${Date.now()}.jpg`, { type: "image/jpeg" });
        applyPhoto(file);
        closeCamera();
        toast.success("Foto berhasil diambil");
      },
      "image/jpeg",
      0.92
    );
  };

  const useMyLocation = async () => {
    if (!window.isSecureContext) {
      toast.error("Geolokasi hanya jalan di HTTPS atau http://localhost. Buka aplikasi lewat salah satunya.");
      return;
    }
    if (!navigator.geolocation) {
      toast.error("Browser ini tidak mendukung geolocation.");
      return;
    }

    const loadingId = toast.loading("Mengambil lokasi…");

    const applyPosition = (pos) => {
      const lat = pos.coords?.latitude;
      const lng = pos.coords?.longitude;
      toast.dismiss(loadingId);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
        toast.error("Koordinat dari perangkat tidak valid.");
        return;
      }
      /* Input HTML terkontrol harus pakai string; angka mentah sering tidak tampil konsisten di beberapa browser */
      setForm((prev) => ({
        ...prev,
        latitude: lat.toFixed(6),
        longitude: lng.toFixed(6),
      }));
      toast.success("Koordinat lokasi diperbarui");
    };

    try {
      let lastErr;
      for (const opts of GET_ATTEMPTS) {
        try {
          const pos = await readPosition(opts);
          applyPosition(pos);
          return;
        } catch (e) {
          lastErr = e;
          if (e?.code === 1) break;
        }
      }

      if (lastErr?.code !== 1) {
        try {
          const pos = await readFirstFixViaWatch(70000);
          applyPosition(pos);
          return;
        } catch (e) {
          lastErr = e;
        }
      }

      toast.dismiss(loadingId);
      toast.error(geolocationErrorMessage(lastErr));
    } catch (err) {
      toast.dismiss(loadingId);
      toast.error(geolocationErrorMessage(err));
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    if (!photoFile) {
      toast.error("Unggah foto terlebih dahulu — ambil dari kamera atau pilih dari galeri.");
      return;
    }
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append("photo", photoFile);
      const uploadRes = await api.post("/upload", fd, { headers: { "Content-Type": "multipart/form-data" } });
      const latNum = form.latitude === "" ? null : Number(form.latitude);
      const lngNum = form.longitude === "" ? null : Number(form.longitude);
      await api.post("/reports", {
        locationId: form.locationId || null,
        locationName: form.locationName,
        status: form.status,
        photoUrl: uploadRes.data.photoUrl,
        notes: form.notes,
        latitude: latNum != null && Number.isFinite(latNum) ? latNum : null,
        longitude: lngNum != null && Number.isFinite(lngNum) ? lngNum : null,
      });
      toast.success("Laporan berhasil dikirim");
      resetReportForm();
    } catch (err) {
      toast.error(apiErr(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl rounded-2xl bg-white p-6 shadow-sm">
      <h2 className="mb-4 text-xl font-semibold">Form Laporan Kondisi</h2>
      <form className="grid gap-3 md:grid-cols-2" onSubmit={submit}>
        <label className="text-sm">
          Nama/ID Titik
          <input
            className="mt-1 w-full rounded-md border p-2 disabled:bg-slate-100"
            value={form.locationName}
            onChange={(e) => setForm({ ...form, locationName: e.target.value })}
            required
            disabled={submitting}
          />
        </label>
        <label className="text-sm">
          Status
          <select
            className="mt-1 w-full rounded-md border p-2 disabled:bg-slate-100"
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value })}
            disabled={submitting}
          >
            <option>Bersih</option>
            <option>Sedang</option>
            <option>Penuh</option>
          </select>
        </label>
        <label className="text-sm">
          Latitude
          <input
            type="text"
            inputMode="decimal"
            autoComplete="off"
            className="mt-1 w-full rounded-md border p-2 disabled:bg-slate-100"
            value={form.latitude}
            onChange={(e) => setForm({ ...form, latitude: e.target.value })}
            disabled={submitting}
          />
        </label>
        <label className="text-sm">
          Longitude
          <input
            type="text"
            inputMode="decimal"
            autoComplete="off"
            className="mt-1 w-full rounded-md border p-2 disabled:bg-slate-100"
            value={form.longitude}
            onChange={(e) => setForm({ ...form, longitude: e.target.value })}
            disabled={submitting}
          />
        </label>
        <div className="text-sm md:col-span-2">
          <span className="block text-slate-700">Foto laporan</span>
          <p className="mt-0.5 text-xs text-slate-500">
            Kamera: buka kamera langsung lalu potret. Galeri: pilih file yang sudah ada di perangkat.
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            <button
              type="button"
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-medium text-emerald-800 hover:bg-emerald-100 min-[400px]:flex-initial disabled:cursor-not-allowed disabled:opacity-50"
              onClick={openCamera}
              disabled={submitting}
            >
              <Camera size={18} />
              Ambil foto (kamera)
            </button>
            <button
              type="button"
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-medium text-slate-800 hover:bg-slate-100 min-[400px]:flex-initial disabled:cursor-not-allowed disabled:opacity-50"
              onClick={() => galleryInputRef.current?.click()}
              disabled={submitting}
            >
              <Images size={18} />
              Galeri
            </button>
          </div>
          <input ref={galleryInputRef} type="file" accept="image/*" className="hidden" onChange={onPhotoInputChange} />
        </div>
        {preview && <img alt="preview" className="h-40 w-full rounded-md object-cover md:col-span-2" src={preview} />}
        <label className="text-sm md:col-span-2">
          Catatan Opsional
          <textarea
            className="mt-1 w-full rounded-md border p-2 disabled:bg-slate-100"
            rows={3}
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            disabled={submitting}
          />
        </label>
        <div className="flex flex-wrap gap-2 md:col-span-2">
          <button
            type="button"
            className="rounded-md border px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50"
            onClick={useMyLocation}
            disabled={submitting}
          >
            Gunakan Lokasi Saya
          </button>
          <button
            type="submit"
            className="inline-flex items-center gap-2 rounded-md bg-emerald-600 px-3 py-2 text-sm text-white disabled:cursor-not-allowed disabled:opacity-60"
            disabled={submitting}
          >
            <Send size={14} />
            {submitting ? "Memuat..." : "Kirim Laporan"}
          </button>
        </div>
      </form>

      {cameraOpen && (
        <div className="fixed inset-0 z-[100] flex flex-col bg-black">
          <video ref={videoRef} className="min-h-0 flex-1 w-full object-cover" playsInline muted autoPlay />
          <div className="flex shrink-0 items-center justify-between gap-3 border-t border-white/10 bg-black/80 px-4 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
            <button
              type="button"
              className="rounded-full bg-white/10 p-3 text-white hover:bg-white/20"
              onClick={closeCamera}
              aria-label="Tutup"
            >
              <X size={22} />
            </button>
            <button
              type="button"
              className="rounded-full bg-emerald-500 px-8 py-4 text-sm font-semibold text-white shadow-lg ring-4 ring-emerald-400/50 hover:bg-emerald-600"
              onClick={captureFromCamera}
            >
              Ambil foto
            </button>
            <span className="w-11" aria-hidden />
          </div>
        </div>
      )}
    </div>
  );
}

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import dayjs from "dayjs";
import "dayjs/locale/id";
import { api } from "../../api/client";
import { apiErr } from "../../utils/errors";
import { ModuleCard } from "./ModuleCard";
import { FileSpreadsheet, FileText, BarChart3, Calendar, RotateCcw } from "lucide-react";

dayjs.locale("id");

export function StatsModule() {
  const [statsData, setStatsData] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadData = () => {
    setLoading(true);
    api
      .get("/reports/statistics")
      .then((res) => {
        setStatsData(res.data);
      })
      .catch((err) => {
        toast.error("Gagal memuat data statistik: " + apiErr(err));
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    loadData();
  }, []);

  const exportToExcel = () => {
    if (!statsData || !statsData.detailedReports) return;

    const headers = [
      "ID Laporan",
      "Nama Lokasi",
      "Kondisi Dilaporkan",
      "Status Verifikasi",
      "Catatan",
      "Tanggal Dibuat",
      "Nama Pelapor",
    ];

    const rows = statsData.detailedReports.map((r) => [
      r.id,
      r.location_name,
      r.report_status_value,
      r.report_status === "approved" ? "Disetujui" : r.report_status === "rejected" ? "Ditolak" : "Menunggu",
      r.notes || "",
      dayjs(r.created_at).format("YYYY-MM-DD HH:mm:ss"),
      r.reporter_name || "",
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((val) => `"${String(val).replace(/"/g, '""')}"`).join(",")),
    ].join("\n");

    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `laporan_kegiatan_sompah_${dayjs().format("YYYY-MM-DD")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Excel (CSV) berhasil diekspor");
  };

  const exportToPDF = () => {
    if (!statsData) return;
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast.error("Gagal membuka jendela cetak. Pastikan pop-up diizinkan.");
      return;
    }

    const dailyRows = statsData.dailyStats
      .map(
        (d) => `
      <tr>
        <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${dayjs(d.date).format("DD MMM YYYY")}</td>
        <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; text-align: center;">${d.total}</td>
        <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; text-align: center; color: #16a34a; font-weight: bold;">${d.resolved}</td>
      </tr>
    `
      )
      .join("");

    const reportRows = statsData.detailedReports
      .map(
        (r) => `
      <tr>
        <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${r.id}</td>
        <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; font-weight: bold;">${r.location_name}</td>
        <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; text-align: center;">${r.report_status_value}</td>
        <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; text-align: center;">
          <span style="padding: 2px 8px; border-radius: 9999px; font-size: 11px; font-weight: 600; ${
            r.report_status === "approved"
              ? "background-color: #d1fae5; color: #065f46;"
              : "background-color: #fef3c7; color: #92400e;"
          }">
            ${r.report_status === "approved" ? "Disetujui / Selesai" : "Menunggu Verifikasi"}
          </span>
        </td>
        <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${r.reporter_name || "—"}</td>
        <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${dayjs(r.created_at).format("DD/MM/YYYY HH:mm")}</td>
      </tr>
    `
      )
      .join("");

    printWindow.document.write(`
      <html>
        <head>
          <title>Laporan Hasil Pelaksanaan Kegiatan - Sompah Palopo</title>
          <style>
            body { font-family: 'Inter', sans-serif; color: #1e293b; margin: 40px; line-height: 1.5; }
            .header { text-align: center; border-bottom: 3px double #1e293b; padding-bottom: 15px; margin-bottom: 30px; }
            .header h1 { margin: 0; font-size: 26px; color: #0f766e; text-transform: uppercase; letter-spacing: 1px; }
            .header p { margin: 5px 0 0 0; font-size: 14px; color: #64748b; }
            .summary-cards { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; }
            .card { border: 1px solid #e2e8f0; padding: 20px; border-radius: 12px; text-align: center; background-color: #f8fafc; }
            .card h3 { margin: 0 0 8px 0; font-size: 12px; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; }
            .card p { margin: 0; font-size: 32px; font-weight: 800; color: #0d9488; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 30px; font-size: 12px; }
            th { background-color: #f1f5f9; padding: 12px 10px; text-align: left; border-bottom: 2px solid #cbd5e1; font-weight: 600; color: #475569; }
            h2 { font-size: 16px; border-bottom: 1px solid #cbd5e1; padding-bottom: 8px; color: #0f766e; margin-top: 30px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Sompah Palopo</h1>
            <p>Laporan Hasil Pelaksanaan Kegiatan Pengelolaan & Monitoring Sampah Kota Palopo</p>
            <p style="font-size: 11px; margin-top: 8px;">Dicetak pada: ${dayjs().format("dddd, DD MMMM YYYY HH:mm")}</p>
          </div>
          
          <div class="summary-cards">
            <div class="card">
              <h3>Total Pelaporan Masuk</h3>
              <p>${statsData.totalReports}</p>
            </div>
            <div class="card">
              <h3>Total Laporan Handled / Disetujui</h3>
              <p>${statsData.totalHandled}</p>
            </div>
          </div>

          <h2>1. Ringkasan Aktivitas Laporan Harian (30 Hari Terakhir)</h2>
          <table>
            <thead>
              <tr>
                <th>Tanggal</th>
                <th style="text-align: center;">Jumlah Laporan</th>
                <th style="text-align: center;">Terselesaikan</th>
              </tr>
            </thead>
            <tbody>
              ${dailyRows || '<tr><td colspan="3" style="text-align:center; padding:10px;">Tidak ada data harian</td></tr>'}
            </tbody>
          </table>

          <h2 style="page-break-before: always;">2. Rincian Pelaporan Masuk & Penanganan</h2>
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Nama Lokasi</th>
                <th style="text-align: center;">Kondisi Dilaporkan</th>
                <th style="text-align: center;">Status Verifikasi</th>
                <th>Pelapor</th>
                <th>Tanggal</th>
              </tr>
            </thead>
            <tbody>
              ${reportRows || '<tr><td colspan="6" style="text-align:center; padding:10px;">Tidak ada data laporan</td></tr>'}
            </tbody>
          </table>
          
          <script>
            window.onload = function() {
              window.print();
              window.onafterprint = function() { window.close(); };
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
    toast.success("PDF berhasil diekspor");
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center text-slate-500">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-300 border-t-emerald-600 mx-auto mb-2"></div>
          <p className="text-sm">Memuat data statistik…</p>
        </div>
      </div>
    );
  }

  // Calculate stats charts variables
  const maxDaily = Math.max(...(statsData?.dailyStats?.map((d) => d.total) || [0]), 1);
  const maxMonthly = Math.max(...(statsData?.monthlyStats?.map((m) => m.total) || [0]), 1);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Laporan Hasil Pelaksanaan Kegiatan</h1>
          <p className="text-sm text-slate-500 mt-1">
            Analisis sebaran sampah, respon cepat penanganan, dan pertumbuhan pelaporan.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={loadData}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 shadow-sm"
          >
            <RotateCcw size={16} /> Refresh
          </button>
          <button
            type="button"
            onClick={exportToExcel}
            className="flex items-center gap-1.5 rounded-lg border border-teal-200 bg-teal-50 px-3.5 py-2 text-sm font-semibold text-teal-800 hover:bg-teal-100 shadow-sm"
          >
            <FileSpreadsheet size={16} /> Ekspor Excel
          </button>
          <button
            type="button"
            onClick={exportToPDF}
            className="flex items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-3.5 py-2 text-sm font-semibold text-rose-800 hover:bg-rose-100 shadow-sm"
          >
            <FileText size={16} /> Ekspor PDF
          </button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm flex items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-orange-100 text-orange-600">
            <BarChart3 size={24} />
          </div>
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Pelaporan Masuk</h3>
            <p className="text-2xl font-bold text-slate-800 mt-1">{statsData?.totalReports || 0}</p>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm flex items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
            <Calendar size={24} />
          </div>
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Penanganan Terselesaikan</h3>
            <p className="text-2xl font-bold text-slate-800 mt-1">{statsData?.totalHandled || 0}</p>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Chart */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="font-semibold text-slate-800 text-sm mb-4">Statistik Pertumbuhan Laporan Harian (30 Hari)</h3>
          {statsData?.dailyStats?.length === 0 ? (
            <div className="flex h-64 items-center justify-center text-slate-400 text-xs">Tidak ada data harian</div>
          ) : (
            <div className="flex flex-col">
              <div className="flex items-end justify-between h-48 gap-1 pt-6 px-2 border-b border-slate-100">
                {statsData?.dailyStats?.map((d, index) => {
                  const percentage = (d.total / maxDaily) * 100;
                  return (
                    <div key={index} className="flex-1 flex flex-col items-center group relative h-full justify-end">
                      <div className="absolute bottom-full mb-1 scale-0 group-hover:scale-100 transition-transform bg-slate-800 text-white text-[10px] rounded px-1.5 py-0.5 z-10 whitespace-nowrap shadow pointer-events-none">
                        Laporan: {d.total} | Selesai: {d.resolved}
                      </div>
                      <div className="w-full flex flex-col justify-end h-full gap-0.5">
                        <div
                          style={{ height: `${percentage}%` }}
                          className="w-full bg-emerald-500 rounded-t-sm transition-all hover:bg-emerald-600"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="flex justify-between text-[10px] text-slate-400 mt-2 px-1">
                <span>{dayjs(statsData?.dailyStats[0]?.date).format("DD MMM")}</span>
                <span>{dayjs(statsData?.dailyStats[Math.floor(statsData.dailyStats.length / 2)]?.date).format("DD MMM")}</span>
                <span>{dayjs(statsData?.dailyStats[statsData.dailyStats.length - 1]?.date).format("DD MMM")}</span>
              </div>
            </div>
          )}
        </div>

        {/* Monthly Chart */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="font-semibold text-slate-800 text-sm mb-4">Statistik Pertumbuhan Laporan Bulanan (12 Bulan)</h3>
          {statsData?.monthlyStats?.length === 0 ? (
            <div className="flex h-64 items-center justify-center text-slate-400 text-xs">Tidak ada data bulanan</div>
          ) : (
            <div className="flex flex-col">
              <div className="flex items-end justify-between h-48 gap-3 pt-6 px-2 border-b border-slate-100">
                {statsData?.monthlyStats?.map((m, index) => {
                  const percentage = (m.total / maxMonthly) * 100;
                  return (
                    <div key={index} className="flex-1 flex flex-col items-center group relative h-full justify-end">
                      <div className="absolute bottom-full mb-1 scale-0 group-hover:scale-100 transition-transform bg-slate-800 text-white text-[10px] rounded px-1.5 py-0.5 z-10 whitespace-nowrap shadow pointer-events-none">
                        Laporan: {m.total} | Selesai: {m.resolved}
                      </div>
                      <div
                        style={{ height: `${percentage}%` }}
                        className="w-full bg-teal-500 rounded-t-md transition-all hover:bg-teal-600"
                      />
                    </div>
                  );
                })}
              </div>
              <div className="flex justify-between text-[10px] text-slate-400 mt-2 px-2">
                {statsData?.monthlyStats?.map((m, index) => (
                  <span key={index} className="truncate max-w-[40px]" title={m.month}>
                    {m.month.split("-")[1]}/{m.month.split("-")[0].substring(2)}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Detailed Table */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="font-semibold text-slate-800 text-sm mb-4">Rincian Seluruh Laporan Masuk</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-left font-semibold text-slate-600">
                <th className="py-2.5 px-3">ID</th>
                <th className="py-2.5 px-3">Lokasi</th>
                <th className="py-2.5 px-3">Kondisi Laporan</th>
                <th className="py-2.5 px-3">Status Verifikasi</th>
                <th className="py-2.5 px-3">Pelapor</th>
                <th className="py-2.5 px-3">Tanggal Dibuat</th>
              </tr>
            </thead>
            <tbody>
              {statsData?.detailedReports?.slice(0, 10).map((r) => (
                <tr key={r.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                  <td className="py-2.5 px-3 text-slate-500 font-mono">#{r.id}</td>
                  <td className="py-2.5 px-3 font-semibold text-slate-800">{r.location_name}</td>
                  <td className="py-2.5 px-3 text-slate-600">{r.report_status_value}</td>
                  <td className="py-2.5 px-3">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                        r.report_status === "approved"
                          ? "bg-emerald-100 text-emerald-800"
                          : r.report_status === "rejected"
                          ? "bg-rose-100 text-rose-800"
                          : "bg-amber-100 text-amber-900"
                      }`}
                    >
                      {r.report_status === "approved" ? "Disetujui" : r.report_status === "rejected" ? "Ditolak" : "Menunggu"}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-slate-600">{r.reporter_name || "—"}</td>
                  <td className="py-2.5 px-3 text-slate-400">
                    {dayjs(r.created_at).format("DD/MM/YYYY HH:mm")}
                  </td>
                </tr>
              ))}
              {(!statsData || statsData.detailedReports.length === 0) && (
                <tr>
                  <td colSpan="6" className="py-4 text-center text-slate-400">
                    Tidak ada data laporan.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {statsData && statsData.detailedReports.length > 10 && (
          <p className="text-[10px] text-slate-400 mt-2 text-right">
            Menampilkan 10 laporan terbaru. Klik Ekspor Excel/PDF untuk data lengkap.
          </p>
        )}
      </div>
    </div>
  );
}

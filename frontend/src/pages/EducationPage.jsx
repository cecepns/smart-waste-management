import { AlertTriangle, BookOpen, Leaf, Recycle, ShieldAlert } from "lucide-react";

const tips = [
  {
    title: "Kurangi & pilah di sumber",
    body:
      "Pisahkan organik, anorganik, dan residu yang berpotensi berbahaya. Semakin sedikit sampah campuran, semakin mudah didaur ulang dan semakin aman bagi petugas.",
  },
  {
    title: "Hindari pembakaran sampah campuran",
    body:
      "Membakar sampah plastik, kemasan kimia, atau baterai melepaskan partikel berbahaya ke udara. Buang sesuai jenis dan saluran resmi.",
  },
  {
    title: "Ikuti jadwal & titik resmi",
    body:
      "Manfaatkan layanan pengumpulan terjadwal, bank sampah, atau TPS/TPST setempat agar limbah tidak mencemari tanah dan air.",
  },
];

const b3Examples = [
  "Baterai dan aki bekas",
  "Lampu neon / mercury",
  "Obat kadaluarsa dan kemasan pestisida",
  "Oli bekas dan bekas kemasan pelumas",
  "Cat, thinner, dan aerosol",
  "Produk elektronik bekas (e-waste)",
];

export function EducationPage() {
  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-600 via-emerald-500 to-teal-600 p-6 text-white shadow-md ring-1 ring-emerald-400/40 md:p-8">
        <div className="flex flex-wrap items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
            <BookOpen className="text-white" size={26} strokeWidth={2} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-100">Edukasi masyarakat</p>
            <h1 className="mt-1 text-2xl font-bold leading-tight md:text-3xl">Pengelolaan sampah & limbah B3</h1>
            <p className="mt-3 max-w-3xl text-sm text-emerald-50/95 md:text-base">
              Ringkasan praktis untuk membantu rumah tangga memilah sampah dengan benar dan mengenali limbah Bahan Berbahaya
              dan Beracun (B3) agar lingkungan tetap aman.
            </p>
          </div>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <article className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
          <div className="flex items-center gap-2 text-emerald-700">
            <Leaf size={20} />
            <h2 className="text-lg font-semibold text-slate-800">Prinsip di rumah</h2>
          </div>
          <ul className="mt-4 space-y-3 text-sm leading-relaxed text-slate-600">
            <li>
              <strong className="text-slate-700">Reduce</strong> — kurangi konsumsi sekali pakai; bawa tas belanja dan botol minum.
            </li>
            <li>
              <strong className="text-slate-700">Reuse</strong> — gunakan kembali wadah yang masih layak sebelum membuang.
            </li>
            <li>
              <strong className="text-slate-700">Recycle</strong> — pisahkan kertas, logam, beberapa plastik, dan kaca untuk jalur daur ulang.
            </li>
          </ul>
          <p className="mt-4 rounded-xl bg-emerald-50/80 p-4 text-sm text-slate-700">
            Sampah organik (sisa makanan, daun) dapat diolah kompos atau maggot di rumah jika memungkinkan — mengurangi volume ke
            TPA dan menurunkan emisi gas metana dari sampah campuran.
          </p>
        </article>

        <article className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
          <div className="flex items-center gap-2 text-emerald-700">
            <Recycle size={20} />
            <h2 className="text-lg font-semibold text-slate-800">Pilah sebelum buang</h2>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-slate-600">
            Sampah residu berbahaya <strong className="text-slate-700">jangan dicampur</strong> dengan sampah rumah tangga biasa atau
            dibuang sembarangan ke selokan / sungai. Gunakan wadah kedap untuk koleksi sementara, lalu serahkan ke pengumpul resmi
            atau kegiatan pengumpulan limbah B3/e-waste di wilayah Anda.
          </p>
          <ul className="mt-4 space-y-2 text-sm text-slate-600">
            <li className="flex gap-2">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
              Label kemasan: ikuti petunjuk simbol bahaya / penyimpanan.
            </li>
            <li className="flex gap-2">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
              Obat kadaluarsa: banyak apotek atau dinas kesehatan menyediakan kotak pengumpulan.
            </li>
            <li className="flex gap-2">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
              Oli bekas: serahkan ke bengkel atau program pengumpulan minyak jelantah.
            </li>
          </ul>
        </article>
      </div>

      <article className="rounded-2xl border border-amber-200 bg-amber-50/60 p-6 shadow-sm">
        <div className="flex flex-wrap items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-800">
            <ShieldAlert size={22} />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-semibold text-slate-900">Apa itu limbah B3?</h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-700">
              Limbah B3 adalah limbah yang mengandung bahan berbahaya atau beracun yang konsentrasi dan sifatnya dapat membahayakan
              kesehatan manusia dan/atau lingkungan jika tidak dikelola tepat. Peraturan mengatur pengangkutan, penyimpanan, dan
              pembuangan melalui jalur yang berwenang — bukan bersama sampah domestik biasa.
            </p>
          </div>
        </div>
      </article>

      <article className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
        <div className="flex items-center gap-2 text-red-700">
          <AlertTriangle size={20} />
          <h2 className="text-lg font-semibold text-slate-800">Contoh yang sering ada di rumah</h2>
        </div>
        <ul className="mt-4 grid gap-2 sm:grid-cols-2">
          {b3Examples.map((line) => (
            <li
              key={line}
              className="flex items-start gap-2 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700 ring-1 ring-slate-100"
            >
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-red-500" />
              {line}
            </li>
          ))}
        </ul>
        <p className="mt-4 text-xs leading-relaxed text-slate-500">
          Daftar di atas bersifat umum. Jenis dan persyaratan pengelolaan dapat berbeda per daerah — ikuti informasi dari dinas
          lingkungan atau layanan resmi setempat.
        </p>
      </article>

      <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
        <h2 className="text-lg font-semibold text-slate-800">Tips singkat</h2>
        <div className="mt-4 space-y-4">
          {tips.map((t) => (
            <div key={t.title} className="border-b border-slate-100 pb-4 last:border-0 last:pb-0">
              <p className="font-medium text-slate-800">{t.title}</p>
              <p className="mt-1 text-sm leading-relaxed text-slate-600">{t.body}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

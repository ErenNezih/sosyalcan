"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

const fadeInUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 },
};

export function VitrinPage() {
  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <Navbar />
      <main className="flex-1">
        <HeroSection />
        <BahsetmeSection />
        <FeatureSection />
        <FinalCtaSection />
      </main>
      <Footer />
    </div>
  );
}

function Navbar() {
  return (
    <header className="sticky top-0 z-40 border-b border-white/5 bg-black/40 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4 lg:px-8">
        <Link href="/" className="text-sm font-semibold tracking-[0.3em] uppercase text-zinc-300">
          Sosyalcan
        </Link>
        <Link href="/dashboard">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="rounded-full border border-amber-400/40 bg-amber-400/10 px-4 py-1.5 text-xs font-medium text-amber-200 shadow-[0_0_30px_rgba(250,204,21,0.18)] backdrop-blur-md hover:border-amber-300 hover:bg-amber-400/20"
          >
            Demo Gör
          </motion.button>
        </Link>
      </div>
    </header>
  );
}

function HeroSection() {
  return (
    <section className="relative isolate min-h-[calc(100vh-4rem)] overflow-hidden">
      <video
        className="pointer-events-none absolute inset-0 h-full w-full object-cover"
        autoPlay
        loop
        muted
        playsInline
      >
        <source src="/assets/ssstik.io_1771887723987%20(1).mp4" type="video/mp4" />
      </video>

      <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/80 to-black" />

      <div className="relative z-10 mx-auto flex min-h-[calc(100vh-4rem)] max-w-6xl flex-col items-center justify-center px-6 py-20 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="space-y-8 text-center"
        >
          <p className="text-xs font-medium uppercase tracking-[0.35em] text-zinc-400">
            KOMUTA MERKEZİ
          </p>
          <h1 className="text-balance text-4xl font-light tracking-tight text-white sm:text-5xl lg:text-6xl">
            Ajansınızı Yönetmenin{" "}
            <span className="bg-gradient-to-r from-zinc-50 to-zinc-400 bg-clip-text text-transparent">
              Yeni Yolu.
            </span>
          </h1>
          <p className="mx-auto max-w-xl text-balance text-sm text-zinc-400 sm:text-base">
            Komuta Merkezi ile tanışın. CRM, finans ve operasyon
            tek bir kusursuz ekranda birleşsin. Siz sadece üretmeye odaklanın.
          </p>
          <div className="flex items-center justify-center gap-4 pt-2">
            <Link href="/dashboard">
              <motion.button
                whileHover={{ scale: 1.03, boxShadow: "0 0 60px rgba(250,204,21,0.35)" }}
                whileTap={{ scale: 0.97 }}
                transition={{ type: "spring", stiffness: 260, damping: 20 }}
                className="group inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-amber-400 to-amber-300 px-7 py-2.5 text-sm font-medium text-black shadow-[0_0_40px_rgba(250,204,21,0.3)]"
              >
                Demo Gör
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </motion.button>
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function BahsetmeSection() {
  return (
    <section className="border-t border-white/5 bg-black py-24 sm:py-28">
      <div className="mx-auto max-w-4xl px-6 lg:px-8">
        <motion.p
          variants={fadeInUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="text-balance text-lg font-light leading-relaxed text-zinc-300 sm:text-2xl"
        >
          Birden fazla uygulama, kopuk iletişim ve dağılmış finansal veriler...
          Hepsini geride bırakın. Sosyalcan Komuta Merkezi, yaratıcı ekiplerin
          sadece üretmeye odaklanması için tasarlandı.
        </motion.p>
      </div>
    </section>
  );
}

function FeatureSection() {
  return (
    <section className="border-t border-white/5 bg-gradient-to-b from-black to-zinc-950 py-24 sm:py-32">
      <div className="mx-auto flex max-w-6xl flex-col gap-16 px-6 lg:flex-row lg:items-center lg:px-8">
        <motion.div
          variants={fadeInUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="relative flex-1"
        >
          <div className="pointer-events-none absolute -inset-24 -z-10 bg-[radial-gradient(circle_at_top,_rgba(250,204,21,0.18),_transparent_55%)]" />
          <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-6 shadow-[0_18px_80px_rgba(0,0,0,0.8)] backdrop-blur-2xl sm:p-8">
            <div className="mb-6 flex items-center justify-between text-xs text-zinc-400">
              <span>Finans Kokpiti</span>
              <span>Gerçek Zamanlı</span>
            </div>
            <div className="space-y-4">
              <div className="flex items-baseline justify-between">
                <p className="text-sm text-zinc-400">Bu ayın net cirosu</p>
                <p className="text-[10px] uppercase tracking-[0.2em] text-amber-300">
                  Otomatik dağıtım
                </p>
              </div>
              <p className="text-3xl font-semibold tracking-tight text-amber-200">
                ₺ 245.320
              </p>
              <div className="mt-6 grid grid-cols-5 gap-2 text-[11px] text-zinc-300">
                <div className="space-y-1">
                  <p className="text-zinc-500">Eren</p>
                  <p className="font-medium text-zinc-100">30%</p>
                </div>
                <div className="space-y-1">
                  <p className="text-zinc-500">Kerim</p>
                  <p className="font-medium text-zinc-100">30%</p>
                </div>
                <div className="space-y-1">
                  <p className="text-zinc-500">Gider</p>
                  <p className="font-medium text-zinc-100">15%</p>
                </div>
                <div className="space-y-1">
                  <p className="text-zinc-500">Birikim</p>
                  <p className="font-medium text-zinc-100">15%</p>
                </div>
                <div className="space-y-1">
                  <p className="text-zinc-500">Acil</p>
                  <p className="font-medium text-zinc-100">10%</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          variants={fadeInUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.7, ease: "easeOut", delay: 0.1 }}
          className="flex-1 space-y-6"
        >
          <p className="text-xs font-medium uppercase tracking-[0.3em] text-amber-300">
            FİNANS, CRM VE DAHA FAZLASI
          </p>
          <h2 className="max-w-md text-balance text-2xl font-light tracking-tight text-white sm:text-3xl">
            Akıllı Finans.{" "}
            <span className="text-zinc-300">
              Gelirlerinizi kuruşu kuruşuna otomatik dağıtın ve net kârınızı
              saniyeler içinde görün.
            </span>
          </h2>
          <p className="max-w-md text-sm leading-relaxed text-zinc-400">
            Abonelikler, tek seferlik işler ve giderleriniz tek kokpitte
            birleşir. Sosyalcan, her tahsilatı otomatik olarak Eren, Kerim,
            gider, birikim ve acil durum hesaplarına oranlayarak dağıtır.
          </p>
        </motion.div>
      </div>
    </section>
  );
}

function FinalCtaSection() {
  return (
    <section className="border-t border-white/5 bg-black py-24 sm:py-28">
      <div className="mx-auto flex max-w-4xl flex-col items-center gap-8 px-6 text-center lg:px-8">
        <motion.div
          variants={fadeInUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="space-y-4"
        >
          <h2 className="text-3xl font-light tracking-tight text-white sm:text-4xl">
            Kontrolü Elinize Alın.
          </h2>
          <p className="text-sm text-zinc-400">
            Ajansınızın operasyonlarını tek bir premium panelden yönetin.
          </p>
        </motion.div>
        <Link href="/dashboard">
          <motion.button
            whileHover={{ scale: 1.03, boxShadow: "0 0 50px rgba(250,204,21,0.3)" }}
            whileTap={{ scale: 0.97 }}
            transition={{ type: "spring", stiffness: 260, damping: 22 }}
            className="rounded-full border border-amber-400/50 bg-amber-400/15 px-8 py-2.5 text-sm font-medium text-amber-100 backdrop-blur-md"
          >
            Demo Gör
          </motion.button>
        </Link>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-white/5 bg-black/95 py-6">
      <div className="mx-auto max-w-6xl px-6 text-center text-[11px] text-zinc-500 lg:px-8">
        © {new Date().getFullYear()} Sosyalcan. Tüm hakları saklıdır.
      </div>
    </footer>
  );
}


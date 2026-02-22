"use client";

import React, { useState, useEffect, useRef } from 'react';
import Image from "next/image";
import Link from "next/link";
import { useRouter } from 'next/navigation';
import PyramidTree from "@/components/PyramidTree";
import ParticlesBackground from "@/components/ParticlesBackground";

export default function Home() {
  const router = useRouter();
  const [isScrolled, setIsScrolled] = useState(false);
  const conceptRef = useRef<HTMLElement>(null);
  const diasporaRef = useRef<HTMLElement>(null);
  const certifRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollTo = (ref: React.RefObject<HTMLElement | null>) => {
    ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">

      {/* ═══════════════ FOND PARTICULES ═══════════════ */}
      <ParticlesBackground />

      {/* Blobs de couleur ambiants */}
      <div className="absolute top-[-5%] left-[-5%] w-[55%] h-[55%] bg-[#FF6600] opacity-[0.04] blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-5%] right-[-5%] w-[45%] h-[45%] bg-racines-green opacity-[0.05] blur-[100px] rounded-full pointer-events-none" />
      <div className="absolute top-[40%] left-[60%] w-[30%] h-[30%] bg-amber-400 opacity-[0.04] blur-[80px] rounded-full pointer-events-none" />

      {/* ═══════════════ NAVBAR ═══════════════ */}
      <header className={`fixed top-0 w-full z-50 transition-all duration-500 ${isScrolled
        ? 'bg-white/85 dark:bg-black/85 backdrop-blur-2xl border-b border-black/5 dark:border-white/10 shadow-sm'
        : 'bg-transparent'}`}>
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <Link href="/" className="hover:opacity-80 transition-opacity">
            <Image src="/LOGO_Racines.png" alt="Logo Racines+" width={120} height={40} className="object-contain" priority />
          </Link>

          <nav className="hidden md:flex gap-8 text-sm font-semibold">
            {[
              { label: 'Concept', ref: conceptRef },
              { label: 'Diaspora', ref: diasporaRef },
              { label: 'Certification', ref: certifRef },
            ].map(({ label, ref }) => (
              <button key={label} onClick={() => scrollTo(ref)}
                className="text-foreground/60 hover:text-[#FF6600] transition-colors relative group">
                {label}
                <span className="absolute -bottom-0.5 left-0 w-0 group-hover:w-full h-0.5 bg-[#FF6600] transition-all duration-300 rounded-full" />
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/login')}
              className="px-4 py-2 text-sm font-semibold text-foreground/60 hover:text-[#FF6600] transition-colors rounded-full hover:bg-orange-50"
            >
              Connexion
            </button>
            <Link
              href="/onboarding"
              className="inline-block bg-[#FF6600] hover:bg-[#e55c00] text-white px-5 py-2.5 rounded-full text-sm font-bold shadow-lg shadow-[#FF6600]/25 transition-all hover:shadow-xl hover:shadow-[#FF6600]/35 hover:-translate-y-0.5"
            >
              M&apos;inscrire
            </Link>
          </div>
        </div>
      </header>

      {/* ═══════════════ HERO ═══════════════ */}
      <main className="relative flex flex-col items-center justify-center min-h-screen pt-20 px-6 sm:px-12 text-center z-10">

        {/* Badge animé */}
        <div
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#FF6600]/10 border border-[#FF6600]/15 text-[#FF6600] text-sm font-bold mb-8 cursor-pointer hover:bg-[#FF6600]/20 transition-all hover:scale-105"
          onClick={() => scrollTo(conceptRef)}
        >
          <span className="w-2 h-2 rounded-full bg-[#FF6600] animate-pulse" />
          Pilote officiel — Village de Toa-Zéo ✨
        </div>

        {/* Titre principal */}
        <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold tracking-tight mb-6 max-w-4xl text-balance">
          D&apos;où tu viens éclaire{' '}
          <br className="hidden sm:block" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF6600] via-amber-500 to-racines-green">
            où tu vas.
          </span>
        </h1>

        <p className="text-base sm:text-lg md:text-xl text-foreground/60 max-w-2xl mb-12 text-balance leading-relaxed px-4">
          La première forteresse numérique souveraine pour préserver, valider et transmettre
          l&apos;histoire de votre lignée africaine — pour les 50 prochaines années.
        </p>

        {/* CTA Buttons — clarifiés */}
        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto items-center">

          {/* CTA principal : pour TOUT membre qui veut rejoindre */}
          <Link
            href="/onboarding"
            className="group flex items-center justify-center gap-2.5 w-full sm:w-auto bg-[#FF6600] hover:bg-[#e55c00] text-white px-8 py-4 rounded-2xl text-base font-bold shadow-2xl shadow-[#FF6600]/25 transition-all hover:-translate-y-1 hover:shadow-[#FF6600]/40"
          >
            <span>Rejoindre Racines+</span>
            <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path d="M5 12h14" /><path d="m12 5 7 7-7 7" />
            </svg>
          </Link>

          {/* CTA secondaire */}
          <button
            onClick={() => scrollTo(conceptRef)}
            className="flex items-center justify-center gap-2 w-full sm:w-auto bg-white/80 dark:bg-white/5 border border-black/10 dark:border-white/10 backdrop-blur-sm px-8 py-4 rounded-2xl text-base font-semibold hover:bg-black/5 hover:border-[#FF6600]/30 transition-all"
          >
            Explorer le concept
          </button>
        </div>

        {/* Explicatif discret sur les rôles */}
        <p className="mt-5 text-xs text-foreground/40 max-w-md text-center leading-relaxed">
          Inscription ouverte à tous •{' '}
          <span className="text-amber-500 font-semibold">CHO</span> = Chief Heritage Officer (valide les lignées) •{' '}
          <span className="text-[#FF6600] font-semibold">Admin</span> = Fondateur de la plateforme
        </p>

        {/* Stats */}
        <div className="mt-16 pt-8 border-t border-black/5 dark:border-white/5 flex items-center justify-center gap-8 flex-wrap opacity-50 hover:opacity-70 transition-opacity">
          {[
            { label: 'IA de Racines+', value: 'IA', color: 'text-racines-green', ref: certifRef },
            { label: 'Arbres Inviolables', value: 'Graphe', color: 'text-foreground', ref: conceptRef },
            { label: 'Certifié CHO', value: '✅', color: 'text-amber-500', ref: certifRef },
          ].map(({ label, value, color, ref }) => (
            <React.Fragment key={label}>
              <button onClick={() => scrollTo(ref)} className="flex flex-col items-center hover:opacity-100 transition-opacity group">
                <span className={`font-bold text-2xl ${color} group-hover:scale-110 transition-transform`}>{value}</span>
                <span className="text-xs uppercase tracking-wider mt-0.5">{label}</span>
              </button>
              {label !== 'Certifié CHO' && <div className="h-8 w-px bg-foreground/15" />}
            </React.Fragment>
          ))}
        </div>
      </main>

      {/* ═══════════════ SECTION CONCEPT ═══════════════ */}
      <section ref={conceptRef} id="concept" className="py-28 px-6 max-w-6xl mx-auto">
        <div className="grid md:grid-cols-2 gap-16 items-center">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-racines-green/10 text-racines-green text-xs font-bold mb-5 uppercase tracking-widest">
              <span className="w-1.5 h-1.5 rounded-full bg-racines-green" /> Concept
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-5 text-foreground leading-tight">
              La Mémoire Africaine,<br />
              <span className="text-racines-green">Enfin Inviolable</span>
            </h2>
            <p className="text-foreground/60 leading-relaxed mb-6 text-sm md:text-base">
              Racines+ crée des arbres généalogiques sous forme de <strong>graphes Neo4j chiffrés</strong>,
              impossibles à falsifier. Chaque lien familial est validé par un Chief Heritage Officer (CHO)
              local avant d&apos;être gravé dans le graphe.
            </p>
            <div className="space-y-2.5">
              {[
                { icon: '🔒', txt: 'Données chiffrées et souveraines (RLS Supabase)' },
                { icon: '🌳', txt: 'Arbres en graphe Neo4j — non-falsifiables sur 50 ans' },
                { icon: '🤖', txt: 'IA Racines+ pour détecter les doublons et positionner' },
                { icon: '👁️', txt: 'Validation par experts CHO locaux certifiés' },
              ].map(item => (
                <div key={item.txt} className="flex items-center gap-3 text-sm text-foreground/60 group hover:text-foreground/90 transition-colors">
                  <span className="text-lg group-hover:scale-110 transition-transform">{item.icon}</span>
                  <span>{item.txt}</span>
                </div>
              ))}
            </div>
            <Link href="/onboarding" className="inline-flex mt-8 items-center gap-2 bg-[#FF6600] hover:bg-[#e55c00] text-white px-6 py-3 rounded-xl font-bold text-sm shadow-lg shadow-[#FF6600]/30 transition-all hover:-translate-y-0.5">
              Démarrer mon inscription →
            </Link>
          </div>

          {/* Carte de données */}
          <div className="bg-gradient-to-br from-racines-green/5 via-transparent to-[#FF6600]/5 rounded-3xl p-1 border border-racines-green/10 shadow-xl shadow-racines-green/5">
            <div className="bg-white/70 dark:bg-black/30 backdrop-blur-sm rounded-[22px] p-7 flex flex-col gap-4">
              {[
                { label: "🌍 Village d'origine", value: "Toa-Zéo, Côte d'Ivoire", color: 'text-racines-earth' },
                { label: '📊 Nœuds dans le graphe', value: '12 Personnes', color: 'text-racines-green' },
                { label: '✅ Branches certifiées CHO', value: '3 branches', color: 'text-racines-green' },
                { label: '🤖 Doublons détectés par IA', value: '1 en attente', color: 'text-orange-500' },
              ].map(item => (
                <div key={item.label} className="bg-white dark:bg-black/20 rounded-2xl p-4 border border-black/5 hover:border-racines-green/20 transition-colors">
                  <div className="text-xs text-gray-400 font-semibold mb-1">{item.label}</div>
                  <div className={`font-bold text-lg ${item.color}`}>{item.value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════ SECTION DIASPORA ═══════════════ */}
      <section ref={diasporaRef} id="diaspora" className="py-28 px-6 bg-gradient-to-b from-gray-50 to-white dark:from-white/[0.02] dark:to-black">
        <div className="max-w-6xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FF6600]/10 text-[#FF6600] text-xs font-bold mb-5 uppercase tracking-widest">
            <span className="w-1.5 h-1.5 rounded-full bg-[#FF6600]" /> Diaspora
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Un pont entre <span className="text-[#FF6600]">l&apos;Afrique</span> et sa Diaspora
          </h2>
          <p className="text-foreground/60 max-w-2xl mx-auto mb-14 leading-relaxed text-sm md:text-base">
            Que vous soyez à Abidjan, Paris ou New York, votre lignée reste connectée.
            Invitez un membre de votre famille pour qu&apos;il rejoigne votre graphe généalogique en toute sécurité.
          </p>
          <div className="grid md:grid-cols-3 gap-5 text-left">
            {[
              { emoji: '🇨🇮', title: "Depuis la Côte d'Ivoire", desc: "Saisissez vos ancêtres locaux, validés par votre CHO de village.", cta: 'Commencer', href: '/onboarding' },
              { emoji: '🇫🇷', title: 'Depuis la Diaspora', desc: "Rejoignez l'arbre familial existant, enrichissez-le avec vos documents.", cta: 'Rejoindre', href: '/onboarding' },
              { emoji: '🌍', title: "Depuis n'importe où", desc: "L'accès est global, la souveraineté des données reste africaine.", cta: 'Explorer', href: '#pyramide' },
            ].map(card => (
              <div key={card.title} className="bg-white dark:bg-black border border-gray-100 dark:border-white/10 rounded-3xl p-7 hover:shadow-xl hover:shadow-[#FF6600]/5 hover:border-[#FF6600]/20 transition-all group hover:-translate-y-1">
                <div className="text-4xl mb-5">{card.emoji}</div>
                <h3 className="font-bold text-base mb-2 group-hover:text-[#FF6600] transition-colors">{card.title}</h3>
                <p className="text-sm text-foreground/50 mb-5 leading-relaxed">{card.desc}</p>
                <a href={card.href} className="inline-flex items-center gap-1 text-sm font-bold text-[#FF6600] hover:gap-2 transition-all">
                  {card.cta} →
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════ SECTION CERTIFICATION ═══════════════ */}
      <section ref={certifRef} id="certification" className="py-28 px-6 max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-racines-green/10 text-racines-green text-xs font-bold mb-5 uppercase tracking-widest">
            <span className="w-1.5 h-1.5 rounded-full bg-racines-green animate-pulse" /> Certification
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-3">Le processus <span className="text-racines-green">Certifié</span></h2>
          <p className="text-foreground/60 max-w-xl mx-auto text-sm md:text-base">
            Chaque lien généalogique passe par un processus de validation rigoureux avant d&apos;être inscrit définitivement dans le graphe.
          </p>
        </div>
        <div className="grid md:grid-cols-4 gap-5">
          {[
            { step: '01', icon: '👤', title: 'Inscription', desc: "Vous créez votre profil et renseignez votre village d'origine et vos ancêtres connus.", badge: '' },
            { step: '02', icon: '🤖', title: 'Analyse IA', desc: "L'IA de Racines+ analyse les doublons et génère des liens probables dans la lignée.", badge: '' },
            { step: '03', icon: '👁️', title: 'Validation CHO', desc: 'Le Chief Heritage Officer local vérifie chaque lien avec ses sources orales et documentaires.', badge: '' },
            { step: '04', icon: '🔒', title: 'Certification', desc: 'La branche validée est verrouillée dans le graphe Neo4j pour 50 ans minimum.', badge: '✅' },
          ].map(item => (
            <div key={item.step} className="relative bg-white dark:bg-black border border-gray-100 dark:border-white/10 rounded-3xl p-6 hover:border-racines-green/30 hover:shadow-xl hover:shadow-racines-green/5 transition-all group hover:-translate-y-1">
              <div className="absolute -top-3.5 -right-3.5 w-9 h-9 bg-gradient-to-br from-racines-green to-emerald-600 text-white text-xs font-black rounded-full flex items-center justify-center shadow-lg">
                {item.step}
              </div>
              <div className="text-4xl mb-4">{item.icon}</div>
              <h3 className="font-bold text-sm mb-2 group-hover:text-racines-green transition-colors">{item.title}</h3>
              <p className="text-xs text-foreground/50 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>

        {/* CTA Certification */}
        <div className="mt-14 text-center">
          <Link
            href="/onboarding"
            className="inline-flex items-center gap-3 bg-gradient-to-r from-racines-green to-emerald-600 hover:from-emerald-600 hover:to-racines-green text-white px-10 py-4 rounded-2xl font-bold text-base shadow-2xl shadow-racines-green/25 transition-all hover:-translate-y-0.5 hover:shadow-racines-green/40"
          >
            <span>Commencer ma certification</span>
            <span className="text-lg">→</span>
          </Link>
          <p className="mt-3 text-xs text-foreground/40">Gratuit • Inscription en 3 minutes • Données sécurisées</p>
        </div>
      </section>

      {/* ═══════════════ SECTION ARBRE DU VILLAGE ═══════════════ */}
      <PyramidTree />

      {/* ═══════════════ FOOTER ═══════════════ */}
      <footer className="border-t border-black/5 dark:border-white/10 py-14 px-6 bg-gradient-to-t from-gray-50/50 to-transparent dark:from-white/[0.01]">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex flex-col items-center md:items-start gap-2">
            <Image src="/LOGO_Racines.png" alt="Logo Racines+" width={100} height={35} className="object-contain opacity-70" />
            <p className="text-xs text-foreground/30">© 2026 Racines+. Tous droits réservés.</p>
          </div>
          <div className="flex gap-6 text-sm font-medium text-foreground/40">
            {[
              { label: 'Concept', action: () => scrollTo(conceptRef) },
              { label: 'Diaspora', action: () => scrollTo(diasporaRef) },
              { label: 'Certification', action: () => scrollTo(certifRef) },
            ].map(({ label, action }) => (
              <button key={label} onClick={action} className="hover:text-[#FF6600] transition-colors">{label}</button>
            ))}
            <Link href="/onboarding" className="hover:text-[#FF6600] transition-colors">M&apos;inscrire</Link>
            <Link href="/login" className="hover:text-[#FF6600] transition-colors">Connexion</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

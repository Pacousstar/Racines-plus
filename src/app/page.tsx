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
      {/* Animation Nuage de Points (Google One style / Graphe Node) */}
      <ParticlesBackground />

      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-racines-green opacity-5 dark:opacity-10 blur-3xl rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-racines-earth opacity-5 dark:opacity-10 blur-3xl rounded-full pointer-events-none" />

      {/* Navbar sticky glassmorphism */}
      <header className={`fixed top-0 w-full z-50 transition-all duration-300 ${isScrolled ? 'bg-white/80 dark:bg-black/80 backdrop-blur-xl border-b border-black/5 dark:border-white/10 shadow-sm' : 'bg-transparent'}`}>
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <Link href="/" className="hover:opacity-80 transition-opacity">
            <Image src="/LOGO_Racines.png" alt="Logo Racines+" width={120} height={40} className="object-contain" priority />
          </Link>

          <nav className="hidden md:flex gap-8 text-sm font-semibold">
            <button onClick={() => scrollTo(conceptRef)} className="text-foreground/70 hover:text-[#FF6600] transition-colors hover:underline underline-offset-4 decoration-[#FF6600]">
              Concept
            </button>
            <button onClick={() => scrollTo(diasporaRef)} className="text-foreground/70 hover:text-[#FF6600] transition-colors hover:underline underline-offset-4 decoration-[#FF6600]">
              Diaspora
            </button>
            <button onClick={() => scrollTo(certifRef)} className="text-foreground/70 hover:text-[#FF6600] transition-colors hover:underline underline-offset-4 decoration-[#FF6600]">
              Certification
            </button>
          </nav>

          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/login')}
              className="px-4 py-2 text-sm font-semibold text-foreground/70 hover:text-[#FF6600] transition-colors hover:bg-orange-50 rounded-full"
            >
              Connexion
            </button>
            <Link
              href="/onboarding"
              className="inline-block bg-[#FF6600] hover:bg-[#e55c00] active:bg-[#cc5200] text-white px-5 py-2.5 rounded-full text-sm font-bold shadow-lg shadow-[#FF6600]/30 transition-all hover:shadow-xl hover:shadow-[#FF6600]/40 hover:-translate-y-0.5"
            >
              Créer mon arbre
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="relative flex flex-col items-center justify-center min-h-screen pt-20 px-6 sm:px-12 text-center z-10">

        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#FF6600]/10 border border-[#FF6600]/20 text-[#FF6600] text-sm font-bold mb-8 cursor-pointer hover:bg-[#FF6600]/20 transition-colors" onClick={() => scrollTo(conceptRef)}>
          <span className="w-2 h-2 rounded-full bg-[#FF6600] animate-pulse" />
          Pilote officiel lancé à Toa-Zéo ✨
        </div>

        <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold tracking-tight mb-6 max-w-4xl text-balance px-2">
          D&apos;où tu viens éclaire <br className="hidden sm:block" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-racines-green to-racines-earth">
            où tu vas.
          </span>
        </h1>

        <p className="text-base sm:text-lg md:text-xl text-foreground/70 max-w-2xl mb-10 text-balance leading-relaxed px-4">
          Racines+ est la première forteresse numérique souveraine permettant de préserver, valider et transmettre l&apos;histoire de votre lignée africaine pour les 50 prochaines années.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto mt-4 px-4 sm:px-0">
          <Link
            href="/onboarding"
            className="flex items-center justify-center gap-2 w-full sm:w-auto bg-[#FF6600] hover:bg-[#e55c00] active:bg-[#cc5200] text-white px-8 py-4 rounded-full text-lg font-bold shadow-xl shadow-[#FF6600]/20 transition-all hover:-translate-y-1 hover:shadow-2xl hover:shadow-[#FF6600]/30"
          >
            Créer mon profil fondateur
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
          </Link>

          <button
            onClick={() => scrollTo(conceptRef)}
            className="flex items-center justify-center gap-2 w-full sm:w-auto bg-white dark:bg-foreground/5 border border-black/10 dark:border-white/10 px-8 py-4 rounded-full text-lg font-semibold hover:bg-black/5 dark:hover:bg-white/5 hover:border-[#FF6600]/30 transition-all"
          >
            Explorer les origines
          </button>
        </div>

        {/* Stats */}
        <div className="mt-16 pt-8 border-t border-black/5 dark:border-white/5 flex items-center justify-center gap-8 flex-wrap opacity-60">
          <button onClick={() => scrollTo(certifRef)} className="flex flex-col items-center px-4 hover:opacity-100 transition-opacity">
            <span className="font-bold text-2xl text-racines-green">IA</span>
            <span className="text-xs uppercase tracking-wider text-center">IA de Racines+</span>
          </button>
          <div className="h-8 w-px bg-foreground/20" />
          <button onClick={() => scrollTo(conceptRef)} className="flex flex-col items-center hover:opacity-100 transition-opacity">
            <span className="font-bold text-2xl">Graphe</span>
            <span className="text-xs uppercase tracking-wider">Arbres Inviolables</span>
          </button>
          <div className="h-8 w-px bg-foreground/20" />
          <button onClick={() => scrollTo(certifRef)} className="flex flex-col items-center hover:opacity-100 transition-opacity">
            <span className="font-bold text-2xl text-racines-gold">Certifié</span>
            <span className="text-xs uppercase tracking-wider">Par les Experts</span>
          </button>
        </div>
      </main>

      {/* Section Concept */}
      <section ref={conceptRef} id="concept" className="py-24 px-6 max-w-6xl mx-auto">
        <div className="grid md:grid-cols-2 gap-16 items-center">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-racines-green/10 text-racines-green text-sm font-bold mb-6">
              <span className="w-2 h-2 rounded-full bg-racines-green" /> Concept
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-6 text-foreground">
              La Mémoire Africaine,<br />
              <span className="text-racines-green">Enfin Inviolable</span>
            </h2>
            <p className="text-foreground/70 leading-relaxed mb-6">
              Racines+ crée des arbres généalogiques sous forme de <strong>graphes Neo4j chiffrés</strong>, impossibles à falsifier. Chaque lien familial est validé par un Chief Heritage Officer (CHO) local avant d&apos;être gravé dans le graphe.
            </p>
            <div className="space-y-3">
              {[
                { icon: '🔒', txt: 'Données chiffrées et souveraines (RLS)' },
                { icon: '🌳', txt: 'Arbres en graphe Neo4j — non-falsifiables' },
                { icon: '🤖', txt: "IA de Racines+ pour détecter les doublons" },
                { icon: '👁️', txt: 'Validation par experts CHO locaux' },
              ].map(item => (
                <div key={item.txt} className="flex items-center gap-3 text-sm text-foreground/70">
                  <span className="text-xl">{item.icon}</span>
                  <span>{item.txt}</span>
                </div>
              ))}
            </div>
            <Link href="/onboarding" className="inline-flex mt-8 items-center gap-2 bg-[#FF6600] hover:bg-[#e55c00] text-white px-6 py-3 rounded-full font-bold text-sm shadow-lg shadow-[#FF6600]/30 transition-all hover:-translate-y-0.5">
              Démarrer maintenant →
            </Link>
          </div>
          <div className="bg-gradient-to-br from-racines-green/5 to-[#FF6600]/5 rounded-3xl p-8 border border-racines-green/10 flex flex-col gap-4">
            {[
              { label: "🌍 Village d'origine", value: "Toa-Zéo, Côte d'Ivoire", color: 'text-racines-earth' },
              { label: '📊 Nœuds dans le graphe', value: '12 Personnes', color: 'text-racines-green' },
              { label: '✅ Branches certifiées CHO', value: '3 branches', color: 'text-racines-green' },
              { label: '🤖 Doublons détectés par IA', value: '1 en attente', color: 'text-orange-500' },
            ].map(item => (
              <div key={item.label} className="bg-white dark:bg-black/20 rounded-2xl p-4 border border-black/5">
                <div className="text-xs text-gray-500 font-semibold mb-1">{item.label}</div>
                <div className={`font-bold text-lg ${item.color}`}>{item.value}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Section Diaspora */}
      <section ref={diasporaRef} id="diaspora" className="py-24 px-6 bg-gray-50 dark:bg-white/[0.02]">
        <div className="max-w-6xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FF6600]/10 text-[#FF6600] text-sm font-bold mb-6">
            <span className="w-2 h-2 rounded-full bg-[#FF6600]" /> Diaspora
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Un pont entre <span className="text-[#FF6600]">l&apos;Afrique</span> et sa Diaspora
          </h2>
          <p className="text-foreground/70 max-w-2xl mx-auto mb-12 leading-relaxed">
            Que vous soyez à Abidjan, Paris ou New York, votre lignée reste connectée. Invitez un membre de votre famille pour qu&apos;il rejoigne votre graphe généalogique en toute sécurité.
          </p>
          <div className="grid md:grid-cols-3 gap-6 text-left">
            {[
              { emoji: '🇨🇮', title: "Depuis la Côte d'Ivoire", desc: 'Saisissez vos ancêtres locaux, validés par votre CHO de village.', cta: 'Commencer', href: '/onboarding' },
              { emoji: '🇫🇷', title: 'Depuis la Diaspora', desc: 'Rejoignez l\'arbre familial existant, enrichissez-le avec vos documents.', cta: 'Rejoindre', href: '/onboarding' },
              { emoji: '🌍', title: "Depuis n'importe où", desc: "L'accès est global, la souveraineté des données reste africaine.", cta: 'Explorer', href: '#pyramide' },
            ].map(card => (
              <div key={card.title} className="bg-white dark:bg-black border border-gray-100 dark:border-white/10 rounded-3xl p-6 hover:shadow-lg hover:shadow-[#FF6600]/5 hover:border-[#FF6600]/20 transition-all group">
                <div className="text-4xl mb-4">{card.emoji}</div>
                <h3 className="font-bold text-lg mb-2 group-hover:text-[#FF6600] transition-colors">{card.title}</h3>
                <p className="text-sm text-foreground/60 mb-4 leading-relaxed">{card.desc}</p>
                <a href={card.href} className="text-sm font-bold text-[#FF6600] hover:underline underline-offset-2">{card.cta} →</a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Section Certification */}
      <section ref={certifRef} id="certification" className="py-24 px-6 max-w-6xl mx-auto">
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-racines-green/10 text-racines-green text-sm font-bold mb-6">
            <span className="w-2 h-2 rounded-full bg-racines-green animate-pulse" /> Certification
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Le processus <span className="text-racines-green">Certifié</span></h2>
          <p className="text-foreground/70 max-w-xl mx-auto">Chaque lien généalogique passe par un processus de validation rigoureux avant d&apos;être inscrit dans le graphe.</p>
        </div>
        <div className="grid md:grid-cols-4 gap-6">
          {[
            { step: '01', icon: '👤', title: 'Inscription', desc: 'Vous créez votre profil Fondateur et renseignez vos ancêtres connus.' },
            { step: '02', icon: '🤖', title: 'Analyse IA', desc: "L'IA de Racines+ analyse les doublons et génère des liens probables." },
            { step: '03', icon: '👁️', title: 'Validation CHO', desc: 'Le Chief Heritage Officer local vérifie chaque lien avec ses sources.' },
            { step: '04', icon: '🔒', title: 'Certification', desc: 'La branche validée est verrouillée dans le graphe Neo4j pour 50 ans.' },
          ].map(item => (
            <div key={item.step} className="relative bg-white dark:bg-black border border-gray-100 dark:border-white/10 rounded-3xl p-6 hover:border-racines-green/30 hover:shadow-lg transition-all">
              <div className="absolute -top-3 -right-3 w-8 h-8 bg-racines-green text-white text-xs font-black rounded-full flex items-center justify-center shadow-md">{item.step}</div>
              <div className="text-4xl mb-3">{item.icon}</div>
              <h3 className="font-bold text-base mb-2">{item.title}</h3>
              <p className="text-xs text-foreground/60 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
        <div className="mt-12 text-center">
          <Link href="/onboarding" className="inline-flex items-center gap-2 bg-[#FF6600] hover:bg-[#e55c00] text-white px-8 py-4 rounded-full font-bold text-base shadow-xl shadow-[#FF6600]/20 transition-all hover:-translate-y-0.5 hover:shadow-2xl">
            Commencer ma certification →
          </Link>
        </div>
      </section>

      {/* Section Arbre */}
      <PyramidTree />

      {/* Footer */}
      <footer className="border-t border-black/5 dark:border-white/10 py-12 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <Image src="/LOGO_Racines.png" alt="Logo Racines+" width={100} height={35} className="object-contain opacity-60" />
          <div className="flex gap-8 text-sm font-medium text-foreground/50">
            <button onClick={() => scrollTo(conceptRef)} className="hover:text-[#FF6600] transition-colors">Concept</button>
            <button onClick={() => scrollTo(diasporaRef)} className="hover:text-[#FF6600] transition-colors">Diaspora</button>
            <button onClick={() => scrollTo(certifRef)} className="hover:text-[#FF6600] transition-colors">Certification</button>
            <Link href="/onboarding" className="hover:text-[#FF6600] transition-colors">Créer mon arbre</Link>
          </div>
          <p className="text-xs text-foreground/30">© 2026 Racines+. Tous droits réservés.</p>
        </div>
      </footer>
    </div>
  );
}

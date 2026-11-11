"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Folder from "../components/landing/folder"
import ScrollDrumShowcase from "../components/landing/scroll-drum-showcase"
import Bento from "../components/landing/bento"
import Sponsor from "../components/landing/sponsor"
import GetStarted from "../components/landing/get-started"
import Footer from "../components/landing/footer"
import { GitHubStarButton } from "../components/landing/nav-actions"
import { HeroVideoBackground } from "../components/landing/hero-video-background"

/* ---------- data ---------- */

type Pop = { id: number; x: number; y: number; src: string; rot: number };

const POP_SRCS = [
  "/stickers/blueberry.svg",
  "/stickers/face.svg",
  "/stickers/star.svg",
  "/stickers/flower.svg",
  "/stickers/cat.svg",
  "/stickers/Sparkles.svg",
  "/stickers/Flame.svg",
  "/stickers/vlc2.svg",
  "/stickers/SparkleTrio.svg",
  "/stickers/Spiral.svg",
  "/stickers/Cosmiceye.svg",
  "/stickers/dogsticker.svg",
];

type Token = string | { src: string };

const HERO: Token[] = [
  "Stick",
  "your",
  "website",
  { src: "/stickers/Curious%20blue%20globe.svg" },
  "the",
  "kind",
  "of",
  { src: "/stickers/Flame.svg" },
  "personality",
  "that",
  "makes",
  "people",
  "stick",
  "around.",
  { src: "/stickers/Peace-hand.svg" },
];

const SPRING = "cubic-bezier(0.34, 1.56, 0.64, 1)";

/* ---------- draggable background sticker ---------- */

function DraggableSticker({
  src,
  size,
  rotate,
  depth = 12,
  delay = 0,
  className = "",
}: {
  src: string;
  size: number;
  rotate: number;
  depth?: number;
  delay?: number;
  className?: string;
}) {
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [hover, setHover] = useState(false);
  const [drag, setDrag] = useState(false);
  const start = useRef({ px: 0, py: 0, x: 0, y: 0 });

  function onDown(e: React.PointerEvent<HTMLDivElement>) {
    e.currentTarget.setPointerCapture(e.pointerId);
    start.current = { px: e.clientX, py: e.clientY, x: pos.x, y: pos.y };
    setDrag(true);
  }

  function onMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!drag) return;
    setPos({
      x: start.current.x + e.clientX - start.current.px,
      y: start.current.y + e.clientY - start.current.py,
    });
  }

  function onUp() {
    setDrag(false);
  }

  return (
    // layer 1: position, entrance pop and cursor parallax
    <div
      className={`pointer-events-none absolute ${className}`}
      style={{
        width: `clamp(48px, ${size / 14.4}vw, ${size}px)`,
        translate: `calc(var(--mx, 0) * ${depth}px) calc(var(--my, 0) * ${depth}px)`,
        transition: "translate 400ms ease-out",
        animation: `pop 650ms ${SPRING} ${400 + delay * 120}ms both`,
      }}
    >
      {/* layer 2: idle float */}
      <div
        data-float
        style={{
          animation: `float ${5 + delay}s ease-in-out ${delay * 0.6}s infinite`,
          animationPlayState: drag ? "paused" : "running",
        }}
      >
        {/* layer 3: drag, hover, tilt */}
        <div
          data-sticker
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={onUp}
          onPointerCancel={onUp}
          onPointerEnter={() => setHover(true)}
          onPointerLeave={() => setHover(false)}
          className="pointer-events-auto touch-none select-none"
          style={{
            translate: `${pos.x}px ${pos.y}px`,
            rotate: `${rotate + (drag ? -5 : hover ? 8 : 0)}deg`,
            scale: drag ? 1.14 : hover ? 1.06 : 1,
            cursor: drag ? "grabbing" : "grab",
            filter: drag
              ? "drop-shadow(0 18px 18px rgba(0,0,0,0.32))"
              : "drop-shadow(0 8px 16px rgba(0,0,0,0.22))",
            transition: `scale 450ms ${SPRING}, rotate 450ms ${SPRING}`,
          }}
        >
          <img src={src} alt="" draggable={false} className="block h-auto w-full" />
        </div>
      </div>
    </div>
  );
}

/* ---------- inline sticker inside the headline ---------- */

function HeroSticker({ src, delay }: { src: string; delay: number }) {
  const [turns, setTurns] = useState(0);
  const [hover, setHover] = useState(false);

  return (
    <span
      className="inline-block"
      style={{ animation: `rise 700ms cubic-bezier(0.2, 0.8, 0.2, 1) ${delay}ms both` }}
    >
      <img
        data-sticker
        src={src}
        alt=""
        draggable={false}
        onClick={() => setTurns((t) => t + 1)}
        onPointerEnter={() => setHover(true)}
        onPointerLeave={() => setHover(false)}
        className="mx-1 inline-block h-[0.92em] w-[0.92em] cursor-pointer select-none align-middle drop-shadow-[0_4px_12px_rgba(0,0,0,0.24)] sm:mx-2 hover:rotate-15"
        style={{
          rotate: `${turns * 360 + (hover ? 14 : 0)}deg`,
          scale: hover ? 1.1 : 1,
          transition: `rotate 650ms ${SPRING}, scale 300ms ${SPRING}`,
        }}
      />
    </span>
  );
}

/* ---------- total npm downloads counter with isolated rAF ---------- */

function TotalDownloadsCounter() {
  const [count, setCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unmounted = false;

    fetch("/api/npm-downloads?package=stick-blush")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (unmounted) return;
        const target = typeof data?.downloads === "number" ? data.downloads : 453;
        setLoading(false);

        // Smooth roll-up animation starting dynamically from 0
        const startCount = 0;
        const startTime = performance.now();
        const duration = 1200;

        const tick = (now: number) => {
          if (unmounted) return;
          const progress = Math.min((now - startTime) / duration, 1);
          const ease = 1 - Math.pow(1 - progress, 3);
          const val = Math.round(startCount + (target - startCount) * ease);
          setCount(val);
          if (progress < 1) requestAnimationFrame(tick);
        };

        requestAnimationFrame(tick);
      })
      .catch((err) => {
        console.warn("Could not fetch npm downloads, using local fallback", err);
        if (!unmounted) {
          setLoading(false);
          setCount(453);
        }
      });

    return () => {
      unmounted = true;
    };
  }, []);

  return (
    <div
      className="mt-14 flex flex-col items-center"
      style={{ animation: "rise 700ms cubic-bezier(0.2, 0.8, 0.2, 1) 1150ms both" }}
    >
      <a
        href="https://www.npmjs.com/package/stick-blush"
        target="_blank"
        rel="noreferrer"
        className="group flex flex-col items-center transition-opacity hover:opacity-90"
        title="View stick-blush on npm"
      >
        <img
          data-sticker
          src="/stickers/Component-66.svg"
          alt="stick-blush"
          draggable={false}
          className="h-20 w-20 cursor-pointer select-none drop-shadow-[0_8px_18px_rgba(0,0,0,0.24)] transition-transform duration-300 hover:scale-110 hover:-rotate-3 active:scale-95"
          style={{ transitionTimingFunction: SPRING }}
        />
      </a>
    </div>
  );
}

/* ---------- page ---------- */

export default function Home() {
  const [copied, setCopied] = useState(false);
  const [pops, setPops] = useState<Pop[]>([]);
  const heroRef = useRef<HTMLDivElement>(null);
  const stickersLayerRef = useRef<HTMLDivElement>(null);
  const rafParallax = useRef<number | null>(null);
  const popId = useRef(0);

  /* copy button feedback reset */
  useEffect(() => {
    if (!copied) return;
    const timeout = setTimeout(() => setCopied(false), 1500);
    return () => clearTimeout(timeout);
  }, [copied]);

  /* smart scroll navbar: intentional, jitter-free scroll direction tracking */
  const [navVisible, setNavVisible] = useState(true);
  const [isAtTop, setIsAtTop] = useState(true);
  const [headerMounted, setHeaderMounted] = useState(false);
  const lastScrollY = useRef(0);
  const scrollAcc = useRef(0);

  useEffect(() => {
    const t = setTimeout(() => setHeaderMounted(true), 750);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    lastScrollY.current = window.scrollY;

    function handleScroll() {
      const y = window.scrollY;
      const delta = y - lastScrollY.current;

      // At resting top of the page
      if (y <= 20) {
        setIsAtTop(true);
        setNavVisible(true);
        scrollAcc.current = 0;
        lastScrollY.current = y;
        return;
      }

      setIsAtTop(false);

      // Accumulate scroll in current direction; reset on direction swap
      if ((delta > 0 && scrollAcc.current < 0) || (delta < 0 && scrollAcc.current > 0)) {
        scrollAcc.current = delta;
      } else {
        scrollAcc.current += delta;
      }

      // Scrolling UP with clear user intent (at least 8px continuous upward motion)
      if (scrollAcc.current <= -8) {
        setNavVisible(true);
      }
      // Scrolling DOWN past hero with clear intent (at least 14px continuous downward motion)
      else if (scrollAcc.current >= 14 && y > 70) {
        setNavVisible(false);
      }

      lastScrollY.current = y;
    }

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  /* pause idle float once the hero stickers leave the viewport */
  useEffect(() => {
    const el = stickersLayerRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => {
      el.style.animationPlayState = entry.isIntersecting ? "running" : "paused";
      el.querySelectorAll<HTMLElement>("[data-float]").forEach((node) => {
        node.style.animationPlayState = entry.isIntersecting ? "running" : "paused";
      });
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  async function copyCommand() {
    try {
      await navigator.clipboard.writeText("npm i stick-blush@latest");
      setCopied(true);
    } catch (error) {
      console.error("Failed to copy command:", error);
    }
  }

  /* cursor parallax: writes CSS vars ONLY to the stickers layer, throttled with rAF */
  function onPointerMove(e: React.PointerEvent<HTMLElement>) {
    if (rafParallax.current !== null) return;
    const clientX = e.clientX;
    const clientY = e.clientY;
    rafParallax.current = requestAnimationFrame(() => {
      rafParallax.current = null;
      const el = stickersLayerRef.current;
      if (!el) return;
      el.style.setProperty("--mx", String((clientX / window.innerWidth - 0.5) * 2));
      el.style.setProperty("--my", String((clientY / window.innerHeight - 0.5) * 2));
    });
  }

  /* click empty space to stick a little sticker there */
  function onClick(e: React.MouseEvent<HTMLElement>) {
    const target = e.target as HTMLElement;
    if (target.closest("a, button, [data-sticker]")) return;
    const rect = heroRef.current?.getBoundingClientRect();
    if (!rect) return;

    const id = popId.current++;
    const pop: Pop = {
      id,
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      src: POP_SRCS[Math.floor(Math.random() * POP_SRCS.length)],
      rot: Math.round(Math.random() * 50 - 25),
    };
    setPops((p) => [...p.slice(-7), pop]);
    setTimeout(() => setPops((p) => p.filter((s) => s.id !== id)), 2600);
  }

  return (
    <main className="relative min-h-screen w-full overflow-x-clip bg-white">
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        @keyframes headerRise {
          from { opacity: 0; transform: translateY(-10px); filter: blur(6px); }
          to { opacity: 1; transform: translateY(0); filter: none; }
        }
        @keyframes rise {
          from { opacity: 0; transform: translateY(16px); filter: blur(6px); }
          to { opacity: 1; transform: translateY(0); filter: none; }
        }
        @keyframes pop {
          0% { transform: scale(0) rotate(-20deg); opacity: 0; }
          100% { transform: scale(1) rotate(0); opacity: 1; }
        }
        @keyframes fadeOut {
          to { opacity: 0; transform: scale(0.8); }
        }
        @media (prefers-reduced-motion: reduce) {
          *, *::before, *::after {
            animation: none !important;
            transition: none !important;
          }
        }
      `}</style>

      {/* navbar */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 w-full px-4 py-2 transition-[background-color,border-color,box-shadow] duration-200 ${isAtTop
          ? "bg-transparent border-b border-transparent shadow-none"
          : "backdrop-blur-md bg-white/85 border-b border-zinc-200/70 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05),0_1px_2px_rgba(0,0,0,0.02)]"
          }`}
        style={{
          transform: navVisible ? "translate3d(0, 0, 0)" : "translate3d(0, -100%, 0)",
          transition: "transform 260ms cubic-bezier(0.16, 1, 0.3, 1), background-color 200ms ease, border-color 200ms ease, box-shadow 200ms ease",
          willChange: "transform",
          pointerEvents: navVisible ? "auto" : "none",
          animation: !headerMounted ? "headerRise 700ms cubic-bezier(0.2, 0.8, 0.2, 1) both" : undefined,
        }}
      >
        <nav className="mx-auto flex h-14 max-w-6xl items-center justify-between rounded-2xl">
          {/* brand */}
          <Link href="/" className="group flex items-center gap-2.5">
            <img
              src="/stickers/logo.svg"
              alt="Stick it up logo"
              className={`h-9 w-9 rounded-lg transition-all duration-200
                group-hover:-rotate-6 group-hover:scale-110 ${isAtTop ? "ring-1 ring-white/25 shadow-xs" : ""
                }`}
            />
            <span
              className={`text-lg font-semibold tracking-tight transition-colors duration-200 ${isAtTop
                ? "text-white [text-shadow:0_1px_2px_rgba(0,0,0,0.4)]"
                : "text-zinc-900"
                }`}
            >
              Stick it up
            </span>
          </Link>

          {/* links */}
          <ul className="hidden items-center gap-1 md:flex">
            {[
              { label: "Stickers", href: "/stickers" },
              { label: "Docs", href: "/stickers#docs" },
              { label: "npm", href: "https://www.npmjs.com/package/stick-blush" },
            ].map((link) => {
              const linkClass = `rounded-lg px-3.5 py-2 text-sm font-medium transition-colors duration-150 ${isAtTop
                ? "text-white/90 hover:bg-white/15 hover:text-white [text-shadow:0_1px_2px_rgba(0,0,0,0.35)]"
                : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
                }`;
              return (
                <li key={link.label}>
                  {link.href.startsWith("http") ? (
                    <a
                      href={link.href}
                      target="_blank"
                      rel="noreferrer"
                      className={linkClass}
                    >
                      {link.label}
                    </a>
                  ) : (
                    <Link href={link.href} className={linkClass}>
                      {link.label}
                    </Link>
                  )}
                </li>
              );
            })}
          </ul>

          {/* github star */}
          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2.5">
            <GitHubStarButton />
          </div>
        </nav>
      </header>

      {/* hero full-screen-width interactive section */}
      <div
        ref={heroRef}
        onClick={onClick}
        onPointerMove={onPointerMove}
        className="relative min-h-[600px] w-full overflow-hidden sm:min-h-[680px]"
      >
        <HeroVideoBackground />

        {/* stickers layer (draggable, parallax, floating) */}
        <div ref={stickersLayerRef} className="pointer-events-none absolute inset-0 z-30">
          <DraggableSticker
            src="/stickers/blueberry.svg"
            size={120}
            rotate={-25}
            depth={16}
            delay={0}
            className="left-[3%] sm:left-[9%] top-[10%] sm:top-[14%]"
          />
          <DraggableSticker
            src="/stickers/face.svg"
            size={104}
            rotate={-45}
            depth={26}
            delay={1}
            className="left-[6%] top-[42%] hidden sm:block"
          />
          <DraggableSticker
            src="/stickers/star.svg"
            size={108}
            rotate={-10}
            depth={20}
            delay={2}
            className="left-[18%] top-[70%] hidden sm:block"
          />
          <DraggableSticker
            src="/stickers/flower.svg"
            size={72}
            rotate={25}
            depth={14}
            delay={1}
            className="right-[3%] sm:right-[7%] top-[12%] sm:top-[16%]"
          />
          <DraggableSticker
            src="/stickers/cat.svg"
            size={100}
            rotate={25}
            depth={28}
            delay={2}
            className="right-[6%] top-[44%] hidden sm:block"
          />
          <DraggableSticker
            src="/stickers/Sparkles.svg"
            size={92}
            rotate={10}
            depth={18}
            delay={0}
            className="right-[16%] top-[70%] hidden sm:block"
          />
        </div>

        {/* click-to-stick pops across full screen width */}
        {pops.map((p) => (
          <img
            key={p.id}
            src={p.src}
            alt=""
            draggable={false}
            className="pointer-events-none absolute z-10 w-14 select-none"
            style={{
              left: p.x - 28,
              top: p.y - 28,
              rotate: `${p.rot}deg`,
              animation: `pop 500ms ${SPRING} both, fadeOut 400ms ease-in 2100ms forwards`,
            }}
          />
        ))}

        {/* hero */}
        <section
          className="relative z-20 mx-auto flex max-w-4xl flex-col items-center px-6 pt-32 pb-28 text-center sm:pt-36 md:pt-40 md:pb-32"
        >
          <h1 className="font-sans text-4xl font-normal leading-[1.1] tracking-tight text-white [text-shadow:0_2px_20px_rgba(4,24,19,0.5)] sm:text-6xl lg:text-7xl">
            {HERO.map((token, i) => {
              const delay = 80 + i * 55;
              return typeof token === "string" ? (
                <span
                  key={i}
                  className="mr-[0.25em] inline-block"
                  style={{
                    animation: `rise 700ms cubic-bezier(0.2, 0.8, 0.2, 1) ${delay}ms both`,
                  }}
                >
                  {token}
                </span>
              ) : (
                <HeroSticker key={i} src={token.src} delay={delay} />
              );
            })}
          </h1>

          {/* buttons */}
          <div
            className="mt-14 flex flex-wrap items-center justify-center gap-4"
            style={{ animation: "rise 700ms cubic-bezier(0.2, 0.8, 0.2, 1) 1000ms both" }}
          >
            {/* Install button */}
            <button
              onClick={copyCommand}
              aria-label={copied ? "Copied to clipboard" : "Copy npm i stick-blush@latest"}
              className={`group relative inline-flex cursor-pointer items-center gap-3 rounded-xl
              border bg-gradient-to-b
              py-3 pl-4 pr-5 font-mono text-sm
              shadow-[inset_0_1px_0_white,0_1px_2px_#0000000a]
              transition-all duration-300 ease-out
              hover:-translate-y-px active:translate-y-px active:shadow-inner
              ${copied
                  ? "border-emerald-300 from-emerald-50 to-emerald-100/80 text-emerald-700 backdrop-blur-md shadow-[0_8px_20px_rgba(0,0,0,0.18)]"
                  : "border-white/75 from-white/95 to-zinc-50/95 text-zinc-800 backdrop-blur-md shadow-[inset_0_1px_0_white,0_8px_20px_rgba(0,0,0,0.18)] hover:border-white hover:shadow-[inset_0_1px_0_white,0_10px_24px_rgba(0,0,0,0.22)]"
                }`}
            >
              {/* Text swap: both states share one grid cell, so the button width never shifts */}
              <span className="relative grid" aria-live="polite">
                <span
                  className={`col-start-1 row-start-1 transition-all duration-300 ease-out ${copied
                    ? "-translate-y-1 opacity-0 blur-[2px]"
                    : "translate-y-0 opacity-100 blur-0"
                    }`}
                >
                  npm i stick-blush@latest
                </span>

                <span
                  className={`col-start-1 row-start-1 font-medium transition-all duration-300 ease-out ${copied
                    ? "translate-y-0 opacity-100 blur-0 delay-75"
                    : "translate-y-1 opacity-0 blur-[2px]"
                    }`}
                >
                  Copied!
                </span>
              </span>

              {/* Copy icon -> check badge that draws itself */}
              <span className="relative grid h-4 w-4 place-items-center">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  className={`col-start-1 row-start-1 h-4 w-4 transition-all duration-200 ease-out ${copied ? "scale-75 opacity-0" : "scale-100 opacity-100"
                    }`}
                >
                  <rect x="8" y="3" width="12" height="15" rx="2" />
                  <path d="M5 7H4a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-1" />
                </svg>

                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  className="col-start-1 row-start-1 h-4 w-4 overflow-visible"
                >
                  <circle
                    cx="12"
                    cy="12"
                    r="11"
                    className="fill-emerald-500"
                    style={{
                      transformOrigin: "center",
                      transformBox: "fill-box",
                      transform: copied ? "scale(1)" : "scale(0.4)",
                      opacity: copied ? 1 : 0,
                      transition:
                        "transform 350ms cubic-bezier(0.34, 1.56, 0.64, 1), opacity 150ms ease-out",
                    }}
                  />
                  <path
                    d="m7 12.5 3.2 3.2L17 8.8"
                    pathLength={1}
                    stroke="white"
                    strokeWidth="2.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{
                      strokeDasharray: 1,
                      strokeDashoffset: copied ? 0 : 1,
                      transition: copied
                        ? "stroke-dashoffset 280ms ease-out 140ms"
                        : "stroke-dashoffset 120ms ease-in",
                    }}
                  />
                </svg>
              </span>
            </button>

            {/* Explore button */}
            <Link
              href="/stickers"
              className="group inline-flex cursor-pointer items-center gap-2 rounded-xl
              border border-white/20 bg-gradient-to-b from-zinc-900/95 to-zinc-950
              px-5 py-3 text-sm font-medium text-white backdrop-blur-md
              shadow-[inset_0_1px_0_#ffffff24,0_8px_20px_rgba(0,0,0,0.28)]
              transition-all duration-150
              hover:-translate-y-px hover:from-zinc-800 hover:to-zinc-900
              active:translate-y-px active:shadow-inner"
            >
              <span>Explore stickers</span>
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
              >
                <path d="M7 17 17 7M7 7h10v10" />
              </svg>
            </Link>
          </div>

          {/* total npm downloads counter */}
          <TotalDownloadsCounter />

        </section>
      </div>

      <div className="w-full">
        <Folder />
      </div>

      <ScrollDrumShowcase />

      <Bento />

      <Sponsor />

      <GetStarted />

      <Footer />

    </main>
  );
}
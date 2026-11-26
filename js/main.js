(() => {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const hasGsap = typeof window.gsap !== "undefined" && typeof window.ScrollTrigger !== "undefined";
  const isHome = !!document.querySelector(".hero");

  /* ---------- Word splitting (for scroll-reveal text) ---------- */
  const splitWords = (el) => {
    el.innerHTML = el.innerHTML
      .trim()
      .split(/\s+/)
      .map((w) => `<span class="w">${w}</span>`)
      .join(" ");
  };
  document.querySelectorAll("[data-split]").forEach(splitWords);

  /* ---------- Mobile menu ---------- */
  const burger = document.querySelector(".burger");
  const nav = document.querySelector(".nav");
  burger && burger.addEventListener("click", () => {
    const open = burger.getAttribute("aria-expanded") === "true";
    burger.setAttribute("aria-expanded", String(!open));
    nav.classList.toggle("is-open", !open);
    document.querySelector(".header").classList.remove("is-hidden");
  });
  nav.querySelectorAll("a").forEach((a) =>
    a.addEventListener("click", () => {
      burger.setAttribute("aria-expanded", "false");
      nav.classList.remove("is-open");
    })
  );

  /* ---------- Fallback without animation libs ---------- */
  const loader = document.querySelector(".loader");
  const header = document.querySelector(".header");
  if (!hasGsap || reduce || !isHome) {
    loader && loader.remove();
    document.querySelectorAll("[data-split] .w").forEach((w) => (w.style.opacity = 1));
    document.querySelectorAll("[data-count]").forEach((el) => (el.textContent = el.dataset.count));
    // simple header behaviour for inner pages (blog)
    const onScroll = () => header && header.classList.toggle("is-scrolled", window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return;
  }
  document.querySelectorAll("[data-count]").forEach((el) => (el.textContent = "0"));

  gsap.registerPlugin(ScrollTrigger);

  /* ---------- Smooth scroll (Lenis) ---------- */
  let lenis = null;
  if (window.Lenis) {
    lenis = new Lenis({ duration: 1.15, smoothWheel: true });
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
    document.querySelectorAll('a[href^="#"]').forEach((a) =>
      a.addEventListener("click", (e) => {
        const target = document.querySelector(a.getAttribute("href"));
        if (!target) return;
        e.preventDefault();
        lenis.scrollTo(target, { offset: 0 });
      })
    );
  }

  /* ---------- Preloader + hero intro ---------- */
  document.body.classList.add("is-loading");
  lenis && lenis.stop();
  const counter = { v: 0 };
  const countEl = document.querySelector(".loader__count");
  const intro = gsap.timeline({
    onComplete: () => {
      document.body.classList.remove("is-loading");
      lenis && lenis.start();
      loader.remove();
      ScrollTrigger.refresh();
    },
  });
  intro
    .from(".loader__name", { yPercent: 110, duration: 0.9, ease: "power4.out" })
    .to(counter, { v: 100, duration: 1.2, ease: "power2.inOut", onUpdate: () => (countEl.textContent = Math.round(counter.v)) }, 0.1)
    .to(".loader__inner", { yPercent: -120, opacity: 0, duration: 0.6, ease: "power3.in" })
    .to(loader, { clipPath: "inset(0 0 100% 0)", duration: 0.9, ease: "power4.inOut" }, "-=0.1")
    .from(".hero__media img", { scale: 1.6, duration: 1.8, ease: "power3.out" }, "-=0.8")
    .from(".hero__title .line > *", { yPercent: 115, duration: 1.1, stagger: 0.12, ease: "power4.out" }, "-=1.5")
    .from([".hero .eyebrow", ".hero__scroll", ".header"], { opacity: 0, y: 20, duration: 0.8, stagger: 0.1, clearProps: "transform,opacity" }, "-=0.8");

  /* ---------- Progress bar ---------- */
  gsap.to(".progress span", { scaleX: 1, ease: "none", scrollTrigger: { start: 0, end: "max", scrub: 0.3 } });

  /* ---------- Header hide on scroll down ---------- */
  ScrollTrigger.create({
    start: 80,
    end: "max",
    onUpdate: (self) => {
      header.classList.add("is-scrolled");
      if (nav.classList.contains("is-open")) return;
      header.classList.toggle("is-hidden", self.direction === 1 && self.scroll() > 400);
    },
    onLeaveBack: () => header.classList.remove("is-scrolled", "is-hidden"),
  });

  /* ---------- Hero parallax ---------- */
  gsap.to(".hero__media img", { yPercent: 18, scale: 1.05, ease: "none", scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true } });
  gsap.to(".hero__content", { yPercent: -40, opacity: 0, ease: "none", scrollTrigger: { trigger: ".hero", start: "top top", end: "80% top", scrub: true } });

  /* ---------- Word-by-word text reveal ---------- */
  document.querySelectorAll("[data-split]").forEach((el) => {
    gsap.to(el.querySelectorAll(".w"), {
      opacity: 1,
      stagger: 0.05,
      ease: "none",
      scrollTrigger: { trigger: el, start: "top 80%", end: "bottom 45%", scrub: true },
    });
  });

  /* ---------- Count-up stats ---------- */
  document.querySelectorAll("[data-count]").forEach((el) => {
    const o = { v: 0 };
    gsap.to(o, {
      v: +el.dataset.count,
      duration: 2,
      ease: "power2.out",
      onUpdate: () => (el.textContent = Math.round(o.v)),
      scrollTrigger: { trigger: el, start: "top 85%", once: true },
    });
  });

  /* ---------- Marquee driven by scroll ---------- */
  const track = document.querySelector(".marquee__track");
  gsap.fromTo(track, { xPercent: 0 }, { xPercent: -50, ease: "none", scrollTrigger: { trigger: ".marquee", start: "top bottom", end: "bottom top", scrub: 0.6 } });

  /* ---------- Trio parallax ---------- */
  document.querySelectorAll(".trio__item").forEach((fig, i) => {
    gsap.fromTo(fig.querySelector("img"), { yPercent: -12 }, { yPercent: 0, ease: "none", scrollTrigger: { trigger: fig, start: "top bottom", end: "bottom top", scrub: true } });
    gsap.from(fig, { clipPath: "inset(30% 10% 30% 10%)", duration: 1.4, ease: "power3.out", scrollTrigger: { trigger: fig, start: "top 85%" } });
    gsap.to(fig, { y: i ? -120 : 60, ease: "none", scrollTrigger: { trigger: ".trio", start: "top bottom", end: "bottom top", scrub: true } });
  });

  const mm = gsap.matchMedia();

  /* ---------- Horizontal projects (desktop) ---------- */
  mm.add("(min-width: 901px)", () => {
    const pin = document.querySelector(".projects__pin");
    const row = document.querySelector(".projects__track");
    const head = document.querySelector(".projects__head");
    const distance = () => row.scrollWidth + head.offsetWidth - window.innerWidth;
    const tween = gsap.to([head, row], {
      x: () => -distance(),
      ease: "none",
      scrollTrigger: { trigger: pin, start: "top top", end: () => "+=" + distance(), pin: true, scrub: 1, invalidateOnRefresh: true },
    });
    row.querySelectorAll(".card__img img").forEach((img) => {
      gsap.fromTo(img, { scale: 1.25, xPercent: 8 }, {
        scale: 1, xPercent: 0, ease: "none",
        scrollTrigger: { trigger: img.closest(".card"), containerAnimation: tween, start: "left right", end: "right 60%", scrub: true },
      });
    });
  });

  /* ---------- Stacking service cards ---------- */
  const cards = gsap.utils.toArray(".service");
  cards.forEach((card, i) => {
    card.style.top = `calc(18vh + ${i * 14}px)`;
    if (i === cards.length - 1) return;
    gsap.to(card, {
      scale: 0.94,
      filter: "brightness(0.45)",
      ease: "none",
      scrollTrigger: { trigger: cards[i + 1], start: "top 85%", end: "top 18%", scrub: true },
    });
  });

  /* ---------- About image reveal ---------- */
  gsap.to(".about__frame img", { clipPath: "circle(50% at 50% 50%)", duration: 1.6, ease: "power4.inOut", scrollTrigger: { trigger: ".about", start: "top 70%" } });
  gsap.from(".about__ring", { opacity: 0, duration: 1.4, stagger: 0.15, ease: "power3.out", scrollTrigger: { trigger: ".about", start: "top 70%" } });
  gsap.from(".about__badge", { scale: 0, rotate: -90, duration: 1, ease: "back.out(1.7)", scrollTrigger: { trigger: ".about", start: "top 50%" } });
  gsap.to(".about__badge", { rotate: 360, ease: "none", scrollTrigger: { trigger: ".about", start: "top bottom", end: "bottom top", scrub: true } });
  gsap.from(".timeline li", { x: -40, opacity: 0, stagger: 0.1, duration: 0.8, ease: "power3.out", scrollTrigger: { trigger: ".timeline", start: "top 85%" } });

  /* ---------- Generic section title reveal ---------- */
  gsap.utils.toArray(".section-title, .contact__title").forEach((t) => {
    gsap.from(t, { y: 80, opacity: 0, duration: 1.2, ease: "power4.out", scrollTrigger: { trigger: t, start: "top 88%" } });
  });

  /* ---------- Contact background parallax ---------- */
  gsap.fromTo(".contact__bg", { yPercent: -10 }, { yPercent: 10, ease: "none", scrollTrigger: { trigger: ".contact", start: "top bottom", end: "bottom top", scrub: true } });

  /* ---------- Footer big text ---------- */
  gsap.from(".footer__big", { xPercent: 15, ease: "none", scrollTrigger: { trigger: ".footer", start: "top bottom", end: "bottom bottom", scrub: true } });

  window.addEventListener("load", () => ScrollTrigger.refresh());
})();

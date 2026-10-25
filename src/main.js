import "@fontsource-variable/bricolage-grotesque";
import "@fontsource/atkinson-hyperlegible/latin-400.css";
import "@fontsource/atkinson-hyperlegible/latin-700.css";
import "@fontsource/kalam/latin-400.css";
import "@fontsource/kalam/latin-700.css";
import "./style.css";

const root = document.documentElement;
const reduceQuery = matchMedia("(prefers-reduced-motion: reduce)");
const reduced = reduceQuery.matches;
if (!reduced) root.classList.add("motion");

const $ = (sel, el = document) => el.querySelector(sel);
const $$ = (sel, el = document) => [...el.querySelectorAll(sel)];
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const SPRING = "cubic-bezier(0.34, 1.56, 0.64, 1)";
const OUT = "cubic-bezier(0.16, 1, 0.3, 1)";
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

function onceInView(el, fn, opts = { threshold: 0.35 }) {
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (e.isIntersecting) {
        io.unobserve(e.target);
        fn(e.target);
      }
    }
  }, opts);
  io.observe(el);
}

/* A rubber stamp hitting the page: oversized, slams down, settles. */
function stampIn(el, delay = 0) {
  const r = getComputedStyle(el).getPropertyValue("--r").trim() || "0deg";
  el.classList.add("is-stamped");
  if (reduced) return;
  el.animate(
    [
      { opacity: 0, transform: `rotate(${r}) scale(1.9)`, filter: "blur(3px)" },
      { opacity: 1, transform: `rotate(${r}) scale(0.9)`, filter: "blur(0)", offset: 0.55 },
      { opacity: 1, transform: `rotate(${r}) scale(1.03)`, offset: 0.8 },
      { opacity: 1, transform: `rotate(${r}) scale(1)` },
    ],
    { duration: 520, delay, easing: "cubic-bezier(0.5, 0, 0.2, 1)", fill: "backwards" }
  );
}

/* ---------- Hero: write the heading, circle the line, stamp it ---------- */
(async function hero() {
  const sheet = $(".sheet--hero");
  const photo = $(".idphoto");
  const circle = $(".hero__title .pen");
  const stamp = $(".stamp--hero");
  const pencil = $(".pencil");
  if (reduced) {
    photo.classList.add("is-in");
    stamp.classList.add("is-stamped");
    return;
  }
  await Promise.race([document.fonts.ready, wait(600)]);
  sheet.classList.add("is-written");

  pencil.animate(
    [{ transform: "translate(40%, -30%) rotate(-80deg)", opacity: 0 }],
    { duration: 1100, easing: OUT, fill: "backwards", delay: 100 }
  );

  setTimeout(() => {
    photo.classList.add("is-in");
    photo.animate(
      [
        { transform: "translateY(-60px) rotate(-14deg)", opacity: 0 },
        { transform: "translateY(0) rotate(7deg)", opacity: 1, offset: 0.6 },
        { transform: "rotate(1.5deg)", offset: 0.82 },
        { transform: "rotate(3deg)" },
      ],
      { duration: 900, easing: "ease-out" }
    );
  }, 450);

  setTimeout(() => circle.classList.add("is-drawn"), 1050);

  setTimeout(() => {
    stampIn(stamp);
    // the sheet takes the hit
    sheet.animate(
      [
        { transform: "rotate(-1.2deg)" },
        { transform: "rotate(-1.2deg) translateY(4px) scale(0.995)", offset: 0.3 },
        { transform: "rotate(-1.2deg)" },
      ],
      { duration: 380, delay: 220, easing: OUT }
    );
  }, 1900);
})();

/* ---------- About: highlighter follows the scroll ---------- */
const highlights = $$(".hl");
const notes = $$(".about__notes .note");
notes.forEach((note) => {
  onceInView(note, (el) => {
    el.classList.add("is-in");
    if (reduced) return;
    const r = getComputedStyle(el).getPropertyValue("--r").trim();
    const i = notes.indexOf(el);
    el.animate(
      [
        { opacity: 0, transform: `translateY(40px) rotate(calc(${r} + 8deg))` },
        { opacity: 1, transform: `rotate(${r})` },
      ],
      { duration: 700, delay: i * 110, easing: SPRING, fill: "backwards" }
    );
  });
});

/* ---------- Experience: a top-bound pad that flips as you scroll ---------- */
const exp = $("#experience");
const sheets = $$("[data-sheet]", exp);
const expLinks = $$("[data-exp-link]", exp);
const pinQuery = matchMedia("(min-width: 900px)");
const tilts = [0, 0.8, -0.6];
const FLIP_SPAN = sheets.length - 1 + 0.4; // flips mapped across the pinned scroll
let pinned = false;

function setPinned() {
  pinned = pinQuery.matches && !reduced;
  exp.classList.toggle("is-pinnable", pinned);
  if (!pinned) sheets.forEach((s) => (s.style.transform = s.style.opacity = s.style.visibility = ""));
}

function expProgress() {
  const rect = exp.getBoundingClientRect();
  const total = exp.offsetHeight - innerHeight;
  return clamp(-rect.top / total) * FLIP_SPAN - 0.2;
}

function renderPad() {
  if (!pinned) return;
  const flips = expProgress();
  let current = 0;
  sheets.forEach((sheet, i) => {
    if (i === sheets.length - 1) {
      sheet.style.transform = `rotate(${tilts[i]}deg)`;
      return;
    }
    const f = clamp(flips - i);
    const e = f < 0.5 ? 2 * f * f : 1 - Math.pow(-2 * f + 2, 2) / 2;
    sheet.style.transform = `rotate(${tilts[i] * (1 - e)}deg) translateY(${-e * 30}px) rotateX(${-e * 118}deg)`;
    sheet.style.opacity = String(1 - clamp((f - 0.5) / 0.35));
    sheet.style.visibility = f >= 0.99 ? "hidden" : "";
    if (f > 0.5) current = i + 1;
  });
  setCurrentJob(current);
}

function setCurrentJob(i) {
  expLinks.forEach((a, j) => a.setAttribute("aria-current", String(i === j)));
  sheets[i]?.classList.add("is-drawn");
}

expLinks.forEach((a, i) =>
  a.addEventListener("click", (ev) => {
    if (!pinned) return;
    ev.preventDefault();
    const total = exp.offsetHeight - innerHeight;
    const target = exp.offsetTop + ((i + 0.2 + 0.08) / FLIP_SPAN) * total;
    scrollTo({ top: target, behavior: "smooth" });
  })
);

sheets.forEach((s) => onceInView(s, (el) => !pinned && el.classList.add("is-drawn"), { threshold: 0.5 }));

// While the pad is on screen, follow the scroll every frame so the flip never lags.
let padLoop = 0;
new IntersectionObserver(([entry]) => {
  cancelAnimationFrame(padLoop);
  if (!entry.isIntersecting) return;
  const tick = () => {
    renderPad();
    padLoop = requestAnimationFrame(tick);
  };
  tick();
}).observe(exp);

setPinned();
pinQuery.addEventListener("change", () => {
  setPinned();
  renderPad();
});

/* ---------- Scroll loop (highlighter + pad) ---------- */
function onScroll() {
  if (!reduced) {
    const vh = innerHeight;
    for (const hl of highlights) {
      const top = hl.getBoundingClientRect().top;
      hl.style.setProperty("--hl", `${clamp((vh * 0.8 - top) / (vh * 0.25)) * 100}%`);
    }
  }
}
addEventListener("scroll", onScroll, { passive: true });
addEventListener("resize", onScroll);
onScroll();

/* ---------- How I write: a conversation that types itself ---------- */
const convos = {
  support: {
    title: "Shop inbox",
    sub: "Replying as Charena",
    msgs: [
      ["them", "Hi! Is the medium size still available? And how long is shipping to Davao?"],
      ["me", "Hi! Yes, medium is in stock in all three colors. Shipping to Davao usually takes 3 to 5 days. Want me to hold one while you pick a color?"],
      ["them", "Black please. Can I pay on delivery?"],
      ["me", "Of course. I've noted black, size M, cash on delivery. I'll send your tracking number as soon as it ships. Thank you!"],
    ],
  },
  esl: {
    title: "English class · Level 2",
    sub: "Teaching as Teacher Charena",
    msgs: [
      ["them", "Teacher, yesterday I go to the park with my mom."],
      ["me", "Great story! One small fix: yesterday I went to the park. “Go” changes to “went” when it already happened. Can you try the whole sentence again?"],
      ["them", "Yesterday I went to the park with my mom!"],
      ["me", "Perfect! Now tell me one thing you saw there."],
    ],
  },
};
const chat = $("[data-chat]");
const panel = $("#chat-panel");
const convoTabs = $$("[data-convo]");
let playId = 0;
let currentConvo = "support";

const checkSvg = () => {
  const ns = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(ns, "svg");
  svg.setAttribute("viewBox", "0 0 60 50");
  svg.setAttribute("class", "pen msg__check");
  svg.setAttribute("aria-hidden", "true");
  const p = document.createElementNS(ns, "path");
  p.setAttribute("pathLength", "1");
  p.setAttribute("d", "M6 26l16 16L54 6");
  svg.append(p);
  return svg;
};

function bubble(who, text) {
  const li = document.createElement("li");
  li.className = `msg msg--${who}`;
  li.textContent = text;
  return li;
}

async function play(key) {
  const id = ++playId;
  const convo = convos[key];
  $("[data-convo-title]").textContent = convo.title;
  $("[data-convo-sub]").textContent = convo.sub;
  chat.replaceChildren();

  if (reduced) {
    convo.msgs.forEach(([who, text]) => chat.append(bubble(who, text)));
    chat.lastElementChild.append(checkSvg());
    return;
  }

  panel.setAttribute("aria-busy", "true");
  for (const [i, [who, text]] of convo.msgs.entries()) {
    const typing = document.createElement("li");
    typing.className = `typing${who === "me" ? " typing--me" : ""}`;
    typing.setAttribute("aria-hidden", "true");
    typing.innerHTML = "<i></i><i></i><i></i>";
    chat.append(typing);
    await wait(who === "me" ? clamp(text.length * 14, 700, 1500) : 650);
    if (id !== playId) return;
    const li = bubble(who, text);
    typing.replaceWith(li);
    li.animate(
      [
        { opacity: 0, transform: "scale(0.6) translateY(12px)" },
        { opacity: 1, transform: "scale(1)" },
      ],
      { duration: 420, easing: SPRING }
    );
    if (i === convo.msgs.length - 1) {
      const check = checkSvg();
      li.append(check);
      await wait(300);
      if (id !== playId) return;
      check.classList.add("is-drawn");
    }
    await wait(who === "them" ? 450 : 700);
    if (id !== playId) return;
  }
  panel.removeAttribute("aria-busy");
}

convoTabs.forEach((tab) =>
  tab.addEventListener("click", () => {
    currentConvo = tab.dataset.convo;
    convoTabs.forEach((t) => t.setAttribute("aria-selected", String(t === tab)));
    panel.setAttribute("aria-labelledby", tab.id);
    play(currentConvo);
  })
);
$("[data-replay]").addEventListener("click", () => play(currentConvo));
onceInView(panel, () => play(currentConvo), { threshold: 0.45 });

/* ---------- Skills: the red pen checks every box ---------- */
$$(".check-group").forEach((group) => {
  $$("li", group).forEach((li, i) => {
    const ns = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(ns, "svg");
    svg.setAttribute("viewBox", "0 0 30 26");
    svg.setAttribute("class", "tick");
    svg.setAttribute("aria-hidden", "true");
    svg.style.setProperty("--d", `${i * 0.08}s`);
    const p = document.createElementNS(ns, "path");
    p.setAttribute("pathLength", "1");
    p.setAttribute("d", "M3 14l8 8L28 2");
    svg.append(p);
    li.prepend(svg);
  });
  onceInView(group, (el) => el.classList.add("is-drawn"), { threshold: 0.5 });
});

/* ---------- Qualifications: every stamp lands on one beat ---------- */
const stampList = $("[data-stamps]");
onceInView(stampList, (list) => {
  const stamps = $$(".stamp", list);
  stamps.forEach((s, i) => stampIn(s, i * 55));
  if (!reduced) {
    list.animate(
      [{ transform: "none" }, { transform: "translateY(3px)", offset: 0.6 }, { transform: "none" }],
      { duration: 700, easing: OUT }
    );
  }
});

/* ---------- Contact: underline + gold star sticker ---------- */
onceInView($(".sheet--note"), (note) => {
  $(".pen--under", note).classList.add("is-drawn");
  const star = $(".star", note);
  star.classList.add("is-stamped");
  if (reduced) return;
  star.animate(
    [
      { opacity: 0, transform: "rotate(-60deg) scale(0.2)" },
      { opacity: 1, transform: "rotate(20deg) scale(1.15)", offset: 0.65 },
      { opacity: 1, transform: "rotate(12deg) scale(1)" },
    ],
    { duration: 700, delay: 500, easing: OUT, fill: "backwards" }
  );
});

/* ---------- Copy email ---------- */
$$("[data-copy]").forEach((btn) => {
  const label = $("[data-copy-label]", btn);
  btn.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(btn.dataset.copy);
      label.textContent = "Copied!";
    } catch {
      label.textContent = "Press Ctrl+C";
      const range = document.createRange();
      range.selectNodeContents(btn.previousElementSibling);
      getSelection().removeAllRanges();
      getSelection().addRange(range);
    }
    btn.classList.add("is-done");
    clearTimeout(btn._t);
    btn._t = setTimeout(() => {
      btn.classList.remove("is-done");
      label.textContent = "Copy";
    }, 1800);
  });
});

/* ---------- Nav: the tab for the section you're reading drops down ---------- */
const tabs = $$(".nav__tabs .tab");
const sectionIO = new IntersectionObserver(
  (entries) => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      const id = e.target.id === "education" ? "skills" : e.target.id;
      tabs.forEach((t) => t.setAttribute("aria-current", String(t.hash === `#${id}`)));
    }
  },
  { rootMargin: "-45% 0px -50% 0px" }
);
$$("main > section").forEach((s) => sectionIO.observe(s));

import "@fontsource-variable/schibsted-grotesk";
import "@fontsource-variable/source-serif-4";
import "@fontsource-variable/source-serif-4/opsz-italic.css";
import "@fontsource/mrs-saint-delafield/latin-400.css";
import "./style.css";

const root = document.documentElement;
const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
if (!reduced) root.classList.add("motion");

const $ = (sel, el = document) => el.querySelector(sel);
const $$ = (sel, el = document) => [...el.querySelectorAll(sel)];
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const EASE = "cubic-bezier(0.16, 1, 0.3, 1)";
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

function onceInView(el, fn, threshold = 0.25) {
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        io.unobserve(e.target);
        fn(e.target);
      }
    },
    { threshold, rootMargin: "0px 0px -8% 0px" }
  );
  io.observe(el);
}

const RESTING = { opacity: "1", transform: "none", clipPath: "inset(0 0 0 0)" };

// Animate from a start state to the element's resting state, then pin that state inline
// so the hidden start styles in CSS no longer apply.
function play(el, from, opts = {}) {
  if (reduced || !el) return;
  const to = Object.fromEntries(Object.keys(from).map((k) => [k, RESTING[k]]));
  const anim = el.animate([from, to], { duration: 900, easing: EASE, fill: "both", ...opts });
  anim.finished
    .then(() => {
      Object.assign(el.style, to);
      anim.cancel();
    })
    .catch(() => {});
}

/* ---------- Letter date and Cebu clock ---------- */
const cebu = { timeZone: "Asia/Manila" };
$("[data-today]").textContent = new Intl.DateTimeFormat("en-GB", { ...cebu, day: "numeric", month: "long", year: "numeric" }).format(new Date());
const clock = $("[data-clock]");
function tickClock() {
  const t = new Intl.DateTimeFormat("en-US", { ...cebu, hour: "numeric", minute: "2-digit" }).format(new Date());
  clock.textContent = `${t} local time`;
}
tickClock();
setInterval(tickClock, 30_000);

/* ---------- Opening: the letter assembles itself ---------- */
(async function opening() {
  if (reduced) return;
  await Promise.race([document.fonts.ready, wait(700)]);

  play($(".letterhead__rule"), { transform: "scaleX(0)" }, { duration: 1100 });
  $(".seal").animate(
    [
      { transform: "scale(1.35) rotate(-25deg)", opacity: 0 },
      { transform: "scale(0.94) rotate(0deg)", opacity: 1, offset: 0.7 },
      { transform: "scale(1)", opacity: 1 },
    ],
    { duration: 700, delay: 150, easing: EASE, fill: "backwards" }
  );

  const [meta, re, salutation, ...afterHeadline] = $$(".opening__letter > [data-rise]");
  [meta, re, salutation].forEach((el, i) => play(el, { opacity: 0, transform: "translateY(14px)" }, { delay: 250 + i * 110 }));

  $$(".headline .line > span").forEach((span, i) =>
    play(span, { transform: "translateY(110%)" }, { duration: 1100, delay: 520 + i * 110 })
  );
  afterHeadline.forEach((el, i) => play(el, { opacity: 0, transform: "translateY(16px)" }, { delay: 950 + i * 130 }));

  const mounted = $("[data-mounted]");
  play($(".mounted__photo", mounted), { clipPath: "inset(100% 0 0 0)" }, { duration: 1300, delay: 600, easing: "cubic-bezier(0.7, 0, 0.2, 1)" });
  $$(".corner", mounted).forEach((c, i) => play(c, { opacity: 0, transform: "scale(0.4)" }, { duration: 500, delay: 1600 + i * 70 }));
  play($("figcaption", mounted), { opacity: 0, transform: "translateY(8px)" }, { delay: 1800 });

  $$("[data-facts] > div").forEach((d, i) => play(d, { opacity: 0, transform: "translateY(18px)" }, { delay: 1100 + i * 90 }));
})();

/* ---------- Section headings rise out of their baseline ---------- */
$$("[data-reveal]").forEach((h) => {
  const inner = document.createElement("span");
  inner.className = "rv";
  inner.append(...h.childNodes);
  h.append(inner);
  onceInView(h, () => play(inner, { transform: "translateY(110%)" }, { duration: 1000 }), 0.6);
});

$$("[data-rise]")
  .filter((el) => !el.closest(".opening"))
  .forEach((el) => onceInView(el, () => play(el, { opacity: 0, transform: "translateY(16px)" }, { delay: 150 })));

/* ---------- Experience: the timeline inks down as you read ---------- */
const timeline = $("[data-timeline]");
const ink = $("[data-ink]");
const roles = $$("[data-role]");
roles.forEach((role) => onceInView(role, () => play(role, { opacity: 0, transform: "translateY(28px)" }), 0.2));

function inkTimeline() {
  const rect = timeline.getBoundingClientRect();
  const mark = innerHeight * 0.6;
  ink.style.setProperty("--ink-progress", reduced ? 1 : clamp((mark - rect.top) / rect.height));
  for (const role of roles) role.classList.toggle("is-active", role.getBoundingClientRect().top < mark);
}

/* ---------- Skills: groups settle in sequence ---------- */
onceInView($("[data-skills]"), (set) =>
  $$("section", set).forEach((s, i) => play(s, { opacity: 0, transform: "translateY(20px)" }, { delay: i * 80 }))
);

/* ---------- Closing: the signature writes itself ---------- */
onceInView(
  $("[data-signoff]"),
  (signoff) => play($(".signature span", signoff), { clipPath: "inset(-20% 100% -20% 0)" }, { duration: 1800, delay: 300, easing: "cubic-bezier(0.45, 0, 0.25, 1)" }),
  0.6
);

/* ---------- Letterhead condenses; current section underlined ---------- */
const letterhead = $("[data-letterhead]");
function onScroll() {
  letterhead.classList.toggle("is-condensed", scrollY > 40);
  inkTimeline();
}
addEventListener("scroll", onScroll, { passive: true });
addEventListener("resize", onScroll);
onScroll();

const menuLinks = $$("[data-menu] a");
const sectionIO = new IntersectionObserver(
  (entries) => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      menuLinks.forEach((a) => a.setAttribute("aria-current", String(a.hash === `#${e.target.id}`)));
    }
  },
  { rootMargin: "-45% 0px -50% 0px" }
);
$$("main > section").forEach((s) => sectionIO.observe(s));

/* ---------- How I write: a conversation that types itself ---------- */
const convos = {
  support: {
    title: "Shop inbox",
    sub: "Replying as Charena",
    status: "Order noted",
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
    status: "Lesson goal met",
    msgs: [
      ["them", "Teacher, yesterday I go to the park with my mom."],
      ["me", "Great story! One small fix: yesterday I went to the park. “Go” changes to “went” when it already happened. Can you try the whole sentence again?"],
      ["them", "Yesterday I went to the park with my mom!"],
      ["me", "Perfect! Now tell me one thing you saw there."],
    ],
  },
};
const chat = $("[data-chat]");
const panel = $("[data-thread]");
const segmented = $(".segmented");
const convoTabs = $$("[data-convo]", segmented);
let playId = 0;
let current = "support";

function bubble(who, text) {
  const li = document.createElement("li");
  li.className = `msg msg--${who}`;
  li.textContent = text;
  return li;
}

function status(text) {
  const li = document.createElement("li");
  li.className = "msg__status";
  li.innerHTML = '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12.5 4.5 4.5L19 7.5" /></svg>';
  li.append(text);
  return li;
}

async function playConvo(key) {
  const id = ++playId;
  const convo = convos[key];
  $("[data-convo-title]").textContent = convo.title;
  $("[data-convo-sub]").textContent = convo.sub;
  chat.replaceChildren();

  if (reduced) {
    convo.msgs.forEach(([who, text]) => chat.append(bubble(who, text)));
    chat.append(status(convo.status));
    return;
  }

  panel.setAttribute("aria-busy", "true");
  for (const [who, text] of convo.msgs) {
    const typing = document.createElement("li");
    typing.className = `typing${who === "me" ? " typing--me" : ""}`;
    typing.setAttribute("aria-hidden", "true");
    typing.innerHTML = "<i></i><i></i><i></i>";
    chat.append(typing);
    await wait(who === "me" ? clamp(text.length * 13, 700, 1400) : 650);
    if (id !== playId) return;
    const li = bubble(who, text);
    typing.replaceWith(li);
    li.animate(
      [
        { opacity: 0, transform: "translateY(10px) scale(0.96)" },
        { opacity: 1, transform: "none" },
      ],
      { duration: 450, easing: EASE }
    );
    await wait(who === "them" ? 450 : 650);
    if (id !== playId) return;
  }
  const done = status(convo.status);
  chat.append(done);
  done.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 400, easing: EASE });
  panel.removeAttribute("aria-busy");
}

convoTabs.forEach((tab, i) =>
  tab.addEventListener("click", () => {
    if (current === tab.dataset.convo) return;
    current = tab.dataset.convo;
    segmented.dataset.active = String(i);
    convoTabs.forEach((t) => t.setAttribute("aria-selected", String(t === tab)));
    panel.setAttribute("aria-labelledby", tab.id);
    playConvo(current);
  })
);
$("[data-replay]").addEventListener("click", () => playConvo(current));
onceInView(panel, () => playConvo(current), 0.45);

/* ---------- Copy email ---------- */
$$("[data-copy]").forEach((btn) => {
  const label = $("[data-copy-label]", btn);
  btn.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(btn.dataset.copy);
      label.textContent = "Copied";
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

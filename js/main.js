(function () {
  const data = window.PORTFOLIO;
  if (!data) return;

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  let lang = localStorage.getItem("portfolio-lang") === "en" ? "en" : "ru";
  let openId = null;
  let lastFocus = null;
  let estimateKind = "ops";
  let estimateVolume = 1;

  const dict = () => data[lang];

  function text(key) {
    return key.split(".").reduce((node, part) => (node ? node[part] : ""), dict());
  }

  function pad(n) {
    return String(n).padStart(2, "0");
  }

  function esc(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;");
  }

  function initials(name) {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return "•";
    return parts
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase();
  }

  function applyCopy() {
    const copy = dict();
    document.documentElement.lang = lang;
    document.title = data.person.name + " — " + copy.meta.title;
    const description = $('meta[name="description"]');
    if (description) description.setAttribute("content", copy.meta.description);

    $$("[data-i18n]").forEach((node) => {
      const value = text(node.getAttribute("data-i18n"));
      if (typeof value === "string") node.textContent = value;
    });

    $("#brandName").textContent = data.person.name;
    $("#footerName").textContent = "© " + new Date().getFullYear() + " " + data.person.name;
    $("#signature").textContent = data.person.name + " · " + copy.hero.role;
    $("#mailLink").textContent = data.person.email;
    $("#mailLink").href = "mailto:" + data.person.email;
    $("#langBtn").textContent = lang === "ru" ? "EN" : "RU";
    $("#langBtn").setAttribute("aria-label", lang === "ru" ? "Switch to English" : "Переключить на русский");
    $(".nav-links").setAttribute("aria-label", lang === "ru" ? "Разделы" : "Sections");
    $$(".field-error").forEach((node) => {
      node.textContent = "";
    });
    $$("#letter [aria-invalid]").forEach((node) => node.removeAttribute("aria-invalid"));

    const burgerLabel = $(".burger .sr");
    if (burgerLabel) {
      burgerLabel.textContent = $("#burger").classList.contains("is-open") ? copy.nav.close : copy.nav.menu;
    }

    renderMarquee();
    renderProjects();
    renderFacts();
    renderOffers();
    renderEstimate();
    renderPrinciples();
    renderSkills();
    renderExperience();
    renderLinks();
    if (openId) fillCase(openId);
  }

  function renderMarquee() {
    const track = $("#marqueeTrack");
    const group = document.createElement("div");
    group.className = "marquee-group";
    dict().marquee.forEach((phrase) => {
      const word = document.createElement("span");
      word.textContent = phrase;
      const mark = document.createElement("i");
      group.append(word, mark);
    });
    const clone = group.cloneNode(true);
    clone.setAttribute("aria-hidden", "true");
    track.replaceChildren(group, clone);
  }

  function artMarkup(kind) {
    const ru = lang === "ru";
    const screen = (title, body, foot, meta) => `
      <svg viewBox="0 0 400 520" preserveAspectRatio="xMidYMid slice" role="presentation">
        <rect width="400" height="520" fill="#171713"/>
        <rect x="18" y="18" width="364" height="40" rx="12" fill="#24241f"/>
        <circle cx="40" cy="38" r="5" fill="#ff5c39"/>
        <circle cx="56" cy="38" r="5" fill="#dff25a"/>
        <text x="78" y="43" fill="#f3f0e7" font-family="Manrope, sans-serif" font-size="13" font-weight="700">${title}</text>
        ${body}
        <rect x="18" y="474" width="364" height="32" rx="10" fill="#24241f"/>
        <circle cx="36" cy="490" r="4" fill="#b6e23a"/>
        <text x="48" y="494" fill="#f3f0e7" font-family="Manrope, sans-serif" font-size="12" font-weight="700">${foot}</text>
        <text x="370" y="494" text-anchor="end" fill="#a7a193" font-family="Manrope, sans-serif" font-size="11">${meta}</text>
      </svg>`;
    const row = (y, label, state, color) => `
      <rect x="18" y="${y}" width="364" height="58" rx="12" fill="#24241f"/>
      <circle cx="40" cy="${y + 29}" r="5" fill="${color}"/>
      <text x="56" y="${y + 26}" fill="#f3f0e7" font-family="Manrope, sans-serif" font-size="14" font-weight="700">${label}</text>
      <text x="56" y="${y + 44}" fill="#a7a193" font-family="Manrope, sans-serif" font-size="12">${state}</text>`;
    if (kind === "board") {
      return screen(
        ru ? "Смена · доска" : "Shift · board",
        row(78, ru ? "СМ-104  северный склад" : "SH-104  north warehouse", ru ? "В пути · бригада 2" : "En route · crew 2", "#b6e23a") +
          row(148, ru ? "СМ-118  объект 3" : "SH-118  site 3", ru ? "Ждёт замер" : "Waiting on measure", "#e2c15a") +
          row(218, ru ? "СМ-097  аварийный" : "SH-097  emergency", ru ? "Горит · 2 часа" : "Hot · 2 hours", "#ff5c39") +
          `<rect x="18" y="296" width="176" height="86" rx="14" fill="#24241f"/>
           <rect x="206" y="296" width="176" height="86" rx="14" fill="#24241f"/>
           <text x="34" y="332" fill="#dff25a" font-family="Unbounded, sans-serif" font-size="28">18</text>
           <text x="34" y="356" fill="#a7a193" font-family="Manrope, sans-serif" font-size="12">${ru ? "в смене" : "on shift"}</text>
           <text x="222" y="332" fill="#ff5c39" font-family="Unbounded, sans-serif" font-size="28">4</text>
           <text x="222" y="356" fill="#a7a193" font-family="Manrope, sans-serif" font-size="12">${ru ? "просрочены" : "overdue"}</text>
           <rect x="18" y="402" width="364" height="10" rx="5" fill="#3a3a33"/>
           <rect x="18" y="402" width="250" height="10" rx="5" fill="#dff25a"/>
           <text x="18" y="456" fill="#a7a193" font-family="Manrope, sans-serif" font-size="12">${ru ? "закрыто 14 из 18" : "14 of 18 closed"}</text>`,
        ru ? "Смена идёт" : "Shift is open",
        ru ? "14 из 18" : "14 of 18"
      );
    }
    if (kind === "till") {
      return screen(
        ru ? "Смена · касса" : "Shift · till",
        `<text x="22" y="86" fill="#a7a193" font-family="Manrope, sans-serif" font-size="12">${ru ? "СМ-104 · счёт" : "SH-104 · invoice"}</text>
         <text x="22" y="132" fill="#f3f0e7" font-family="Unbounded, sans-serif" font-size="36">248 000</text>
         <text x="250" y="128" fill="#dff25a" font-family="Manrope, sans-serif" font-size="14" font-weight="700">${ru ? "К ОПЛАТЕ" : "DUE"}</text>
         <rect x="18" y="160" width="364" height="1" fill="#3a3a33"/>
         <text x="22" y="196" fill="#f3f0e7" font-family="Manrope, sans-serif" font-size="14">${ru ? "Выезд бригады" : "Crew run"}</text>
         <text x="300" y="196" fill="#f3f0e7" font-family="Manrope, sans-serif" font-size="14">86 000</text>
         <text x="22" y="232" fill="#f3f0e7" font-family="Manrope, sans-serif" font-size="14">${ru ? "Работа на объекте" : "Work on site"}</text>
         <text x="300" y="232" fill="#f3f0e7" font-family="Manrope, sans-serif" font-size="14">142 000</text>
         <text x="22" y="268" fill="#f3f0e7" font-family="Manrope, sans-serif" font-size="14">${ru ? "Материалы" : "Materials"}</text>
         <text x="310" y="268" fill="#f3f0e7" font-family="Manrope, sans-serif" font-size="14">20 000</text>
         <rect x="18" y="300" width="364" height="72" rx="14" fill="#24241f"/>
         <text x="34" y="332" fill="#a7a193" font-family="Manrope, sans-serif" font-size="12">${ru ? "Акт из той же заявки" : "Act from the same ticket"}</text>
         <text x="34" y="354" fill="#dff25a" font-family="Manrope, sans-serif" font-size="14" font-weight="700">${ru ? "PDF · без повторного ввода" : "PDF · nothing retyped"}</text>
         <rect x="18" y="392" width="176" height="70" rx="14" fill="#24241f"/>
         <rect x="206" y="392" width="176" height="70" rx="14" fill="#24241f"/>
         <text x="34" y="424" fill="#f3f0e7" font-family="Unbounded, sans-serif" font-size="22">12</text>
         <text x="34" y="446" fill="#a7a193" font-family="Manrope, sans-serif" font-size="12">${ru ? "актов за день" : "acts today"}</text>
         <text x="222" y="424" fill="#e2c15a" font-family="Unbounded, sans-serif" font-size="22">1</text>
         <text x="222" y="446" fill="#a7a193" font-family="Manrope, sans-serif" font-size="12">${ru ? "спор по сумме" : "amount dispute"}</text>`,
        ru ? "Акт собран" : "Act is ready",
        ru ? "СМ-104" : "SH-104"
      );
    }
    if (kind === "link") {
      return screen(
        ru ? "Смена · связь" : "Shift · link",
        row(78, ru ? "СМ-104  учёт" : "SH-104  books", ru ? "Попытка 2 · повтор через 4 мин" : "Attempt 2 · retry in 4 min", "#e2c15a") +
          row(148, ru ? "СМ-110  оплата" : "SH-110  payment", ru ? "Принято · 12:14" : "Accepted · 12:14", "#b6e23a") +
          row(218, ru ? "СМ-097  почта клиенту" : "SH-097  mail to client", ru ? "Ошибка 502 · нужна рука" : "Error 502 · needs a person", "#ff5c39") +
          `<rect x="18" y="296" width="364" height="166" rx="14" fill="#24241f"/>
           <text x="34" y="328" fill="#a7a193" font-family="Manrope, sans-serif" font-size="12">${ru ? "ЖУРНАЛ" : "LOG"}</text>
           <text x="34" y="356" fill="#f3f0e7" font-family="Manrope, sans-serif" font-size="13">12:41  POST /jobs/104  202</text>
           <text x="34" y="380" fill="#ff5c39" font-family="Manrope, sans-serif" font-size="13">12:44  MAIL 097  502</text>
           <text x="34" y="404" fill="#dff25a" font-family="Manrope, sans-serif" font-size="13">12:46  PAY 110  ok</text>
           <text x="34" y="428" fill="#a7a193" font-family="Manrope, sans-serif" font-size="12">${ru ? "96% дошло · 3 ждут повтор" : "96% delivered · 3 waiting"}</text>
           <text x="34" y="450" fill="#e2c15a" font-family="Manrope, sans-serif" font-size="12">${ru ? "повтор СМ-104 · через 4 мин" : "retry SH-104 · in 4 min"}</text>`,
        ru ? "Ждёт повтор" : "Waiting retry",
        "04:00"
      );
    }
    if (kind === "window") {
      const shots = [18, 80, 142, 204, 266, 328]
        .map((x, i) => {
          const sky = ["#3f4a2a", "#34342c", "#3a3328", "#2e342c", "#38342a", "#32362c"][i];
          const sun = i % 2 ? "#e2c15a" : "#dff25a";
          return `<g>
            <rect x="${x}" y="322" width="54" height="40" rx="8" fill="${sky}"/>
            <circle cx="${x + 16}" cy="334" r="4" fill="${sun}"/>
            <path d="M${x + 4} 362 L${x + 18} 344 L${x + 30} 354 L${x + 50} 338 L${x + 50} 362 Z" fill="#141410" opacity="0.55"/>
          </g>`;
        })
        .join("");
      return screen(
        ru ? "Смена · окно" : "Shift · window",
        `<text x="22" y="84" fill="#a7a193" font-family="Manrope, sans-serif" font-size="12">${ru ? "Заявка СМ-104" : "Ticket SH-104"}</text>
         <text x="22" y="116" fill="#f3f0e7" font-family="Unbounded, sans-serif" font-size="24">${ru ? "Бригада на объекте" : "Crew on site"}</text>
         <rect x="18" y="136" width="110" height="8" rx="4" fill="#dff25a"/>
         <rect x="136" y="136" width="110" height="8" rx="4" fill="#dff25a"/>
         <rect x="254" y="136" width="128" height="8" rx="4" fill="#3a3a33"/>
         <text x="18" y="164" fill="#a7a193" font-family="Manrope, sans-serif" font-size="11">${ru ? "принята" : "accepted"}</text>
         <text x="136" y="164" fill="#a7a193" font-family="Manrope, sans-serif" font-size="11">${ru ? "в работе" : "in progress"}</text>
         <text x="254" y="164" fill="#a7a193" font-family="Manrope, sans-serif" font-size="11">${ru ? "закрыта" : "closed"}</text>
         <rect x="18" y="180" width="178" height="58" rx="12" fill="#24241f"/>
         <rect x="204" y="180" width="178" height="58" rx="12" fill="#24241f"/>
         <text x="32" y="204" fill="#f3f0e7" font-family="Manrope, sans-serif" font-size="13" font-weight="700">${ru ? "Акт и 6 фото" : "Act and 6 photos"}</text>
         <text x="32" y="222" fill="#dff25a" font-family="Manrope, sans-serif" font-size="11">${ru ? "к просмотру" : "ready to open"}</text>
         <text x="218" y="204" fill="#f3f0e7" font-family="Manrope, sans-serif" font-size="13" font-weight="700">${ru ? "Счёт 248 000 ₽" : "Invoice 248 000 ₽"}</text>
         <text x="218" y="222" fill="#e2c15a" font-family="Manrope, sans-serif" font-size="11">${ru ? "в этом окне" : "in this window"}</text>
         <text x="22" y="310" fill="#a7a193" font-family="Manrope, sans-serif" font-size="11">${ru ? "Фото с объекта" : "Photos from the site"}</text>
         ${shots}
         <rect x="18" y="376" width="364" height="84" rx="14" fill="#24241f"/>
         <text x="34" y="408" fill="#f3f0e7" font-family="Unbounded, sans-serif" font-size="20">${ru ? "без звонка" : "no phone call"}</text>
         <text x="34" y="434" fill="#a7a193" font-family="Manrope, sans-serif" font-size="12">${ru ? "статус, файлы и счёт в одной заявке" : "status, files and invoice together"}</text>
         <text x="34" y="452" fill="#dff25a" font-family="Manrope, sans-serif" font-size="12">${ru ? "клиент смотрит окно · 14:18" : "client has the window · 14:18"}</text>`,
        ru ? "Окно открыто" : "Window is open",
        "14:20"
      );
    }
    if (kind === "atlas") {
      return `
        <svg viewBox="0 0 400 480" role="presentation">
          <rect width="400" height="480" fill="#171713"/>
          <rect x="36" y="36" width="328" height="48" rx="12" fill="#24241f"/>
          <circle cx="64" cy="60" r="6" fill="#ff5c39"/>
          <circle cx="84" cy="60" r="6" fill="#dff25a"/>
          <rect x="108" y="52" width="120" height="16" rx="8" fill="#3a3a33"/>
          <g class="bars" fill="#dff25a">
            <rect x="48" y="250" width="56" height="150" rx="10"/>
            <rect x="124" y="190" width="56" height="210" rx="10"/>
            <rect x="200" y="220" width="56" height="180" rx="10"/>
            <rect x="276" y="140" width="56" height="260" rx="10"/>
          </g>
          <path d="M48 180 C 110 150, 160 210, 220 160 S 330 120, 360 150" fill="none" stroke="#f3f0e7" stroke-width="3"/>
        </svg>`;
    }
    if (kind === "signal") {
      return `
        <svg viewBox="0 0 400 480" role="presentation">
          <rect width="400" height="480" fill="#171713"/>
          <circle cx="200" cy="230" r="120" fill="none" stroke="#3a3a33" stroke-width="10"/>
          <circle cx="200" cy="230" r="78" fill="none" stroke="#dff25a" stroke-width="2" stroke-dasharray="4 8"/>
          <g class="dial">
            <line x1="200" y1="230" x2="200" y2="128" stroke="#f3f0e7" stroke-width="3"/>
            <circle cx="200" cy="230" r="7" fill="#ff5c39"/>
          </g>
          <text x="200" y="400" text-anchor="middle" fill="#dff25a" font-family="Unbounded, sans-serif" font-size="28">+03</text>
        </svg>`;
    }
    if (kind === "reestr") {
      return `
        <svg viewBox="0 0 400 480" role="presentation">
          <rect width="400" height="480" fill="#171713"/>
          <rect x="36" y="40" width="200" height="18" rx="9" fill="#f3f0e7"/>
          <rect x="36" y="78" width="140" height="10" rx="5" fill="#3a3a33"/>
          <rect x="36" y="140" width="328" height="52" rx="12" fill="#24241f"/>
          <rect x="36" y="204" width="328" height="52" rx="12" fill="#24241f"/>
          <rect x="36" y="268" width="328" height="52" rx="12" fill="#24241f"/>
          <rect x="52" y="158" width="90" height="10" rx="5" fill="#dff25a"/>
          <rect x="52" y="222" width="120" height="10" rx="5" fill="#f3f0e7"/>
          <rect x="52" y="286" width="70" height="10" rx="5" fill="#f3f0e7"/>
          <text x="36" y="400" fill="#dff25a" font-family="Unbounded, sans-serif" font-size="42">248 000</text>
        </svg>`;
    }
    if (kind === "gateway") {
      return `
        <svg viewBox="0 0 400 480" role="presentation">
          <rect width="400" height="480" fill="#171713"/>
          <path d="M90 160 H180 M220 160 H310 M200 190 V270" fill="none" stroke="#3a3a33" stroke-width="8" stroke-linecap="round"/>
          <circle cx="90" cy="160" r="28" fill="#dff25a"/>
          <circle cx="200" cy="160" r="36" fill="#24241f" stroke="#f3f0e7" stroke-width="4"/>
          <circle cx="310" cy="160" r="28" fill="#ff5c39"/>
          <rect x="120" y="300" width="160" height="64" rx="16" fill="#24241f"/>
          <rect x="140" y="324" width="90" height="12" rx="6" fill="#dff25a"/>
        </svg>`;
    }
    if (kind === "cabinet" || kind === "kontur") {
      return `
        <svg viewBox="0 0 400 480" role="presentation">
          <rect width="400" height="480" fill="#171713"/>
          <path d="M40 300 C 90 240, 140 340, 200 280 S 320 180, 370 240" fill="none" stroke="#3a3a33" stroke-width="18" stroke-linecap="round"/>
          <path d="M50 250 C 120 180, 150 300, 230 220 S 330 150, 360 210" fill="none" stroke="#dff25a" stroke-width="8" stroke-linecap="round"/>
          <circle cx="230" cy="220" r="10" fill="#ff5c39"/>
          <rect x="48" y="360" width="90" height="14" rx="7" fill="#f3f0e7"/>
          <rect x="48" y="386" width="150" height="10" rx="5" fill="#3a3a33"/>
          <rect x="48" y="406" width="120" height="10" rx="5" fill="#3a3a33"/>
        </svg>`;
    }
    return `
      <svg viewBox="0 0 400 480" role="presentation">
        <rect width="400" height="480" fill="#171713"/>
        <text x="36" y="150" fill="#f3f0e7" font-family="Unbounded, sans-serif" font-size="92">Аа</text>
        <rect x="36" y="190" width="180" height="8" fill="#dff25a"/>
        <rect x="36" y="230" width="250" height="8" fill="#3a3a33"/>
        <rect x="36" y="252" width="210" height="8" fill="#3a3a33"/>
        <rect x="36" y="274" width="160" height="8" fill="#3a3a33"/>
        <rect x="36" y="360" width="64" height="64" fill="#dff25a"/>
        <rect x="52" y="376" width="32" height="32" fill="#171713"/>
      </svg>`;
  }

  function renderProjects() {
    const stack = $("#stack");
    const copy = dict();
    stack.replaceChildren(
      ...data.projects.map((project, index) => {
        const link = document.createElement("a");
        link.className = "card";
        link.href = "#project/" + project.id;
        link.dataset.project = project.id;
        link.style.zIndex = String(index + 1);
        const local = project[lang];
        const rows = (local.rows || [])
          .map(
            (row) => `
            <li>
              <i class="${esc(row.tone || "go")}"></i>
              <span>${esc(row.t)}</span>
              <b>${esc(row.s)}</b>
            </li>`
          )
          .join("");
        const stats = (local.stats || [])
          .map((stat) => `<div><strong>${esc(stat.n)}</strong><span>${esc(stat.l)}</span></div>`)
          .join("");
        const steps = copy.work.steps || [];
        const trail = steps
          .map((name, step) => {
            const state = step < index ? "is-done" : step === index ? "is-on" : "";
            return `<li class="${state}"><b>${pad(step + 1)}</b><span>${esc(name)}</span></li>`;
          })
          .join("");
        link.innerHTML = `
          <div class="card-face">
            <div class="card-copy">
              <div class="card-top">
                <span class="card-index">${pad(index + 1)} · ${esc(local.sector)}</span>
                <span class="card-year">${esc(copy.work.mark)} · ${esc(project.year)}</span>
              </div>
              <h3>${esc(local.title)}</h3>
              <p>${esc(local.summary)}</p>
              <ul class="board">${rows}</ul>
              <div class="metrics">${stats}</div>
              <p class="live"><i class="pulse"></i>${esc(local.pulse || "")}</p>
              <ul class="tags">${project.tags.map((tag) => `<li>${esc(tag)}</li>`).join("")}</ul>
              <div class="card-foot">
                <ol class="trail">${trail}</ol>
                <span class="card-go">${esc(copy.work.open)}
                  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>
                </span>
              </div>
            </div>
            <div class="art" data-art>${artMarkup(project.art)}</div>
          </div>`;
        return link;
      })
    );
    if (document.documentElement.classList.contains("is-ready")) {
      $$(".art").forEach((art) => art.classList.add("is-in"));
    }
  }

  function renderFacts() {
    const list = $("#facts");
    if (!list) return;
    list.innerHTML = dict()
      .facts.map((item) => `<li><span>${esc(item.n)}</span>${esc(item.t)}</li>`)
      .join("");
  }

  function renderOffers() {
    const grid = $("#servicesGrid");
    if (!grid) return;
    grid.innerHTML = dict()
      .offers.map(
        (item) => `
        <article class="service-card">
          <span>${esc(item.n)}</span>
          <strong>${esc(item.t)}</strong>
          <em>${esc(item.line || "")}</em>
          <p>${esc(item.d)}</p>
        </article>`
      )
      .join("");
  }

  function paintEstimate() {
    const block = dict().estimate;
    const root = $("#estimate");
    if (!root) return;
    const kind = block.kinds.find((item) => item.id === estimateKind) || block.kinds[0];
    const factor = [0.85, 1, 1.45][estimateVolume] || 1;
    const price = Math.round((kind.from * factor) / 10000) * 10000;
    const amount = new Intl.NumberFormat("ru-RU").format(price);
    root.querySelector("[data-volume-label]").textContent = block.volumes[estimateVolume];
    root.querySelector("[data-weeks]").textContent = kind.weeks;
    root.querySelector("[data-price]").textContent = (lang === "ru" ? "от " : "from ") + amount + " ₽";
    root.querySelector("[data-includes]").textContent = kind.includes;
  }

  function renderEstimate() {
    const block = dict().estimate;
    const root = $("#estimate");
    if (!root) return;
    root.innerHTML = `
      <div>
        <p class="kicker">${esc(block.kicker)}</p>
        <h3>${esc(block.title)}</h3>
        <p class="estimate-lead">${esc(block.lead)}</p>
      </div>
      <div class="estimate-controls">
        <div class="picks" role="radiogroup" aria-label="${esc(block.title)}">
          ${block.kinds
            .map(
              (kind) =>
                `<button type="button" data-kind="${esc(kind.id)}" class="${kind.id === estimateKind ? "is-on" : ""}">${esc(kind.t)}</button>`
            )
            .join("")}
        </div>
        <label class="volume">${esc(block.volume)} · <span data-volume-label></span>
          <input data-volume type="range" min="0" max="2" step="1" value="${estimateVolume}" />
        </label>
        <div class="estimate-out">
          <div><span>${esc(block.weeks)}</span><strong data-weeks></strong></div>
          <div><span>${esc(block.from)}</span><strong data-price></strong></div>
        </div>
        <p class="pick-copy" data-includes></p>
        <p class="estimate-note">${esc(block.note)}</p>
      </div>`;
    root.querySelectorAll("[data-kind]").forEach((button) => {
      button.addEventListener("click", () => {
        estimateKind = button.getAttribute("data-kind");
        root.querySelectorAll("[data-kind]").forEach((node) => {
          node.classList.toggle("is-on", node === button);
        });
        paintEstimate();
      });
    });
    root.querySelector("[data-volume]").addEventListener("input", (event) => {
      estimateVolume = Number(event.target.value);
      paintEstimate();
    });
    paintEstimate();
  }

  function renderPrinciples() {
    $("#principles").innerHTML = dict()
      .principles.map(
        (item) => `
        <li class="reveal">
          <span>${item.n}</span>
          <strong>${item.t}</strong>
          <p>${item.d}</p>
        </li>`
      )
      .join("");
  }

  function renderSkills() {
    $("#skills").innerHTML = dict()
      .skills.map(
        (group) => `
        <article class="skill-group">
          <h4>${group.group}</h4>
          <div class="chips">${group.items.map((item) => `<span>${item}</span>`).join("")}</div>
        </article>`
      )
      .join("");
  }

  function renderExperience() {
    const list = $("#timeline");
    list.innerHTML = data.experience
      .map((item) => {
        const local = item[lang];
        return `
          <li class="reveal">
            <time>${item.period}</time>
            <div>
              <h3>${local.title}</h3>
              <p class="place">${local.place}</p>
              <p>${local.text}</p>
            </div>
          </li>`;
      })
      .join("");
  }

  function renderLinks() {
    const wrap = $("#contactLinks");
    const copy = dict();
    const links = [
      data.person.telegram ? { href: data.person.telegram, label: "Telegram" } : null,
      data.person.github ? { href: data.person.github, label: "GitHub" } : null,
      data.person.resume ? { href: data.person.resume, label: copy.contact.resume } : null,
    ].filter(Boolean);
    wrap.replaceChildren(
      ...links.map((item) => {
        const anchor = document.createElement("a");
        anchor.href = item.href;
        anchor.textContent = item.label;
        if (/^https?:/.test(item.href)) {
          anchor.target = "_blank";
          anchor.rel = "noreferrer";
        }
        return anchor;
      })
    );
  }

  function finishBoot() {
    document.documentElement.classList.remove("is-booting");
    document.documentElement.classList.add("is-ready");
    $$(".art").forEach((art) => art.classList.add("is-in"));
    const hash = location.hash.replace("#", "");
    if (hash && !hash.startsWith("project/") && document.getElementById(hash)) {
      document.getElementById(hash).scrollIntoView();
    }
  }

  function boot() {
    if (reduced) {
      finishBoot();
      return;
    }
    const num = $("#loaderNum");
    const bar = $("#loaderBar");
    const start = performance.now();
    const duration = 900;
    function frame(now) {
      const progress = Math.min(1, (now - start) / duration);
      const value = Math.round(progress * 100);
      num.textContent = pad(value);
      bar.style.width = value + "%";
      if (progress < 1) {
        requestAnimationFrame(frame);
        return;
      }
      setTimeout(finishBoot, 180);
    }
    requestAnimationFrame(frame);
    setTimeout(finishBoot, 2200);
  }

  function tickClock() {
    const clock = $("#clock");
    try {
      clock.textContent = new Intl.DateTimeFormat(lang === "ru" ? "ru-RU" : "en-GB", {
        hour: "2-digit",
        minute: "2-digit",
        timeZone: data.person.timezone || "Europe/Moscow",
      }).format(new Date());
    } catch (error) {
      clock.textContent = "";
    }
  }

  function updateStack() {
    const faces = $$(".card-face");
    if (reduced || window.innerWidth <= 980) {
      faces.forEach((face) => {
        face.style.transform = "";
        face.style.setProperty("--shade", "0");
      });
      return;
    }
    const cards = $$(".card");
    cards.forEach((card, index) => {
      const face = card.querySelector(".card-face");
      const next = cards[index + 1];
      if (!face || !next) {
        if (face) {
          face.style.transform = "";
          face.style.setProperty("--shade", "0");
        }
        return;
      }
      const top = next.getBoundingClientRect().top;
      const start = window.innerHeight * 0.85;
      const end = 96;
      const progress = Math.min(1, Math.max(0, (start - top) / (start - end)));
      face.style.transform = `scale(${1 - progress * 0.045})`;
      face.style.setProperty("--shade", (progress * 0.28).toFixed(3));
    });
  }

  function updateTheme() {
    const nav = $("#nav");
    const y = nav.getBoundingClientRect().bottom + 28;
    const probe = document.elementsFromPoint(window.innerWidth / 2, y).find((node) => {
      return node.closest && node.closest(".on-light");
    });
    const onLight = Boolean(probe);
    nav.classList.toggle("on-light", onLight);
    document.body.classList.toggle("theme-light", onLight);
    nav.classList.toggle("is-scrolled", window.scrollY > 12);
  }

  function updateRail() {
    const ids = ["top", "work", "services", "about", "practice", "contact"];
    let current = "top";
    ids.forEach((id) => {
      const section = document.getElementById(id);
      if (!section) return;
      if (section.getBoundingClientRect().top < window.innerHeight * 0.45) current = id;
    });
    $$("[data-rail]").forEach((node) => {
      node.classList.toggle("is-on", node.getAttribute("data-rail") === current);
    });
    $$(".nav-links a").forEach((link) => {
      const id = link.getAttribute("href").slice(1);
      if (ids.includes(id)) link.toggleAttribute("aria-current", id === current);
    });
    const timeline = $("#timeline");
    const rect = timeline.getBoundingClientRect();
    const seen = Math.min(1, Math.max(0, (window.innerHeight * 0.75 - rect.top) / (rect.height || 1)));
    timeline.style.setProperty("--draw", seen.toFixed(3));
  }

  function moveGlow(event) {
    if (!finePointer || reduced) return;
    const glow = $("#glow");
    glow.style.left = event.clientX + "px";
    glow.style.top = event.clientY + "px";
  }

  function tiltArt(card, event) {
    if (!finePointer || reduced) return;
    const art = card.querySelector("[data-art]");
    if (!art) return;
    const rect = art.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;
    art.style.transform = `rotateY(${x * 7}deg) rotateX(${-y * 7}deg)`;
  }

  function resetArt(card) {
    const art = card.querySelector("[data-art]");
    if (art) art.style.transform = "";
  }

  const ABC = "АБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ";

  function caesar(value, shift) {
    return [...value]
      .map((char) => {
        const upper = char.toUpperCase();
        const index = ABC.indexOf(upper);
        if (index < 0) return char;
        const next = ABC[(index + shift) % ABC.length];
        return char === upper ? next : next.toLowerCase();
      })
      .join("");
  }

  function bindCipher(root) {
    const input = $("[data-cipher-input]", root);
    const range = $("[data-cipher-range]", root);
    const output = $("[data-cipher-out]", root);
    const alpha = $("[data-alpha]", root);
    const value = $("[data-shift-value]", root);
    if (!input) return;

    function paint() {
      const shift = Number(range.value);
      value.textContent = "+" + pad(shift);
      output.textContent = caesar(input.value, shift);
      const sample = (input.value.trim()[0] || "А").toUpperCase();
      const from = ABC.includes(sample) ? sample : "А";
      const to = caesar(from, shift);
      alpha.innerHTML = [...ABC]
        .map((letter) => `<b class="${letter === from || letter === to ? "on" : ""}">${letter}</b>`)
        .join("");
    }

    input.addEventListener("input", paint);
    range.addEventListener("input", paint);
    paint();
  }

  function fillCase(id) {
    const index = data.projects.findIndex((item) => item.id === id);
    const project = data.projects[index];
    if (!project) return;
    const copy = dict();
    const local = project[lang];
    const next = data.projects[(index + 1) % data.projects.length];
    const rows = (local.rows || [])
      .map(
        (row) => `
        <li>
          <i class="${esc(row.tone || "go")}"></i>
          <span>${esc(row.t)}</span>
          <b>${esc(row.s)}</b>
        </li>`
      )
      .join("");
    const stats = (local.stats || [])
      .map((stat) => `<div><strong>${esc(stat.n)}</strong><span>${esc(stat.l)}</span></div>`)
      .join("");
    $("#caseIndex").textContent = pad(index + 1);
    const body = $("#caseBody");
    body.innerHTML = `
      <div class="case-hero">
        <div class="case-art">${artMarkup(project.art)}</div>
        <div class="case-copy">
          <h2 id="caseTitle">${esc(local.title)}</h2>
          <p>${esc(local.summary)}</p>
          <ul class="board">${rows}</ul>
          <div class="metrics">${stats}</div>
        </div>
      </div>
      <div class="case-meta">
        <div><span>${esc(copy.case.role)}</span><strong>${esc(local.role)}</strong></div>
        <div><span>${esc(copy.case.year)}</span><strong>${esc(project.year)}</strong></div>
        <div><span>${esc(copy.case.stack)}</span><strong>${esc(project.tags.join(" · "))}</strong></div>
      </div>
      <section class="case-block"><h3>${esc(copy.case.challenge)}</h3><p>${esc(local.challenge)}</p></section>
      <section class="case-block"><h3>${esc(copy.case.approach)}</h3><p>${esc(local.approach)}</p></section>
      <section class="case-block"><h3>${esc(copy.case.result)}</h3><p>${esc(local.result)}</p></section>
      <a class="case-next" href="#project/${next.id}">
        <span>${copy.case.next}</span>
        <span>${esc(next[lang].title)} →</span>
      </a>`;
    const art = $(".case-art", body);
    if (art) art.classList.add("is-in");
  }

  function openCase(id, push) {
    if (!data.projects.some((item) => item.id === id)) return;
    openId = id;
    lastFocus = document.activeElement;
    fillCase(id);
    const dialog = $("#case");
    dialog.hidden = false;
    requestAnimationFrame(() => dialog.classList.add("is-open"));
    document.body.style.overflow = "hidden";
    $(".case-panel").focus();
    if (push) history.pushState({ project: id }, "", "#project/" + id);
  }

  function closeCase(fromPop) {
    const dialog = $("#case");
    if (!openId && !dialog.classList.contains("is-open")) return;
    const shouldBack = !fromPop && history.state && history.state.project;
    const shouldReplace = !fromPop && !shouldBack && location.hash.startsWith("#project/");
    openId = null;
    dialog.classList.remove("is-open");
    document.body.style.overflow = "";
    const hide = () => {
      dialog.hidden = true;
    };
    if (reduced) hide();
    else setTimeout(hide, 420);
    if (lastFocus && lastFocus.focus) lastFocus.focus();
    if (shouldBack) history.back();
    else if (shouldReplace) history.replaceState(null, "", location.pathname + location.search);
  }

  function projectFromHash() {
    const match = location.hash.match(/^#project\/([a-z0-9-]+)/i);
    return match ? match[1] : null;
  }

  function trapTab(event) {
    if (event.key !== "Tab" || !$("#case").classList.contains("is-open")) return;
    const nodes = $$(".case-panel button, .case-panel a, .case-panel input").filter((node) => !node.hidden);
    if (!nodes.length) return;
    const first = nodes[0];
    const last = nodes[nodes.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  function setMenu(open) {
    const burger = $("#burger");
    const menu = $("#mobileNav");
    burger.classList.toggle("is-open", open);
    burger.setAttribute("aria-expanded", String(open));
    menu.hidden = !open;
    document.body.style.overflow = open ? "hidden" : "";
    const label = $(".burger .sr");
    label.textContent = open ? dict().nav.close : dict().nav.menu;
  }

  function validate(form) {
    const copy = dict().form;
    const name = form.name.value.trim();
    const email = form.email.value.trim();
    const message = form.message.value.trim();
    const errors = {
      name: name ? "" : copy.name,
      email: !email ? copy.email : /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? "" : copy.emailBad,
      message: message.length >= 8 ? "" : copy.message,
    };
    Object.entries(errors).forEach(([key, value]) => {
      const slot = form.querySelector(`[data-for="${key}"]`);
      slot.textContent = value;
      form[key].setAttribute("aria-invalid", value ? "true" : "false");
    });
    return Object.values(errors).every((value) => !value);
  }

  function bind() {
    $("#langBtn").addEventListener("click", () => {
      lang = lang === "ru" ? "en" : "ru";
      localStorage.setItem("portfolio-lang", lang);
      applyCopy();
      tickClock();
    });

    $("#burger").addEventListener("click", () => {
      setMenu($("#mobileNav").hidden);
    });

    $("#mobileNav").addEventListener("click", (event) => {
      if (event.target.closest("a")) setMenu(false);
    });

    document.addEventListener("click", (event) => {
      const card = event.target.closest("[data-project]");
      if (card) {
        event.preventDefault();
        openCase(card.dataset.project, true);
        return;
      }
      const next = event.target.closest(".case-next");
      if (next) {
        event.preventDefault();
        const id = next.getAttribute("href").split("/").pop();
        openCase(id, true);
        $("#caseBody").scrollTop = 0;
        return;
      }
      if (event.target.closest("[data-close]")) closeCase(false);
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        if (!$("#mobileNav").hidden) setMenu(false);
        else if (openId) closeCase(false);
      }
      trapTab(event);
    });

    window.addEventListener("popstate", () => {
      const id = projectFromHash();
      if (id) openCase(id, false);
      else if (openId) closeCase(true);
    });

    $("#stack").addEventListener("mousemove", (event) => {
      const card = event.target.closest(".card");
      if (card) tiltArt(card, event);
    });
    $("#stack").addEventListener("mouseout", (event) => {
      const card = event.target.closest(".card");
      if (card && !card.contains(event.relatedTarget)) resetArt(card);
    });

    window.addEventListener("pointermove", moveGlow, { passive: true });
    window.addEventListener("scroll", () => {
      updateStack();
      updateTheme();
      updateRail();
    }, { passive: true });
    window.addEventListener("resize", () => {
      updateStack();
      updateTheme();
    });

    $("#letter").addEventListener("submit", (event) => {
      event.preventDefault();
      const form = event.currentTarget;
      if (!validate(form)) return;
      const company = form.company.value.trim();
      const who = form.name.value.trim() + (company ? ", " + company : "");
      const subject = encodeURIComponent(who + " — " + data.person.name);
      const body = encodeURIComponent(form.message.value.trim() + "\n\n— " + who + "\n" + form.email.value.trim());
      const success = $("#formSuccess");
      success.hidden = false;
      success.innerHTML =
        dict().contact.success +
        ` <a href="mailto:${data.person.email}">${data.person.email}</a>`;
      window.location.href = `mailto:${data.person.email}?subject=${subject}&body=${body}`;
    });
  }

  applyCopy();
  bind();
  boot();
  tickClock();
  setInterval(tickClock, 30000);
  updateTheme();
  updateRail();
  updateStack();

  const initial = projectFromHash();
  if (initial) openCase(initial, false);
})();

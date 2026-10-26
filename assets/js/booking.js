/* Booking flow: choose a slot -> your details -> pay & confirm on WhatsApp.
   Everything runs in the browser; there is no server. A slot is a REQUEST -
   the page cannot know what is already booked, so she confirms on WhatsApp. */
(function () {
  "use strict";

  /* ── Everything she might want to change lives here ───────────────── */
  var CONFIG = {
    whatsapp: "919645013429",

    // Consulting hours, India time. 0 = Sunday ... 6 = Saturday.
    // Each day is a list of [from, to] ranges in 24h "HH:MM".
    hours: {
      0: [],                      // Sunday - closed
      1: [["08:00", "18:00"]],
      2: [["08:00", "18:00"]],
      3: [["08:00", "18:00"]],
      4: [["08:00", "18:00"]],
      5: [["08:00", "18:00"]],
      6: [["08:00", "18:00"]]
    },

    slotMinutes: 30,   // length of one appointment
    leadHours: 12,     // no bookings closer than this
    daysAhead: 21,     // how far ahead the calendar runs

    fees: {
      india: { first: "₹500", follow: "₹300", report: "₹400" },
      intl:  { first: "US$30",     follow: "US$20",     report: "US$25" }
    },

    upi: "premalathaak@oksbi",

    // TODO: replace with her real PayPal handle (or a Wise link).
    paypal: "paypal.me/herhandle"
  };

  var TYPE_LABEL = {
    first: "First consultation",
    follow: "Follow-up (within 1 month)",
    report: "Report review / second opinion"
  };

  var IST_OFFSET_MIN = 330;   // India is UTC+5:30 all year, no DST

  /* ── Helpers ──────────────────────────────────────────────────────── */

  // A wall-clock time in India -> a real Date.
  function istToDate(y, m, d, hh, mm) {
    return new Date(Date.UTC(y, m, d, hh, mm) - IST_OFFSET_MIN * 60000);
  }

  // Today's date in India, as [y, m, d].
  function istToday() {
    var now = new Date();
    var ist = new Date(now.getTime() + IST_OFFSET_MIN * 60000);
    return [ist.getUTCFullYear(), ist.getUTCMonth(), ist.getUTCDate()];
  }

  function minutesOf(hhmm) {
    var p = hhmm.split(":");
    return parseInt(p[0], 10) * 60 + parseInt(p[1], 10);
  }

  function fmtIST(date) {
    return date.toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata",
      weekday: "short", day: "numeric", month: "short",
      hour: "numeric", minute: "2-digit", hour12: true
    });
  }

  function fmtISTTime(date) {
    return date.toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata", hour: "numeric", minute: "2-digit", hour12: true
    });
  }

  function fmtLocalTime(date) {
    return date.toLocaleString(undefined, {
      hour: "numeric", minute: "2-digit", hour12: true
    });
  }

  function fmtLocalFull(date) {
    return date.toLocaleString(undefined, {
      weekday: "short", day: "numeric", month: "short",
      hour: "numeric", minute: "2-digit", hour12: true
    });
  }

  var localZone = (Intl.DateTimeFormat().resolvedOptions().timeZone) || "";
  var inIndia = localZone === "Asia/Kolkata";

  /* ── Build the days and their slots ───────────────────────────────── */

  function buildDays() {
    var today = istToday();
    var cutoff = Date.now() + CONFIG.leadHours * 3600000;
    var days = [];

    for (var i = 0; i < CONFIG.daysAhead; i++) {
      var probe = new Date(Date.UTC(today[0], today[1], today[2] + i));
      var y = probe.getUTCFullYear(), m = probe.getUTCMonth(), d = probe.getUTCDate();
      var ranges = CONFIG.hours[probe.getUTCDay()] || [];
      var slots = [];

      ranges.forEach(function (range) {
        var from = minutesOf(range[0]), to = minutesOf(range[1]);
        for (var t = from; t + CONFIG.slotMinutes <= to; t += CONFIG.slotMinutes) {
          var when = istToDate(y, m, d, Math.floor(t / 60), t % 60);
          if (when.getTime() > cutoff) slots.push(when);
        }
      });

      days.push({ y: y, m: m, d: d, weekday: probe.getUTCDay(), slots: slots });
    }
    return days;
  }

  /* ── State ────────────────────────────────────────────────────────── */

  var days = buildDays();
  var chosenDay = null;
  var chosenSlot = null;

  var $ = function (id) { return document.getElementById(id); };

  /* ── Step 1: days and slots ───────────────────────────────────────── */

  function renderDays() {
    var strip = $("day-strip");
    strip.innerHTML = "";

    days.forEach(function (day, idx) {
      var date = new Date(Date.UTC(day.y, day.m, day.d));
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "day-btn";
      btn.disabled = day.slots.length === 0;
      btn.setAttribute("aria-pressed", "false");
      btn.innerHTML =
        '<span class="dow">' + date.toLocaleDateString("en-GB", { timeZone: "UTC", weekday: "short" }) + '</span>' +
        '<span class="dom">' + day.d + '</span>' +
        '<span class="mon">' + date.toLocaleDateString("en-GB", { timeZone: "UTC", month: "short" }) + '</span>';
      btn.addEventListener("click", function () { selectDay(idx); });
      strip.appendChild(btn);
    });

    // open on the first day that has slots
    for (var i = 0; i < days.length; i++) {
      if (days[i].slots.length) { selectDay(i); break; }
    }
  }

  function selectDay(idx) {
    chosenDay = idx;
    chosenSlot = null;

    var btns = $("day-strip").querySelectorAll(".day-btn");
    for (var i = 0; i < btns.length; i++) {
      var on = (i === idx);
      btns[i].classList.toggle("is-on", on);
      btns[i].setAttribute("aria-pressed", String(on));
    }
    renderSlots();
  }

  function renderSlots() {
    var grid = $("slot-grid");
    grid.innerHTML = "";
    var slots = days[chosenDay].slots;
    $("no-slots").hidden = slots.length > 0;

    slots.forEach(function (when) {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "slot-btn";
      var html = '<span class="ist">' + fmtISTTime(when) + '</span>';
      if (!inIndia) html += '<span class="local">' + fmtLocalTime(when) + ' your time</span>';
      btn.innerHTML = html;
      btn.addEventListener("click", function () {
        chosenSlot = when;
        goTo(2);
      });
      grid.appendChild(btn);
    });
  }

  /* ── Steps ────────────────────────────────────────────────────────── */

  function goTo(n) {
    [1, 2, 3].forEach(function (i) { $("step" + i).hidden = (i !== n); });

    var items = $("stepper").children;
    for (var i = 0; i < items.length; i++) {
      items[i].classList.toggle("is-current", i === n - 1);
      items[i].classList.toggle("is-done", i < n - 1);
    }

    if (n === 2) $("chosen-1").innerHTML = chosenLine();
    if (n === 3) renderSummary();

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function chosenLine() {
    var line = '<strong>' + fmtIST(chosenSlot) + ' IST</strong>';
    if (!inIndia) line += '<span>' + fmtLocalFull(chosenSlot) + ' your time (' + localZone + ')</span>';
    return line;
  }

  /* ── Step 3: summary, fee and the WhatsApp message ────────────────── */

  function region() {
    var picked = document.querySelector('input[name="region"]:checked');
    return picked ? picked.value : (inIndia ? "india" : "intl");
  }

  function fee() {
    return CONFIG.fees[region()][$("f-type").value];
  }

  function renderSummary() {
    var mode = $("f-mode").value;
    $("summary").innerHTML =
      '<dl>' +
      '<dt>Time</dt><dd>' + fmtIST(chosenSlot) + ' IST' +
        (inIndia ? '' : '<br><span class="muted">' + fmtLocalFull(chosenSlot) + ' your time</span>') + '</dd>' +
      '<dt>Name</dt><dd>' + esc($("f-name").value) + ', ' + esc($("f-age").value) + '</dd>' +
      '<dt>From</dt><dd>' + esc($("f-city").value) + '</dd>' +
      '<dt>Consultation</dt><dd>' + TYPE_LABEL[$("f-type").value] + ' · ' + esc(mode) + '</dd>' +
      '</dl>';
    updatePayment();
  }

  function updatePayment() {
    var r = region();
    $("fee-amount").textContent = fee();
    $("pay-india").hidden = (r !== "india");
    $("pay-intl").hidden = (r === "india");
    $("upi-id").textContent = CONFIG.upi;
    $("paypal-id").textContent = CONFIG.paypal;
    $("wa-send").href = waLink();
  }

  function waLink() {
    var lines = [
      "Namaste Doctor, I would like to book a consultation.",
      "",
      "Slot: " + fmtIST(chosenSlot) + " IST"
    ];
    if (!inIndia) lines.push("(" + fmtLocalFull(chosenSlot) + " my time, " + localZone + ")");
    lines.push(
      "Name: " + $("f-name").value,
      "Age: " + $("f-age").value,
      "From: " + $("f-city").value,
      "Consultation: " + TYPE_LABEL[$("f-type").value],
      "Mode: " + $("f-mode").value,
      "Fee: " + fee(),
      "",
      "Reason: " + $("f-reason").value
    );
    return "https://wa.me/" + CONFIG.whatsapp + "?text=" + encodeURIComponent(lines.join("\n"));
  }

  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }

  /* ── Wiring ───────────────────────────────────────────────────────── */

  function init() {
    if (!inIndia && localZone) {
      $("tz-note").innerHTML =
        'Times are shown in India time (IST) with your own time underneath - you appear to be in <strong>' +
        localZone.replace(/_/g, " ") + '</strong>.';
    }

    renderDays();

    $("to-step3").addEventListener("click", function () {
      var missing = ["f-name", "f-age", "f-city", "f-reason"].filter(function (id) {
        return !$(id).value.trim();
      });
      var err = $("step2-error");
      if (missing.length) {
        err.textContent = "Please fill in your name, age, city and what is troubling you.";
        err.hidden = false;
        $(missing[0]).focus();
        return;
      }
      err.hidden = true;
      goTo(3);
    });

    Array.prototype.forEach.call(document.querySelectorAll("[data-back]"), function (btn) {
      btn.addEventListener("click", function () { goTo(Number(btn.getAttribute("data-back"))); });
    });

    Array.prototype.forEach.call(document.querySelectorAll('input[name="region"]'), function (radio) {
      radio.addEventListener("change", updatePayment);
    });

    // pre-select the likely region
    var guess = document.querySelector('input[name="region"][value="' + (inIndia ? "india" : "intl") + '"]');
    if (guess) guess.checked = true;
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();

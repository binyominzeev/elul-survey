(function () {
  const state = {
    answers: {}, // q1..q40 -> number 1-10 or "NA"
    relationship: null,
    relationshipOther: "",
    duration: null,
    frequency: null,
  };

  const questionsContainer = document.getElementById("questionsContainer");
  const openQuestionsContainer = document.getElementById("openQuestionsContainer");
  const relationshipGroup = document.getElementById("relationshipGroup");
  const durationGroup = document.getElementById("durationGroup");
  const frequencyGroup = document.getElementById("frequencyGroup");
  const relationshipOtherInput = document.getElementById("relationshipOtherInput");
  const progressFill = document.getElementById("progressFill");
  const statusMessage = document.getElementById("statusMessage");
  const submitBtn = document.getElementById("submitBtn");
  const form = document.getElementById("surveyForm");
  const formScreen = document.getElementById("formScreen");
  const doneScreen = document.getElementById("doneScreen");

  // --- Render 1-10 scale questions ---------------------------------------
  QUESTIONS.forEach((text, idx) => {
    const qNum = idx + 1;
    const qId = `q${qNum}`;

    const wrap = document.createElement("div");
    wrap.className = "question";

    const textEl = document.createElement("p");
    textEl.className = "question-text";
    textEl.innerHTML = `<span class="question-number">${qNum}.</span><span>${text}</span>`;

    const row = document.createElement("div");
    row.className = "scale-row";

    for (let v = 1; v <= 10; v++) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "scale-btn";
      btn.textContent = v;
      btn.setAttribute("aria-label", `${qNum}. állítás: ${v} pont`);
      btn.addEventListener("click", () => selectScale(qId, v, row));
      row.appendChild(btn);
    }

    const naBtn = document.createElement("button");
    naBtn.type = "button";
    naBtn.className = "scale-btn na";
    naBtn.textContent = "N/A";
    naBtn.setAttribute("aria-label", `${qNum}. állítás: nincs elegendő tapasztalatom`);
    naBtn.addEventListener("click", () => selectScale(qId, "NA", row));
    row.appendChild(naBtn);

    wrap.appendChild(textEl);
    wrap.appendChild(row);
    questionsContainer.appendChild(wrap);
  });

  function selectScale(qId, value, row) {
    state.answers[qId] = value;
    row.querySelectorAll(".scale-btn").forEach((b) => b.classList.remove("selected"));
    const targetText = String(value);
    row.querySelectorAll(".scale-btn").forEach((b) => {
      if (b.textContent === targetText) b.classList.add("selected");
    });
    updateProgress();
  }

  // --- Render pill choice groups ------------------------------------------
  function renderPills(container, options, onSelect) {
    options.forEach((opt) => {
      const pill = document.createElement("button");
      pill.type = "button";
      pill.className = "choice-pill";
      pill.textContent = opt;
      pill.addEventListener("click", () => {
        container.querySelectorAll(".choice-pill").forEach((p) => p.classList.remove("selected"));
        pill.classList.add("selected");
        onSelect(opt);
      });
      container.appendChild(pill);
    });
  }

  renderPills(relationshipGroup, RELATIONSHIP_OPTIONS, (val) => {
    state.relationship = val;
    relationshipOtherInput.classList.toggle("visible", val === "egyéb");
  });
  relationshipOtherInput.addEventListener("input", (e) => {
    state.relationshipOther = e.target.value;
  });

  renderPills(durationGroup, DURATION_OPTIONS, (val) => {
    state.duration = val;
  });

  renderPills(frequencyGroup, FREQUENCY_OPTIONS, (val) => {
    state.frequency = val;
  });

  // --- Render optional open questions -------------------------------------
  OPEN_QUESTIONS.forEach((q) => {
    const wrap = document.createElement("div");
    wrap.className = "open-question";
    wrap.style.marginBottom = "22px";

    const p = document.createElement("p");
    p.innerHTML = `${q.text} <span class="optional-tag">(opcionális)</span>`;

    const textarea = document.createElement("textarea");
    textarea.id = q.id;
    textarea.addEventListener("input", (e) => {
      state[q.id] = e.target.value;
    });

    wrap.appendChild(p);
    wrap.appendChild(textarea);
    openQuestionsContainer.appendChild(wrap);
  });

  // --- Progress -------------------------------------------------------------
  function updateProgress() {
    const answered = Object.keys(state.answers).length;
    const pct = Math.round((answered / QUESTIONS.length) * 100);
    progressFill.style.width = pct + "%";
  }

  // --- Submit -----------------------------------------------------------
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    statusMessage.textContent = "";
    statusMessage.className = "status";

    const missing = [];
    for (let i = 1; i <= QUESTIONS.length; i++) {
      if (state.answers[`q${i}`] === undefined) missing.push(i);
    }
    if (missing.length > 0) {
      statusMessage.textContent = `Még hiányzik ${missing.length} állítás értékelése (pl. ${missing[0]}.). Görgess vissza és jelöld be mindet.`;
      statusMessage.className = "status error";
      const firstMissing = questionsContainer.children[missing[0] - 1];
      firstMissing.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    const payload = {
      answers: state.answers,
      background: {
        relationship: state.relationship,
        relationshipOther: state.relationship === "egyéb" ? state.relationshipOther : null,
        duration: state.duration,
        frequency: state.frequency,
      },
      openAnswers: {
        q41: state.q41 || "",
        q42: state.q42 || "",
        q43: state.q43 || "",
      },
    };

    submitBtn.disabled = true;
    statusMessage.textContent = "Küldés folyamatban…";
    statusMessage.className = "status hint";

    try {
      const res = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody.error || "Ismeretlen hiba történt.");
      }
      formScreen.style.display = "none";
      doneScreen.style.display = "block";
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      statusMessage.textContent = "Nem sikerült elküldeni: " + err.message;
      statusMessage.className = "status error";
      submitBtn.disabled = false;
    }
  });
})();

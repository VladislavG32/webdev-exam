/* global bootstrap */

const ITEMS_PER_PAGE = 5;

const state = {
  courses: [],
  tutors: [],
  selectedCourseId: null,
  selectedTutorId: null,
  coursesPage: 1,
};

function courseMatchesFilters(c) {
  const q = qs('#courseSearchName').value.trim().toLowerCase();
  const level = qs('#courseSearchLevel').value;

  const okName = !q || (c.name || '').toLowerCase().includes(q);
  const okLevel = !level || c.level === level;
  return okName && okLevel;
}

function tutorMatchesFilters(t) {
  const lang = qs('#tutorFilterLanguage').value;
  const level = qs('#tutorFilterLevel').value;
  const minExp = Number(qs('#tutorFilterExp').value || 0);

  const okLang = !lang || (t.languages_offered || []).includes(lang);
  const okLevel = !level || t.language_level === level;
  const okExp = Number(t.work_experience || 0) >= minExp;
  return okLang && okLevel && okExp;
}

function getSelectedCourse() {
  return state.courses.find((c) => c.id === state.selectedCourseId) || null;
}

function getSelectedTutor() {
  return state.tutors.find((t) => t.id === state.selectedTutorId) || null;
}

function updateOrderButtonState() {
  const btn = qs('#btnOpenOrder');
  btn.disabled = !state.selectedCourseId && !state.selectedTutorId;
}

function renderCourses() {
  const tbody = qs('#coursesTbody');
  const filtered = state.courses.filter(courseMatchesFilters);

  const start = (state.coursesPage - 1) * ITEMS_PER_PAGE;
  const items = filtered.slice(start, start + ITEMS_PER_PAGE);

  tbody.innerHTML = '';
  items.forEach((c, idx) => {
    const tr = document.createElement('tr');
    if (c.id === state.selectedCourseId) tr.classList.add('is-selected');

    tr.innerHTML = `
      <td>${start + idx + 1}</td>
      <td>
        <div class="fw-semibold">${c.name}</div>
        <div class="text-secondary small text-truncate" style="max-width: 520px;" title="${(c.description || '').replaceAll('"', '&quot;')}">
          ${(c.description || '').slice(0, 90)}${(c.description || '').length > 90 ? '…' : ''}
        </div>
      </td>
      <td>${c.level || ''}</td>
      <td>${c.teacher || ''}</td>
      <td class="text-end">${c.course_fee_per_hour ?? ''}</td>
      <td class="text-end">
        <button class="btn btn-outline-primary btn-sm" data-action="select" data-id="${c.id}">Выбрать</button>
      </td>
    `;

    tbody.appendChild(tr);
  });

  const pag = qs('#coursesPagination');
  renderPagination(pag, filtered.length, ITEMS_PER_PAGE, state.coursesPage, (p) => {
    state.coursesPage = p;
    renderCourses();
  });

  qsa('button[data-action="select"]', tbody).forEach((btn) => {
    btn.addEventListener('click', () => {
      state.selectedCourseId = Number(btn.dataset.id);
      state.selectedTutorId = null;
      state.coursesPage = 1;
      renderCourses();
      renderTutors();
      updateOrderButtonState();
      showAlert('primary', 'Курс выбран. Можно оформить заявку.');
    });
  });
}

function fillTutorLanguageSelect() {
  const select = qs('#tutorFilterLanguage');
  const langs = new Set();
  state.tutors.forEach((t) => (t.languages_offered || []).forEach((l) => langs.add(l)));

  const cur = select.value;
  select.innerHTML = '<option value="">Любой</option>' + Array.from(langs).sort().map((l) => (
    `<option value="${l}">${l}</option>`
  )).join('');
  select.value = cur;
}

function renderTutors() {
  const tbody = qs('#tutorsTbody');
  const filtered = state.tutors.filter(tutorMatchesFilters);

  tbody.innerHTML = '';
  filtered.forEach((t, idx) => {
    const tr = document.createElement('tr');
    if (t.id === state.selectedTutorId) tr.classList.add('is-selected');

    tr.innerHTML = `
      <td>${idx + 1}</td>
      <td class="fw-semibold">${t.name}</td>
      <td>${t.language_level || ''}</td>
      <td class="small">${(t.languages_spoken || []).join(', ')}</td>
      <td class="small">${(t.languages_offered || []).join(', ')}</td>
      <td>${t.work_experience ?? ''}</td>
      <td class="text-end">${t.price_per_hour ?? ''}</td>
      <td class="text-end">
        <button class="btn btn-outline-primary btn-sm" data-action="selectTutor" data-id="${t.id}">Выбрать</button>
      </td>
    `;
    tbody.appendChild(tr);
  });

  qsa('button[data-action="selectTutor"]', tbody).forEach((btn) => {
    btn.addEventListener('click', () => {
      state.selectedTutorId = Number(btn.dataset.id);
      state.selectedCourseId = null;
      renderCourses();
      renderTutors();
      updateOrderButtonState();
      showAlert('primary', 'Репетитор выбран. Можно оформить заявку.');
    });
  });
}

function getCourseTotalHours(course) {
  const weeks = Number(course.total_length || 0);
  const hoursPerWeek = Number(course.week_length || 0);
  return weeks * hoursPerWeek;
}

function computeCourseEndDate(dateStart, totalWeeks) {
  const d = parseISODateOnly(dateStart);
  d.setDate(d.getDate() + Math.max(0, totalWeeks - 1) * 7);
  return toDateInputValue(d);
}

function isWeekend(dateStart) {
  const d = parseISODateOnly(dateStart);
  const day = d.getDay(); 
  return day === 0 || day === 6;
}

function calcCoursePrice(course, form) {
  const dateStart = form.dateStart;
  const timeStart = form.timeStart;
  const persons = Math.max(1, Math.min(20, Number(form.persons || 1)));

  const fee = Number(course.course_fee_per_hour || 0);
  const durationHours = getCourseTotalHours(course);

  const weekendMultiplier = isWeekend(dateStart) ? 1.5 : 1;

  const t = parseTimeHHMM(timeStart);
  const minutes = t.h * 60 + t.m;
  const morningSurcharge = (minutes >= 9 * 60 && minutes < 12 * 60) ? 400 : 0;
  const eveningSurcharge = (minutes >= 18 * 60 && minutes < 20 * 60) ? 1000 : 0;

  let total = ((fee * durationHours * weekendMultiplier) + morningSurcharge + eveningSurcharge) * persons;

  const now = new Date();
  const startD = parseISODateOnly(dateStart);
  const diffDays = Math.floor((startD - now) / (1000 * 60 * 60 * 24));

  const early = diffDays >= 30;
  const group = persons >= 5;
  const intensive = Number(course.week_length || 0) >= 5;

  if (intensive) total *= 1.2;
  if (form.excursions) total *= 1.25;
  if (form.interactive) total *= 1.5;

  if (form.supplementary) total += 2000 * persons;
  if (form.personalized) total += 1500 * Number(course.total_length || 0);
  if (form.assessment) total += 300;

  if (early) total *= 0.9;
  if (group) total *= 0.85;

  return {
    price: Math.round(total),
    flags: { early, group, intensive },
    durationHours,
  };
}

function calcTutorPrice(tutor, form) {
  const persons = Math.max(1, Math.min(20, Number(form.persons || 1)));
  const duration = Math.max(1, Math.min(40, Number(form.durationHours || 1)));
  const fee = Number(tutor.price_per_hour || 0);

  let total = fee * duration * persons;

  if (form.excursions) total *= 1.25;
  if (form.interactive) total *= 1.5;
  if (form.supplementary) total += 2000 * persons;
  if (form.assessment) total += 300;

  return { price: Math.round(total), flags: { early: false, group: persons >= 5, intensive: duration >= 5 }, durationHours: duration };
}

function openOrderModalCreate() {
  const course = getSelectedCourse();
  const tutor = getSelectedTutor();

  const modalEl = qs('#orderModal');
  const modal = bootstrap.Modal.getOrCreateInstance(modalEl);

  qs('#orderId').value = '';
  qs('#orderMode').value = 'create';
  qs('#orderModalTitle').textContent = 'Оформление заявки';

  qs('#orderCourseName').value = course ? course.name : '';
  qs('#orderTeacherName').value = course ? course.teacher : '';

  qs('#orderTutorName').value = tutor ? tutor.name : '';

  qs('#orderDurationHours').value = tutor ? 1 : '';
  qs('#orderDurationHours').disabled = !tutor;
  if (!tutor) qs('#orderDurationHours').value = '';

  qs('#orderEntityType').value = course ? 'course' : 'tutor';

  // чекбоксы
  qs('#optSupplementary').checked = false;
  qs('#optPersonalized').checked = false;
  qs('#optExcursions').checked = false;
  qs('#optAssessment').checked = false;
  qs('#optInteractive').checked = false;

  // опции авто
  qs('#optEarly').checked = false;
  qs('#optGroup').checked = false;
  qs('#optIntensive').checked = false;

  // заполнение дат/времени
  const dateSel = qs('#orderDateStart');
  const timeSel = qs('#orderTimeStart');
  dateSel.innerHTML = '';
  timeSel.innerHTML = '';
  timeSel.disabled = true;

  if (course) {
    const dates = new Set();
    (course.start_dates || []).forEach((iso) => dates.add(iso.slice(0, 10)));
    const list = Array.from(dates).sort();
    if (list.length === 0) {
      dateSel.innerHTML = `<option value="">Нет дат</option>`;
    } else {
      dateSel.innerHTML = list.map((d) => `<option value="${d}">${d}</option>`).join('');
    }

    const endDate = list.length ? computeCourseEndDate(list[0], Number(course.total_length || 0)) : '';
    qs('#orderDurationInfo').value = course.total_length ? `${course.total_length} недель, окончание: ${endDate}` : '';
  } else if (tutor) {
    const today = new Date();
    const todayStr = toDateInputValue(today);
    dateSel.innerHTML = `<option value="${todayStr}">${todayStr}</option>`;
    qs('#orderDurationInfo').value = 'Занятие с репетитором';
  }

  const updateTimeOptions = () => {
    timeSel.innerHTML = '';
    timeSel.disabled = false;

    if (course) {
      const d = dateSel.value;
      const times = (course.start_dates || [])
        .filter((iso) => iso.startsWith(d))
        .map((iso) => iso.slice(11, 16))
        .sort();

      if (times.length === 0) {
        timeSel.innerHTML = `<option value="">Нет времени</option>`;
        timeSel.disabled = true;
        return;
      }

      timeSel.innerHTML = times.map((t) => {
        const end = addHoursToTime(t, Number(course.week_length || 0));
        return `<option value="${t}">${t} — ${end}</option>`;
      }).join('');
    } else {
      timeSel.innerHTML = `<option value="12:00">12:00</option><option value="14:00">14:00</option><option value="18:00">18:00</option>`;
    }
  };

  dateSel.onchange = () => {
    updateTimeOptions();
    updatePrice();
  };

  updateTimeOptions();

  const updatePrice = () => {
    const entityType = qs('#orderEntityType').value;

    const form = {
      dateStart: qs('#orderDateStart').value,
      timeStart: qs('#orderTimeStart').value,
      persons: qs('#orderPersons').value,

      durationHours: qs('#orderDurationHours').value,

      supplementary: qs('#optSupplementary').checked,
      personalized: qs('#optPersonalized').checked,
      excursions: qs('#optExcursions').checked,
      assessment: qs('#optAssessment').checked,
      interactive: qs('#optInteractive').checked,
    };

    let result;
    if (entityType === 'course') {
      result = calcCoursePrice(course, form);
      qs('#optEarly').checked = result.flags.early;
      qs('#optGroup').checked = result.flags.group;
      qs('#optIntensive').checked = result.flags.intensive;
      qs('#orderDurationHours').value = result.durationHours;
    } else {
      result = calcTutorPrice(tutor, form);
      qs('#optEarly').checked = false;
      qs('#optGroup').checked = result.flags.group;
      qs('#optIntensive').checked = result.flags.intensive;
    }

    qs('#orderPrice').value = String(result.price);
  };

  const debouncedUpdate = debounce(updatePrice, 150);

  qs('#orderPersons').oninput = debouncedUpdate;
  qs('#orderTimeStart').onchange = updatePrice;
  qs('#orderDurationHours').oninput = debouncedUpdate;

  ['#optSupplementary', '#optPersonalized', '#optExcursions', '#optAssessment', '#optInteractive'].forEach((id) => {
    qs(id).onchange = updatePrice;
  });

  updatePrice();

  qs('#btnOrderSubmit').onclick = async () => {
    try {
      const entityType = qs('#orderEntityType').value;

      const dateStart = qs('#orderDateStart').value;
      const timeStart = qs('#orderTimeStart').value;
      const persons = Number(qs('#orderPersons').value || 1);
      const price = Number(qs('#orderPrice').value || 0);
      const durationHours = Number(qs('#orderDurationHours').value || 1);

      const payload = {
        tutor_id: entityType === 'tutor' ? tutor.id : 0,
        course_id: entityType === 'course' ? course.id : 0,
        date_start: dateStart,
        time_start: timeStart,
        duration: durationHours,
        persons: persons,
        price: price,

        // boolean опции (важно отправлять явно)
        early_registration: qs('#optEarly').checked,
        group_enrollment: qs('#optGroup').checked,
        intensive_course: qs('#optIntensive').checked,
        supplementary: qs('#optSupplementary').checked,
        personalized: qs('#optPersonalized').checked,
        excursions: qs('#optExcursions').checked,
        assessment: qs('#optAssessment').checked,
        interactive: qs('#optInteractive').checked,
      };

      await Api.createOrder(payload);
      showAlert('success', 'Заявка успешно отправлена.');
      modal.hide();
    } catch (e) {
      showAlert('danger', `Ошибка: ${e.message}`);
    }
  };

  modal.show();
}

async function init() {
  try {
    qs('#btnSetupApiKey').addEventListener('click', () => {
      const k = setApiKeyInteractive();
      if (k) showAlert('success', 'API Key сохранён.');
    });

    qs('#btnResetCourseFilters').addEventListener('click', () => {
      qs('#courseSearchName').value = '';
      qs('#courseSearchLevel').value = '';
      state.coursesPage = 1;
      renderCourses();
    });

    qs('#courseSearchName').addEventListener('input', debounce(() => {
      state.coursesPage = 1;
      renderCourses();
    }, 150));

    qs('#courseSearchLevel').addEventListener('change', () => {
      state.coursesPage = 1;
      renderCourses();
    });

    qs('#tutorFilterLanguage').addEventListener('change', renderTutors);
    qs('#tutorFilterLevel').addEventListener('change', renderTutors);
    qs('#tutorFilterExp').addEventListener('input', debounce(renderTutors, 150));

    qs('#btnOpenOrder').addEventListener('click', () => openOrderModalCreate());

    // Загрузка данных
    state.courses = await Api.getCourses();
    state.tutors = await Api.getTutors();

    fillTutorLanguageSelect();
    renderCourses();
    renderTutors();
    updateOrderButtonState();

    showAlert('success', 'Данные загружены.');
  } catch (e) {
    showAlert('danger', `Ошибка загрузки: ${e.message}`);
  }
}

init();

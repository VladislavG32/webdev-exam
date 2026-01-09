/* global bootstrap */

const ITEMS_PER_PAGE = 5;

const cabinetState = {
  coursesById: new Map(),
  tutorsById: new Map(),
  orders: [],
  page: 1,
  deleteId: null,
};

function fmtOrderTitle(order) {
  if (order.course_id && cabinetState.coursesById.has(order.course_id)) {
    const c = cabinetState.coursesById.get(order.course_id);
    return `Курс: ${c.name}`;
  }
  if (order.tutor_id && cabinetState.tutorsById.has(order.tutor_id)) {
    const t = cabinetState.tutorsById.get(order.tutor_id);
    return `Репетитор: ${t.name}`;
  }
  return '—';
}

function fmtDateTime(order) {
  return `${order.date_start || ''} ${order.time_start || ''}`.trim();
}

function renderOrders() {
  const tbody = qs('#ordersTbody');
  const start = (cabinetState.page - 1) * ITEMS_PER_PAGE;
  const items = cabinetState.orders.slice(start, start + ITEMS_PER_PAGE);

  tbody.innerHTML = '';
  items.forEach((o, idx) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${start + idx + 1}</td>
      <td>${fmtOrderTitle(o)}</td>
      <td>${fmtDateTime(o)}</td>
      <td class="text-end">${o.price ?? ''}</td>
      <td class="text-end">
        <button class="btn btn-outline-secondary btn-sm" data-act="details" data-id="${o.id}">Подробнее</button>
        <button class="btn btn-outline-primary btn-sm" data-act="edit" data-id="${o.id}">Изменить</button>
        <button class="btn btn-outline-danger btn-sm" data-act="delete" data-id="${o.id}">Удалить</button>
      </td>
    `;
    tbody.appendChild(tr);
  });

  renderPagination(qs('#ordersPagination'), cabinetState.orders.length, ITEMS_PER_PAGE, cabinetState.page, (p) => {
    cabinetState.page = p;
    renderOrders();
  });

  qsa('button[data-act="details"]', tbody).forEach((b) => b.addEventListener('click', () => openDetails(Number(b.dataset.id))));
  qsa('button[data-act="delete"]', tbody).forEach((b) => b.addEventListener('click', () => openDelete(Number(b.dataset.id))));
  qsa('button[data-act="edit"]', tbody).forEach((b) => b.addEventListener('click', () => openEdit(Number(b.dataset.id))));
}

function openDetails(id) {
  const order = cabinetState.orders.find((o) => o.id === id);
  if (!order) return;

  const lines = [];
  lines.push(`<div class="fw-semibold mb-2">Заявка #${order.id}</div>`);
  lines.push(`<div><span class="text-secondary">Тип:</span> ${order.course_id ? 'курс' : 'репетитор'}</div>`);
  lines.push(`<div><span class="text-secondary">Дата/время:</span> ${fmtDateTime(order)}</div>`);
  lines.push(`<div><span class="text-secondary">Студентов:</span> ${order.persons}</div>`);
  lines.push(`<div><span class="text-secondary">Стоимость:</span> ${order.price} ₽</div>`);

  if (order.course_id && cabinetState.coursesById.has(order.course_id)) {
    const c = cabinetState.coursesById.get(order.course_id);
    lines.push(`<hr class="my-2">`);
    lines.push(`<div class="fw-semibold">Курс</div>`);
    lines.push(`<div><span class="text-secondary">Название:</span> ${c.name}</div>`);
    lines.push(`<div><span class="text-secondary">Описание:</span> ${c.description}</div>`);
    lines.push(`<div><span class="text-secondary">Преподаватель:</span> ${c.teacher}</div>`);
    lines.push(`<div class="text-secondary small mt-2">Скидки/надбавки (по флагам заявки):</div>`);
  }

  const flags = {
    early_registration: order.early_registration,
    group_enrollment: order.group_enrollment,
    intensive_course: order.intensive_course,
    supplementary: order.supplementary,
    personalized: order.personalized,
    excursions: order.excursions,
    assessment: order.assessment,
    interactive: order.interactive,
  };

  lines.push(`<ul class="mb-0">` +
    Object.entries(flags).map(([k, v]) => `<li><code>${k}</code>: ${v ? 'да' : 'нет'}</li>`).join('') +
    `</ul>`);

  qs('#detailsBody').innerHTML = lines.join('');
  bootstrap.Modal.getOrCreateInstance(qs('#detailsModal')).show();
}

function openDelete(id) {
  cabinetState.deleteId = id;
  bootstrap.Modal.getOrCreateInstance(qs('#deleteModal')).show();
}

async function doDelete() {
  if (!cabinetState.deleteId) return;
  try {
    await Api.deleteOrder(cabinetState.deleteId);
    cabinetState.orders = cabinetState.orders.filter((o) => o.id !== cabinetState.deleteId);
    cabinetState.deleteId = null;
    showAlert('success', 'Заявка удалена.');
    bootstrap.Modal.getOrCreateInstance(qs('#deleteModal')).hide();
    renderOrders();
  } catch (e) {
    showAlert('danger', `Ошибка удаления: ${e.message}`);
  }
}

function fillOrderModalForEdit(order) {
  const isCourse = Boolean(order.course_id);
  const course = isCourse ? cabinetState.coursesById.get(order.course_id) : null;
  const tutor = !isCourse ? cabinetState.tutorsById.get(order.tutor_id) : null;

  qs('#orderId').value = String(order.id);
  qs('#orderMode').value = 'edit';
  qs('#orderEntityType').value = isCourse ? 'course' : 'tutor';
  qs('#orderModalTitle').textContent = 'Редактирование заявки';

  qs('#orderCourseName').value = course ? course.name : '';
  qs('#orderTeacherName').value = course ? course.teacher : '';
  qs('#orderTutorName').value = tutor ? tutor.name : '';

  qs('#orderPersons').value = order.persons ?? 1;
  qs('#orderPrice').value = order.price ?? 0;

  qs('#optEarly').checked = Boolean(order.early_registration);
  qs('#optGroup').checked = Boolean(order.group_enrollment);
  qs('#optIntensive').checked = Boolean(order.intensive_course);
  qs('#optSupplementary').checked = Boolean(order.supplementary);
  qs('#optPersonalized').checked = Boolean(order.personalized);
  qs('#optExcursions').checked = Boolean(order.excursions);
  qs('#optAssessment').checked = Boolean(order.assessment);
  qs('#optInteractive').checked = Boolean(order.interactive);

  const dateSel = qs('#orderDateStart');
  const timeSel = qs('#orderTimeStart');

  dateSel.innerHTML = '';
  timeSel.innerHTML = '';
  timeSel.disabled = false;

  if (isCourse && course) {
    const dates = new Set();
    (course.start_dates || []).forEach((iso) => dates.add(iso.slice(0, 10)));
    const list = Array.from(dates).sort();

    dateSel.innerHTML = list.map((d) => `<option value="${d}">${d}</option>`).join('');
    dateSel.value = order.date_start;

    const updateTimes = () => {
      const d = dateSel.value;
      const times = (course.start_dates || [])
        .filter((iso) => iso.startsWith(d))
        .map((iso) => iso.slice(11, 16))
        .sort();

      timeSel.innerHTML = times.map((t) => {
        const end = addHoursToTime(t, Number(course.week_length || 0));
        return `<option value="${t}">${t} — ${end}</option>`;
      }).join('');

      timeSel.value = order.time_start;
    };

    updateTimes();
    dateSel.onchange = updateTimes;

    const endDate = computeCourseEndDate(order.date_start, Number(course.total_length || 0));
    qs('#orderDurationInfo').value = `${course.total_length} недель, окончание: ${endDate}`;

    qs('#orderDurationHours').value = order.duration ?? (Number(course.total_length || 0) * Number(course.week_length || 0));
    qs('#orderDurationHours').disabled = true;
  } else {
    // Репетитор: даём больше вариантов времени (раньше было только одно).
    const today = order.date_start || toDateInputValue(new Date());
    dateSel.innerHTML = `<option value="${today}">${today}</option>`;
    dateSel.value = today;

    timeSel.innerHTML = `
      <option value="09:00">09:00</option>
      <option value="12:00">12:00</option>
      <option value="14:00">14:00</option>
      <option value="18:00">18:00</option>
      <option value="19:00">19:00</option>
    `;
    timeSel.value = order.time_start || '12:00';

    qs('#orderDurationInfo').value = 'Занятие с репетитором';
    qs('#orderDurationHours').disabled = false;
    qs('#orderDurationHours').value = order.duration ?? 1;
  }
}

function openEdit(id) {
  const order = cabinetState.orders.find((o) => o.id === id);
  if (!order) return;

  fillOrderModalForEdit(order);

  qs('#btnOrderSubmit').onclick = async () => {
    try {
      const orderId = Number(qs('#orderId').value);
      const entityType = qs('#orderEntityType').value;

      const payload = {
        date_start: qs('#orderDateStart').value,
        time_start: qs('#orderTimeStart').value,
        persons: Number(qs('#orderPersons').value || 1),
        duration: Number(qs('#orderDurationHours').value || 1),
        price: Number(qs('#orderPrice').value || 0),

        early_registration: qs('#optEarly').checked,
        group_enrollment: qs('#optGroup').checked,
        intensive_course: qs('#optIntensive').checked,
        supplementary: qs('#optSupplementary').checked,
        personalized: qs('#optPersonalized').checked,
        excursions: qs('#optExcursions').checked,
        assessment: qs('#optAssessment').checked,
        interactive: qs('#optInteractive').checked,
      };

      if (entityType === 'course') {
        payload.course_id = order.course_id;
        payload.tutor_id = 0;
      } else {
        payload.tutor_id = order.tutor_id;
        payload.course_id = 0;
      }

      const updated = await Api.updateOrder(orderId, payload);

      const idx = cabinetState.orders.findIndex((o) => o.id === orderId);
      if (idx !== -1) cabinetState.orders[idx] = updated;

      showAlert('success', 'Заявка обновлена.');
      bootstrap.Modal.getOrCreateInstance(qs('#orderModal')).hide();
      renderOrders();
    } catch (e) {
      showAlert('danger', `Ошибка обновления: ${e.message}`);
    }
  };

  bootstrap.Modal.getOrCreateInstance(qs('#orderModal')).show();
}

async function initCabinet() {
  try {
    qs('#btnSetupApiKeyCabinet').addEventListener('click', () => {
      const k = setApiKeyInteractive();
      if (k) showAlert('success', 'API Key сохранён.');
    });

    qs('#btnDeleteYes').addEventListener('click', doDelete);

    const [courses, tutors] = await Promise.all([Api.getCourses(), Api.getTutors()]);
    courses.forEach((c) => cabinetState.coursesById.set(c.id, c));
    tutors.forEach((t) => cabinetState.tutorsById.set(t.id, t));

    cabinetState.orders = await Api.getOrders();
    renderOrders();
    showAlert('success', 'Заявки загружены.');
  } catch (e) {
    showAlert('danger', `Ошибка: ${e.message}`);
  }
}

initCabinet();

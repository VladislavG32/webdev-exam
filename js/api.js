function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function readOrders() {
  const raw = localStorage.getItem('MOCK_ORDERS');
  try {
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

function writeOrders(orders) {
  localStorage.setItem('MOCK_ORDERS', JSON.stringify(orders));
}

function nextId() {
  const raw = localStorage.getItem('MOCK_ORDERS_ID');
  const n = raw ? Number(raw) : 1;
  localStorage.setItem('MOCK_ORDERS_ID', String(n + 1));
  return n;
}

function normalizeBooleans(payload) {
  const keys = [
    'early_registration', 'group_enrollment', 'intensive_course',
    'supplementary', 'personalized', 'excursions', 'assessment', 'interactive'
  ];
  const out = { ...payload };
  keys.forEach((k) => { out[k] = Boolean(out[k]); });
  return out;
}

const Api = {
  async getCourses() {
    await sleep(150);
    return (window.MockData && window.MockData.courses) ? window.MockData.courses : [];
  },

  async getTutors() {
    await sleep(150);
    return (window.MockData && window.MockData.tutors) ? window.MockData.tutors : [];
  },

  async getOrders() {
    await sleep(150);
    return readOrders();
  },

  async createOrder(payload) {
    await sleep(150);

    if (!payload) throw new Error('Пустой payload');
    if (!payload.date_start) throw new Error('Не указана date_start');
    if (!payload.time_start) throw new Error('Не указана time_start');
    if (!payload.persons || payload.persons < 1 || payload.persons > 20) throw new Error('persons: 1..20');
    if (payload.price == null || payload.price < 0) throw new Error('price некорректна');

    const courseId = Number(payload.course_id || 0);
    const tutorId = Number(payload.tutor_id || 0);
    if ((courseId && tutorId) || (!courseId && !tutorId)) {
      throw new Error('Нужно указать только одно: course_id или tutor_id');
    }

    const orders = readOrders();
    if (orders.length >= 10) throw new Error('Максимум 10 заявок');

    const item = normalizeBooleans({
      id: nextId(),
      tutor_id: tutorId,
      course_id: courseId,
      date_start: payload.date_start,
      time_start: payload.time_start,
      duration: Number(payload.duration || 1),
      persons: Number(payload.persons),
      price: Number(payload.price),

      early_registration: payload.early_registration,
      group_enrollment: payload.group_enrollment,
      intensive_course: payload.intensive_course,
      supplementary: payload.supplementary,
      personalized: payload.personalized,
      excursions: payload.excursions,
      assessment: payload.assessment,
      interactive: payload.interactive,

      student_id: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });

    orders.unshift(item);
    writeOrders(orders);
    return item;
  },

  async updateOrder(id, payload) {
    await sleep(150);

    const orderId = Number(id);
    const orders = readOrders();
    const idx = orders.findIndex((o) => o.id === orderId);
    if (idx === -1) throw new Error('Заявка не найдена');

    const current = orders[idx];
    const patch = normalizeBooleans({ ...payload });

    const updated = {
      ...current,
      ...patch,
      id: current.id,
      updated_at: new Date().toISOString()
    };

    const courseId = Number(updated.course_id || 0);
    const tutorId = Number(updated.tutor_id || 0);
    if ((courseId && tutorId) || (!courseId && !tutorId)) {
      throw new Error('Нужно указать только одно: course_id или tutor_id');
    }

    orders[idx] = updated;
    writeOrders(orders);
    return updated;
  },

  async deleteOrder(id) {
    await sleep(150);

    const orderId = Number(id);
    const orders = readOrders();
    const idx = orders.findIndex((o) => o.id === orderId);
    if (idx === -1) throw new Error('Заявка не найдена');

    orders.splice(idx, 1);
    writeOrders(orders);
    return { id: orderId };
  }
};

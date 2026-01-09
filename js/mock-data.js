window.MockData = {
  courses: [
    {
      id: 1,
      name: "English for Beginners",
      description: "Базовый курс английского: чтение, грамматика, диалоги.",
      teacher: "Anna Volkova",
      level: "Beginner",
      total_length: 8,
      week_length: 2,
      start_dates: [
        "2026-01-20T09:00:00",
        "2026-01-20T12:00:00",
        "2026-01-20T17:00:00",
        "2026-01-27T09:00:00",
        "2026-01-27T12:00:00",
        "2026-01-27T18:00:00",
        "2026-02-03T09:00:00",
        "2026-02-03T18:00:00"
      ],
      course_fee_per_hour: 450
    },
    {
      id: 2,
      name: "Spanish разговорный",
      description: "Фокус на разговорной практике и словаре для общения.",
      teacher: "Carlos Ruiz",
      level: "Intermediate",
      total_length: 6,
      week_length: 3,
      start_dates: [
        "2026-01-25T10:00:00",
        "2026-01-25T12:00:00",
        "2026-01-25T18:00:00",
        "2026-02-01T10:00:00",
        "2026-02-01T18:00:00",
        "2026-02-08T10:00:00",
        "2026-02-08T18:00:00"
      ],
      course_fee_per_hour: 600
    },
    {
      id: 3,
      name: "German интенсив",
      description: "Ускоренный курс немецкого с домашними заданиями и практикой.",
      teacher: "Irina Petrovna",
      level: "Beginner",
      total_length: 5,
      week_length: 5,
      start_dates: [
        "2026-01-18T09:00:00",
        "2026-01-18T12:00:00",
        "2026-01-18T18:00:00",
        "2026-01-19T09:00:00",
        "2026-01-19T18:00:00"
      ],
      course_fee_per_hour: 700
    }
  ],

  tutors: [
    {
      id: 1,
      name: "Irina Petrovna",
      work_experience: 5,
      languages_spoken: ["Russian", "English"],
      languages_offered: ["German", "English"],
      language_level: "Advanced",
      price_per_hour: 800
    },
    {
      id: 2,
      name: "Dmitry Sokolov",
      work_experience: 2,
      languages_spoken: ["Russian"],
      languages_offered: ["English"],
      language_level: "Intermediate",
      price_per_hour: 500
    },
    {
      id: 3,
      name: "Carlos Ruiz",
      work_experience: 7,
      languages_spoken: ["Spanish", "English"],
      languages_offered: ["Spanish"],
      language_level: "Advanced",
      price_per_hour: 900
    }
  ]
};

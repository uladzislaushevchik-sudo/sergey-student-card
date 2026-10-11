# Карточка ученика — Сергей Давидовский

## Для ChatGPT (Todoist → время занятий)

Редактируй **только** файл `schedule.json`:

```json
{
  "student": "Сергей Давидовский",
  "timezone": "Europe/Minsk",
  "lessons": [
    { "date": "2026-10-13", "time": "18:00", "note": "" },
    { "date": "2026-10-15", "time": "19:30", "note": "" }
  ],
  "updated": "2026-10-11"
}
```

- `date` — YYYY-MM-DD
- `time` — HH:MM (24ч)
- `note` — опционально

Карточка сама подтянет `schedule.json` и покажет дату + время в блоке «Следующие занятия».

Сайт: https://uladzislaushevchik-sudo.github.io/sergey-student-card/

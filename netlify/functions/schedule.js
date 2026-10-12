// Netlify Function: expose only lessons for Sergey Davidovsky.
// Set TODOIST_API_TOKEN in Netlify environment variables; never put the token in HTML.
const TIME_ZONE = "Europe/Minsk";
const TARGET_TASK = "Занятие с Сергеем Д";
const REQUIRED_LABEL = "Английский";

function localDateInZone(date, timeZone) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone, year: "numeric", month: "2-digit", day: "2-digit"
  }).formatToParts(date);
  const part = Object.fromEntries(parts.map(p => [p.type, p.value]));
  return `${part.year}-${part.month}-${part.day}`;
}

exports.handler = async function () {
  const token = process.env.TODOIST_API_TOKEN;
  if (!token) {
    return { statusCode: 503, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
      body: JSON.stringify({ error: "TODOIST_API_TOKEN is not configured" }) };
  }

  try {
    const tasks = [];
    let cursor = null;
    // Todoist API v1 paginates active tasks with next_cursor.
    for (let page = 0; page < 10; page++) {
      const url = new URL("https://api.todoist.com/api/v1/tasks");
      url.searchParams.set("limit", "200");
      if (cursor) url.searchParams.set("cursor", cursor);
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}`, Accept: "application/json" }
      });
      if (!response.ok) {
        return { statusCode: 502, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
          body: JSON.stringify({ error: "Todoist API request failed", upstreamStatus: response.status }) };
      }
      const data = await response.json();
      tasks.push(...(Array.isArray(data.results) ? data.results : []));
      cursor = data.next_cursor || null;
      if (!cursor) break;
    }

    const today = localDateInZone(new Date(), TIME_ZONE);
    const lessons = tasks
      .filter(task => task.content === TARGET_TASK &&
        Array.isArray(task.labels) && task.labels.includes(REQUIRED_LABEL) &&
        task.due && task.due.date)
      .map(task => {
        const due = task.due;
        let time = "";
        if (due.datetime) {
          // Preserve the task's scheduled wall-clock time, not the browser's timezone.
          const match = due.datetime.match(/T(\d{2}:\d{2})/);
          if (match) time = match[1];
        } else if (due.date && due.string) {
          const match = due.string.match(/\b([01]?\d|2[0-3]):[0-5]\d\b/);
          if (match) time = match[0].padStart(5, "0");
        }
        return { date: due.date.slice(0, 10), time, note: "" };
      })
      .filter(lesson => lesson.date >= today)
      .sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time));

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store, max-age=0",
        "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ student: "Сергей Давидовский", timezone: TIME_ZONE, lessons,
        updated: localDateInZone(new Date(), TIME_ZONE) })
    };
  } catch (error) {
    return { statusCode: 502, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
      body: JSON.stringify({ error: "Could not load lesson schedule" }) };
  }
};

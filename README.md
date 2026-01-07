# Leave Planner 2026

This is a **web-based leave planner system** for Epic Piping. Users can plan leaves, and department managers can review conflicts and availability.

## Features

* Hybrid Calendar: Month view + expandable Day view
* Add, edit, delete leave entries
* Gantt chart style leave bars
* Conflict detection per team/role
* Download employee leave data (future feature)
* Responsive layout using Tailwind CSS

## Folder Structure

```
leave-planner/
├─ index.html
├─ styles.css
├─ app.js
├─ employees.json
└─ README.md
```

## Hosting on GitHub Pages

1. Push this repo to GitHub.
2. Enable GitHub Pages in `Settings > Pages`.
3. Set source branch to `main` and folder `/`.
4. Open `https://<USERNAME>.github.io/leave-planner/` in browser.

## Notes

* Employee leave data is stored in `employees.json`.
* Custom CSS is in `styles.css`.
* Core logic and conflict engine is in `app.js`.
* Tailwind CDN can be added in `index.html` if desired.

## Future Improvements

* Manager login authentication
* CSV/Excel export
* Approval workflow for leave changes
* Dynamic staff count and availability percentages

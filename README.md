# Satheesh's portfolio

A static, responsive portfolio with light and dark red-and-blue themes, professional summary, recent-first experience, architecture case studies, selected projects, copyable engineering briefs, technical skills, and an embedded resume PDF.

Open `index.html` in a browser. Edit the `profile` object near the top of that file to update content. The active profile portrait is `assets/photo-tech-portrait-v2.png`. The original uploaded photo is retained at `assets/photo.jpg`. The contact form opens the visitor's email app with a prepared message.

Project screenshots live in `assets/work/`. Replace the base64 payload in `script#resume-pdf` to update the downloadable resume; editing profile text does not change that PDF.

The existing GitHub Actions workflow deploys this directory to GitHub Pages when changes are pushed to `main`.

Visual styles are in `assets/theme.css`; theme controls and the interactive delivery demo are in `assets/interactions.js`. Light mode is the default; visitors can save a dark-mode preference. Motion respects the system setting and can be paused.

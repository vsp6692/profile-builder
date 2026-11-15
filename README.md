# Satheesh's portfolio

A static, responsive portfolio with a walking theme, professional summary, recent-first experience, architecture case studies, selected projects, copyable engineering briefs, technical skills, and an embedded resume PDF.

Open `index.html` in a browser. Edit the `profile` object near the top of that file to update content. The profile portrait is stored at `assets/photo.jpg`; replace that file to update it. The contact form opens the visitor's email app with a prepared message.

Project screenshots live in `assets/work/`. Replace the base64 payload in `script#resume-pdf` to update the downloadable resume; editing profile text does not change that PDF.

The existing GitHub Actions workflow deploys this directory to GitHub Pages when changes are pushed to `main`.

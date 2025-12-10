# Chaos Meter 2.0 🌀

**Real-Time Global Cybersecurity Threat Monitor**

Live at: [chaosmeter.live](https://chaosmeter.live)

![Chaos Meter Screenshot](https://via.placeholder.com/800x400/0d1117/58a6ff?text=Chaos+Meter+2.0)

## Features

- 📊 **20 Chaos Factors** - Real-time threat indicators
- 🗺️ **Live Attack Map** - Animated country-to-country attacks
- 📰 **News Feed** - Live security headlines from RSS feeds
- 📜 **System Log** - Real-time threat detection logs
- 🎮 **Simulation Mode** - Manual factor adjustment with sliders
- 🌐 **Multi-Language** - Google Translate integration (30+ languages)
- 📱 **Responsive** - Works on desktop, tablet, mobile

## Data Sources (All Free)

| Data | Source | Update Interval |
|------|--------|----------------|
| Solar Activity | NOAA Space Weather | 5 min |
| Vulnerabilities | NVD (NIST) | 5 min |
| Malware | MalwareBazaar (abuse.ch) | 5 min |
| News Headlines | RSS Feeds (Hacker News, CISA) | 5 min |
| Attack Data | Generated + GeoIP | Real-time |

## Architecture

```
┌─────────────────────────────────────┐
│  GitHub Actions (Every 5 minutes)  │
│  └── api.py → data.json            │
└─────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────┐
│        GitHub Pages / CDN           │
│    a.html, script.js, data.json    │
└─────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────┐
│          Browser (Client)           │
│   Reads data.json + Animations     │
└─────────────────────────────────────┘
```

## Local Development

```bash
# Install dependencies
pip install -r requirements.txt

# Generate data
python api.py

# Start local server
python -m http.server 8000

# Open in browser
open http://localhost:8000/a.html
```

## Deployment to GitHub Pages

1. Create a new GitHub repository
2. Push all files to `main` branch
3. Go to Settings → Pages → Source: Deploy from branch (main)
4. GitHub Actions will auto-update data.json every 5 minutes

## File Structure

```
├── a.html              # Main dashboard
├── blog.html           # Blog listing
├── read_blog.html      # Blog post reader
├── admin.html          # Blog post generator
├── style.css           # Main styles
├── blog_styles.css     # Blog styles
├── script.js           # Main JavaScript (reads data.json)
├── blog_data.js        # Blog posts data
├── api.py              # Data fetcher (runs server-side)
├── data.json           # Generated data (auto-updated)
├── requirements.txt    # Python dependencies
├── README.md           # This file
└── .github/
    └── workflows/
        └── update-data.yml  # GitHub Actions workflow
```

## Customization

### Adding New Chaos Factors

1. Edit `api.py` → `generate_chaos_factors()`
2. Add to `factorMeta` in `script.js`

### Adding New Attack Sources

Edit `countryCoords` in `script.js`:
```javascript
countryCoords['XX'] = { x: 50, y: 50 };
```

### Changing Update Interval

Edit `.github/workflows/update-data.yml`:
```yaml
- cron: '*/10 * * * *'  # Every 10 minutes
```

## License

MIT License - Feel free to use and modify!

## Author

Built with 💀 for the cybersecurity community

---

**⚠️ DISCLAIMER:** This is a demonstration/visualization tool. Data is aggregated from public sources and may include simulated values for educational purposes.

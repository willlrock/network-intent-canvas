# Contributing to NetSim

Thanks for your interest in improving NetSim! Bug reports, feature ideas, new
protocol support, and lab templates are all welcome.

## Getting started

```bash
git clone https://github.com/joxorsayan/netsim.git
cd netsim
pip install -r requirements.txt
pip install pytest
python -m pytest          # all tests should pass
uvicorn app.main:app --reload
```

## Project layout

- `app/engine/` — the pure-Python simulation engine (no web dependencies). New
  protocol behaviour goes here, with unit tests in `tests/`.
- `app/main.py` — FastAPI REST API and static SPA host.
- `app/static/` — the vanilla-JS front-end (topology editor, CLI console, tabs).
- `app/tutor_ai/` + `ai/` — the AI tutor training-data generators and the
  dataset → train → export → deliver pipeline.

## Guidelines

1. **Add tests.** The engine is the source of truth; every new feature or fix
   should come with a unit test that demonstrates it.
2. **Keep the engine web-free.** Don't import FastAPI or web code inside
   `app/engine/` — it must remain importable and testable on its own.
3. **Match existing style.** Follow the conventions in the surrounding code;
   keep changes focused and minimal.
4. **Run the suite** (`python -m pytest`) before opening a PR.

## Pull requests

1. Fork the repo and create a feature branch.
2. Make your change with tests.
3. Ensure `python -m pytest` is green.
4. Open a PR with a clear description of what changed and why.

By contributing, you agree that your contributions are licensed under the
project's [MIT License](LICENSE).

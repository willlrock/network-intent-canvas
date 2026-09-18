.PHONY: bootstrap run test upstreams

bootstrap:
	git submodule update --init --recursive
	python3 -m venv .venv
	.venv/bin/python -m pip install --upgrade pip
	.venv/bin/pip install -r requirements-dev.txt

run:
	.venv/bin/uvicorn network_intent_canvas.main:app --reload --host 127.0.0.1 --port 8000

test:
	PYTHONPATH=vendor/netsim:. .venv/bin/pytest -q vendor/netsim/tests tests

upstreams:
	git submodule status

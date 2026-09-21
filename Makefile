.PHONY: bootstrap run test upstreams index-device-library

bootstrap:
	git submodule update --init --recursive
	python3 -m venv .venv
	.venv/bin/python -m pip install --upgrade pip
	.venv/bin/pip install -r requirements-dev.txt
	$(MAKE) index-device-library

index-device-library:
	.venv/bin/python -m network_intent_canvas.build_device_index

run:
	.venv/bin/uvicorn network_intent_canvas.main:app --reload --host 127.0.0.1 --port 8000

test:
	.venv/bin/python -m pytest -q tests

upstreams:
	git submodule status

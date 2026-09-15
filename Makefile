# Sentinel.
#
# `make ci` is the gate. Everything else is a shortcut into part of it. Every
# guard here has been broken on purpose at least once; a guard nobody has
# watched fail is a guard nobody knows works.

SHELL := /bin/bash
.DEFAULT_GOAL := help

BIN := node_modules/.bin

# The SDK is installed per-user rather than system-wide, so it is not on a
# default PATH. Overridable for CI, where it usually is.
DOTNET ?= $(HOME)/.dotnet/dotnet

## help: list targets
help:
	@grep -E '^## ' $(MAKEFILE_LIST) | sed 's/## /  /'

## setup: install everything
setup:
	pnpm install

## ci: the gate
ci: gates test app-test server-test

## gates: every blocking check, without the tests
gates: typecheck lint boundary doc-check copy-check design-check mark-check counts-check

## test: the domain tests, including the reach property tests
test:
	pnpm --filter @sentinel/domain test

## typecheck: tsc across the workspace, and the scripts that guard the gates
typecheck:
	pnpm typecheck
	$(BIN)/tsc -p scripts/tsconfig.json

## lint: eslint across the workspace
lint:
	$(BIN)/eslint .

## boundary: prove the domain purity rule still fires
boundary:
	./scripts/boundary-check.sh

## doc-check: the documentation gate
doc-check:
	./scripts/doc-check.sh

## copy-check: nothing the app says names a person, mobilises, or shouts
copy-check:
	@python3 scripts/copy-check.py

## design-check: DESIGN.md and tokens.ts agree; no colour outside the palette; no red
design-check:
	@python3 scripts/design-check.py

## mark: redraw the launcher icons and launch screens from the mark
mark:
	@python3 scripts/mark.py

## mark-check: the icons are what the script draws
mark-check:
	@python3 scripts/mark.py --check

## counts-check: README quotes the figures the repository has
counts-check:
	@python3 scripts/counts-check.py

## app-typecheck: tsc over the mobile app
app-typecheck:
	pnpm --filter @sentinel/mobile exec tsc --noEmit

## app-test: the mobile app's tests
app-test:
	pnpm --filter @sentinel/mobile test

## app-pods: CocoaPods, with the locale it needs
app-pods:
	cd apps/mobile/ios && LANG=en_US.UTF-8 pod install

## app-apk: the debug APK
app-apk:
	cd apps/mobile/android && ./gradlew :app:assembleDebug

## app-ios: run on a booted simulator
app-ios:
	pnpm --filter @sentinel/mobile exec react-native run-ios

## server-build: build the .NET solution
server-build:
	cd server && $(DOTNET) build --nologo

## server-test: the server's tests, no database needed
server-test:
	cd server && $(DOTNET) test --nologo

## server-run: the API in memory, on http://localhost:5000
server-run:
	cd server && $(DOTNET) run --project src/Sentinel.Api

## fixtures: regenerate the reach fixtures the server is held to
fixtures:
	node scripts/emit-fixtures.ts

.PHONY: help setup ci gates test typecheck lint boundary doc-check copy-check design-check mark mark-check counts-check app-typecheck app-test app-pods app-apk app-ios server-build server-test server-run fixtures

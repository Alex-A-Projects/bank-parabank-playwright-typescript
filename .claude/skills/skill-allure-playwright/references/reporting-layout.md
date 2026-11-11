# The reporting layout

## Where everything lands

| Artefact | Path | Written by |
|---|---|---|
| Allure results | `allure-results/ui`, `allure-results/api`, `allure-results/db` | `allure-playwright`, one directory per suite |
| Playwright HTML report | `playwright-report/ui`, `playwright-report/api`, `playwright-report/db` | the built-in `html` reporter |
| Traces | `test-results/<test>/trace.zip` | Playwright, `on-first-retry` |
| Video | `test-results/<test>/video.webm` | Playwright, `retain-on-failure` |
| Screenshots | `test-results/<test>/test-failed-*.png` | Playwright, `only-on-failure` |

The three suites write to **separate** directories, so a UI run never
overwrites an API run's results. The directories are created on demand
and are git-ignored.

## Reading the report locally

```bash
npm run allure:serve      # serves the whole allure-results/ tree
npm run allure:generate    # builds a static report into allure-report/
npm run test:report        # opens the Playwright HTML report
```

`allure:serve` reads the whole tree, so after running all three suites
you get one report with the three areas side by side. Run the suites
before you serve — an empty tree produces an empty report.

## What every test already carries

Without touching a spec, every test reaches Allure with:

- **the title**, which is `ticketTitle(Tickets.x, '…')` — so `PB-1011 | …`,
- **the tags**, which Playwright records as labels and which are therefore
  filterable in the report (`@smoke`, `@feature:ui-transfer-funds`,
  `@mutating`),
- **the status**, the duration, the attachments, and the error message
  with its stack.

That is the baseline. Steps and extra labels are additions on top of it,
not a requirement.

## In CI

`.github/workflows/ci.yml` has one job per suite area:

1. the suite runs and writes its `allure-results/<suite>` directory,
2. `allure generate allure-results --clean --output allure-report` builds
   the HTML report,
3. the results, the report, the Playwright report and `test-results/` are
   uploaded as artifacts.

The generate step is `continue-on-error`: a missing or partial results
directory must not turn a passing test job into a failing one. The test
result itself is what gates the merge.

The API job runs the matrix over the three transports (`soap`,
`rest-json`, `rest-xml`) and uploads each transport's results under its
own name, so a transport-specific failure is visible in the artifact list
rather than hidden inside one combined run.

## Local generation needs the Allure CLI

`allure serve` and `allure generate` are the Allure **command line
tool** — a separate install from the `allure-playwright` npm package that
writes the results. The npm package is the writer; the CLI is the
reader. If the command is not found, install the CLI and make sure it is
on `PATH`; the Playwright HTML report needs nothing extra.

## What never goes into a report

- Credentials, tokens or connection strings. The demo credentials live in
  `process.env` and are never interpolated into a title, a step name or a
  label.
- A raw stack dump of an internal helper. The report shows the failure the
  test actually made.

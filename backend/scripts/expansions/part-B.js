/* Extra sections for seeded blog posts, part B. See part-A.js. */
module.exports = {
  'database-indexing-what-actually-helps': [
    [
      'Read the plan before adding',
      'Run `EXPLAIN ANALYZE` on the slow query and look for a sequential scan over a large table. If the planner already uses an index, adding another will not help. Compare estimated rows with actual rows: a large gap means stale statistics, so run `ANALYZE` before you change any schema.',
    ],
    [
      'Composite column order matters',
      'An index on `(tenant_id, created_at)` serves queries filtering by tenant and sorting by date. An index on `(created_at, tenant_id)` does not, because the leading column is the one being sorted. Put equality filters first and range or sort columns last, and check that the query uses the exact leading prefix.',
    ],
    [
      'The cost you are paying',
      'Every index slows inserts and updates and consumes disk. A table with eight indexes writes eight structures per row. Audit indexes that no query uses with `pg_stat_user_indexes` and drop them. Indexes also bloat under heavy updates, so rebuild or reindex during low traffic rather than adding more of them.',
    ],
  ],
  'fixing-the-n-1-query-problem': [
    [
      'Spot it in the logs',
      'Enable query logging in development and count statements per request. One page issuing 40 selects that differ only by id is an N+1. In Prisma, turn on `log: ["query"]`; in SQLAlchemy, echo the engine. The pattern is obvious once you see the same shape repeated with incrementing parameters.',
    ],
    [
      'Join or batch, do not loop',
      'The fix is either a join that returns parents and children together, or a second query that fetches all children with `WHERE parent_id IN (...)`. A data loader batches ids requested in the same tick and returns a map. Never await inside a `.map()` over forty records: that is the slow version written in one line.',
    ],
    [
      'Verify the count afterwards',
      'A page that previously ran 41 queries should now run two or three, regardless of how many rows it shows. Assert that in a test by counting queries, not by timing. Latency on a warm local database hides N+1 because each query takes a fraction of a millisecond; over a network it is the difference between 80 ms and two seconds.',
    ],
  ],
  'api-versioning-strategies-that-age-well': [
    [
      'Version the contract, not the code',
      'A version identifies a promise about request and response shape. Internal refactors should never need a new version. Publish the promise in documentation with examples, and treat removing a field, changing a type or tightening validation as breaking. Renaming an endpoint without changing behaviour is not a version bump.',
    ],
    [
      'Run versions in parallel',
      'Keep the old route alive while clients migrate, mapping it onto the same service layer with an adapter. Set a deprecation date, return a `Deprecation` header, and email the owners of keys still calling it. Deleting a version the day after the new one ships breaks integrations you cannot see.',
    ],
    [
      'Avoid versioning per endpoint',
      'Mixing `/v1/users` and `/v3/orders` in one product forces clients to track a matrix of versions. Version the whole API surface, or better, avoid breaking changes by adding fields and using tolerant readers. Most version numbers exist because a field was removed for tidiness, which is never worth a migration.',
    ],
  ],
  'background-jobs-for-reliable-apis': [
    [
      'Return an id, not a result',
      'An endpoint that sends email inside the request holds the connection for as long as the provider takes and fails the whole request when the provider times out. Enqueue a job with its own id and return 202 immediately. Give the client a status endpoint so it can poll, and keep the job payload small, referencing rows by id.',
    ],
    [
      'Design for duplicate delivery',
      'Most queues guarantee at-least-once delivery, so a worker can run the same job twice after a crash. Make handlers idempotent: check whether the effect already exists before applying it, or use a unique constraint on the job id. Sending a welcome email twice is embarrassing; charging a card twice is a refund and a support ticket.',
    ],
    [
      'Dead letters and retries',
      'Retry transient failures with exponential backoff and jitter, cap the attempts, then move the job to a dead-letter queue. Alert when that queue grows. A job that fails silently forever looks exactly like a job that succeeded, until a customer asks why their export never arrived. Log the final failure with enough context to replay it.',
    ],
  ],
  'pandas-groupby-from-confusing-to-clear': [
    [
      'Aggregate then reset',
      '`df.groupby("team")["score"].mean()` returns a Series indexed by team, which is why the column disappears. Chain `.reset_index(name="avg_score")` to get a flat frame you can merge or export. For several metrics at once, pass a dictionary to `.agg()` and name the outputs explicitly so downstream code is not guessing.',
    ],
    [
      'Watch the index dtype',
      'Grouping on a column with mixed types silently drops nulls and can turn numbers into strings. Check `df.dtypes` first, and pass `dropna=False` when missing values are a real category you need to count. A missing group is the most common reason a total does not match the source data.',
    ],
    [
      'Performance on large frames',
      'Groupby on a few million rows is fine; on hundreds of millions it is not. Select only the columns you need before grouping, use categorical dtypes for low-cardinality keys, and prefer built-in aggregations over `apply` with a Python function. If it still crawls, aggregate in the warehouse and load the summary instead.',
    ],
  ],
  'sql-window-functions-explained': [
    [
      'The frame clause is the tricky part',
      '`ROWS BETWEEN 6 PRECEDING AND CURRENT ROW` gives a seven-row moving window; the default with `ORDER BY` is `RANGE UNBOUNDED PRECEDING`, which accumulates from the start. A running total and a moving average use the same function with different frames. Always state the frame explicitly when the result is not a running total.',
    ],
    [
      'Ranking functions compared',
      '`ROW_NUMBER` gives 1, 2, 3 even for ties; `RANK` gives 1, 2, 2, 4; `DENSE_RANK` gives 1, 2, 2, 3. Picking the wrong one produces duplicate or missing positions in pagination. For "latest row per group", `ROW_NUMBER() OVER (PARTITION BY id ORDER BY created_at DESC)` filtered to 1 is the standard pattern.',
    ],
    [
      'Windows do not replace GROUP BY',
      'A window function keeps every row, which is why it cannot collapse a table to one row per group. If you need both a per-row value and a group total, compute the group total in a window and filter afterwards, or join a grouped subquery. Mixing the two without aliasing produces confusing duplicate columns.',
    ],
  ],
  'a-practical-data-cleaning-checklist': [
    [
      'Record every transformation',
      'Cleaning that only exists in a notebook cell cannot be reviewed or re-run. Write each step as a function, keep the raw file untouched, and save the cleaned output to a new path. When a number looks wrong three weeks later, you need to know whether it came from the source or from a deduplication rule you have forgotten.',
    ],
    [
      'Dates and timezones first',
      'Parse dates into a single timezone before anything else. Mixed local timestamps create duplicate rows that look distinct and misaligned daily totals. Store UTC, convert for display, and assert that no timestamp is in the future. A surprising number of dashboards are wrong because two systems disagreed about midnight.',
    ],
    [
      'Quantify what you dropped',
      'Count rows before and after each filter and log the numbers. Dropping 12 percent of records for missing email might be reasonable; dropping 40 percent silently invalidates the analysis. Report exclusions next to results so a reader can judge whether the conclusion survives them.',
    ],
  ],
  'data-visualisation-that-communicates': [
    [
      'Choose the chart from the question',
      'Comparison across categories wants bars, change over time wants a line, distribution wants a histogram and relationship wants a scatter. Pie charts answer almost nothing beyond two slices. If you cannot state the question in one sentence, the chart will not communicate it either.',
    ],
    [
      'Label directly, cut the chrome',
      'Put series names next to the lines instead of in a legend the eye must travel to. Drop gridlines that do not help read a value, round axis labels, and start bar axes at zero. Truncating a bar axis exaggerates differences and is the fastest way to lose a reader trust you will not get back.',
    ],
    [
      'One message per view',
      'Highlight the series the sentence is about and mute the rest. If a chart needs three paragraphs to explain, split it. Add a plain-language subtitle stating the finding, for example "checkout failures doubled after the March release", so the chart works even when read for five seconds.',
    ],
  ],
  'machine-learning-basics-without-the-hype': [
    [
      'Start with a baseline',
      'Before any model, compute the simplest rule: predict the majority class, or last month value. A model that beats a coin flip but loses to "always predict no" has learned nothing useful. Report the baseline next to the model score in every experiment, and keep it in the dashboard after launch.',
    ],
    [
      'Split before you tune',
      'Hold out a test set and do not look at it until the end. Tuning on the same rows you evaluate on produces a number that describes your laptop, not the world. For time-series data, split by date rather than randomly, otherwise the model sees the future during training and scores beautifully in testing.',
    ],
    [
      'Define the cost of mistakes',
      'A false negative in a fraud check and a false positive cost different amounts. Choose the threshold from that trade-off rather than leaving the default 0.5. Write down which error is worse and by how much; it turns an abstract accuracy discussion into a decision a product owner can actually make.',
    ],
  ],
  'feature-engineering-for-better-models': [
    [
      'Encode categories deliberately',
      'One-hot encoding is fine for a dozen levels. For a column with thousands, use target or frequency encoding, and compute it inside cross-validation folds so the encoding does not leak the target. High-cardinality ids are usually better dropped than encoded: they let the model memorise rows.',
    ],
    [
      'Scale only where it matters',
      'Distance-based models and regularised linear models need comparable scales; tree ensembles mostly do not. Fit the scaler on the training fold only, then apply it to validation and test data. Fitting on the whole dataset leaks distribution information and inflates your reported score.',
    ],
    [
      'Features that leak',
      'Any column populated after the outcome is known will produce a perfect offline score and a useless model. Cancellation reason, refund date and support notes are typical offenders. For each feature, ask whether it would exist at the moment a prediction is needed; if not, remove it.',
    ],
  ],
  'multi-stage-docker-builds-that-stay-small': [
    [
      'Copy manifests before source',
      'Copy `package.json` and the lockfile first, run the install, then copy the source. Docker caches each layer, so editing a component no longer reinstalls dependencies. Add a `.dockerignore` for node_modules, build output and tests, otherwise the build context carries megabytes the image never needs.',
    ],
    [
      'Run as a non-root user',
      'The final stage should create an unprivileged user and switch to it before the entrypoint. A container running as root that is compromised gives an attacker root inside the container and a much easier path to the host. Set `NODE_ENV=production` and install only production dependencies in the runtime stage.',
    ],
    [
      'Check the size honestly',
      'Compare `docker images` before and after the change. A Node image should land between 120 MB and 250 MB with an Alpine or slim base. If it is over 700 MB, a build stage leaked into the final layer or node_modules was copied a second time. `docker history` shows which layer is responsible.',
    ],
  ],
};

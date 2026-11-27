/**
 * System Design Interview Prep
 *
 * Teaches the interview as a structured conversation: scope, estimate, design,
 * then defend the trade-offs. Every lesson ends with what the interviewer is
 * actually scoring.
 */

const q = (prompt, correct, wrong, explanation) => ({ prompt, correct, wrong, explanation });

const t = (lead, objectives, sections, example, mistakes, practice, summary, questions) => ({
  lead,
  objectives,
  sections,
  example,
  mistakes,
  practice,
  summary,
  questions,
});

const topics = {
  'what-is-tested': t(
    'A system design interview is not a trivia quiz. It is a structured conversation that reveals whether you can turn an ambiguous problem into a defensible design.',
    ['describe the four things interviewers score', 'structure a 45-minute answer', 'avoid the two most common failure modes'],
    [
      ['What is scored', 'Interviewers look for requirement gathering, a coherent high-level design, depth in one or two components, and awareness of trade-offs. Nobody expects a production-ready architecture in 45 minutes; they expect to see how you think when information is incomplete.'],
      ['Structure beats brilliance', 'Spend five minutes on scope, five on estimates, fifteen on the high-level design, fifteen on deep dives and five on bottlenecks. Announcing the plan at the start lets the interviewer steer you, which is the point of the exercise: it is a collaboration, not a monologue.'],
    ],
    {
      lang: 'text',
      code: `0-5    Clarify: users, core actions, scale, constraints
5-10   Estimate: QPS, storage, bandwidth
10-25  High-level design: clients, API, services, data stores
25-40  Deep dive: the component the interviewer picks
40-45  Bottlenecks, failure modes, trade-offs, wrap-up`,
      output: 'A design the interviewer helped shape, not a surprise at minute 44',
      explain: 'A visible plan invites correction early, when changing direction is cheap.',
    },
    [
      'Starting to draw boxes before asking who the users are and what they do.',
      'Spending forty minutes on the happy path and never mentioning failure or scale.',
    ],
    {
      prompt: 'Take an unfamiliar product and write the five questions you would ask before designing it.',
      steps: ['Identify the core action.', 'Ask about scale and read/write ratio.', 'Ask what can be eventually consistent.'],
    },
    [
      'The interview scores structured thinking, not memorised diagrams.',
      'Announce a time-boxed plan and invite steering.',
      'Trade-offs and failure modes are part of the answer, not an appendix.',
    ],
    [
      q('What is the primary thing a system design interview evaluates?',
        'How you structure an ambiguous problem and justify trade-offs',
        ['Whether you memorised a reference architecture', 'Your knowledge of one database', 'Typing speed'],
        'The conversation reveals reasoning, not recall.'),
      q('Why announce a plan at the start?',
        'It lets the interviewer correct your direction while changes are cheap',
        ['It fills silence', 'It proves you memorised a template', 'It shortens the interview'],
        'The exercise is collaborative by design.'),
    ],
  ),

  requirements: t(
    'Requirements turn an ambiguous prompt into a bounded problem. Functional requirements define what the system does; non-functional requirements define how well it must do it.',
    ['separate functional from non-functional requirements', 'identify the core user actions', 'state explicit assumptions and constraints'],
    [
      ['Find the core action', 'For a ride-sharing app the core actions are request a ride and match a driver. Chat, ratings and payments are important but secondary. Designing the matching path first gives the interview a spine; adding features afterwards is easy, retrofitting a spine is not.'],
      ['Non-functional requirements decide architecture', 'Read/write ratio, latency target, consistency requirement, availability target and data retention drive every later choice. A timeline that can be five seconds stale is a different system from one that must show a balance exactly. Write these down and refer back to them.'],
    ],
    {
      lang: 'text',
      code: `Functional
- Riders request a trip with pickup and destination
- Drivers accept or decline
- Both see live location during the trip

Non-functional
- 10M daily active riders, peak 50k trip requests/min
- Matching p95 under 10s
- Location updates may be 5s stale
- Payment ledger must be strongly consistent
- 99.95% availability for the request path`,
      output: 'A scoped problem with measurable targets',
      explain: 'Each non-functional line later justifies a specific component choice.',
    },
    [
      'Listing ten features and designing none of them in depth.',
      'Leaving scale unstated, then choosing a database with no basis.',
    ],
    {
      prompt: 'For a URL shortener, write functional and non-functional requirements with numbers.',
      steps: ['List the two core actions.', 'Estimate reads versus writes.', 'Set a latency and availability target.'],
    },
    [
      'Functional requirements define behaviour; non-functional define constraints.',
      'Design the core action first.',
      'Write assumptions down so you can defend them later.',
    ],
    [
      q('Which requirement most directly drives the choice of data store?',
        'The read/write ratio and consistency requirement',
        ['The programming language', 'The team size', 'The logo'],
        'Access pattern and consistency determine the storage model.'),
      q('Why state assumptions explicitly?',
        'They become the basis for later trade-offs the interviewer can challenge',
        ['They make the design longer', 'They hide uncertainty', 'They are required by the template'],
        'Explicit assumptions are easier to correct than implicit ones.'),
    ],
  ),

  estimation: t(
    'Back-of-envelope estimates turn vague scale into numbers you can design against. The arithmetic is simple; the skill is choosing the right quantities.',
    ['estimate QPS from daily active users', 'estimate storage growth per year', 'use powers of ten instead of precise arithmetic'],
    [
      ['Start from users and actions', 'Ten million daily users each making twenty requests is 200 million requests per day, about 2,300 per second average, and a peak three to five times that. Average QPS sizes the steady state; peak QPS sizes the capacity plan.'],
      ['Storage follows the record size', 'One hundred million short links at 500 bytes each is 50 GB, which fits on one machine. A billion location pings per day at 100 bytes is 100 GB per day, 36 TB per year, which does not. The estimate tells you whether sharding is a real concern or a distraction.'],
    ],
    {
      lang: 'text',
      code: `Users        10M DAU
Actions      20 requests/user/day
Requests     200M/day = 2.3k/s average
Peak         x4 = ~9k/s

Storage      100M links x 500B = 50 GB total
             1B pings/day x 100B = 100 GB/day
             = ~36 TB/year

Bandwidth    9k/s x 2KB response = ~18 MB/s`,
      output: 'One number that changes the design: 36 TB/year of location data',
      explain: 'The link table fits on one machine; the ping stream needs partitioning and retention.',
    },
    [
      'Computing precise numbers to three decimal places instead of rounding to a power of ten.',
      'Forgetting peak traffic and sizing capacity for the average.',
    ],
    {
      prompt: 'Estimate the QPS, storage per year and peak bandwidth for a chat app with 5M daily users.',
      steps: ['Assume messages per user per day.', 'Convert to per second.', 'Multiply by record size.'],
    },
    [
      'Estimate from users and actions, then convert to per second.',
      'Peak traffic, not average, sizes capacity.',
      'Storage estimates decide whether sharding matters.',
    ],
    [
      q('Why size capacity for peak rather than average QPS?',
        'Traffic spikes cause outages that averages hide',
        ['Peak is easier to compute', 'Averages are always wrong', 'Peak reduces cost'],
        'Provisioning for the average guarantees failure at the busiest moment.'),
      q('What does 100 GB per day of events imply?',
        'About 36 TB per year, so retention and partitioning matter',
        ['It fits in memory', 'It needs no storage planning', 'It is too small to measure'],
        'Daily volume compounds into an operational constraint.'),
    ],
  ),

  'api-design': t(
    'The API is the contract the rest of the design hangs from. Getting resources, verbs and pagination right early prevents awkward patches later.',
    ['model resources and endpoints', 'choose between REST, RPC and GraphQL', 'design pagination and idempotent writes'],
    [
      ['Resources and verbs', 'Model nouns as resources: /trips, /trips/{id}, /trips/{id}/location. Use HTTP verbs for intent and status codes for outcome. A POST that creates a trip should return 201 with a Location header; a retried POST should not create a second trip.'],
      ['Pagination and idempotency', 'Offset pagination breaks when items are inserted mid-scroll, so cursors are the default for feeds. For writes, an idempotency key lets a client retry safely after a timeout, which is essential when the network, not the server, failed.'],
    ],
    {
      lang: 'http',
      code: `POST /v1/trips
Idempotency-Key: 7f3c-...
{ "pickup": [..], "destination": [..] }
-> 201 Created
   Location: /v1/trips/abc123

GET /v1/trips?cursor=eyJpZCI6...&limit=20
-> 200 OK
   { "items": [...], "nextCursor": "eyJpZCI6..." }

POST /v1/trips/abc123/cancel
-> 409 Conflict if already completed`,
      output: 'A contract that survives retries and large result sets',
      explain: 'The idempotency key and the cursor solve the two failures clients hit most.',
    },
    [
      'Using GET for an operation that changes state, so a retry or a prefetch mutates data.',
      'Returning every row of a large collection with no pagination plan.',
    ],
    {
      prompt: 'Design the endpoints for a course platform: browse, enrol, and fetch progress.',
      steps: ['Name the resources.', 'Choose verbs and status codes.', 'Add pagination and an idempotency key for enrolment.'],
    },
    [
      'Resources are nouns; verbs carry intent.',
      'Idempotency keys make retries safe.',
      'Cursors beat offsets for changing collections.',
    ],
    [
      q('Why is an idempotency key needed for a create request?',
        'A client that times out cannot know whether the write succeeded, so it retries',
        ['It encrypts the payload', 'It speeds up the database', 'It replaces authentication'],
        'The server recognises the retry and returns the original result.'),
      q('What is the main weakness of offset pagination?',
        'Insertions shift the offsets, so items are skipped or duplicated',
        ['It is slower to type', 'It cannot sort', 'It requires POST'],
        'Cursor pagination anchors to the last item instead.'),
    ],
  ),

  'sql-vs-nosql': t(
    'The database choice follows the access pattern and the consistency requirement, not a preference for a vendor. This lesson gives a decision procedure you can defend.',
    ['match a data store to an access pattern', 'explain when relational constraints are an advantage', 'describe the cost of denormalisation'],
    [
      ['Relational by default', 'A relational database gives transactions, joins and constraints, which prevent whole classes of corruption. If the data has relationships and the scale fits one primary with replicas, PostgreSQL is usually the right answer and the interviewer will accept it.'],
      ['Denormalise for a known query', 'A key-value or document store wins when the access pattern is fixed and the data is naturally one document, such as a session or a product catalogue read by id. The cost is that every new query shape needs a new index or a copy of the data, and consistency across copies becomes your problem.'],
    ],
    {
      lang: 'text',
      code: `Choose relational when:
- multiple entities are joined
- transactions span rows
- constraints prevent invalid states
- scale fits one primary + read replicas

Choose a document/key-value store when:
- the unit of access is one document by key
- the schema varies per record
- the write volume exceeds a single primary
- cross-record transactions are not required`,
      output: 'A decision with stated conditions, not a brand name',
      explain: 'Naming the conditions lets the interviewer challenge one assumption instead of the whole choice.',
    },
    [
      'Choosing NoSQL "for scale" without estimating whether a single primary would cope.',
      'Denormalising before the query patterns are known, then maintaining five copies.',
    ],
    {
      prompt: 'For a payments ledger and a product catalogue, choose a store for each and justify it in two sentences.',
      steps: ['Identify the transaction boundary.', 'Identify the access pattern.', 'State the consistency requirement.'],
    },
    [
      'Start relational unless the access pattern clearly says otherwise.',
      'Document stores optimise one access pattern and tax the rest.',
      'Denormalisation trades write complexity for read speed.',
    ],
    [
      q('What is the main advantage of a relational store for a ledger?',
        'Transactions and constraints prevent inconsistent balances',
        ['It is always faster', 'It has no schema', 'It scales horizontally by default'],
        'Correctness at the record level is the priority.'),
      q('What is the hidden cost of denormalisation?',
        'Every copy must be kept consistent, and new queries may need new copies',
        ['It uses less storage', 'It removes the need for indexes', 'It prevents joins'],
        'The consistency work moves into your application.'),
    ],
  ),

  replication: t(
    'Replication copies data to more machines for availability and read throughput. It introduces lag, failover and the possibility of reading stale data.',
    ['explain leader-follower replication', 'describe replication lag and read-your-writes', 'outline a failover procedure'],
    [
      ['One writer, many readers', 'The leader accepts writes and streams a log to followers, which replay it. Reads can be served by followers, which scales read traffic but means a read may miss a write that happened milliseconds ago. That is acceptable for a product listing and not for a balance after a transfer.'],
      ['Failover is the hard part', 'When the leader dies, a follower is promoted. The system must detect the failure, choose the most up-to-date follower, redirect clients and prevent the old leader from accepting writes when it returns, which is the split-brain problem.'],
    ],
    {
      lang: 'text',
      code: `Client -> Leader (writes)
             |  log stream
             +-> Follower A (reads)
             +-> Follower B (reads)

After a write, read from the leader (read-your-writes)
or wait until the follower's log position >= the write position.

Failover: detect -> promote -> redirect -> fence the old leader`,
      output: 'Reads scale; the consistency window is explicit',
      explain: 'Routing a just-written record to the leader removes the most visible staleness bug.',
    },
    [
      'Sending every read to a follower and then showing a user their own write as missing.',
      'Promoting a follower without fencing the old leader, which produces two writers.',
    ],
    {
      prompt: 'Design read routing for a profile page that the user can edit.',
      steps: ['Route the owner\'s read to the leader.', 'Route other readers to followers.', 'Explain what staleness they can tolerate.'],
    },
    [
      'Replication scales reads and improves availability.',
      'Lag makes stale reads possible; route critical reads to the leader.',
      'Failover must prevent split-brain.',
    ],
    [
      q('What is replication lag?',
        'The delay between a write on the leader and its appearance on a follower',
        ['The time to elect a leader', 'The size of the write log', 'The network latency to the client'],
        'It creates a window where followers return old data.'),
      q('Why must the old leader be fenced during failover?',
        'Otherwise it may accept writes that the new leader never sees',
        ['To save electricity', 'To free its disk', 'To update its schema'],
        'Two writers produce divergent data that is hard to reconcile.'),
    ],
  ),

  sharding: t(
    'Sharding splits data across machines by a key. It is how a system exceeds one machine, and it is also how a system acquires cross-shard queries and rebalancing work.',
    ['choose a shard key for even distribution', 'explain hotspots and why timestamps make poor keys', 'describe resharding strategies'],
    [
      ['The shard key decides everything', 'A good key distributes writes evenly and keeps related rows together, so common queries hit one shard. A user id works for user-scoped data; a timestamp concentrates every new write on the newest shard, creating a hotspot that grows worse as traffic increases.'],
      ['Resharding is inevitable', 'Fixed hash mod N breaks when N changes, because nearly every key moves. Consistent hashing or a large fixed number of virtual shards moves only a fraction. Plan for resharding before you need it, because it happens under load.'],
    ],
    {
      lang: 'text',
      code: `Bad:  shard = hash(timestamp) % N   -> every write hits the newest shard
Good: shard = hash(user_id) % 1024   -> even spread, user data co-located

Virtual shards: 1024 logical -> 8 physical
Move logical shard 512 from node C to node D when C is hot.
Only 1/1024 of keys move.`,
      output: 'Even write distribution with a bounded move on rebalance',
      explain: 'Virtual shards decouple the key space from the number of machines.',
    },
    [
      'Sharding on a monotonically increasing key such as an auto-increment id or timestamp.',
      'Choosing a shard key that makes the most common query cross-shard.',
    ],
    {
      prompt: 'Pick a shard key for a multi-tenant learning platform and name the query that becomes expensive.',
      steps: ['List the top three queries.', 'Choose the key that co-locates their data.', 'Name the cross-shard query you accept.'],
    },
    [
      'Shard on the key that your most common query filters by.',
      'Monotonic keys create write hotspots.',
      'Virtual shards make rebalancing cheap.',
    ],
    [
      q('Why is a timestamp a poor shard key for writes?',
        'All new writes land on the same shard, creating a hotspot',
        ['Timestamps are not unique', 'They cannot be hashed', 'They sort incorrectly'],
        'The newest shard receives the entire write load.'),
      q('What problem do virtual shards solve?',
        'Rebalancing moves only a fraction of keys instead of remapping everything',
        ['They remove the need for replication', 'They make queries faster', 'They encrypt data'],
        'Logical shards are many more than physical nodes.'),
    ],
  ),

  caching: t(
    'A cache trades freshness for speed. The design question is not whether to cache but what staleness the product can tolerate and how the cache is invalidated.',
    ['choose a cache-aside or write-through strategy', 'explain TTL, stampede and hot keys', 'avoid caching data that must be exact'],
    [
      ['Cache aside is the default', 'The application reads the cache, falls back to the database on a miss, then fills the cache. It is simple and resilient: a cache outage degrades latency, not correctness. The risk is stale data, which a TTL bounds and an explicit invalidation on write narrows.'],
      ['Stampedes and hot keys', 'When a popular key expires, every concurrent request misses and queries the database at once. A short lock or a stale-while-revalidate policy prevents the stampede. A single very hot key can also overload one cache node, which needs replication or local caching.'],
    ],
    {
      lang: 'text',
      code: `read(key):
  value = cache.get(key)
  if value: return value
  if not lock.acquire(key, ttl=2s):
      return cache.get_stale(key) or db.read(key)
  value = db.read(key)
  cache.set(key, value, ttl=60s)
  lock.release(key)
  return value

on write: db.write(); cache.delete(key)   # invalidate, do not update blindly`,
      output: 'A miss costs one database read, not one per concurrent request',
      explain: 'The lock collapses a stampede into a single fill.',
    },
    [
      'Caching a balance or inventory count with a long TTL and calling it eventually consistent.',
      'Writing to the cache and the database without deciding which wins on failure.',
    ],
    {
      prompt: 'Add caching to a course catalogue read path and state the acceptable staleness.',
      steps: ['Choose cache-aside.', 'Set a TTL that matches the product tolerance.', 'Invalidate on course update.'],
    },
    [
      'Cache-aside keeps the database as the source of truth.',
      'TTL bounds staleness; invalidation narrows it.',
      'Stampede protection is part of a production cache.',
    ],
    [
      q('What does cache-aside mean?',
        'The application reads the cache, falls back to the database and fills the cache',
        ['The database writes to the cache automatically', 'Only the cache is read', 'The cache is written before the database'],
        'The application owns the read path and the fill.'),
      q('What is a cache stampede?',
        'Many concurrent requests miss the same expired key and hit the database together',
        ['A cache node running out of disk', 'A slow invalidation', 'A duplicated write'],
        'A lock or stale-while-revalidate collapses the load.'),
    ],
  ),

  'load-balancing': t(
    'A load balancer spreads requests across healthy instances. This lesson covers the algorithms, health checks and the difference between layer 4 and layer 7.',
    ['choose a balancing algorithm for a workload', 'configure health checks that reflect real health', 'explain sticky sessions and their cost'],
    [
      ['Algorithms follow the workload', 'Round robin suits homogeneous stateless services. Least connections helps when request duration varies. Consistent hashing keeps a user on the same cache node. Random with two choices is surprisingly effective and avoids the herd behaviour of exact least-connections.'],
      ['Health checks must test the dependency', 'A process that accepts connections but cannot reach the database is not healthy. A readiness check that queries the database removes it from rotation; a liveness check that only proves the process is alive restarts it. Use both, and never make liveness depend on a shared dependency.'],
    ],
    {
      lang: 'text',
      code: `Layer 4: routes TCP by IP and port, fast, cannot read the path
Layer 7: routes HTTP by host and path, supports retries and TLS termination

Health:
  /live  -> process is running (no dependencies)
  /ready -> database reachable, migrations applied

Sticky sessions: only when session state is in memory.
Prefer a shared store so any instance can serve any request.`,
      output: 'Failed instances leave rotation without a restart loop',
      explain: 'Separating readiness from liveness prevents a database outage from restarting every instance.',
    },
    [
      'Making the liveness probe check the database, so a database blip restarts the whole fleet.',
      'Using sticky sessions to avoid externalising session state, which breaks rolling deploys.',
    ],
    {
      prompt: 'Design health checks for an API with a database and a cache dependency.',
      steps: ['Define liveness as process-only.', 'Define readiness with a database ping.', 'Decide whether a cache outage should fail readiness.'],
    },
    [
      'Choose the algorithm from request duration and affinity needs.',
      'Readiness controls traffic; liveness controls restarts.',
      'Externalise session state instead of relying on stickiness.',
    ],
    [
      q('Which probe should a load balancer use to decide whether to send traffic?',
        'The readiness probe',
        ['The liveness probe', 'The startup probe', 'The metrics endpoint'],
        'Readiness reflects whether the instance can serve requests now.'),
      q('Why do sticky sessions complicate deploys?',
        'Traffic pinned to an instance is lost when that instance is replaced',
        ['They use more bandwidth', 'They prevent TLS', 'They require layer 4'],
        'Shared session storage lets any instance serve any request.'),
    ],
  ),

  queues: t(
    'A queue decouples a producer from slow or unreliable work. It also introduces retries, duplicates and ordering questions that must be designed, not discovered.',
    ['decide what work belongs on a queue', 'design retries with backoff and a dead-letter queue', 'explain at-least-once delivery and idempotency'],
    [
      ['Move work off the request path', 'Sending an email, transcoding a video or generating a report should not block a response. The API writes a job and returns; a worker processes it. The user-visible latency drops and the work can be retried without the user resubmitting.'],
      ['Delivery guarantees shape the consumer', 'Most queues deliver at least once, so a consumer can see the same message twice after a crash. The handler must be idempotent, keyed by a message id. After repeated failures, the message goes to a dead-letter queue so it stops blocking the partition.'],
    ],
    {
      lang: 'text',
      code: `producer -> topic/queue -> worker pool -> success: ack
                                   |-> failure: retry with backoff
                                   |-> after N attempts: dead-letter queue

consumer must be idempotent:
  if processed.contains(message.id): ack and return
  processed.add(message.id) in the same transaction as the effect`,
      output: 'Retries recover transient failures; the DLQ preserves the rest',
      explain: 'Recording the message id in the same transaction makes redelivery harmless.',
    },
    [
      'Acknowledging before the work completes, so a crash loses the job.',
      'Retrying a non-idempotent handler, which charges a customer twice.',
    ],
    {
      prompt: 'Move certificate generation to a queue and describe the retry and dead-letter policy.',
      steps: ['Return 202 with a job id.', 'Retry with exponential backoff.', 'Send permanent failures to a DLQ with an alert.'],
    },
    [
      'Queues remove slow work from the request path.',
      'At-least-once delivery requires idempotent consumers.',
      'Dead-letter queues stop poison messages from blocking progress.',
    ],
    [
      q('Why must a consumer be idempotent with at-least-once delivery?',
        'The same message can be delivered more than once after a failure',
        ['Messages arrive out of order', 'Queues lose messages', 'The broker encrypts payloads'],
        'Redelivery must not repeat the effect.'),
      q('What is a dead-letter queue for?',
        'Holding messages that repeatedly failed so they stop blocking and can be inspected',
        ['Deleting failed messages silently', 'Storing successful results', 'Ordering messages'],
        'It preserves the failure for investigation and replay.'),
    ],
  ),

  consistency: t(
    'Distributed systems cannot be simultaneously consistent and available under a network partition. This lesson explains the trade-off in terms a product decision can use.',
    ['explain CAP without reciting it', 'distinguish strong, eventual and read-your-writes consistency', 'choose a consistency level per feature'],
    [
      ['Partitions are the premise', 'CAP says that when a network partition occurs, a system must choose between returning a possibly stale answer (available) and refusing to answer (consistent). Since partitions happen, the real design question is what each feature does during one.'],
      ['Consistency is a spectrum', 'Strong consistency makes every read see the latest write. Eventual consistency allows a delay. Read-your-writes guarantees a user sees their own update. Most products need strong consistency for money, read-your-writes for profile edits, and eventual consistency for feeds and counts.'],
    ],
    {
      lang: 'text',
      code: `Feature              Consistency needed
Payment ledger       strong (linearisable)
Profile edit         read-your-writes
Follower count       eventual (seconds)
Search index         eventual (minutes)
Course catalogue     eventual with short TTL`,
      output: 'One system, several consistency contracts',
      explain: 'Choosing per feature avoids paying the latency cost of strong consistency everywhere.',
    },
    [
      'Saying "we choose AP" without saying which data can be stale and for how long.',
      'Using strong consistency for view counters because it sounds safer, then hitting write contention.',
    ],
    {
      prompt: 'List five features of a social app and assign each a consistency level with a justification.',
      steps: ['Start with the money path.', 'Mark user-visible own writes.', 'Mark everything that can lag.'],
    },
    [
      'CAP is about behaviour during a partition.',
      'Consistency is chosen per feature, not per system.',
      'Read-your-writes is often the cheapest fix for stale reads.',
    ],
    [
      q('What does CAP actually trade off during a partition?',
        'Availability versus returning a consistent answer',
        ['Latency versus throughput', 'Storage versus compute', 'Cost versus security'],
        'Outside a partition, a system can often be both.'),
      q('Which consistency model stops a user seeing their own update as missing?',
        'Read-your-writes',
        ['Eventual consistency', 'Causal consistency across all users', 'Snapshot isolation'],
        'It routes or waits for the user\'s own write to be visible.'),
    ],
  ),

  idempotency: t(
    'Networks fail in ambiguous ways: a request may succeed while the response is lost. Idempotent operations make retries safe, which is the foundation of reliable distributed systems.',
    ['design idempotent write endpoints', 'explain exactly-once as at-least-once plus deduplication', 'handle duplicate messages and retries'],
    [
      ['The ambiguity is the problem', 'If a client times out, it cannot know whether the server processed the request. Retrying may duplicate the effect; not retrying may lose it. An idempotency key lets the server recognise the retry and return the original result.'],
      ['Exactly-once is a composition', 'No network delivers exactly once. Systems achieve the effect by delivering at least once and deduplicating with a stable key, usually in the same transaction as the side effect. That is what "exactly-once processing" means in practice.'],
    ],
    {
      lang: 'text',
      code: `POST /payments
Idempotency-Key: 9c1e...

server:
  if key seen: return stored_response
  begin transaction
    insert key + response placeholder (unique constraint)
    charge card
    update response
  commit

retry -> unique violation -> return stored response`,
      output: 'One charge, however many times the client retries',
      explain: 'The unique constraint is the arbiter, so two concurrent retries cannot both charge.',
    },
    [
      'Deduplicating in a separate store from the effect, so a crash between them duplicates the charge.',
      'Generating a new idempotency key on each retry, which defeats the purpose.',
    ],
    {
      prompt: 'Add idempotency to a payment endpoint and describe what happens on a concurrent duplicate.',
      steps: ['Require the key header.', 'Insert the key with a unique constraint.', 'Return the stored response on conflict.'],
    },
    [
      'Idempotency keys make retries safe.',
      'Exactly-once is at-least-once plus deduplication.',
      'The dedupe record must commit with the effect.',
    ],
    [
      q('Why must the idempotency record be written in the same transaction as the effect?',
        'Otherwise a crash between them allows a duplicate on retry',
        ['It is faster', 'It saves storage', 'It encrypts the key'],
        'Atomicity is what makes the deduplication reliable.'),
      q('How is exactly-once processing usually achieved?',
        'At-least-once delivery plus deduplication by a stable key',
        ['A reliable network', 'A single server', 'Synchronous replication'],
        'The effect is applied once even if the message arrives twice.'),
    ],
  ),

  observability: t(
    'A distributed system fails in ways no single log file explains. Metrics, traces and structured logs are how you find the one slow service among twenty.',
    ['choose metrics that reflect user experience', 'follow a request with a trace id', 'alert on symptoms rather than causes'],
    [
      ['Three signals, three questions', 'Metrics answer "how much and how fast" over time. Traces answer "where did this request spend its time". Logs answer "what exactly happened in this case". You need all three, and each is useless without a shared request id.'],
      ['Alert on symptoms', 'Users care about errors and latency, not CPU. Alert on error rate and p95 latency, and use CPU as a diagnostic after the alert fires. Cause-based alerts produce noise and miss the failures nobody predicted.'],
    ],
    {
      lang: 'text',
      code: `request -> gateway (trace id) -> api -> db
                                 -> queue -> worker

metrics: requests_total{route,status}, latency_p95{route}
trace:   span api.handler 120ms -> span db.query 98ms
log:     {"traceId":"abc","route":"/trips","status":500,"err":"timeout"}

alert: error_rate > 2% for 5m OR p95 > 800ms for 10m`,
      output: 'The slow span identifies the database, not the API',
      explain: 'The trace turns a vague "the app is slow" into one query on one service.',
    },
    [
      'Collecting metrics with no route label, so you cannot tell which endpoint degraded.',
      'Alerting on CPU and missing a latency regression caused by a slow query.',
    ],
    {
      prompt: 'Instrument a request path end to end and name the three alerts you would create.',
      steps: ['Propagate a trace id.', 'Record latency per route.', 'Alert on error rate and p95.'],
    },
    [
      'Metrics, traces and logs answer different questions.',
      'A shared request id ties them together.',
      'Alert on user-visible symptoms.',
    ],
    [
      q('Which signal tells you where a single request spent its time?',
        'A distributed trace',
        ['A counter metric', 'An access log', 'A dashboard'],
        'Spans break the request into timed segments.'),
      q('Why alert on error rate rather than CPU?',
        'Error rate reflects user impact; CPU may be high with no user-visible problem',
        ['CPU is hard to measure', 'Error rate is cheaper', 'CPU alerts are always wrong'],
        'Symptom-based alerts catch failures you did not predict.'),
    ],
  ),

  'rate-limiting': t(
    'Rate limiting protects a system and enforces fairness. The algorithm matters less than where the limit lives and what happens when it is exceeded.',
    ['compare token bucket, leaky bucket and sliding window', 'place limits at the edge and per tenant', 'return useful 429 responses'],
    [
      ['Token bucket allows bursts', 'A bucket holds tokens that refill at a fixed rate; each request consumes one. It allows short bursts up to the bucket size while enforcing an average rate, which matches how real clients behave. A fixed window counter is simpler but allows double the limit across a window boundary.'],
      ['Distributed limits need shared state', 'A per-instance counter multiplies the limit by the number of instances. Redis with an atomic increment and expiry gives a shared view. When Redis is unavailable, decide in advance whether to fail open (availability) or closed (protection).'],
    ],
    {
      lang: 'text',
      code: `key = "rl:" + apiKey + ":" + floor(now / 60)
count = redis.incr(key)
if count == 1: redis.expire(key, 60)
if count > limit:
    return 429 with Retry-After and X-RateLimit-Remaining

per-tenant limit at the gateway
per-user login limit at the auth service
global circuit breaker at the edge`,
      output: '429 Too Many Requests, Retry-After: 12',
      explain: 'The client learns when to retry instead of hammering the endpoint.',
    },
    [
      'Limiting per process, so adding instances raises the effective limit.',
      'Returning 500 or closing the connection instead of a 429 with headers.',
    ],
    {
      prompt: 'Add per-key rate limiting to an API and describe behaviour when the shared store is down.',
      steps: ['Choose token bucket.', 'Store counters in Redis with expiry.', 'Decide fail-open or fail-closed per route.'],
    },
    [
      'Token bucket allows bursts while enforcing an average rate.',
      'The counter must be shared across instances.',
      'A 429 with Retry-After is part of the contract.',
    ],
    [
      q('What does a token bucket allow that a fixed window does not?',
        'Short bursts up to the bucket size while enforcing the average rate',
        ['Unlimited requests', 'No shared state', 'Strict ordering'],
        'Tokens accumulate when idle and are spent in a burst.'),
      q('Why does a per-instance counter fail to limit a scaled service?',
        'Each instance enforces its own limit, multiplying the effective rate',
        ['Counters are not thread-safe', 'It uses too much memory', 'It cannot count'],
        'A shared store gives one global view.'),
    ],
  ),

  'url-shortener': t(
    'The URL shortener is the standard warm-up design because it isolates one hard problem: generating unique short keys and serving redirects at read-heavy scale.',
    ['derive requirements and estimates for a read-heavy service', 'choose a key generation strategy', 'design the redirect path and cache'],
    [
      ['Reads dominate', 'A shortener might see 100 million writes and 10 billion reads per day, a 100:1 ratio. The redirect must be fast and highly available; creation can be slower. That single ratio justifies caching and read replicas.'],
      ['Key generation', 'A counter encoded in base62 gives short, unique keys but leaks volume and needs a central sequence. A random key needs a uniqueness check and retries. A hash of the URL is deterministic but collides and prevents per-user analytics. Choose, then state the trade-off.'],
    ],
    {
      lang: 'text',
      code: `POST /links {url} -> {short: "aZ3k9"}
GET /aZ3k9 -> 301/302 Location: original

key: base62(counter)          7 chars = 62^7 ~ 3.5 trillion
store: key -> url, owner, created_at, expires_at
read: cache key -> url (TTL 24h), fallback to DB
301: permanent, browser caches (less analytics)
302: temporary, every click hits you (analytics)`,
      output: 'a 100:1 read ratio turns a simple service into a caching problem',
      explain: 'The redirect decision (301 versus 302) is a product decision about analytics.',
    },
    [
      'Designing a distributed ID service before checking whether a single counter suffices.',
      'Choosing 301 by default and then wondering why click analytics are incomplete.',
    ],
    {
      prompt: 'Design a URL shortener end to end in 20 minutes, then name its first bottleneck at 10x traffic.',
      steps: ['State requirements and estimates.', 'Choose key generation.', 'Describe cache, store and redirect status codes.'],
    },
    [
      'Read-heavy designs optimise the read path.',
      'Key generation is the core trade-off.',
      '301 and 302 change analytics and load.',
    ],
    [
      q('Why might a shortener return 302 instead of 301?',
        '302 keeps the browser from caching, so every click reaches the server for analytics',
        ['302 is faster', '301 is deprecated', '302 is required by HTTP'],
        'Permanent redirects are cached and hide repeat clicks.'),
      q('What is the trade-off of hashing the URL to produce the key?',
        'It is deterministic but collides and prevents per-user short links',
        ['It is not unique', 'It is too long', 'It cannot be stored'],
        'Determinism removes the need for a counter but limits flexibility.'),
    ],
  ),

  capstone: t(
    'The capstone is a full mock interview: a prompt you have not seen, a time box and a review against the scoring criteria.',
    ['run a 45-minute design under time pressure', 'choose the two components worth a deep dive', 'review your own answer against the rubric'],
    [
      ['Practise out loud', 'Designing silently hides the reasoning the interviewer is scoring. Speaking forces you to name assumptions, and it exposes gaps while there is still time to fix them. Record yourself and listen for sections where you said "and then it scales" without saying how.'],
      ['Deep dive where the risk is', 'Pick the component with the most uncertainty: the matching algorithm, the key generation, the consistency boundary. A generic deep dive into load balancing signals memorisation; a specific one into the hard part signals judgement.'],
    ],
    {
      lang: 'text',
      code: `Prompt: design a collaborative document editor.

1. Scope: 5M docs, 10k concurrent editors, edit latency < 150ms
2. Core: open doc, apply edit, sync to collaborators
3. Design: websocket gateway, doc service, operation log, snapshot store
4. Deep dive: conflict resolution (OT vs CRDT) and its trade-offs
5. Failure: gateway reconnect, duplicate operations, offline edits
6. Review: which requirement did I not address?`,
      output: 'A design defended by requirements, with one deep dive that matches the risk',
      explain: 'The review step is where most candidates find the requirement they quietly ignored.',
    },
    [
      'Spending the deep dive on a component with no interesting trade-offs.',
      'Never revisiting the non-functional requirements to check the design meets them.',
    ],
    {
      prompt: 'Run a timed mock interview with a peer, then score each other on requirements, design, depth and trade-offs.',
      steps: ['Pick a prompt you have not prepared.', 'Record the session.', 'Score against four criteria and list one fix.'],
    },
    [
      'Practise aloud so the reasoning is visible.',
      'Deep dive into the riskiest component.',
      'Close by checking the design against every requirement.',
    ],
    [
      q('Which component deserves the deep dive?',
        'The one with the most uncertainty or the hardest trade-off',
        ['The load balancer', 'The component you know best', 'The database always'],
        'It is where your judgement is most visible.'),
      q('Why review against requirements at the end?',
        'It catches the requirement you silently dropped while designing',
        ['It fills time', 'It is required by the rubric', 'It shortens the answer'],
        'Every stated requirement should map to a component or an explicit trade-off.'),
    ],
  ),
};

module.exports = {
  slug: 'system-design-interview',
  title: 'System Design Interview Prep',
  shortDescription:
    'Learn the structure, estimates and trade-offs that turn an ambiguous prompt into a design you can defend.',
  description:
    'A structured preparation course for system design interviews. You will learn what interviewers actually score, how to scope a prompt, how to estimate traffic and storage, and how to design APIs, storage, replication, sharding, caching, queues and consistency. Each module ends with a ten-question quiz, and the course closes with a full timed mock interview and a rubric for reviewing your own answer.',
  level: 'Advanced',
  price: 129.99,
  duration: '6 weeks',
  featured: true,
  outcomes: [
    'Scope an ambiguous prompt into requirements and estimates',
    'Choose storage, replication and sharding strategies with reasons',
    'Design APIs with pagination and idempotent writes',
    'Explain caching, queues and consistency trade-offs',
    'Instrument a design for observability',
    'Defend a deep dive on the riskiest component',
    'Recognise and avoid the common interview failure modes',
    'Review your own answer against a scoring rubric',
  ],
  requirements: [
    'Experience building or operating a web service',
    'Basic familiarity with databases, HTTP and caching',
    'No prior interview preparation required',
  ],
  targetAudience:
    'Engineers preparing for mid-level and senior system design interviews, and developers who want to reason about distributed systems.',
  modules: [
    {
      title: 'Module 1: Structure and scope',
      description: 'Learn what is scored, how to bound the problem and how to estimate scale before designing.',
      check: [
        q('An interviewer asks for "a design for X" with no details. What is the best first move?',
          'Ask about users, core actions, scale and constraints',
          ['Draw the database schema', 'Choose a cloud provider', 'Start coding'],
          'Scope is the first scored dimension and it determines everything after.'),
        q('Which estimate most directly decides whether sharding is needed?',
          'Storage growth per year and write throughput',
          ['The number of source files', 'The team size', 'The colour scheme'],
          'Sharding is a response to data volume and write rate exceeding one machine.'),
      ],
      lessons: [
        { title: 'What the interview actually tests', objective: 'Structure a 45-minute answer around the scoring criteria.', topic: 'what-is-tested', minutes: 20 },
        { title: 'Requirements and constraints', objective: 'Turn an ambiguous prompt into a bounded problem.', topic: 'requirements', minutes: 25 },
        { title: 'Back-of-envelope estimation', objective: 'Estimate QPS, storage and bandwidth from first principles.', topic: 'estimation', minutes: 25 },
        { title: 'API design under pressure', objective: 'Design resources, pagination and idempotent writes.', topic: 'api-design', minutes: 30 },
      ],
    },
    {
      title: 'Module 2: Data at scale',
      description: 'Choose a data store, replicate it, shard it and cache it without losing correctness.',
      check: [
        q('A user edits their profile and immediately reloads the page. Which routing avoids a stale read?',
          'Read from the leader, or wait for the follower to reach the write position',
          ['Read from any follower', 'Read from the cache only', 'Retry until it appears'],
          'Read-your-writes makes the user\'s own update visible.'),
        q('Which shard key creates a write hotspot?',
          'A timestamp or auto-increment id',
          ['A hashed user id', 'A tenant id', 'A random uuid'],
          'Every new write lands on the newest shard.'),
      ],
      lessons: [
        { title: 'Choosing a data store', objective: 'Match storage to access pattern and consistency needs.', topic: 'sql-vs-nosql', minutes: 30 },
        { title: 'Replication and failover', objective: 'Scale reads and survive a leader failure.', topic: 'replication', minutes: 30 },
        { title: 'Sharding and hotspots', objective: 'Split data without creating a hot partition.', topic: 'sharding', minutes: 30 },
        { title: 'Caching strategies', objective: 'Trade freshness for latency deliberately.', topic: 'caching', minutes: 30 },
      ],
    },
    {
      title: 'Module 3: Distributed behaviour',
      description: 'Balance traffic, decouple work, choose consistency per feature and make retries safe.',
      check: [
        q('A queue delivers the same message twice after a worker crash. What prevents a double charge?',
          'An idempotent consumer recording the message id with the effect',
          ['A larger queue', 'Faster workers', 'A second queue'],
          'At-least-once delivery requires deduplication.'),
        q('Why not make every feature strongly consistent?',
          'Strong consistency costs latency and availability under partition',
          ['It is not supported by databases', 'It uses too much disk', 'It prevents caching'],
          'Consistency is chosen per feature based on what the product needs.'),
      ],
      lessons: [
        { title: 'Load balancing and health checks', objective: 'Route traffic away from unhealthy instances.', topic: 'load-balancing', minutes: 25 },
        { title: 'Queues and background work', objective: 'Move slow work off the request path safely.', topic: 'queues', minutes: 30 },
        { title: 'Consistency models', objective: 'Choose a consistency contract per feature.', topic: 'consistency', minutes: 30 },
        { title: 'Idempotency and retries', objective: 'Make ambiguous network failures safe to retry.', topic: 'idempotency', minutes: 30 },
      ],
    },
    {
      title: 'Module 4: Operating and defending the design',
      description: 'Observe the system, protect it from abuse, work through a full design and review your own interview.',
      check: [
        q('Which alert best reflects user impact?',
          'Error rate and p95 latency per route',
          ['CPU above 80%', 'Disk usage', 'Number of deployments'],
          'Symptom-based alerts catch failures you did not predict.'),
        q('What should the final five minutes of a design interview contain?',
          'A check against every requirement plus bottlenecks and trade-offs',
          ['More feature ideas', 'A code review', 'A summary of your CV'],
          'It closes the loop on the criteria being scored.'),
      ],
      lessons: [
        { title: 'Observability by design', objective: 'Instrument the system before it breaks.', topic: 'observability', minutes: 25 },
        { title: 'Rate limiting and abuse', objective: 'Protect capacity and enforce fairness.', topic: 'rate-limiting', minutes: 25 },
        { title: 'Worked design: URL shortener', objective: 'Apply the framework to a complete prompt.', topic: 'url-shortener', minutes: 40 },
        { title: 'Capstone: timed mock interview', objective: 'Run and review a full interview under pressure.', topic: 'capstone', minutes: 45 },
      ],
    },
  ],
  topics,
};

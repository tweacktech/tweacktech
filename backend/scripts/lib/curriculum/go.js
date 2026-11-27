/**
 * Go Programming for Engineers
 *
 * Written for developers who already program in another language and need Go's
 * model specifically: explicit errors, composition over inheritance, and
 * concurrency built into the language rather than bolted on.
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
  toolchain: t(
    'Go ships as a single toolchain: one command formats, one builds, one tests, one fetches dependencies. This lesson installs it and explains the module system that replaced GOPATH.',
    ['install Go and confirm the version', 'create a module and run your first program', 'explain what go.mod records'],
    [
      ['One binary, many jobs', 'go build compiles, go run compiles and executes, go test runs tests, go vet reports suspicious constructs and gofmt rewrites formatting. There is no separate build tool to configure, which is why a Go repository is usually buildable the moment it is cloned.'],
      ['Modules, not GOPATH', 'A module is a directory with a go.mod file declaring its import path and dependency versions. Go 1.16 and later build in module mode by default, so code can live anywhere on disk. Import paths are the module path plus the package directory, and go mod tidy adds what the code uses and removes what it does not.'],
    ],
    {
      lang: 'go',
      code: `package main

import "fmt"

func main() {
    fmt.Println("Hello, Go")
}`,
      output: 'Hello, Go',
      explain: 'A Go program starts at main.main in package main. go run main.go compiles to a temporary binary and executes it.',
    },
    [
      'Creating a project outside a module, which makes imports unresolvable.',
      'Editing go.sum by hand; let go mod tidy regenerate it.',
    ],
    {
      prompt: 'Create a module, print the Go version and the module path from code, then run go vet.',
      steps: ['Run go mod init example.com/hello.', 'Print runtime.Version() and a constant.', 'Run gofmt -l . and go vet ./... and fix anything reported.'],
    },
    [
      'go build, run, test, vet and fmt cover the normal workflow.',
      'A module is defined by go.mod and can live anywhere.',
      'go mod tidy is the only dependency command most projects need.',
    ],
    [
      q('What does go.mod declare?',
        'The module path and the dependency versions the module needs',
        ['The compiler flags for each file', 'The list of source files to build', 'The deployment target'],
        'It is the module manifest; go.sum records the checksums of downloaded modules.'),
      q('Which command removes unused dependencies from go.mod?',
        'go mod tidy',
        ['go clean', 'go vet', 'go fmt'],
        'tidy reconciles go.mod with the imports actually present in the code.'),
    ],
  ),

  values: t(
    'Go is statically typed with a small set of built-in types and no implicit conversions. This lesson covers declarations, zero values and why the compiler refuses to mix types silently.',
    ['declare variables with var and :=', 'predict the zero value of each type', 'convert between numeric types explicitly'],
    [
      ['Zero values instead of undefined', 'Every declared variable is initialised: numbers to 0, strings to "", booleans to false, and pointers, slices, maps and interfaces to nil. There is no undefined state, so a missing assignment produces a predictable value rather than a runtime surprise.'],
      ['No implicit conversion', 'Adding an int to an int64 is a compile error; you must convert explicitly with int64(n). The same applies to string and []byte, which convert but allocate. Constants are untyped until they are used, which is why const Pi = 3.14 can be assigned to either float32 or float64.'],
    ],
    {
      lang: 'go',
      code: `package main

import "fmt"

func main() {
    var count int        // 0
    name := "Tweack"     // string
    ratio := 0.75        // float64
    var ok bool          // false

    var small int32 = 7
    big := int64(small)  // explicit conversion

    fmt.Println(count, name, ratio, ok, big)
}`,
      output: '0 Tweack 0.75 false 7',
      explain: ':= declares and infers a type inside a function; var works anywhere. Both give a zero value when no initialiser is provided.',
    },
    [
      'Declaring a variable and then never using it; Go treats unused local variables as a compile error.',
      'Assuming := can be used at package level, where only var and const are allowed.',
    ],
    {
      prompt: 'Declare one variable of each basic type, print them before assigning anything, then assign and print again.',
      steps: ['Use var without an initialiser.', 'Print the values and observe the zero values.', 'Convert an int to float64 and print the result.'],
    },
    [
      'All variables start at a defined zero value.',
      'Conversions between numeric types are always explicit.',
      'Untyped constants adapt to the type they are assigned to.',
    ],
    [
      q('What is the zero value of a string in Go?',
        'The empty string ""',
        ['nil', 'The string "0"', 'A compile error occurs'],
        'Strings are values, not pointers, so their zero value is the empty string.'),
      q('What happens when you add an int and an int64?',
        'A compile error; one side must be converted explicitly',
        ['They are added as int64', 'The int is silently widened', 'The result is a float'],
        'Go does not perform implicit numeric conversion.'),
    ],
  ),

  control: t(
    'Go has if, for and switch, and nothing else. There is no while loop and no ternary operator, which keeps control flow easy to read.',
    ['write if statements with an initialiser', 'use for in its three forms', 'choose between switch and if'],
    [
      ['for is the only loop', 'A bare for {} loops forever, for condition {} behaves like while, and for init; condition; post {} behaves like a classic for. range iterates slices, maps, strings and channels, returning index and value for slices and key and value for maps.'],
      ['if and switch carry scope', 'Both can declare a variable in the statement before the condition, for example if err := do(); err != nil {}. That variable is scoped to the block, which prevents leaking temporary errors. switch does not fall through unless you write fallthrough, and it accepts any comparable type, not just integers.'],
    ],
    {
      lang: 'go',
      code: `package main

import "fmt"

func classify(n int) string {
    switch {
    case n < 0:
        return "negative"
    case n == 0:
        return "zero"
    default:
        return "positive"
    }
}

func main() {
    total := 0
    for i := 1; i <= 5; i++ {
        total += i
    }
    for _, word := range []string{"go", "is", "small"} {
        fmt.Print(word, " ")
    }
    fmt.Println()
    fmt.Println(total, classify(total))
}`,
      output: 'go is small \n15 positive',
      explain: 'range gives the index and value; the blank identifier discards the index when only the value is needed.',
    },
    [
      'Using range on a slice and ignoring that the first value is the index, not the element.',
      'Writing while or do-while out of habit; Go only has for.',
    ],
    {
      prompt: 'Write a function that returns the first word longer than three characters, using range and an early return.',
      steps: ['Split the sentence with strings.Fields.', 'Range over the result.', 'Return as soon as len(word) > 3.'],
    },
    [
      'for covers every looping pattern in the language.',
      'if and switch can declare a scoped variable before the condition.',
      'switch does not fall through unless asked to.',
    ],
    [
      q('Which loop form does Go provide?',
        'Only for, in several styles',
        ['for, while and do-while', 'loop and for', 'while and range'],
        'while and do-while are expressed with for.'),
      q('What does the blank identifier _ do in range?',
        'Discards a value you do not need',
        ['Skips the current iteration', 'Creates a new variable', 'Panics if used'],
        'It is a write-only placeholder that keeps the compiler happy about unused values.'),
    ],
  ),

  functions: t(
    'Functions in Go can return more than one value, which is how the language reports errors instead of throwing exceptions. This lesson covers signatures, named returns and variadic parameters.',
    ['declare functions with multiple return values', 'use named results sparingly', 'write variadic functions'],
    [
      ['Multiple returns replace exceptions', 'A function that can fail returns the value and an error, and the caller decides what to do. This keeps control flow explicit: you can see every failure point in the code rather than inferring it from a stack trace.'],
      ['Defer runs on the way out', 'defer schedules a call to run when the surrounding function returns, which is how files and locks are released. Deferred calls run last-in-first-out, and their arguments are evaluated at the point of the defer statement, not at execution.'],
    ],
    {
      lang: 'go',
      code: `package main

import (
    "fmt"
    "strings"
)

func splitName(full string) (first, last string, err error) {
    parts := strings.Fields(full)
    if len(parts) < 2 {
        return "", "", fmt.Errorf("need two names, got %d", len(parts))
    }
    return parts[0], parts[len(parts)-1], nil
}

func sum(numbers ...int) int {
    total := 0
    for _, n := range numbers {
        total += n
    }
    return total
}

func main() {
    first, last, err := splitName("Ada Lovelace")
    if err != nil {
        fmt.Println("error:", err)
        return
    }
    fmt.Println(first, last, sum(1, 2, 3))
}`,
      output: 'Ada Lovelace 6',
      explain: 'Named results document the signature, and the early return keeps the error path flat.',
    },
    [
      'Ignoring the returned error with _, which hides failures the caller should handle.',
      'Returning a nil error alongside an invalid value, so callers cannot tell success from failure.',
    ],
    {
      prompt: 'Write a divide function that returns an error when the divisor is zero, and a caller that handles it.',
      steps: ['Return (float64, error).', 'Return a descriptive error instead of panicking.', 'Print the error and continue.'],
    },
    [
      'Errors are ordinary values returned alongside results.',
      'defer guarantees cleanup regardless of the return path.',
      'Variadic parameters accept zero or more arguments of one type.',
    ],
    [
      q('How does Go typically report a failure?',
        'By returning an error value the caller checks',
        ['By throwing an exception', 'By writing to stderr', 'By terminating the process'],
        'Errors are values; panics are reserved for unrecoverable programmer mistakes.'),
      q('When are a deferred call\'s arguments evaluated?',
        'At the moment the defer statement executes',
        ['When the deferred function runs', 'After the program exits', 'When the function is compiled'],
        'The call itself is delayed, but its arguments are captured immediately.'),
    ],
  ),

  structs: t(
    'Go has no classes. Structs hold data, methods attach behaviour, and embedding composes behaviour without inheritance.',
    ['define a struct and construct values', 'attach methods with value or pointer receivers', 'compose types with embedding'],
    [
      ['Value and pointer receivers', 'A method with a value receiver operates on a copy, so mutations are lost. A pointer receiver modifies the original and avoids copying large structs. Pick one style per type; mixing them makes it unclear whether a call mutates.'],
      ['Embedding is composition', 'Embedding a type promotes its fields and methods, so the outer type satisfies the same interfaces. It is not inheritance: there is no virtual dispatch and no override, and the embedded value is still addressable by its type name.'],
    ],
    {
      lang: 'go',
      code: `package main

import "fmt"

type Course struct {
    Title  string
    Lessons int
}

func (c *Course) AddLesson() {
    c.Lessons++
}

type Catalog struct {
    Courses []Course
    Name    string
}

func main() {
    c := Course{Title: "Go", Lessons: 15}
    c.AddLesson()
    catalog := Catalog{Name: "Tweack", Courses: []Course{c}}
    fmt.Println(catalog.Name, catalog.Courses[0].Title, catalog.Courses[0].Lessons)
}`,
      output: 'Tweack Go 16',
      explain: 'AddLesson uses a pointer receiver, so the increment is visible to the caller.',
    },
    [
      'Using a value receiver for a method that must mutate the struct.',
      'Confusing embedding with inheritance and expecting overridden methods to dispatch dynamically.',
    ],
    {
      prompt: 'Model a Book with Title and Pages, add a method that mutates Pages through a pointer receiver, and embed it in a Shelf.',
      steps: ['Define the struct and constructor.', 'Add a pointer-receiver method.', 'Embed Book in Shelf and call the promoted method.'],
    },
    [
      'Structs are the data model; methods add behaviour.',
      'Pointer receivers mutate; value receivers copy.',
      'Embedding promotes fields and methods without inheritance.',
    ],
    [
      q('Which receiver lets a method modify the original struct?',
        'A pointer receiver',
        ['A value receiver', 'A variadic receiver', 'Any receiver'],
        'A value receiver works on a copy, so changes are discarded.'),
      q('What does embedding provide?',
        'Promotion of fields and methods from the embedded type',
        ['Subclassing with virtual methods', 'Multiple inheritance of state', 'Runtime type switching'],
        'It is composition: the outer type gains the embedded type\'s method set.'),
    ],
  ),

  interfaces: t(
    'An interface lists method signatures. Any type with those methods satisfies it automatically, which is how Go decouples code without declaring intent.',
    ['define an interface and implement it implicitly', 'accept interfaces and return structs', 'explain why small interfaces are preferred'],
    [
      ['Implicit satisfaction', 'There is no implements keyword. If a type has the methods an interface requires, it satisfies the interface, including types from other packages. That makes interfaces a consumer-side tool: the package that needs the behaviour declares the narrow interface it needs.'],
      ['Small interfaces compose', 'io.Reader and io.Writer each have one method, and nearly everything implements them, so they combine freely. A large interface is hard to satisfy and hard to fake in tests. Keep interfaces to one to three methods and define them where they are used.'],
    ],
    {
      lang: 'go',
      code: `package main

import "fmt"

type Notifier interface {
    Notify(message string) error
}

type Email struct{ Address string }

func (e Email) Notify(message string) error {
    fmt.Println("email to", e.Address+":", message)
    return nil
}

func send(n Notifier, message string) {
    _ = n.Notify(message)
}

func main() {
    send(Email{Address: "student@tweacktech.com"}, "Quiz unlocked")
}`,
      output: 'email to student@tweacktech.com: Quiz unlocked',
      explain: 'send depends on the behaviour it needs, so any notifier works without changing send.',
    },
    [
      'Declaring an interface next to the implementation instead of where it is consumed.',
      'Returning an interface from a constructor when a concrete type would let callers use more of it.',
    ],
    {
      prompt: 'Define a two-method interface and implement it with two different structs, then call both through the interface.',
      steps: ['Write the interface where it is used.', 'Implement it on two types.', 'Put both values in a slice of the interface type.'],
    },
    [
      'Satisfaction is implicit: matching methods are enough.',
      'Accept interfaces, return concrete types.',
      'Narrow interfaces are easier to implement and to test.',
    ],
    [
      q('How does a type satisfy an interface in Go?',
        'By having all the methods the interface declares, with no explicit declaration',
        ['By embedding the interface', 'By registering with the runtime', 'By using the implements keyword'],
        'Satisfaction is structural and checked by the compiler.'),
      q('Why is "accept interfaces, return structs" good advice?',
        'Callers get the full concrete type, and your code depends only on the behaviour it uses',
        ['It makes programs compile faster', 'Interfaces cannot be returned', 'Structs are always smaller'],
        'It maximises flexibility on both sides of the API.'),
    ],
  ),

  errors: t(
    'Go errors are values. This lesson covers creating them, wrapping them with context and inspecting them with errors.Is and errors.As.',
    ['return and check errors at each call site', 'wrap errors with %w', 'use errors.Is and errors.As instead of string matching'],
    [
      ['Wrap, do not replace', 'fmt.Errorf("load course: %w", err) adds context while keeping the original error in the chain. errors.Is then compares against a sentinel such as sql.ErrNoRows, and errors.As extracts a typed error. Comparing error strings breaks the moment a message changes.'],
      ['Panic is not error handling', 'A panic unwinds the stack and, without recover, crashes the process. Use it for programmer errors that make continuing meaningless, such as an out-of-range index. Expected failures, including network timeouts and missing rows, are returned as errors.'],
    ],
    {
      lang: 'go',
      code: `package main

import (
    "errors"
    "fmt"
)

var ErrNotFound = errors.New("not found")

func find(id int) (string, error) {
    if id != 1 {
        return "", fmt.Errorf("find %d: %w", id, ErrNotFound)
    }
    return "Go", nil
}

func main() {
    _, err := find(2)
    if errors.Is(err, ErrNotFound) {
        fmt.Println("missing:", err)
    }
}`,
      output: 'missing: find 2: not found',
      explain: 'The wrapper adds context but errors.Is still reaches the sentinel through the chain.',
    },
    [
      'Returning err without context, so the caller cannot tell which operation failed.',
      'Using == on a wrapped error, which fails because the wrapper is a different value.',
    ],
    {
      prompt: 'Create a sentinel error, wrap it twice with different context, then match it with errors.Is.',
      steps: ['Declare the sentinel with errors.New.', 'Wrap it in two functions with %w.', 'Call the outer function and test with errors.Is.'],
    },
    [
      'Errors are values you return and inspect.',
      '%w preserves the chain; errors.Is and errors.As walk it.',
      'Panics are for bugs, not expected failures.',
    ],
    [
      q('What does the %w verb do in fmt.Errorf?',
        'Wraps the original error so it can be inspected later',
        ['Writes the error to a file', 'Formats the error as JSON', 'Discards the error'],
        'The wrapped error remains reachable through errors.Is and errors.As.'),
      q('When is panic appropriate?',
        'When the program cannot continue because of a programming mistake',
        ['When a database row is missing', 'When a user submits invalid input', 'When an HTTP request times out'],
        'Those are expected conditions and belong in returned errors.'),
    ],
  ),

  packages: t(
    'A Go package is a directory of files compiled together. This lesson covers naming, exported identifiers, internal packages and how to split a growing service.',
    ['choose package names and boundaries', 'export only what callers need', 'use internal/ to prevent external imports'],
    [
      ['Exported by capitalisation', 'An identifier starting with an uppercase letter is exported; anything else is package-private. That single rule replaces public, private and protected keywords, so the API surface of a package is exactly its capitalised identifiers.'],
      ['Layout follows dependencies', 'Put domain types in their own package, storage behind an interface, and HTTP handlers in a transport package that depends on both. The internal/ directory is importable only within the parent module, which lets you keep implementation packages out of your public API.'],
    ],
    {
      lang: 'go',
      code: `// internal/store/store.go
package store

type Course struct {
    ID    string
    Title string
}

type Store interface {
    Get(id string) (Course, error)
}

// internal/httpapi/handler.go
package httpapi

import "example.com/app/internal/store"

type Handler struct {
    Store store.Store
}`,
      output: 'import cycle: none',
      explain: 'The handler depends on the interface, and the store package knows nothing about HTTP.',
    },
    [
      'Putting everything in package main, which makes it untestable and impossible to reuse.',
      'Creating a package named utils that collects unrelated helpers.',
    ],
    {
      prompt: 'Split a single-file service into three packages: domain types, storage and HTTP handlers.',
      steps: ['Move the structs into their own package.', 'Define a storage interface where it is used.', 'Have the handler depend on the interface, not a concrete store.'],
    },
    [
      'Capitalisation decides what is exported.',
      'Packages should be named for what they provide.',
      'internal/ keeps implementation packages private to the module.',
    ],
    [
      q('How do you export an identifier from a package?',
        'Start its name with an uppercase letter',
        ['Add it to an export list', 'Use the public keyword', 'Put it in a file named export.go'],
        'Capitalisation is the only visibility rule in Go.'),
      q('What does an import cycle cause?',
        'A compile error; the packages cannot depend on each other',
        ['A runtime panic', 'A warning only', 'Slower builds'],
        'Go forbids cyclic imports, which pushes you towards a clean dependency direction.'),
    ],
  ),

  concurrency: t(
    'Goroutines are cheap, multiplexed threads, and channels are typed pipes for communicating between them. This lesson covers the primitives and the patterns that keep them safe.',
    ['start goroutines and wait for them with sync.WaitGroup', 'send and receive on buffered and unbuffered channels', 'detect a data race with the race detector'],
    [
      ['Do not communicate by sharing memory', 'Two goroutines writing the same variable without synchronisation is a data race, and Go\'s race detector will find it. The idiomatic fix is to send ownership of the data over a channel so only one goroutine touches it at a time. Mutexes are fine too; the point is that access must be synchronised.'],
      ['Channels have direction and capacity', 'An unbuffered channel blocks the sender until a receiver arrives, which synchronises the two. A buffered channel of size n accepts n sends before blocking. Closing a channel signals that no more values will be sent, and receiving from a closed channel returns the zero value immediately, so only the sender should close it.'],
    ],
    {
      lang: 'go',
      code: `package main

import (
    "fmt"
    "sync"
)

func worker(id int, jobs <-chan int, results chan<- int, wg *sync.WaitGroup) {
    defer wg.Done()
    for job := range jobs {
        results <- job * job
    }
}

func main() {
    jobs := make(chan int, 3)
    results := make(chan int, 3)
    var wg sync.WaitGroup

    for w := 1; w <= 3; w++ {
        wg.Add(1)
        go worker(w, jobs, results, &wg)
    }

    for i := 1; i <= 3; i++ {
        jobs <- i
    }
    close(jobs)
    wg.Wait()
    close(results)

    for r := range results {
        fmt.Println(r)
    }
}`,
      output: '1\n4\n9',
      explain: 'Closing jobs ends the range in every worker; WaitGroup tells main when all workers have finished.',
    },
    [
      'Closing a channel from the receiver, which panics if another send happens later.',
      'Launching goroutines in a loop and capturing the loop variable in older Go versions, so every goroutine sees the last value.',
    ],
    {
      prompt: 'Run three goroutines that each square a number and print the results, then run the same program with -race.',
      steps: ['Use a buffered channel or a WaitGroup.', 'Run go run -race main.go.', 'Fix anything the race detector reports.'],
    },
    [
      'Goroutines are cheap; coordination is the real work.',
      'Channels transfer ownership and synchronise access.',
      'The race detector finds unsynchronised access in tests and at runtime.',
    ],
    [
      q('What happens when you send on an unbuffered channel with no receiver?',
        'The sender blocks until a receiver is ready',
        ['The value is dropped', 'The program panics immediately', 'The channel buffers it'],
        'Unbuffered sends are synchronous with a matching receive.'),
      q('Who should close a channel?',
        'The goroutine that sends on it',
        ['The goroutine that receives from it', 'Any goroutine', 'The garbage collector'],
        'Closing signals "no more values", which only the sender knows.'),
    ],
  ),

  context: t(
    'Context carries cancellation, deadlines and request-scoped values across API boundaries. This lesson covers the rules that keep cancellation predictable.',
    ['create a context with a timeout and cancel it', 'pass context as the first parameter', 'propagate cancellation into database and HTTP calls'],
    [
      ['Cancellation is cooperative', 'Cancelling a context closes its Done channel; code that respects it returns early. A database query or HTTP request that receives the context stops when it is cancelled. Work that ignores the context keeps running, so every blocking call in a request path should accept one.'],
      ['Values are for request scope', 'context.WithValue is for data that crosses API boundaries in one request, such as a trace id or an authenticated user id. It is not a configuration mechanism and not a substitute for function parameters, because the type is erased and the key must be unexported to avoid collisions.'],
    ],
    {
      lang: 'go',
      code: `package main

import (
    "context"
    "fmt"
    "time"
)

func slowWork(ctx context.Context) error {
    select {
    case <-time.After(2 * time.Second):
        return nil
    case <-ctx.Done():
        return ctx.Err()
    }
}

func main() {
    ctx, cancel := context.WithTimeout(context.Background(), 100*time.Millisecond)
    defer cancel()

    if err := slowWork(ctx); err != nil {
        fmt.Println("stopped:", err)
    }
}`,
      output: 'stopped: context deadline exceeded',
      explain: 'select waits for whichever happens first, so the timeout wins over the two-second work.',
    },
    [
      'Storing a context in a struct instead of passing it as the first argument.',
      'Forgetting the cancel function, which leaks the timer until the deadline.',
    ],
    {
      prompt: 'Add a 200 ms timeout to a function that sleeps for a second and return the context error.',
      steps: ['Accept ctx as the first parameter.', 'Use select on ctx.Done().', 'Call cancel with defer in the caller.'],
    },
    [
      'Context carries cancellation and deadlines, not configuration.',
      'Always pass it as the first parameter and always call cancel.',
      'Cooperative cancellation only works if blocking calls receive the context.',
    ],
    [
      q('What does cancelling a context actually do?',
        'Closes its Done channel so waiting code can return',
        ['Kills the goroutine immediately', 'Rolls back a transaction', 'Restarts the process'],
        'Cancellation is cooperative; the code must observe Done or the error.'),
      q('What belongs in context.WithValue?',
        'Request-scoped data such as a trace id',
        ['Database credentials', 'Application configuration', 'Function arguments'],
        'Use explicit parameters for anything that is not request metadata.'),
    ],
  ),

  http: t(
    'The standard library includes a production-ready HTTP server and client. This lesson builds a JSON API with routing, middleware and graceful shutdown.',
    ['serve JSON from net/http handlers', 'write middleware as a handler wrapper', 'shut down cleanly on a signal'],
    [
      ['Handlers are functions', 'A handler is anything with ServeHTTP(w, r), and http.HandlerFunc adapts a plain function. Middleware is a function that takes a handler and returns a handler, so logging, recovery and authentication compose by wrapping. Since Go 1.22 the default mux supports method and path patterns such as "GET /courses/{id}".'],
      ['Graceful shutdown', 'http.Server.Shutdown stops accepting connections and waits for in-flight requests to finish. Wire it to SIGINT and SIGTERM, give it a timeout, and close the database pool afterwards. Without this, a deploy drops requests mid-response.'],
    ],
    {
      lang: 'go',
      code: `package main

import (
    "encoding/json"
    "log"
    "net/http"
)

type Course struct {
    ID    string \`json:"id"\`
    Title string \`json:"title"\`
}

func courses(w http.ResponseWriter, r *http.Request) {
    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode([]Course{{ID: "go", Title: "Go Programming"}})
}

func logging(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        log.Println(r.Method, r.URL.Path)
        next.ServeHTTP(w, r)
    })
}

func main() {
    mux := http.NewServeMux()
    mux.HandleFunc("GET /api/courses", courses)
    log.Fatal(http.ListenAndServe(":8080", logging(mux)))
}`,
      output: 'GET /api/courses\n[{"id":"go","title":"Go Programming"}]',
      explain: 'The middleware wraps the mux, so every route gets the same logging without repeating it.',
    },
    [
      'Writing a response after a write error has already occurred, which produces a superfluous WriteHeader log.',
      'Starting the server with http.ListenAndServe inside a goroutine and never handling its error.',
    ],
    {
      prompt: 'Add a /api/health route and a recovery middleware that returns 500 instead of crashing.',
      steps: ['Register the route on the mux.', 'Wrap the mux with a recover middleware.', 'Trigger a panic in a test handler and confirm the server survives.'],
    },
    [
      'net/http is enough for most JSON APIs.',
      'Middleware composes by wrapping handlers.',
      'Graceful shutdown is part of running a server, not an extra.',
    ],
    [
      q('What is an http.Handler?',
        'Any type with a ServeHTTP method',
        ['A function that returns JSON', 'A struct tagged with http', 'A route string'],
        'HandlerFunc adapts ordinary functions to that interface.'),
      q('What does Server.Shutdown do?',
        'Stops accepting connections and waits for active requests to finish',
        ['Kills all goroutines immediately', 'Closes the database', 'Restarts the listener'],
        'It is the basis of zero-downtime deploys.'),
    ],
  ),

  database: t(
    'Go talks to SQL databases through database/sql and a driver. This lesson covers connection pooling, parameterised queries and scanning rows safely.',
    ['open a pool and configure it', 'use placeholders to prevent injection', 'scan rows and handle sql.ErrNoRows'],
    [
      ['A pool, not a connection', 'sql.Open returns a pool, not a single connection. Set MaxOpenConns, MaxIdleConns and ConnMaxLifetime so the pool matches the database\'s limits. Every query borrows a connection and returns it, so forgetting to close rows leaks connections until requests hang.'],
      ['Placeholders, always', 'Use ? or $1 placeholders and pass values separately. String concatenation produces SQL injection and also defeats statement caching. db.QueryRow returns sql.ErrNoRows when nothing matches, which is a normal case, not an exception.'],
    ],
    {
      lang: 'go',
      code: `package main

import (
    "context"
    "database/sql"
    "errors"
    "fmt"

    _ "github.com/lib/pq"
)

func title(ctx context.Context, db *sql.DB, id string) (string, error) {
    var name string
    err := db.QueryRowContext(ctx,
        "SELECT title FROM courses WHERE id = $1", id).Scan(&name)
    if errors.Is(err, sql.ErrNoRows) {
        return "", fmt.Errorf("course %s: not found", id)
    }
    return name, err
}`,
      output: 'Go Programming',
      explain: 'QueryRowContext passes the request context, so a cancelled request cancels the query.',
    },
    [
      'Building SQL with fmt.Sprintf and user input.',
      'Forgetting defer rows.Close(), which exhausts the pool under load.',
    ],
    {
      prompt: 'Write a query that returns a list of courses and scan it into a slice, closing rows correctly.',
      steps: ['Use QueryContext.', 'defer rows.Close().', 'Loop with rows.Next and check rows.Err afterwards.'],
    },
    [
      'database/sql manages a pool of connections.',
      'Always use placeholders and pass arguments separately.',
      'sql.ErrNoRows is an expected outcome, not a failure.',
    ],
    [
      q('Why use placeholders instead of concatenating values into SQL?',
        'They prevent injection and allow statement reuse',
        ['They run faster on the client', 'They avoid transactions', 'They encrypt the query'],
        'Values are sent separately from the statement text.'),
      q('What must you do after iterating rows?',
        'Close the rows and check rows.Err',
        ['Call db.Close', 'Restart the pool', 'Commit a transaction'],
        'Unclosed rows hold a connection and skip late errors.'),
    ],
  ),

  testing: t(
    'Go ships a testing framework and a benchmark runner. This lesson writes table-driven tests, subtests and benchmarks, and explains what to test.',
    ['write table-driven tests with t.Run', 'compare results without external assertion libraries', 'benchmark a function and interpret ns/op'],
    [
      ['Table-driven by convention', 'Define a slice of cases with a name and inputs, loop over them and call t.Run. Failures are reported per case, and adding a case is one line. This is the dominant style in the standard library because it keeps the test body small and the cases readable.'],
      ['Test behaviour, not lines', 'Aim at exported behaviour: given this input, the function returns this output or this error. Use httptest for handlers and a real database or a transaction rollback for storage. Coverage is a signal, not a target; a hundred assertions on getters prove very little.'],
    ],
    {
      lang: 'go',
      code: `package calc

import "testing"

func Add(a, b int) int { return a + b }

func TestAdd(t *testing.T) {
    cases := []struct {
        name string
        a, b int
        want int
    }{
        {"positive", 2, 3, 5},
        {"negative", -2, -3, -5},
        {"zero", 0, 7, 7},
    }

    for _, tc := range cases {
        t.Run(tc.name, func(t *testing.T) {
            if got := Add(tc.a, tc.b); got != tc.want {
                t.Fatalf("Add(%d, %d) = %d, want %d", tc.a, tc.b, got, tc.want)
            }
        })
    }
}`,
      output: 'PASS\nok  example.com/calc  0.002s',
      explain: 'Each case runs as a named subtest, so a failure names the exact scenario.',
    },
    [
      'Testing only the happy path and never the error branch.',
      'Using t.Fatal inside a goroutine, which does not stop the test properly.',
    ],
    {
      prompt: 'Write a table-driven test for a function that validates an email address, including two invalid cases.',
      steps: ['Create the cases slice.', 'Run each case with t.Run.', 'Assert both the result and the error.'],
    },
    [
      'go test runs the suite; -race adds the race detector.',
      'Table-driven tests keep cases compact and readable.',
      'Benchmarks report ns/op and allocations per operation.',
    ],
    [
      q('Why use t.Run inside a table-driven test?',
        'It creates a named subtest so failures identify the case',
        ['It makes the test run in parallel automatically', 'It skips the case', 'It compiles faster'],
        'Named subtests also allow running a single case with -run.'),
      q('What does the -race flag do?',
        'Enables the data race detector during the test run',
        ['Runs tests in parallel', 'Skips slow tests', 'Reports coverage'],
        'It detects unsynchronised memory access, at a runtime cost.'),
    ],
  ),

  observability: t(
    'A service you cannot see inside is a service you cannot operate. This lesson covers structured logging, request ids and the metrics that reveal problems.',
    ['emit structured logs with slog', 'attach a request id to every log line', 'choose metrics that reflect user experience'],
    [
      ['Logs as events', 'log/slog emits key-value records that a log platform can index. Log at the boundary of the request: method, path, status, duration and request id. Never log passwords, tokens or full request bodies, and do not log the same error at every layer, which multiplies noise without adding information.'],
      ['Metrics and traces', 'Counters for requests and errors, and a histogram for latency, answer "how much" and "how slow". A trace follows one request across services and shows which span is responsible for the delay. Alert on p95 latency and error rate rather than CPU, because CPU can be idle while users wait on a lock.'],
    ],
    {
      lang: 'go',
      code: `package main

import (
    "log/slog"
    "net/http"
    "time"
)

func withLogging(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        start := time.Now()
        next.ServeHTTP(w, r)
        slog.Info("request",
            "method", r.Method,
            "path", r.URL.Path,
            "duration_ms", time.Since(start).Milliseconds(),
        )
    })
}`,
      output: 'level=INFO msg=request method=GET path=/api/courses duration_ms=12',
      explain: 'Key-value pairs stay machine-readable, unlike a formatted sentence.',
    },
    [
      'Logging a full request body, which leaks credentials into log storage.',
      'Alerting on CPU alone while latency climbs because of a slow query.',
    ],
    {
      prompt: 'Add request logging to a handler and include a generated request id that is also returned in a header.',
      steps: ['Generate an id per request.', 'Add it to the log record and the response header.', 'Confirm two concurrent requests have different ids.'],
    },
    [
      'Structured logs are searchable; formatted sentences are not.',
      'Log once, at the boundary, with enough context to debug.',
      'Latency and error rate describe user experience better than host metrics.',
    ],
    [
      q('Why prefer structured logging over formatted strings?',
        'Fields can be indexed and filtered by the log platform',
        ['It uses less memory', 'It hides sensitive data automatically', 'It compresses better'],
        'Key-value records are queryable without parsing prose.'),
      q('Which metric best shows a degrading service?',
        'p95 request latency',
        ['Total disk size', 'Number of source files', 'Container count'],
        'Percentile latency reflects what users actually experience.'),
    ],
  ),

  deployment: t(
    'A Go binary is static by default, which makes deployment simple: build once, copy one file, run it. This lesson covers cross-compilation, containers and configuration.',
    ['cross-compile for Linux from any machine', 'ship a minimal container image', 'read configuration from the environment'],
    [
      ['One binary, no runtime', 'CGO_ENABLED=0 produces a statically linked binary that needs no libc on the target. GOOS and GOARCH select the platform, so a laptop can build the Linux amd64 artefact for the server. The binary can run in a scratch container, which removes the shell and package manager an attacker would use.'],
      ['Configuration at run time', 'Read settings from environment variables with os.Getenv or a small config struct validated at startup. Fail fast with a clear message when a required value is missing. Never bake secrets into the binary; they are trivially extractable with strings.'],
    ],
    {
      lang: 'go',
      code: `# Build a static Linux binary from macOS or Windows
CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -trimpath -ldflags="-s -w" -o api ./cmd/api

# A minimal runtime image
FROM gcr.io/distroless/static-debian12
COPY api /api
EXPOSE 8080
ENTRYPOINT ["/api"]
# Result: a ~10 MB image with no shell`,
      output: 'api: ELF 64-bit LSB executable, statically linked',
      explain: '-trimpath removes local paths and -s -w strips debug symbols, shrinking the binary.',
    },
    [
      'Building on the server with a different Go version from CI, so the artefact is not reproducible.',
      'Using a full base image when the binary is static and needs nothing else.',
    ],
    {
      prompt: 'Cross-compile a Linux binary, copy it into a distroless image and run it locally.',
      steps: ['Set CGO_ENABLED=0 and GOOS=linux.', 'Write the two-line Dockerfile.', 'Build and run the container, then curl the health route.'],
    },
    [
      'Static binaries remove most deployment dependencies.',
      'Cross-compilation is a flag, not a CI job.',
      'Configuration comes from the environment and is validated at startup.',
    ],
    [
      q('What does CGO_ENABLED=0 produce?',
        'A statically linked binary with no C library dependency',
        ['A smaller source tree', 'A debug build', 'A Windows executable'],
        'That is what allows a scratch or distroless image.'),
      q('Why validate configuration at startup?',
        'A missing value fails immediately with a clear message instead of at the first request',
        ['It makes the binary smaller', 'It avoids environment variables', 'It enables HTTPS'],
        'Fail-fast startup is easier to diagnose than a runtime error under load.'),
    ],
  ),

  capstone: t(
    'The capstone combines everything into one service: a JSON API over a database, with tests, structured logs, graceful shutdown and a container image. This lesson describes the build order and the definition of done.',
    ['plan a service from schema to deployment', 'separate transport, domain and storage packages', 'define the acceptance checks for a finished project'],
    [
      ['Build it in vertical slices', 'Start with one route that reads one row end to end: handler, store, query, test. Once that slice works, add the next. Vertical slices keep the program runnable at every step and surface integration problems early, unlike building all the storage code before any handler exists.'],
      ['Definition of done', 'The service is done when a new developer can start it with one command, the tests run without a network, the health route reports readiness, logs are structured, configuration is documented, and the container image starts with no shell. Write these down before you start; they are the difference between a demo and a project.'],
    ],
    {
      lang: 'bash',
      code: `# The acceptance run for the capstone
go vet ./...
go test ./... -race -cover

docker build -t capstone:1.0 .
docker run --rm -p 8080:8080 --env-file .env capstone:1.0

curl -s localhost:8080/api/health/ready
# {"status":"ready"}

curl -s -X POST localhost:8080/api/courses \\
  -H 'Content-Type: application/json' \\
  -d '{"title":"Go","lessons":16}'
# {"id":"...","title":"Go","lessons":16}`,
      output: '{"status":"ready"}',
      explain: 'Every line is a check a reviewer can run without reading the code.',
    },
    [
      'Leaving the capstone until the last week and discovering the pieces do not integrate.',
      'Treating "it runs on my machine" as the definition of done.',
    ],
    {
      prompt: 'Write the acceptance checklist for your capstone, then implement the smallest slice that satisfies the first item.',
      steps: ['List the commands a reviewer will run.', 'Implement one route end to end.', 'Add the test that proves it.'],
    },
    [
      'Vertical slices keep the service runnable throughout.',
      'Package boundaries follow the dependency direction.',
      'A written definition of done prevents an unfinished project.',
    ],
    [
      q('Why build in vertical slices?',
        'Each slice is runnable and testable, so integration problems surface early',
        ['It produces fewer files', 'It avoids writing tests', 'It removes the need for a database'],
        'A thin end-to-end path proves the architecture before it grows.'),
      q('Which item belongs in a definition of done?',
        'A documented, reproducible way to start the service',
        ['A logo', 'A marketing page', 'A second database'],
        'Reproducibility is what makes the project reviewable.'),
    ],
  ),
};

module.exports = {
  slug: 'go-programming',
  title: 'Go Programming for Engineers',
  shortDescription:
    'Learn Go the way production teams use it: explicit errors, small interfaces, real concurrency and a deployable service.',
  description:
    'A practical Go course for developers coming from another language. You will work through the toolchain, types, structs and interfaces, error handling, packages, goroutines and channels, context, HTTP services and database access, then test, observe, containerise and ship a complete API. Each module ends with a ten-question quiz and every lesson includes a runnable example.',
  level: 'Intermediate',
  price: 94.99,
  duration: '8 weeks',
  featured: false,
  outcomes: [
    'Write idiomatic Go with explicit error handling',
    'Model data with structs, methods and embedding',
    'Design small interfaces that decouple packages',
    'Run concurrent work safely with goroutines and channels',
    'Cancel work correctly with context',
    'Build and test a JSON HTTP API',
    'Query a SQL database with a connection pool',
    'Ship a static binary in a minimal container',
  ],
  requirements: [
    'Comfort with another programming language',
    'Basic familiarity with HTTP and JSON',
    'A terminal and a code editor',
  ],
  targetAudience:
    'Backend developers moving to Go, and engineers who need to read and maintain Go services.',
  modules: [
    {
      title: 'Module 1: The language and its toolchain',
      description: 'Install Go, learn the type system and control flow, and write functions that return errors.',
      check: [
        q('Why does Go treat an unused local variable as a compile error?',
          'Unused variables usually indicate a mistake, and the compiler can catch it cheaply',
          ['It reduces binary size', 'It speeds up the garbage collector', 'It is required by the module system'],
          'The compiler enforces cleanliness that other languages leave to linters.'),
        q('What is the idiomatic way to report a failure that the caller can handle?',
          'Return an error as the last return value',
          ['Panic with a message', 'Log and return nil', 'Set a global error variable'],
          'Errors are values; panics are for unrecoverable bugs.'),
      ],
      lessons: [
        { title: 'Installing Go and creating a module', objective: 'Install the toolchain, create a module and run a program.', topic: 'toolchain', minutes: 20 },
        { title: 'Values, types and zero values', objective: 'Declare variables and convert between types explicitly.', topic: 'values', minutes: 25 },
        { title: 'Control flow with if, for and switch', objective: 'Write loops and conditionals the Go way.', topic: 'control', minutes: 25 },
        { title: 'Functions, multiple returns and defer', objective: 'Return values and errors, and guarantee cleanup.', topic: 'functions', minutes: 30 },
      ],
    },
    {
      title: 'Module 2: Structuring a Go program',
      description: 'Compose behaviour with structs and interfaces, handle errors with context, and organise packages.',
      check: [
        q('A method must update a struct field. Which receiver should it use?',
          'A pointer receiver',
          ['A value receiver', 'A variadic receiver', 'No receiver'],
          'A value receiver mutates a copy.'),
        q('Where should an interface be declared?',
          'In the package that consumes the behaviour',
          ['Always next to the implementation', 'In a global interfaces package', 'In main'],
          'Consumer-side interfaces stay narrow and avoid import cycles.'),
      ],
      lessons: [
        { title: 'Structs, methods and embedding', objective: 'Model data and attach behaviour without classes.', topic: 'structs', minutes: 30 },
        { title: 'Interfaces and composition', objective: 'Decouple code with small, implicitly satisfied interfaces.', topic: 'interfaces', minutes: 30 },
        { title: 'Errors, wrapping and inspection', objective: 'Add context to failures and match them with errors.Is.', topic: 'errors', minutes: 25 },
        { title: 'Packages, modules and internal', objective: 'Split a service into packages with a clean dependency direction.', topic: 'packages', minutes: 25 },
      ],
    },
    {
      title: 'Module 3: Concurrency and services',
      description: 'Run work concurrently, cancel it correctly and expose the result over HTTP and SQL.',
      check: [
        q('A request is cancelled while a database query is running. What makes the query stop?',
          'Passing the request context into QueryContext',
          ['Closing the database pool', 'Logging the error', 'Restarting the server'],
          'Cancellation is cooperative and must reach the blocking call.'),
        q('Which goroutine should close a channel?',
          'The one that sends on it',
          ['The one that receives from it', 'Any goroutine', 'The garbage collector'],
          'Only the sender knows when no more values will be sent.'),
      ],
      lessons: [
        { title: 'Goroutines, channels and the race detector', objective: 'Coordinate concurrent work without data races.', topic: 'concurrency', minutes: 35 },
        { title: 'Cancellation and deadlines with context', objective: 'Propagate cancellation through a request path.', topic: 'context', minutes: 25 },
        { title: 'Building a JSON API with net/http', objective: 'Serve JSON, compose middleware and shut down gracefully.', topic: 'http', minutes: 35 },
        { title: 'Database access with database/sql', objective: 'Use a connection pool and parameterised queries safely.', topic: 'database', minutes: 30 },
      ],
    },
    {
      title: 'Module 4: Testing, observing and shipping',
      description: 'Prove the service works, see it in production and deploy it as a single binary.',
      check: [
        q('What does go test -race add to a normal test run?',
          'Detection of unsynchronised memory access',
          ['Parallel execution of every test', 'Coverage reporting', 'Automatic retries'],
          'The race detector finds data races that may pass silently otherwise.'),
        q('Why is a distroless image a good fit for a static Go binary?',
          'The binary needs no shell or system libraries, so the image can contain almost nothing',
          ['It makes the binary run faster', 'It enables cgo', 'It provides a package manager'],
          'Fewer components mean a smaller attack surface.'),
      ],
      lessons: [
        { title: 'Table-driven tests and benchmarks', objective: 'Write readable tests that cover failure paths.', topic: 'testing', minutes: 30 },
        { title: 'Structured logs and useful metrics', objective: 'Make a running service observable.', topic: 'observability', minutes: 25 },
        { title: 'Static binaries and container deployment', objective: 'Cross-compile and ship a minimal image.', topic: 'deployment', minutes: 25 },
        { title: 'Capstone: a complete Go service', objective: 'Combine the course into one reviewable project.', topic: 'capstone', minutes: 45 },
      ],
    },
  ],
  topics,
};

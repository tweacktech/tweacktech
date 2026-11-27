/**
 * DevOps Essentials: Docker & Kubernetes
 *
 * Curriculum follows the order a working engineer needs it: what a container
 * actually is, then building and shipping an image, then orchestrating those
 * images, then operating them in production.
 */

const q = (prompt, correct, wrong, explanation) => ({ prompt, correct, wrong, explanation });

const topics = {
  'why-containers': {
    lead: 'A container packages an application together with everything it needs to run, so the same image behaves identically on a laptop, in CI and on a server. This lesson explains the problem containers solve before you touch any tooling.',
    objectives: [
      'Explain the difference between a virtual machine and a container',
      'Describe what an image and a container are, and how they relate',
      'Recognise the deployment problems containers remove',
    ],
    sections: [
      [
        'The problem: it works on my machine',
        'An application depends on a language runtime, system libraries, environment variables and file paths. Install it on another machine and any one of those can differ, so the program fails for reasons unrelated to your code. A virtual machine solves this by shipping a whole operating system, which is reliable but heavy: gigabytes of disk and a slow boot. A container shares the host kernel and isolates only the process, so it starts in milliseconds and still carries its own filesystem and dependencies.',
      ],
      [
        'Images and containers',
        'An image is a read-only template: a filesystem plus metadata such as the command to run. A container is a running instance of that image, with a thin writable layer on top. You build an image once, push it to a registry, and every environment pulls the same bytes. That is the whole idea behind reproducible deployments.',
      ],
    ],
    example: {
      label: 'The same command, two very different isolation levels',
      code: `# A container runs a process on the host kernel
docker run --rm alpine:3.20 uname -a
# Linux ... (host kernel version)

# A virtual machine boots its own kernel
# (provisioning takes seconds to minutes, image is GBs)`,
      output: 'Linux 6.8.0 ... x86_64 Linux',
      explain: 'Containers are processes with namespaces and cgroups around them, not small virtual machines. That is why they start fast.',
    },
    mistakes: [
      'Treating a container as a lightweight VM and expecting systemd, cron or a full init system inside it.',
      'Installing packages at runtime instead of building them into the image, which makes deployments unreproducible.',
    ],
    practice: {
      prompt: 'Write down three dependencies of an app you have deployed, then note which of them a container image would fix permanently.',
      steps: ['List runtime version, system libraries and environment variables.', 'Mark which ones differ between your machine and production.', 'Explain how baking them into an image removes the difference.'],
    },
    summary: [
      'Containers isolate a process while sharing the host kernel.',
      'An image is the immutable template; a container is a running instance.',
      'The same image can be deployed to every environment unchanged.',
    ],
    questions: [
      q('What does a container share with the host that a virtual machine does not?',
        'The operating system kernel',
        ['The application source code', 'The network password', 'The container registry'],
        'Containers use kernel namespaces and cgroups, so they do not boot a separate kernel.'),
      q('Which statement describes an image?',
        'A read-only template used to start containers',
        ['A running process with a writable filesystem', 'A virtual machine disk', 'A registry account'],
        'Containers are created from images; the image itself does not change when a container runs.'),
    ],
  },

  'images-layers': {
    lead: 'An image is built from layers, and understanding those layers explains why builds are fast or slow and why an image is small or enormous. This lesson covers layer caching and how registries store images.',
    objectives: [
      'Describe how image layers are created and reused',
      'Predict when a Docker build will reuse a cached layer',
      'Explain what a registry stores and why tags matter',
    ],
    sections: [
      [
        'One instruction, one layer',
        'Each Dockerfile instruction that changes the filesystem creates a layer. Layers are content-addressed and immutable, so an unchanged layer is reused from cache instead of being rebuilt. This is why copying package manifests and installing dependencies before copying source code makes rebuilds fast: the dependency layer stays cached when only source files change.',
      ],
      [
        'Tags are pointers, not versions',
        'A tag such as node:22 is a mutable label pointing at a digest. If the publisher moves the tag, your next pull gets different bytes. Pinning the digest, node:22@sha256:..., makes a build reproducible. In a registry, layers are deduplicated across tags, so ten versions of an app that share a base image do not store that base ten times.',
      ],
    ],
    example: {
      label: 'A Dockerfile ordered for caching',
      code: `FROM node:22-alpine
WORKDIR /app

# Dependencies change less often than source, so install them first.
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# Source changes constantly and invalidates only the layers below it.
COPY . .
CMD ["node", "server.js"]`,
      output: 'Step 4/6 : RUN npm ci --omit=dev  ---> Using cache',
      explain: 'On the second build, the dependency layer reports "Using cache" because package.json did not change.',
    },
    mistakes: [
      'Running COPY . . before installing dependencies, which invalidates the dependency cache on every code change.',
      'Using the :latest tag in production, where it silently changes under you.',
    ],
    practice: {
      prompt: 'Take a Dockerfile you have written and reorder it so dependencies install before source is copied. Rebuild twice and compare the timing.',
      steps: ['Copy only the manifest files first.', 'Install dependencies in a dedicated RUN step.', 'Copy the source last and rebuild to observe the cache hit.'],
    },
    summary: [
      'Each filesystem-changing instruction adds a cached layer.',
      'Layer order determines how much of a rebuild is cached.',
      'Tags move; digests do not. Pin digests for reproducible builds.',
    ],
    questions: [
      q('Why should package manifests be copied before the rest of the source?',
        'So the dependency install layer stays cached when only source changes',
        ['Because npm requires it', 'To make the image larger', 'Because COPY only works once'],
        'Cache invalidation cascades downward, so stable inputs belong higher in the file.'),
      q('What is the difference between a tag and a digest?',
        'A tag is a movable label; a digest identifies exact content',
        ['A tag is encrypted; a digest is plain text', 'A digest is shorter than a tag', 'They are identical'],
        'Tags can be repointed, digests cannot, which is why pinning matters.'),
    ],
  },

  'first-dockerfile': {
    lead: 'A Dockerfile is a short, ordered recipe for building an image. This lesson writes one from scratch and explains each instruction, then builds and runs it.',
    objectives: [
      'Write a Dockerfile for a Node.js service',
      'Explain FROM, WORKDIR, COPY, RUN, EXPOSE and CMD',
      'Build and run the image locally',
    ],
    sections: [
      [
        'The instructions that matter',
        'FROM chooses the base image. WORKDIR sets the working directory for later instructions. COPY moves files from the build context into the image. RUN executes a command during the build. EXPOSE documents the port (it does not publish it). CMD is the default command when a container starts. Only RUN and COPY change the filesystem and create layers.',
      ],
      [
        'Build context and .dockerignore',
        'The build context is the directory sent to the daemon. If it contains node_modules or a multi-gigabyte data folder, every build uploads it. A .dockerignore file listing node_modules, .git, dist, coverage and local env files keeps builds fast and prevents secrets from entering the image.',
      ],
    ],
    example: {
      label: 'Build and run a service',
      code: `docker build -t tweack-api:1.0 .
docker run --rm -p 5001:5001 -e NODE_ENV=production tweack-api:1.0
# Server listening on http://0.0.0.0:5001`,
      output: 'Server listening on http://0.0.0.0:5001',
      explain: 'The -p flag maps host port 5001 to container port 5001; -e passes an environment variable without baking it into the image.',
    },
    mistakes: [
      'Binding the app to 127.0.0.1 inside the container, so the published port never reaches it.',
      'Copying .env into the image; environment variables belong in the runtime configuration.',
    ],
    practice: {
      prompt: 'Write a Dockerfile for a small HTTP service, build it, and run it on a published port.',
      steps: ['Start from a slim base image.', 'Copy manifests, install, then copy source.', 'Expose the port and set CMD.', 'Run it and curl the health endpoint.'],
    },
    summary: [
      'Dockerfiles are ordered instructions that produce layers.',
      'EXPOSE documents a port; -p publishes it.',
      'A .dockerignore keeps the build context small and secret-free.',
    ],
    questions: [
      q('What does EXPOSE actually do?',
        'Documents the intended port; it does not publish it',
        ['Publishes the port to the host', 'Opens the firewall', 'Starts a reverse proxy'],
        'Publishing happens at run time with -p or in Compose.'),
      q('Which file keeps node_modules and .env out of the build context?',
        '.dockerignore',
        ['package.json', 'docker-compose.yml', '.gitignore'],
        'The build context is filtered by .dockerignore, not .gitignore.'),
    ],
  },

  'run-containers': {
    lead: 'Running a container is more than docker run. You need to see logs, inspect state, open a shell and clean up. This lesson covers the commands you will use every day.',
    objectives: [
      'Run a container in the background and read its logs',
      'Inspect a running container and open an interactive shell',
      'Remove containers, images and volumes deliberately',
    ],
    sections: [
      [
        'Foreground, background and logs',
        'docker run --rm runs a container and deletes it on exit. Adding -d detaches it, and docker logs -f follows output. Name containers with --name so you do not have to copy random ids. docker ps lists running containers; docker ps -a includes stopped ones, which is where most "missing container" confusion comes from.',
      ],
      [
        'Getting inside and cleaning up',
        'docker exec -it <name> sh opens a shell in a running container, which is the right way to inspect a live process. docker inspect prints the full JSON state, including the resolved environment and mounts. Cleanup is deliberate: docker rm removes containers, docker rmi removes images, and docker volume prune removes data that no container references.',
      ],
    ],
    example: {
      label: 'A normal debugging session',
      code: `docker run -d --name api -p 5001:5001 tweack-api:1.0
docker logs -f api
docker exec -it api sh -c 'printenv NODE_ENV'
docker inspect --format '{{.State.Status}}' api`,
      output: 'running',
      explain: 'The --format flag pulls a single field out of inspect, which is far easier to read in a script than the full JSON.',
    },
    mistakes: [
      'Editing files inside a running container and expecting the change to survive a restart.',
      'Running docker system prune -a on a machine with volumes you still need.',
    ],
    practice: {
      prompt: 'Start a container in the background, read its logs, open a shell, then remove it and confirm it is gone.',
      steps: ['Run with -d and --name.', 'Follow the logs.', 'Exec into it.', 'Remove it and check docker ps -a.'],
    },
    summary: [
      'Use -d plus logs for background services.',
      'exec opens a shell in a running container; it never changes the image.',
      'Containers are disposable, so state belongs in volumes.',
    ],
    questions: [
      q('Which command shows containers that have stopped?',
        'docker ps -a',
        ['docker ps', 'docker images', 'docker logs'],
        'docker ps lists only running containers; -a includes stopped ones.'),
      q('Where should data that must survive a container restart live?',
        'In a named volume or a bind mount',
        ['In the container writable layer', 'In an environment variable', 'In the image'],
        'The writable layer is deleted with the container; volumes persist.'),
    ],
  },

  'multi-stage': {
    lead: 'A build stage needs compilers and dev dependencies; the running container does not. A multi-stage build separates the two so the final image carries only what production needs.',
    objectives: [
      'Explain why build and runtime stages are separated',
      'Write a two-stage Dockerfile',
      'Copy only the build output into the runtime image',
    ],
    sections: [
      [
        'Two stages, two purposes',
        'The first stage starts from a full image, installs dev dependencies and compiles the application. The second stage starts from a slim runtime image and copies only the compiled output and production dependencies from the first. Nothing else crosses the boundary, so compilers, test frameworks and source maps never reach production.',
      ],
      [
        'The numbers that matter',
        'A naive Node image that installs dev dependencies and copies the source is often 900 MB to 1.2 GB. A two-stage build with a slim base and production dependencies typically lands between 120 MB and 250 MB. Smaller images pull faster, start faster and expose a smaller attack surface.',
      ],
    ],
    example: {
      label: 'Build once, ship the output',
      code: `FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=build /app/dist ./dist
USER node
CMD ["node", "dist/main.js"]`,
      output: 'Successfully built ...  187MB',
      explain: 'Only dist and production dependencies exist in the runtime stage, so the image stays small.',
    },
    mistakes: [
      'Copying the whole build stage with COPY --from=build /app ./, which drags source and dev dependencies back in.',
      'Forgetting USER node, so the process runs as root.',
    ],
    practice: {
      prompt: 'Convert a single-stage Dockerfile into two stages and compare the image size before and after.',
      steps: ['Name the first stage build.', 'Compile in that stage.', 'Start a fresh runtime stage and copy only the output.'],
    },
    summary: [
      'Build stages and runtime stages have different needs.',
      'COPY --from copies only the artefacts you name.',
      'Smaller images deploy faster and are safer.',
    ],
    questions: [
      q('What does COPY --from=build do?',
        'Copies files from an earlier build stage into the current image',
        ['Rebuilds the first stage', 'Copies files from the host', 'Copies the whole filesystem'],
        'It copies only the named paths, which is what keeps the image small.'),
      q('Why run the container as a non-root user?',
        'A compromised process then has fewer privileges on the host',
        ['It makes the image smaller', 'It speeds up builds', 'It is required by Docker'],
        'Least privilege limits the damage a compromised process can do.'),
    ],
  },

  'docker-cache': {
    lead: 'Build speed is a developer-experience problem with a simple cause: cache invalidation. This lesson shows how to keep the expensive layers valid.',
    objectives: [
      'Identify which instruction invalidates the cache',
      'Use BuildKit cache mounts for package managers',
      'Keep build contexts small',
    ],
    sections: [
      [
        'Invalidation cascades',
        'Docker compares each instruction with the previous build. When one changes, it and every later layer are rebuilt. Copying the whole source tree early is the most common mistake because a one-line edit invalidates dependency installation. Order instructions from least to most frequently changing.',
      ],
      [
        'Cache mounts and contexts',
        'BuildKit adds cache mounts that keep the package manager cache outside the image layer, for example --mount=type=cache,target=/root/.npm. Combined with a .dockerignore that excludes node_modules and build output, a rebuild after a source edit can drop from a minute to a few seconds.',
      ],
    ],
    example: {
      label: 'A cache mount for npm',
      code: `# syntax=docker/dockerfile:1
FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN --mount=type=cache,target=/root/.npm npm ci
COPY . .`,
      output: '=> CACHED [2/5] COPY package*.json ./',
      explain: 'The npm download cache survives between builds, so a clean install does not re-download every package.',
    },
    mistakes: [
      'Copying the repository before installing dependencies.',
      'Letting node_modules into the build context, which can overwrite the container install.',
    ],
    practice: {
      prompt: 'Rebuild an image twice, once after editing a source file. Record the time of each build and explain the difference.',
      steps: ['Build once cold.', 'Change one line of source.', 'Rebuild and compare timings.'],
    },
    summary: [
      'One changed instruction invalidates every later layer.',
      'Put stable inputs first and volatile inputs last.',
      'Cache mounts and a small context make rebuilds fast.',
    ],
    questions: [
      q('Which change invalidates the dependency-install layer?',
        'Editing package.json',
        ['Editing a source file copied afterwards', 'Editing a README', 'Changing a comment in the Dockerfile'],
        'The layer is keyed on its inputs; package.json is one of them.'),
      q('What does a BuildKit cache mount keep?',
        'A directory cached across builds without adding it to the image',
        ['A copy of the image', 'The final output', 'Environment variables'],
        'Cache mounts persist build cache outside the image layers.'),
    ],
  },

  'image-security': {
    lead: 'An image is software you ship, so it needs the same care as code: known vulnerabilities patched, no secrets baked in, and the smallest surface that still works.',
    objectives: [
      'Choose a base image with a smaller attack surface',
      'Scan an image for known vulnerabilities',
      'Keep secrets and build tools out of the final image',
    ],
    sections: [
      [
        'Base images and surface area',
        'A full Debian base includes shells, package managers and utilities an application never calls. Alpine or a distroless image removes most of them. Fewer packages mean fewer CVEs and less for an attacker to use after a compromise. Pin the base by tag and digest so a rebuild is reproducible.',
      ],
      [
        'Scanning and secrets',
        'Scan images in CI with a tool such as Trivy or Grype and fail on high-severity findings with an exception list that expires. Never COPY a .env or an SSH key into an image, because layers are immutable and the file remains recoverable even after a later delete. Pass configuration at run time instead.',
      ],
    ],
    example: {
      label: 'Scan an image before pushing',
      code: `docker build -t tweack-api:1.0 .
trivy image --severity HIGH,CRITICAL --exit-code 1 tweack-api:1.0`,
      output: 'Total: 3 (HIGH: 2, CRITICAL: 1)',
      explain: 'The non-zero exit code fails the pipeline, so a vulnerable image never reaches the registry.',
    },
    mistakes: [
      'Deleting a secret in a later layer and assuming it is gone; it is still in the earlier layer.',
      'Using :latest and never rebuilding, so security patches never arrive.',
    ],
    practice: {
      prompt: 'Scan one of your images and list every HIGH or CRITICAL finding with the package that caused it.',
      steps: ['Run Trivy or Grype against the image.', 'Group findings by package.', 'Decide whether to upgrade, rebuild or accept with a reason.'],
    },
    summary: [
      'Smaller base images have a smaller attack surface.',
      'Scan in CI and fail on high severity.',
      'Secrets never belong in an image layer.',
    ],
    questions: [
      q('Why does deleting a secret in a later Dockerfile layer not remove it?',
        'Earlier layers are immutable and still contain the file',
        ['Docker caches environment variables', 'The secret is copied to the host', 'Deletion is disabled in Docker'],
        'Each layer is a stored filesystem delta; later layers add to it rather than rewriting it.'),
      q('What should happen when a scan finds a critical vulnerability?',
        'The pipeline fails until it is fixed or explicitly accepted',
        ['The image is pushed anyway', 'The scan is disabled', 'The tag is changed'],
        'A gate that does not block is not a gate.'),
    ],
  },

  'push-registry': {
    lead: 'A registry is where images live between build and deploy. This lesson covers tagging, authenticating and pushing an image so another machine can pull exactly the same bytes.',
    objectives: [
      'Tag an image with a registry path and an immutable version',
      'Authenticate to a registry',
      'Push and pull an image, and verify the digest',
    ],
    sections: [
      [
        'Naming controls the destination',
        'An image name is registry/host/namespace/repository:tag. Without a registry prefix Docker Hub is assumed. Tag with both a version and a git commit, for example ghcr.io/acme/api:1.4.2 and ghcr.io/acme/api:sha-9f2c1a, so a deployment can be traced to a commit. Avoid deploying by tag alone in production; record the digest that was deployed.',
      ],
      [
        'Credentials and pull access',
        'docker login stores credentials in the local config, and CI should use a short-lived token scoped to push that repository. Private registries need an image pull secret in Kubernetes, or the node cannot fetch the image. Verify with docker manifest inspect or by pulling by digest.',
      ],
    ],
    example: {
      label: 'Tag, push and confirm the digest',
      code: `docker tag tweack-api:1.0 ghcr.io/acme/tweack-api:1.0.0
docker push ghcr.io/acme/tweack-api:1.0.0
docker inspect --format '{{index .RepoDigests 0}}' ghcr.io/acme/tweack-api:1.0.0`,
      output: 'ghcr.io/acme/tweack-api@sha256:4b1f...',
      explain: 'The digest identifies the exact image content, independent of the tag.',
    },
    mistakes: [
      'Pushing to a public repository by accident because the namespace was omitted.',
      'Deploying by a moving tag, so the running version cannot be identified later.',
    ],
    practice: {
      prompt: 'Push an image to a registry with two tags, then pull it by digest and compare the image id.',
      steps: ['Tag with a version and a commit.', 'Push both tags.', 'Pull by digest and compare docker images output.'],
    },
    summary: [
      'Image names include the registry and namespace.',
      'Tag with a version and a commit for traceability.',
      'Deploy by digest when you need certainty.',
    ],
    questions: [
      q('What does the registry prefix in an image name control?',
        'Where the image is pushed and pulled from',
        ['The image size', 'The base image', 'The build cache location'],
        'Without a prefix Docker Hub is assumed.'),
      q('Why is deploying by digest safer than deploying by tag?',
        'A digest always resolves to the same content',
        ['A digest is shorter', 'A digest is encrypted', 'Tags cannot be pulled in production'],
        'Tags can be repointed; digests cannot.'),
    ],
  },

  'why-orchestration': {
    lead: 'Running one container by hand is easy. Running twenty across several machines, restarting failures and updating without downtime is not. That is the problem an orchestrator solves.',
    objectives: [
      'Explain what a container orchestrator does',
      'Describe the difference between desired state and actual state',
      'Recognise when Kubernetes is and is not the right tool',
    ],
    sections: [
      [
        'Desired state, reconciled',
        'You declare how many replicas should run and which image they use. The orchestrator continuously compares that declaration with reality and creates or removes containers until they match. A crashed container is replaced automatically, and a node failure triggers rescheduling elsewhere. This reconciliation loop is the core idea behind Kubernetes.',
      ],
      [
        'When not to use it',
        'A single small service on one machine is usually better served by Docker Compose and a restart policy. Kubernetes brings a control plane, a learning curve and real operational cost. Adopt it when you need multiple services, horizontal scaling, rolling deployments or self-healing across machines.',
      ],
    ],
    example: {
      label: 'Declaring three replicas',
      code: `apiVersion: apps/v1
kind: Deployment
metadata:
  name: tweack-api
spec:
  replicas: 3
  selector:
    matchLabels:
      app: tweack-api
  template:
    metadata:
      labels:
        app: tweack-api
    spec:
      containers:
        - name: api
          image: ghcr.io/acme/tweack-api:1.0.0`,
      output: 'deployment.apps/tweack-api created',
      explain: 'Deleting a pod triggers the controller to create a replacement so the count returns to three.',
    },
    mistakes: [
      'Running Kubernetes for a single container that Compose would handle.',
      'Editing a running pod instead of the Deployment, so the change disappears on restart.',
    ],
    practice: {
      prompt: 'Write down three operational tasks you currently do by hand, and decide whether an orchestrator would remove each one.',
      steps: ['List restarts, scaling and deploys.', 'Mark which are automatic under Kubernetes.', 'Note the cost you would take on.'],
    },
    summary: [
      'An orchestrator reconciles actual state with desired state.',
      'It provides restarts, scheduling and rolling releases.',
      'It is not free; use it when the scale justifies it.',
    ],
    questions: [
      q('What is the reconciliation loop?',
        'Continuously comparing desired state with actual state and correcting differences',
        ['Restarting the whole cluster nightly', 'A backup schedule', 'A load balancer algorithm'],
        'Controllers watch resources and act until reality matches the declaration.'),
      q('When is Kubernetes a poor fit?',
        'A single small service on one machine',
        ['A platform with many services', 'A team that needs rolling deploys', 'An application that must scale horizontally'],
        'The operational cost outweighs the benefit at that size.'),
    ],
  },

  'k8s-deployments': {
    lead: 'Pods are the smallest deployable unit, but you rarely create them directly. Deployments manage Pods through ReplicaSets so you get self-healing and controlled rollouts.',
    objectives: [
      'Explain the relationship between Pods, ReplicaSets and Deployments',
      'Write a Deployment manifest with labels and probes',
      'Scale a Deployment and inspect its rollout status',
    ],
    sections: [
      [
        'The object hierarchy',
        'A Pod wraps one or more containers that share a network namespace. A ReplicaSet keeps a fixed number of identical Pods running. A Deployment owns ReplicaSets and replaces them when the template changes, which is what makes rolling updates possible. You edit the Deployment; the controller does the rest.',
      ],
      [
        'Labels and probes',
        'Labels are how objects find each other; a Service selects Pods by label, so a mismatch means no traffic. Readiness probes decide when a Pod can receive requests, and liveness probes decide when to restart it. Without a readiness probe, traffic reaches containers that are still starting.',
      ],
    ],
    example: {
      label: 'A Deployment with probes',
      code: `spec:
  replicas: 2
  template:
    spec:
      containers:
        - name: api
          image: ghcr.io/acme/tweack-api:1.0.0
          ports: [{ containerPort: 5001 }]
          readinessProbe:
            httpGet: { path: /api/health, port: 5001 }
            initialDelaySeconds: 5
          livenessProbe:
            httpGet: { path: /api/health, port: 5001 }
            periodSeconds: 20`,
      output: 'deployment "tweack-api" successfully rolled out',
      explain: 'Traffic only reaches a Pod after its readiness probe passes, which removes errors during deploys.',
    },
    mistakes: [
      'A Service selector that does not match the Pod labels, producing an empty endpoint list.',
      'Using the same aggressive path for readiness and liveness, so a slow start causes a restart loop.',
    ],
    practice: {
      prompt: 'Apply a Deployment with two replicas, then delete one Pod and watch it come back.',
      steps: ['Apply the manifest.', 'List the Pods.', 'Delete one and re-list after a few seconds.'],
    },
    summary: [
      'Deployments own ReplicaSets, which own Pods.',
      'Labels connect Services to Pods.',
      'Readiness gates traffic; liveness triggers restarts.',
    ],
    questions: [
      q('Which object should you edit to change the running image?',
        'The Deployment',
        ['A Pod', 'A ReplicaSet', 'A Service'],
        'The Deployment template is the source of truth; edits to Pods are replaced.'),
      q('What does a readiness probe control?',
        'Whether the Pod receives traffic',
        ['Whether the Pod restarts', 'Whether the image pulls', 'How many replicas run'],
        'Only ready Pods are added to a Service endpoint list.'),
    ],
  },

  'k8s-services': {
    lead: 'Pods come and go with new addresses, so clients cannot talk to them directly. A Service provides a stable name and load balancing, and an Ingress exposes HTTP routes to the outside world.',
    objectives: [
      'Choose between ClusterIP, NodePort and LoadBalancer',
      'Write a Service that selects Pods by label',
      'Route external traffic with an Ingress',
    ],
    sections: [
      [
        'Service types',
        'ClusterIP is the default and exposes the Service only inside the cluster, which is what most services should use. NodePort opens a port on every node for simple access. LoadBalancer asks the cloud provider for an external load balancer. Ingress sits in front of ClusterIP Services and routes by host and path through an ingress controller.',
      ],
      [
        'What actually happens to a request',
        'The Service has its own virtual IP. kube-proxy programs rules so traffic to that IP is distributed across ready Pods. If the selector matches nothing, the endpoint list is empty and connections fail, which is the most common Service bug. Check endpoints before debugging anything else.',
      ],
    ],
    example: {
      label: 'A Service and an Ingress route',
      code: `apiVersion: v1
kind: Service
metadata:
  name: tweack-api
spec:
  selector:
    app: tweack-api
  ports:
    - port: 80
      targetPort: 5001
---
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: tweack-api
spec:
  rules:
    - host: api.example.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: tweack-api
                port:
                  number: 80`,
      output: 'NAME         TYPE        CLUSTER-IP     PORT(S)\ntweack-api   ClusterIP   10.96.12.7     80/TCP',
      explain: 'Clients hit api.example.com, the Ingress forwards to port 80 of the Service, which forwards to port 5001 on a ready Pod.',
    },
    mistakes: [
      'Exposing every Service as LoadBalancer, which creates a cloud load balancer per service and a large bill.',
      'Debugging DNS before checking that the Service has endpoints.',
    ],
    practice: {
      prompt: 'Create a ClusterIP Service for an existing Deployment and confirm it has endpoints.',
      steps: ['Apply the Service.', 'Run kubectl get endpoints.', 'Curl the Service from a temporary Pod.'],
    },
    summary: [
      'Services give Pods a stable name and load balancing.',
      'ClusterIP is the right default inside a cluster.',
      'Ingress routes external HTTP to internal Services.',
    ],
    questions: [
      q('A Service returns no endpoints. What is the most likely cause?',
        'Its selector does not match any Pod labels',
        ['The port is wrong in the Ingress', 'The image is private', 'The node is out of disk'],
        'Endpoints are built from Pods whose labels match the selector.'),
      q('Which Service type exposes an app only inside the cluster?',
        'ClusterIP',
        ['LoadBalancer', 'NodePort', 'ExternalName'],
        'ClusterIP is internal by default and is the right choice for most services.'),
    ],
  },

  'k8s-config': {
    lead: 'Configuration and secrets must live outside the image so one image can run in every environment. Kubernetes provides ConfigMaps for settings and Secrets for credentials.',
    objectives: [
      'Inject settings with a ConfigMap',
      'Store credentials in a Secret and mount them safely',
      'Explain why a Secret is not encrypted by default',
    ],
    sections: [
      [
        'ConfigMaps and Secrets',
        'A ConfigMap holds non-sensitive key-value pairs. A Secret holds sensitive values and is base64-encoded, which is encoding, not encryption; anyone with read access to the namespace can decode it. Enable encryption at rest in the cluster and restrict RBAC so only the workloads that need a Secret can read it.',
      ],
      [
        'Environment variables or files',
        'Environment variables are simple but leak into crash dumps and process listings. Mounting a Secret as a file is safer for credentials and allows rotation without a restart if the application re-reads the file. Choose one convention per service so behaviour is predictable.',
      ],
    ],
    example: {
      label: 'A ConfigMap and Secret used by a Deployment',
      code: `kubectl create configmap api-config --from-literal=LOG_LEVEL=info
kubectl create secret generic api-secrets --from-literal=JWT_SECRET="$(openssl rand -hex 32)"

# In the Deployment
envFrom:
  - configMapRef: { name: api-config }
  - secretRef: { name: api-secrets }`,
      output: 'configmap/api-config created\nsecret/api-secrets created',
      explain: 'The same image now reads different values per environment without being rebuilt.',
    },
    mistakes: [
      'Committing a Secret manifest with real values to git.',
      'Assuming base64 means encrypted, and leaving the namespace readable to everyone.',
    ],
    practice: {
      prompt: 'Move one hard-coded setting out of an image into a ConfigMap and confirm the app reads it.',
      steps: ['Create the ConfigMap.', 'Reference it with envFrom.', 'Restart the Deployment and check the log line.'],
    },
    summary: [
      'ConfigMaps hold settings; Secrets hold credentials.',
      'Secrets are encoded, not encrypted, unless you enable encryption at rest.',
      'Prefer file mounts for credentials that rotate.',
    ],
    questions: [
      q('How is a Kubernetes Secret stored by default?',
        'Base64-encoded, which is not encryption',
        ['Encrypted with a cluster key', 'Hashed with bcrypt', 'Stored only in memory'],
        'Encoding is reversible; access control and encryption at rest are what protect it.'),
      q('Why mount a credential as a file instead of an environment variable?',
        'Files can be rotated and do not appear in process listings',
        ['Files are faster', 'Environment variables cannot be read in Go', 'Files bypass RBAC'],
        'Environment variables leak into diagnostics and require a restart to change.'),
    ],
  },

  compose: {
    lead: 'Docker Compose describes a multi-container development stack in one file, so a new developer can start the API, database and cache with a single command.',
    objectives: [
      'Describe services, networks and volumes in Compose',
      'Start and stop a stack with one command',
      'Use health checks and dependency ordering',
    ],
    sections: [
      [
        'One file, the whole stack',
        'Each service maps to a container. Compose creates a private network so services reach each other by name, and named volumes keep database data between runs. depends_on with a health check condition ensures the API waits for the database rather than crash-looping on start.',
      ],
      [
        'Development versus production',
        'Compose is excellent for local development and small deployments. Mount source code as a bind mount for hot reload, but never ship that same file to production, where the image must be immutable. Keep a docker-compose.yml for local and separate production manifests.',
      ],
    ],
    example: {
      label: 'A local stack with a database',
      code: `services:
  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_PASSWORD: local
    volumes:
      - db-data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s

  api:
    build: .
    ports: ["5001:5001"]
    environment:
      DATABASE_URL: postgres://postgres:local@db:5432/app
    depends_on:
      db:
        condition: service_healthy

volumes:
  db-data:`,
      output: 'api-1  | Server listening on http://0.0.0.0:5001',
      explain: 'The API starts only after Postgres reports healthy, removing a common race at startup.',
    },
    mistakes: [
      'Using localhost to reach another service; inside the Compose network the service name is the host.',
      'Deploying a Compose file with source bind mounts, which breaks the immutable image guarantee.',
    ],
    practice: {
      prompt: 'Write a Compose file for an API and a database, start it, and confirm the API can query the database.',
      steps: ['Define both services.', 'Add a health check to the database.', 'Use depends_on with the healthy condition.'],
    },
    summary: [
      'Compose runs a multi-container stack from one file.',
      'Services resolve each other by service name.',
      'Named volumes persist data between runs.',
    ],
    questions: [
      q('How does one Compose service reach another?',
        'By its service name as the hostname',
        ['By localhost', 'By the container id', 'Through the host public IP'],
        'Compose creates a network where service names resolve to container addresses.'),
      q('Why use depends_on with a health condition?',
        'So a dependent service starts after the other is actually ready',
        ['To make the stack start faster', 'To reduce image size', 'To enable HTTPS'],
        'Starting order alone does not guarantee the database is accepting connections.'),
    ],
  },

  'cicd-images': {
    lead: 'A container image should be built once and promoted, never rebuilt per environment. This lesson wires building, scanning and pushing into a pipeline.',
    objectives: [
      'Build and tag an image in CI with the commit SHA',
      'Push only after tests and a security scan pass',
      'Promote one digest through staging and production',
    ],
    sections: [
      [
        'Build once, promote the digest',
        'The pipeline builds an image tagged with the commit SHA, runs tests against it, scans it and pushes it. Staging and production deploy the same digest. Rebuilding for production means the tested bytes and the shipped bytes are different, which defeats the purpose of the pipeline.',
      ],
      [
        'What gates belong before the push',
        'Unit tests, a lint step and an image scan should all fail the job. Add a size budget so an accidental dev dependency does not triple the image. Credentials come from the CI secret store and should be scoped to push only the repository being built.',
      ],
    ],
    example: {
      label: 'A minimal GitHub Actions job',
      code: `jobs:
  image:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write
    steps:
      - uses: actions/checkout@v4
      - run: docker build -t ghcr.io/acme/api:$GITHUB_SHA .
      - run: docker run --rm ghcr.io/acme/api:$GITHUB_SHA npm test
      - run: trivy image --exit-code 1 --severity HIGH,CRITICAL ghcr.io/acme/api:$GITHUB_SHA
      - run: docker push ghcr.io/acme/api:$GITHUB_SHA`,
      output: 'Successfully pushed ghcr.io/acme/api:9f2c1a...',
      explain: 'A failing test or scan stops the job before the push step runs.',
    },
    mistakes: [
      'Rebuilding the image in the deploy job, so production runs untested bytes.',
      'Using a long-lived personal token instead of a scoped CI token.',
    ],
    practice: {
      prompt: 'Add a test step and a scan step to an existing build pipeline and confirm a failure blocks the push.',
      steps: ['Run tests against the built image.', 'Add the scan with an exit code.', 'Break a test and watch the pipeline stop.'],
    },
    summary: [
      'Build once and promote the same digest.',
      'Tests and scans must block the push.',
      'Scope CI credentials to the minimum needed.',
    ],
    questions: [
      q('Why should production not rebuild the image?',
        'The tested bytes and the deployed bytes would differ',
        ['Rebuilding is slower', 'The registry forbids it', 'Tags are immutable'],
        'Promoting the tested digest is what makes the test meaningful.'),
      q('Which step should run before pushing an image?',
        'Tests and a vulnerability scan',
        ['A DNS lookup', 'A database migration', 'A load test on production'],
        'Gates before the push stop a bad image from becoming available.'),
    ],
  },

  observability: {
    lead: 'A container that is running is not necessarily healthy. Logs, metrics and health checks tell you what the service is actually doing.',
    objectives: [
      'Write structured logs that are useful in a cluster',
      'Distinguish liveness from readiness endpoints',
      'Expose the metrics that reveal saturation',
    ],
    sections: [
      [
        'Logs are events, not prose',
        'Emit one JSON object per request with method, path, status, duration and a request id, to stdout. The platform collects stdout, so writing to a file inside the container loses the logs when the container is replaced. Never log tokens or passwords.',
      ],
      [
        'Health and saturation',
        'A liveness endpoint answers whether the process should be restarted; a readiness endpoint answers whether it can serve traffic, which includes database connectivity. Expose request count, error rate, latency percentiles and pool saturation. Alert on p95 latency and error rate rather than CPU alone.',
      ],
    ],
    example: {
      label: 'Health endpoints in a Node service',
      code: `app.get('/api/health/live', (req, res) => res.json({ status: 'ok' }));

app.get('/api/health/ready', async (req, res) => {
  try {
    await db.query('SELECT 1');
    res.json({ status: 'ready' });
  } catch (error) {
    res.status(503).json({ status: 'unavailable' });
  }
});`,
      output: '{"status":"ready"}',
      explain: 'Liveness stays up even when the database is down; readiness drops so traffic stops being routed there.',
    },
    mistakes: [
      'Logging to a file inside the container.',
      'Making liveness depend on the database, which restarts every Pod during a database outage.',
    ],
    practice: {
      prompt: 'Add separate liveness and readiness endpoints to a service and point the probes at them.',
      steps: ['Create a process-only liveness route.', 'Create a readiness route that checks the database.', 'Update the Deployment probes.'],
    },
    summary: [
      'Log structured events to stdout.',
      'Liveness restarts; readiness gates traffic.',
      'Alert on error rate and latency, not just CPU.',
    ],
    questions: [
      q('Why write logs to stdout rather than a file in the container?',
        'The platform collects stdout, and the container filesystem is disposable',
        ['Files are slower', 'stdout is encrypted', 'Kubernetes cannot read files'],
        'A replaced container takes its filesystem with it.'),
      q('What should a readiness check include that a liveness check should not?',
        'Dependency connectivity such as the database',
        ['The process being alive', 'The port being open', 'The binary existing'],
        'Liveness should fail only when a restart would help.'),
    ],
  },

  rollouts: {
    lead: 'Deploying is a controlled change, not a restart. Kubernetes can replace Pods gradually and roll back automatically when a release goes wrong.',
    objectives: [
      'Explain how a rolling update replaces Pods',
      'Configure maxSurge and maxUnavailable',
      'Roll back to a previous revision',
    ],
    sections: [
      [
        'Rolling updates',
        'Changing the Pod template creates a new ReplicaSet. The Deployment scales the new one up and the old one down within the bounds of maxSurge and maxUnavailable. With three replicas, maxUnavailable 0 and maxSurge 1, capacity never drops during the change. Readiness probes decide when each new Pod counts as available.',
      ],
      [
        'Rollback and history',
        'Kubernetes keeps revision history, so kubectl rollout undo returns to the previous template in seconds. Set revisionHistoryLimit high enough to cover a bad week, and use kubectl rollout status in the pipeline so a deployment that never becomes ready fails the job rather than appearing successful.',
      ],
    ],
    example: {
      label: 'Update, watch and roll back',
      code: `kubectl set image deployment/tweack-api api=ghcr.io/acme/api:1.1.0
kubectl rollout status deployment/tweack-api --timeout=120s
# something is wrong:
kubectl rollout undo deployment/tweack-api
kubectl rollout history deployment/tweack-api`,
      output: 'deployment "tweack-api" successfully rolled out',
      explain: 'rollout status blocks until the new Pods are ready or the timeout expires, which is what CI should wait on.',
    },
    mistakes: [
      'Deploying with maxUnavailable 100%, which takes the whole service down during the change.',
      'Treating a successful kubectl apply as a successful deployment without checking readiness.',
    ],
    practice: {
      prompt: 'Deploy a new image tag, follow the rollout, then roll back and confirm the old image is running.',
      steps: ['Set the new image.', 'Watch rollout status.', 'Undo and check the image tag.'],
    },
    summary: [
      'Rolling updates replace Pods within surge and availability limits.',
      'readiness probes decide when a new Pod is available.',
      'rollout undo restores the previous revision quickly.',
    ],
    questions: [
      q('What does maxUnavailable: 0 guarantee during a rollout?',
        'No existing capacity is removed before a replacement is ready',
        ['The rollout is instant', 'The old Pods never stop', 'The image is cached'],
        'Combined with maxSurge, capacity stays at or above the current level.'),
      q('Which command confirms a rollout actually completed?',
        'kubectl rollout status',
        ['kubectl apply', 'kubectl get pods -o wide', 'kubectl describe node'],
        'It waits for the Deployment to report that all replicas are updated and available.'),
    ],
  },
};

module.exports = {
  slug: 'devops-essentials',
  title: 'DevOps Essentials: Docker & Kubernetes',
  shortDescription:
    'Containerise an application, build production-grade images and run them on Kubernetes with confidence.',
  description:
    'A practical DevOps course for developers who ship software. You will containerise a real service, build small secure images, publish them to a registry, then deploy and operate them on Kubernetes. Every lesson includes a worked example and a module quiz, and the capstone walks through a complete deployment pipeline.',
  level: 'Intermediate',
  price: 69.99,
  duration: '8 weeks',
  featured: true,
  outcomes: [
    'Build and run containers from a Dockerfile',
    'Write small, secure images with multi-stage builds',
    'Explain how image layers and caching affect build time',
    'Deploy an application to Kubernetes with Deployments and Services',
    'Manage configuration and secrets outside the image',
    'Add health checks, logs and metrics to a containerised service',
    'Roll out and roll back a release safely',
    'Wire container builds into a CI/CD pipeline',
  ],
  requirements: [
    'Comfort running commands in a terminal',
    'Basic familiarity with a web application and HTTP',
    'Docker Desktop or Docker Engine installed locally',
  ],
  targetAudience:
    'Developers and junior DevOps engineers who can write an application but want a reliable way to ship and operate it.',
  modules: [
    {
      title: 'Module 1: Containers from first principles',
      description:
        'Understand what containers are, how images are built from layers, and how to run and inspect a container.',
      check: [
        q('A container exits immediately after starting. What is the first thing to check?',
          'The logs, to see why the main process ended',
          ['The host disk size', 'The registry password', 'The Kubernetes version'],
          'A container lives only as long as its main process. Logs explain why it stopped.'),
        q('Which two commands change the filesystem and therefore create image layers?',
          'COPY and RUN',
          ['EXPOSE and CMD', 'WORKDIR and ENV', 'LABEL and HEALTHCHECK'],
          'COPY adds files and RUN executes commands; both change the filesystem.'),
      ],
      lessons: [
        { title: 'Why containers exist', objective: 'Explain which deployment problems containers solve and how they differ from virtual machines.', topic: 'why-containers', minutes: 20 },
        { title: 'Images, layers and registries', objective: 'Describe how image layers are cached and what a registry actually stores.', topic: 'images-layers', minutes: 20 },
        { title: 'Your first Dockerfile', objective: 'Write, build and run a Dockerfile for a small service.', topic: 'first-dockerfile', minutes: 25 },
        { title: 'Running and inspecting containers', objective: 'Use logs, exec and inspect to diagnose a running container.', topic: 'run-containers', minutes: 20 },
      ],
    },
    {
      title: 'Module 2: Building images you can trust',
      description:
        'Separate build and runtime concerns, keep rebuilds fast, scan for vulnerabilities and publish images other machines can pull by digest.',
      check: [
        q('Which image is usually the better production base?',
          'A slim or distroless image that contains only the runtime',
          ['A full desktop image with a browser', 'The largest available image', 'An image built from the host filesystem'],
          'Fewer packages mean fewer vulnerabilities and a smaller surface.'),
        q('What is the main benefit of a multi-stage build?',
          'Compilers and dev dependencies never reach the final image',
          ['It builds faster on every machine', 'It removes the need for a registry', 'It encrypts the image'],
          'Only the artefacts you copy across the stage boundary are shipped.'),
      ],
      lessons: [
        { title: 'Multi-stage builds', objective: 'Separate the build stage from the runtime stage to ship a small, clean image.', topic: 'multi-stage', minutes: 25 },
        { title: 'Build cache and speed', objective: 'Order instructions so expensive layers stay cached across rebuilds.', topic: 'docker-cache', minutes: 20 },
        { title: 'Image security and scanning', objective: 'Reduce the attack surface and fail CI on high-severity findings.', topic: 'image-security', minutes: 25 },
        { title: 'Registries, tags and digests', objective: 'Publish an image with traceable tags and pull it by digest.', topic: 'push-registry', minutes: 20 },
      ],
    },
    {
      title: 'Module 3: Kubernetes essentials',
      description:
        'Move from a single container to a cluster: Deployments, Services, configuration and the reconciliation model that holds it together.',
      check: [
        q('A Deployment reports three available replicas but users get connection errors. What should you check first?',
          'Whether the Service selector matches the Pod labels and has endpoints',
          ['The node CPU temperature', 'The Docker version on your laptop', 'The registry password'],
          'A Service with no endpoints forwards no traffic regardless of how healthy the Pods are.'),
        q('Why keep configuration in a ConfigMap instead of the image?',
          'The same image can run in every environment without a rebuild',
          ['ConfigMaps make the image smaller', 'ConfigMaps are encrypted by default', 'Kubernetes cannot read environment variables'],
          'Environment-specific values belong outside the immutable artefact.'),
      ],
      lessons: [
        { title: 'Why orchestration exists', objective: 'Explain desired state, reconciliation and when Kubernetes is the wrong tool.', topic: 'why-orchestration', minutes: 20 },
        { title: 'Deployments, ReplicaSets and Pods', objective: 'Write a Deployment with labels and probes, then scale it.', topic: 'k8s-deployments', minutes: 30 },
        { title: 'Services and Ingress', objective: 'Give Pods a stable address and route external HTTP traffic.', topic: 'k8s-services', minutes: 25 },
        { title: 'ConfigMaps and Secrets', objective: 'Inject settings and credentials without rebuilding the image.', topic: 'k8s-config', minutes: 20 },
      ],
    },
    {
      title: 'Module 4: Shipping and operating',
      description:
        'Run a realistic stack locally, promote one image through a pipeline, and observe and roll back a release in production.',
      check: [
        q('A rollout finishes but the new version returns errors. What is the fastest safe action?',
          'kubectl rollout undo to restore the previous revision',
          ['Delete the namespace', 'Rebuild the image from scratch', 'Restart every node'],
          'Rollback restores the last known good template in seconds.'),
        q('Which signal best shows that a service is degrading before users complain?',
          'Rising p95 latency and error rate',
          ['Disk size on the build machine', 'The number of Dockerfiles', 'The registry tag count'],
          'Latency percentiles and error rates reflect user experience directly.'),
      ],
      lessons: [
        { title: 'Local parity with Docker Compose', objective: 'Run the API and its dependencies with one command and health checks.', topic: 'compose', minutes: 25 },
        { title: 'CI/CD for container images', objective: 'Build once, gate on tests and scans, then promote the digest.', topic: 'cicd-images', minutes: 30 },
        { title: 'Logs, metrics and health checks', objective: 'Emit structured logs and separate liveness from readiness.', topic: 'observability', minutes: 25 },
        { title: 'Rolling updates and rollbacks', objective: 'Release without downtime and recover from a bad deploy.', topic: 'rollouts', minutes: 25 },
      ],
    },
  ],
  topics,
};

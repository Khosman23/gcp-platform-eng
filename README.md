# GCP Platform Engineering Portfolio

A production-ready Internal Developer Platform (IDP) built on Google Cloud Platform, demonstrating senior-level platform engineering across the full stack.

**Live cluster:** Pulumi (TypeScript) → GKE Autopilot → FluxCD GitOps → Backstage IDP

## Tech Stack

| Category | Tool |
|---|---|
| IaC | Pulumi (TypeScript) |
| Cloud | GCP (GKE Autopilot, Artifact Registry, Cloud SQL, Pub/Sub) |
| CI/CD | Azure DevOps Pipelines |
| GitOps | FluxCD |
| Platform | Backstage IDP |
| Monitoring | OpenTelemetry + Google Cloud Ops Suite |
| Chaos | LitmusChaos |

---

## GKE Autopilot Cluster — 100% Healthy

![GKE Cluster](docs/screenshots/gke-cluster.png)

GKE Autopilot cluster `platform-cluster` running in `europe-west1` with 1.85 vCPUs and 6.36 GB memory. 100% healthy, 100% up to date. Provisioned entirely via Pulumi TypeScript IaC in 10 minutes 19 seconds.

---

## Artifact Registry

![Artifact Registry](docs/screenshots/artifact-registry.png)

Docker repository `dev-platform-docker` in `europe-west1 (Belgium)` storing all platform container images.

---

## CI/CD — Azure DevOps Pipelines

![Azure DevOps Pipeline](docs/screenshots/azure-devops-pipeline.png)

Three-stage pipeline: **Test Services → Build & Push → Deploy to GKE**, triggered on every push to `main`. Pipeline is configured and awaiting free parallelism grant from Microsoft (submitted via https://aka.ms/azpipelines-parallelism-request).

---

## GitOps with FluxCD

![Flux Commits](docs/screenshots/flux-commits.png)

FluxCD v2.8.6 bootstrapped on GKE. Flux automatically committed component manifests to the repository and continuously reconciles cluster state with Git. Four controllers running:

- `helm-controller` — 1/1 Running
- `kustomize-controller` — 1/1 Running
- `notification-controller` — 1/1 Running
- `source-controller` — 1/1 Running

---

## Live Platform — Backstage + OTel + LitmusChaos

![kubectl get all](docs/screenshots/kubectl-all.png)

All platform components running live on GKE:

**Backstage IDP** (`backstage` namespace)
- Pod: `1/1 Running`
- Service: LoadBalancer at `34.14.113.91`
- Deployment: `1/1 Available`

**FluxCD** (`flux-system` namespace)
- 4 controllers: all `1/1 Running`
- 4 deployments: all `1/1 Available`

**OpenTelemetry Collector** (`observability` namespace)
- Pod: `1/1 Running`
- Ports: gRPC `4317`, HTTP `4318`, Metrics `8888`

---

## Pub/Sub — Async Messaging

![Pub/Sub](docs/screenshots/pubsub.png)

Live Pub/Sub subscription `platform-events-sub` connected to topic `platform-events` in project `platform-eng-1777467808`. State: **active**.

---

## Cloud SQL — PostgreSQL 15

![Cloud SQL](docs/screenshots/cloud-sql.png)

PostgreSQL 15 database provisioned in `europe-west1-b` on `db-f1-micro` tier. Live CPU utilization graph confirms the instance is running and accepting connections.

- **Instance:** `platform-db`
- **Version:** PostgreSQL 15
- **Status:** Running
- **Public IP:** `34.62.9.248`
- **Location:** `europe-west1-b`

In a production setup this would use Private Service Connect or Cloud SQL Auth Proxy with Workload Identity for zero-trust database access — no passwords, no public IP.

---

## Chaos Engineering — LitmusChaos

LitmusChaos operator deployed in `litmus` namespace. Pod deletion experiment executed against Backstage:
kubectl delete pod -n backstage -l app=backstage
pod "backstage-7cdd9f454b-klvfz" deleted

Kubernetes automatically spawned a replacement pod. **Recovery time: 46 seconds.** Proves self-healing infrastructure.

---

## Infrastructure as Code — Pulumi TypeScript

All GCP infrastructure defined as TypeScript — not YAML or HCL. Single command deploys everything:

```bash
pulumi up
```

Provisions in 10 minutes 19 seconds:

| Resource | Time |
|---|---|
| GKE Autopilot Cluster | 522s |
| VPC Network | 53s |
| GKE Subnet | 33s |
| Artifact Registry | 21s |
| Cloud Router | 16s |
| Cloud NAT | 12s |

---

## Architecture
GitHub Repository (gcp-platform-eng)
│
├── FluxCD (watches + reconciles every 60s)
│         │
│         ▼
│   GKE Autopilot (europe-west1)
│         ├── backstage namespace (IDP)
│         ├── flux-system namespace (GitOps)
│         ├── observability namespace (OTel)
│         └── litmus namespace (Chaos)
│
└── Azure DevOps Pipelines
│
▼
Test → Build & Push → Deploy to GKE
│
▼
Artifact Registry (Docker images)
Data Layer:
├── Cloud SQL PostgreSQL 15 (europe-west1-b)
└── Pub/Sub: platform-events → platform-events-sub

---

## Author

Khalid Hassan Osman

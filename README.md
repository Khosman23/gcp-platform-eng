# GCP Platform Engineering Portfolio — Project 3

A production-ready Internal Developer Platform (IDP) on Google Cloud Platform.

## Architecture

| Category | Tool |
|---|---|
| IaC | Pulumi (TypeScript) |
| Cloud | GCP (GKE Autopilot, Artifact Registry, Cloud SQL, Pub/Sub) |
| CI/CD | Azure DevOps Pipelines |
| GitOps | FluxCD |
| Platform | Backstage IDP |
| Monitoring | OpenTelemetry + Google Cloud Ops Suite |
| Chaos | LitmusChaos |

### Phase 8 — LitmusChaos
- Chaos operator deployed in litmus namespace
- Pod deletion experiment verified self-healing
- Backstage recovered in 46 seconds

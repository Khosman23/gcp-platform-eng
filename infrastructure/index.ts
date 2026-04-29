import * as pulumi from "@pulumi/pulumi";
import * as gcp from "@pulumi/gcp";

// =====================================================================
// Configuration
// =====================================================================
const config = new pulumi.Config();
const platformConfig = new pulumi.Config("platform");

const gcpConfig = new pulumi.Config("gcp");
const region = gcpConfig.require("region");
const project = gcpConfig.require("project");

const environment = platformConfig.require("environment");
const clusterName = platformConfig.require("clusterName");

// Common labels applied to every resource — for cost tracking and ownership
const commonLabels = {
    project: "platform-eng-portfolio",
    environment: environment,
    managed_by: "pulumi",
};

// =====================================================================
// VPC Network
// =====================================================================
// A custom VPC gives us full control over subnets, routes, and firewall rules.
// auto_create_subnetworks: false means we define our own subnets explicitly.
const network = new gcp.compute.Network("platform-vpc", {
    name: `${environment}-platform-vpc`,
    autoCreateSubnetworks: false,
    description: "VPC for Platform Engineering portfolio",
});

// =====================================================================
// Subnet for GKE
// =====================================================================
// Two secondary IP ranges are required for GKE:
//   - pods: each pod gets a unique IP from this range
//   - services: ClusterIP services use this range
// This is called "VPC-native" mode and is required for Autopilot.
const subnet = new gcp.compute.Subnetwork("gke-subnet", {
    name: `${environment}-gke-subnet`,
    ipCidrRange: "10.10.0.0/20",
    region: region,
    network: network.id,
    privateIpGoogleAccess: true,
    secondaryIpRanges: [
        {
            rangeName: "pods",
            ipCidrRange: "10.20.0.0/14",
        },
        {
            rangeName: "services",
            ipCidrRange: "10.24.0.0/20",
        },
    ],
});

// =====================================================================
// Cloud Router + Cloud NAT
// =====================================================================
// Private GKE nodes have no public IP. NAT lets them reach the internet
// (e.g., to pull container images from Docker Hub) without being exposed.
const router = new gcp.compute.Router("nat-router", {
    name: `${environment}-nat-router`,
    region: region,
    network: network.id,
});

const nat = new gcp.compute.RouterNat("cloud-nat", {
    name: `${environment}-cloud-nat`,
    router: router.name,
    region: region,
    natIpAllocateOption: "AUTO_ONLY",
    sourceSubnetworkIpRangesToNat: "ALL_SUBNETWORKS_ALL_IP_RANGES",
});

// =====================================================================
// Artifact Registry — Docker repository
// =====================================================================
// This is GCP's equivalent of ACR (Azure) and ECR (AWS).
// Stores Docker images for the platform.
const dockerRepo = new gcp.artifactregistry.Repository("docker-repo", {
    repositoryId: `${environment}-platform-docker`,
    location: region,
    format: "DOCKER",
    description: "Docker images for the platform",
    labels: commonLabels,
});

// =====================================================================
// GKE Autopilot Cluster
// =====================================================================
// Autopilot = Google manages all nodes. You define workloads, Google
// scales the underlying infrastructure. Pay-per-pod, not per-node.
const cluster = new gcp.container.Cluster("platform-cluster", {
    name: clusterName,
    location: region,
    enableAutopilot: true,
    network: network.id,
    subnetwork: subnet.id,

    // Required for Autopilot: VPC-native networking with secondary ranges
    ipAllocationPolicy: {
        clusterSecondaryRangeName: "pods",
        servicesSecondaryRangeName: "services",
    },

    // Release channel = automatic updates managed by Google
    releaseChannel: {
        channel: "REGULAR",
    },

    // Workload Identity = pods can authenticate to GCP APIs as service accounts
    // without any keys (parallel to IRSA in EKS, Managed Identity in AKS)
    workloadIdentityConfig: {
        workloadPool: `${project}.svc.id.goog`,
    },

    // Required when using a custom VPC
    deletionProtection: false,
}, {
    // Autopilot clusters take 5–10 minutes to provision
    customTimeouts: {
        create: "30m",
        update: "30m",
        delete: "30m",
    },
});

// =====================================================================
// Outputs — values exposed after deployment
// =====================================================================
export const networkName = network.name;
export const subnetName = subnet.name;
export const clusterEndpoint = cluster.endpoint;
export const clusterNameOutput = cluster.name;
export const clusterLocation = cluster.location;
export const dockerRepoUrl = pulumi.interpolate`${region}-docker.pkg.dev/${project}/${dockerRepo.repositoryId}`;
# =============================================================================
# Neobank Platform - Terraform Infrastructure
# =============================================================================
# This Terraform configuration provisions the cloud infrastructure for
# the Neobank platform on AWS.
#
# Resources:
#   - VPC with public/private subnets
#   - EKS cluster for container orchestration
#   - RDS PostgreSQL for persistent storage
#   - ElastiCache Redis for caching + feature store
#   - MSK (Managed Streaming for Kafka) for event streaming
#   - S3 for static assets and backups
#   - IAM roles and policies
#   - KMS keys for encryption
#
# Usage:
#   terraform init
#   terraform plan -var-file=environments/dev.tfvars
#   terraform apply -var-file=environments/dev.tfvars
# =============================================================================

terraform {
  required_version = ">= 1.6.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.30"
    }
  }

  # Uncomment for remote state (recommended for teams)
  # backend "s3" {
  #   bucket         = "neobank-terraform-state"
  #   key            = "infrastructure/terraform.tfstate"
  #   region         = "us-east-1"
  #   dynamodb_table = "neobank-terraform-locks"
  #   encrypt        = true
  # }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = "neobank"
      Environment = var.environment
      ManagedBy   = "terraform"
    }
  }
}

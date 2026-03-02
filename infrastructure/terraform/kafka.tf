# =============================================================================
# MSK (Managed Streaming for Kafka) - Event Streaming
# =============================================================================

resource "aws_security_group" "msk" {
  name_prefix = "${var.project_name}-${var.environment}-msk-"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port       = 9092
    to_port         = 9098
    protocol        = "tcp"
    security_groups = [aws_security_group.eks_cluster.id]
  }

  ingress {
    from_port       = 2181
    to_port         = 2181
    protocol        = "tcp"
    security_groups = [aws_security_group.eks_cluster.id]
  }

  tags = {
    Name = "${var.project_name}-${var.environment}-msk-sg"
  }
}

# KMS key for MSK encryption
resource "aws_kms_key" "msk" {
  description             = "MSK encryption key"
  deletion_window_in_days = 7
  enable_key_rotation     = true
}

resource "aws_msk_cluster" "main" {
  cluster_name           = "${var.project_name}-${var.environment}"
  kafka_version          = "3.5.1"
  number_of_broker_nodes = var.kafka_number_of_brokers

  broker_node_group_info {
    instance_type = var.kafka_instance_type
    client_subnets = aws_subnet.private[*].id
    security_groups = [aws_security_group.msk.id]

    storage_info {
      ebs_storage_info {
        volume_size = var.kafka_ebs_volume_size
      }
    }
  }

  encryption_info {
    encryption_at_rest_kms_key_arn = aws_kms_key.msk.arn
    encryption_in_transit {
      client_broker = "TLS"
      in_cluster    = true
    }
  }

  logging_info {
    broker_logs {
      cloudwatch_logs {
        enabled   = true
        log_group = aws_cloudwatch_log_group.msk.name
      }
    }
  }

  tags = {
    Name = "${var.project_name}-${var.environment}-msk"
  }
}

resource "aws_cloudwatch_log_group" "msk" {
  name              = "/aws/msk/${var.project_name}-${var.environment}"
  retention_in_days = 30
}

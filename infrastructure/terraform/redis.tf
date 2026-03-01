# =============================================================================
# ElastiCache Redis - Caching + Feature Store
# =============================================================================

resource "aws_elasticache_subnet_group" "main" {
  name       = "${var.project_name}-${var.environment}-redis-subnet"
  subnet_ids = aws_subnet.private[*].id
}

resource "aws_security_group" "redis" {
  name_prefix = "${var.project_name}-${var.environment}-redis-"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port       = 6379
    to_port         = 6379
    protocol        = "tcp"
    security_groups = [aws_security_group.eks_cluster.id]
  }

  tags = {
    Name = "${var.project_name}-${var.environment}-redis-sg"
  }
}

resource "aws_elasticache_replication_group" "main" {
  replication_group_id = "${var.project_name}-${var.environment}"
  description          = "Neobank Redis cluster for caching and feature store"

  node_type            = var.redis_node_type
  num_cache_clusters   = var.redis_num_cache_nodes
  port                 = 6379
  parameter_group_name = "default.redis7"

  subnet_group_name  = aws_elasticache_subnet_group.main.name
  security_group_ids = [aws_security_group.redis.id]

  at_rest_encryption_enabled = true
  transit_encryption_enabled = true

  automatic_failover_enabled = var.redis_num_cache_nodes > 1
  multi_az_enabled           = var.redis_num_cache_nodes > 1

  snapshot_retention_limit = var.environment == "production" ? 7 : 1
  snapshot_window          = "03:00-05:00"
  maintenance_window       = "Mon:05:00-Mon:06:00"

  tags = {
    Name = "${var.project_name}-${var.environment}-redis"
  }
}

# Production Environment Configuration
aws_region  = "us-east-1"
environment = "production"

# Production-grade instances
eks_node_instance_types = ["m6i.xlarge"]
eks_node_desired_size   = 3
eks_node_min_size       = 3
eks_node_max_size       = 20

db_instance_class    = "db.r6g.xlarge"
db_allocated_storage = 100

redis_node_type       = "cache.r6g.large"
redis_num_cache_nodes = 3

kafka_instance_type     = "kafka.m5.large"
kafka_number_of_brokers = 3
kafka_ebs_volume_size   = 500

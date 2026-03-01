# Development Environment Configuration
aws_region  = "us-east-1"
environment = "dev"

# Smaller instances for dev
eks_node_instance_types = ["t3.medium"]
eks_node_desired_size   = 2
eks_node_min_size       = 1
eks_node_max_size       = 4

db_instance_class    = "db.t3.medium"
db_allocated_storage = 20

redis_node_type       = "cache.t3.micro"
redis_num_cache_nodes = 1

kafka_instance_type     = "kafka.t3.small"
kafka_number_of_brokers = 2
kafka_ebs_volume_size   = 20

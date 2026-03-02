"""
Shared configuration for all AI agents.
"""
import os
from dataclasses import dataclass, field
from typing import Optional


@dataclass
class KafkaConfig:
    brokers: str = os.getenv("KAFKA_BROKERS", "localhost:9092")
    group_id_prefix: str = "ai-agent"
    auto_offset_reset: str = "latest"


@dataclass
class RedisConfig:
    host: str = os.getenv("REDIS_HOST", "localhost")
    port: int = int(os.getenv("REDIS_PORT", "6379"))
    password: Optional[str] = os.getenv("REDIS_PASSWORD")
    feature_store_db: int = 1


@dataclass
class DatabaseConfig:
    host: str = os.getenv("DB_HOST", "localhost")
    port: int = int(os.getenv("DB_PORT", "5432"))
    name: str = os.getenv("DB_NAME", "neobank")
    user: str = os.getenv("DB_USER", "neobank")
    password: str = os.getenv("DB_PASSWORD", "neobank_dev")

    @property
    def connection_string(self) -> str:
        return f"postgresql://{self.user}:{self.password}@{self.host}:{self.port}/{self.name}"


@dataclass
class LLMConfig:
    provider: str = os.getenv("LLM_PROVIDER", "openai")  # openai or anthropic
    model: str = os.getenv("LLM_MODEL", "gpt-4o")
    api_key: Optional[str] = os.getenv("LLM_API_KEY")
    max_tokens: int = 1024
    temperature: float = 0.1  # Low temperature for financial decisions
    timeout_seconds: int = 10
    fallback_to_rules: bool = True


@dataclass
class AgentConfig:
    kafka: KafkaConfig = field(default_factory=KafkaConfig)
    redis: RedisConfig = field(default_factory=RedisConfig)
    database: DatabaseConfig = field(default_factory=DatabaseConfig)
    llm: LLMConfig = field(default_factory=LLMConfig)
    confidence_threshold: float = 0.6
    recommendation_min_value_delta: float = 0.10  # $0.10 minimum
    max_agent_timeout_seconds: int = 2
    enable_audit_logging: bool = True

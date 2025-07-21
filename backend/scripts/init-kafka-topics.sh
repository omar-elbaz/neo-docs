#!/bin/bash

# Wait for Kafka to be ready
echo "Waiting for Kafka to be ready..."
until kafka-topics --bootstrap-server ${KAFKA_BROKERS:-localhost:9092} --list > /dev/null 2>&1; do
  echo "Waiting for Kafka..."
  sleep 2
done

echo "Kafka is ready. Creating topics..."

# Create document-operations topic
kafka-topics --bootstrap-server ${KAFKA_BROKERS:-localhost:9092} --create \
  --topic document-operations \
  --partitions 3 \
  --replication-factor 1 \
  --if-not-exists

# Create document-events topic  
kafka-topics --bootstrap-server ${KAFKA_BROKERS:-localhost:9092} --create \
  --topic document-events \
  --partitions 3 \
  --replication-factor 1 \
  --if-not-exists

echo "Topics created successfully:"
kafka-topics --bootstrap-server ${KAFKA_BROKERS:-localhost:9092} --list
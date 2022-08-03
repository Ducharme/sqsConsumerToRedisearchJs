#!/bin/sh

ENV_FILE=$1
export REDIS_HOST=$(grep REDIS_HOST $ENV_FILE | cut -d '=' -f2)
export AWS_REGION=$(grep AWS_REGION $ENV_FILE | cut -d '=' -f2)
export SQS_QUEUE_URL=$(grep SQS_QUEUE_URL $ENV_FILE | cut -d '=' -f2)

sudo docker run -it sqsshapeconsumer-toredisearch:v0.01 --env REDIS_HOST=$REDIS_HOST AWS_REGION=$AWS_REGION SQS_QUEUE_URL=$SQS_QUEUE_URL

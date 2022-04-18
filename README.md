
# Play with docker locally

```
sudo docker build --tag sqsconsumer-toredisearch-js:v0.01 .
sudo docker run -it sqsconsumer-toredisearch-js:v0.01
sudo docker logs da29d22cb82d
```

# Setting REDIS_HOST

Can be the IP of the dev computer (172.17.0.1)
Or the kubernetes service (redisearch-service)

# Multiple SQS clients

[Multiple consumers for one queue](https://github.com/bbc/sqs-consumer/issues/51)

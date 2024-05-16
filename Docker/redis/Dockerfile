FROM redis:alpine

# Copy the custom Redis configuration file into the container
COPY ./Docker/redis/redis.conf /usr/local/etc/redis/redis.conf

# Specify the port to expose (change 6000 to your desired port)
EXPOSE 6380

# Run Redis server with the custom configuration
CMD [ "redis-server", "/usr/local/etc/redis/redis.conf" ]

# Use the official Nginx image as the base image
FROM nginx:stable

COPY ./Web/frontend/ front/

RUN chmod 777 front
# Copy your custom Nginx configuration file
COPY ./Docker/nginx/nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 443
EXPOSE 8443

# Start Nginx in the foreground
CMD ["nginx", "-g", "daemon off;"]
# Write a docker file that runs on typescript

FROM node:17-alpine3.14

# Copy the project to /usr/local/app
RUN mkdir app
COPY args.sh package.json tsconfig.json src/ ./app/

# change working directory to /usr/local/app
WORKDIR ./app/

# Install dependencies
RUN npm install --save-dev @types/node
RUN npm install


EXPOSE 2020




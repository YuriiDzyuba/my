FROM node:14.18.2-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .
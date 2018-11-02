FROM node:latest

WORKDIR /src
ADD . .

RUN npm install

ENTRYPOINT ["node"]
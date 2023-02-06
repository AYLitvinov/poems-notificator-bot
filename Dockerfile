FROM node:18-alpine
WORKDIR /bot
COPY . .
RUN npm install
RUN npm run build
CMD [ "npm", "start" ]

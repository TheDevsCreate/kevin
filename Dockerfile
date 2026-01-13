FROM node:20-alpine

# install ffmpeg + other deps
RUN apk add --no-cache ffmpeg

WORKDIR /usr/src/app

COPY package.json package-lock.json* ./
RUN npm install --production

COPY . .

CMD ["npm", "run", "bot"]

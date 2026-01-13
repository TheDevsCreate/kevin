# use official Node.js image
FROM node:20-alpine

# set working directory inside container
WORKDIR /usr/src/app

# copy package files first for caching
COPY package.json package-lock.json* ./ 

# install dependencies
RUN npm install --production

# copy the rest of your bot code
COPY . .

# load environment variables from .env (optional)
# COPY .env .env

# run your bot script
CMD ["npm", "run", "bot"]

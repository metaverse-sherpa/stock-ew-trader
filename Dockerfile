FROM node:20.11

# Add this line to suppress funding messages
ENV DISABLE_OPENCOLLECTIVE=true
ENV ADBLOCK=true

# Set npm to run in production mode and suppress warnings
RUN npm config set fund false
RUN npm config set loglevel error

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy source
COPY . .

# Set permissions
RUN chmod -R 755 scripts/
RUN chmod -R 755 node_modules/.bin/

EXPOSE 5005

CMD ["npm", "run", "dev"]

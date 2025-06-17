# Use official Node.js image
FROM node:18

# Set working directory inside the container
WORKDIR /app

# Copy dependency files and install them
COPY package*.json ./
RUN npm install

# Copy the rest of the app code
COPY . .

# Default command to run your server (you can modify as needed)
CMD ["npm", "run", "dev"]

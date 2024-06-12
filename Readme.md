# StreamIt

StreamIt is a robust, scalable streaming application that allows users to stream live video to YouTube, record the stream, and download the recorded video. The project leverages Docker, FFmpeg, RTMP, and WebSockets to provide a seamless streaming experience.

## Prerequisites

Before running the code, ensure you have the following installed:

- **Docker Desktop:** Install Docker Desktop from [here](https://www.docker.com/products/docker-desktop).
- **Node.js and npm:** Install Node.js and npm from [here](https://nodejs.org/).

## Running the Project

### 1. Open Docker Desktop

Ensure Docker Desktop is running.

### 2. Build and Run the Containers

Navigate to your project root directory and run the following command:

```sh
docker-compose up --build
```

This command will:

- Build the Docker image using the `Dockerfile`.
- Start the services defined in `docker-compose.yml`.
- Expose port 3000 to access the application.

### 3. Access the Application

- Open your web browser and go to [http://localhost:3000](http://localhost:3000).
- You should see your application's interface.

By following these steps, you can run your streaming application within Docker containers, leveraging the power of Docker for an isolated and scalable environment.

A special thanks to Piyush Garg Sir, for providing the basic understanding.
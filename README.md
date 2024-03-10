# MoodBuzz Web App

This API was developed as part of the CSC7082 Web Development Module at Queens University Belfast.
It is a requirement for the MoodBuzz-Node Repo and handles all CRUD processes on behalf of the web app.

URL for locally hosted server: http://localhost:3001

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Installation](#installation)
3. [Configuration](#configuration)
4. [Usage](#usage)
5. [Features](#features)

## Prerequisites

- Node JS
- Node Package Manager (NPM)

## Installation

```bash
# Clone the repository
git clone https://github.com/GerardGargan/MoodBuzz-API.git

# Navigate to the project directory
cd MoodBuzz-API

# Install dependencies
npm install
```

In the sql folder you will find sql code which you can use to set up the database tables

## Configuration

1. Create a new file named config.env in the root directory of the project
2. Add the following code to config.env:

```plaintext
PORT = 3001

DB_HOST = your_database_host
DB_USER = your_database_user
DB_PASS = your_database_password
DB_NAME = your_database_name
DB_PORT = your_database_port
```
Change the port to suit your requirements, it must also be updated in any of the web app's requests to the API


## Usage

```bash
npm start
```

## Features
- CRUD processes for the MoodBuzz web app
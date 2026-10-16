pipeline {
  agent any

  environment {
    BACKEND_IMAGE  = 'techstore-api'
    FRONTEND_IMAGE = 'techstore-web'
    VITE_API_URL   = 'http://127.0.0.1:4000/api'

    DOCKER_BIN  = 'C:\\Users\\Quoc\\AppData\\Local\\Programs\\DockerDesktop\\resources\\bin\\docker.exe'
    COMPOSE_BIN = 'C:\\Users\\Quoc\\.docker\\cli-plugins\\docker-compose.exe'
  }

  options {
    timestamps()
    disableConcurrentBuilds()
    buildDiscarder(logRotator(numToKeepStr: '10'))
  }

  stages {
    stage('Checkout') {
      steps {
        checkout scm
        bat 'git rev-parse --short HEAD'
      }
    }

    stage('Diagnose Docker') {
      steps {
        bat '''
          whoami
          "%DOCKER_BIN%" --version
          "%DOCKER_BIN%" info
          if errorlevel 1 exit /b 1

          if not exist "%COMPOSE_BIN%" (
            echo ERROR: Docker Compose executable not found.
            exit /b 1
          )

          "%COMPOSE_BIN%" version
          if errorlevel 1 exit /b 1
        '''
      }
    }

    stage('Docker Build API') {
      steps {
        dir('backend') {
          bat '''
            "%DOCKER_BIN%" build -t %BACKEND_IMAGE%:%BUILD_NUMBER% -t %BACKEND_IMAGE%:latest .
            if errorlevel 1 exit /b 1
          '''
        }
      }
    }

    stage('Docker Build Web') {
      steps {
        bat '''
          "%DOCKER_BIN%" build --build-arg VITE_API_URL=%VITE_API_URL% -t %FRONTEND_IMAGE%:%BUILD_NUMBER% -t %FRONTEND_IMAGE%:latest .
          if errorlevel 1 exit /b 1
        '''
      }
    }

    stage('Deploy') {
      steps {
        bat '''
          "%COMPOSE_BIN%" config
          if errorlevel 1 exit /b 1

          "%COMPOSE_BIN%" down
          if errorlevel 1 exit /b 1

          "%COMPOSE_BIN%" up -d --build
          if errorlevel 1 exit /b 1

          timeout /t 10 /nobreak >nul

          "%DOCKER_BIN%" ps

          curl.exe -fsS --retry 5 --retry-delay 2 --retry-connrefused http://127.0.0.1:4000/api/health
          if errorlevel 1 exit /b 1

          echo.
          echo API health check passed.
          echo Web URL: http://127.0.0.1:8080
        '''
      }
    }
  }

  post {
    success {
      echo "SUCCESS #${BUILD_NUMBER}"
    }
    failure {
      echo "FAILED #${BUILD_NUMBER}"
    }
  }
}
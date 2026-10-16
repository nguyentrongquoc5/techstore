pipeline {
  agent any

  environment {
    BACKEND_IMAGE  = 'techstore-api'
    FRONTEND_IMAGE = 'techstore-web'
    VITE_API_URL   = 'http://127.0.0.1:4000/api'
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

    stage('Docker Build API') {
      steps {
        dir('backend') {
          bat 'docker build -t %BACKEND_IMAGE%:%BUILD_NUMBER% -t %BACKEND_IMAGE%:latest .'
        }
      }
    }

    stage('Docker Build Web') {
      steps {
        bat 'docker build --build-arg VITE_API_URL=%VITE_API_URL% -t %FRONTEND_IMAGE%:%BUILD_NUMBER% -t %FRONTEND_IMAGE%:latest .'
      }
    }

    stage('Deploy') {
      steps {
        bat '''
          docker compose down
          docker compose up -d --build
          ping -n 12 127.0.0.1 >nul
          curl -sf http://127.0.0.1:4000/api/health
          echo.
          echo OK - Web http://127.0.0.1:8080
        '''
      }
    }
  }

  post {
    success { echo "SUCCESS #${BUILD_NUMBER}" }
    failure { echo "FAILED #${BUILD_NUMBER}" }
  }
}
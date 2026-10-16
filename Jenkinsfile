pipeline {
  agent any

  environment {
    BACKEND_IMAGE  = 'techstore-api'
    FRONTEND_IMAGE = 'techstore-web'
    VITE_API_URL   = "${VITE_API_URL ?: 'http://127.0.0.1:4000/api'}"
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
        bat 'echo Commit && git rev-parse --short HEAD && dir'
      }
    }

    stage('Backend - Dependencies') {
      steps {
        dir('backend') {
          bat '''
            npm ci || npm install
            npx prisma generate
            npx prisma validate
          '''
        }
      }
    }

    stage('Frontend - Build check') {
      steps {
        bat '''
          npm ci || npm install
          npm run build
        '''
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

    stage('Deploy - Docker Compose') {
      steps {
        bat '''
          docker compose down || exit 0
          docker compose up -d --build
          ping -n 10 127.0.0.1 >nul
          curl -sf http://127.0.0.1:4000/api/health
          echo.
          echo Deploy done. Web: http://127.0.0.1:8080  API: http://127.0.0.1:4000/api/health
        '''
      }
    }
  }

  post {
    success {
      echo "SUCCESS build #${BUILD_NUMBER}"
    }
    failure {
      echo "FAILED build #${BUILD_NUMBER}"
    }
  }
}
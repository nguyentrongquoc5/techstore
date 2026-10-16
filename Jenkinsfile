pipeline {
  agent any

  environment {
    BACKEND_IMAGE  = 'techstore-api'
    FRONTEND_IMAGE = 'techstore-web'
    // URL API khi build frontend (đổi theo IP máy deploy)
    // Có thể set trong Jenkins Job → Environment variables
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
        sh 'echo "Commit: $(git rev-parse --short HEAD)" && ls -la'
      }
    }

    stage('Backend - Dependencies') {
      steps {
        dir('backend') {
          sh '''
            set -e
            npm ci || npm install
            npx prisma generate
            npx prisma validate
          '''
        }
      }
    }

    stage('Frontend - Build check') {
      steps {
        sh '''
          set -e
          npm ci || npm install
          npm run build
        '''
      }
    }

    stage('Docker Build API') {
      steps {
        dir('backend') {
          sh '''
            set -e
            docker build -t ${BACKEND_IMAGE}:${BUILD_NUMBER} -t ${BACKEND_IMAGE}:latest .
          '''
        }
      }
    }

    stage('Docker Build Web') {
      steps {
        sh '''
          set -e
          docker build \
            --build-arg VITE_API_URL=${VITE_API_URL} \
            -t ${FRONTEND_IMAGE}:${BUILD_NUMBER} \
            -t ${FRONTEND_IMAGE}:latest \
            .
        '''
      }
    }

    stage('Deploy - Docker Compose') {
      steps {
        sh '''
          set -e
          docker compose down || true
          docker compose up -d --build
          echo "Waiting for API..."
          sleep 8
          curl -sf http://127.0.0.1:4000/api/health || curl -sf http://localhost:4000/api/health
          echo ""
          echo "Deploy done. Web: http://127.0.0.1:8080  API: http://127.0.0.1:4000/api/health"
        '''
      }
    }
  }

  post {
    success {
      echo "SUCCESS build #${BUILD_NUMBER}"
    }
    failure {
      echo "FAILED build #${BUILD_NUMBER} — mở Console Output xem stage đỏ"
    }
  }
}

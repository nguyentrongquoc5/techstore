```groovy
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

                bat '''
                    echo ===== CHECKOUT =====
                    git rev-parse --short HEAD
                    git status --short
                '''
            }
        }

        stage('Diagnose Docker') {
            steps {
                bat '''
                    echo ===== WINDOWS USER =====
                    whoami

                    echo ===== DOCKER VERSION =====
                    "%DOCKER_BIN%" --version
                    if errorlevel 1 exit /b 1

                    echo ===== DOCKER ENGINE =====
                    "%DOCKER_BIN%" info
                    if errorlevel 1 exit /b 1

                    echo ===== CHECK COMPOSE =====
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
                        echo ===== BUILD BACKEND API =====

                        "%DOCKER_BIN%" build ^
                            -t %BACKEND_IMAGE%:%BUILD_NUMBER% ^
                            -t %BACKEND_IMAGE%:latest .

                        if errorlevel 1 exit /b 1
                    '''
                }
            }
        }

        stage('Docker Build Web') {
            steps {
                bat '''
                    echo ===== BUILD FRONTEND =====

                    "%DOCKER_BIN%" build ^
                        --build-arg VITE_API_URL=%VITE_API_URL% ^
                        -t %FRONTEND_IMAGE%:%BUILD_NUMBER% ^
                        -t %FRONTEND_IMAGE%:latest .

                    if errorlevel 1 exit /b 1
                '''
            }
        }

        stage('Validate Compose') {
            steps {
                bat '''
                    echo ===== VALIDATE DOCKER COMPOSE =====

                    "%COMPOSE_BIN%" config
                    if errorlevel 1 exit /b 1
                '''
            }
        }

        stage('Deploy') {
            steps {
                bat '''
                    echo ===== DEPLOY CONTAINERS =====

                    "%COMPOSE_BIN%" up -d --build
                    if errorlevel 1 exit /b 1

                    echo ===== WAIT FOR APPLICATION STARTUP =====

                    powershell -NoProfile -Command "Start-Sleep -Seconds 10"
                    if errorlevel 1 exit /b 1

                    echo ===== RUNNING CONTAINERS =====

                    "%DOCKER_BIN%" ps
                    if errorlevel 1 exit /b 1

                    echo ===== CHECK BACKEND HEALTH =====

                    curl.exe -fsS ^
                        --retry 10 ^
                        --retry-delay 3 ^
                        --retry-connrefused ^
                        http://127.0.0.1:4000/api/health

                    if errorlevel 1 (
                        echo ERROR: Backend health check failed.
                        "%DOCKER_BIN%" logs --tail 100 techstore-api-1
                        exit /b 1
                    )

                    echo.
                    echo Backend health check passed.

                    echo ===== CHECK FRONTEND =====

                    curl.exe -fsS ^
                        --retry 5 ^
                        --retry-delay 2 ^
                        --retry-connrefused ^
                        -I http://127.0.0.1:8080

                    if errorlevel 1 (
                        echo ERROR: Frontend health check failed.
                        "%DOCKER_BIN%" logs --tail 100 techstore-web-1
                        exit /b 1
                    )

                    echo.
                    echo Frontend health check passed.
                    echo.
                    echo ===== DEPLOYMENT COMPLETED =====
                    echo Frontend: http://localhost:8080
                    echo API:      http://localhost:4000
                    echo Health:   http://localhost:4000/api/health
                '''
            }
        }
    }

    post {
        success {
            echo """
            ========================================
            DEPLOYMENT SUCCESSFUL
            Build: ${BUILD_NUMBER}
            Frontend: http://localhost:8080
            API: http://localhost:4000
            ========================================
            """
        }

        failure {
            echo """
            ========================================
            DEPLOYMENT FAILED
            Build: ${BUILD_NUMBER}
            Please check the Console Output.
            ========================================
            """
        }

        always {
            echo "Jenkins build #${BUILD_NUMBER} finished."
        }
    }
}
```
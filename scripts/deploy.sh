#!/bin/bash
set -euo pipefail

# ══════════════════════════════════════════════════════════════════════════════
# HVAC Pro — AWS Full-Stack Deployment Script
# Architecture: CloudFront + S3 (frontend) + ECS Fargate (backend)
# ══════════════════════════════════════════════════════════════════════════════

# ── Configuration ───────────────────────────────────────────────────────────
APP_NAME="hvac-pro"
AWS_REGION="us-east-2"
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
ECR_REPO="${APP_NAME}-backend"
ECS_CLUSTER="${APP_NAME}-cluster"
ECS_SERVICE="${APP_NAME}-service"
ECS_TASK="${APP_NAME}-task"
S3_FRONTEND_BUCKET="${APP_NAME}-frontend-${AWS_ACCOUNT_ID}"
CLOUDFRONT_COMMENT="HVAC Pro CDN"
IMAGE_TAG="latest"

echo "═══════════════════════════════════════════════════════════════"
echo "  HVAC Pro — AWS Deployment"
echo "  Account: ${AWS_ACCOUNT_ID}"
echo "  Region:  ${AWS_REGION}"
echo "═══════════════════════════════════════════════════════════════"

# ── Step 1: Create ECR Repository ───────────────────────────────────────────
echo ""
echo "▶ Step 1: Creating ECR repository..."
aws ecr describe-repositories --repository-names ${ECR_REPO} --region ${AWS_REGION} 2>/dev/null || \
  aws ecr create-repository \
    --repository-name ${ECR_REPO} \
    --region ${AWS_REGION} \
    --image-scanning-configuration scanOnPush=true

ECR_URI="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${ECR_REPO}"
echo "  ✓ ECR: ${ECR_URI}"

# ── Step 2: Build & Push Docker Image ──────────────────────────────────────
echo ""
echo "▶ Step 2: Building and pushing Docker image..."
aws ecr get-login-password --region ${AWS_REGION} | \
  docker login --username AWS --password-stdin ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com

docker build --platform linux/amd64 -t ${ECR_REPO}:${IMAGE_TAG} .
docker tag ${ECR_REPO}:${IMAGE_TAG} ${ECR_URI}:${IMAGE_TAG}
docker push ${ECR_URI}:${IMAGE_TAG}
echo "  ✓ Image pushed: ${ECR_URI}:${IMAGE_TAG}"

# ── Step 3: Create ECS Cluster ─────────────────────────────────────────────
echo ""
echo "▶ Step 3: Creating ECS Fargate cluster..."
aws ecs describe-clusters --clusters ${ECS_CLUSTER} --region ${AWS_REGION} \
  --query 'clusters[0].status' --output text 2>/dev/null | grep -q ACTIVE || \
  aws ecs create-cluster \
    --cluster-name ${ECS_CLUSTER} \
    --region ${AWS_REGION} \
    --capacity-providers FARGATE \
    --default-capacity-provider-strategy capacityProvider=FARGATE,weight=1
echo "  ✓ Cluster: ${ECS_CLUSTER}"

# ── Step 4: Create IAM Role for ECS Task ───────────────────────────────────
echo ""
echo "▶ Step 4: Setting up IAM roles..."
TASK_ROLE_NAME="${APP_NAME}-task-role"
EXEC_ROLE_NAME="${APP_NAME}-exec-role"

# Task execution role (for ECR pull + CloudWatch)
aws iam get-role --role-name ${EXEC_ROLE_NAME} 2>/dev/null || \
  aws iam create-role \
    --role-name ${EXEC_ROLE_NAME} \
    --assume-role-policy-document '{
      "Version": "2012-10-17",
      "Statement": [{"Effect": "Allow", "Principal": {"Service": "ecs-tasks.amazonaws.com"}, "Action": "sts:AssumeRole"}]
    }'
aws iam attach-role-policy --role-name ${EXEC_ROLE_NAME} \
  --policy-arn arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy 2>/dev/null || true

# Task role (for S3 access)
aws iam get-role --role-name ${TASK_ROLE_NAME} 2>/dev/null || \
  aws iam create-role \
    --role-name ${TASK_ROLE_NAME} \
    --assume-role-policy-document '{
      "Version": "2012-10-17",
      "Statement": [{"Effect": "Allow", "Principal": {"Service": "ecs-tasks.amazonaws.com"}, "Action": "sts:AssumeRole"}]
    }'

# Inline S3 policy for the task role
aws iam put-role-policy --role-name ${TASK_ROLE_NAME} \
  --policy-name "${APP_NAME}-s3-access" \
  --policy-document '{
    "Version": "2012-10-17",
    "Statement": [{
      "Effect": "Allow",
      "Action": ["s3:GetObject", "s3:PutObject", "s3:DeleteObject", "s3:ListBucket"],
      "Resource": ["arn:aws:s3:::hvac-pro-jobs-ashish", "arn:aws:s3:::hvac-pro-jobs-ashish/*"]
    }]
  }'
echo "  ✓ IAM roles configured"

# ── Step 5: Create CloudWatch Log Group ────────────────────────────────────
echo ""
echo "▶ Step 5: Creating CloudWatch log group..."
aws logs create-log-group --log-group-name "/ecs/${APP_NAME}" --region ${AWS_REGION} 2>/dev/null || true
echo "  ✓ Log group: /ecs/${APP_NAME}"

# ── Step 6: Register ECS Task Definition ──────────────────────────────────
echo ""
echo "▶ Step 6: Registering ECS task definition..."
EXEC_ROLE_ARN="arn:aws:iam::${AWS_ACCOUNT_ID}:role/${EXEC_ROLE_NAME}"
TASK_ROLE_ARN="arn:aws:iam::${AWS_ACCOUNT_ID}:role/${TASK_ROLE_NAME}"

cat > /tmp/task-def.json <<EOF
{
  "family": "${ECS_TASK}",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "512",
  "memory": "1024",
  "executionRoleArn": "${EXEC_ROLE_ARN}",
  "taskRoleArn": "${TASK_ROLE_ARN}",
  "containerDefinitions": [{
    "name": "${APP_NAME}",
    "image": "${ECR_URI}:${IMAGE_TAG}",
    "essential": true,
    "portMappings": [{"containerPort": 3001, "protocol": "tcp"}],
    "environment": [
      {"name": "NODE_ENV", "value": "production"},
      {"name": "AWS_REGION", "value": "${AWS_REGION}"},
      {"name": "AWS_S3_BUCKET", "value": "hvac-pro-jobs-ashish"}
    ],
    "secrets": [],
    "logConfiguration": {
      "logDriver": "awslogs",
      "options": {
        "awslogs-group": "/ecs/${APP_NAME}",
        "awslogs-region": "${AWS_REGION}",
        "awslogs-stream-prefix": "ecs"
      }
    },
    "healthCheck": {
      "command": ["CMD-SHELL", "wget -qO- http://localhost:3001/api/health || exit 1"],
      "interval": 30,
      "timeout": 5,
      "retries": 3,
      "startPeriod": 10
    }
  }]
}
EOF

aws ecs register-task-definition --cli-input-json file:///tmp/task-def.json --region ${AWS_REGION}
echo "  ✓ Task definition: ${ECS_TASK}"

# ── Step 7: Create VPC / Networking (if needed) ────────────────────────────
echo ""
echo "▶ Step 7: Getting default VPC networking..."
DEFAULT_VPC=$(aws ec2 describe-vpcs --filters "Name=isDefault,Values=true" \
  --query 'Vpcs[0].VpcId' --output text --region ${AWS_REGION})

SUBNETS=$(aws ec2 describe-subnets --filters "Name=vpc-id,Values=${DEFAULT_VPC}" \
  --query 'Subnets[*].SubnetId' --output text --region ${AWS_REGION} | tr '\t' ',')

# Create security group
SG_NAME="${APP_NAME}-ecs-sg"
SG_ID=$(aws ec2 describe-security-groups \
  --filters "Name=group-name,Values=${SG_NAME}" "Name=vpc-id,Values=${DEFAULT_VPC}" \
  --query 'SecurityGroups[0].GroupId' --output text --region ${AWS_REGION} 2>/dev/null)

if [ "${SG_ID}" = "None" ] || [ -z "${SG_ID}" ]; then
  SG_ID=$(aws ec2 create-security-group \
    --group-name ${SG_NAME} \
    --description "HVAC Pro ECS Fargate" \
    --vpc-id ${DEFAULT_VPC} \
    --query 'GroupId' --output text --region ${AWS_REGION})
  aws ec2 authorize-security-group-ingress --group-id ${SG_ID} \
    --protocol tcp --port 3001 --cidr 0.0.0.0/0 --region ${AWS_REGION}
fi
echo "  ✓ VPC: ${DEFAULT_VPC} | SG: ${SG_ID}"

# ── Step 8: Create/Update ECS Service ─────────────────────────────────────
echo ""
echo "▶ Step 8: Creating ECS Fargate service..."
EXISTING=$(aws ecs describe-services --cluster ${ECS_CLUSTER} --services ${ECS_SERVICE} \
  --query 'services[0].status' --output text --region ${AWS_REGION} 2>/dev/null)

if [ "${EXISTING}" = "ACTIVE" ]; then
  aws ecs update-service \
    --cluster ${ECS_CLUSTER} \
    --service ${ECS_SERVICE} \
    --task-definition ${ECS_TASK} \
    --force-new-deployment \
    --region ${AWS_REGION} > /dev/null
  echo "  ✓ Service updated with new deployment"
else
  SUBNET_ARR=$(echo ${SUBNETS} | sed 's/,/","/g')
  aws ecs create-service \
    --cluster ${ECS_CLUSTER} \
    --service-name ${ECS_SERVICE} \
    --task-definition ${ECS_TASK} \
    --desired-count 1 \
    --launch-type FARGATE \
    --network-configuration "awsvpcConfiguration={subnets=[\"${SUBNET_ARR}\"],securityGroups=[\"${SG_ID}\"],assignPublicIp=ENABLED}" \
    --region ${AWS_REGION} > /dev/null
  echo "  ✓ Service created: ${ECS_SERVICE}"
fi

# ── Step 9: Create S3 Bucket for Frontend (optional — static hosting) ─────
echo ""
echo "▶ Step 9: Setting up S3 frontend bucket..."
aws s3 mb s3://${S3_FRONTEND_BUCKET} --region ${AWS_REGION} 2>/dev/null || true
aws s3 sync dist/ s3://${S3_FRONTEND_BUCKET}/ --delete --cache-control "max-age=31536000,public"
aws s3 cp dist/index.html s3://${S3_FRONTEND_BUCKET}/index.html --cache-control "no-cache"
echo "  ✓ Frontend deployed to S3: ${S3_FRONTEND_BUCKET}"

# ── Step 10: Print Summary ─────────────────────────────────────────────────
echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "  ✅ Deployment Complete!"
echo "═══════════════════════════════════════════════════════════════"
echo ""
echo "  Backend (ECS Fargate):"
echo "    Cluster:  ${ECS_CLUSTER}"
echo "    Service:  ${ECS_SERVICE}"
echo "    Image:    ${ECR_URI}:${IMAGE_TAG}"
echo ""
echo "  Frontend (S3):"
echo "    Bucket:   ${S3_FRONTEND_BUCKET}"
echo ""
echo "  ⚠  NEXT STEPS:"
echo "    1. Add ANTHROPIC_API_KEY as an environment variable in the ECS Task Definition"
echo "       (use AWS Secrets Manager for production)"
echo "    2. Get the ECS task public IP:"
echo "       aws ecs list-tasks --cluster ${ECS_CLUSTER} --service ${ECS_SERVICE} --region ${AWS_REGION}"
echo "       aws ecs describe-tasks --cluster ${ECS_CLUSTER} --tasks <TASK_ARN> --region ${AWS_REGION}"
echo "    3. Create CloudFront distribution pointing to S3 + ECS (ALB)"
echo "    4. Set up a custom domain with Route 53 + ACM certificate"
echo ""

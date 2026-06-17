variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Deployment environment"
  type        = string
  validation {
    condition     = contains(["staging", "production"], var.environment)
    error_message = "Environment must be staging or production"
  }
}

variable "github_repo" {
  description = "GitHub repository name for image tags"
  type        = string
}

variable "api_cpu" {
  description = "API task CPU units"
  type        = string
  default     = "2048"
}

variable "api_memory" {
  description = "API task memory (MB)"
  type        = string
  default     = "4096"
}

variable "api_desired_count" {
  description = "Desired number of API tasks"
  type        = number
  default     = 2
}

variable "certificate_arn" {
  description = "ACM certificate ARN for HTTPS"
  type        = string
}

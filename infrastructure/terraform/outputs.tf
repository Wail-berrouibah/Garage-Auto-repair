output "ecs_cluster_name" {
  value = aws_ecs_cluster.main.name
}

output "api_lb_dns" {
  value = aws_lb.api.dns_name
}

output "api_task_definition_arn" {
  value = aws_ecs_task_definition.api.arn
}

output "cloudwatch_log_group" {
  value = aws_cloudwatch_log_group.api.name
}

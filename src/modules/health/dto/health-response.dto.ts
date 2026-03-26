import { ApiProperty } from '@nestjs/swagger';

class HealthIndicatorResult {
  @ApiProperty({
    description: 'Status of the service',
    example: 'up',
    enum: ['up', 'down'],
  })
  status: string;
}

class HealthCheckDetails {
  @ApiProperty({
    description: 'Redis health check result',
    type: HealthIndicatorResult,
  })
  redis?: HealthIndicatorResult;
}

export class HealthCheckResponseDto {
  @ApiProperty({
    description: 'Overall health status',
    example: 'ok',
    enum: ['ok', 'error'],
  })
  status: string;

  @ApiProperty({
    description: 'Details of health checks',
    type: HealthCheckDetails,
  })
  info?: HealthCheckDetails;

  @ApiProperty({
    description: 'Error details if any',
    type: HealthCheckDetails,
    required: false,
  })
  error?: HealthCheckDetails;

  @ApiProperty({
    description: 'All health check details',
    type: HealthCheckDetails,
  })
  details: HealthCheckDetails;
}
